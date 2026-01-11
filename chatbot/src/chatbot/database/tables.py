from enum import StrEnum, auto

from sqlalchemy import (
    Column,
    Enum,
    ForeignKeyConstraint,
    Integer,
    MetaData,
    String,
    Table,
    Uuid,
)
from sqlalchemy.dialects.postgresql import JSONB, TIMESTAMP

metadata = MetaData()


class TriggerStatus(StrEnum):
    ACTIVE = auto()
    INACTIVE = auto()


class ActionType(StrEnum):
    TRIGGER_FLIP_FLOW = auto()


triggers = Table(
    "triggers",
    metadata,
    Column("tenant", String, primary_key=True),
    Column("id", Uuid, primary_key=True),
    Column("name", String(100), nullable=False),
    Column("ai_description", String(1000), nullable=False),
    Column("status", Enum(TriggerStatus), nullable=False, default=TriggerStatus.ACTIVE),
    Column("created_at", TIMESTAMP(timezone=True), nullable=False),
    Column("updated_at", TIMESTAMP(timezone=True), nullable=False),
    Column("updated_by", Uuid, nullable=False),
)

actions = Table(
    "actions",
    metadata,
    Column("tenant", String, primary_key=True),
    Column("trigger_id", Uuid, nullable=False),
    Column("id", Uuid, primary_key=True),
    Column("action_type", Enum(ActionType), nullable=False),
    Column("action_data", JSONB, nullable=False),
    Column("order_number", Integer, nullable=False),
    Column("created_at", TIMESTAMP(timezone=True), nullable=False),
    Column("updated_at", TIMESTAMP(timezone=True), nullable=False),
    ForeignKeyConstraint(
        ["tenant", "trigger_id"],
        ["triggers.tenant", "triggers.id"],
        ondelete="CASCADE",
    ),
)
