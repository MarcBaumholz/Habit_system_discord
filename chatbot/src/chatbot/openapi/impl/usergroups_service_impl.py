from uuid import UUID

from fastapi import Header, Path
from starlette.requests import Request

from chatbot.app_services import AppServices
from chatbot.core_api.user_admin_api import (
    AssignableAttributeDefinitionsResponse,
    AssignableRolesResponse,
    UserAdminApi,
)
from chatbot.openapi.generated.models import (
    GenerateAssignmentRulesErrorResponse,
    GenerateAssignmentRulesRequest,
    GenerateAssignmentRulesSuccessResponse,
    RoleReference,
    RoleTitleTranslation,
    UserAttributeDefinitionReference,
    UserAttributeTitleTranslation,
    UserGroupAssignmentRule,
    UserGroupAssignmentRuleAttributeValue,
    UserGroupAssignmentRuleCondition,
    UserGroupAssignmentRuleUserAttributeConditionAnyOf,
    UserGroupId,
)
from chatbot.openapi.generated.routers.user_groups import UsergroupsService
from chatbot.operations.user_group_rules.agent import AttributeDefinitionInput, RoleInput, call_user_group_rule_agent
from chatbot.operations.user_group_rules.structured_output import AssignmentRule, AssignmentRuleCondition, ConditionType, GenerateAssignmentRulesError, GenerateAssignmentRulesResult, GenerateAssignmentRulesSuccess
from chatbot.util.auth import get_flip_api_auth


class UsergroupsServiceImpl(UsergroupsService):
    async def generate_assignment_rules(
        self,
        request: Request,
        accept__language: str | None = Header(None, alias="Accept-Language"),  # noqa: B008
        group_id: UserGroupId = Path(..., alias="groupId"),  # noqa: B008
        body: GenerateAssignmentRulesRequest = ...,  # type: ignore[assignment]
    ) -> GenerateAssignmentRulesSuccessResponse | GenerateAssignmentRulesErrorResponse:
        auth = get_flip_api_auth(request)
        accept_language = accept__language

        app_services: AppServices = request.state.app_services
        await app_services.permission_service.check_user_group_permission(auth, group_id, "USER_GROUP:MANAGE_RULES")

        user_admin_api = UserAdminApi(app_services.http_client, app_services.settings)

        attribute_definitions_response = await user_admin_api.list_assignable_attribute_definitions(auth, accept_language)
        assignable_roles_response = await user_admin_api.list_assignable_roles(auth, group_id, accept_language)

        agent_result = await _call_agent(app_services, assignable_roles_response, attribute_definitions_response, body)

        if isinstance(agent_result.result, GenerateAssignmentRulesError):
            return GenerateAssignmentRulesErrorResponse(status="ERROR", error_message=agent_result.result.error_message)

        rules = _map_agent_result_to_api_response(agent_result.result, attribute_definitions_response, assignable_roles_response)
        return GenerateAssignmentRulesSuccessResponse(status="SUCCESS", rules=rules)


def _map_agent_result_to_api_response(
    agent_result: GenerateAssignmentRulesSuccess,
    attribute_definitions_response: AssignableAttributeDefinitionsResponse,
    assignable_roles_response: AssignableRolesResponse,
) -> list[UserGroupAssignmentRule]:
    attribute_map = _build_attribute_map(attribute_definitions_response)
    role_map = _build_role_map(assignable_roles_response)

    return [_map_rule(agent_rule, attribute_map, role_map) for agent_rule in agent_result.rules]


def _build_attribute_map(
    attribute_definitions_response: AssignableAttributeDefinitionsResponse,
) -> dict[str, UserAttributeDefinitionReference]:
    attribute_map: dict[str, UserAttributeDefinitionReference] = {}
    for definition in attribute_definitions_response.definitions:
        attribute_map[definition.technical_name] = UserAttributeDefinitionReference(
            id=UUID(definition.id),
            title=UserAttributeTitleTranslation(
                language=definition.title.language if definition.title else "en",
                text=definition.title.text if definition.title else "",
            ),
            technical_name=definition.technical_name,
            user_permission=definition.user_permission,
            attribute_type=definition.attribute_type,
            predefined=definition.predefined,
        )
    return attribute_map


def _build_role_map(
    assignable_roles_response: AssignableRolesResponse,
) -> dict[str, RoleReference]:
    role_map: dict[str, RoleReference] = {}
    for assignable_role in assignable_roles_response.assignable_roles:
        if assignable_role.role:
            role = assignable_role.role
            role_map[assignable_role.role_id] = RoleReference(
                id=UUID(role.id),
                title=RoleTitleTranslation(
                    language=role.title.language,
                    text=role.title.text,
                ),
                type=role.type,
                predefined_role_type=role.predefined_role_type,
                scope=role.scope,
                permission_count=role.permission_count,
            )
    return role_map


def _map_rule(
    agent_rule: AssignmentRule,
    attribute_map: dict[str, UserAttributeDefinitionReference],
    role_map: dict[str, RoleReference],
) -> UserGroupAssignmentRule:
    role_ref = role_map.get(agent_rule.role_id)
    if not role_ref:
        raise ValueError(f"Unknown role_id: {agent_rule.role_id}")

    conditions: list[UserGroupAssignmentRuleCondition] = []
    for agent_condition in agent_rule.conditions:
        attr_ref = attribute_map.get(agent_condition.attribute_technical_name)
        if not attr_ref:
            raise ValueError(f"Unknown attribute_technical_name: {agent_condition.attribute_technical_name}")

        condition = _map_condition(agent_condition, attr_ref)
        conditions.append(condition)

    return UserGroupAssignmentRule(
        role_id=UUID(agent_rule.role_id),
        role=role_ref,
        conditions=conditions,
    )


def _map_condition(
    agent_condition: AssignmentRuleCondition,
    attr_ref: UserAttributeDefinitionReference,
) -> UserGroupAssignmentRuleCondition:
    match agent_condition.type:
        case ConditionType.ATTRIBUTE_ANY_OF:
            return UserGroupAssignmentRuleUserAttributeConditionAnyOf(
                type="ATTRIBUTE_ANY_OF",
                attribute_definition_id=attr_ref.id,
                attribute_definition_reference=attr_ref,
                values=[UserGroupAssignmentRuleAttributeValue(value=v) for v in agent_condition.values],
            )
        case _:
            raise ValueError(f"Unknown condition type: {agent_condition.type}")


async def _call_agent(app_services: AppServices, assignable_roles_response: AssignableRolesResponse, attribute_definitions_response: AssignableAttributeDefinitionsResponse, body: GenerateAssignmentRulesRequest) -> GenerateAssignmentRulesResult:
    attribute_definitions = [
        AttributeDefinitionInput(
            technical_name=definition.technical_name,
            title=definition.title.text if definition.title else None,
        )
        for definition in attribute_definitions_response.definitions
    ]

    roles = [
        RoleInput(
            id=role.role_id,
            title=role.role.title.text if role.role else None,
        )
        for role in assignable_roles_response.assignable_roles
    ]

    agent_result = await call_user_group_rule_agent(app_services, attribute_definitions, roles, body.prompt)
    return agent_result
