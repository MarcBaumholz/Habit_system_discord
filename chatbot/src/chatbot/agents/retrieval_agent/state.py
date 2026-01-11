from dataclasses import dataclass, field

from chatbot.agents.shared.state import AgentGraphDependencies, AgentState
from chatbot.pydantic_models import Document


@dataclass
class RetrievalAgentDependencies(AgentGraphDependencies):
    pass


@dataclass
class RetrievalAgentState(AgentState):
    first_stage_results: list[Document] = field(default_factory=list)
    second_stage_results: list[Document] = field(default_factory=list)
    seen_documents: set[str] = field(default_factory=set)
    retrieval_time: float = field(default_factory=float)
