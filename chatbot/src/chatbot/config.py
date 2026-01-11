import os

import httpx
from pydantic import Field, field_validator
from pydantic_core.core_schema import ValidationInfo
from pydantic_settings import BaseSettings, SettingsConfigDict


class HTTPClientSettings(BaseSettings):
    connect_timeout: float = Field(default=10.0, alias="CHATBOT_HTTP_CONNECT_TIMEOUT")
    read_timeout: float = Field(default=60.0, alias="CHATBOT_HTTP_READ_TIMEOUT")
    write_timeout: float = Field(default=30.0, alias="CHATBOT_HTTP_WRITE_TIMEOUT")
    pool_timeout: float = Field(default=5.0, alias="CHATBOT_HTTP_POOL_TIMEOUT")
    max_connections: int = Field(default=20, alias="CHATBOT_HTTP_MAX_CONNECTIONS")
    max_keepalive_connections: int = Field(default=10, alias="CHATBOT_HTTP_MAX_KEEPALIVE_CONNECTIONS")
    keepalive_expiry: float = Field(default=30.0, alias="CHATBOT_HTTP_KEEPALIVE_EXPIRY")
    retry_max_attempts: int = 3
    retry_backoff_factor: float = 2.0

    def to_timeouts(self) -> httpx.Timeout:
        return httpx.Timeout(
            connect=self.connect_timeout,
            read=self.read_timeout,
            write=self.write_timeout,
            pool=self.pool_timeout,
        )

    def to_limits(self) -> httpx.Limits:
        return httpx.Limits(
            max_connections=self.max_connections,
            max_keepalive_connections=self.max_keepalive_connections,
            keepalive_expiry=self.keepalive_expiry,
        )


class Settings(BaseSettings):
    """Configuration settings loaded from environment variables"""

    # Environment
    environment: str = Field(default="production", alias="ENVIRONMENT")

    # Common settings
    log_level: str = Field(default="INFO", alias="LOG_LEVEL")
    port: int = Field(default=8004, alias="PORT")

    # Open Telemetry settings
    tracing_enabled: bool = Field(default=False, alias="TRACING_ENABLED")
    namespace: str = Field(default="local", alias="NAMESPACE")

    # Retriever Service Settings
    first_stage_k: int = 10
    second_stage_k: int = 5
    relevance_threshold: float = 0.5
    metadata_relevance_threshold: float = 0.5
    evaluation_threshold: float = 0.7
    cosine_similarity_threshold: float = 0.2
    # Recency weighting
    # Temporal score = similarity * (1 + weight * exp(-λ · age_days)), where λ = ln(2) / half_life_days.
    # • weight = 0 disables recency tie-breaks.
    # • half-life controls how quickly recency decays (age_days at which boost halves).
    # Tune per source to bias toward freshness only when similarities are close.
    # Recency weight indicates for how much the score can get multiplied max

    post_recency_weight: float = 0.5
    page_recency_weight: float = 0.5
    post_recency_half_life_days: float = 14.0
    page_recency_half_life_days: float = 90.0

    max_retrieval_agent_calls: int = 2
    chat_max_iterations: int = 8
    retrieval_max_iterations: int = 2
    post_max_iterations: int = 8

    # Retrieval agent tool configuration
    retrieval_agent_search_tool_names: list[str] = [
        "semantic_search_posts",
        "semantic_search_pages",
    ]

    # User search agent settings
    user_search_max_results: int = 100
    user_search_agent_total_tokens_limit: int = 4096

    # Generator Service Settings
    truncate_chat_history_limit: int = 10

    # AI Gateway settings
    ai_gateway_enabled: bool = Field(default=False, alias="AI_GATEWAY_ENABLED")
    ai_gateway_url: str | None = Field(default=None, alias="AI_GATEWAY_URL")

    # Common LLM settings
    llm_api_key: str = Field(alias="LLM_API_KEY")
    llm_api_base_gpt_4_1_nano: str = Field(alias="LLM_API_BASE_GPT_4_1_NANO")
    llm_api_base_gpt_4_1_mini: str = Field(alias="LLM_API_BASE_GPT_4_1_MINI")
    llm_api_base_gpt_4_1_base: str = Field(alias="LLM_API_BASE_GPT_4_1_BASE")
    chat_agent_llm_temp: float = 0.5
    post_creation_agent_llm_temp: float = 1.0
    retrieval_agent_llm_temp: float = 0.0

    # Authentication
    auth_api_key: str = Field(alias="AUTH_API_KEY")

    # Monitoring - Optional Langfuse settings
    langfuse_secret: str | None = Field(default=None, alias="LANGFUSE_SECRET")
    langfuse_public: str | None = Field(default=None, alias="LANGFUSE_PUBLIC")
    langfuse_host: str | None = Field(default=None, alias="LANGFUSE_HOST")

    # Core service URL
    core_url: str = Field(alias="CORE_URL")

    flows_api_url: str = Field(alias="FLOWS_API_URL")

    # Allowed HTML tags for post formatting
    allowed_post_html_tags: list[str] = ["a", "b", "br", "em", "h1", "h2", "h3", "i", "li", "ol", "p", "s", "strong", "u", "ul", "img"]

    # Unleash
    unleash_enabled: bool = Field(default=False, alias="UNLEASH_ENABLED")
    unleash_api_url: str | None = Field(default=None, alias="UNLEASH_API_URL")
    unleash_api_key: str | None = Field(default=None, alias="UNLEASH_API_KEY")
    unleash_environment: str | None = Field(default=None, alias="UNLEASH_ENVIRONMENT")

    # HTTP Client Settings
    http_client: HTTPClientSettings = Field(default_factory=HTTPClientSettings)

    @field_validator("llm_api_key", "llm_api_base_gpt_4_1_nano", "llm_api_base_gpt_4_1_mini", "llm_api_base_gpt_4_1_base", "auth_api_key")
    @classmethod
    def check_required_fields(cls, v: str, info: ValidationInfo) -> str:
        if not v or v == "your_api_key_here" or v == "your_api_base_here" or v == "your_auth_key_here":
            if info.field_name:
                env_name = info.field_name.upper()
            else:
                env_name = str(info)
            raise ValueError(f"{env_name} is required and must be set in environment variables")
        return v

    model_config = SettingsConfigDict(
        env_file="dev.env" if os.getenv("ENVIRONMENT") == "local" else None,
        env_file_encoding="utf-8",
        extra="ignore",
    )


class DatabaseSettings(BaseSettings):
    postgres_host: str = Field(default=...)
    postgres_port: int = Field(default=...)
    postgres_database: str = Field(default=...)
    postgres_username: str = Field(default=...)
    postgres_password: str = Field(default=...)
    postgres_pool_size: int = Field(default=10)

    model_config = SettingsConfigDict(
        env_file="dev.env" if os.getenv("ENVIRONMENT") == "local" else None,
        env_file_encoding="utf-8",
        extra="ignore",
    )


class RabbitMQSettings(BaseSettings):
    rabbitmq_host: str = Field(default="localhost")
    rabbitmq_port: int = Field(default=5672)
    rabbitmq_user: str = Field(default="guest")
    rabbitmq_password: str = Field(default="guest")
    max_concurrent_messages: int = Field(default=5)

    model_config = SettingsConfigDict(
        env_file="dev.env" if os.getenv("ENVIRONMENT") == "local" else None,
        env_file_encoding="utf-8",
        extra="ignore",
    )


def get_settings() -> Settings:
    return Settings()
