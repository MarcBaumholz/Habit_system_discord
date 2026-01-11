from enum import Enum
from typing import Annotated, Literal

from pydantic import BaseModel, Discriminator, Field


class ConditionType(str, Enum):
    ATTRIBUTE_ANY_OF = "ATTRIBUTE_ANY_OF"


class AssignmentRuleCondition(BaseModel):
    """A condition that must be met for the rule to apply."""

    type: ConditionType = Field(default=ConditionType.ATTRIBUTE_ANY_OF)
    attribute_technical_name: str = Field(description="The technical name of the attribute definition.")
    values: list[str] = Field(description="The attribute values to match.", min_length=1, max_length=10)


class AssignmentRule(BaseModel):
    """A rule that assigns users to a group with a specific role based on conditions."""

    role_id: str = Field(description="The ID of the role to assign.")
    conditions: list[AssignmentRuleCondition] = Field(
        description="Conditions that must ALL be met (logical AND).",
        min_length=1,
        max_length=5,
    )


class GenerateAssignmentRulesSuccess(BaseModel):
    """Success result with generated rules."""

    status: Literal["SUCCESS"] = "SUCCESS"
    rules: list[AssignmentRule] = Field(
        description="The generated assignment rules. Multiple rules are combined with logical OR.",
        max_length=5,
    )


class GenerateAssignmentRulesError(BaseModel):
    """Error result when rules cannot be generated."""

    status: Literal["ERROR"] = "ERROR"
    error_message: str = Field(description="An error message explaining why rules could not be generated.")


class GenerateAssignmentRulesResult(BaseModel):
    """Wrapper for the assignment rules generation result."""

    result: Annotated[
        GenerateAssignmentRulesSuccess | GenerateAssignmentRulesError,
        Discriminator("status"),
    ] = Field(description="The result of the assignment rules generation.")
