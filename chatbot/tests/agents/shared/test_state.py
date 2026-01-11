from dataclasses import asdict

from chatbot.agents.shared.state import AgentState
from chatbot.pydantic_models import ToolCall


class TestAgentStateToolCalls:
    def test_empty_state(self):
        state = AgentState()
        assert state.tool_calls == []
        assert state.get_number_of_tool_calls("any_tool") == 0

    def test_single_tool_call(self):
        tool_call = ToolCall(name="search_documents", parameters={"query": "test query", "limit": 10})
        state = AgentState(tool_calls=[tool_call])

        assert len(state.tool_calls) == 1
        assert state.tool_calls[0].name == "search_documents"
        assert state.tool_calls[0].parameters == {"query": "test query", "limit": 10}
        assert state.get_number_of_tool_calls("search_documents") == 1
        assert state.get_number_of_tool_calls("other_tool") == 0

    def test_multiple_different_tool_calls(self):
        tool_calls = [
            ToolCall(name="search_documents", parameters={"query": "test"}),
            ToolCall(name="get_user", parameters={"id": "123"}),
            ToolCall(name="search_documents", parameters={"query": "test2"}),
            ToolCall(name="create_document", parameters={"title": "Doc"}),
        ]
        state = AgentState(tool_calls=tool_calls)

        assert len(state.tool_calls) == 4
        assert state.tool_calls[0].name == "search_documents"
        assert state.tool_calls[1].name == "get_user"
        assert state.tool_calls[2].name == "search_documents"
        assert state.get_number_of_tool_calls("search_documents") == 2
        assert state.get_number_of_tool_calls("get_user") == 1
        assert state.get_number_of_tool_calls("create_document") == 1
        assert state.get_number_of_tool_calls("other_tool") == 0

    def test_same_tool_called_multiple_times(self):
        tool_calls = [
            ToolCall(name="search_documents", parameters={"query": "query1"}),
            ToolCall(name="search_documents", parameters={"query": "query2"}),
            ToolCall(name="search_documents", parameters={"query": "query3"}),
        ]
        state = AgentState(tool_calls=tool_calls)

        assert len(state.tool_calls) == 3
        assert all(tc.name == "search_documents" for tc in state.tool_calls)
        assert state.tool_calls[0].parameters["query"] == "query1"
        assert state.tool_calls[1].parameters["query"] == "query2"
        assert state.tool_calls[2].parameters["query"] == "query3"
        assert state.get_number_of_tool_calls("search_documents") == 3

    def test_tool_call_with_empty_parameters(self):
        tool_call = ToolCall(name="reset_state", parameters={})
        state = AgentState(tool_calls=[tool_call])

        assert len(state.tool_calls) == 1
        assert state.tool_calls[0].name == "reset_state"
        assert state.tool_calls[0].parameters == {}
        assert state.get_number_of_tool_calls("reset_state") == 1

    def test_complex_nested_parameters(self):
        complex_params = {
            "filters": {
                "category": "documents",
                "tags": ["important", "urgent"],
                "metadata": {"created_by": "user123", "date_range": {"start": "2024-01-01", "end": "2024-12-31"}},
            },
            "options": {"limit": 50, "sort": "relevance"},
        }
        tool_call = ToolCall(name="advanced_search", parameters=complex_params)
        state = AgentState(tool_calls=[tool_call])

        assert len(state.tool_calls) == 1
        assert state.tool_calls[0].name == "advanced_search"
        assert state.tool_calls[0].parameters == complex_params
        assert state.get_number_of_tool_calls("advanced_search") == 1

    def test_tool_calls_field_is_serializable(self):
        tool_calls = [
            ToolCall(name="search_documents", parameters={"query": "test"}),
            ToolCall(name="get_user", parameters={"id": "123"}),
        ]
        state = AgentState(query="test query", tool_calls=tool_calls, iteration=1)

        serialized_state = asdict(state)

        assert "tool_calls" in serialized_state
        assert len(serialized_state["tool_calls"]) == 2
        assert serialized_state["tool_calls"][0].name == "search_documents"
        assert serialized_state["tool_calls"][0].parameters == {"query": "test"}
        assert serialized_state["tool_calls"][1].name == "get_user"
        assert serialized_state["tool_calls"][1].parameters == {"id": "123"}
