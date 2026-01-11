import logging
from contextlib import AsyncExitStack

import httpx
from langfuse import Langfuse
from pydantic_ai.models import Model
from pydantic_graph import Graph
from tenacity import stop_after_attempt, wait_exponential

from chatbot.agents.chat_agent.agent import create_chat_agent
from chatbot.agents.chat_agent.state import ChatAgentDependencies, ChatAgentState
from chatbot.agents.post_creation_agent.agent import create_post_creation_agent
from chatbot.agents.post_creation_agent.state import PostCreationAgentDependencies, PostCreationAgentState
from chatbot.agents.shared.ai_models import ModelType, get_model
from chatbot.api_clients.permissions import PermissionsCoreApi
from chatbot.config import DatabaseSettings, RabbitMQSettings, Settings
from chatbot.consumer.organisation_deletion_consumer import OrganisationDeletionConsumer
from chatbot.database.database_service import DatabaseService
from chatbot.util.http_client import HttpClientRetryConfig, create_http_client
from chatbot.util.permission_service import PermissionService
from chatbot.util.unleash import FeatureToggleService

_logger = logging.getLogger(__name__)


class AppServices:
    settings: Settings
    http_client: httpx.AsyncClient
    feature_toggle_service: FeatureToggleService
    database_service: DatabaseService
    models: dict[ModelType, Model]
    organisation_deletion_consumer: OrganisationDeletionConsumer
    permission_service: PermissionService

    chatbot_agent: Graph[ChatAgentState, ChatAgentDependencies]
    post_creation_agent: Graph[PostCreationAgentState, PostCreationAgentDependencies]

    exit_stack: AsyncExitStack = AsyncExitStack()

    def __init__(self, settings: Settings):
        self.settings = settings

    def init_http_client(self) -> httpx.AsyncClient:
        retry_config = HttpClientRetryConfig(stop=stop_after_attempt(self.settings.http_client.retry_max_attempts), wait=wait_exponential(multiplier=1, min=1, max=30, exp_base=self.settings.http_client.retry_backoff_factor))

        return create_http_client(self.settings.http_client, retry_config=retry_config)

    def init_langfuse_client(self) -> None:
        if self.settings.environment == "local" and self.settings.langfuse_secret and self.settings.langfuse_public and self.settings.langfuse_host:
            _logger.info("Langfuse logging initialized for local environment")
            langfuse_client = Langfuse(
                secret_key=self.settings.langfuse_secret,
                public_key=self.settings.langfuse_public,
                host=self.settings.langfuse_host,
            )
            if langfuse_client.auth_check():
                print("Langfuse client is authenticated and ready!")
            else:
                print("Authentication failed. Please check your credentials and host.")
        else:
            _logger.info("Langfuse logging disabled - not in local environment or missing configuration")
        return None

    def init_feature_toggle_service(self) -> FeatureToggleService:
        return FeatureToggleService(self.settings)

    def init_models(self) -> dict[ModelType, Model]:
        return {model_type: get_model(model_type, self.settings, self.http_client) for model_type in ModelType}

    def init_chatbot_agent(self) -> Graph[ChatAgentState, ChatAgentDependencies]:
        return create_chat_agent()

    def init_post_creation_agent(self) -> Graph[PostCreationAgentState, PostCreationAgentDependencies]:
        return create_post_creation_agent()

    async def init_database_service(self) -> DatabaseService:
        database_service = await self.exit_stack.enter_async_context(DatabaseService(DatabaseSettings()))
        await database_service.run_migrations()

        return database_service

    def init_permission_service(self) -> PermissionService:
        return PermissionService(PermissionsCoreApi(self.http_client, self.settings))

    def init_organisation_deletion_consumer(self) -> OrganisationDeletionConsumer:
        return OrganisationDeletionConsumer(
            rabbit_settings=RabbitMQSettings(),
            database_service=self.database_service,
        )

    async def start(self) -> None:
        try:
            self.http_client = self.init_http_client()
            _logger.info("Created shared HTTP client for chatbot service")

            self.database_service = await self.init_database_service()

            self.init_langfuse_client()

            self.feature_toggle_service = self.init_feature_toggle_service()
            _logger.info("Initialized feature toggle service")

            self.models = self.init_models()
            _logger.info("Initialized shared models")

            self.chatbot_agent = self.init_chatbot_agent()
            _logger.info("Initialized ChatAgent instance")

            self.post_creation_agent = self.init_post_creation_agent()
            _logger.info("Initialized PostCreationAgent instance")

            self.organisation_deletion_consumer = self.init_organisation_deletion_consumer()
            _logger.info("Initialized organisation deletion consumer")
            await self.organisation_deletion_consumer.start()

            self.permission_service = self.init_permission_service()

        except Exception as e:
            _logger.error(f"Critical error during AppServices startup: {str(e)}", exc_info=True)
            await self.stop()
            raise

    async def stop(self) -> None:
        _logger.info("Chatbot service shutting down")

        await self.exit_stack.aclose()
