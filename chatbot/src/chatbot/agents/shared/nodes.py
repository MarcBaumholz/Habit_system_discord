import logging
from collections.abc import Callable
from dataclasses import dataclass
from typing import TypeVar

from pydantic_ai import Agent, NativeOutput
from pydantic_ai.messages import ModelRequest, SystemPromptPart
from pydantic_ai.models import Model
from pydantic_ai.settings import ModelSettings
from pydantic_graph import BaseNode, End, GraphRunContext

import chatbot.agents.shared.prompts as prompts
import chatbot.agents.shared.structured_outputs as structured_outputs
import chatbot.utils as utils
from chatbot.agents.retrieval_agent.state import RetrievalAgentState
from chatbot.agents.retrieval_agent.subagent import RetrievalSubAgent
from chatbot.agents.shared.ai_models import ModelType
from chatbot.agents.shared.graph_event_streamer import RefinedContextEvent
from chatbot.agents.shared.state import AgentGraphDependencies, OrchestrationAgentState
from chatbot.agents.user_search_agent.state import UserSearchAgentState
from chatbot.agents.user_search_agent.subagent import UserSearchSubAgent
from chatbot.agents.user_search_agent.utils import format_user
from chatbot.util.observability import tracer

S = TypeVar("S", bound=OrchestrationAgentState)
D = TypeVar("D", bound=AgentGraphDependencies)

_logger = logging.getLogger(__name__)


@dataclass
class FilterUsedContextNode(BaseNode[S, D, S]):
    async def run(self, ctx: GraphRunContext[S, D]) -> End[S]:
        llm = ctx.deps.app_services.models[ModelType.GPT_4_1_NANO]

        retrieval_agent_states: list[RetrievalAgentState] = ctx.state.sub_agent_execution_results.for_agent(RetrievalSubAgent)
        user_search_agent_states: list[UserSearchAgentState] = ctx.state.sub_agent_execution_results.for_agent(UserSearchSubAgent)

        search_results = [doc for state in retrieval_agent_states for doc in state.second_stage_results]
        found_users = [user for state in user_search_agent_states for user in state.users]

        if not search_results and not found_users:
            ctx.state.refined_context = []
            return End(ctx.state)

        contexts = [utils.doc_2_string(doc) for doc in search_results]
        contexts.extend([format_user(user) for user in found_users])

        batch_size = 5
        all_used_indices = set()
        agent_name = "filter_used_context_agent"

        for batch_start in range(0, len(contexts), batch_size):
            batch_end = min(batch_start + batch_size, len(contexts))
            batch_contexts = contexts[batch_start:batch_end]

            prompt = prompts.listwise_filter_context_used_prompt.render(
                answer=ctx.state.answer,
                contexts=batch_contexts,
            )

            def make_validator(count: int) -> Callable[[structured_outputs.ListwiseContextUsage], list[structured_outputs.ContextUsageResult]]:
                def validate_and_return_usage(usage: structured_outputs.ListwiseContextUsage) -> list[structured_outputs.ContextUsageResult]:
                    return structured_outputs.validate_context_usage_output(usage, count)

                return validate_and_return_usage

            expected_count = len(batch_contexts)

            agent = Agent(
                model=llm,
                name=agent_name,
                system_prompt=prompt,
                output_type=NativeOutput(make_validator(expected_count)),
                retries=3,
                model_settings=ModelSettings(temperature=0.0, max_tokens=256),
            )
            response = await agent.run()
            ctx.deps.usage_metrics.record_llm_call_usage(agent_name, llm.model_name, response.usage())
            usage_results = response.output

            batch_used_indices = {batch_start + result.index - 1 for result in usage_results if result.context_was_used}
            all_used_indices.update(batch_used_indices)

        refined_docs = [doc for i, doc in enumerate(search_results) if i in all_used_indices]
        refined_users = []
        # The calling Backend currently does not support different context types being yielded other then doc/chunks.
        if ctx.deps.event_streamer.debug:
            refined_users = [user for i, user in enumerate(found_users, start=len(search_results)) if i in all_used_indices]

        ctx.state.refined_context = [*refined_docs, *refined_users]
        ctx.deps.event_streamer.emit_json(RefinedContextEvent(refined_context=ctx.state.refined_context))
        return End(ctx.state)


@tracer.start_as_current_span("get_chat_title")
async def get_chat_title(llm: Model, chat_history: list[dict[str, str]]) -> str:
    history = utils.dict_2_chat_history(chat_history)
    prompt = prompts.get_title_system_prompt.render()
    message_history = [ModelRequest(parts=[SystemPromptPart(content=prompt)])] + history
    title_agent = Agent(
        model=llm,
        name="chat_title_agent",
        retries=3,
        output_type=NativeOutput(structured_outputs.ChatHistoryTitle),
        model_settings=ModelSettings(temperature=0.7, max_tokens=64),
    )
    response = await title_agent.run("Now sumarize the above conversation into a single chat title", message_history=message_history)
    return response.output.title
