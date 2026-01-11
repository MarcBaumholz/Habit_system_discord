import asyncio
from collections.abc import AsyncIterator
from contextlib import AbstractAsyncContextManager, asynccontextmanager
from logging import getLogger
from types import TracebackType
from typing import Self

from alembic import command
from sqlalchemy import URL
from sqlalchemy.ext.asyncio import AsyncConnection, AsyncEngine, create_async_engine

from chatbot.config import DatabaseSettings
from chatbot.database.alembic import create_alembic_config

_logger = getLogger(__name__)


class BaseRepository:
    def __init__(self, engine: AsyncEngine):
        self.engine = engine

    @asynccontextmanager
    async def connect(self) -> AsyncIterator[AsyncConnection]:
        async with self.engine.begin() as conn:
            yield conn


class DatabaseService(AbstractAsyncContextManager["DatabaseService", None]):
    engine: AsyncEngine | None = None

    def __init__(self, database_settings: DatabaseSettings):
        self.settings = database_settings

    async def __aenter__(self) -> Self:
        self.engine = create_async_engine(
            URL.create(
                drivername="postgresql+asyncpg",
                username=self.settings.postgres_username,
                password=self.settings.postgres_password,
                host=self.settings.postgres_host,
                port=self.settings.postgres_port,
                database=self.settings.postgres_database,
            ),
            pool_size=self.settings.postgres_pool_size,
            pool_pre_ping=True,
            echo=False,
        )
        return self

    async def __aexit__(self, exc_type: type[BaseException] | None, exc_value: BaseException | None, traceback: TracebackType | None) -> None:
        if self.engine:
            await self.engine.dispose()
            _logger.info("Database engine disposed")

    async def run_migrations(self) -> None:
        def _run_migrations_sync() -> None:
            alembic_cfg = create_alembic_config(
                postgres_host=self.settings.postgres_host,
                postgres_port=self.settings.postgres_port,
                postgres_database=self.settings.postgres_database,
                postgres_username=self.settings.postgres_username,
                postgres_password=self.settings.postgres_password,
            )

            _logger.info("Starting database migration to head revision")
            command.upgrade(alembic_cfg, "head")
            _logger.info("Database migrations completed successfully")

        try:
            await asyncio.to_thread(_run_migrations_sync)
        except Exception as e:
            _logger.error(f"Failed to run database migrations: {str(e)}", exc_info=True)
            raise

    def get_repository[T: BaseRepository](self, repo_type: type[T]) -> T:
        if not self.engine:
            raise RuntimeError("Database engine is not initialized")

        return repo_type(self.engine)
