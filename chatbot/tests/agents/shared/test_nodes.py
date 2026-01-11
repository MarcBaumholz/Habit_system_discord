import json

import pytest
from pydantic_ai.messages import ModelMessage, ModelResponse, TextPart
from pydantic_ai.models.function import AgentInfo, FunctionModel
from pydantic_graph import End, GraphRunContext

from chatbot.agents.retrieval_agent.state import RetrievalAgentState
from chatbot.agents.retrieval_agent.subagent import RetrievalSubAgent
from chatbot.agents.shared.ai_models import ModelType
from chatbot.agents.shared.nodes import FilterUsedContextNode, get_chat_title
from chatbot.agents.shared.state import AgentGraphDependencies, OrchestrationAgentState, SubAgentExecutionResult, SubAgentExecutionResults
from chatbot.pydantic_models import Document, DocumentMetadata


@pytest.fixture
def context_state_fixture():
    doc1 = Document(page_content="content 1", metadata=DocumentMetadata(id="doc1"))
    doc2 = Document(page_content="content 2", metadata=DocumentMetadata(id="doc2"))
    retrieval_agent_state = RetrievalAgentState(query="test query", first_stage_results=[], second_stage_results=[doc1, doc2], seen_documents=set(), messages=[], iteration=0)
    return OrchestrationAgentState(answer="This is the answer that uses content 1.", sub_agent_execution_results=SubAgentExecutionResults(results=[SubAgentExecutionResult(RetrievalSubAgent, retrieval_agent_state)]), refined_context=[])


@pytest.fixture
def dependencies_fixture(base_dependencies):
    return AgentGraphDependencies(**base_dependencies)


@pytest.mark.asyncio
async def test_filter_used_context_node(context_state_fixture, dependencies_fixture, model_profile):
    node = FilterUsedContextNode()

    def logic(messages: list[ModelMessage], info: AgentInfo) -> ModelResponse:
        prompt_content = "".join(str(part.content) for m in messages for part in m.parts)

        answer_part = prompt_content.split("## Answer:")[1].split("#------------------------------------------------------------#")[0].strip()
        contexts_part = prompt_content.split("## Contexts to evaluate:")[1].strip()

        used_contexts = []
        context_blocks = contexts_part.split("**Context [")

        for i, block in enumerate(context_blocks[1:], 1):
            context_content = block.split(":**")[1].split("---")[0].strip()
            context_was_used = "content 1" in context_content and "content 1" in answer_part
            used_contexts.append({"index": i, "context_was_used": context_was_used})

        json_response = json.dumps({"used_contexts": used_contexts})
        return ModelResponse(parts=[TextPart(content=json_response)])

    function_model = FunctionModel(logic, profile=model_profile)
    for model_type in ModelType:
        dependencies_fixture.app_services.models[model_type] = function_model
    context = GraphRunContext(state=context_state_fixture, deps=dependencies_fixture)

    result = await node.run(context)

    assert isinstance(result, End)
    assert len(context_state_fixture.refined_context) == 1
    assert context_state_fixture.refined_context[0].metadata.id == "doc1"


@pytest.mark.asyncio
async def test_get_chat_title(model_profile):
    chat_history = [{"user": "Hello"}, {"ai": "Hi there"}]

    def logic(messages, info):
        json_response = json.dumps({"title": "Test Chat Title"})
        return ModelResponse(parts=[TextPart(content=json_response)])

    function_model = FunctionModel(logic, profile=model_profile)
    title = await get_chat_title(function_model, chat_history)
    assert isinstance(title, str)
    assert title == "Test Chat Title"


@pytest.mark.asyncio
async def test_get_chat_title_handles_exception(model_profile):
    chat_history = [{"user": "Hello"}, {"ai": "Hi there"}]

    def logic(messages, info):
        raise Exception("Test exception")

    function_model = FunctionModel(logic, profile=model_profile)

    with pytest.raises(Exception, match="Test exception"):
        await get_chat_title(function_model, chat_history)
