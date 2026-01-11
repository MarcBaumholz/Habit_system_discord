from typing import Literal

from httpx import AsyncClient
from pydantic import BaseModel, Field

from chatbot.config import Settings
from chatbot.util.auth import FlipBearerAuth

SearchUsersOrder = Literal["USER_FIRST_NAME_ASC", "USER_LAST_NAME_ASC", "USER_DEPARTMENT_ASC"]


class LocalizedText(BaseModel):
    language: str
    text: str


class UserAttributeDefinition(BaseModel):
    title: LocalizedText
    technical_name: str
    user_permission: Literal["VIEW", "EDIT", "HIDDEN"]


class UserAttributeDefinitionsResponse(BaseModel):
    definitions: list[UserAttributeDefinition] = Field(default_factory=list)


class UserAttribute(BaseModel):
    name: str
    value: str


class User(BaseModel):
    id: str
    first_name: str
    last_name: str
    user_attributes: list[UserAttribute] = Field(default_factory=list)


class UserSearchResponse(BaseModel):
    users: list[User] = Field(default_factory=list)
    next_page_cursor: str | None = None


class UserCoreApi:
    def __init__(self, client: AsyncClient, settings: Settings):
        self.client = client
        self.settings = settings

    async def get_user_attribute_definitions(self, auth: FlipBearerAuth) -> UserAttributeDefinitionsResponse:
        url = f"{self.settings.core_url}/api/users/v4/user-attribute-definitions"
        headers = {"Authorization": f"Bearer {auth.token}", "Content-Type": "application/json", "Accept": "application/json"}

        response = await self.client.get(url, headers=headers)
        response.raise_for_status()

        return UserAttributeDefinitionsResponse.model_validate_json(response.text)

    async def _search_users_single_page(
        self,
        auth: FlipBearerAuth,
        limit: int,
        query: str | None = None,
        attribute_technical_name: str | None = None,
        attribute_value: str | None = None,
        order_by: list[SearchUsersOrder] | None = None,
        page_cursor: str | None = None,
    ) -> UserSearchResponse:
        if (attribute_technical_name is None) != (attribute_value is None):
            raise ValueError("attribute_technical_name and attribute_value must both be provided or both be omitted")

        url = f"{self.settings.core_url}/api/users/v4/users"
        headers = {"Authorization": f"Bearer {auth.token}", "Content-Type": "application/json", "Accept": "application/json"}

        params: dict[str, str | list[SearchUsersOrder]] = {
            "page_limit": str(limit),
        }
        if query is not None:
            params["search"] = query

        if attribute_technical_name is not None:
            params["attribute_technical_name"] = attribute_technical_name

        if attribute_value is not None:
            params["attribute_value"] = attribute_value

        if order_by is not None:
            params["order_by"] = order_by

        if page_cursor is not None:
            params["page_cursor"] = page_cursor

        response = await self.client.get(url, params=params, headers=headers)
        response.raise_for_status()

        return UserSearchResponse.model_validate_json(response.text)

    async def search_users(
        self,
        auth: FlipBearerAuth,
        query: str | None = None,
        attribute_technical_name: str | None = None,
        attribute_value: str | None = None,
        order_by: list[SearchUsersOrder] | None = None,
        max_results: int = 100,
    ) -> list[User]:
        all_users: list[User] = []
        page_cursor: str | None = None
        page_limit = 25

        while len(all_users) < max_results:
            response = await self._search_users_single_page(
                auth=auth,
                limit=page_limit,
                query=query,
                attribute_technical_name=attribute_technical_name,
                attribute_value=attribute_value,
                order_by=order_by,
                page_cursor=page_cursor,
            )

            if not response.users:
                break

            all_users.extend(response.users)

            if not response.next_page_cursor or len(all_users) >= max_results:
                break

            page_cursor = response.next_page_cursor

        return all_users[:max_results]
