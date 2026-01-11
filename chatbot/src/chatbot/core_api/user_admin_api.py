from typing import Literal
from uuid import UUID

from httpx import AsyncClient
from pydantic import BaseModel

from chatbot.config import Settings
from chatbot.util.auth import FlipBearerAuth

UserAttributePermission = Literal["VIEW", "EDIT", "HIDDEN"]
UserAttributeType = Literal["TEXT", "PHONE_NUMBER", "DATE"]
RoleTypeValue = Literal["PREDEFINED", "CUSTOM"]
PermissionsScopeValue = Literal["ORGANISATION", "USER_GROUP", "USER_SELF", "CHANNEL", "PAGE"]


class LocalizedText(BaseModel):
    language: str
    text: str


class AdminUserAttributeDefinition(BaseModel):
    id: str
    title: LocalizedText
    technical_name: str
    user_permission: UserAttributePermission
    attribute_type: UserAttributeType
    predefined: bool | None = None


class AdminUserAttributeDefinitionListItem(BaseModel):
    definition: AdminUserAttributeDefinition


class AdminUserAttributeDefinitionsResponse(BaseModel):
    attribute_definitions: list[AdminUserAttributeDefinitionListItem]


class AssignableAttributeDefinitionsResponse(BaseModel):
    definitions: list[AdminUserAttributeDefinition]


class RoleReference(BaseModel):
    id: str
    title: LocalizedText
    type: RoleTypeValue
    predefined_role_type: str | None = None
    scope: PermissionsScopeValue
    permission_count: int


class AssignableRole(BaseModel):
    role_id: str
    role: RoleReference | None = None


class AssignableRolesResponse(BaseModel):
    assignable_roles: list[AssignableRole]


class UserAdminApi:
    def __init__(self, client: AsyncClient, settings: Settings):
        self.client = client
        self.settings = settings

    async def list_user_attribute_definitions(self, auth: FlipBearerAuth, accept_language: str | None = None) -> AdminUserAttributeDefinitionsResponse:
        url = f"{self.settings.core_url}/api/admin/users/v4/user-attribute-definitions"
        headers = {"Authorization": f"Bearer {auth.token}", "Content-Type": "application/json", "Accept": "application/json"}
        if accept_language:
            headers["Accept-Language"] = accept_language

        response = await self.client.get(url, headers=headers)
        response.raise_for_status()

        return AdminUserAttributeDefinitionsResponse.model_validate_json(response.text)

    async def list_assignable_attribute_definitions(self, auth: FlipBearerAuth, accept_language: str | None = None) -> AssignableAttributeDefinitionsResponse:
        url = f"{self.settings.core_url}/api/admin/users/v4/user-groups/rules/assignable-attribute-definitions"
        headers = {"Authorization": f"Bearer {auth.token}", "Content-Type": "application/json", "Accept": "application/json"}
        if accept_language:
            headers["Accept-Language"] = accept_language

        response = await self.client.get(url, headers=headers)
        response.raise_for_status()

        return AssignableAttributeDefinitionsResponse.model_validate_json(response.text)

    async def list_assignable_roles(self, auth: FlipBearerAuth, user_group_id: UUID, accept_language: str | None = None) -> AssignableRolesResponse:
        url = f"{self.settings.core_url}/api/admin/users/v4/user-groups/{user_group_id}/assignable-roles"
        headers = {"Authorization": f"Bearer {auth.token}", "Content-Type": "application/json", "Accept": "application/json"}
        if accept_language:
            headers["Accept-Language"] = accept_language
        params = {"embed": ["ROLE"]}

        response = await self.client.get(url, headers=headers, params=params)
        response.raise_for_status()

        return AssignableRolesResponse.model_validate_json(response.text)
