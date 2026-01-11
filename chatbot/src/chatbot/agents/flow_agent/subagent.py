import logging

from pydantic_ai import RunContext
from pydantic_graph import GraphRunContext

from chatbot.agents.flow_agent.agent import SelectFlowNode, create_flow_agent
from chatbot.agents.flow_agent.definitions import load_flow_definitions_from_api
from chatbot.agents.flow_agent.state import FlowAgentDependencies, FlowAgentState
from chatbot.agents.shared.state import AgentGraphDependencies, OrchestrationAgentState
from chatbot.agents.shared.subagent import FewShotExample, SubAgent

_logger = logging.getLogger(__name__)


class FlowSubAgent(SubAgent[FlowAgentState]):
    tool_name = "call_flow_agent"
    tool_description = """Delegate flow-related tasks or availability questions to the Flip flow agent.

    The delegated agent checks the task against the configured Flip flows and triggers the
    matching flow when a clear fit exists. It can also answer flow availability questions.
    The tool response is meant for internal reasoning; if no flow applies it returns a message
    starting with "No flows applicable."—use that as guidance, not verbatim user output.

    Args:
        task: The user task or question that should be evaluated for a Flip flow.

    Returns:
        A confirmation message when a flow was triggered, or guidance when no flow applies.
    """
    feature_flag = "ASK_AI_FLIP_FLOWS_ENABLED"

    prompt_reference = """# Flip Flows
Flip Flows are predefined workflows designed to streamline operations and guide employees through various tasks, communications, and processes. They function as interactive, step-by-step guides that automate common business activities such as:
- Onboarding and training (welcome messages, document delivery, task assignments)
- Recognition and feedback (peer nominations, anonymous Q&A, leadership feedback)
- Operational tasks (incident reporting, security alerts, vacation requests, equipment requests)
- Merchandising and maintenance (planogram setup, equipment checks, automated reminders)
- Compliance (health & safety training, digital checklists, knowledge verification)

The goal is to save time, enhance efficiency, and boost engagement by delivering timely, relevant support whenever needed.

Each flow has a name and can consist of multiple actions, each with its own keyword. For example, the "Absence Assistant" flow might have separate actions for vacation requests, sick leave, and parental leave.

When a Flip flow is triggered by the flow agent, it will automatically open and link a separate interactive chat where the user can complete the workflow step-by-step.
If the user wants to start the flow, it is only needed to click the linked flow icon attached to the chat message.
Ask the flow agent which flows are available whenever you need to confirm coverage instead of guessing."""

    few_shot_examples: list[FewShotExample] = []

    async def run(
        self,
        ctx: RunContext[GraphRunContext[OrchestrationAgentState, AgentGraphDependencies]],
        task: str,
    ) -> FlowAgentState:
        graph_ctx = ctx.deps
        deps = graph_ctx.deps

        try:
            flow_definitions = await load_flow_definitions_from_api(
                deps.app_services.http_client,
                deps.app_services.settings,
                deps.auth.tenant,
            )
        except Exception as e:
            _logger.error(f"An error has occured during the fetching of the flip flows defintions from core: {e}")
            return FlowAgentState(query=task, answer="No flows applicable.")
        if flow_definitions is None:
            return FlowAgentState(query=task, answer="No flows applicable.")

        flow_state = FlowAgentState(query=task)
        flow_deps = FlowAgentDependencies(
            company_info=deps.company_info,
            auth=deps.auth,
            timing_metrics=deps.timing_metrics,
            usage_metrics=deps.usage_metrics,
            event_streamer=deps.event_streamer,
            app_services=deps.app_services,
            flow_definitions=flow_definitions,
            current_datetime=deps.current_datetime,
        )

        flow_graph = create_flow_agent()
        result = await flow_graph.run(SelectFlowNode(), state=flow_state, deps=flow_deps)

        return result.state
