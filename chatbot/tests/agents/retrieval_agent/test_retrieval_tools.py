import math
from datetime import UTC, datetime, timedelta
from unittest.mock import MagicMock

import pytest
from pydantic_graph import GraphRunContext

from chatbot.agents.retrieval_agent import tools as retrieval_tools
from chatbot.agents.retrieval_agent.state import RetrievalAgentDependencies, RetrievalAgentState
from chatbot.agents.retrieval_agent.tools import semantic_search_pages, semantic_search_posts
from chatbot.pydantic_models import Document, DocumentMetadata


@pytest.fixture
def retrieval_agent_state():
    return RetrievalAgentState(
        query="test query",
        first_stage_results=[],
        second_stage_results=[],
        seen_documents=set(),
        messages=[],
        iteration=0,
    )


@pytest.fixture
def mock_graph_run_context(retrieval_agent_state, base_dependencies):
    dependencies = RetrievalAgentDependencies(
        **base_dependencies,
    )

    return GraphRunContext(state=retrieval_agent_state, deps=dependencies)


@pytest.mark.parametrize(
    "search_function,expected_message_type",
    [
        (semantic_search_posts, "posts"),
        (semantic_search_pages, "pages"),
    ],
)
@pytest.mark.asyncio
async def test_search_functions_filter_documents_correctly(search_function, expected_message_type, mock_graph_run_context, monkeypatch):
    mock_results = [
        Document(page_content="Good content", metadata=DocumentMetadata(chunk_id="1", retriever_score=0.8, total_score=0.9)),
        Document(page_content="Poor content", metadata=DocumentMetadata(chunk_id="2", retriever_score=0.3, total_score=0.2)),
    ]

    async def mock_query_semantic_search(*args, **kwargs):
        return mock_results

    async def mock_rerank_documents(docs, query, ctx):
        filtered = []
        for doc in docs:
            if doc.metadata.total_score >= 0.5:
                filtered.append(doc)
        return filtered

    monkeypatch.setattr("chatbot.agents.retrieval_agent.tools.query_semantic_search", mock_query_semantic_search)
    monkeypatch.setattr("chatbot.agents.retrieval_agent.tools.rerank_documents", mock_rerank_documents)

    run_context = MagicMock()
    run_context.deps = mock_graph_run_context

    result = await search_function(run_context, "test query")

    assert f"Found 1 relevant documents from {expected_message_type}" in result
    assert len(mock_graph_run_context.state.first_stage_results) == 2
    assert len(mock_graph_run_context.state.second_stage_results) == 1
    assert mock_graph_run_context.state.second_stage_results[0].metadata.chunk_id == "1"
    assert mock_graph_run_context.state.seen_documents == {"1", "2"}


@pytest.mark.parametrize(
    "search_function,expected_message_type",
    [
        (semantic_search_posts, "posts"),
        (semantic_search_pages, "pages"),
    ],
)
@pytest.mark.asyncio
async def test_search_functions_handle_no_documents(search_function, expected_message_type, mock_graph_run_context):
    run_context = MagicMock()
    run_context.deps = mock_graph_run_context

    result = await search_function(run_context, "test query")

    assert result == f"No new relevant documents found from {expected_message_type}."
    assert len(mock_graph_run_context.state.first_stage_results) == 0
    assert len(mock_graph_run_context.state.second_stage_results) == 0


@pytest.mark.parametrize(
    "search_function,expected_message_type",
    [
        (semantic_search_posts, "posts"),
        (semantic_search_pages, "pages"),
    ],
)
@pytest.mark.asyncio
async def test_search_functions_filter_out_seen_documents(search_function, expected_message_type, mock_graph_run_context, monkeypatch):
    mock_graph_run_context.state.seen_documents = {"1"}

    mock_results = [
        Document(page_content="Seen content", metadata=DocumentMetadata(chunk_id="1", retriever_score=0.8, total_score=0.9)),
        Document(page_content="New content", metadata=DocumentMetadata(chunk_id="2", retriever_score=0.8, total_score=0.9)),
    ]

    async def mock_query_semantic_search(*args, **kwargs):
        return mock_results

    async def mock_rerank_documents(docs, query, ctx):
        return docs

    monkeypatch.setattr("chatbot.agents.retrieval_agent.tools.query_semantic_search", mock_query_semantic_search)
    monkeypatch.setattr("chatbot.agents.retrieval_agent.tools.rerank_documents", mock_rerank_documents)

    run_context = MagicMock()
    run_context.deps = mock_graph_run_context

    result = await search_function(run_context, "test query")

    assert f"Found 1 relevant documents from {expected_message_type}" in result
    assert len(mock_graph_run_context.state.first_stage_results) == 1
    assert len(mock_graph_run_context.state.second_stage_results) == 1
    assert mock_graph_run_context.state.second_stage_results[0].metadata.chunk_id == "2"


@pytest.mark.parametrize(
    "search_function",
    [semantic_search_posts, semantic_search_pages],
)
@pytest.mark.asyncio
async def test_search_functions_include_cosine_similarity_range_in_message(search_function, mock_graph_run_context, monkeypatch):
    mock_results = [
        Document(page_content="High score content", metadata=DocumentMetadata(chunk_id="1", retriever_score=0.9, total_score=0.9)),
        Document(page_content="Low score content", metadata=DocumentMetadata(chunk_id="2", retriever_score=0.6, total_score=0.7)),
    ]

    async def mock_query_semantic_search(*args, **kwargs):
        return mock_results

    async def mock_rerank_documents(docs, query, ctx):
        return docs

    monkeypatch.setattr("chatbot.agents.retrieval_agent.tools.query_semantic_search", mock_query_semantic_search)
    monkeypatch.setattr("chatbot.agents.retrieval_agent.tools.rerank_documents", mock_rerank_documents)

    run_context = MagicMock()
    run_context.deps = mock_graph_run_context

    result = await search_function(run_context, "test query")

    assert "Cosine similarity: 0.600-0.900" in result


@pytest.mark.parametrize(
    "search_function",
    [semantic_search_posts, semantic_search_pages],
)
@pytest.mark.asyncio
async def test_search_functions_respect_second_stage_k(search_function, mock_graph_run_context, monkeypatch):
    mock_graph_run_context.deps.app_services.settings.second_stage_k = 2

    mock_results = [Document(page_content=f"Content {i}", metadata=DocumentMetadata(chunk_id=f"doc{i}", retriever_score=0.8, total_score=0.9 - i * 0.1)) for i in range(5)]

    async def mock_query_semantic_search(*args, **kwargs):
        return mock_results

    async def mock_rerank_documents(docs, query, ctx):
        return docs

    monkeypatch.setattr("chatbot.agents.retrieval_agent.tools.query_semantic_search", mock_query_semantic_search)
    monkeypatch.setattr("chatbot.agents.retrieval_agent.tools.rerank_documents", mock_rerank_documents)

    run_context = MagicMock()
    run_context.deps = mock_graph_run_context

    await search_function(run_context, "test query")

    assert len(mock_graph_run_context.state.first_stage_results) == 2
    assert len(mock_graph_run_context.state.second_stage_results) == 2
    assert mock_graph_run_context.state.second_stage_results[0].metadata.chunk_id == "doc0"
    assert mock_graph_run_context.state.second_stage_results[1].metadata.chunk_id == "doc1"


@pytest.mark.asyncio
async def test_time_weighted_scoring_prioritizes_recent_docs(mock_graph_run_context, monkeypatch):
    mock_graph_run_context.deps.app_services.settings.first_stage_k = 5
    fixed_now = datetime(2024, 1, 31, tzinfo=UTC)

    class FixedDateTime(datetime):
        @classmethod
        def now(cls, tz=None):
            if tz is None:
                return fixed_now.replace(tzinfo=None)
            return fixed_now

    recent_time = fixed_now - timedelta(days=1)
    older_time = fixed_now - timedelta(days=30)

    mock_results = [
        Document(
            page_content="Older content",
            metadata=DocumentMetadata(chunk_id="old", retriever_score=0.8, last_edited_time=older_time),
        ),
        Document(
            page_content="Recent content",
            metadata=DocumentMetadata(chunk_id="new", retriever_score=0.8, last_edited_time=recent_time),
        ),
    ]

    async def mock_query_semantic_search(*args, **kwargs):
        docs = [doc for doc in mock_results]
        retrieval_tools.apply_temporal_scoring(docs, mock_graph_run_context.deps.app_services.settings, "post")
        docs.sort(key=lambda doc: doc.metadata.temporal_score, reverse=True)
        return docs

    async def mock_rerank_documents(docs, query, ctx):
        return docs

    monkeypatch.setattr("chatbot.agents.retrieval_agent.tools.datetime", FixedDateTime)
    monkeypatch.setattr("chatbot.agents.retrieval_agent.tools.query_semantic_search", mock_query_semantic_search)
    monkeypatch.setattr("chatbot.agents.retrieval_agent.tools.rerank_documents", mock_rerank_documents)

    run_context = MagicMock()
    run_context.deps = mock_graph_run_context

    await semantic_search_posts(run_context, "test query")

    first_stage_docs = mock_graph_run_context.state.first_stage_results
    assert len(first_stage_docs) == 2
    assert [doc.metadata.chunk_id for doc in first_stage_docs] == ["new", "old"]

    recent_doc, older_doc = first_stage_docs
    assert recent_doc.metadata.temporal_score > older_doc.metadata.temporal_score
    assert recent_doc.metadata.recency_decay > older_doc.metadata.recency_decay

    recency_weight = mock_graph_run_context.deps.app_services.settings.post_recency_weight
    half_life = mock_graph_run_context.deps.app_services.settings.post_recency_half_life_days
    lambda_decay = math.log(2) / half_life
    recent_decay = math.exp(-lambda_decay * 1)
    older_decay = math.exp(-lambda_decay * 30)

    assert recent_doc.metadata.recency_decay == pytest.approx(recent_decay, rel=1e-3)
    assert older_doc.metadata.recency_decay == pytest.approx(older_decay, rel=1e-3)

    expected_recent_score = 0.8 * (1 + recency_weight * recent_decay)
    expected_older_score = 0.8 * (1 + recency_weight * older_decay)

    assert recent_doc.metadata.temporal_score == pytest.approx(expected_recent_score, rel=1e-3)
    assert older_doc.metadata.temporal_score == pytest.approx(expected_older_score, rel=1e-3)
