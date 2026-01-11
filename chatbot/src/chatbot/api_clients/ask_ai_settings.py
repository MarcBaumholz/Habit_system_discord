from httpx import AsyncClient

from chatbot.config import Settings
from chatbot.pydantic_models import CompanyInfoData


class AskAiSettingsCoreApi:
    def __init__(self, client: AsyncClient, settings: Settings):
        self.client = client
        self.settings = settings

    async def get_settings(self, tenant: str) -> CompanyInfoData:
        url = f"{self.settings.core_url}/internal/ask-ai/tenant/{tenant}/settings"

        response = await self.client.get(url)
        response.raise_for_status()

        return CompanyInfoData.model_validate_json(response.text)
