from httpx import AsyncClient
from pydantic import BaseModel

from chatbot.config import Settings


class PermissionCheckResultDTO(BaseModel):
    has_permission: bool


class PermissionsCoreApi:
    def __init__(self, client: AsyncClient, settings: Settings):
        self.client = client
        self.settings = settings

    async def check_permission(self, tenant: str, user_id: str, permission: str) -> PermissionCheckResultDTO:
        url = f"{self.settings.core_url}/internal/tenants/{tenant}/users/{user_id}/permissions/{permission}"

        response = await self.client.get(url)
        response.raise_for_status()

        return PermissionCheckResultDTO.model_validate_json(response.text)

    async def check_usergroup_permission(self, tenant: str, usergroup_id: str, user_id: str, permission: str) -> PermissionCheckResultDTO:
        url = f"{self.settings.core_url}/internal/tenants/{tenant}/usergroups/{usergroup_id}/users/{user_id}/permissions/{permission}"

        response = await self.client.get(url)
        response.raise_for_status()

        return PermissionCheckResultDTO.model_validate_json(response.text)
