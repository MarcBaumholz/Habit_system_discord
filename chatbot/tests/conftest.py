from __future__ import annotations

from datetime import datetime
from unittest.mock import AsyncMock, MagicMock

import pytest
from pydantic_ai.models import ModelProfile
from pydantic_ai.models.test import TestModel
from pydantic_graph import GraphRunContext
from testcontainers.postgres import PostgresContainer

from chatbot.agents.chat_agent.state import ChatAgentDependencies, ChatAgentState
from chatbot.agents.flow_agent.state import FlowAgentState
from chatbot.agents.retrieval_agent import tools
from chatbot.agents.retrieval_agent.state import RetrievalAgentState
from chatbot.agents.shared.ai_models import ModelType
from chatbot.agents.shared.graph_event_streamer import GraphEventStreamer
from chatbot.api_clients.ask_ai_settings import AskAiSettingsCoreApi
from chatbot.config import Settings
from chatbot.pydantic_models import CompanyInfoData, Document, DocumentMetadata
from chatbot.util.auth import FlipBearerAuth
from chatbot.util.timing_metrics import TimingMetrics
from chatbot.util.usage_metrics import UsageMetrics


@pytest.fixture
def model_profile():
    return ModelProfile(supports_json_schema_output=True)


@pytest.fixture
def settings(monkeypatch):
    monkeypatch.setenv("LLM_API_KEY", "test_api_key")
    monkeypatch.setenv("LLM_API_BASE_GPT_4_1_NANO", "https://api.example.com")
    monkeypatch.setenv("LLM_API_BASE_GPT_4_1_MINI", "https://api.example.com")
    monkeypatch.setenv("LLM_API_BASE_GPT_4_1_BASE", "https://api.example.com")
    monkeypatch.setenv("AUTH_API_KEY", "test_auth_key")
    monkeypatch.setenv("CORE_URL", "https://core.example.com")
    monkeypatch.setenv("FLOWS_API_URL", "https://flows.example.com")
    return Settings()


@pytest.fixture
def dummy_retrieval_agent():
    retrieval_agent = AsyncMock()
    graph_run = MagicMock()
    graph_run.state = RetrievalAgentState(
        query="test query",
        first_stage_results=[Document(page_content="dummy content", metadata=DocumentMetadata(total_score=0.95))],
        second_stage_results=[Document(page_content="dummy content", metadata=DocumentMetadata(total_score=0.95))],
        messages=[],
        iteration=1,
        seen_documents=set(),
    )
    retrieval_agent.run.return_value = graph_run
    return retrieval_agent


@pytest.fixture
def dummy_flow_agent():
    flow_agent = AsyncMock()
    graph_run = MagicMock()
    graph_run.state = FlowAgentState(
        query="test query",
        selected_flow_index=1,
        answer="User wants to request time off, matching the vacation flow.",
    )
    flow_agent.run.return_value = graph_run
    return flow_agent


@pytest.fixture(autouse=True)
def mock_get_settings_from_core(monkeypatch):
    async def mock_get_settings(self, tenant: str) -> CompanyInfoData:
        return CompanyInfoData(
            assistant_name="Test AI Assistant",
            company_description="Test Company is a leading technology company focused on providing innovative solutions for frontline workers. We specialize in employee engagement and communication platforms.",
            response_guidelines="Be helpful, professional, and concise. Always provide accurate information and cite sources when possible.",
            avoid_topics="Avoid discussing personal matters, politics, or sensitive information unrelated to work.",
        )

    monkeypatch.setattr(AskAiSettingsCoreApi, "get_settings", mock_get_settings)


@pytest.fixture(autouse=True)
def mock_query_semantic_search(monkeypatch):
    async def mock_search(*args, **kwargs):
        return []

    monkeypatch.setattr(tools, "query_semantic_search", mock_search)


@pytest.fixture
def mock_timing_metrics():
    timing_metrics = MagicMock(spec=TimingMetrics)
    timing_metrics.start_total_timing.return_value = None
    timing_metrics.record_retrieval_time.return_value = None
    timing_metrics.record_time_2_first_token.return_value = None
    timing_metrics.finalize.return_value = None
    timing_metrics.start_time = 0.0
    return timing_metrics


@pytest.fixture
def mock_usage_metrics():
    usage_metrics = MagicMock(spec=UsageMetrics)
    usage_metrics.record_llm_call_usage.return_value = None
    usage_metrics.finalize.return_value = None
    return usage_metrics


@pytest.fixture
def base_dependencies(settings, mock_timing_metrics, mock_usage_metrics, model_profile):
    http_client = AsyncMock()
    mock_response = AsyncMock()
    mock_response.json.return_value = {"results": []}
    mock_response.raise_for_status = MagicMock()
    http_client.post.return_value = mock_response

    auth = FlipBearerAuth(tenant="flip", user_id="test_user", token="test_token")

    mock_app_services = MagicMock()
    mock_app_services.settings = settings
    mock_app_services.http_client = http_client
    mock_app_services.models = {model_type: TestModel(profile=model_profile) for model_type in ModelType}
    mock_app_services.feature_toggle_service = MagicMock()

    return {
        "company_info": {},
        "auth": auth,
        "timing_metrics": mock_timing_metrics,
        "usage_metrics": mock_usage_metrics,
        "event_streamer": GraphEventStreamer(debug=True),
        "current_datetime": datetime.now(),
        "app_services": mock_app_services,
    }


@pytest.fixture
def chat_agent_state():
    return ChatAgentState(
        query="test query",
        messages=[],
        answer="",
        iteration=0,
        detected_language=None,
    )


@pytest.fixture
def mock_run_context_bearer_auth(chat_agent_state, base_dependencies):
    dependencies = ChatAgentDependencies(**base_dependencies)
    dependencies.auth = FlipBearerAuth(token="test_token", tenant="test_tenant", user_id="test_user")
    graph_run_context = GraphRunContext(state=chat_agent_state, deps=dependencies)
    mock_run_ctx = MagicMock()
    mock_run_ctx.deps = graph_run_context
    return mock_run_ctx


@pytest.fixture(scope="session")
def postgres_container():
    with PostgresContainer("postgres:16") as container:
        yield container
