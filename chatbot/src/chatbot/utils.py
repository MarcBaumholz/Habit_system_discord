import json
import logging
from typing import Any, Protocol

import httpx
from pydantic_ai import Agent, ModelRetry, _agent_graph
from pydantic_ai.messages import (
    ModelMessage,
    ModelRequest,
    ModelResponse,
    TextPart,
    ToolCallPart,
    ToolReturnPart,
    UserPromptPart,
)
from pydantic_graph import End

from chatbot.api_clients.ask_ai_settings import AskAiSettingsCoreApi
from chatbot.config import Settings
from chatbot.pydantic_models import CompanyInfoData, Document, ToolCall

_logger = logging.getLogger(__name__)


def get_message_from_node(node: _agent_graph.AgentNode[Any, Any] | End[Any]) -> ModelMessage | None:
    if Agent.is_model_request_node(node):
        return node.request
    elif Agent.is_call_tools_node(node):
        return node.model_response
    return None


def extract_tool_calls_from_message(message: ModelResponse) -> list[ToolCall]:
    tool_calls = []
    for part in message.parts:
        if isinstance(part, ToolCallPart):
            parameters = part.args
            if isinstance(parameters, str):
                try:
                    parameters = json.loads(parameters)
                except json.JSONDecodeError:
                    _logger.error(f"Failed to decode JSON from tool arguments: {parameters}")
                    continue
            tool_calls.append(ToolCall(name=part.tool_name, parameters=parameters))
    return tool_calls


class HasIndex(Protocol):
    index: int


def validate_listwise_output[T: HasIndex](items: list[T], expected_count: int, item_type: str = "item") -> list[T]:
    actual_indices = {item.index for item in items}
    expected_indices = set(range(1, expected_count + 1))

    if len(items) != expected_count:
        raise ModelRetry(f"Expected {expected_count} {item_type}s, got {len(items)}. Please provide exactly {expected_count} {item_type}s.")

    missing_indices = expected_indices - actual_indices
    if missing_indices:
        raise ModelRetry(f"Missing {item_type} indices: {sorted(missing_indices)}. Please include {item_type}s for all indices 1 to {expected_count}.")

    invalid_indices = actual_indices - expected_indices
    if invalid_indices:
        raise ModelRetry(f"Invalid {item_type} indices: {sorted(invalid_indices)}. Valid indices are 1 to {expected_count}.")

    indices_list = [item.index for item in items]
    if len(indices_list) != len(set(indices_list)):
        duplicates = [idx for idx in indices_list if indices_list.count(idx) > 1]
        raise ModelRetry(f"Duplicate {item_type} indices found: {sorted(set(duplicates))}. Each {item_type} index must appear exactly once.")

    return items


def doc_2_string(doc: Document) -> str:
    meta = doc.metadata
    metadata_string = f"Title: {meta.title}\nSource: {meta.source}\nLast Time Edited: {meta.last_edited_time}\nScore: {meta.total_score}"
    doc_string = f"{metadata_string}\n{doc.page_content}"
    return doc_string


async def prepare_agent_inputs(
    chat_history: list[dict[str, str]],
    config: Settings,
    async_client: httpx.AsyncClient,
    tenant: str,
    query: str,
) -> tuple[CompanyInfoData, list[ModelMessage]]:
    """
    Fetches company info, truncates chat history, and converts it to pydantic-ai messages.
    Optionally appends the current user query to the messages.
    """
    ask_ai_settings_client = AskAiSettingsCoreApi(async_client, config)
    company_info = await ask_ai_settings_client.get_settings(tenant)

    if len(chat_history) > config.truncate_chat_history_limit:
        chat_history = chat_history[-config.truncate_chat_history_limit :]

    messages = dict_2_chat_history(chat_history)
    messages.append(ModelRequest(parts=[UserPromptPart(content=query)]))

    return company_info, messages


def dict_2_chat_history(chat_history: list[dict[str, str]]) -> list[ModelMessage]:
    """Converts a list of dictionaries (role: message) into pydantic-ai Message objects."""
    formatted_chat_history: list[ModelMessage] = []
    for interaction in chat_history:
        for role, message_content in interaction.items():
            role_lower = role.lower()
            if role_lower in ("human", "user"):
                formatted_chat_history.append(ModelRequest(parts=[UserPromptPart(content=message_content)]))
            elif role_lower == "ai":
                formatted_chat_history.append(ModelResponse(parts=[TextPart(content=message_content)]))
            elif role_lower == "tool":
                if isinstance(message_content, dict) and "content" in message_content and "tool_call_id" in message_content and "tool_name" in message_content:
                    formatted_chat_history.append(ModelRequest(parts=[ToolReturnPart(content=message_content["content"], tool_call_id=message_content["tool_call_id"], tool_name=message_content["tool_name"])]))
                else:
                    raise ValueError("Tool message must be a dict with 'content', 'tool_call_id', and 'tool_name'")
            elif role_lower == "system":
                _logger.warning("System messages in chat_history are not converted to pydantic-ai messages and are skipped.")

    return formatted_chat_history


def remove_markdown_from_string(string: str) -> str:
    return string.replace("*", "")


def chat_history_2_str(messages: list[ModelMessage]) -> str:
    formatted_history = []

    for message in messages:
        if isinstance(message, ModelRequest):
            for request_part in message.parts:
                if isinstance(request_part, UserPromptPart):
                    formatted_history.append(f"User: {request_part.content}")
                elif isinstance(request_part, ToolReturnPart):
                    formatted_history.append(f"Tool ({request_part.tool_name}): {request_part.content}")
        elif isinstance(message, ModelResponse):
            for response_part in message.parts:
                if isinstance(response_part, TextPart):
                    formatted_history.append(f"Assistant: {response_part.content}")
                elif isinstance(response_part, ToolCallPart):
                    args_str = json.dumps(response_part.args) if isinstance(response_part.args, dict) else str(response_part.args)
                    formatted_history.append(f"Tool Call ({response_part.tool_name}): {args_str}")

    return "\n\n".join(formatted_history)
