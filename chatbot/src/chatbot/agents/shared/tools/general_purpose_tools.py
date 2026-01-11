"""General purpose tool implementations shared across agents."""

from pydantic_ai import FunctionToolset, RunContext, Tool
from pydantic_graph import GraphRunContext

from chatbot.agents.shared.state import AgentGraphDependencies, AgentState


def get_current_date_time[S: AgentState, D: AgentGraphDependencies](ctx: RunContext[GraphRunContext[S, D]]) -> str:
    """Return the current datetime as a formatted string."""
    now = ctx.deps.deps.current_datetime
    output_str = f"Today's date is {now.strftime('%A, %B %d, %Y')} and the current time is {now.strftime('%I:%M:%S %p')}"
    return output_str


def create_general_purpose_tools[S: AgentState, D: AgentGraphDependencies]() -> FunctionToolset[GraphRunContext[S, D]]:
    return FunctionToolset(tools=[Tool(get_current_date_time, takes_ctx=True)])


__all__ = ["create_general_purpose_tools", "get_current_date_time"]
