import logging
import math
from datetime import UTC, datetime
from typing import Literal

import httpx
from pydantic_ai import Agent, FunctionToolset, NativeOutput, RunContext, Tool
from pydantic_ai.settings import ModelSettings
from pydantic_graph import GraphRunContext

import chatbot.agents.retrieval_agent.prompts as prompts
import chatbot.agents.retrieval_agent.structured_outputs as structured_outputs
import chatbot.utils as utils
from chatbot.agents.retrieval_agent.state import RetrievalAgentDependencies, RetrievalAgentState
from chatbot.agents.shared.ai_models import ModelType
from chatbot.api_clients.semantic_search import PageVectorSearchRequest, PageVectorSearchResponse, PageVectorSearchResponseItem, PostVectorSearchRequest, PostVectorSearchResponse, PostVectorSearchResponseItem, SemanticSearchCoreApi
from chatbot.config import Settings
from chatbot.pydantic_models import Document, DocumentMetadata
from chatbot.util.auth import FlipBearerAuth

_logger = logging.getLogger(__name__)

SearchType = Literal["posts", "pages"]


def _build_search_results_response(filtered_docs: list[Document], total_retrieved: int, search_type: SearchType) -> str:
    if not filtered_docs:
        return f"No new relevant documents found from {search_type}."

    cosine_scores = [doc.metadata.retriever_score for doc in filtered_docs]
    rerank_scores = [doc.metadata.total_score or 0.0 for doc in filtered_docs]
    best_cosine = max(cosine_scores)
    worst_cosine = min(cosine_scores)
    best_rerank = max(rerank_scores)
    worst_rerank = min(rerank_scores)

    return (
        f"Found {len(filtered_docs)} relevant documents from {search_type} "
        f"(from {total_retrieved} retrieved). "
        f"Rerank scores: {worst_rerank:.1f}-{best_rerank:.1f}, "
        f"Cosine similarity: {worst_cosine:.3f}-{best_cosine:.3f}. "
        f"Higher rerank scores indicate better relevance to the query."
    )


def _parse_last_modified(value: datetime | str | None) -> datetime:
    if isinstance(value, datetime):
        return value if value.tzinfo else value.replace(tzinfo=UTC)

    if isinstance(value, str):
        try:
            parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
            return parsed if parsed.tzinfo else parsed.replace(tzinfo=UTC)
        except ValueError:
            _logger.error(f"Invalid datetime format in document metadata: {value}")

    return datetime.now(UTC)


def apply_temporal_scoring(docs: list[Document], settings: Settings, search_type: Literal["post", "page"]) -> None:
    if not docs:
        return

    recency_weight = settings.page_recency_weight if search_type == "page" else settings.post_recency_weight
    half_life_days = settings.page_recency_half_life_days if search_type == "page" else settings.post_recency_half_life_days

    # Avoid division by zero and constrain half-life to a sensible minimum.
    half_life_days = max(half_life_days, 1e-6)
    lambda_decay = math.log(2) / half_life_days
    now = datetime.now(UTC)

    for doc in docs:
        last_edited = doc.metadata.last_edited_time or now
        if last_edited.tzinfo is None:
            last_edited = last_edited.replace(tzinfo=UTC)

        age_seconds = max((now - last_edited).total_seconds(), 0.0)
        age_days = age_seconds / 86400
        decay = math.exp(-lambda_decay * age_days)

        doc.metadata.recency_decay = decay
        similarity = doc.metadata.retriever_score
        doc.metadata.temporal_score = similarity * (1 + recency_weight * decay)


async def rerank_documents(docs: list[Document], search_query: str, ctx: GraphRunContext[RetrievalAgentState, RetrievalAgentDependencies]) -> list[Document]:
    prompt = prompts.listwise_rerank_prompt.render(datetime=datetime.now().strftime("%m/%d/%Y, %H:%M:%S"), company_info=ctx.deps.company_info, research_task=ctx.state.query, search_query=search_query, documents=docs)

    expected_count = len(docs)

    def validate_and_return_ranking(ranking: structured_outputs.ListwiseRanking) -> list[structured_outputs.DocumentRanking]:
        return validate_reranking_output(ranking, expected_count)

    model = ctx.deps.app_services.models[ModelType.GPT_4_1_MINI]
    agent_name = "rerank_agent"
    agent = Agent(
        model,
        name=agent_name,
        system_prompt=prompt,
        output_type=NativeOutput(validate_and_return_ranking),
        retries=3,
        model_settings=ModelSettings(temperature=ctx.deps.app_services.settings.retrieval_agent_llm_temp, max_tokens=128),
    )

    response = await agent.run()
    ctx.deps.usage_metrics.record_llm_call_usage(agent_name, model.model_name, response.usage())
    ranking_results = response.output

    ranked_docs = []
    for doc_ranking in ranking_results:
        doc = docs[doc_ranking.index - 1]
        doc.metadata.content_relevance_score = doc_ranking.content_relevance
        doc.metadata.metadata_relevance_score = doc_ranking.metadata_relevance
        doc.metadata.search_iteration = ctx.state.iteration

        passes, total_score = doc_scoring_criterion(doc_ranking, ctx.deps.app_services.settings)
        doc.metadata.total_score = total_score

        if passes:
            ranked_docs.append(doc)

    return ranked_docs


def validate_reranking_output(ranking: structured_outputs.ListwiseRanking, expected_count: int) -> list[structured_outputs.DocumentRanking]:
    return utils.validate_listwise_output(ranking.ranked_documents, expected_count, "document")


def doc_scoring_criterion(doc_ranking: structured_outputs.DocumentRanking, config: Settings) -> tuple[bool, float]:
    content_relevance = doc_ranking.content_relevance >= (config.relevance_threshold * 100)
    metadata_consistency = doc_ranking.metadata_relevance >= (config.metadata_relevance_threshold * 100)

    total_score = (doc_ranking.content_relevance + doc_ranking.metadata_relevance) / 2

    return (content_relevance and metadata_consistency), total_score


def format_core_post_search_results(response: PostVectorSearchResponse) -> list[Document]:
    def to_document(item: PostVectorSearchResponseItem) -> Document:
        metadata = DocumentMetadata(
            id=item.post_id,
            channel_id=item.channel_id,
            chunk_id=item.chunk_id,
            title=item.title,
            source=item.source,
            last_edited_time=_parse_last_modified(item.last_modified_at),
            retriever_score=round(1 - item.score, 7),
        )
        return Document(page_content=item.chunk, metadata=metadata)

    return [to_document(item) for item in response.matches]


def format_core_page_search_results(response: PageVectorSearchResponse) -> list[Document]:
    def to_document(item: PageVectorSearchResponseItem) -> Document:
        metadata = DocumentMetadata(
            id=item.page_id,
            chunk_id=item.chunk_id,
            title=item.title,
            source=item.source,
            last_edited_time=_parse_last_modified(item.last_modified_at),
            retriever_score=round(1 - item.score, 7),
        )
        return Document(page_content=item.chunk, metadata=metadata)

    return [to_document(item) for item in response.matches]


def _parse_filter_datetime(dt_str: str | None, *, end_of_day: bool = False) -> str | None:
    if not dt_str:
        return None
    try:
        dt = datetime.fromisoformat(dt_str.replace("Z", "+00:00"))
    except ValueError:
        _logger.error(f"Invalid datetime format: {dt_str}")
        return None
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=UTC)
    if end_of_day:
        has_time_component = any(sep in dt_str for sep in ("T", "t", " "))
        if not has_time_component:
            dt = dt.replace(hour=23, minute=59, second=59, microsecond=0)
    return dt.isoformat().replace("+00:00", "Z")


async def query_semantic_search(
    client: httpx.AsyncClient,
    query: str,
    search_type: Literal["post", "page"],
    settings: Settings,
    auth: FlipBearerAuth,
    updated_from: str | None = None,
    updated_to: str | None = None,
) -> list[Document]:
    core_api = SemanticSearchCoreApi(client, settings)
    result: list[Document]
    if search_type == "post":
        post_search_request = PostVectorSearchRequest(
            top=settings.first_stage_k,
            query=query,
            updated_at_from=_parse_filter_datetime(updated_from),
            updated_at_to=_parse_filter_datetime(updated_to, end_of_day=True),
        )
        post_results = await core_api.search_posts(auth, post_search_request)
        result = format_core_post_search_results(post_results)
    else:
        page_search_request = PageVectorSearchRequest(
            top=settings.first_stage_k,
            query=query,
            updated_at_from=_parse_filter_datetime(updated_from),
            updated_at_to=_parse_filter_datetime(updated_to, end_of_day=True),
        )
        page_results = await core_api.search_pages(auth, page_search_request)
        result = format_core_page_search_results(page_results)

    filtered_result = [doc for doc in result if doc.metadata.retriever_score >= settings.cosine_similarity_threshold]
    apply_temporal_scoring(filtered_result, settings, search_type)
    filtered_result.sort(
        key=lambda doc: doc.metadata.temporal_score,
        reverse=True,
    )
    return filtered_result[: settings.second_stage_k]


async def semantic_search_posts(ctx: RunContext[GraphRunContext[RetrievalAgentState, RetrievalAgentDependencies]], query: str, start_datetime: str | None = None, end_datetime: str | None = None) -> str:
    """Perform semantic search across all posts for a single query.
    The start_datetime and end_datetime parameters can be used to limit the search by date, and both can be used independently of each other.

    Args:
        query: A descriptive search query string for semantic search
        start_datetime: Optional ISO format datetime string to filter by date from (inclusive)
        end_datetime: Optional ISO format datetime string to filter by date to (inclusive)

    Examples:
        semantic_search_posts(query="What is our current product roadmap and key milestones?")
        semantic_search_posts(query="Show me discussions about our design system implementation", start_datetime="2023-01-01", end_datetime="2023-12-31")
    """
    graph_ctx = ctx.deps
    client = graph_ctx.deps.app_services.http_client
    results = await query_semantic_search(
        client,
        query,
        search_type="post",
        auth=graph_ctx.deps.auth,
        settings=graph_ctx.deps.app_services.settings,
        updated_from=start_datetime,
        updated_to=end_datetime,
    )

    new_docs = []
    for doc in results:
        doc_id = doc.metadata.chunk_id
        if doc_id not in graph_ctx.state.seen_documents:
            new_docs.append(doc)

    new_docs = new_docs[: graph_ctx.deps.app_services.settings.second_stage_k]

    if not new_docs:
        return _build_search_results_response([], len(results), "posts")

    filtered_docs = await rerank_documents(new_docs, query, graph_ctx)

    if not filtered_docs:
        return _build_search_results_response([], len(results), "posts")

    for doc in new_docs:
        graph_ctx.state.seen_documents.add(doc.metadata.chunk_id)

    graph_ctx.state.first_stage_results.extend(new_docs)
    graph_ctx.state.second_stage_results.extend(filtered_docs)
    graph_ctx.state.second_stage_results = sorted(graph_ctx.state.second_stage_results, key=lambda x: x.metadata.total_score or -1.0, reverse=True)[: graph_ctx.deps.app_services.settings.second_stage_k]

    return _build_search_results_response(filtered_docs, len(results), "posts")


async def semantic_search_pages(
    ctx: RunContext[GraphRunContext[RetrievalAgentState, RetrievalAgentDependencies]],
    query: str,
    start_datetime: str | None = None,
    end_datetime: str | None = None,
) -> str:
    """Perform semantic search across knowledge base pages for a single query.
    The start_datetime and end_datetime parameters can be used to limit the search by date, and both can be used independently of each other.

    Args:
        query: A descriptive search query string for semantic search
        start_datetime: Optional ISO format datetime string to filter by date from (inclusive)
        end_datetime: Optional ISO format datetime string to filter by date to (inclusive)

    Examples:
        semantic_search_pages(query="What is our onboarding process for new employees?")
        semantic_search_pages(query="Find recent technical documentation about our API integration", start_datetime="2024-01-01")
    """
    graph_ctx = ctx.deps
    client = graph_ctx.deps.app_services.http_client
    results = await query_semantic_search(
        client,
        query,
        search_type="page",
        auth=graph_ctx.deps.auth,
        settings=graph_ctx.deps.app_services.settings,
        updated_from=start_datetime,
        updated_to=end_datetime,
    )

    new_docs = []
    for doc in results:
        doc_id = doc.metadata.chunk_id
        if doc_id not in graph_ctx.state.seen_documents:
            new_docs.append(doc)

    new_docs = new_docs[: graph_ctx.deps.app_services.settings.second_stage_k]

    if not new_docs:
        return _build_search_results_response([], len(results), "pages")

    filtered_docs = await rerank_documents(new_docs, query, graph_ctx)

    if not filtered_docs:
        return _build_search_results_response([], len(results), "pages")

    for doc in new_docs:
        graph_ctx.state.seen_documents.add(doc.metadata.chunk_id)

    graph_ctx.state.first_stage_results.extend(new_docs)
    graph_ctx.state.second_stage_results.extend(filtered_docs)
    graph_ctx.state.second_stage_results = sorted(graph_ctx.state.second_stage_results, key=lambda x: x.metadata.total_score or -1.0, reverse=True)[: graph_ctx.deps.app_services.settings.second_stage_k]

    return _build_search_results_response(filtered_docs, len(results), "pages")


def create_retrieval_tools() -> FunctionToolset[GraphRunContext[RetrievalAgentState, RetrievalAgentDependencies]]:
    """Create search tools for the retrieval agent."""
    tools = [semantic_search_posts, semantic_search_pages]
    return FunctionToolset(tools=[Tool(tool, takes_ctx=True) for tool in tools])
