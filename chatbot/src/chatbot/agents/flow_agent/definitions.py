from __future__ import annotations

from dataclasses import dataclass

from httpx import AsyncClient

from chatbot.api_clients.flip_flow_core_api import FlipFlowCoreApi
from chatbot.config import Settings


@dataclass(frozen=True)
class FlowDefinition:
    name: str
    keyword: str
    description: str
    user_id: str


async def load_flow_definitions_from_api(client: AsyncClient, settings: Settings, tenant: str) -> list[FlowDefinition]:
    api = FlipFlowCoreApi(client, settings)
    response = await api.get_flip_flows(tenant)

    definitions: list[FlowDefinition] = []
    for flow in response.flows:
        definitions.append(
            FlowDefinition(
                name=flow.name,
                keyword=flow.keyword,
                description=flow.ai_instructions,
                user_id=flow.user_id,
            )
        )

    return definitions
