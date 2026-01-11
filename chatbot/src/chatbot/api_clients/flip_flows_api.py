from uuid import UUID

from httpx import AsyncClient
from pydantic import BaseModel

from chatbot.config import Settings
from chatbot.util.auth import FlipBearerAuth


class FlowDTO(BaseModel):
    id: UUID
    name: str
    api_client_id: UUID


class MessageDTO(BaseModel):
    keyword: str


class FlipFlowsApi:
    def __init__(self, client: AsyncClient, settings: Settings):
        self.client = client
        self.settings = settings

    async def get_flow_by_id(self, auth: FlipBearerAuth, flow_id: UUID) -> FlowDTO | None:
        url = f"{self.settings.flows_api_url}/api/flipflows/v4/flows/{flow_id}"

        headers = {"Authorization": f"Bearer {auth.token}", "Content-Type": "application/json", "Accept": "application/json"}

        response = await self.client.get(url, headers=headers)
        if response.status_code == 404:
            return None

        response.raise_for_status()

        return FlowDTO.model_validate_json(response.text)

    async def get_message_by_id(self, auth: FlipBearerAuth, flow_id: UUID, message_id: UUID) -> MessageDTO | None:
        url = f"{self.settings.flows_api_url}/api/flipflows/v4/flows/{flow_id}/messages/{message_id}"

        headers = {"Authorization": f"Bearer {auth.token}", "Content-Type": "application/json", "Accept": "application/json"}

        response = await self.client.get(url, headers=headers)
        if response.status_code == 404:
            return None
        response.raise_for_status()

        return MessageDTO.model_validate_json(response.text)
