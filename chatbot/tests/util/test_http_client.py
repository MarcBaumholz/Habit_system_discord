from unittest.mock import Mock, patch

import httpx
import pytest
from tenacity import stop_after_attempt, wait_fixed

from chatbot.util.http_client import HttpClientRetryConfig, create_http_client, create_retry_transport


def test_create_http_client_without_retry(settings):
    client = create_http_client(settings.http_client, retry_config=None)

    assert isinstance(client, httpx.AsyncClient)
    assert "response" in client.event_hooks
    assert len(client.event_hooks["response"]) == 1


def test_create_http_client_with_retry(settings):
    retry_config = HttpClientRetryConfig(stop=stop_after_attempt(3), wait=wait_fixed(1))

    with patch("chatbot.util.http_client.create_retry_transport") as mock_retry:
        mock_retry.return_value = Mock()

        client = create_http_client(settings.http_client, retry_config=retry_config)

        assert isinstance(client, httpx.AsyncClient)
        mock_retry.assert_called_once()


def test_create_retry_transport(settings):
    retry_config = HttpClientRetryConfig(stop=stop_after_attempt(3), wait=wait_fixed(1))

    with patch("chatbot.util.http_client.AsyncTenacityTransport") as mock_transport:
        mock_transport.return_value = Mock()

        create_retry_transport(settings.http_client, retry_config)

        mock_transport.assert_called_once()
        call_args = mock_transport.call_args

        assert "config" in call_args[1]
        assert "validate_response" in call_args[1]
        assert "validate_response" in call_args[1]


def test_http_client_configuration(settings):
    client = create_http_client(settings.http_client, retry_config=None)

    assert isinstance(client, httpx.AsyncClient)


@pytest.mark.asyncio
async def test_http_client_lifecycle(settings):
    client = create_http_client(settings.http_client, retry_config=None)

    try:
        assert not client.is_closed
    finally:
        await client.aclose()
        assert client.is_closed
