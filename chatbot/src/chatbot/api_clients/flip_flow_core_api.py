from httpx import AsyncClient
from pydantic import BaseModel, Field

from chatbot.config import Settings


class FlipFlow(BaseModel):
    user_id: str
    name: str
    keyword: str
    ai_instructions: str


class FlipFlowsResponse(BaseModel):
    flows: list[FlipFlow] = Field(alias="flip_flows")


class FlipFlowCoreApi:
    def __init__(self, client: AsyncClient, settings: Settings):
        self.client = client
        self.settings = settings

    async def get_flip_flows(self, tenant: str) -> FlipFlowsResponse:
        url = f"{self.settings.core_url}/internal/ask-ai/tenant/{tenant}/flip-flows"

        response = await self.client.get(url)
        response.raise_for_status()
        return FlipFlowsResponse.model_validate_json(response.text)
