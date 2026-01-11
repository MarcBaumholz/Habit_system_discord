from __future__ import annotations

import asyncio
from collections.abc import Iterator
from contextlib import contextmanager
from datetime import datetime
from typing import TypeVar

from pydantic_graph import BaseNode, Graph

from chatbot.agents.chat_agent.state import ChatAgentDependencies
from chatbot.agents.post_creation_agent.state import PostCreationAgentDependencies
from chatbot.agents.shared.graph_event_streamer import ChatAgentEvent, ErrorEvent, GraphEventStreamer, PostCreationAgentEvent
from chatbot.agents.shared.state import AgentGraphDependencies
from chatbot.api.error_handlers import handle_stream_setup_error
from chatbot.app_services import AppServices
from chatbot.pydantic_models import CompanyInfoData
from chatbot.util.auth import FlipBearerAuth
from chatbot.util.timing_metrics import (
    ChatAgentTiming,
    PostCreationAgentTiming,
    create_chat_agent_timing,
    create_post_creation_agent_timing,
)
from chatbot.util.usage_metrics import (
    ChatAgentUsageMetrics,
    PostCreationAgentUsageMetrics,
    create_chat_agent_usage_metrics,
    create_post_creation_agent_usage_metrics,
)

S = TypeVar("S")
D = TypeVar("D", bound=AgentGraphDependencies)


@contextmanager
def chat_metrics() -> Iterator[tuple[ChatAgentTiming, ChatAgentUsageMetrics]]:
    timing = create_chat_agent_timing()
    timing.start_total_timing()
    usage = create_chat_agent_usage_metrics()
    try:
        yield timing, usage
    finally:
        timing.finalize()
        usage.finalize()


@contextmanager
def post_metrics() -> Iterator[tuple[PostCreationAgentTiming, PostCreationAgentUsageMetrics]]:
    timing = create_post_creation_agent_timing()
    timing.start_total_timing()
    usage = create_post_creation_agent_usage_metrics()
    try:
        yield timing, usage
    finally:
        timing.finalize()
        usage.finalize()


async def build_chat_deps(
    services: AppServices,
    *,
    company_info: CompanyInfoData,
    auth: FlipBearerAuth,
    timing_metrics: ChatAgentTiming,
    usage_metrics: ChatAgentUsageMetrics,
    event_streamer: GraphEventStreamer[ChatAgentEvent],
    current_datetime: datetime | None = None,
) -> ChatAgentDependencies:
    return ChatAgentDependencies(
        company_info=company_info,
        auth=auth,
        timing_metrics=timing_metrics,
        usage_metrics=usage_metrics,
        event_streamer=event_streamer,
        app_services=services,
        current_datetime=current_datetime or datetime.now(),
    )


def build_post_creation_deps(
    services: AppServices,
    *,
    company_info: CompanyInfoData,
    auth: FlipBearerAuth,
    timing_metrics: PostCreationAgentTiming,
    usage_metrics: PostCreationAgentUsageMetrics,
    event_streamer: GraphEventStreamer[PostCreationAgentEvent],
    current_datetime: datetime | None = None,
) -> PostCreationAgentDependencies:
    return PostCreationAgentDependencies(
        company_info=company_info,
        auth=auth,
        timing_metrics=timing_metrics,
        usage_metrics=usage_metrics,
        event_streamer=event_streamer,
        app_services=services,
        current_datetime=current_datetime or datetime.now(),
    )


async def run_graph_with_stream(
    graph: Graph[S, D],
    *,
    start_node: BaseNode[S, D, None],
    state: S,
    deps: D,
) -> asyncio.Task[None]:
    async def runner() -> None:
        try:
            await graph.run(start_node, state=state, deps=deps)
        except Exception as e:
            error_str = await handle_stream_setup_error(e)
            deps.event_streamer.emit_json(ErrorEvent(error=error_str))
        finally:
            await deps.event_streamer.close()

    return asyncio.create_task(runner())
