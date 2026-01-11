from typing import Any

from pydantic_ai import FilteredToolset, FunctionToolset

from chatbot.agents.flow_agent.subagent import FlowSubAgent
from chatbot.agents.retrieval_agent.subagent import RetrievalSubAgent
from chatbot.agents.shared.state import AgentGraphDependencies, AgentState
from chatbot.agents.shared.subagent import FewShotExample, SubAgent
from chatbot.agents.trigger_agent.subagent import TriggerSubAgent
from chatbot.agents.user_search_agent.subagent import UserSearchSubAgent

SUBAGENT_REGISTRY: dict[str, list[type[SubAgent[AgentState]]]] = {
    "chat_agent": [
        RetrievalSubAgent,
        FlowSubAgent,
        UserSearchSubAgent,
        TriggerSubAgent,
    ],
    "post_creation_agent": [
        RetrievalSubAgent,
    ],
}


def _get_subagent_instances(orchestrator_name: str) -> list[SubAgent[AgentState]]:
    subagent_classes = SUBAGENT_REGISTRY.get(orchestrator_name, [])
    return [cls() for cls in subagent_classes]


def get_subagent_toolset(orchestrator_name: str) -> FilteredToolset[Any]:
    all_subagents = _get_subagent_instances(orchestrator_name)
    toolset = FunctionToolset(tools=[sa.as_tool() for sa in all_subagents])
    return toolset.filtered(lambda ctx, tool_def: any(sa.tool_name == tool_def.name and sa.is_enabled(ctx.deps.deps) for sa in all_subagents))


def get_subagent_prompt_references(orchestrator_name: str, deps: AgentGraphDependencies) -> list[str]:
    all_subagents = _get_subagent_instances(orchestrator_name)
    enabled_subagents = [sa for sa in all_subagents if sa.is_enabled(deps)]
    return [sa.prompt_reference for sa in enabled_subagents]


def get_subagent_examples(orchestrator_name: str, deps: AgentGraphDependencies) -> list[FewShotExample]:
    all_subagents = _get_subagent_instances(orchestrator_name)
    enabled_subagents = [sa for sa in all_subagents if sa.is_enabled(deps)]
    return [ex for sa in enabled_subagents for ex in sa.few_shot_examples]
