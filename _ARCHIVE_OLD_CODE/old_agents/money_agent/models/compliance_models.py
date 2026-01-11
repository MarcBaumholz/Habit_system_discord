"""
Pydantic models for habit compliance tracking.
"""

from pydantic import BaseModel, Field
from datetime import date
from typing import List, Optional


class HabitCompliance(BaseModel):
    """Model for tracking compliance of a single habit."""

    habit_id: str = Field(..., description="Notion ID of the habit")
    habit_name: str = Field(..., description="Name of the habit")
    target_frequency: int = Field(..., ge=0, description="Expected number of completions per week")
    actual_proofs: int = Field(..., ge=0, description="Actual number of proofs submitted")
    missed_count: int = Field(..., ge=0, description="Number of missed occurrences")
    charge: float = Field(..., ge=0.0, description="Charge amount for missed occurrences")

    @property
    def is_completed(self) -> bool:
        """Check if habit was fully completed."""
        return self.missed_count == 0

    @property
    def completion_rate(self) -> float:
        """Calculate completion rate as percentage."""
        if self.target_frequency == 0:
            return 100.0
        return (self.actual_proofs / self.target_frequency) * 100


class UserCompliance(BaseModel):
    """Model for tracking all habits compliance for a single user."""

    user_id: str = Field(..., description="Notion ID of the user")
    discord_id: str = Field(..., description="Discord ID of the user")
    name: str = Field(..., description="Display name of the user")
    habits: List[HabitCompliance] = Field(default_factory=list, description="List of habit compliance records")
    total_charge: float = Field(..., ge=0.0, description="Total charge for all missed habits")
    week_start: date = Field(..., description="Start date of the week (Monday)")
    week_end: date = Field(..., description="End date of the week (Sunday)")

    @property
    def has_charges(self) -> bool:
        """Check if user has any charges."""
        return self.total_charge > 0

    @property
    def perfect_week(self) -> bool:
        """Check if user completed all habits perfectly."""
        return all(habit.is_completed for habit in self.habits)

    @property
    def total_habits(self) -> int:
        """Get total number of habits."""
        return len(self.habits)

    @property
    def completed_habits(self) -> int:
        """Get number of perfectly completed habits."""
        return sum(1 for habit in self.habits if habit.is_completed)


class Charge(BaseModel):
    """Model for a single charge entry to be saved in Price Pool DB."""

    discord_id: str = Field(..., description="Discord ID of the user")
    user_notion_id: str = Field(..., description="Notion ID for user relation")
    week_date: date = Field(..., description="Start date of the week (Monday)")
    habit_name: str = Field(..., description="Name of the missed habit")
    missed_count: int = Field(..., ge=1, description="Number of missed occurrences")
    charge: float = Field(..., gt=0.0, description="Charge amount")
    message: str = Field(..., description="Descriptive message about the charge")

    def format_message(self) -> str:
        """Format the charge message."""
        return f"{self.habit_name}: {self.missed_count} missed ({self.charge}€)"


class WeeklyReport(BaseModel):
    """Model for the complete weekly accountability report."""

    week_start: date = Field(..., description="Start date of the week (Monday)")
    week_end: date = Field(..., description="End date of the week (Sunday)")
    user_compliance: List[UserCompliance] = Field(default_factory=list, description="Compliance data for all users")
    total_weekly_charges: float = Field(..., ge=0.0, description="Total charges for this week")
    total_pool_balance: float = Field(..., ge=0.0, description="Cumulative pool balance")
    generated_at: date = Field(default_factory=date.today, description="Date report was generated")

    @property
    def total_users(self) -> int:
        """Get total number of users in report."""
        return len(self.user_compliance)

    @property
    def users_with_charges(self) -> int:
        """Get number of users with charges."""
        return sum(1 for user in self.user_compliance if user.has_charges)

    @property
    def perfect_users(self) -> int:
        """Get number of users with perfect weeks."""
        return sum(1 for user in self.user_compliance if user.perfect_week)
