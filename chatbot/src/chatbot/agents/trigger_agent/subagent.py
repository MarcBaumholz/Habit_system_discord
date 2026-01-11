import logging

from pydantic_ai import RunContext
from pydantic_graph import GraphRunContext

from chatbot.agents.shared.state import AgentGraphDependencies, AgentState, OrchestrationAgentState
from chatbot.agents.shared.subagent import FewShotExample, SubAgent
from chatbot.agents.trigger_agent.agent import execute_trigger_subagent
from chatbot.agents.trigger_agent.state import TriggerAgentState

_logger = logging.getLogger(__name__)


class TriggerSubAgent(SubAgent[AgentState]):
    tool_name = "call_trigger_agent"
    tool_description = """Delegate tasks that could potentially require 'triggers' to another subagent.

    Call if the user's query cannot be fulfilled by calling any other agent.

    The delegated agent checks the task against the configured Triggers and triggers the
    matching action when a clear fit exists. It can also answer trigger availability questions.
    The tool response is meant for internal reasoning; if no trigger applies, it returns a message
    starting with "No triggers applicable."—use that as guidance, not verbatim user output.

    Args:
        task: The user task or question that should be evaluated for a Trigger.

    Returns:
        A confirmation message when an trigger was triggered, or guidance when no trigger applies.
    """
    feature_flag = "ASK_AI_TRIGGERS"

    prompt_reference = """# Triggers
Triggers are predefined tasks designed to steer the user to a certain outcome when the intent of the question matches the description of the trigger.
Trigger Actions can range from canned responses, over handing over to external agents, to triggering a flip flow.

Use the trigger agent as last resort when the users query was not covered by any of the other agents."""

    few_shot_examples: list[FewShotExample] = []

    async def run(
        self,
        ctx: RunContext[GraphRunContext[OrchestrationAgentState, AgentGraphDependencies]],
        task: str,
    ) -> TriggerAgentState:
        return await execute_trigger_subagent(task, ctx.deps.deps)
