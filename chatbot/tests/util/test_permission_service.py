from unittest.mock import AsyncMock

import pytest
from inline_snapshot import snapshot

from chatbot.api_clients.permissions import PermissionCheckResultDTO, PermissionsCoreApi
from chatbot.util.auth import FlipBearerAuth
from chatbot.util.permission_service import MissingPermissionException, PermissionService


@pytest.fixture
def mock_permissions_api():
    return AsyncMock(spec=PermissionsCoreApi)


@pytest.fixture
def permission_service(mock_permissions_api):
    return PermissionService(mock_permissions_api)


@pytest.fixture
def test_auth():
    return FlipBearerAuth(token="test_token", tenant="test_tenant", user_id="test_user")


@pytest.mark.asyncio
async def test_has_permission_returns_true_when_user_has_permission(permission_service, mock_permissions_api, test_auth):
    # Given
    mock_permissions_api.check_permission.return_value = PermissionCheckResultDTO(has_permission=True)

    # When
    result = await permission_service.has_permission(test_auth, "ASK_AI:MANAGE")

    # Then
    assert result is True
    mock_permissions_api.check_permission.assert_called_once_with("test_tenant", "test_user", "ASK_AI:MANAGE")


@pytest.mark.asyncio
async def test_has_permission_returns_false_when_user_lacks_permission(permission_service, mock_permissions_api, test_auth):
    # Given
    mock_permissions_api.check_permission.return_value = PermissionCheckResultDTO(has_permission=False)

    # When
    result = await permission_service.has_permission(test_auth, "ASK_AI:MANAGE")

    # Then
    assert result is False
    mock_permissions_api.check_permission.assert_called_once_with("test_tenant", "test_user", "ASK_AI:MANAGE")


@pytest.mark.asyncio
async def test_check_permission_succeeds_when_user_has_permission(permission_service, mock_permissions_api, test_auth):
    # Given
    mock_permissions_api.check_permission.return_value = PermissionCheckResultDTO(has_permission=True)

    # When
    await permission_service.check_permission(test_auth, "ASK_AI:MANAGE")

    # Then - no exception raised
    mock_permissions_api.check_permission.assert_called_once_with("test_tenant", "test_user", "ASK_AI:MANAGE")


@pytest.mark.asyncio
async def test_check_permission_raises_exception_when_user_lacks_permission(permission_service, mock_permissions_api, test_auth):
    # Given
    mock_permissions_api.check_permission.return_value = PermissionCheckResultDTO(has_permission=False)

    # When / Then
    with pytest.raises(MissingPermissionException) as exc_info:
        await permission_service.check_permission(test_auth, "ASK_AI:MANAGE")

    assert exc_info.value.user_id == "test_user"
    assert exc_info.value.tenant == "test_tenant"
    assert exc_info.value.permission == "ASK_AI:MANAGE"
    assert exc_info.value.message == snapshot("User test_user does not have permission ASK_AI:MANAGE in tenant test_tenant")
    mock_permissions_api.check_permission.assert_called_once_with("test_tenant", "test_user", "ASK_AI:MANAGE")


@pytest.mark.asyncio
async def test_check_permission_with_different_tenant(permission_service, mock_permissions_api):
    # Given
    different_auth = FlipBearerAuth(token="other_token", tenant="other_tenant", user_id="other_user")
    mock_permissions_api.check_permission.return_value = PermissionCheckResultDTO(has_permission=True)

    # When
    await permission_service.check_permission(different_auth, "SOME:PERMISSION")

    # Then
    mock_permissions_api.check_permission.assert_called_once_with("other_tenant", "other_user", "SOME:PERMISSION")
