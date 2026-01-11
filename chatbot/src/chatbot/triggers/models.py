from dataclasses import dataclass
from datetime import UTC, datetime
from uuid import UUID, uuid4

from chatbot.database.tables import ActionType, TriggerStatus


@dataclass(frozen=True)
class TriggerId:
    id: UUID
    tenant: str


@dataclass(frozen=True)
class ActionId:
    id: UUID
    tenant: str


@dataclass(frozen=True)
class Action:
    id: ActionId
    action_type: ActionType
    order_number: int
    created_at: datetime
    updated_at: datetime


@dataclass(frozen=True)
class TriggerFlipFlowAction(Action):
    flow_id: UUID
    message_id: UUID

    @classmethod
    def create(
        cls,
        tenant: str,
        flow_id: UUID,
        message_id: UUID,
        order_number: int,
    ) -> "TriggerFlipFlowAction":
        now = datetime.now(UTC)
        action_id = uuid4()

        return cls(
            id=ActionId(id=action_id, tenant=tenant),
            flow_id=flow_id,
            message_id=message_id,
            action_type=ActionType.TRIGGER_FLIP_FLOW,
            order_number=order_number,
            created_at=now,
            updated_at=now,
        )


@dataclass(frozen=True)
class Trigger:
    id: TriggerId
    name: str
    ai_description: str
    status: TriggerStatus
    created_at: datetime
    updated_at: datetime
    updated_by: UUID
    actions: list[Action]

    @classmethod
    def create(
        cls,
        tenant: str,
        name: str,
        ai_description: str,
        updated_by: UUID,
        actions: list[Action] | None = None,
        status: TriggerStatus = TriggerStatus.ACTIVE,
    ) -> "Trigger":
        now = datetime.now(UTC)
        trigger_id = uuid4()

        return cls(
            id=TriggerId(id=trigger_id, tenant=tenant),
            name=name,
            ai_description=ai_description,
            status=status,
            created_at=now,
            updated_at=now,
            updated_by=updated_by,
            actions=actions or [],
        )
