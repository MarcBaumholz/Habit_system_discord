import logging

from pydantic_ai import FunctionToolset, Tool
from pydantic_graph import GraphRunContext

from chatbot.agents.chat_agent.state import ChatAgentDependencies, ChatAgentState

_logger = logging.getLogger(__name__)


def create_chat_agent_tools(ctx: GraphRunContext[ChatAgentState, ChatAgentDependencies]) -> FunctionToolset[GraphRunContext[ChatAgentState, ChatAgentDependencies]]:
    tools: list[Tool[GraphRunContext[ChatAgentState, ChatAgentDependencies]]] = []

    return FunctionToolset(tools=tools)
