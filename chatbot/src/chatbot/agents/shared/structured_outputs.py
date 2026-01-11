from pydantic import BaseModel, Field

import chatbot.utils as utils


class ChatHistoryTitle(BaseModel):
    """Given the chat history, determine the title of the chat"""

    title: str = Field(description="The title of the chat history, based on the chat history. Should at most be 4 words long.")


class ContextUsageResult(BaseModel):
    """Result for a single context in listwise filtering"""

    index: int = Field(description="Index of the context in the original list (1-based)")
    context_was_used: bool = Field(description="Whether this context was used to generate the answer")


class ListwiseContextUsage(BaseModel):
    """Listwise determination of which contexts were used to generate an answer"""

    used_contexts: list[ContextUsageResult] = Field(description="List of contexts and whether they were used. MUST include exactly one entry for each input context, with indices 1 to N.")


def validate_context_usage_output(usage: ListwiseContextUsage, expected_count: int) -> list[ContextUsageResult]:
    return utils.validate_listwise_output(usage.used_contexts, expected_count, "context")
