import logging

from pydantic_ai import Agent, FunctionToolset, Tool, UsageLimits
from pydantic_ai.exceptions import UsageLimitExceeded
from pydantic_ai.messages import ModelResponse
from pydantic_ai.settings import ModelSettings
from pydantic_graph import BaseNode, End, Graph, GraphRunContext

import chatbot.agents.user_search_agent.prompts as prompts
from chatbot.agents.shared.ai_models import ModelType
from chatbot.agents.shared.graph_event_streamer import ToolCallsEvent
from chatbot.agents.user_search_agent.state import UserSearchAgentDependencies, UserSearchAgentState
from chatbot.agents.user_search_agent.tools import (
    get_user_attribute_definitions,
    search_users_by_attribute,
    search_users_by_name,
)
from chatbot.agents.user_search_agent.utils import format_users
from chatbot.utils import extract_tool_calls_from_message, get_message_from_node

_logger = logging.getLogger(__name__)


def create_user_search_tools() -> FunctionToolset[GraphRunContext[UserSearchAgentState, UserSearchAgentDependencies]]:
    tools = [get_user_attribute_definitions, search_users_by_name, search_users_by_attribute]
    return FunctionToolset(tools=[Tool(tool, takes_ctx=True) for tool in tools])  # type: ignore[arg-type]


class SearchUsersNode(BaseNode[UserSearchAgentState, UserSearchAgentDependencies, None]):
    async def run(self, ctx: GraphRunContext[UserSearchAgentState, UserSearchAgentDependencies]) -> End[None]:
        user_search_toolset = create_user_search_tools()

        system_prompt = prompts.user_search_agent_system_prompt.render(company_info=ctx.deps.company_info, search_task=ctx.state.query)

        settings = ctx.deps.app_services.settings
        model = ctx.deps.app_services.models[ModelType.GPT_4_1_MINI]
        agent_name = "user_search_agent"

        agent = Agent(
            model,
            name=agent_name,
            toolsets=[user_search_toolset],
            deps_type=GraphRunContext[UserSearchAgentState, UserSearchAgentDependencies],
            system_prompt=system_prompt,
            model_settings=ModelSettings(
                temperature=settings.retrieval_agent_llm_temp,
                max_tokens=512,
            ),
        )

        usage_limits = UsageLimits(total_tokens_limit=settings.user_search_agent_total_tokens_limit)

        try:
            async with agent.iter(ctx.state.query, deps=ctx, usage_limits=usage_limits) as agent_run:
                async for node in agent_run:
                    message = get_message_from_node(node)
                    if message:
                        if isinstance(message, ModelResponse):
                            new_tool_calls = extract_tool_calls_from_message(message)
                            if new_tool_calls:
                                ctx.deps.event_streamer.emit_debug(ToolCallsEvent(tool_calls=new_tool_calls))
                        ctx.state.add_message(message)
                ctx.deps.usage_metrics.record_llm_call_usage(agent_name, model.model_name, agent_run.usage())
        except UsageLimitExceeded:
            _logger.warning(f"User search agent exceeded token limit of {settings.user_search_agent_total_tokens_limit}; returning partial results if available")

        if ctx.state.users:
            ctx.state.answer = f"**Found {len(ctx.state.users)} user(s)**:\n{format_users(ctx.state.users)}"
        else:
            ctx.state.answer = "No users found matching the search criteria"

        return End(data=None)


def create_user_search_agent() -> Graph[UserSearchAgentState, UserSearchAgentDependencies, None]:
    return Graph(nodes=[SearchUsersNode])
