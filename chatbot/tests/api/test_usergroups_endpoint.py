from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager
from unittest.mock import AsyncMock, Mock, patch
from uuid import UUID

import httpx
import pytest
import pytest_asyncio
from fastapi import FastAPI, Request
from inline_snapshot import snapshot
from pydantic_ai.models.test import TestModel
from tests.utils import create_test_jwt, deterministic_uuid

from chatbot.agents.shared.ai_models import ModelType
from chatbot.api.error_handlers import register_exception_handlers
from chatbot.app_services import AppServices
from chatbot.core_api.user_admin_api import (
    AdminUserAttributeDefinition,
    AssignableAttributeDefinitionsResponse,
    AssignableRole,
    AssignableRolesResponse,
    LocalizedText,
    RoleReference,
    UserAdminApi,
)
from chatbot.openapi.generated.routers import user_groups
from chatbot.operations.user_group_rules.structured_output import (
    AssignmentRule,
    AssignmentRuleCondition,
    ConditionType,
    GenerateAssignmentRulesError,
    GenerateAssignmentRulesResult,
    GenerateAssignmentRulesSuccess,
)
from chatbot.util.permission_service import MissingUserGroupPermissionException, PermissionService

TEST_TENANT = "test-tenant"
TEST_USER_ID = deterministic_uuid("test-user")
TEST_GROUP_ID = UUID(deterministic_uuid("test-group"))


@pytest_asyncio.fixture
async def permission_service():
    mock_service = AsyncMock(spec=PermissionService)
    mock_service.check_user_group_permission.return_value = None
    return mock_service


@pytest.mark.asyncio
async def test_generate_assignment_rules_success(permission_service):
    async with create_test_client(permission_service, agent_success()) as client:
        response = await post_generate_assignment_rules(client, "Create rules for managers")

    assert response.status_code == 200
    assert response.json() == snapshot(
        {
            "status": "SUCCESS",
            "rules": [
                {
                    "role_id": "b4c79033-5f33-5ee8-bb33-d816e7c5f269",
                    "role": {
                        "id": "b4c79033-5f33-5ee8-bb33-d816e7c5f269",
                        "title": {"language": "en", "text": "Manager"},
                        "type": "CUSTOM",
                        "predefined_role_type": None,
                        "scope": "USER_GROUP",
                        "permission_count": 10,
                        "actions": None,
                    },
                    "conditions": [
                        {
                            "type": "ATTRIBUTE_ANY_OF",
                            "attribute_definition_id": "ff398a7d-70e9-54ba-9178-5aaa47bf68a4",
                            "attribute_definition_reference": {
                                "id": "ff398a7d-70e9-54ba-9178-5aaa47bf68a4",
                                "title": {"language": "en", "text": "Department"},
                                "technical_name": "department",
                                "user_permission": "VIEW",
                                "attribute_type": "TEXT",
                                "predefined": False,
                            },
                            "values": [{"value": "Sales"}],
                        }
                    ],
                }
            ],
        }
    )


@pytest.mark.asyncio
async def test_generate_assignment_rules_error_response(permission_service):
    async with create_test_client(permission_service, agent_error("Cannot create rules")) as client:
        response = await post_generate_assignment_rules(client, "Invalid prompt")

    assert response.status_code == 200
    assert response.json() == snapshot({"status": "ERROR", "error_message": "Cannot create rules"})


@pytest.mark.asyncio
async def test_generate_assignment_rules_permission_denied():
    permission_service = AsyncMock(spec=PermissionService)
    permission_service.check_user_group_permission.side_effect = MissingUserGroupPermissionException(TEST_USER_ID, TEST_TENANT, "USER_GROUP:MANAGE_RULES", TEST_GROUP_ID)

    async with create_test_client(permission_service, agent_success()) as client:
        response = await post_generate_assignment_rules(client, "Create rules for managers")

    assert response.status_code == 403
    assert response.json() == snapshot({"detail": "Missing user group permission [USER_GROUP:MANAGE_RULES]"})


@pytest.mark.asyncio
async def test_generate_assignment_rules_checks_user_group_permission(permission_service):
    async with create_test_client(permission_service, agent_success()) as client:
        await post_generate_assignment_rules(client, "Create rules for managers")

    permission_service.check_user_group_permission.assert_called_once()
    call_args = permission_service.check_user_group_permission.call_args
    auth, user_group_id, permission = call_args[0]

    assert auth.tenant == TEST_TENANT
    assert auth.user_id == TEST_USER_ID
    assert user_group_id == TEST_GROUP_ID
    assert permission == "USER_GROUP:MANAGE_RULES"


@pytest.mark.asyncio
async def test_generate_assignment_rules_invalid_role_id(permission_service):
    async with create_test_client(permission_service, agent_success(role_id="invalid-role")) as client:
        response = await post_generate_assignment_rules(client, "Create rules")

    assert response.status_code == 500
    assert response.json() == snapshot({"error": "Internal server error", "status_code": 500})


@pytest.mark.asyncio
async def test_generate_assignment_rules_invalid_attribute_technical_name(permission_service):
    async with create_test_client(permission_service, agent_success(attribute_technical_name="invalid")) as client:
        response = await post_generate_assignment_rules(client, "Create rules")

    assert response.status_code == 500
    assert response.json() == snapshot({"error": "Internal server error", "status_code": 500})


SAMPLE_ATTRIBUTE_DEFINITIONS = AssignableAttributeDefinitionsResponse(
    definitions=[
        AdminUserAttributeDefinition(
            id=deterministic_uuid("attr-department"),
            title=LocalizedText(language="en", text="Department"),
            technical_name="department",
            user_permission="VIEW",
            attribute_type="TEXT",
            predefined=False,
        ),
        AdminUserAttributeDefinition(
            id=deterministic_uuid("attr-location"),
            title=LocalizedText(language="en", text="Location"),
            technical_name="location",
            user_permission="VIEW",
            attribute_type="TEXT",
            predefined=False,
        ),
    ]
)

SAMPLE_ASSIGNABLE_ROLES = AssignableRolesResponse(
    assignable_roles=[
        AssignableRole(
            role_id=deterministic_uuid("role-manager"),
            role=RoleReference(
                id=deterministic_uuid("role-manager"),
                title=LocalizedText(language="en", text="Manager"),
                type="CUSTOM",
                predefined_role_type=None,
                scope="USER_GROUP",
                permission_count=10,
            ),
        ),
        AssignableRole(
            role_id=deterministic_uuid("role-member"),
            role=RoleReference(
                id=deterministic_uuid("role-member"),
                title=LocalizedText(language="en", text="Member"),
                type="PREDEFINED",
                predefined_role_type="USER_GROUP_MEMBER",
                scope="USER_GROUP",
                permission_count=5,
            ),
        ),
    ]
)


def agent_success(role_id: str = deterministic_uuid("role-manager"), attribute_technical_name: str = "department") -> GenerateAssignmentRulesResult:
    return GenerateAssignmentRulesResult(
        result=GenerateAssignmentRulesSuccess(
            status="SUCCESS",
            rules=[
                AssignmentRule(
                    role_id=role_id,
                    conditions=[
                        AssignmentRuleCondition(
                            type=ConditionType.ATTRIBUTE_ANY_OF,
                            attribute_technical_name=attribute_technical_name,
                            values=["Sales"],
                        )
                    ],
                )
            ],
        )
    )


def agent_error(error_message: str) -> GenerateAssignmentRulesResult:
    return GenerateAssignmentRulesResult(result=GenerateAssignmentRulesError(status="ERROR", error_message=error_message))


@asynccontextmanager
async def create_test_client(
    permission_service: AsyncMock,
    agent_result: GenerateAssignmentRulesResult,
) -> AsyncGenerator[httpx.AsyncClient]:
    mock_user_admin_api = AsyncMock(spec=UserAdminApi)
    mock_user_admin_api.list_assignable_attribute_definitions.return_value = SAMPLE_ATTRIBUTE_DEFINITIONS
    mock_user_admin_api.list_assignable_roles.return_value = SAMPLE_ASSIGNABLE_ROLES

    test_model = TestModel(custom_output_args=agent_result.model_dump())

    app = FastAPI()
    app.include_router(user_groups.router)
    register_exception_handlers(app)

    mock_app_services = Mock(spec=AppServices)
    mock_app_services.permission_service = permission_service
    mock_app_services.http_client = AsyncMock()
    mock_app_services.settings = Mock()
    mock_app_services.models = {model_type: test_model for model_type in ModelType}

    @app.middleware("http")
    async def add_app_services(request: Request, call_next):
        request.state.app_services = mock_app_services
        return await call_next(request)

    with patch("chatbot.openapi.impl.usergroups_service_impl.UserAdminApi", return_value=mock_user_admin_api):
        async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://test") as client:
            yield client


async def post_generate_assignment_rules(client: httpx.AsyncClient, prompt: str) -> httpx.Response:
    headers = {"Authorization": f"Bearer {create_test_jwt(TEST_TENANT, TEST_USER_ID)}"}
    return await client.post(
        f"/api/admin/users/v4/user-groups/{TEST_GROUP_ID}/assignment-rules/generate",
        headers=headers,
        json={"prompt": prompt},
    )
