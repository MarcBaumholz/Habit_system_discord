from collections.abc import Sequence
from typing import Any
from uuid import UUID

from sqlalchemy import Row, delete, func, select
from sqlalchemy.ext.asyncio import AsyncConnection

from chatbot.database.database_service import BaseRepository
from chatbot.database.models import OffsetPaginationRequest, OffsetPaginationResponse, PageInfo
from chatbot.database.tables import ActionType, actions, triggers
from chatbot.triggers.models import (
    Action,
    ActionId,
    Trigger,
    TriggerFlipFlowAction,
    TriggerId,
)


class TriggerRepository(BaseRepository):
    async def get_all_triggers(self, tenant: str) -> list[Trigger]:
        async with self.connect() as conn:
            query = select(triggers).where(triggers.c.tenant == tenant).order_by(triggers.c.created_at.desc())
            result = await conn.execute(query)
            rows = result.fetchall()

            actions_by_trigger = await self._load_actions(conn, tenant, rows)

            return [self._row_to_trigger(row, actions_by_trigger.get(row.id)) for row in rows]

    async def list_triggers(self, tenant: str, pagination: OffsetPaginationRequest) -> OffsetPaginationResponse[Trigger]:
        async with self.connect() as conn:
            count_query = select(func.count()).select_from(triggers).where(triggers.c.tenant == tenant)
            count_result = await conn.execute(count_query)
            total_count = count_result.scalar() or 0

            offset = (pagination.page - 1) * pagination.limit
            query = select(triggers).where(triggers.c.tenant == tenant).order_by(triggers.c.created_at.desc()).offset(offset).limit(pagination.limit)
            result = await conn.execute(query)
            rows = result.fetchall()
            actions_by_trigger = await self._load_actions(conn, tenant, rows)
            entities = [self._row_to_trigger(row, actions_by_trigger.get(row.id)) for row in rows]

            page_info = PageInfo.from_counts(
                total_count=total_count,
                page=pagination.page,
                limit=pagination.limit,
            )

            return OffsetPaginationResponse(items=entities, page_info=page_info)

    async def create_trigger(self, trigger: Trigger) -> Trigger:
        async with self.connect() as conn:
            await conn.execute(
                triggers.insert().values(
                    tenant=trigger.id.tenant,
                    id=trigger.id.id,
                    name=trigger.name,
                    ai_description=trigger.ai_description,
                    status=trigger.status,
                    created_at=trigger.created_at,
                    updated_at=trigger.updated_at,
                    updated_by=trigger.updated_by,
                )
            )

            if trigger.actions:
                action_values = [
                    {
                        "tenant": action.id.tenant,
                        "trigger_id": trigger.id.id,
                        "id": action.id.id,
                        "action_type": action.action_type,
                        "action_data": self._action_to_json(action),
                        "order_number": action.order_number,
                        "created_at": action.created_at,
                        "updated_at": action.updated_at,
                    }
                    for action in trigger.actions
                ]
                await conn.execute(actions.insert(), action_values)

        return trigger

    async def delete_all_by_tenant(self, tenant: str) -> int:
        async with self.connect() as conn:
            query = delete(triggers).where(triggers.c.tenant == tenant)
            result = await conn.execute(query)
            return result.rowcount

    async def _load_actions(self, conn: AsyncConnection, tenant: str, trigger_rows: Sequence[Row[Any]]) -> dict[UUID, list[Action]]:
        trigger_ids = [row.id for row in trigger_rows]
        actions_query = select(actions).where(actions.c.tenant == tenant).where(actions.c.trigger_id.in_(trigger_ids)).order_by(actions.c.order_number.asc())
        actions_result = await conn.execute(actions_query)
        actions_rows = actions_result.fetchall()

        actions_by_trigger: dict[UUID, list[Action]] = {}
        for action_row in actions_rows:
            trigger_id = action_row.trigger_id
            if trigger_id not in actions_by_trigger:
                actions_by_trigger[trigger_id] = []
            actions_by_trigger[trigger_id].append(self._row_to_action(action_row, tenant))

        return actions_by_trigger

    def _action_to_json(self, action: Action) -> dict[str, str]:
        if isinstance(action, TriggerFlipFlowAction):
            return {
                "flow_id": str(action.flow_id),
                "message_id": str(action.message_id),
            }
        raise ValueError(f"Unknown action type: {type(action)}")

    def _row_to_action(self, row: Row[Any], tenant: str) -> Action:
        action_id = ActionId(id=row.id, tenant=tenant)
        action_data = row.action_data

        if row.action_type == ActionType.TRIGGER_FLIP_FLOW:
            return TriggerFlipFlowAction(
                id=action_id,
                flow_id=UUID(action_data["flow_id"]),
                message_id=UUID(action_data["message_id"]),
                action_type=ActionType.TRIGGER_FLIP_FLOW,
                order_number=row.order_number,
                created_at=row.created_at,
                updated_at=row.updated_at,
            )
        raise ValueError(f"Unknown action type in database: {row.action_type}")

    def _row_to_trigger(self, row: Row[Any], trigger_actions: list[Action] | None) -> Trigger:
        return Trigger(
            id=TriggerId(id=row.id, tenant=row.tenant),
            name=row.name,
            ai_description=row.ai_description,
            status=row.status,
            created_at=row.created_at,
            updated_at=row.updated_at,
            updated_by=row.updated_by,
            actions=trigger_actions if trigger_actions is not None else [],
        )
