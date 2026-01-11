from __future__ import annotations

from collections.abc import Sequence
from dataclasses import dataclass

from chatbot.agents.flow_agent.definitions import FlowDefinition
from chatbot.agents.shared.state import AgentGraphDependencies, AgentState


@dataclass
class FlowAgentDependencies(AgentGraphDependencies):
    flow_definitions: Sequence[FlowDefinition]


@dataclass
class FlowAgentState(AgentState):
    selected_flow_index: int = 0
