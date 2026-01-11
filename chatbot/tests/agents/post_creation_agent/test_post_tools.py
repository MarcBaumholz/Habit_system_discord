from unittest.mock import MagicMock

import pytest

from chatbot.agents.post_creation_agent import structured_outputs, tools
from chatbot.agents.post_creation_agent.state import PostCreationAgentDependencies, PostCreationAgentState

Post = structured_outputs.Post


@pytest.fixture
def mock_run_context():
    """Creates a mock RunContext for testing post tools. We need to mock here since the tools are called by the agent within a RunContext object that than holds the GraphRunContext object."""
    mock_graph_run_context = MagicMock()
    mock_graph_run_context.state = PostCreationAgentState()
    mock_deps = MagicMock(spec=PostCreationAgentDependencies)
    mock_app_services = MagicMock()
    mock_settings = MagicMock()
    mock_settings.allowed_post_html_tags = []
    mock_app_services.settings = mock_settings
    mock_deps.app_services = mock_app_services

    mock_graph_run_context.deps = mock_deps

    mock_run_ctx = MagicMock()
    mock_run_ctx.deps = mock_graph_run_context
    return mock_run_ctx


@pytest.mark.asyncio
async def test_set_post_title_and_body(mock_run_context):
    msg = await tools.set_post_title_and_body(mock_run_context, title="My Title", body="My Body")
    assert "successfully set" in msg
    assert mock_run_context.deps.state.post.title == "My Title"
    assert mock_run_context.deps.state.post.body == "My Body"


@pytest.mark.asyncio
async def test_set_post_title(mock_run_context):
    mock_run_context.deps.state.post.body = "Keep Body"
    msg = await tools.set_post_title(mock_run_context, title="Updated Title")
    assert "successfully set" in msg
    assert mock_run_context.deps.state.post.title == "Updated Title"
    assert mock_run_context.deps.state.post.body == "Keep Body"


@pytest.mark.asyncio
async def test_set_post_body(mock_run_context):
    mock_run_context.deps.state.post.title = "Keep Title"
    msg = await tools.set_post_body(mock_run_context, body="New Body")
    assert "successfully set" in msg
    assert mock_run_context.deps.state.post.title == "Keep Title"
    assert mock_run_context.deps.state.post.body == "New Body"


@pytest.mark.asyncio
async def test_get_post_title_none(mock_run_context):
    mock_run_context.deps.state.post = None
    msg = await tools.get_post_title(mock_run_context)
    assert "No post has been created yet" in msg


@pytest.mark.asyncio
async def test_get_post_title_existing(mock_run_context):
    mock_run_context.deps.state.post.title = "Some Title"
    msg = await tools.get_post_title(mock_run_context)
    assert "Some Title" in msg


@pytest.mark.asyncio
async def test_get_post_body_none(mock_run_context):
    mock_run_context.deps.state.post = None
    msg = await tools.get_post_body(mock_run_context)
    assert "No post has been created yet" in msg


@pytest.mark.asyncio
async def test_get_post_body_existing(mock_run_context):
    mock_run_context.deps.state.post.body = "Some Body"
    msg = await tools.get_post_body(mock_run_context)
    assert "Some Body" in msg


@pytest.mark.asyncio
async def test_get_post_none(mock_run_context):
    mock_run_context.deps.state.post = None
    msg = await tools.get_post(mock_run_context)
    assert "No post has been created yet" in msg


@pytest.mark.asyncio
async def test_get_post_existing(mock_run_context):
    mock_run_context.deps.state.post.title = "T"
    mock_run_context.deps.state.post.body = "C"
    msg = await tools.get_post(mock_run_context)
    assert "T" in msg
    assert "C" in msg


@pytest.mark.asyncio
async def test_set_post_body_sanitizes_html(mock_run_context):
    mock_run_context.deps.deps.app_services.settings.allowed_post_html_tags = ["i"]
    html_body = "<i>Italic</i><div>Div</div>"
    await tools.set_post_body(mock_run_context, body=html_body)
    assert "<i>Italic</i>" in mock_run_context.deps.state.post.body
    assert "<div>" not in mock_run_context.deps.state.post.body
    assert "Div" in mock_run_context.deps.state.post.body


@pytest.mark.asyncio
async def test_set_post_title_and_body_sanitizes_html(mock_run_context):
    mock_run_context.deps.deps.app_services.settings.allowed_post_html_tags = ["b"]
    html_body = "<b>Bold</b><script>alert('x')</script>"
    msg = await tools.set_post_title_and_body(mock_run_context, title="Test Title", body=html_body)
    assert "successfully set" in msg
    assert "<b>Bold</b>" in mock_run_context.deps.state.post.body
    assert "<script>" not in mock_run_context.deps.state.post.body
    assert "alert('x')" not in mock_run_context.deps.state.post.body


@pytest.mark.asyncio
async def test_set_post_body_without_allowed_html_tags_preserves_html(mock_run_context):
    html_body = "<span>Span</span>"
    await tools.set_post_body(mock_run_context, body=html_body)
    assert "<span>Span</span>" in mock_run_context.deps.state.post.body


@pytest.mark.asyncio
async def test_set_post_title_and_body_does_not_sanitize_title(mock_run_context):
    html_title = "<h1>Header</h1>"
    html_body = "Body"
    mock_run_context.deps.deps.app_services.settings.allowed_post_html_tags = ["b"]
    await tools.set_post_title_and_body(mock_run_context, title=html_title, body=html_body)
    assert html_title in mock_run_context.deps.state.post.title
