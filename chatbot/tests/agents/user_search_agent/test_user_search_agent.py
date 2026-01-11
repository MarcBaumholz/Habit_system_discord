import pytest

from chatbot.agents.user_search_agent.state import UserSearchAgentState
from chatbot.api_clients.user_api import User, UserAttribute


@pytest.mark.asyncio
async def test_user_search_state_add_users_deduplicates():
    state = UserSearchAgentState(query="test", users=[], messages=[], iteration=0)

    state.add_users(
        [
            User(id="user1", first_name="John", last_name="Doe", user_attributes=[UserAttribute(name="department", value="Engineering")]),
        ]
    )

    state.add_users(
        [
            User(id="user1", first_name="John", last_name="Doe", user_attributes=[UserAttribute(name="team", value="Backend")]),
        ]
    )

    assert len(state.users) == 1
    assert len(state.users[0].user_attributes) == 2


@pytest.mark.asyncio
async def test_user_search_state_add_users_merges_attributes():
    state = UserSearchAgentState(query="test", users=[], messages=[], iteration=0)

    user1 = User(id="user1", first_name="John", last_name="Doe", user_attributes=[UserAttribute(name="department", value="Engineering")])
    state.users = [user1]

    state.add_users(
        [
            User(
                id="user1",
                first_name="John",
                last_name="Doe",
                user_attributes=[
                    UserAttribute(name="team", value="Backend"),
                    UserAttribute(name="location", value="Berlin"),
                ],
            ),
        ]
    )

    assert len(state.users) == 1
    user = state.users[0]
    assert len(user.user_attributes) == 3
    attr_names = {attr.name for attr in user.user_attributes}
    assert attr_names == {"department", "team", "location"}


@pytest.mark.asyncio
async def test_user_search_state_add_users_does_not_duplicate_attributes():
    state = UserSearchAgentState(query="test", users=[], messages=[], iteration=0)

    user1 = User(id="user1", first_name="John", last_name="Doe", user_attributes=[UserAttribute(name="department", value="Engineering")])
    state.users = [user1]

    state.add_users(
        [
            User(
                id="user1",
                first_name="John",
                last_name="Doe",
                user_attributes=[
                    UserAttribute(name="department", value="Engineering"),
                ],
            ),
        ]
    )

    assert len(state.users) == 1
    user = state.users[0]
    assert len(user.user_attributes) == 1
    assert user.user_attributes[0].name == "department"


@pytest.mark.asyncio
async def test_user_search_state_add_users_adds_new_users():
    state = UserSearchAgentState(query="test", users=[], messages=[], iteration=0)

    state.add_users(
        [
            User(id="user1", first_name="John", last_name="Doe", user_attributes=[]),
            User(id="user2", first_name="Jane", last_name="Smith", user_attributes=[]),
        ]
    )

    assert len(state.users) == 2
    assert state.users[0].id == "user1"
    assert state.users[1].id == "user2"


@pytest.mark.asyncio
async def test_user_search_state_find_user():
    state = UserSearchAgentState(query="test", users=[], messages=[], iteration=0)

    user1 = User(id="user1", first_name="John", last_name="Doe", user_attributes=[])
    user2 = User(id="user2", first_name="Jane", last_name="Smith", user_attributes=[])
    state.users = [user1, user2]

    found = state._find_user("user1")
    assert found is not None
    assert found.id == "user1"

    not_found = state._find_user("user3")
    assert not_found is None


@pytest.mark.asyncio
async def test_user_search_state_merge_user_attributes():
    state = UserSearchAgentState(query="test", users=[], messages=[], iteration=0)

    existing_user = User(
        id="user1",
        first_name="John",
        last_name="Doe",
        user_attributes=[
            UserAttribute(name="department", value="Engineering"),
            UserAttribute(name="team", value="Backend"),
        ],
    )
    state.users = [existing_user]

    new_user = User(
        id="user1",
        first_name="John",
        last_name="Doe",
        user_attributes=[
            UserAttribute(name="team", value="Backend"),
            UserAttribute(name="location", value="Berlin"),
            UserAttribute(name="role", value="Engineer"),
        ],
    )

    state._merge_user_attributes(existing_user, new_user)

    assert len(existing_user.user_attributes) == 4
    attr_names = {attr.name for attr in existing_user.user_attributes}
    assert attr_names == {"department", "team", "location", "role"}
