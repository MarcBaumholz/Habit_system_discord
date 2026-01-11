import logging
from dataclasses import dataclass

import httpx
from httpx import AsyncHTTPTransport
from pydantic_ai.retries import AsyncTenacityTransport, wait_retry_after
from pydantic_ai.retries import RetryConfig as PydanticAiRetryConfig
from tenacity import before_sleep_log, retry_if_exception_type
from tenacity.stop import StopBaseT
from tenacity.wait import WaitBaseT

from chatbot.config import HTTPClientSettings
from chatbot.util.rate_limit_metrics import openai_rate_limit_metrics

_logger = logging.getLogger(__name__)


@dataclass
class HttpClientRetryConfig:
    stop: StopBaseT
    wait: WaitBaseT
    retry_after_timeout: int = 60


def create_http_client(http_settings: HTTPClientSettings, retry_config: HttpClientRetryConfig | None = None) -> httpx.AsyncClient:
    transport: httpx.AsyncBaseTransport | None = None
    if retry_config:
        transport = create_retry_transport(http_settings, retry_config)

    _logger.info(f"Creating HTTP client with settings: {http_settings} and retry: {retry_config}")
    client = httpx.AsyncClient(
        timeout=http_settings.to_timeouts(),
        limits=http_settings.to_limits(),
        transport=transport,
        event_hooks={
            "response": [openai_rate_limit_metrics],
        },
    )

    return client


def create_retry_transport(http_settings: HTTPClientSettings, retry_config: HttpClientRetryConfig) -> httpx.AsyncBaseTransport:
    retry_strategy = PydanticAiRetryConfig(
        stop=retry_config.stop,
        wait=wait_retry_after(max_wait=retry_config.retry_after_timeout, fallback_strategy=retry_config.wait),
        retry=(
            retry_if_exception_type(httpx.ConnectError)
            | retry_if_exception_type(httpx.TimeoutException)
            | retry_if_exception_type(httpx.ReadError)
            | retry_if_exception_type(httpx.WriteError)
            | retry_if_exception_type(httpx.PoolTimeout)
            | retry_if_exception_type(httpx.HTTPStatusError)
        ),
        before_sleep=before_sleep_log(_logger, logging.INFO),
        reraise=True,
    )

    def validate_response(response: httpx.Response) -> None:
        if response.status_code in (429, 502, 503, 504):
            response.raise_for_status()

    return AsyncTenacityTransport(
        config=retry_strategy,
        validate_response=validate_response,
        wrapped=AsyncHTTPTransport(
            limits=http_settings.to_limits(),
        ),
    )
