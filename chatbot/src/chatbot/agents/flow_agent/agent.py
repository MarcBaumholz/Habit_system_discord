from typing import cast

from pydantic_ai import Agent
from pydantic_ai.settings import ModelSettings
from pydantic_graph import BaseNode, End, Graph, GraphRunContext

from chatbot.agents.flow_agent.prompts import flow_agent_system_prompt
from chatbot.agents.flow_agent.state import FlowAgentDependencies, FlowAgentState
from chatbot.agents.flow_agent.structured_output import FlowSelection
from chatbot.agents.shared.ai_models import ModelType
from chatbot.agents.shared.graph_event_streamer import GraphEventStreamer, TriggerFlipFlowEvent


class SelectFlowNode(BaseNode[FlowAgentState, FlowAgentDependencies, None]):
    async def run(self, ctx: GraphRunContext[FlowAgentState, FlowAgentDependencies]) -> End[None]:
        indexed_flows = [{"index": index, "name": flow.name, "keyword": flow.keyword, "description": flow.description} for index, flow in enumerate(ctx.deps.flow_definitions, start=1)]
        system_prompt = flow_agent_system_prompt.render(flows=indexed_flows)
        model = ctx.deps.app_services.models[ModelType.GPT_4_1_MINI]
        agent_name = "flow_agent"

        agent = Agent(
            model,
            name=agent_name,
            deps_type=FlowAgentDependencies,
            system_prompt=system_prompt,
            output_type=FlowSelection,
            model_settings=ModelSettings(temperature=0.1, max_tokens=128),
        )

        result = await agent.run(ctx.state.query, deps=ctx.deps)

        ctx.deps.usage_metrics.record_llm_call_usage(agent_name, model.model_name, result.usage())

        selection = result.output
        ctx.state.selected_flow_index = selection.index
        ctx.state.answer = selection.return_message

        if selection.index > 0 and ctx.deps.flow_definitions:
            flow_lookup = {index: flow for index, flow in enumerate(ctx.deps.flow_definitions, start=1)}
            triggered_flow = flow_lookup.get(selection.index)
            if triggered_flow is not None:
                event_streamer = cast(GraphEventStreamer[TriggerFlipFlowEvent], ctx.deps.event_streamer)
                emit_flow_trigger(
                    event_streamer,
                    triggered_flow.keyword,
                    triggered_flow.user_id,
                    triggered_flow.name,
                    selection.return_message,
                    selection.index,
                )

        return End(data=None)


def create_flow_agent() -> Graph[FlowAgentState, FlowAgentDependencies, None]:
    return Graph(nodes=[SelectFlowNode])


def emit_flow_trigger(
    event_streamer: GraphEventStreamer[TriggerFlipFlowEvent],
    keyword: str,
    flow_user_id: str,
    name: str,
    reason: str,
    index: int,
) -> None:
    if not keyword or not flow_user_id:
        return

    event_streamer.emit_json(
        TriggerFlipFlowEvent(
            user_id=flow_user_id,
            keyword=keyword,
            name=name,
            reason=reason,
            index=index,
        )
    )
