import pytest
from pydantic_ai import CallToolsNode
from pydantic_ai.messages import ModelResponse, ToolCallPart

from chatbot.agents.shared.retrieval_call_merger import merge_retrieval_agent_calls


@pytest.mark.parametrize(
    "input_calls,expected_result_count,expected_merged_task",
    [
        # Multiple retrieval calls with other tools
        (
            [
                ToolCallPart(tool_name="call_retrieval_agent", args={"research_task": "Research vacation policy"}, tool_call_id="call1"),
                ToolCallPart(tool_name="call_retrieval_agent", args={"research_task": "Find remote work guidelines"}, tool_call_id="call2"),
                ToolCallPart(tool_name="get_current_date_time", args={}, tool_call_id="call3"),
            ],
            2,
            "Research vacation policy. Find remote work guidelines",
        ),
        # Single retrieval call
        ([ToolCallPart(tool_name="call_retrieval_agent", args={"research_task": "Research vacation policy"}, tool_call_id="call1")], 1, "Research vacation policy"),
        # No retrieval calls
        ([ToolCallPart(tool_name="get_current_date_time", args={}, tool_call_id="call1")], 1, None),
        # Empty research tasks
        ([ToolCallPart(tool_name="call_retrieval_agent", args={}, tool_call_id="call1"), ToolCallPart(tool_name="call_retrieval_agent", args={"research_task": ""}, tool_call_id="call2")], 1, ""),
        # Three retrieval calls
        (
            [
                ToolCallPart(tool_name="call_retrieval_agent", args={"research_task": "Task 1"}, tool_call_id="call1"),
                ToolCallPart(tool_name="call_retrieval_agent", args={"research_task": "Task 2"}, tool_call_id="call2"),
                ToolCallPart(tool_name="call_retrieval_agent", args={"research_task": "Task 3"}, tool_call_id="call3"),
            ],
            1,
            "Task 1. Task 2. Task 3",
        ),
    ],
)
def test_merge_retrieval_agent_calls(input_calls, expected_result_count, expected_merged_task):
    model_response = ModelResponse(parts=input_calls)
    node = CallToolsNode(model_response=model_response)

    result = merge_retrieval_agent_calls(node)

    assert len(result.model_response.parts) == expected_result_count

    if expected_merged_task is not None:
        retrieval_call = next((part for part in result.model_response.parts if isinstance(part, ToolCallPart) and part.tool_name == "call_retrieval_agent"), None)
        assert retrieval_call is not None
        assert retrieval_call.args["research_task"] == expected_merged_task
