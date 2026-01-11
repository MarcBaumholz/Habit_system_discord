from pydantic import BaseModel, Field


class FlowSelection(BaseModel):
    """Flow selection decision from the flow agent.

    The agent evaluates the user's task against available flows and selects
    the most appropriate one, or indicates that no flow applies.
    """

    index: int = Field(description=("The index of the selected flow from the available flows list. Use 0 if no flow applies to the task. Valid values are 0 (no flow) or positive integers matching the flow list."))
    return_message: str = Field(description=("The message to return to the calling agent. Explain briefly why the flow was selected or why no flow applies, phrased for end users."))
