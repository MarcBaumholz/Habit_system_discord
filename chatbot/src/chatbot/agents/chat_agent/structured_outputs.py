from pydantic import BaseModel, Field


class RefuseQuestion(BaseModel):
    """Determine wether a piece of context was used to answer a question or not"""

    reason: str = Field(description="Give a reason why the question should be refused or not")
    refuse_question: bool = Field(description="Whether the question should be refused or not")


class CondenseChatHistory(BaseModel):
    """Condenses the chat history into one searchable standalone question, and also detects if the user asked a question"""

    standalone_query: str = Field(description="A searchable standalone query")
    is_question: bool = Field(description="Whether or not the user has asked a question")


class UsedContext(BaseModel):
    """Determine whether a piece of context was used to answer a question or not"""

    context_was_used: bool = Field(description="Was the context used or not")


class DetectLanguage(BaseModel):
    """Detect the language of the user's latest query"""

    language: str = Field(description="Full language name (e.g., 'English', 'German', 'French', 'Spanish', 'Italian', 'Portuguese', 'Dutch')")
