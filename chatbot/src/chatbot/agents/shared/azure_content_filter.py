from __future__ import annotations

import logging
from collections.abc import Callable, Coroutine
from functools import wraps
from typing import Any, ParamSpec, Protocol, cast

from pydantic_ai.exceptions import ModelHTTPError
from pydantic_graph import GraphRunContext

from chatbot.agents.shared.state import AgentGraphDependencies

P = ParamSpec("P")

type AsyncFunc[**P, R] = Callable[P, Coroutine[Any, Any, R]]

_logger = logging.getLogger(__name__)


def is_azure_content_filter_error(exception: Exception) -> bool:
    if not isinstance(exception, ModelHTTPError) or exception.status_code != 400:
        return False

    if not isinstance(exception.body, dict):
        return False

    inner_error = exception.body.get("innererror")
    if isinstance(inner_error, dict) and inner_error.get("content_filter_result"):
        return True

    return exception.body.get("code") == "content_filter"


def extract_azure_content_filter_info(exception: ModelHTTPError) -> tuple[str, dict[str, str]]:
    body = cast(dict[str, Any], exception.body)

    inner_error = body.get("innererror", {})
    content_filter_result = inner_error.get("content_filter_result", {})

    filtered_categories = [f"{category} (severity: {result.get('severity', 'unknown')})" for category, result in content_filter_result.items() if isinstance(result, dict) and result.get("filtered")]

    if filtered_categories:
        reason = f"Content blocked by Azure safety filters: {', '.join(filtered_categories)}"
    else:
        reason = body.get("message", str(exception))

    return reason, cast(dict[str, str], body)


class StateWithRefusal(Protocol):
    refusal_reason: str | None
    query: str


def with_azure_content_filter_fallback[OriginalResultT, FallbackResultT](
    fallback: Callable[[], FallbackResultT],
    agent_name: str,
) -> Callable[[AsyncFunc[P, OriginalResultT]], AsyncFunc[P, OriginalResultT | FallbackResultT]]:
    """Wrap a node run method so Azure content filter errors route to a fallback node.

    Automatically populates state with refusal information and logs the error.
    """

    def decorator(func: AsyncFunc[P, OriginalResultT]) -> AsyncFunc[P, OriginalResultT | FallbackResultT]:
        @wraps(func)
        async def wrapper(*args: P.args, **kwargs: P.kwargs) -> OriginalResultT | FallbackResultT:
            try:
                return await func(*args, **kwargs)
            except Exception as exc:
                if not is_azure_content_filter_error(exc):
                    raise

                ctx = cast(GraphRunContext[StateWithRefusal, AgentGraphDependencies], args[1])
                reason, details = extract_azure_content_filter_info(cast(ModelHTTPError, exc))

                ctx.state.refusal_reason = reason

                _logger.warning(
                    f"Azure content filter triggered during {agent_name}. Refusal reason: {reason}",
                    extra={
                        "query": ctx.state.query,
                        "refusal_reason": reason,
                        "filter_details": details,
                    },
                )

                return fallback()

        return wrapper

    return decorator
