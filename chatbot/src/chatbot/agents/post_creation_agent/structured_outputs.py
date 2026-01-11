from pydantic import BaseModel, Field


class Post(BaseModel):
    """A post represents a structured message that can be published to a specific channel or destination.

    This model is used to organize and format content for distribution. Each post consists of
    a title for quick identification, the main content body, and a target channel for publication.
    """

    title: str = Field(description="The title of the post - should be concise and descriptive")
    body: str = Field(description="The main body content of the post - can include formatted text, links, etc. This should be plain text, no markdown or HTML.")


class UsedContext(BaseModel):
    """Determine whether a piece of context was used to answer a question or not"""

    context_was_used: bool = Field(description="Was the context used or not")
