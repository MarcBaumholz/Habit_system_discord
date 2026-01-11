from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass

from pydantic_ai import RunContext, Tool
from pydantic_graph import GraphRunContext

from chatbot.agents.shared.state import AgentGraphDependencies, AgentState, OrchestrationAgentState
from chatbot.util.unleash import UnleashFeatureToggle


@dataclass
class FewShotExample:
    task: str  # What needs to be accomplished
    reason: str  # Why this subagent/tool is needed for this task
    conversation: str  # The tool call flow demonstrating the usage pattern


class SubAgent[StateT: AgentState](ABC):
    tool_name: str
    tool_description: str
    feature_flag: UnleashFeatureToggle | None
    prompt_reference: str
    few_shot_examples: list[FewShotExample]

    @abstractmethod
    async def run(
        self,
        ctx: RunContext[GraphRunContext[OrchestrationAgentState, AgentGraphDependencies]],
        query: str,
    ) -> StateT:
        pass

    def is_enabled(self, deps: AgentGraphDependencies) -> bool:
        if self.feature_flag is None:
            return True
        return deps.app_services.feature_toggle_service.is_enabled(deps.auth.tenant, self.feature_flag)

    def as_tool(self) -> Tool[GraphRunContext[OrchestrationAgentState, AgentGraphDependencies]]:
        async def tool_wrapper(ctx: RunContext[GraphRunContext[OrchestrationAgentState, AgentGraphDependencies]], query: str) -> str:
            state = await self.run(ctx, query)
            ctx.deps.state.sub_agent_execution_results.append(self, state)
            return state.answer

        tool_wrapper.__name__ = self.tool_name
        tool_wrapper.__doc__ = self.tool_description
        return Tool(tool_wrapper, takes_ctx=True)
