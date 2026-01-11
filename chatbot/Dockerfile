FROM ghcr.io/astral-sh/uv:0.9.17-bookworm@sha256:b8e5461ee04b4fcf389ec8a76916b59890b58cf0bf7b9ce0d919743b3297b4b7 AS builder
ENV UV_COMPILE_BYTECODE=1 UV_LINK_MODE=copy

ENV UV_PYTHON_INSTALL_DIR=/python
ENV UV_PYTHON_PREFERENCE=only-managed

WORKDIR /app
RUN --mount=type=cache,target=/root/.cache/uv \
    --mount=type=bind,source=uv.lock,target=uv.lock \
    --mount=type=bind,source=pyproject.toml,target=pyproject.toml \
    uv sync --frozen --no-install-project --no-dev

ADD . /app
RUN --mount=type=cache,target=/root/.cache/uv \
    uv sync --frozen --no-dev

FROM cgr.dev/chainguard/wolfi-base:latest@sha256:0d8efc73b806c780206b69d62e1b8cb10e9e2eefa0e4452db81b9fa00b1a5175

COPY --from=builder --chown=python:python /python /python
COPY --from=builder --chown=app:app /app /app

RUN apk add \
    libstdc++

ENV PATH="/app/.venv/bin:$PATH"

EXPOSE 8004

ENV PYTHONUNBUFFERED=1

CMD ["uvicorn", "chatbot.api.api:app", "--host", "0.0.0.0", "--port", "8004", "--log-config", "/app/log_config.json"]
