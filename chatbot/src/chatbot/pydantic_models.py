from datetime import UTC, datetime
from typing import Any

from pydantic import BaseModel, Field


class CompanyInfoData(BaseModel):
    company_description: str | None = Field(default=None, description="A description of the company.")
    avoid_topics: str = Field(default="Topics unrelated to work or company policies.", description="Topics that the chatbot should avoid.")
    assistant_name: str = Field(default="AI Assistant", description="The name of the chatbot assistant.")
    response_guidelines: str = Field(default="Be helpful, professional, and concise.", description="Guidelines for the chatbot's responses.")


class DocumentMetadata(BaseModel):
    id: str = Field(default="Unknown", description="The document ID.")
    chunk_id: str = Field(default="Unknown", description="The chunk ID of the document.")
    channel_id: str | None = Field(default=None, description="The channel ID of the document.")
    title: str = Field(default="Untitled", description="The title of the document.")
    source: str = Field(default="Unknown", description="The source of the document.")
    last_edited_time: datetime = Field(default_factory=lambda: datetime.now(UTC), description="The last time the document was edited.")
    retriever_score: float = Field(default=0.0, description="The score of the document by the retriever.")
    recency_decay: float | None = Field(default=None, description="The decay factor applied based on document age.")
    temporal_score: float = Field(default=0.0, description="The similarity score adjusted for recency.")
    content_relevance_score: float | None = Field(default=None, description="The content relevance score.")
    metadata_relevance_score: float | None = Field(default=None, description="The metadata relevance score.")
    total_score: float | None = Field(default=None, description="The overall score of the document.")
    search_iteration: int | None = Field(default=None, description="The search iteration number.")


class Document(BaseModel):
    page_content: str = Field(description="The content of the document.")
    metadata: DocumentMetadata = Field(default_factory=DocumentMetadata, description="The metadata of the document.")


class ToolCall(BaseModel):
    name: str = Field(description="The name of the tool being called.")
    parameters: dict[str, Any] = Field(default_factory=dict, description="The parameters passed to the tool.")
