import json
import logging
import traceback
from typing import Any, cast

import httpx
from fastapi import FastAPI, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from pydantic_ai.exceptions import ModelHTTPError
from starlette.exceptions import HTTPException as StarletteHTTPException
from starlette.requests import Request

from chatbot.agents.shared.azure_content_filter import extract_azure_content_filter_info, is_azure_content_filter_error
from chatbot.util.permission_service import MissingPermissionException, MissingUserGroupPermissionException

_logger = logging.getLogger(__name__)


def create_error_response(status_code: int, error: str, details: dict[str, Any] | None = None) -> JSONResponse:
    content = {"error": error, "status_code": status_code}
    if details:
        content.update(details)
    return JSONResponse(status_code=status_code, content=content)


async def http_exception_handler(_: Request, exc: StarletteHTTPException) -> JSONResponse:
    if exc.status_code == 500:
        _logger.error(f"HTTP 500 error: {exc.detail}\n{traceback.format_exc()}")
    return create_error_response(status_code=exc.status_code, error=str(exc.detail))


async def request_validation_exception_handler(_: Request, exc: RequestValidationError) -> JSONResponse:
    _logger.error(f"Validation error: {exc}")
    return create_error_response(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, error="Validation error", details={"detail": exc.errors()})


# Create a custom middle handler for ValueError, which is what Azure OpenAI raises for content filter
async def value_error_handler(_: Request, exc: ValueError) -> JSONResponse:
    if is_azure_content_filter_error(exc):
        return await handle_content_filter_error(exc)

    _logger.error(f"ValueError: {exc}\n{traceback.format_exc()}")
    return create_error_response(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, error="Internal server error")


async def model_http_error_handler(_: Request, exc: ModelHTTPError) -> JSONResponse:
    error_str = str(exc)
    if is_azure_content_filter_error(exc):
        reason, filter_details = _prepare_content_filter_details(exc)
        _logger.error(f"Azure OpenAI content filter triggered: Error code: {exc.status_code} - {json.dumps(filter_details)}")

        return JSONResponse(
            status_code=exc.status_code if exc.status_code else 400,
            content={"error": f"Content filter triggered - {reason}", "status_code": exc.status_code, "filter_details": filter_details},
        )

    if is_rate_limit_error(exc):
        _logger.info(f"Rate limit reached: Error code: {exc.status_code} - {error_str}")
        return create_error_response(status_code=status.HTTP_429_TOO_MANY_REQUESTS, error="OpenAI API rate limit exceeded. Please try again later.")

    _logger.error(f"Model HTTP Error: {exc}\n{traceback.format_exc()}")
    status_code = exc.status_code if exc.status_code else 500
    return JSONResponse(
        status_code=status_code,
        content={"error": "Internal server error", "status_code": status_code},
    )


async def general_exception_handler(_: Request, exc: Exception) -> JSONResponse:
    if is_azure_content_filter_error(exc):
        return await handle_content_filter_error(exc)

    if is_rate_limit_error(exc):
        return await handle_rate_limit_error(exc)

    _logger.error(f"Unhandled exception: {exc}\n{traceback.format_exc()}")
    return create_error_response(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, error="Internal server error")


def register_exception_handlers(app: FastAPI) -> None:
    # NOTE(typing): https://github.com/encode/starlette/pull/2403
    app.add_exception_handler(StarletteHTTPException, http_exception_handler)  # type: ignore
    app.add_exception_handler(RequestValidationError, request_validation_exception_handler)  # type: ignore
    app.add_exception_handler(ValueError, value_error_handler)  # type: ignore
    app.add_exception_handler(ModelHTTPError, model_http_error_handler)  # type: ignore
    app.add_exception_handler(Exception, general_exception_handler)
    app.add_exception_handler(MissingPermissionException, missing_permission_exception_handler)  # type: ignore
    app.add_exception_handler(MissingUserGroupPermissionException, missing_user_group_permission_exception_handler)  # type: ignore


def is_rate_limit_error(e: Exception) -> bool:
    error_str = str(e).lower()

    if isinstance(e, ModelHTTPError):
        if e.status_code == 429:
            return True

    if isinstance(e, httpx.HTTPStatusError) and hasattr(e, "response") and e.response and e.response.status_code == 429:
        return True

    rate_limit_indicators = ["rate limit", "rate_limit", "too many requests", "quota exceeded", "capacity", "maximum number of requests", "requests per minute", "throttled", "429"]
    return any(indicator in error_str for indicator in rate_limit_indicators)


async def handle_content_filter_error(e: Exception) -> JSONResponse:
    reason, filter_details = _prepare_content_filter_details(e)
    _logger.warning(f"Azure OpenAI content filter triggered: Error code: 400 - {json.dumps(filter_details)}")
    return create_error_response(
        status_code=status.HTTP_400_BAD_REQUEST,
        error=f"Content filter triggered - {reason}",
        details={"filter_details": filter_details},
    )


async def handle_rate_limit_error(e: Exception) -> JSONResponse:
    _logger.info(f"Rate limit reached: Error code: 429 - {str(e)}")
    return create_error_response(status_code=status.HTTP_429_TOO_MANY_REQUESTS, error="OpenAI API rate limit exceeded. Please try again later.")


async def handle_streaming_error(e: Exception) -> str:
    if isinstance(e, ModelHTTPError):
        request = Request(scope={"type": "http"})
        response = await model_http_error_handler(request, e)
        return bytes(response.body).decode()

    if is_azure_content_filter_error(e):
        reason, filter_details = _prepare_content_filter_details(e)
        _logger.warning(f"Azure OpenAI content filter triggered: Error code: 400 - {json.dumps(filter_details)}")
        return json.dumps({"error": f"Content filter triggered - {reason}", "status_code": 400, "filter_details": filter_details})

    if is_rate_limit_error(e):
        _logger.warning(f"Rate limit reached during streaming: Error code: 429 - {str(e)}")
        return json.dumps({"error": "OpenAI API rate limit exceeded. Please try again later.", "status_code": 429})

    if isinstance(e, httpx.HTTPStatusError):
        status_code = e.response.status_code if e.response else 500
        error_message = str(e)

        # Only log full stack trace for 500 errors
        if status_code >= 500:
            _logger.error(f"HTTP error during streaming: {error_message}\n{traceback.format_exc()}")
        else:
            _logger.error(f"HTTP error during streaming: {error_message}")

        return json.dumps({"error": error_message, "status_code": status_code})

    elif isinstance(e, ValueError):
        error_message = str(e)
        _logger.error(f"ValueError during streaming: {error_message}\n{traceback.format_exc()}")
        return json.dumps({"error": error_message, "status_code": 500})

    else:
        _logger.error(f"Error during streaming: {str(e)}\n{traceback.format_exc()}")
        return json.dumps({"error": str(e), "status_code": 500})


async def handle_stream_setup_error(e: Exception) -> str:
    if isinstance(e, ModelHTTPError):
        request = Request(scope={"type": "http"})
        response = await model_http_error_handler(request, e)
        return bytes(response.body).decode()

    if is_azure_content_filter_error(e):
        reason, filter_details = _prepare_content_filter_details(e)
        _logger.warning(f"Azure OpenAI content filter triggered: Error code: 400 - {json.dumps(filter_details)}")
        return json.dumps({"error": f"Content filter triggered - {reason}", "status_code": 400, "filter_details": filter_details})

    if is_rate_limit_error(e):
        error_message = str(e)
        _logger.warning(f"Rate limit reached during stream setup: Error code: 429 - {error_message}")
        return json.dumps({"error": "OpenAI API rate limit exceeded. Please try again later.", "status_code": 429})

    _logger.error(f"Error setting up stream: {str(e)}\n{traceback.format_exc()}")
    return json.dumps({"error": str(e), "status_code": 500})


def _prepare_content_filter_details(exception: Exception) -> tuple[str, dict[str, Any]]:
    reason, raw_details = extract_azure_content_filter_info(cast(ModelHTTPError, exception))

    if isinstance(raw_details, dict):
        filter_details: dict[str, Any] = dict(raw_details)
    else:
        filter_details = {"details": str(raw_details)}

    filter_details.setdefault("reason", reason)
    return reason, filter_details


async def missing_permission_exception_handler(_: Request, exception: MissingPermissionException) -> JSONResponse:
    return JSONResponse(status_code=403, content={"detail": f"Missing permission [{exception.permission}]"})


async def missing_user_group_permission_exception_handler(_: Request, exception: MissingUserGroupPermissionException) -> JSONResponse:
    return JSONResponse(status_code=403, content={"detail": f"Missing user group permission [{exception.permission}]"})
