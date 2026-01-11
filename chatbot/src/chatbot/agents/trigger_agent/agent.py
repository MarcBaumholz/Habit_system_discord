import logging
from typing import cast
from uuid import UUID

from pydantic_ai import Agent, ModelRetry, NativeOutput
from pydantic_ai.settings import ModelSettings

from chatbot.agents.shared.ai_models import ModelType
from chatbot.agents.shared.graph_event_streamer import GraphEventStreamer, TriggerFlipFlowEvent
from chatbot.agents.shared.state import AgentGraphDependencies
from chatbot.agents.trigger_agent.prompts import trigger_agent_system_prompt
from chatbot.agents.trigger_agent.state import TriggerAgentState
from chatbot.agents.trigger_agent.structured_output import TriggerSelection
from chatbot.api_clients.flip_flows_api import FlipFlowsApi
from chatbot.triggers.models import TriggerFlipFlowAction
from chatbot.triggers.repository import TriggerRepository

_logger = logging.getLogger(__name__)


async def execute_trigger_subagent(query: str, deps: AgentGraphDependencies) -> TriggerAgentState:
    repository: TriggerRepository = deps.app_services.database_service.get_repository(TriggerRepository)
    triggers = await repository.get_all_triggers(deps.auth.tenant)

    indexed_triggers = [{"index": index, "name": trigger.name, "description": trigger.ai_description} for index, trigger in enumerate(triggers, start=1)]
    trigger_lookup = {index: trigger for index, trigger in enumerate(triggers, start=1)}

    system_prompt = trigger_agent_system_prompt.render(triggers=indexed_triggers)
    model = deps.app_services.models[ModelType.GPT_4_1_MINI]
    agent_name = "trigger_agent"

    agent = Agent(
        model,
        name=agent_name,
        deps_type=AgentGraphDependencies,
        system_prompt=system_prompt,
        output_type=NativeOutput(TriggerSelection),
        model_settings=ModelSettings(temperature=0.1, max_tokens=128),
    )

    @agent.output_validator
    async def validate_output(output: TriggerSelection) -> TriggerSelection:
        if output.index <= 0:
            return output

        if trigger_lookup.get(output.index) is None:
            raise ModelRetry(f"The selected index {output.index} is not a valid trigger, please choose a valid one.")

        return output

    result = await agent.run(query, deps=deps)

    deps.usage_metrics.record_llm_call_usage(agent_name, model.model_name, result.usage())
    selection = result.output

    if selection.index <= 0:
        return TriggerAgentState(answer=selection.return_message)
    triggered_trigger = trigger_lookup.get(selection.index)
    assert triggered_trigger is not None  # Ensured by `validate_output`.

    # NOTE: For now, we only trigger the first action.
    if len(triggered_trigger.actions) == 0:
        return TriggerAgentState(answer="No triggers applicable.")

    first_action = triggered_trigger.actions[0]
    if isinstance(first_action, TriggerFlipFlowAction):
        event_streamer = cast(GraphEventStreamer[TriggerFlipFlowEvent], deps.event_streamer)
        flows_client = FlipFlowsApi(deps.app_services.http_client, deps.app_services.settings)

        flow = await flows_client.get_flow_by_id(deps.auth, first_action.flow_id)
        message = await flows_client.get_message_by_id(deps.auth, first_action.flow_id, first_action.message_id)

        if flow is None:
            _logger.warning(f"Flow {first_action.flow_id} not found.")
            return TriggerAgentState(answer="No triggers applicable.")

        if message is None:
            _logger.warning(f"Message {first_action.message_id} not found.")
            return TriggerAgentState(answer="No triggers applicable.")

        emit_flow_trigger(
            event_streamer,
            message.keyword,
            flow.api_client_id,
            flow.name,
            selection.return_message,
            selection.index,
        )

    return TriggerAgentState(
        answer=selection.return_message,
        selected_trigger_index=selection.index,
    )


def emit_flow_trigger(
    event_streamer: GraphEventStreamer[TriggerFlipFlowEvent],
    keyword: str,
    api_client_id: UUID,
    name: str,
    reason: str,
    index: int,
) -> None:
    event_streamer.emit_json(
        TriggerFlipFlowEvent(
            api_client_id=api_client_id,
            keyword=keyword,
            name=name,
            reason=reason,
            index=index,
        )
    )
