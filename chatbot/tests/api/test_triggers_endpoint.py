from unittest.mock import AsyncMock, Mock

import httpx
import pytest
import pytest_asyncio
from dirty_equals import IsAnyStr, IsDatetime
from fastapi import FastAPI, Request
from inline_snapshot import snapshot
from tests.utils import create_test_jwt, deterministic_timestamp, deterministic_uuid

from chatbot.api.error_handlers import register_exception_handlers
from chatbot.app_services import AppServices
from chatbot.config import DatabaseSettings
from chatbot.database.database_service import DatabaseService
from chatbot.database.tables import TriggerStatus, triggers
from chatbot.openapi.generated.routers import ask_ai
from chatbot.util.permission_service import PermissionService


@pytest_asyncio.fixture
async def database_service(postgres_container):
    db_settings = DatabaseSettings(
        postgres_host=postgres_container.get_container_host_ip(),
        postgres_port=postgres_container.get_exposed_port(5432),
        postgres_database=postgres_container.dbname,
        postgres_username=postgres_container.username,
        postgres_password=postgres_container.password,
    )

    async with DatabaseService(db_settings) as service:
        await service.run_migrations()
        yield service


@pytest_asyncio.fixture
async def mock_permission_service():
    mock_service = AsyncMock(spec=PermissionService)
    mock_service.check_permission.return_value = None
    return mock_service


@pytest_asyncio.fixture
async def test_client(database_service, mock_permission_service):
    app = FastAPI()
    app.include_router(ask_ai.router)
    register_exception_handlers(app)

    mock_app_services = Mock(spec=AppServices)
    mock_app_services.database_service = database_service
    mock_app_services.permission_service = mock_permission_service

    @app.middleware("http")
    async def add_app_services(request: Request, call_next):
        request.state.app_services = mock_app_services
        return await call_next(request)

    async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://test") as client:
        yield client


@pytest.mark.asyncio
async def test_list_triggers_success(test_client, database_service):
    # Given
    test_tenant = "test-tenant"
    base_time = deterministic_timestamp()
    trigger_ids = [
        deterministic_uuid("trigger-1"),
        deterministic_uuid("trigger-2"),
        deterministic_uuid("trigger-3"),
        deterministic_uuid("trigger-4"),
        deterministic_uuid("trigger-5"),
    ]
    updated_by_id = deterministic_uuid("updated-by")

    async with database_service.engine.begin() as conn:
        await conn.execute(
            triggers.insert(),
            [
                {
                    "tenant": test_tenant,
                    "id": trigger_ids[i],
                    "name": f"Trigger {i + 1}",
                    "ai_description": f"Description {i + 1}",
                    "status": TriggerStatus.ACTIVE,
                    "created_at": base_time,
                    "updated_at": base_time,
                    "updated_by": updated_by_id,
                }
                for i in range(5)
            ],
        )

    # When
    headers = {"Authorization": f"Bearer {create_test_jwt(test_tenant)}"}
    response = await test_client.get("/api/admin/ask-ai/v4/triggers", headers=headers)

    # Then
    assert response.status_code == 200
    assert response.json() == snapshot(
        {
            "items": [
                {
                    "id": "6c76b203-f77a-5d22-ae19-c883a5962ae8",
                    "name": "Trigger 1",
                    "ai_description": "Description 1",
                    "status": "ACTIVE",
                    "actions": [],
                    "created_at": "2025-01-15T10:00:00Z",
                    "updated_at": "2025-01-15T10:00:00Z",
                },
                {
                    "id": "6e2145ce-bb40-5854-87ae-cc46e9a304f2",
                    "name": "Trigger 5",
                    "ai_description": "Description 5",
                    "status": "ACTIVE",
                    "actions": [],
                    "created_at": "2025-01-15T10:00:00Z",
                    "updated_at": "2025-01-15T10:00:00Z",
                },
                {
                    "id": "6f08f512-e687-59b2-860c-c878f557d40b",
                    "name": "Trigger 4",
                    "ai_description": "Description 4",
                    "status": "ACTIVE",
                    "actions": [],
                    "created_at": "2025-01-15T10:00:00Z",
                    "updated_at": "2025-01-15T10:00:00Z",
                },
                {
                    "id": "84dd1a77-0d8a-5798-a905-b2755c2d3e61",
                    "name": "Trigger 2",
                    "ai_description": "Description 2",
                    "status": "ACTIVE",
                    "actions": [],
                    "created_at": "2025-01-15T10:00:00Z",
                    "updated_at": "2025-01-15T10:00:00Z",
                },
                {
                    "id": "c09973c8-bf01-5919-8cbd-6121ff639778",
                    "name": "Trigger 3",
                    "ai_description": "Description 3",
                    "status": "ACTIVE",
                    "actions": [],
                    "created_at": "2025-01-15T10:00:00Z",
                    "updated_at": "2025-01-15T10:00:00Z",
                },
            ],
            "pagination": {
                "page_number": 1,
                "total_pages": 1,
                "total_elements": 5,
                "page_limit": 10,
            },
        }
    )


@pytest.mark.asyncio
async def test_list_triggers_empty(test_client, database_service):
    # Given
    test_tenant = "empty-tenant"

    # When
    headers = {"Authorization": f"Bearer {create_test_jwt(test_tenant)}"}
    response = await test_client.get("/api/admin/ask-ai/v4/triggers", headers=headers)

    # Then
    assert response.status_code == 200
    assert response.json() == snapshot(
        {
            "items": [],
            "pagination": {
                "page_number": 1,
                "total_pages": 0,
                "total_elements": 0,
                "page_limit": 10,
            },
        }
    )


@pytest.mark.asyncio
async def test_list_triggers_pagination_first_page(test_client, database_service):
    # Given
    test_tenant = "pagination-tenant"
    base_time = deterministic_timestamp()
    updated_by_id = deterministic_uuid("updated-by")

    async with database_service.engine.begin() as conn:
        await conn.execute(
            triggers.insert(),
            [
                {
                    "tenant": test_tenant,
                    "id": deterministic_uuid(f"pagination-trigger-{i}"),
                    "name": f"Trigger {i + 1}",
                    "ai_description": f"Description {i + 1}",
                    "status": TriggerStatus.ACTIVE if i % 2 == 0 else TriggerStatus.INACTIVE,
                    "created_at": base_time,
                    "updated_at": base_time,
                    "updated_by": updated_by_id,
                }
                for i in range(15)
            ],
        )

    # When
    headers = {"Authorization": f"Bearer {create_test_jwt(test_tenant)}"}
    response = await test_client.get(
        "/api/admin/ask-ai/v4/triggers?page_number=1&page_limit=10",
        headers=headers,
    )

    # Then
    assert response.status_code == 200
    assert response.json() == snapshot(
        {
            "items": [
                {
                    "id": "149ff9eb-9e09-5409-9087-66c5cfa6b7ef",
                    "name": "Trigger 7",
                    "ai_description": "Description 7",
                    "status": "ACTIVE",
                    "actions": [],
                    "created_at": "2025-01-15T10:00:00Z",
                    "updated_at": "2025-01-15T10:00:00Z",
                },
                {
                    "id": "20dadc29-ab45-5028-82af-58880cb9857c",
                    "name": "Trigger 3",
                    "ai_description": "Description 3",
                    "status": "ACTIVE",
                    "actions": [],
                    "created_at": "2025-01-15T10:00:00Z",
                    "updated_at": "2025-01-15T10:00:00Z",
                },
                {
                    "id": "6ebb0770-4d3a-572d-95e7-57e1bd22853b",
                    "name": "Trigger 15",
                    "ai_description": "Description 15",
                    "status": "ACTIVE",
                    "actions": [],
                    "created_at": "2025-01-15T10:00:00Z",
                    "updated_at": "2025-01-15T10:00:00Z",
                },
                {
                    "id": "6fabbff3-a405-51fc-91e6-b17c22448855",
                    "name": "Trigger 5",
                    "ai_description": "Description 5",
                    "status": "ACTIVE",
                    "actions": [],
                    "created_at": "2025-01-15T10:00:00Z",
                    "updated_at": "2025-01-15T10:00:00Z",
                },
                {
                    "id": "79633a3f-25b6-590e-801b-9967183c044c",
                    "name": "Trigger 13",
                    "ai_description": "Description 13",
                    "status": "ACTIVE",
                    "actions": [],
                    "created_at": "2025-01-15T10:00:00Z",
                    "updated_at": "2025-01-15T10:00:00Z",
                },
                {
                    "id": "7e78c7cc-7007-596b-be6a-8d9074f58681",
                    "name": "Trigger 6",
                    "ai_description": "Description 6",
                    "status": "INACTIVE",
                    "actions": [],
                    "created_at": "2025-01-15T10:00:00Z",
                    "updated_at": "2025-01-15T10:00:00Z",
                },
                {
                    "id": "97dc962a-0214-56f8-8a88-bae5e618cace",
                    "name": "Trigger 1",
                    "ai_description": "Description 1",
                    "status": "ACTIVE",
                    "actions": [],
                    "created_at": "2025-01-15T10:00:00Z",
                    "updated_at": "2025-01-15T10:00:00Z",
                },
                {
                    "id": "9a51804f-6a12-59ce-80ab-dd11010c9a46",
                    "name": "Trigger 10",
                    "ai_description": "Description 10",
                    "status": "INACTIVE",
                    "actions": [],
                    "created_at": "2025-01-15T10:00:00Z",
                    "updated_at": "2025-01-15T10:00:00Z",
                },
                {
                    "id": "b4713000-ac21-5a4a-a8f8-7a82e548c558",
                    "name": "Trigger 12",
                    "ai_description": "Description 12",
                    "status": "INACTIVE",
                    "actions": [],
                    "created_at": "2025-01-15T10:00:00Z",
                    "updated_at": "2025-01-15T10:00:00Z",
                },
                {
                    "id": "b6f78e31-dfca-5035-b753-1d713c850554",
                    "name": "Trigger 8",
                    "ai_description": "Description 8",
                    "status": "INACTIVE",
                    "actions": [],
                    "created_at": "2025-01-15T10:00:00Z",
                    "updated_at": "2025-01-15T10:00:00Z",
                },
            ],
            "pagination": {
                "page_number": 1,
                "total_pages": 2,
                "total_elements": 15,
                "page_limit": 10,
            },
        }
    )


@pytest.mark.asyncio
async def test_list_triggers_tenant_isolation(test_client, database_service):
    # Given
    tenant_a = "tenant-a"
    tenant_b = "tenant-b"
    base_time = deterministic_timestamp()
    updated_by_id = deterministic_uuid("updated-by")

    async with database_service.engine.begin() as conn:
        await conn.execute(
            triggers.insert(),
            [
                {
                    "tenant": tenant_a,
                    "id": deterministic_uuid(f"tenant-a-trigger-{i}"),
                    "name": f"Tenant A Trigger {i + 1}",
                    "ai_description": f"Tenant A Description {i + 1}",
                    "status": TriggerStatus.ACTIVE,
                    "created_at": base_time,
                    "updated_at": base_time,
                    "updated_by": updated_by_id,
                }
                for i in range(5)
            ],
        )

        await conn.execute(
            triggers.insert(),
            [
                {
                    "tenant": tenant_b,
                    "id": deterministic_uuid(f"tenant-b-trigger-{i}"),
                    "name": f"Tenant B Trigger {i + 1}",
                    "ai_description": f"Tenant B Description {i + 1}",
                    "status": TriggerStatus.ACTIVE,
                    "created_at": base_time,
                    "updated_at": base_time,
                    "updated_by": updated_by_id,
                }
                for i in range(7)
            ],
        )

    # When
    headers_a = {"Authorization": f"Bearer {create_test_jwt(tenant_a)}"}
    response_a = await test_client.get("/api/admin/ask-ai/v4/triggers", headers=headers_a)

    # Then
    assert response_a.status_code == 200
    assert response_a.json() == snapshot(
        {
            "items": [
                {
                    "id": "26f5b136-ba4d-5184-b47f-854cf2459f45",
                    "name": "Tenant A Trigger 1",
                    "ai_description": "Tenant A Description 1",
                    "status": "ACTIVE",
                    "actions": [],
                    "created_at": "2025-01-15T10:00:00Z",
                    "updated_at": "2025-01-15T10:00:00Z",
                },
                {
                    "id": "533f2cbe-1fb0-5aba-819a-1b48707ee25c",
                    "name": "Tenant A Trigger 4",
                    "ai_description": "Tenant A Description 4",
                    "status": "ACTIVE",
                    "actions": [],
                    "created_at": "2025-01-15T10:00:00Z",
                    "updated_at": "2025-01-15T10:00:00Z",
                },
                {
                    "id": "cdbfd3a4-420e-59f9-8abc-19a08158a73c",
                    "name": "Tenant A Trigger 2",
                    "ai_description": "Tenant A Description 2",
                    "status": "ACTIVE",
                    "actions": [],
                    "created_at": "2025-01-15T10:00:00Z",
                    "updated_at": "2025-01-15T10:00:00Z",
                },
                {
                    "id": "d23f26ba-0ad7-5023-ad75-f4aab1044b5d",
                    "name": "Tenant A Trigger 3",
                    "ai_description": "Tenant A Description 3",
                    "status": "ACTIVE",
                    "actions": [],
                    "created_at": "2025-01-15T10:00:00Z",
                    "updated_at": "2025-01-15T10:00:00Z",
                },
                {
                    "id": "ef3bc34c-c674-58f0-a924-70f55872d6fd",
                    "name": "Tenant A Trigger 5",
                    "ai_description": "Tenant A Description 5",
                    "status": "ACTIVE",
                    "actions": [],
                    "created_at": "2025-01-15T10:00:00Z",
                    "updated_at": "2025-01-15T10:00:00Z",
                },
            ],
            "pagination": {
                "page_number": 1,
                "total_pages": 1,
                "total_elements": 5,
                "page_limit": 10,
            },
        }
    )

    # When
    headers_b = {"Authorization": f"Bearer {create_test_jwt(tenant_b)}"}
    response_b = await test_client.get("/api/admin/ask-ai/v4/triggers", headers=headers_b)

    # Then
    assert response_b.status_code == 200
    assert response_b.json() == snapshot(
        {
            "items": [
                {
                    "id": "042ed43d-fe80-58c9-811f-b5ccbc53a5bf",
                    "name": "Tenant B Trigger 4",
                    "ai_description": "Tenant B Description 4",
                    "status": "ACTIVE",
                    "actions": [],
                    "created_at": "2025-01-15T10:00:00Z",
                    "updated_at": "2025-01-15T10:00:00Z",
                },
                {
                    "id": "1e87ee0c-b769-5746-9e18-6e80be65fefb",
                    "name": "Tenant B Trigger 6",
                    "ai_description": "Tenant B Description 6",
                    "status": "ACTIVE",
                    "actions": [],
                    "created_at": "2025-01-15T10:00:00Z",
                    "updated_at": "2025-01-15T10:00:00Z",
                },
                {
                    "id": "78409199-2b3a-5ba6-ad23-896a2f03ae86",
                    "name": "Tenant B Trigger 7",
                    "ai_description": "Tenant B Description 7",
                    "status": "ACTIVE",
                    "actions": [],
                    "created_at": "2025-01-15T10:00:00Z",
                    "updated_at": "2025-01-15T10:00:00Z",
                },
                {
                    "id": "c85d337b-c882-55d9-81a2-8256f0b58588",
                    "name": "Tenant B Trigger 5",
                    "ai_description": "Tenant B Description 5",
                    "status": "ACTIVE",
                    "actions": [],
                    "created_at": "2025-01-15T10:00:00Z",
                    "updated_at": "2025-01-15T10:00:00Z",
                },
                {
                    "id": "de55da49-45c3-5c6b-88a1-2c302fe0d032",
                    "name": "Tenant B Trigger 3",
                    "ai_description": "Tenant B Description 3",
                    "status": "ACTIVE",
                    "actions": [],
                    "created_at": "2025-01-15T10:00:00Z",
                    "updated_at": "2025-01-15T10:00:00Z",
                },
                {
                    "id": "ea0c42b0-4106-5003-ad3b-efe130770baf",
                    "name": "Tenant B Trigger 2",
                    "ai_description": "Tenant B Description 2",
                    "status": "ACTIVE",
                    "actions": [],
                    "created_at": "2025-01-15T10:00:00Z",
                    "updated_at": "2025-01-15T10:00:00Z",
                },
                {
                    "id": "ecb478b2-48db-5394-bb49-2fec643a037c",
                    "name": "Tenant B Trigger 1",
                    "ai_description": "Tenant B Description 1",
                    "status": "ACTIVE",
                    "actions": [],
                    "created_at": "2025-01-15T10:00:00Z",
                    "updated_at": "2025-01-15T10:00:00Z",
                },
            ],
            "pagination": {
                "page_number": 1,
                "total_pages": 1,
                "total_elements": 7,
                "page_limit": 10,
            },
        }
    )


@pytest.mark.asyncio
async def test_list_triggers_checks_permission(test_client, mock_permission_service):
    # Given
    test_tenant = "test-tenant"
    test_user_id = deterministic_uuid("test-user")

    # When
    headers = {"Authorization": f"Bearer {create_test_jwt(test_tenant, test_user_id)}"}
    await test_client.get("/api/admin/ask-ai/v4/triggers", headers=headers)

    # Then
    mock_permission_service.check_permission.assert_called_once()
    call_args = mock_permission_service.check_permission.call_args
    auth = call_args[0][0]
    permission = call_args[0][1]

    assert auth.tenant == test_tenant
    assert auth.user_id == test_user_id
    assert permission == "ASK_AI:MANAGE"


@pytest.mark.asyncio
async def test_list_triggers_permission_denied(test_client, mock_permission_service):
    from chatbot.util.permission_service import MissingPermissionException

    # Given
    test_tenant = "test-tenant"
    test_user_id = deterministic_uuid("test-user")
    mock_permission_service.check_permission.side_effect = MissingPermissionException(test_user_id, test_tenant, "ASK_AI:MANAGE")

    # When
    headers = {"Authorization": f"Bearer {create_test_jwt(test_tenant, test_user_id)}"}
    response = await test_client.get("/api/admin/ask-ai/v4/triggers", headers=headers)

    # Then
    assert response.status_code == 403
    assert response.json() == snapshot(
        {
            "detail": "Missing permission [ASK_AI:MANAGE]",
        }
    )


@pytest.mark.asyncio
async def test_create_trigger_success(test_client, database_service):
    # Given
    test_tenant = "test-tenant"
    request_data = {
        "name": "New Trigger",
        "ai_description": "This is a new trigger for testing",
        "actions": [{"action": {"action": "TRIGGER_FLIP_FLOW", "flow_id": deterministic_uuid("test-flow"), "message_id": deterministic_uuid("test-flow-message")}}],
    }

    # When
    headers = {"Authorization": f"Bearer {create_test_jwt(test_tenant)}"}
    response = await test_client.post("/api/admin/ask-ai/v4/triggers", headers=headers, json=request_data)

    # Then
    assert response.status_code == 201
    assert response.json() == snapshot(
        {
            "id": IsAnyStr(),
            "name": "New Trigger",
            "ai_description": "This is a new trigger for testing",
            "status": "ACTIVE",
            "actions": [
                {
                    "action": {
                        "action": "TRIGGER_FLIP_FLOW",
                        "flow_id": "5308e89b-9e24-59c0-bc9d-44acaeda242d",
                        "message_id": "23a54126-c651-5120-9f4f-e4477ed46953",
                    }
                }
            ],
            "created_at": IsDatetime(iso_string=True),
            "updated_at": IsDatetime(iso_string=True),
        }
    )


@pytest.mark.asyncio
async def test_create_trigger_with_status(test_client, database_service):
    # Given
    test_tenant = "test-tenant"
    request_data = {
        "name": "Inactive Trigger",
        "ai_description": "This trigger is inactive",
        "status": "INACTIVE",
        "actions": [],
    }

    # When
    headers = {"Authorization": f"Bearer {create_test_jwt(test_tenant)}"}
    response = await test_client.post("/api/admin/ask-ai/v4/triggers", headers=headers, json=request_data)

    # Then
    assert response.status_code == 201
    assert response.json() == snapshot(
        {
            "id": IsAnyStr(),
            "name": "Inactive Trigger",
            "ai_description": "This trigger is inactive",
            "status": "INACTIVE",
            "actions": [],
            "created_at": IsDatetime(iso_string=True),
            "updated_at": IsDatetime(iso_string=True),
        }
    )


@pytest.mark.asyncio
async def test_create_trigger_checks_permission(test_client, mock_permission_service):
    # Given
    test_tenant = "test-tenant"
    test_user_id = deterministic_uuid("test-user")
    request_data = {
        "name": "Permission Test Trigger",
        "ai_description": "Testing permission check",
        "actions": [],
    }

    # When
    headers = {"Authorization": f"Bearer {create_test_jwt(test_tenant, test_user_id)}"}
    await test_client.post("/api/admin/ask-ai/v4/triggers", headers=headers, json=request_data)

    # Then
    mock_permission_service.check_permission.assert_called_once()
    call_args = mock_permission_service.check_permission.call_args
    auth = call_args[0][0]
    permission = call_args[0][1]

    assert auth.tenant == test_tenant
    assert auth.user_id == test_user_id
    assert permission == "ASK_AI:MANAGE"


@pytest.mark.asyncio
async def test_create_trigger_permission_denied(test_client, mock_permission_service):
    from chatbot.util.permission_service import MissingPermissionException

    # Given
    test_tenant = "test-tenant"
    test_user_id = deterministic_uuid("test-user")
    mock_permission_service.check_permission.side_effect = MissingPermissionException(test_user_id, test_tenant, "ASK_AI:MANAGE")
    request_data = {
        "name": "Denied Trigger",
        "ai_description": "This should fail",
        "actions": [],
    }

    # When
    headers = {"Authorization": f"Bearer {create_test_jwt(test_tenant, test_user_id)}"}
    response = await test_client.post("/api/admin/ask-ai/v4/triggers", headers=headers, json=request_data)

    # Then
    assert response.status_code == 403
    assert response.json() == snapshot(
        {
            "detail": "Missing permission [ASK_AI:MANAGE]",
        }
    )
