from enum import Enum

import httpx
from openai import AsyncOpenAI
from pydantic_ai.models.openai import OpenAIChatModel
from pydantic_ai.providers import Provider
from pydantic_ai.providers.azure import AzureProvider
from pydantic_ai.providers.openai import OpenAIProvider

from chatbot.config import Settings


class ModelType(Enum):
    GPT_4_1_NANO = "gpt-4.1-nano"
    GPT_4_1_MINI = "gpt-4.1-mini"
    GPT_4_1_BASE = "gpt-4.1-base"


def _get_api_base_for_model(model_type: ModelType, config: Settings) -> str:
    match model_type:
        case ModelType.GPT_4_1_NANO:
            return config.llm_api_base_gpt_4_1_nano
        case ModelType.GPT_4_1_MINI:
            return config.llm_api_base_gpt_4_1_mini
        case ModelType.GPT_4_1_BASE:
            return config.llm_api_base_gpt_4_1_base


def get_model(model_type: ModelType, config: Settings, http_client: httpx.AsyncClient) -> OpenAIChatModel:
    provider: Provider[AsyncOpenAI]

    if config.ai_gateway_enabled:
        provider = OpenAIProvider(
            base_url=config.ai_gateway_url,
            api_key=None,
            http_client=http_client,
        )
    else:
        provider = AzureProvider(
            azure_endpoint=_get_api_base_for_model(model_type, config),
            api_version="2025-04-01-preview",
            api_key=config.llm_api_key,
            http_client=http_client,
        )

    return OpenAIChatModel(
        model_type.value,
        provider=provider,
    )
