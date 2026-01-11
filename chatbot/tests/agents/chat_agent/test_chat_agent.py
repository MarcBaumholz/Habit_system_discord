import json

import pytest
from pydantic_ai.exceptions import ModelHTTPError
from pydantic_ai.messages import ModelRequest, ModelResponse, TextPart, ToolCallPart, UserPromptPart
from pydantic_ai.models.function import AgentInfo, FunctionModel
from pydantic_graph import End, GraphRunContext

from chatbot.agents.chat_agent.agent import (
    ProcessMessageNode,
    QueryValidationNode,
    RefuseAnswerNode,
)
from chatbot.agents.chat_agent.state import ChatAgentDependencies, ChatAgentState
from chatbot.agents.flow_agent.subagent import FlowSubAgent
from chatbot.agents.shared.ai_models import ModelType
from chatbot.agents.shared.nodes import FilterUsedContextNode
from chatbot.agents.shared.subagent_registry import get_subagent_prompt_references


@pytest.fixture
def chat_agent_state():
    return ChatAgentState(
        query="test query",
        messages=[ModelRequest(parts=[UserPromptPart(content="test query")])],
        answer="",
        iteration=0,
        detected_language=None,
    )


@pytest.fixture
def mock_graph_run_context(chat_agent_state, base_dependencies):
    dependencies = ChatAgentDependencies(**base_dependencies)
    return GraphRunContext(state=chat_agent_state, deps=dependencies)


@pytest.mark.asyncio
@pytest.mark.parametrize("refuse", [False, True])
async def test_check_refusal_node_parametrized(mock_graph_run_context, refuse, model_profile):
    def logic(messages, info):
        # For NativeOutput, return ModelResponse with TextPart containing JSON
        prompt_content = "".join(str(part.content) for m in messages for part in m.parts)

        if "refuse_question" in prompt_content.lower():
            json_response = json.dumps({"refuse_question": refuse, "reason": "Nope"})
        elif "language" in prompt_content.lower():
            json_response = json.dumps({"language": "English"})
        else:
            json_response = json.dumps({"language": "English"})

        return ModelResponse(parts=[TextPart(content=json_response)])

    function_model = FunctionModel(logic, profile=model_profile)
    for model_type in ModelType:
        mock_graph_run_context.deps.app_services.models[model_type] = function_model
    node = QueryValidationNode()
    result = await node.run(mock_graph_run_context)
    if refuse:
        assert isinstance(result, RefuseAnswerNode)
        assert mock_graph_run_context.state.refusal_reason == "Nope"
    else:
        assert isinstance(result, ProcessMessageNode)
    assert mock_graph_run_context.state.detected_language == "English"


CONTENT_FILTER_ERROR_BODY = {
    "message": "The response was filtered due to the prompt triggering Azure OpenAI's content management policy.",
    "type": None,
    "param": "prompt",
    "code": "content_filter",
    "status": 400,
    "innererror": {
        "code": "ResponsibleAIPolicyViolation",
        "content_filter_result": {"violence": {"filtered": True, "severity": "medium"}},
    },
}


@pytest.mark.asyncio
async def test_query_validation_node_handles_azure_content_filter(mock_graph_run_context, model_profile):
    def language_logic(messages, info):
        raise ModelHTTPError(status_code=400, model_name="test-model", body=CONTENT_FILTER_ERROR_BODY)

    def refusal_logic(messages, info):
        json_response = json.dumps({"refuse_question": False, "reason": ""})
        return ModelResponse(parts=[TextPart(content=json_response)])

    mock_graph_run_context.deps.app_services.models[ModelType.GPT_4_1_NANO] = FunctionModel(language_logic, profile=model_profile)
    mock_graph_run_context.deps.app_services.models[ModelType.GPT_4_1_MINI] = FunctionModel(refusal_logic, profile=model_profile)

    node = QueryValidationNode()
    result = await node.run(mock_graph_run_context)

    assert isinstance(result, RefuseAnswerNode)
    assert mock_graph_run_context.state.refusal_reason == "Content blocked by Azure safety filters: violence (severity: medium)"


@pytest.mark.asyncio
async def test_process_message_node(mock_graph_run_context):
    def final_result_output_call(messages, info: AgentInfo):
        output_tool = next((t for t in info.output_tools if t.name == "final_result"), None)
        assert output_tool is not None, "final_result output tool not found"
        return ModelResponse(parts=[ToolCallPart(tool_name=output_tool.name, args={}, tool_call_id="dummy_id")])

    async def stream_function(messages, info: AgentInfo):
        yield "Test answer content"

    function_model = FunctionModel(final_result_output_call, stream_function=stream_function)
    for model_type in ModelType:
        mock_graph_run_context.deps.app_services.models[model_type] = function_model
    node = ProcessMessageNode()
    result = await node.run(mock_graph_run_context)
    assert isinstance(result, FilterUsedContextNode)
    assert len(mock_graph_run_context.state.messages) > 0


@pytest.mark.asyncio
async def test_process_message_node_handles_azure_content_filter(mock_graph_run_context, model_profile):
    mock_graph_run_context.state.detected_language = "English"

    def logic(messages, info):
        raise ModelHTTPError(status_code=400, model_name="test-model", body=CONTENT_FILTER_ERROR_BODY)

    async def stream_logic(messages, info):
        raise ModelHTTPError(status_code=400, model_name="test-model", body=CONTENT_FILTER_ERROR_BODY)
        yield

    mock_graph_run_context.deps.app_services.models[ModelType.GPT_4_1_BASE] = FunctionModel(logic, stream_function=stream_logic, profile=model_profile)
    node = ProcessMessageNode()
    result = await node.run(mock_graph_run_context)

    assert isinstance(result, RefuseAnswerNode)
    assert mock_graph_run_context.state.refusal_reason == "Content blocked by Azure safety filters: violence (severity: medium)"


@pytest.mark.asyncio
async def test_refuse_answer_node(mock_graph_run_context):
    for model_type in ModelType:
        mock_graph_run_context.deps.app_services.models[model_type].custom_output_text = "Refusal Answer"
    mock_graph_run_context.state.refusal_reason = "Content blocked by Azure safety filters: violence (severity: medium)"
    node = RefuseAnswerNode()
    result = await node.run(mock_graph_run_context)
    assert isinstance(result, End)
    assert mock_graph_run_context.state.answer == "Refusal Answer"


@pytest.mark.asyncio
async def test_process_message_node_max_iterations(mock_graph_run_context):
    mock_graph_run_context.deps.app_services.settings.chat_max_iterations = 1

    def tool_call_always(messages, info: AgentInfo):
        return ModelResponse(parts=[ToolCallPart(tool_name="dummy_tool", args={})])

    async def stream_function(messages, info: AgentInfo):
        yield "Test answer content"

    function_model = FunctionModel(tool_call_always, stream_function=stream_function)
    for model_type in ModelType:
        mock_graph_run_context.deps.app_services.models[model_type] = function_model
    node = ProcessMessageNode()
    result = await node.run(mock_graph_run_context)
    assert isinstance(result, FilterUsedContextNode) or isinstance(result, End)


def test_get_subagents_includes_flow_agent(mock_graph_run_context):
    mock_graph_run_context.deps.app_services.feature_toggle_service.is_enabled.side_effect = lambda tenant, flag: flag == "ASK_AI_FLIP_FLOWS_ENABLED"

    prompt_references = get_subagent_prompt_references("chat_agent", mock_graph_run_context.deps)

    flow_agent = FlowSubAgent()
    assert flow_agent.prompt_reference in prompt_references
