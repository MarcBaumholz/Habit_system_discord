.PHONY: sync test test-% test-integration snapshot-fix fix check generate

# Ensure $HOME/.local/bin is in PATH for all targets
export PATH := $(HOME)/.local/bin:$(PATH)
ROOT_DIR := $(shell dirname $(realpath $(firstword $(MAKEFILE_LIST))))

# Sync dependencies
sync:
	uv sync --all-extras --dev --frozen

# Run all tests
test: sync
	uv run pytest tests -v

# Run tests for a specific agent, e.g. make test-retrieval_agent
# Usage: make test-<agent_name>
test-%: sync
	uv run pytest tests/agents/$* -v

test-integration: sync
	uv run pytest tests/api -v

snapshot-fix: sync
	uv run pytest tests -v --inline-snapshot=create,fix

fix: sync
	uv run ruff format
	uv run ruff check --fix

check: sync
	uv run ruff format --check
	uv run mypy
	uv run ruff check

makemigrations: sync
	uv run alembic/generate_migrations.py

generate: sync
	rm -rf $(ROOT_DIR)/src/chatbot/openapi/generated
	rm -rf $(ROOT_DIR)/codegen/tmp

	# Join multiple specs and filter operations
	redocly join askai user-group-rules \
	   --config $(ROOT_DIR)/codegen/redocly.yaml \
	   --output $(ROOT_DIR)/codegen/tmp/merged.yaml

	redocly bundle merged \
	   --config $(ROOT_DIR)/codegen/redocly.yaml \
	   --output $(ROOT_DIR)/codegen/tmp/api.yaml

	uv run \
	   fastapi-codegen \
	   --python-version 3.13 \
	   --input $(ROOT_DIR)/codegen/tmp/api.yaml \
	   --generate-routers \
	   --template-dir $(ROOT_DIR)/codegen/templates \
	   --custom-visitor $(ROOT_DIR)/codegen/call_expression_visitor.py \
	   --output $(ROOT_DIR)/src/chatbot/openapi/generated \
	   --output-model-type pydantic_v2.BaseModel \
	   --enum-field-as-literal all \
	   --disable-timestamp \
	   --use-type-alias
