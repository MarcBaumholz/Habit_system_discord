from __future__ import annotations

from dataclasses import dataclass

from chatbot.agents.shared.state import AgentState


@dataclass
class TriggerAgentState(AgentState):
    selected_trigger_index: int = 0
