from pydantic import BaseModel, Field


class TriggerSelection(BaseModel):
    """Trigger selection decision from the trigger agent.

    The agent evaluates the user's task against available triggers and selects
    the most appropriate one, or indicates that no trigger applies.
    """

    index: int = Field(description="The index of the selected trigger from the available trigger list. Use 0 if no trigger applies to the task. Valid values are 0 (no trigger) or positive integers matching the trigger list.")
    return_message: str = Field(description="The message to return to the calling agent. Explain briefly why the trigger was selected or why no trigger applies.")
