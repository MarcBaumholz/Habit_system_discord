import json

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from pydantic_ai.exceptions import ModelHTTPError

from chatbot.api.error_handlers import handle_stream_setup_error, is_rate_limit_error, register_exception_handlers

CONTENT_FILTER_ERROR_BODY = {
    "message": "The response was filtered due to the prompt triggering Azure OpenAI's content management policy.",
    "type": None,
    "param": "prompt",
    "code": "content_filter",
    "status": 400,
    "innererror": {
        "code": "ResponsibleAIPolicyViolation",
        "content_filter_result": {"violence": {"filtered": True, "severity": "medium"}},
    },
}

RATE_LIMIT_ERROR_BODY = {"error": {"message": "Rate limit exceeded"}}


@pytest.fixture
def client() -> TestClient:
    app = FastAPI()
    register_exception_handlers(app)

    @app.get("/model_http_error/content_filter")
    async def _():
        raise ModelHTTPError(status_code=400, model_name="test-model", body=CONTENT_FILTER_ERROR_BODY)

    @app.get("/model_http_error/rate_limit")
    async def _():
        raise ModelHTTPError(status_code=429, model_name="test-model", body=RATE_LIMIT_ERROR_BODY)

    @app.get("/model_http_error/generic")
    async def _():
        raise ModelHTTPError(status_code=500, model_name="test-model", body={"error": "A server error"})

    @app.get("/generic_error")
    async def _():
        raise ValueError("A generic value error")

    return TestClient(app)


def test_content_filter_error_handler(client: TestClient):
    response = client.get("/model_http_error/content_filter")
    assert response.status_code == 400
    data = response.json()
    assert "Content filter triggered" in data["error"]
    assert data["status_code"] == 400
    assert "filter_details" in data
    filter_details = data["filter_details"]
    assert filter_details["innererror"]["content_filter_result"]["violence"]["filtered"] is True
    assert filter_details["innererror"]["content_filter_result"]["violence"]["severity"] == "medium"
    assert filter_details["reason"]


def test_rate_limit_error_handler(client: TestClient):
    response = client.get("/model_http_error/rate_limit")
    assert response.status_code == 429
    data = response.json()
    assert "OpenAI API rate limit exceeded" in data["error"]
    assert data["status_code"] == 429


def test_generic_model_http_error_handler(client: TestClient):
    response = client.get("/model_http_error/generic")
    assert response.status_code == 500
    data = response.json()
    assert data["error"] == "Internal server error"
    assert data["status_code"] == 500


def test_generic_value_error_is_not_content_filter(client: TestClient):
    response = client.get("/generic_error")
    assert response.status_code == 500
    data = response.json()
    assert data["error"] == "Internal server error"
    assert "filter_details" not in data


def test_is_rate_limit_error_pydantic_ai():
    error = ModelHTTPError(status_code=429, model_name="test-model", body=RATE_LIMIT_ERROR_BODY)
    assert is_rate_limit_error(error) is True
    error_400 = ModelHTTPError(status_code=400, model_name="test-model", body={})
    assert is_rate_limit_error(error_400) is False


@pytest.mark.asyncio
async def test_handle_stream_setup_error_content_filter():
    error = ModelHTTPError(status_code=400, model_name="test-model", body=CONTENT_FILTER_ERROR_BODY)
    result_str = await handle_stream_setup_error(error)
    result = json.loads(result_str)

    assert result["status_code"] == 400
    assert "Content filter triggered" in result["error"]
    filter_details = result["filter_details"]
    assert filter_details["innererror"]["content_filter_result"]["violence"]["filtered"] is True
    assert filter_details["innererror"]["content_filter_result"]["violence"]["severity"] == "medium"
    assert filter_details["reason"]


@pytest.mark.asyncio
async def test_handle_stream_setup_error_rate_limit():
    error = ModelHTTPError(status_code=429, model_name="test-model", body=RATE_LIMIT_ERROR_BODY)
    result_str = await handle_stream_setup_error(error)
    result = json.loads(result_str)

    assert result["status_code"] == 429
    assert "OpenAI API rate limit exceeded" in result["error"]
