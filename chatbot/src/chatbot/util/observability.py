import logging
from typing import cast

import logfire
from opentelemetry import metrics
from opentelemetry.attributes import BoundedAttributes
from opentelemetry.context import Context
from opentelemetry.exporter.prometheus import PrometheusMetricReader
from opentelemetry.instrumentation.aio_pika import aio_pika_instrumentor
from opentelemetry.instrumentation.aio_pika import version as aio_pika_version
from opentelemetry.sdk.metrics import MeterProvider
from opentelemetry.sdk.resources import SERVICE_NAME, Resource
from opentelemetry.sdk.trace import ReadableSpan, SpanProcessor
from opentelemetry.trace import Span, Tracer, get_tracer

from chatbot.config import Settings

_logger = logging.getLogger(__name__)


class NamespaceSpanProcessor(SpanProcessor):
    def __init__(self, namespace: str) -> None:
        self.namespace = namespace

    def on_start(self, span: Span, parent_context: Context | None = None) -> None:
        span.set_attribute("namespace", self.namespace)

    def on_end(self, span: ReadableSpan) -> None:
        pass

    def shutdown(self) -> None:
        pass

    def force_flush(self, timeout_millis: int = 30000) -> bool:
        return True


class FlipLogfireSpanProcessor(SpanProcessor):
    remove_attributes = ["logfire.json_schema", "logfire.msg", "logfire.msg_template", "graph"]

    def on_start(self, span: Span, parent_context: Context | None = None) -> None:
        # NOTE: This method removes some logfire-specialties to make the spans
        # work nicer in our tracing backend (e.g. logfire.msg becomes the span name and we're removing large unneeded
        # attributes)
        attributes = FlipLogfireSpanProcessor._get_attributes(span)
        if attributes is None:
            return None

        if "logfire.msg" in attributes and isinstance(attributes["logfire.msg"], str):
            span.update_name(attributes["logfire.msg"])

        for attr in self.remove_attributes:
            if attr in attributes:
                del attributes[attr]

        return None

    def on_end(self, span: ReadableSpan) -> None:
        pass

    def shutdown(self) -> None:
        pass

    def force_flush(self, timeout_millis: int = 30000) -> bool:
        return True

    @staticmethod
    def _get_attributes(span: Span | ReadableSpan) -> BoundedAttributes | None:
        if hasattr(span, "_attributes"):
            return cast(BoundedAttributes, span._attributes)
        return None


def _init_metrics() -> None:
    metric_reader = PrometheusMetricReader()
    metrics.set_meter_provider(MeterProvider(resource=Resource.create({SERVICE_NAME: "chatbot-askai"}), metric_readers=[metric_reader]))


def init_opentelemetry(settings: Settings) -> None:
    _init_metrics()

    if not settings.tracing_enabled:
        _logger.info("Tracing disabled")
    else:
        logfire.configure(send_to_logfire=False, service_name="chatbot-askai", metrics=False, additional_span_processors=[NamespaceSpanProcessor(settings.namespace), FlipLogfireSpanProcessor()], inspect_arguments=False, scrubbing=False)
        logfire.instrument_pydantic_ai(version=1)
        logfire.instrument_httpx()
        logfire.instrument_openai()

        _logger.info(f"Tracing initialized with Logfire and namespace '{settings.namespace}'")


def get_aio_pika_tracer() -> Tracer:
    return get_tracer(
        aio_pika_instrumentor._INSTRUMENTATION_MODULE_NAME,
        aio_pika_version.__version__,
        schema_url="https://opentelemetry.io/schemas/1.11.0",
    )


tracer = get_tracer("chatbot-askai")
meter = metrics.get_meter("chatbot-askai")
