from unittest.mock import MagicMock

import pytest
from pydantic_graph import GraphRunContext

from chatbot.agents.user_search_agent.state import UserSearchAgentDependencies, UserSearchAgentState
from chatbot.util.auth import FlipBearerAuth


@pytest.fixture
def user_search_agent_state():
    return UserSearchAgentState(
        query="test query",
        messages=[],
        answer="",
        iteration=0,
        users=[],
    )


@pytest.fixture
def mock_run_context_bearer_auth(user_search_agent_state, base_dependencies):
    dependencies = UserSearchAgentDependencies(**base_dependencies)
    dependencies.auth = FlipBearerAuth(token="test_token", tenant="test_tenant", user_id="test_user")
    graph_run_context = GraphRunContext(state=user_search_agent_state, deps=dependencies)
    mock_run_ctx = MagicMock()
    mock_run_ctx.deps = graph_run_context
    return mock_run_ctx
