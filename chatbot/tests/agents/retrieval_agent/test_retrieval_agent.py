import json

import pytest
from pydantic_ai.messages import ModelResponse, TextPart, ToolReturnPart
from pydantic_ai.models.function import FunctionModel
from pydantic_graph import End, GraphRunContext

from chatbot.agents.retrieval_agent.agent import (
    EvaluateResultsNode,
    ProcessMessageNode,
)
from chatbot.agents.retrieval_agent.state import RetrievalAgentDependencies, RetrievalAgentState
from chatbot.agents.shared.ai_models import ModelType
from chatbot.pydantic_models import Document


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


@pytest.mark.asyncio
async def test_process_message_node_returns_evaluate_results_node(mock_graph_run_context):
    for model_type in ModelType:
        mock_graph_run_context.deps.app_services.models[model_type].custom_output_text = "Some output"
    node = ProcessMessageNode()
    result = await node.run(mock_graph_run_context)
    assert isinstance(result, EvaluateResultsNode)


@pytest.mark.asyncio
async def test_evaluate_results_node_sufficient_returns_end(mock_graph_run_context, model_profile):
    mock_graph_run_context.state.second_stage_results = [Document(page_content="doc1")]

    def logic(messages, info):
        json_response = json.dumps({"sufficiency_score": 85, "missing_information": ""})
        return ModelResponse(parts=[TextPart(content=json_response)])

    function_model = FunctionModel(logic, profile=model_profile)
    for model_type in ModelType:
        mock_graph_run_context.deps.app_services.models[model_type] = function_model
    node = EvaluateResultsNode()
    result = await node.run(mock_graph_run_context)
    assert isinstance(result, End)


@pytest.mark.asyncio
async def test_evaluate_results_node_insufficient_returns_process_message_node(mock_graph_run_context, model_profile):
    mock_graph_run_context.state.second_stage_results = [Document(page_content="doc1")]

    def logic(messages, info):
        json_response = json.dumps({"sufficiency_score": 30, "missing_information": "More details needed"})
        return ModelResponse(parts=[TextPart(content=json_response)])

    function_model = FunctionModel(logic, profile=model_profile)
    for model_type in ModelType:
        mock_graph_run_context.deps.app_services.models[model_type] = function_model

    node = EvaluateResultsNode()
    result = await node.run(mock_graph_run_context)
    assert isinstance(result, ProcessMessageNode)
    assert len(mock_graph_run_context.state.messages) == 1
    assert "Missing information" in mock_graph_run_context.state.messages[0].parts[0].content


@pytest.mark.asyncio
async def test_evaluate_results_node_max_iterations_returns_end(mock_graph_run_context):
    mock_graph_run_context.state.iteration = mock_graph_run_context.deps.app_services.settings.retrieval_max_iterations
    node = EvaluateResultsNode()
    result = await node.run(mock_graph_run_context)
    assert isinstance(result, End)


@pytest.mark.asyncio
async def test_evaluate_results_node_no_results_returns_process_message_node(mock_graph_run_context):
    mock_graph_run_context.state.second_stage_results = []
    node = EvaluateResultsNode()
    result = await node.run(mock_graph_run_context)
    assert isinstance(result, ProcessMessageNode)


@pytest.mark.asyncio
async def test_process_message_node_max_iterations_returns_evaluate_results_node(mock_graph_run_context):
    mock_graph_run_context.state.iteration = mock_graph_run_context.deps.app_services.settings.retrieval_max_iterations
    node = ProcessMessageNode()
    result = await node.run(mock_graph_run_context)
    assert isinstance(result, EvaluateResultsNode)


@pytest.mark.asyncio
async def test_process_message_node_breaks_after_tool_call(mock_graph_run_context):
    for model_type in ModelType:
        mock_graph_run_context.deps.app_services.models[model_type].custom_output_text = "Test response"

    node = ProcessMessageNode()
    initial_iteration = mock_graph_run_context.state.iteration
    initial_messages_count = len(mock_graph_run_context.state.messages)

    result = await node.run(mock_graph_run_context)

    assert isinstance(result, EvaluateResultsNode)
    assert mock_graph_run_context.state.iteration == initial_iteration + 1
    assert len(mock_graph_run_context.state.messages) > initial_messages_count
    latest_message = mock_graph_run_context.state.messages[-1]
    assert any(isinstance(part, ToolReturnPart) for part in latest_message.parts)
