from dataclasses import dataclass

from chatbot.agents.shared.state import AgentGraphDependencies, OrchestrationAgentState


@dataclass
class ChatAgentDependencies(AgentGraphDependencies):
    pass


@dataclass
class ChatAgentState(OrchestrationAgentState):
    detected_language: str | None = None
    refusal_reason: str | None = None
    time_2_first_token: float | None = None
