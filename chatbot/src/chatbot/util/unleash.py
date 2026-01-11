import logging
from typing import Literal

from UnleashClient import UnleashClient

from chatbot.config import Settings

type UnleashFeatureToggle = Literal["ASK_AI_USER_TOOLS_ENABLED", "ASK_AI_FLIP_FLOWS_ENABLED", "ASK_AI_TRIGGERS"]

_logger = logging.getLogger(__name__)


class FeatureToggleService:
    _unleash: UnleashClient | None = None

    def __init__(self, settings: Settings):
        self._namespace = settings.namespace
        if settings.unleash_enabled:
            assert settings.unleash_api_url, "Unleash API URL must be set when unleash is enabled."
            assert settings.unleash_api_key, "Unleash API key must be set when unleash is enabled."
            assert settings.unleash_environment, "Unleash environment must be set when unleash is enabled."

            self._unleash = UnleashClient(
                url=settings.unleash_api_url,
                app_name="chatbot-askai",
                environment=settings.unleash_environment,
                custom_headers={"Authorization": settings.unleash_api_key},
            )
            self._unleash.initialize_client()
        else:
            _logger.info("Unleash is disabled, feature toggles will not be available.")

    def is_enabled(self, tenant: str, feature: UnleashFeatureToggle) -> bool:
        if self._unleash is None:
            return False

        return self._unleash.is_enabled(feature, context=self._build_context(tenant))

    def _build_context(
        self,
        tenant: str,
    ) -> dict[str, str]:
        return {
            "namespace": self._namespace,
            "tenant": tenant,
        }
