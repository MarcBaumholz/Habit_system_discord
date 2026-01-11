import asyncio
import logging
from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager
from dataclasses import asdict
from datetime import datetime
from typing import Any

import logfire
import uvicorn
from fastapi import FastAPI, HTTPException, Request, Security, status
from fastapi.responses import StreamingResponse
from fastapi.security import APIKeyHeader
from prometheus_client import CONTENT_TYPE_LATEST, REGISTRY, generate_latest
from pydantic import BaseModel, root_validator
from pydantic_graph import Graph
from starlette.responses import PlainTextResponse, Response

from chatbot.agents.chat_agent.agent import QueryValidationNode
from chatbot.agents.chat_agent.state import ChatAgentDependencies, ChatAgentState
from chatbot.agents.post_creation_agent.agent import ProcessMessageNode
from chatbot.agents.post_creation_agent.state import PostCreationAgentDependencies, PostCreationAgentState
from chatbot.agents.post_creation_agent.structured_outputs import Post
from chatbot.agents.retrieval_agent.state import RetrievalAgentState
from chatbot.agents.retrieval_agent.subagent import RetrievalSubAgent
from chatbot.agents.shared.ai_models import ModelType
from chatbot.agents.shared.graph_event_streamer import ChatAgentEvent, ErrorEvent, GraphEventStreamer, PostCreationAgentEvent
from chatbot.agents.shared.nodes import get_chat_title
from chatbot.api.error_handlers import handle_stream_setup_error, register_exception_handlers
from chatbot.api.handlers import build_chat_deps, build_post_creation_deps, chat_metrics, post_metrics, run_graph_with_stream
from chatbot.app_services import AppServices
from chatbot.config import get_settings
from chatbot.openapi.generated.routers import ask_ai, user_groups
from chatbot.util.auth import get_flip_api_auth
from chatbot.util.configure_logging import init_logging
from chatbot.util.observability import init_opentelemetry
from chatbot.utils import prepare_agent_inputs

_logger = logging.getLogger(__name__)

API_KEY_HEADER = APIKeyHeader(name="x-api-key")
settings = get_settings()


class ChatRequest(BaseModel):
    query: str
    chat_history: list[dict[str, Any]]
    debug: bool = False
    current_datetime: str | None = None  # Only used during eval to fake the current datetime


class PostCreationRequest(BaseModel):
    query: str
    chat_history: list[dict[str, Any]]
    debug: bool = False
    post: Post | None = None
    current_datetime: str | None = None

    @root_validator(pre=True)
    def normalize_post_body(cls, values: dict[str, Any]) -> dict[str, Any]:
        post = values.get("post")
        if post and isinstance(post, dict):
            if "content" in post and "body" not in post:
                post["body"] = post.pop("content")
            values["post"] = post
        return values


class TitleRequest(BaseModel):
    chat_history: list[dict[str, Any]]


@asynccontextmanager
async def lifespan(_app: FastAPI) -> AsyncGenerator[dict[str, Any]]:
    try:
        services = AppServices(settings)
        await services.start()
        _logger.info("Chatbot service initialized successfully")
    except Exception as e:
        _logger.error(f"Critical error during startup: {str(e)}", exc_info=True)
        raise

    yield {"app_services": services}

    await services.stop()
    _logger.info("Chatbot service shutting down")


init_logging(settings)
init_opentelemetry(settings)
app = FastAPI(title="RAG Chatbot Combined Service", lifespan=lifespan)
register_exception_handlers(app)
logfire.instrument_fastapi(app)

app.include_router(ask_ai.router)
app.include_router(user_groups.router)


@app.get("/chatbot/health")
async def health_check(request: Request, api_key: str = Security(API_KEY_HEADER)) -> dict[str, Any]:
    if api_key != settings.auth_api_key:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid API Key")
    return {"status": "healthy", "services": ["retrieval_agent", "chat_agent", "post_creation_agent"]}


@app.post("/chatbot/generator/chat_stream/")
async def chat_stream(request_body: ChatRequest, request: Request, api_key: str = Security(API_KEY_HEADER)) -> StreamingResponse:
    app_services: AppServices = request.state.app_services

    flip_api_auth = get_flip_api_auth(request)

    async def stream_generator() -> AsyncGenerator[str]:
        try:
            company_info, messages = await prepare_agent_inputs(
                chat_history=request_body.chat_history,
                config=app_services.settings,
                async_client=app_services.http_client,
                tenant=flip_api_auth.tenant,
                query=request_body.query,
            )

            state = ChatAgentState(
                query=request_body.query,
                messages=messages,
            )

            with chat_metrics() as (timing_metrics, usage_metrics):
                event_streamer: GraphEventStreamer[ChatAgentEvent] = GraphEventStreamer(debug=request_body.debug)

                current_datetime = None
                if request_body.debug and request_body.current_datetime:
                    current_datetime = datetime.fromisoformat(request_body.current_datetime)

                dependencies = await build_chat_deps(
                    app_services,
                    company_info=company_info,
                    auth=flip_api_auth,
                    timing_metrics=timing_metrics,
                    usage_metrics=usage_metrics,
                    event_streamer=event_streamer,
                    current_datetime=current_datetime,
                )

                graph: Graph[ChatAgentState, ChatAgentDependencies] = app_services.chatbot_agent
                task = await run_graph_with_stream(
                    graph,
                    start_node=QueryValidationNode(),
                    state=state,
                    deps=dependencies,
                )

                try:
                    async for output in event_streamer:
                        yield output
                finally:
                    if not task.done():
                        task.cancel()
                        try:
                            await task
                        except asyncio.CancelledError:
                            pass
        except Exception as e:
            error_response = await handle_stream_setup_error(e)
            yield ErrorEvent(error=error_response).model_dump_json(exclude={"event"}) + "\n"

    return StreamingResponse(stream_generator(), media_type="application/x-json-stream")


@app.post("/chatbot/generator/post_creation/")
async def post_creation(request_body: PostCreationRequest, request: Request, api_key: str = Security(API_KEY_HEADER)) -> dict[str, Any]:
    app_services: AppServices = request.state.app_services
    flip_api_auth = get_flip_api_auth(request)
    company_info, messages = await prepare_agent_inputs(
        chat_history=request_body.chat_history,
        config=app_services.settings,
        async_client=app_services.http_client,
        tenant=flip_api_auth.tenant,
        query=request_body.query,
    )

    state_kwargs: dict[str, Any] = {
        "query": request_body.query,
        "messages": messages,
    }
    if request_body.post:
        state_kwargs["post"] = request_body.post

    state = PostCreationAgentState(**state_kwargs)

    with post_metrics() as (timing_metrics, usage_metrics):
        event_streamer: GraphEventStreamer[PostCreationAgentEvent] = GraphEventStreamer(debug=request_body.debug)

        current_datetime = None
        if request_body.debug and request_body.current_datetime:
            current_datetime = datetime.fromisoformat(request_body.current_datetime)

        dependencies = build_post_creation_deps(
            app_services,
            company_info=company_info,
            auth=flip_api_auth,
            timing_metrics=timing_metrics,
            usage_metrics=usage_metrics,
            event_streamer=event_streamer,
            current_datetime=current_datetime,
        )

        graph: Graph[PostCreationAgentState, PostCreationAgentDependencies] = app_services.post_creation_agent
        graph_run = await graph.run(ProcessMessageNode(), state=state, deps=dependencies)

    output = graph_run.state

    # LEGACY CONVERT POST TO OLD POST FORMAT
    if output.post:
        output_post = {
            "title": output.post.title,
            "content": output.post.body,
        }
    else:
        output_post = None

    result: dict[str, Any] = {
        "answer": output.answer,
        "post": output_post,
    }

    if output.refined_context:
        result["refined_context"] = output.refined_context

    if request_body.debug:
        retrieval_agent_states: list[RetrievalAgentState] = output.sub_agent_execution_results.for_agent(RetrievalSubAgent)

        if retrieval_agent_states:
            states_to_yield = []
            for s in retrieval_agent_states:
                s_dict = asdict(s)
                s_dict["seen_documents"] = list(s_dict["seen_documents"])
                states_to_yield.append(s_dict)
            result["retrieval_agent_states"] = states_to_yield
        else:
            result["retrieval_agent_states"] = []
    if output.tool_calls:
        result["tool_calls"] = output.tool_calls

    return result


@app.post("/chatbot/generator/get_title/", response_class=PlainTextResponse)
async def get_title(request_body: TitleRequest, request: Request, api_key: str = Security(API_KEY_HEADER)) -> str:
    app_services: AppServices = request.state.app_services
    llm = app_services.models[ModelType.GPT_4_1_MINI]
    try:
        title = await get_chat_title(llm, request_body.chat_history)
    except Exception as e:
        _logger.warning(f"/get_title endpoint could not produce a valid title, error: {e!r}", exc_info=True)
        title = "AI Chat"
    return title


@app.get("/metrics")
async def metrics(_: Request) -> Response:
    latest = generate_latest(REGISTRY)
    return Response(latest, headers={"Content-Type": CONTENT_TYPE_LATEST})


@app.get("/health")
async def health(_: Request) -> dict[str, str]:
    return {"status": "up"}


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8004, log_config=None, log_level=None)
