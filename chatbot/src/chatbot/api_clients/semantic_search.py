import datetime

from httpx import AsyncClient
from pydantic import BaseModel

from chatbot.config import Settings
from chatbot.util.auth import FlipBearerAuth


class PostVectorSearchRequest(BaseModel):
    top: int
    query: str
    published_at_from: datetime.datetime | None = None
    published_at_to: datetime.datetime | None = None
    updated_at_from: datetime.datetime | None = None
    updated_at_to: datetime.datetime | None = None


class PostVectorSearchResponseItem(BaseModel):
    channel_id: str
    post_id: str
    title: str
    score: float
    chunk_id: str
    chunk: str
    attachment_id: str | None = None
    file_name: str | None = None
    source: str | None = None
    last_modified_at: datetime.datetime | None = None


class PostVectorSearchResponse(BaseModel):
    matches: list[PostVectorSearchResponseItem]


class PageVectorSearchRequest(BaseModel):
    top: int
    query: str
    published_at_from: datetime.datetime | None = None
    published_at_to: datetime.datetime | None = None
    updated_at_from: datetime.datetime | None = None
    updated_at_to: datetime.datetime | None = None


class PageVectorSearchResponseItem(BaseModel):
    page_id: str
    title: str
    score: float
    chunk_id: str
    chunk: str
    attachment_id: str | None = None
    file_name: str | None = None
    source: str | None = None
    last_modified_at: datetime.datetime | None = None


class PageVectorSearchResponse(BaseModel):
    matches: list[PageVectorSearchResponseItem]


class SemanticSearchCoreApi:
    def __init__(self, client: AsyncClient, settings: Settings):
        self.client = client
        self.settings = settings

    async def search_posts(self, auth: FlipBearerAuth, request: PostVectorSearchRequest) -> PostVectorSearchResponse:
        url = f"{self.settings.core_url}/api/posts/v4/posts/vector-search"
        headers = {"Authorization": f"Bearer {auth.token}", "Content-Type": "application/json", "Accept": "application/json"}

        response = await self.client.post(url, json=request.model_dump(mode="json", exclude_none=True), headers=headers)
        response.raise_for_status()

        return PostVectorSearchResponse.model_validate_json(response.text)

    async def search_pages(self, auth: FlipBearerAuth, request: PageVectorSearchRequest) -> PageVectorSearchResponse:
        url = f"{self.settings.core_url}/api/pages/v4/pages/vector-search"
        headers = {"Authorization": f"Bearer {auth.token}", "Content-Type": "application/json", "Accept": "application/json"}

        response = await self.client.post(url, json=request.model_dump(mode="json", exclude_none=True), headers=headers)
        response.raise_for_status()

        return PageVectorSearchResponse.model_validate_json(response.text)
