import logging
import sys
from collections.abc import Iterable
from dataclasses import dataclass

from alembic import command
from alembic.config import Config
from alembic.operations import MigrationScript
from alembic.runtime.migration import MigrationContext
from testcontainers.postgres import PostgresContainer

from chatbot.database.alembic import create_alembic_config

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
    stream=sys.stdout,
)
_logger = logging.getLogger(__name__)


@dataclass(frozen=True)
class MigrationDatabaseConfig:
    image: str = "postgres:16-alpine"
    name: str = "testdb"
    user: str = "testuser"
    password: str = "testpassword"


def run_upgrade(alembic_cfg: Config) -> None:
    _logger.info("Executing Alembic upgrade to HEAD")

    command.upgrade(alembic_cfg, "head")


def run_autogenerate(alembic_cfg: Config, message: str = "auto") -> None:
    _logger.info("Generating migrations (if needed)")

    # NOTE: https://alembic.sqlalchemy.org/en/latest/cookbook.html#cookbook-no-empty-migrations
    def process_revision_directives(
        context: MigrationContext,
        revision: str | Iterable[str | None] | Iterable[str],
        directives: list[MigrationScript],
    ) -> None:
        script = directives[0]
        assert script.upgrade_ops is not None
        if script.upgrade_ops.is_empty():
            directives[:] = []

    command.revision(alembic_cfg, message=message, autogenerate=True, process_revision_directives=process_revision_directives)


def main(db_config: MigrationDatabaseConfig) -> None:
    try:
        with PostgresContainer(
            image=db_config.image,
            dbname=db_config.name,
            username=db_config.user,
            password=db_config.password,
            driver="asyncpg",
        ) as postgres:
            _logger.info("Database started successfully.")

            alembic_cfg = create_alembic_config(
                postgres_host=postgres.get_container_host_ip(),
                postgres_port=postgres.get_exposed_port(postgres.port),
                postgres_database=db_config.name,
                postgres_username=db_config.user,
                postgres_password=db_config.password,
            )

            run_upgrade(alembic_cfg)
            _logger.info("Upgrade command executed.")
            run_autogenerate(alembic_cfg)
            _logger.info("Autogenerate command executed.")
    except Exception as e:
        _logger.critical(f"An unrecoverable error occurred: {e}", exc_info=True)
        sys.exit(1)


if __name__ == "__main__":
    main(MigrationDatabaseConfig())
