from collections.abc import Callable
from typing import Any

from pydantic_ai import FunctionToolset, RunContext, Tool
from pydantic_graph import GraphRunContext

from chatbot.agents.post_creation_agent.state import PostCreationAgentDependencies, PostCreationAgentState
from chatbot.agents.post_creation_agent.utils import sanitize_html


async def set_post_title_and_body(ctx: RunContext[GraphRunContext[PostCreationAgentState, PostCreationAgentDependencies]], title: str, body: str) -> str:
    """Use this tool to create a new post or update the current post.

    Args:
        title: The title of the post - should be concise and descriptive
        body: The main body content of the post - can include formatted text, links, etc.
    """
    ctx.deps.state.post.title = title
    ctx.deps.state.post.body = body
    if ctx.deps.deps.app_services.settings.allowed_post_html_tags:
        ctx.deps.state.post.body = sanitize_html(ctx.deps.state.post.body, ctx.deps.deps.app_services.settings.allowed_post_html_tags)
    return_message = "The post title and body have been successfully set"
    return return_message


async def set_post_title(ctx: RunContext[GraphRunContext[PostCreationAgentState, PostCreationAgentDependencies]], title: str) -> str:
    """Set the title of the current post.

    Args:
        title: The title of the post - should be concise and descriptive
    """
    ctx.deps.state.post.title = title
    return_message = "The post title has been successfully set"
    return return_message


async def set_post_body(ctx: RunContext[GraphRunContext[PostCreationAgentState, PostCreationAgentDependencies]], body: str) -> str:
    """Set the body of the current post.

    Args:
        body: The main body content of the post - can include formatted text, links, etc.
    """
    ctx.deps.state.post.body = body
    if ctx.deps.deps.app_services.settings.allowed_post_html_tags:
        ctx.deps.state.post.body = sanitize_html(ctx.deps.state.post.body, ctx.deps.deps.app_services.settings.allowed_post_html_tags)
    return_message = "The post body has been successfully set"
    return return_message


async def get_post_title(ctx: RunContext[GraphRunContext[PostCreationAgentState, PostCreationAgentDependencies]]) -> str:
    """Get the title of the current post."""
    if not ctx.deps.state.post or (not ctx.deps.state.post.body and not ctx.deps.state.post.title):
        return_message = "No post has been created yet. Use search tools to gather relevant information before creating a post."
    elif not ctx.deps.state.post.title:
        return_message = "No title has been set for the current post, please set a title first"
    else:
        return_message = f"Title of the current post is:\n\n {ctx.deps.state.post.title}"
    return return_message


async def get_post_body(ctx: RunContext[GraphRunContext[PostCreationAgentState, PostCreationAgentDependencies]]) -> str:
    """Get the body of the current post."""
    if not ctx.deps.state.post or (not ctx.deps.state.post.body and not ctx.deps.state.post.title):
        return_message = "No post has been created yet. Use search tools to gather relevant information before creating a post."
    elif not ctx.deps.state.post.body:
        return_message = f"No body has been set for the current post with title '{ctx.deps.state.post.title}'. Use search tools to gather information fitting this title before creating the body."
    else:
        return_message = f"Body of the current post is:\n\n {ctx.deps.state.post.body}"
    return return_message


async def get_post(ctx: RunContext[GraphRunContext[PostCreationAgentState, PostCreationAgentDependencies]]) -> str:
    """Get the current post."""
    if not ctx.deps.state.post or (not ctx.deps.state.post.body and not ctx.deps.state.post.title):
        return_message = "No post has been created yet. Use search tools to gather relevant information before creating a post."
    elif not ctx.deps.state.post.title:
        return_message = f"Title: No title has been set for the current post, please set a title first \n\n Body: {ctx.deps.state.post.body}"
    elif not ctx.deps.state.post.body:
        return_message = f"Title: {ctx.deps.state.post.title} \n\n Body: No body has been set yet. Use search tools to gather information fitting this title before creating the body."
    else:
        return_message = f"Current post is:  \n\n Title: {ctx.deps.state.post.title} \n\n Body: {ctx.deps.state.post.body}"
    return return_message


def create_post_tools() -> FunctionToolset[GraphRunContext[PostCreationAgentState, PostCreationAgentDependencies]]:
    tools: list[Callable[..., Any]] = [set_post_title_and_body, set_post_title, set_post_body, get_post_title, get_post_body, get_post]
    return FunctionToolset(tools=[Tool(tool, takes_ctx=True) for tool in tools])
