import logging

from aio_pika.abc import AbstractMessage
from pydantic import BaseModel

from chatbot.config import RabbitMQSettings
from chatbot.database.database_service import DatabaseService
from chatbot.triggers.repository import TriggerRepository
from chatbot.util.base_rabbitmq_consumer import BaseRabbitMQConsumer

_logger = logging.getLogger(__name__)


class OrganisationDeletionEvent(BaseModel):
    tenant: str


class OrganisationDeletionConsumer(BaseRabbitMQConsumer):
    input_queue = "ask-ai.tenant.deletion.in"

    def __init__(
        self,
        rabbit_settings: RabbitMQSettings,
        database_service: DatabaseService,
    ) -> None:
        super().__init__(self.input_queue, rabbit_settings)
        self.database_service = database_service

    async def handle_message(self, message: AbstractMessage) -> None:
        event = OrganisationDeletionEvent.model_validate_json(message.body.decode())

        _logger.info(f"Received tenant hard deletion event for {event.tenant}")

        trigger_repo = self.database_service.get_repository(TriggerRepository)
        deleted_count = await trigger_repo.delete_all_by_tenant(event.tenant)
        _logger.info(f"Deleted {deleted_count} trigger(s) for tenant {event.tenant}")
