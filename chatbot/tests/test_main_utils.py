from unittest.mock import AsyncMock

import pytest
from pydantic_ai.messages import ModelRequest, UserPromptPart

from chatbot.config import Settings
from chatbot.pydantic_models import Document, DocumentMetadata
from chatbot.utils import (
    dict_2_chat_history,
    doc_2_string,
    prepare_agent_inputs,
    remove_markdown_from_string,
)


@pytest.mark.asyncio
async def test_prepare_agent_inputs_truncation(monkeypatch):
    monkeypatch.setenv("LLM_API_KEY", "test_api_key")
    monkeypatch.setenv("LLM_API_BASE_GPT_4_1_NANO", "https://api.example.com")
    monkeypatch.setenv("LLM_API_BASE_GPT_4_1_MINI", "https://api.example.com")
    monkeypatch.setenv("LLM_API_BASE_GPT_4_1_BASE", "https://api.example.com")
    monkeypatch.setenv("AUTH_API_KEY", "test_auth_key")
    monkeypatch.setenv("CORE_URL", "https://core.example.com")
    monkeypatch.setenv("FLOWS_API_URL", "https://flows.example.com")
    monkeypatch.setenv("TRUNCATE_CHAT_HISTORY_LIMIT", "5")

    history = [{"user": f"message {i}"} for i in range(10)]
    config = Settings()
    _, messages = await prepare_agent_inputs(history, config, AsyncMock(), "test-tenant", "test-query")
    # The expected length is 6 (truncated history + query)
    assert len(messages) == 6


def test_doc_2_string():
    """Tests that a Document is correctly converted to a string."""
    doc = Document(
        page_content="This is the content.",
        metadata=DocumentMetadata(
            title="Test Title",
            source="Test Source",
            last_edited_time="2023-01-01 00:00:00",
            total_score=0.9,
        ),
    )
    expected_string = "Title: Test Title\nSource: Test Source\nLast Time Edited: 2023-01-01 00:00:00\nScore: 0.9\nThis is the content."
    assert doc_2_string(doc) == expected_string


def test_dict_2_chat_history():
    history = [{"user": "Hello"}, {"ai": "Hi there"}]
    messages = dict_2_chat_history(history)
    assert len(messages) == 2
    assert isinstance(messages[0], ModelRequest)
    assert isinstance(messages[0].parts[0], UserPromptPart)
    assert messages[0].parts[0].content == "Hello"


def test_remove_markdown_from_string():
    string = "This is a **bold** and *italic* string."
    expected_string = "This is a bold and italic string."
    assert remove_markdown_from_string(string) == expected_string
