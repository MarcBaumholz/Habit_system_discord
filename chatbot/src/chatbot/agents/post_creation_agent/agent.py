"""
This file should contain everything needed for the AI to create a post.
"""

import logging
from dataclasses import dataclass
from datetime import UTC, datetime

from pydantic_ai import Agent, FunctionToolset
from pydantic_ai.messages import ModelRequest, ModelResponse, SystemPromptPart, ToolCallPart
from pydantic_ai.settings import ModelSettings
from pydantic_graph import BaseNode, End, Graph, GraphRunContext

# Use absolute imports
import chatbot.agents.post_creation_agent.prompts as prompts
import chatbot.agents.post_creation_agent.structured_outputs as structured_outputs
from chatbot.agents.post_creation_agent.state import PostCreationAgentDependencies, PostCreationAgentState
from chatbot.agents.post_creation_agent.tools import create_post_tools
from chatbot.agents.shared.ai_models import ModelType
from chatbot.agents.shared.azure_content_filter import with_azure_content_filter_fallback
from chatbot.agents.shared.graph_event_streamer import ToolCallsEvent
from chatbot.agents.shared.nodes import FilterUsedContextNode
from chatbot.agents.shared.retrieval_call_merger import merge_retrieval_agent_calls
from chatbot.agents.shared.subagent_registry import get_subagent_examples, get_subagent_prompt_references, get_subagent_toolset
from chatbot.agents.shared.tools.general_purpose_tools import create_general_purpose_tools
from chatbot.pydantic_models import ToolCall
from chatbot.utils import extract_tool_calls_from_message, get_message_from_node

_logger = logging.getLogger(__name__)


@dataclass
class ProcessMessageNode(BaseNode[PostCreationAgentState, PostCreationAgentDependencies, None]):
    @with_azure_content_filter_fallback(lambda: RefuseAnswerNode(), "post creation agent")
    async def run(self, ctx: GraphRunContext[PostCreationAgentState, PostCreationAgentDependencies]) -> "OutputParserNode | RefuseAnswerNode":
        subagent_toolset = get_subagent_toolset("post_creation_agent")
        subagent_references = get_subagent_prompt_references("post_creation_agent", ctx.deps)
        subagent_examples = get_subagent_examples("post_creation_agent", ctx.deps)
        post_tools_toolset = create_post_tools()
        general_purpose_toolset: FunctionToolset[GraphRunContext[PostCreationAgentState, PostCreationAgentDependencies]] = create_general_purpose_tools()
        message_agent_system_prompt = prompts.message_agent_system_prompt.render(
            company_info=ctx.deps.company_info,
            subagent_references=subagent_references,
            subagent_examples=subagent_examples,
        )
        message_history = [ModelRequest(parts=[SystemPromptPart(content=message_agent_system_prompt)])] + ctx.state.messages

        model = ctx.deps.app_services.models[ModelType.GPT_4_1_MINI]
        agent_name = "message_agent"
        agent = Agent(
            model,
            name=agent_name,
            deps_type=GraphRunContext[PostCreationAgentState, PostCreationAgentDependencies],
            toolsets=[subagent_toolset, post_tools_toolset, general_purpose_toolset],
            model_settings=ModelSettings(temperature=ctx.deps.app_services.settings.post_creation_agent_llm_temp, max_tokens=1024),
            retries=3,
        )

        if ctx.state.post is None:
            ctx.state.post = structured_outputs.Post(title="", body="")

        async with agent.iter(None, message_history=message_history, deps=ctx) as run:
            node = run.next_node
            while not isinstance(node, End):
                if Agent.is_call_tools_node(node):
                    node = merge_retrieval_agent_calls(node)
                    ctx.state.iteration += 1

                message = get_message_from_node(node)
                if message:
                    ctx.state.add_message(message)
                    if isinstance(message, ModelResponse):
                        new_tool_calls = extract_tool_calls_from_message(message)
                        if new_tool_calls:
                            ctx.deps.event_streamer.emit_debug(ToolCallsEvent(tool_calls=new_tool_calls))

                node = await run.next(node)

                if Agent.is_model_request_node(node):
                    if ctx.state.iteration >= ctx.deps.app_services.settings.post_max_iterations:
                        _logger.warning("Maximum iterations reached in post creation. Outputting the best available post.")
                        run.ctx.state.message_history.append(node.request)
                        break

        ctx.deps.usage_metrics.record_llm_call_usage(agent_name, model.model_name, run.usage())
        await self._ensure_post_creation(ctx, agent)

        return OutputParserNode()

    async def _ensure_post_creation(
        self,
        ctx: GraphRunContext[PostCreationAgentState, PostCreationAgentDependencies],
        agent: Agent[GraphRunContext[PostCreationAgentState, PostCreationAgentDependencies], str],
    ) -> None:
        force_prompt = ""
        if not ctx.state.post.title and not ctx.state.post.body:
            _logger.warning("Agent failed to create a post. Forcing a correction.")
            force_prompt = "You have not yet created the post. You must now use the `set_post_title_and_body` tool to create the post based on the conversation."
        elif not ctx.state.post.title:
            _logger.warning("Agent failed to create a post title. Forcing a correction.")
            force_prompt = "The post body has been created, but the title is missing. You must now use the `set_post_title` tool to create the title based on the post body and the conversation."
        elif not ctx.state.post.body:
            _logger.warning("Agent failed to create a post body. Forcing a correction.")
            force_prompt = "The post title has been created, but the body is missing. You must now use the `set_post_body` tool to create the body based on the post title and the conversation."

        if force_prompt:
            correction_run_result = await agent.run(user_prompt=force_prompt, message_history=ctx.state.messages, deps=ctx)
            new_messages = correction_run_result.new_messages()
            ctx.state.messages.extend(new_messages)

            new_tool_calls: list[ToolCall] = []
            for message in new_messages:
                if isinstance(message, ModelResponse):
                    for part in message.parts:
                        if isinstance(part, ToolCallPart):
                            new_tool_calls.append(ToolCall(name=part.tool_name, parameters=part.args_as_dict()))

            if new_tool_calls:
                ctx.state.tool_calls.extend(new_tool_calls)
                ctx.deps.event_streamer.emit_debug(ToolCallsEvent(tool_calls=new_tool_calls))


@dataclass
class RefuseAnswerNode(BaseNode[PostCreationAgentState, PostCreationAgentDependencies, None]):
    """Simple refusal node that handles Azure safety filter errors only."""

    async def run(self, ctx: GraphRunContext[PostCreationAgentState, PostCreationAgentDependencies]) -> "End[PostCreationAgentState]":  # type: ignore[override]
        prompt = prompts.answer_refused_prompt.render(
            datetime=datetime.now(UTC).strftime("%Y-%m-%dT%H:%M:%SZ"),
            company_info=ctx.deps.company_info,
            refusal_reason=f"Refusal reason: {ctx.state.refusal_reason}",
        )

        model = ctx.deps.app_services.models[ModelType.GPT_4_1_MINI]
        agent_name = "refusal_answer_agent"
        agent = Agent(
            model=model,
            name=agent_name,
            model_settings=ModelSettings(temperature=0.5, max_tokens=256),
        )

        response = await agent.run(prompt, message_history=ctx.state.messages)
        ctx.deps.usage_metrics.record_llm_call_usage(agent_name, model.model_name, response.usage())
        ctx.state.answer = response.output
        return End(ctx.state)


@dataclass
class OutputParserNode(BaseNode[PostCreationAgentState, PostCreationAgentDependencies, None]):
    async def run(self, ctx: GraphRunContext[PostCreationAgentState, PostCreationAgentDependencies]) -> "FilterUsedContextNode[PostCreationAgentState, PostCreationAgentDependencies]":
        answer_prompt = prompts.answer_user_prompt.render()
        model = ctx.deps.app_services.models[ModelType.GPT_4_1_MINI]
        agent_name = "answer_agent"
        agent = Agent(
            model,
            name=agent_name,
            deps_type=GraphRunContext[PostCreationAgentState, PostCreationAgentDependencies],
            model_settings=ModelSettings(temperature=ctx.deps.app_services.settings.post_creation_agent_llm_temp, max_tokens=256),
        )

        response = await agent.run(answer_prompt, message_history=ctx.state.messages)
        ctx.deps.usage_metrics.record_llm_call_usage(agent_name, model.model_name, response.usage())

        ctx.state.answer = response.output

        return FilterUsedContextNode[PostCreationAgentState, PostCreationAgentDependencies]()


def create_post_creation_agent() -> Graph[PostCreationAgentState, PostCreationAgentDependencies]:
    return Graph(
        nodes=[
            ProcessMessageNode,
            RefuseAnswerNode,
            OutputParserNode,
            FilterUsedContextNode,
        ]
    )
