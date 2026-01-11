from __future__ import annotations

import logging
from dataclasses import dataclass
from datetime import datetime

from pydantic_ai import Agent, FunctionToolset, NativeOutput, _agent_graph
from pydantic_ai.messages import ModelRequest, ModelResponse, SystemPromptPart, ToolCallPart
from pydantic_ai.settings import ModelSettings
from pydantic_graph import BaseNode, End, Graph, GraphRunContext

import chatbot.agents.retrieval_agent.prompts as prompts
import chatbot.agents.retrieval_agent.structured_outputs as structured_outputs
from chatbot.agents.retrieval_agent.state import RetrievalAgentDependencies, RetrievalAgentState
from chatbot.agents.retrieval_agent.tools import create_retrieval_tools
from chatbot.agents.shared.ai_models import ModelType
from chatbot.agents.shared.graph_event_streamer import ToolCallsEvent
from chatbot.agents.shared.tools.general_purpose_tools import create_general_purpose_tools
from chatbot.config import Settings
from chatbot.utils import doc_2_string, extract_tool_calls_from_message, get_message_from_node

_logger = logging.getLogger(__name__)


@dataclass
class ProcessMessageNode(BaseNode[RetrievalAgentState, RetrievalAgentDependencies]):
    async def run(self, ctx: GraphRunContext[RetrievalAgentState, RetrievalAgentDependencies]) -> EvaluateResultsNode:
        retrieval_toolset = create_retrieval_tools()
        general_purpose_toolset: FunctionToolset[GraphRunContext[RetrievalAgentState, RetrievalAgentDependencies]] = create_general_purpose_tools()

        message_agent_system_prompt = prompts.message_agent_system_prompt.render(company_info=ctx.deps.company_info, research_task=ctx.state.query)

        if ctx.state.messages:
            message_history = ctx.state.messages
        else:
            message_history = [ModelRequest(parts=[SystemPromptPart(content=message_agent_system_prompt)])]
        model = ctx.deps.app_services.models[ModelType.GPT_4_1_BASE]
        agent_name = "retrieval_agent"
        agent = Agent(
            model,
            name=agent_name,
            toolsets=[retrieval_toolset, general_purpose_toolset],
            deps_type=GraphRunContext[RetrievalAgentState, RetrievalAgentDependencies],
            model_settings=ModelSettings(temperature=ctx.deps.app_services.settings.retrieval_agent_llm_temp, max_tokens=256),
        )

        async with agent.iter(message_history=message_history, deps=ctx) as run:
            node = run.next_node
            has_search_calls = False
            while not isinstance(node, End):
                if self._has_search_tool_call(node, ctx.deps.app_services.settings):
                    ctx.state.iteration += 1
                    has_search_calls = True

                node = await run.next(node)

                message = get_message_from_node(node)
                if message:
                    ctx.state.add_message(message)
                    if isinstance(message, ModelResponse):
                        new_tool_calls = extract_tool_calls_from_message(message)
                        if new_tool_calls:
                            ctx.deps.event_streamer.emit_debug(ToolCallsEvent(tool_calls=new_tool_calls))

                if has_search_calls:
                    break

        ctx.deps.usage_metrics.record_llm_call_usage(agent_name, model.model_name, run.usage())
        return EvaluateResultsNode()

    def _has_search_tool_call(
        self,
        node: _agent_graph.AgentNode[GraphRunContext[RetrievalAgentState, RetrievalAgentDependencies], str],
        settings: Settings,
    ) -> bool:
        """Check if the node contains a tool call that matches a configured search tool name."""
        if not Agent.is_call_tools_node(node):
            return False
        tool_calls = [call for call in node.model_response.parts if isinstance(call, ToolCallPart)]
        return any(tool_call.tool_name in settings.retrieval_agent_search_tool_names for tool_call in tool_calls)


@dataclass
class EvaluateResultsNode(BaseNode[RetrievalAgentState, RetrievalAgentDependencies, None]):
    async def run(self, ctx: GraphRunContext[RetrievalAgentState, RetrievalAgentDependencies]) -> ProcessMessageNode | End[RetrievalAgentState]:  # type: ignore
        # See https://ai.pydantic.dev/output/#structured-output, apparently mypy can't infer the type of the return value when using Union in this case.

        if ctx.state.iteration >= ctx.deps.app_services.settings.retrieval_max_iterations:
            _logger.warning("Maximum retrieval iterations reached. Ending.")
            return End(ctx.state)

        if not ctx.state.second_stage_results:
            if ctx.state.messages:
                latest_message = ctx.state.messages[-1]
                if isinstance(latest_message, ModelResponse):
                    has_tool_calls = any(isinstance(part, ToolCallPart) for part in latest_message.parts)
                    if not has_tool_calls:
                        _logger.info("No second stage results to evaluate. Early termination of the retrieval process")
                        return End(ctx.state)

            _logger.info("No second stage results to evaluate. Continuing to process message.")
            ctx.state.messages.append(ModelRequest(parts=[SystemPromptPart(content="No results to be evaluated")]))
            return ProcessMessageNode()

        documents_str = "\n\n---\n\n".join([doc_2_string(doc) for doc in ctx.state.second_stage_results])
        prompt = prompts.evaluate_results_prompt.render(datetime=datetime.now().strftime("%m/%d/%Y, %H:%M:%S"), research_task=ctx.state.query, documents=documents_str)
        model = ctx.deps.app_services.models[ModelType.GPT_4_1_MINI]
        agent_name = "evaluation_agent"
        agent = Agent(
            model,
            name=agent_name,
            system_prompt=prompt,
            output_type=NativeOutput(structured_outputs.ResultsEvaluation),
            model_settings=ModelSettings(temperature=ctx.deps.app_services.settings.retrieval_agent_llm_temp, max_tokens=256),
        )

        evaluation = await agent.run()
        ctx.deps.usage_metrics.record_llm_call_usage(agent_name, model.model_name, evaluation.usage())

        sufficiency_score = evaluation.output.sufficiency_score / 100.0
        if sufficiency_score >= ctx.deps.app_services.settings.evaluation_threshold:
            return End(ctx.state)

        return await self._prepare_for_next_iteration(ctx, evaluation.output)

    async def _prepare_for_next_iteration(self, ctx: GraphRunContext[RetrievalAgentState, RetrievalAgentDependencies], evaluation_output: structured_outputs.ResultsEvaluation) -> ProcessMessageNode:
        suggestion_message = f"**Current search results analysis:** \n\nThe current documents are not sufficient to fully answer the research task. \n\n**Missing information:** {evaluation_output.missing_information}"
        ctx.state.messages.append(ModelRequest(parts=[SystemPromptPart(content=suggestion_message)]))
        return ProcessMessageNode()


def create_retrieval_agent() -> Graph[RetrievalAgentState, RetrievalAgentDependencies]:
    return Graph(nodes=[ProcessMessageNode, EvaluateResultsNode])
