import sys

from pythonjsonlogger.json import JsonFormatter

from chatbot.config import Settings


def init_logging(settings: Settings) -> None:
    import logging

    log_format = "%(asctime)s %(levelname)s [%(name)s] [%(filename)s:%(lineno)d] - %(message)s"

    root_logger = logging.getLogger()
    root_logger.setLevel(settings.log_level)
    for handler in root_logger.handlers[:]:
        root_logger.removeHandler(handler)

    formatter: logging.Formatter
    if settings.environment == "local":
        formatter = logging.Formatter(
            fmt=log_format,
        )
    else:
        formatter = JsonFormatter(
            log_format,
            rename_fields={"levelname": "level", "asctime": "timestamp", "otelSpanID": "span_id", "otelTraceID": "trace_id", "otelTraceSampled": "trace_sampled"},
        )

    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(formatter)
    root_logger.addHandler(handler)

    logging.getLogger("azure.core.pipeline.policies.http_logging_policy").setLevel(logging.WARNING)
    logging.getLogger("httpx").setLevel(logging.WARNING)
