from uuid import UUID

from pydantic import conint
from starlette.requests import Request

from chatbot.app_services import AppServices
from chatbot.database.models import OffsetPaginationRequest, PageInfo
from chatbot.database.tables import TriggerStatus as TriggerStatusEnum
from chatbot.openapi.generated.models import (
    AskAiTrigger,
    AskAiTriggerCreateRequest,
    AskAiTriggerSearchResult,
    OffsetPagination,
    TriggerAction,
    TriggerFlipFlowActionData,
)
from chatbot.openapi.generated.routers.ask_ai import AskaiService
from chatbot.triggers.models import (
    Action,
    Trigger,
    TriggerFlipFlowAction,
)
from chatbot.triggers.repository import TriggerRepository
from chatbot.util.auth import get_flip_api_auth


class AskaiServiceImpl(AskaiService):
    async def list_ask_ai_triggers(
        self,
        request: Request,
        page_number: conint(ge=1) | None = 1,  # type: ignore[valid-type]
        page_limit: conint(ge=1, le=25) | None = 10,  # type: ignore[valid-type]
    ) -> AskAiTriggerSearchResult:
        auth = get_flip_api_auth(request)
        tenant = auth.tenant

        app_services: AppServices = request.state.app_services
        await app_services.permission_service.check_permission(auth, "ASK_AI:MANAGE")

        repository = app_services.database_service.get_repository(TriggerRepository)
        response = await repository.list_triggers(tenant=tenant, pagination=OffsetPaginationRequest.from_params(page_number, page_limit))

        items = [
            AskAiTrigger(
                id=trigger.id.id,
                name=trigger.name,
                ai_description=trigger.ai_description,
                status=trigger.status.name,
                actions=self._domain_actions_to_dto(trigger.actions),
                created_at=trigger.created_at,
                updated_at=trigger.updated_at,
            )
            for trigger in response.items
        ]

        return AskAiTriggerSearchResult(items=items, pagination=_page_info_to_dto(page_info=response.page_info))

    async def create_ask_ai_trigger(self, request: Request, body: AskAiTriggerCreateRequest) -> AskAiTrigger:
        auth = get_flip_api_auth(request)
        tenant = auth.tenant

        app_services: AppServices = request.state.app_services
        await app_services.permission_service.check_permission(auth, "ASK_AI:MANAGE")

        repository = app_services.database_service.get_repository(TriggerRepository)

        status = TriggerStatusEnum[body.status] if body.status else TriggerStatusEnum.ACTIVE

        trigger = Trigger.create(
            tenant=tenant,
            name=body.name,
            ai_description=body.ai_description,
            status=status,
            updated_by=UUID(auth.user_id),
            actions=self._dto_actions_to_domain(body.actions, tenant),
        )

        created_trigger = await repository.create_trigger(trigger=trigger)

        return AskAiTrigger(
            id=created_trigger.id.id,
            name=created_trigger.name,
            ai_description=created_trigger.ai_description,
            status=created_trigger.status.name,
            actions=self._domain_actions_to_dto(created_trigger.actions),
            created_at=created_trigger.created_at,
            updated_at=created_trigger.updated_at,
        )

    def _dto_actions_to_domain(self, dto_actions: list[TriggerAction], tenant: str) -> list[Action]:
        domain_actions: list[Action] = []
        for index, dto_action_wrapper in enumerate(dto_actions):
            dto_action = dto_action_wrapper.action
            if isinstance(dto_action, TriggerFlipFlowActionData):
                domain_actions.append(
                    TriggerFlipFlowAction.create(
                        tenant=tenant,
                        flow_id=dto_action.flow_id,
                        message_id=dto_action.message_id,
                        order_number=index,
                    )
                )
            else:
                raise ValueError(f"Unknown action type: {type(dto_action)}")
        return domain_actions

    def _domain_actions_to_dto(self, domain_actions: list[Action]) -> list[TriggerAction]:
        dto_actions: list[TriggerAction] = []
        for action in domain_actions:
            if isinstance(action, TriggerFlipFlowAction):
                action_data = TriggerFlipFlowActionData(
                    action="TRIGGER_FLIP_FLOW",
                    flow_id=action.flow_id,
                    message_id=action.message_id,
                )
                dto_actions.append(TriggerAction(action=action_data))
            else:
                raise ValueError(f"Unknown action type: {type(action)}")
        return dto_actions


def _page_info_to_dto(page_info: PageInfo) -> OffsetPagination:
    return OffsetPagination(
        page_number=page_info.page_number,
        total_pages=page_info.total_pages,
        total_elements=page_info.total_elements,
        page_limit=page_info.page_limit,
    )
