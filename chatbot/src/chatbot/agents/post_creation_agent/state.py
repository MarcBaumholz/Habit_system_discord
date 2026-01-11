from dataclasses import dataclass, field

from chatbot.agents.post_creation_agent.structured_outputs import Post
from chatbot.agents.shared.state import AgentGraphDependencies, OrchestrationAgentState


@dataclass
class PostCreationAgentDependencies(AgentGraphDependencies):
    pass


@dataclass
class PostCreationAgentState(OrchestrationAgentState):
    post: Post = field(default_factory=lambda: Post(title="", body=""))
    refusal_reason: str | None = None
