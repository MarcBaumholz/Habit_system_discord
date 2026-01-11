"""
This file contains the logic for the chat agent, which is responsible for handling user queries and generating responses.
The agent is implemented as a graph of nodes using the pydantic-graph library, with each node representing a step in the conversation flow.
"""

import asyncio
import logging
import time
from dataclasses import dataclass
from datetime import UTC, datetime

from pydantic_ai import Agent, FunctionToolset, NativeOutput, RunContext
from pydantic_ai.agent import AgentRun, ModelRequestNode
from pydantic_ai.messages import (
    FinalResultEvent,
    ModelRequest,
    ModelResponse,
    SystemPromptPart,
)
from pydantic_ai.settings import ModelSettings
from pydantic_ai.tools import ToolDefinition
from pydantic_graph import BaseNode, End, Graph, GraphRunContext

import chatbot.agents.chat_agent.prompts as prompts
import chatbot.agents.chat_agent.structured_outputs as structured_outputs
from chatbot.agents.chat_agent.state import ChatAgentDependencies, ChatAgentState
from chatbot.agents.chat_agent.tools import create_chat_agent_tools
from chatbot.agents.shared.ai_models import ModelType
from chatbot.agents.shared.azure_content_filter import with_azure_content_filter_fallback
from chatbot.agents.shared.graph_event_streamer import Time2FirstTokenEvent, ToolCallsEvent
from chatbot.agents.shared.nodes import FilterUsedContextNode
from chatbot.agents.shared.retrieval_call_merger import merge_retrieval_agent_calls
from chatbot.agents.shared.subagent_registry import get_subagent_examples, get_subagent_prompt_references, get_subagent_toolset
from chatbot.agents.shared.tools.general_purpose_tools import create_general_purpose_tools
from chatbot.utils import chat_history_2_str, extract_tool_calls_from_message, get_message_from_node

_logger = logging.getLogger(__name__)


@dataclass
class QueryValidationNode(BaseNode[ChatAgentState, ChatAgentDependencies, None]):
    @with_azure_content_filter_fallback(lambda: RefuseAnswerNode(), "chat agent")
    async def run(self, ctx: GraphRunContext[ChatAgentState, ChatAgentDependencies]) -> "ProcessMessageNode | RefuseAnswerNode":
        refusal_result, language_result = await asyncio.gather(self._check_refusal(ctx), self._detect_language(ctx))
        ctx.state.detected_language = language_result
        if refusal_result.refuse_question:
            _logger.warning(f"Refused Query for reason: {refusal_result.reason}", extra={"query": ctx.state.query, "reason": refusal_result.reason})
            ctx.state.refusal_reason = refusal_result.reason
            return RefuseAnswerNode()
        else:
            return ProcessMessageNode()

    async def _check_refusal(self, ctx: GraphRunContext[ChatAgentState, ChatAgentDependencies]) -> structured_outputs.RefuseQuestion:
        refusal_prompt = prompts.refuse_question_prompt.render(
            company_info=ctx.deps.company_info,
            chat_history=chat_history_2_str(ctx.state.messages),
        )
        model = ctx.deps.app_services.models[ModelType.GPT_4_1_MINI]
        agent_name = "refusal_agent"
        agent = Agent(
            model,
            name=agent_name,
            system_prompt=refusal_prompt,
            output_type=NativeOutput(structured_outputs.RefuseQuestion),
            retries=3,
            model_settings=ModelSettings(temperature=ctx.deps.app_services.settings.chat_agent_llm_temp, max_tokens=128),
        )
        response = await agent.run()
        ctx.deps.usage_metrics.record_llm_call_usage(agent_name, model.model_name, response.usage())
        return response.output

    async def _detect_language(self, ctx: GraphRunContext[ChatAgentState, ChatAgentDependencies]) -> str:
        language_prompt = prompts.detect_language_prompt.render(chat_history=chat_history_2_str(ctx.state.messages))
        model = ctx.deps.app_services.models[ModelType.GPT_4_1_NANO]
        agent_name = "language_detection_agent"
        agent = Agent(
            model,
            name=agent_name,
            system_prompt=language_prompt,
            output_type=NativeOutput(structured_outputs.DetectLanguage),
            retries=3,
            model_settings=ModelSettings(temperature=ctx.deps.app_services.settings.chat_agent_llm_temp, max_tokens=8),
        )
        response = await agent.run()
        ctx.deps.usage_metrics.record_llm_call_usage(agent_name, model.model_name, response.usage())
        return response.output.language


@dataclass
class ProcessMessageNode(BaseNode[ChatAgentState, ChatAgentDependencies, None]):
    @with_azure_content_filter_fallback(lambda: RefuseAnswerNode(), "chat agent")
    async def run(self, ctx: GraphRunContext[ChatAgentState, ChatAgentDependencies]) -> "FilterUsedContextNode[ChatAgentState, ChatAgentDependencies] | End[ChatAgentState]":  # type: ignore[override]
        config = ctx.deps.app_services.settings

        subagent_toolset = get_subagent_toolset("chat_agent")
        subagent_references = get_subagent_prompt_references("chat_agent", ctx.deps)
        subagent_examples = get_subagent_examples("chat_agent", ctx.deps)
        chat_agent_toolset = create_chat_agent_tools(ctx)
        general_purpose_toolset: FunctionToolset[GraphRunContext[ChatAgentState, ChatAgentDependencies]] = create_general_purpose_tools()

        message_agent_system_prompt = prompts.message_agent_system_prompt.render(
            company_info=ctx.deps.company_info,
            detected_language=ctx.state.detected_language,
            subagent_references=subagent_references,
            subagent_examples=subagent_examples,
        )
        message_history = [ModelRequest(parts=[SystemPromptPart(content=message_agent_system_prompt)])] + ctx.state.messages

        async def prepare_tools_with_max_iterations_check(run_ctx: RunContext[GraphRunContext[ChatAgentState, ChatAgentDependencies]], tool_defs: list[ToolDefinition]) -> list[ToolDefinition] | None:
            if run_ctx.deps.state.iteration >= config.chat_max_iterations:
                _logger.warning("Maximum iterations reached in chat agent. Disabling tools to force text response.")
                return None
            return tool_defs

        model = ctx.deps.app_services.models[ModelType.GPT_4_1_BASE]
        agent_name = "message_agent"
        agent = Agent(
            model,
            name=agent_name,
            toolsets=[subagent_toolset, chat_agent_toolset, general_purpose_toolset],
            output_type=str,
            deps_type=GraphRunContext[ChatAgentState, ChatAgentDependencies],
            model_settings=ModelSettings(temperature=config.chat_agent_llm_temp, max_tokens=512),
            retries=3,
            prepare_tools=prepare_tools_with_max_iterations_check,
        )

        async with agent.iter(
            None,
            message_history=message_history,
            deps=ctx,
        ) as run:
            async for node in run:
                if Agent.is_model_request_node(node):
                    await self._handle_model_request_streaming(ctx, node, run)
                elif Agent.is_call_tools_node(node):
                    node = merge_retrieval_agent_calls(node)
                    ctx.state.iteration += 1

                message = get_message_from_node(node)
                if message:
                    ctx.state.add_message(message)
                    if isinstance(message, ModelResponse):
                        new_tool_calls = extract_tool_calls_from_message(message)
                        if new_tool_calls:
                            ctx.deps.event_streamer.emit_debug(ToolCallsEvent(tool_calls=new_tool_calls))

        ctx.deps.usage_metrics.record_llm_call_usage(agent_name, model.model_name, run.usage())
        return FilterUsedContextNode[ChatAgentState, ChatAgentDependencies]()

    async def _handle_model_request_streaming(
        self, ctx: GraphRunContext[ChatAgentState, ChatAgentDependencies], node: ModelRequestNode[GraphRunContext[ChatAgentState, ChatAgentDependencies], str], run: AgentRun[GraphRunContext[ChatAgentState, ChatAgentDependencies], str]
    ) -> None:
        async with node.stream(run.ctx) as request_stream:
            first_token = False
            final_result_found = False

            async for event in request_stream:
                if isinstance(event, FinalResultEvent):
                    final_result_found = True
                    break

            if final_result_found:
                answer_content = ""
                async for output in request_stream.stream_text():
                    if not first_token:
                        time_2_first_token = time.time() - ctx.deps.timing_metrics.start_time
                        ctx.state.time_2_first_token = time_2_first_token
                        ctx.deps.timing_metrics.record_time_2_first_token(time_2_first_token)
                        ctx.deps.event_streamer.emit_json(Time2FirstTokenEvent(time_2_first_token=time_2_first_token))
                        first_token = True

                    new_content = output[len(answer_content) :]
                    if new_content:
                        ctx.deps.event_streamer.stream_answer_chunk(new_content)
                    answer_content = output

                ctx.state.answer = answer_content


@dataclass
class RefuseAnswerNode(BaseNode[ChatAgentState, ChatAgentDependencies, None]):
    async def run(self, ctx: GraphRunContext[ChatAgentState, ChatAgentDependencies]) -> "End[ChatAgentState]":  # type: ignore[override]
        prompt = prompts.answer_refused_prompt.render(
            datetime=datetime.now(UTC).strftime("%Y-%m-%dT%H:%M:%SZ"),
            company_info=ctx.deps.company_info,
            detected_language=ctx.state.detected_language,
            refusal_reason=f"Refusal reason: {ctx.state.refusal_reason}",
        )

        model = ctx.deps.app_services.models[ModelType.GPT_4_1_MINI]
        agent_name = "refusal_answer_agent"
        agent = Agent(
            model=model,
            name=agent_name,
            model_settings=ModelSettings(temperature=ctx.deps.app_services.settings.chat_agent_llm_temp, max_tokens=256),
        )

        first_token = False
        answer_content = ""
        async with agent.run_stream(prompt, message_history=ctx.state.messages) as stream:
            async for chunk in stream.stream_output():
                if not first_token:
                    time_2_first_token = time.time() - ctx.deps.timing_metrics.start_time
                    ctx.state.time_2_first_token = time_2_first_token
                    ctx.deps.timing_metrics.record_time_2_first_token(time_2_first_token)
                    ctx.deps.event_streamer.emit_json(Time2FirstTokenEvent(time_2_first_token=time_2_first_token))
                    first_token = True

                # Only stream the new part, not the full cumulative content
                new_content = chunk[len(answer_content) :]
                if new_content:
                    ctx.deps.event_streamer.stream_answer_chunk(new_content)
                answer_content = chunk

        ctx.deps.usage_metrics.record_llm_call_usage(agent_name, model.model_name, stream.usage())
        ctx.state.answer = answer_content
        return End(ctx.state)


def create_chat_agent() -> Graph[ChatAgentState, ChatAgentDependencies]:
    return Graph(
        nodes=[
            QueryValidationNode,
            ProcessMessageNode,
            RefuseAnswerNode,
            FilterUsedContextNode,
        ]
    )
