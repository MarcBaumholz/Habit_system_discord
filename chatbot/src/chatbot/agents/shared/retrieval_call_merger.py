from pydantic_ai import CallToolsNode
from pydantic_ai.messages import ToolCallPart


def merge_retrieval_agent_calls[T, U](node: CallToolsNode[T, U]) -> CallToolsNode[T, U]:
    retrieval_agent_calls = []
    other_parts = []

    for part in node.model_response.parts:
        if isinstance(part, ToolCallPart) and part.tool_name == "call_retrieval_agent":
            retrieval_agent_calls.append(part)
        else:
            other_parts.append(part)

    if len(retrieval_agent_calls) <= 1:
        return node

    research_tasks = [call.args["research_task"] for call in retrieval_agent_calls if isinstance(call.args, dict) and "research_task" in call.args]

    merged_task = ". ".join(research_tasks)

    merged_call = ToolCallPart(tool_name="call_retrieval_agent", args={"research_task": merged_task}, tool_call_id=retrieval_agent_calls[0].tool_call_id)

    merged_parts = [merged_call] + other_parts

    node.model_response.parts = merged_parts

    return node
