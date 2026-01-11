import httpx
from opentelemetry.metrics._internal.instrument import Gauge

from chatbot.util.observability import meter

remaining_requests = meter.create_gauge("openai_rate_limit_remaining_requests")
requests_limit = meter.create_gauge("openai_rate_limit_requests_limit")

remaining_tokens = meter.create_gauge("openai_rate_limit_remaining_tokens")
tokens_limit = meter.create_gauge("openai_rate_limit_tokens_limit")

requests_per_region = meter.create_counter("openai_requests_per_region")


def _set_gauge_value_from_header(gauge: Gauge, deployment_name: str, header_value: str | None) -> None:
    if header_value is None:
        return

    if not header_value.isdigit():
        return

    gauge.set(int(header_value), {"deployment_name": deployment_name})


async def openai_rate_limit_metrics(response: httpx.Response) -> None:
    headers = response.headers
    deployment_name = headers.get("x-ms-deployment-name")

    if deployment_name:
        _set_gauge_value_from_header(remaining_requests, deployment_name, headers.get("x-ratelimit-remaining-requests"))
        _set_gauge_value_from_header(requests_limit, deployment_name, headers.get("x-ratelimit-limit-requests"))

        _set_gauge_value_from_header(remaining_tokens, deployment_name, headers.get("x-ratelimit-remaining-tokens"))
        _set_gauge_value_from_header(tokens_limit, deployment_name, headers.get("x-ratelimit-limit-tokens"))

        region = headers.get("x-ms-region")
        if region:
            requests_per_region.add(1, {"deployment_name": deployment_name, "region": region})
