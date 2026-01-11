from dataclasses import dataclass

from pydantic_ai import Agent, ModelSettings

from chatbot.agents.shared.ai_models import ModelType
from chatbot.app_services import AppServices
from chatbot.operations.user_group_rules import prompts
from chatbot.operations.user_group_rules.structured_output import GenerateAssignmentRulesResult


@dataclass
class AttributeDefinitionInput:
    """Attribute definition input for the assignment rules agent."""

    technical_name: str
    title: str | None = None


@dataclass
class RoleInput:
    """Role input for the assignment rules agent."""

    id: str
    title: str | None = None


async def call_user_group_rule_agent(
    app_services: AppServices,
    attribute_definitions: list[AttributeDefinitionInput],
    roles: list[RoleInput],
    query: str,
) -> GenerateAssignmentRulesResult:
    model = app_services.models[ModelType.GPT_4_1_BASE]
    agent_name = "user_group_rule_agent"

    system_prompt = prompts.user_group_rules_agent_system_prompt.render(
        attribute_definitions=attribute_definitions,
        roles=roles,
    )

    agent = Agent(
        model,
        name=agent_name,
        system_prompt=system_prompt,
        output_type=GenerateAssignmentRulesResult,
        model_settings=ModelSettings(temperature=0.0, max_tokens=2048),
    )

    result = await agent.run(query)

    return result.output
