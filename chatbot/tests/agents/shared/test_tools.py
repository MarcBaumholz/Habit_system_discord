from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from chatbot.agents.retrieval_agent.state import RetrievalAgentState
from chatbot.agents.retrieval_agent.subagent import RetrievalSubAgent
from chatbot.agents.shared.state import AgentGraphDependencies, OrchestrationAgentState
from chatbot.agents.shared.tools.general_purpose_tools import create_general_purpose_tools


@pytest.mark.asyncio
async def test_retrieval_subagent_tool_execution(base_dependencies):
    mock_run_context = MagicMock()
    mock_graph_ctx = MagicMock()
    mock_graph_ctx.state = OrchestrationAgentState()

    mock_graph_ctx.deps = AgentGraphDependencies(**base_dependencies)
    mock_graph_ctx.deps.app_services.settings.max_retrieval_agent_calls = 5
    mock_run_context.deps = mock_graph_ctx

    subagent = RetrievalSubAgent()

    mock_state = RetrievalAgentState(query="test query", answer="Retrieved information from the company knowledge bases: \n\n dummy content")

    with patch.object(subagent, "run", new=AsyncMock(return_value=mock_state)):
        tool = subagent.as_tool()
        result = await tool.function(mock_run_context, "test query")

        assert result.startswith("Retrieved information from the company knowledge bases:")
        assert "dummy content" in result


@pytest.mark.asyncio
async def test_retrieval_subagent_tool_no_context_found(base_dependencies):
    mock_run_context = MagicMock()
    mock_graph_ctx = MagicMock()
    mock_graph_ctx.state = OrchestrationAgentState()

    mock_graph_ctx.deps = AgentGraphDependencies(**base_dependencies)
    mock_graph_ctx.deps.app_services.settings.max_retrieval_agent_calls = 5
    mock_run_context.deps = mock_graph_ctx

    subagent = RetrievalSubAgent()

    mock_state = RetrievalAgentState(query="test query", answer="No information found in the company knowledge bases")

    with patch.object(subagent, "run", new=AsyncMock(return_value=mock_state)):
        tool = subagent.as_tool()
        result = await tool.function(mock_run_context, "test query")

        assert result == "No information found in the company knowledge bases"


def test_create_general_purpose_tools():
    toolset = create_general_purpose_tools()
    tools_list = list(toolset.tools.values())
    assert len(tools_list) == 1
    assert tools_list[0].name == "get_current_date_time"


def test_get_current_date_time_tool_execution(base_dependencies):
    mock_run_context = MagicMock()
    mock_graph_ctx = MagicMock()
    mock_graph_ctx.state = OrchestrationAgentState()
    mock_graph_ctx.deps = AgentGraphDependencies(**base_dependencies)
    mock_run_context.deps = mock_graph_ctx

    toolset = create_general_purpose_tools()
    tools_list = list(toolset.tools.values())
    result = tools_list[0].function(mock_run_context)
    assert isinstance(result, str)
    assert "date" in result.lower()
    assert "time" in result.lower()
