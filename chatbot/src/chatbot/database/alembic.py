import logging

from alembic.config import Config
from sqlalchemy.engine import URL

from chatbot.util.path import get_project_root

_logger = logging.getLogger(__name__)


def create_alembic_config(
    postgres_host: str,
    postgres_port: int,
    postgres_database: str,
    postgres_username: str,
    postgres_password: str,
) -> Config:
    project_root = get_project_root()

    db_url = URL.create(
        drivername="postgresql+asyncpg",
        username=postgres_username,
        password=postgres_password,
        host=postgres_host,
        port=postgres_port,
        database=postgres_database,
    )

    alembic_cfg = Config(str(project_root / "alembic.ini"))
    alembic_cfg.set_main_option("script_location", str(project_root / "alembic"))
    alembic_cfg.set_main_option("sqlalchemy.url", db_url.render_as_string(hide_password=False).replace("%", "%%"))
    alembic_cfg.attributes["configure_logger"] = False

    return alembic_cfg
