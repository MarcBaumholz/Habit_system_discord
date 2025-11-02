"""
Pydantic models for Price Pool database entries.
"""

from pydantic import BaseModel, Field
from datetime import date
from typing import List, Optional


class PricePoolEntry(BaseModel):
    """Model for a single entry in the Price Pool database."""

    id: Optional[str] = Field(None, description="Notion page ID (after creation)")
    discord_id: str = Field(..., description="Discord ID (Title property)")
    week_date: date = Field(..., description="Week start date (Monday)")
    user_relation_id: str = Field(..., description="Notion ID for user relation")
    message: str = Field(..., description="Description of the charge")
    price: float = Field(..., gt=0.0, description="Charge amount in euros")

    class Config:
        json_schema_extra = {
            "example": {
                "discord_id": "699002308146495571",
                "week_date": "2025-10-21",
                "user_relation_id": "278d42a1-faf5-80ce-a57f-f646855a4130",
                "message": "Meditation: 2 missed (3/5 completed)",
                "price": 1.00
            }
        }


class PricePoolSummary(BaseModel):
    """Summary statistics for the Price Pool."""

    total_balance: float = Field(..., ge=0.0, description="Total accumulated balance")
    weekly_additions: float = Field(..., ge=0.0, description="Charges added this week")
    entry_count: int = Field(..., ge=0, description="Total number of entries")
    week_start: date = Field(..., description="Start of the reported week")
    entries: List[PricePoolEntry] = Field(default_factory=list, description="Individual entries")

    @property
    def average_charge(self) -> float:
        """Calculate average charge per entry."""
        if self.entry_count == 0:
            return 0.0
        return self.total_balance / self.entry_count

    def get_user_total(self, discord_id: str) -> float:
        """Get total charges for a specific user."""
        return sum(entry.price for entry in self.entries if entry.discord_id == discord_id)
