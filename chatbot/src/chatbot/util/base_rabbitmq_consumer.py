import asyncio
import logging
import typing
from abc import ABC, abstractmethod
from asyncio import Task

from aio_pika import connect
from aio_pika.abc import AbstractChannel, AbstractConnection, AbstractIncomingMessage, AbstractMessage
from opentelemetry.instrumentation.aio_pika.callback_decorator import CallbackDecorator

from chatbot.config import RabbitMQSettings
from chatbot.util.observability import get_aio_pika_tracer

_logger = logging.getLogger(__name__)


class BaseRabbitMQConsumer(ABC):
    def __init__(self, queue: str, rabbit_settings: RabbitMQSettings):
        self.queue = queue
        self.consumer_task: Task[None] | None = None
        self.connection: AbstractConnection | None = None
        self.producer_channel: AbstractChannel | None = None
        self.started = False
        self.rabbit_settings = rabbit_settings
        self.processing_semaphore = asyncio.Semaphore(rabbit_settings.max_concurrent_messages)
        self.active_tasks: set[Task[None]] = set()

    @abstractmethod
    async def handle_message(self, message: AbstractMessage) -> None:
        pass

    async def start(self) -> None:
        event_loop = asyncio.get_event_loop()

        # Test that the queue exists and is ready. Throws an error and prevents service startup if not.
        channel = await self.open_channel()
        async with channel:
            queue = await channel.get_queue(self.queue, ensure=False)
            # fail=False means we don't raise if the queue is empty.
            await queue.get(no_ack=True, fail=False)

        self.consumer_task = event_loop.create_task(self.consumer(), name=self.queue + "_consumer")
        self.started = True

    async def stop(self) -> None:
        self.started = False

        for task in self.active_tasks.copy():
            if not task.done():
                task.cancel()

        if self.active_tasks:
            await asyncio.gather(*self.active_tasks, return_exceptions=True)

        if self.producer_channel:
            await self.producer_channel.close()
        if self.connection:
            await self.connection.close()
        if self.consumer_task:
            self.consumer_task.cancel()

    async def open_channel(self) -> AbstractChannel:
        conn = await self.get_connection()
        return await conn.channel()

    async def open_connection(self) -> None:
        if self.connection:
            await self.connection.close()

        _logger.info("Opening connection to RabbitMQ")
        self.connection = await connect(
            host=self.rabbit_settings.rabbitmq_host,
            port=self.rabbit_settings.rabbitmq_port,
            login=self.rabbit_settings.rabbitmq_user,
            password=self.rabbit_settings.rabbitmq_password,
        )
        _logger.info("Connection to RabbitMQ established.")

    async def get_connection(self) -> AbstractConnection:
        if not self.connection or not self.connection.connected.is_set():
            await self.open_connection()
        return typing.cast(AbstractConnection, self.connection)

    async def consumer(self) -> None:
        if not self.started or not self.connection:
            raise ValueError("Consumer can not be started before the connection is established.")

        while self.started:
            try:
                _logger.info(f"(Re)-starting Consumer for queue {self.queue}")
                channel = await self.open_channel()
                prefetch_count = max(10, self.rabbit_settings.max_concurrent_messages * 2)
                await channel.set_qos(prefetch_count=prefetch_count)
                queue = await channel.get_queue(self.queue, ensure=False)

                # See https://github.com/open-telemetry/opentelemetry-python-contrib/issues/1993
                decorated_callback = CallbackDecorator(get_aio_pika_tracer(), queue).decorate(self._process_message_task)  # type: ignore
                _logger.info(f"Consumer for {self.queue} connected to RabbitMQ with max {self.rabbit_settings.max_concurrent_messages} concurrent messages")
                async with queue.iterator() as queue_iter:
                    async for message in queue_iter:
                        task = asyncio.create_task(decorated_callback(message))
                        self.active_tasks.add(task)
            except Exception:
                _logger.exception(f"Error in Consumer for queue {self.queue}")
                await asyncio.sleep(5)

        _logger.info(f"Consumer for {self.queue} closed")

    async def _process_message_task(self, message: AbstractIncomingMessage) -> None:
        task = asyncio.current_task()

        async with self.processing_semaphore:
            try:
                await self.handle_message(message)
                await message.ack()
            except Exception:
                _logger.exception("Error processing message")
                await message.reject()
            finally:
                if task:
                    self.active_tasks.discard(task)
