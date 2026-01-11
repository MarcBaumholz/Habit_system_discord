from unittest.mock import AsyncMock

import pytest

from chatbot.agents.user_search_agent.tools import (
    get_user_attribute_definitions,
    search_users_by_attribute,
    search_users_by_name,
)
from chatbot.api_clients.user_api import (
    LocalizedText,
    User,
    UserAttribute,
    UserAttributeDefinition,
    UserAttributeDefinitionsResponse,
    UserCoreApi,
)


@pytest.mark.asyncio
async def test_get_user_attribute_definitions_success(mock_run_context_bearer_auth, monkeypatch):
    mock_api = AsyncMock(spec=UserCoreApi)
    mock_api.get_user_attribute_definitions.return_value = UserAttributeDefinitionsResponse(
        definitions=[
            UserAttributeDefinition(title=LocalizedText(language="en", text="Department"), technical_name="department", user_permission="VIEW"),
            UserAttributeDefinition(title=LocalizedText(language="en", text="Team"), technical_name="team", user_permission="EDIT"),
            UserAttributeDefinition(title=LocalizedText(language="en", text="Secret Field"), technical_name="secret", user_permission="HIDDEN"),
        ]
    )

    monkeypatch.setattr("chatbot.agents.user_search_agent.tools.UserCoreApi", lambda *args: mock_api)

    result = await get_user_attribute_definitions(mock_run_context_bearer_auth)

    assert "Attribute Definitions:" in result
    assert "Name: Department; Technical Name: department" in result
    assert "Name: Team; Technical Name: team" in result
    assert "Secret Field" not in result
    mock_api.get_user_attribute_definitions.assert_called_once_with(mock_run_context_bearer_auth.deps.deps.auth)


@pytest.mark.asyncio
async def test_search_users_by_name_success(mock_run_context_bearer_auth, monkeypatch):
    mock_api = AsyncMock(spec=UserCoreApi)
    mock_api.search_users.return_value = [
        User(
            id="user1",
            first_name="John",
            last_name="Doe",
            user_attributes=[
                UserAttribute(name="department", value="Engineering"),
                UserAttribute(name="team", value="Backend"),
            ],
        ),
        User(
            id="user2",
            first_name="Jane",
            last_name="Smith",
            user_attributes=[
                UserAttribute(name="department", value="Marketing"),
                UserAttribute(name="role", value="Manager"),
            ],
        ),
    ]

    monkeypatch.setattr("chatbot.agents.user_search_agent.tools.UserCoreApi", lambda *args: mock_api)

    result = await search_users_by_name(mock_run_context_bearer_auth, "John", include_attributes=["department", "team"])

    assert "**Found 2 user(s)**:" in result
    assert "- John Doe" in result
    assert "- Jane Smith" in result
    assert "  - department: Engineering" in result
    assert "team: Backend" in result
    assert "department: Marketing" in result

    mock_api.search_users.assert_called_once_with(auth=mock_run_context_bearer_auth.deps.deps.auth, query="John", order_by=None, max_results=100)


@pytest.mark.asyncio
@pytest.mark.parametrize(
    "sort_by,expected_order_by",
    [
        (["first_name"], ["USER_FIRST_NAME_ASC"]),
        (["first_name", "last_name"], ["USER_FIRST_NAME_ASC", "USER_LAST_NAME_ASC"]),
    ],
)
async def test_search_users_by_name_with_sorting(mock_run_context_bearer_auth, monkeypatch, sort_by, expected_order_by):
    mock_api = AsyncMock(spec=UserCoreApi)
    mock_api.search_users.return_value = [
        User(id="user3", first_name="Alice", last_name="Anderson", user_attributes=[]),
        User(id="user4", first_name="Bob", last_name="Brown", user_attributes=[]),
    ]

    monkeypatch.setattr("chatbot.agents.user_search_agent.tools.UserCoreApi", lambda *args: mock_api)

    result = await search_users_by_name(mock_run_context_bearer_auth, "A", sort_by=sort_by)

    assert "**Found 2 user(s)**:" in result
    assert "- Alice Anderson" in result
    assert "- Bob Brown" in result

    mock_api.search_users.assert_called_once_with(
        auth=mock_run_context_bearer_auth.deps.deps.auth,
        query="A",
        order_by=expected_order_by,
        max_results=100,
    )


@pytest.mark.asyncio
async def test_search_users_by_name_no_results(mock_run_context_bearer_auth, monkeypatch):
    mock_api = AsyncMock(spec=UserCoreApi)
    mock_api.search_users.return_value = []

    monkeypatch.setattr("chatbot.agents.user_search_agent.tools.UserCoreApi", lambda *args: mock_api)

    result = await search_users_by_name(mock_run_context_bearer_auth, "NonexistentUser")

    assert result == "No users found"
    mock_api.search_users.assert_called_once_with(auth=mock_run_context_bearer_auth.deps.deps.auth, query="NonexistentUser", order_by=None, max_results=100)


@pytest.mark.asyncio
async def test_search_users_by_attribute_success(mock_run_context_bearer_auth, monkeypatch):
    mock_api = AsyncMock(spec=UserCoreApi)
    mock_api.search_users.return_value = [
        User(
            id="user5",
            first_name="Alice",
            last_name="Johnson",
            user_attributes=[
                UserAttribute(name="department", value="Engineering"),
                UserAttribute(name="location", value="Berlin"),
            ],
        ),
        User(
            id="user6",
            first_name="Bob",
            last_name="Smith",
            user_attributes=[
                UserAttribute(name="department", value="Engineering"),
                UserAttribute(name="location", value="Munich"),
            ],
        ),
    ]

    monkeypatch.setattr("chatbot.agents.user_search_agent.tools.UserCoreApi", lambda *args: mock_api)

    result = await search_users_by_attribute(
        mock_run_context_bearer_auth,
        attribute_name="department",
        attribute_value="Engineering",
        include_attributes=["location"],
    )

    assert "**Found 2 user(s)**:" in result
    assert "- Alice Johnson" in result
    assert "- Bob Smith" in result
    assert "  - location: Berlin" in result
    assert "  - location: Munich" in result

    mock_api.search_users.assert_called_once_with(
        auth=mock_run_context_bearer_auth.deps.deps.auth,
        attribute_technical_name="department",
        attribute_value="Engineering",
        order_by=None,
        max_results=100,
    )


@pytest.mark.asyncio
async def test_search_users_by_attribute_with_sorting(mock_run_context_bearer_auth, monkeypatch):
    mock_api = AsyncMock(spec=UserCoreApi)
    mock_api.search_users.return_value = [
        User(id="user7", first_name="Charlie", last_name="Brown", user_attributes=[UserAttribute(name="role", value="Developer")]),
    ]

    monkeypatch.setattr("chatbot.agents.user_search_agent.tools.UserCoreApi", lambda *args: mock_api)

    result = await search_users_by_attribute(
        mock_run_context_bearer_auth,
        attribute_name="role",
        attribute_value="Developer",
        sort_by=["department"],
    )

    assert "**Found 1 user(s)**:" in result
    assert "- Charlie Brown" in result

    mock_api.search_users.assert_called_once_with(
        auth=mock_run_context_bearer_auth.deps.deps.auth,
        attribute_technical_name="role",
        attribute_value="Developer",
        order_by=["USER_DEPARTMENT_ASC"],
        max_results=100,
    )


@pytest.mark.asyncio
async def test_search_users_by_attribute_no_results(mock_run_context_bearer_auth, monkeypatch):
    mock_api = AsyncMock(spec=UserCoreApi)
    mock_api.search_users.return_value = []

    monkeypatch.setattr("chatbot.agents.user_search_agent.tools.UserCoreApi", lambda *args: mock_api)

    result = await search_users_by_attribute(
        mock_run_context_bearer_auth,
        attribute_name="department",
        attribute_value="NonexistentDept",
    )

    assert result == "No users found matching the specified attribute filter"
    mock_api.search_users.assert_called_once_with(
        auth=mock_run_context_bearer_auth.deps.deps.auth,
        attribute_technical_name="department",
        attribute_value="NonexistentDept",
        order_by=None,
        max_results=100,
    )
