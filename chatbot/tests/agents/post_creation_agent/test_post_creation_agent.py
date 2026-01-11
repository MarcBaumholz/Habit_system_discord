import pytest
from pydantic_ai import Agent
from pydantic_ai.exceptions import ModelHTTPError
from pydantic_ai.models.function import FunctionModel
from pydantic_ai.settings import ModelSettings
from pydantic_graph import GraphRunContext

import chatbot.agents.post_creation_agent.prompts as prompts
import chatbot.agents.post_creation_agent.structured_outputs as so
from chatbot.agents.post_creation_agent.agent import OutputParserNode, ProcessMessageNode, RefuseAnswerNode
from chatbot.agents.post_creation_agent.state import PostCreationAgentDependencies, PostCreationAgentState
from chatbot.agents.post_creation_agent.tools import create_post_tools
from chatbot.agents.retrieval_agent.subagent import RetrievalSubAgent
from chatbot.agents.shared.ai_models import ModelType
from chatbot.agents.shared.nodes import FilterUsedContextNode
from chatbot.agents.shared.tools.general_purpose_tools import create_general_purpose_tools

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


@pytest.fixture
def post_creation_agent_state():
    return PostCreationAgentState(
        query="test query",
        messages=[],
        answer="",
        post=so.Post(title="", body=""),
        iteration=0,
    )


@pytest.fixture
def mock_graph_run_context(post_creation_agent_state, base_dependencies):
    dependencies = PostCreationAgentDependencies(**base_dependencies)
    return GraphRunContext(state=post_creation_agent_state, deps=dependencies)


@pytest.mark.asyncio
async def test_process_message_node_sets_post_and_returns_output_parser_node(mock_graph_run_context):
    for model_type in ModelType:
        mock_graph_run_context.deps.app_services.models[model_type].custom_output_text = "Final Answer"
    node = ProcessMessageNode()
    result = await node.run(mock_graph_run_context)
    assert isinstance(result, OutputParserNode)
    assert isinstance(mock_graph_run_context.state.post, so.Post)


@pytest.mark.asyncio
async def test_process_message_node_max_iterations_returns_early(mock_graph_run_context):
    mock_graph_run_context.deps.app_services.settings.post_max_iterations = 2
    mock_graph_run_context.state.iteration = 2
    node = ProcessMessageNode()
    result = await node.run(mock_graph_run_context)
    assert isinstance(result, OutputParserNode)
    assert isinstance(mock_graph_run_context.state.post, so.Post)


@pytest.mark.asyncio
async def test_output_parser_node_sets_answer_and_returns_filter_used_context_node(mock_graph_run_context):
    mock_graph_run_context.state.post = so.Post(title="Test Title", body="Test Body")
    for model_type in ModelType:
        mock_graph_run_context.deps.app_services.models[model_type].custom_output_text = "This is the final answer."
    node = OutputParserNode()
    result = await node.run(mock_graph_run_context)
    assert isinstance(result, FilterUsedContextNode)
    assert mock_graph_run_context.state.answer == "This is the final answer."


@pytest.mark.asyncio
@pytest.mark.parametrize(
    "post_state, expected_prompt_part",
    [
        (so.Post(title="", body=""), "You must now use the `set_post_title_and_body` tool"),
        (so.Post(title="", body="Test Body"), "You must now use the `set_post_title` tool"),
        (so.Post(title="Test Title", body=""), "You must now use the `set_post_body` tool"),
    ],
    ids=["post-missing", "title-missing", "body-missing"],
)
async def test_ensure_post_creation_forces_correction(mock_graph_run_context, post_state, expected_prompt_part):
    node = ProcessMessageNode()
    mock_graph_run_context.state.post = post_state
    post_tools = create_post_tools()
    retrieval_tool = RetrievalSubAgent().as_tool()
    general_tools = create_general_purpose_tools()
    tools = list(post_tools.tools.values()) + [retrieval_tool] + list(general_tools.tools.values())
    message_agent_system_prompt = prompts.message_agent_system_prompt.render(company_info=mock_graph_run_context.deps.company_info, subagent_references=[], subagent_examples=[])
    agent = Agent(
        mock_graph_run_context.deps.app_services.models[ModelType.GPT_4_1_MINI],
        name="message_agent",
        system_prompt=message_agent_system_prompt,
        deps_type=type(mock_graph_run_context),
        tools=tools,
        model_settings=ModelSettings(temperature=mock_graph_run_context.deps.app_services.settings.post_creation_agent_llm_temp),
    )

    await node._ensure_post_creation(mock_graph_run_context, agent)

    found = any(expected_prompt_part in getattr(part, "content", "") for message in mock_graph_run_context.state.messages for part in getattr(message, "parts", []))
    assert found, f"Expected prompt part '{expected_prompt_part}' not found in state messages"


@pytest.mark.asyncio
async def test_process_message_node_handles_azure_content_filter(mock_graph_run_context, model_profile):
    def logic(messages, info):
        raise ModelHTTPError(status_code=400, model_name="test-model", body=CONTENT_FILTER_ERROR_BODY)

    mock_graph_run_context.deps.app_services.models[ModelType.GPT_4_1_MINI] = FunctionModel(logic, profile=model_profile)
    node = ProcessMessageNode()
    result = await node.run(mock_graph_run_context)

    assert isinstance(result, RefuseAnswerNode)
    assert mock_graph_run_context.state.refusal_reason == "Content blocked by Azure safety filters: violence (severity: medium)"


@pytest.mark.asyncio
async def test_refuse_answer_node(mock_graph_run_context):
    mock_graph_run_context.state.refusal_reason = "Content blocked by Azure safety filters: violence (severity: medium)"

    for model_type in ModelType:
        mock_graph_run_context.deps.app_services.models[model_type].custom_output_text = "I apologize, but I cannot complete this request."

    node = RefuseAnswerNode()
    await node.run(mock_graph_run_context)

    assert mock_graph_run_context.state.answer == "I apologize, but I cannot complete this request."
