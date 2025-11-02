"""
Configuration settings for Money Agent.
"""

import os
from typing import Optional, Dict
from dotenv import load_dotenv

# Load environment variables
load_dotenv()


class MoneyAgentSettings:
    """Configuration settings for the Money Agent."""

    # Scheduling Configuration
    SCHEDULE_DAY: str = "sun"  # APScheduler uses 3-letter abbreviations
    SCHEDULE_HOUR: int = 21  # 9 PM
    SCHEDULE_MINUTE: int = 0
    SCHEDULE_TIMEZONE: str = "Europe/Berlin"

    # Pricing Configuration
    CHARGE_PER_MISS: float = 0.50  # €0.50 per missed occurrence

    # API Keys
    ANTHROPIC_API_KEY: str = os.getenv("ANTHROPIC_API_KEY", "")
    NOTION_TOKEN: str = os.getenv("NOTION_TOKEN", "")
    DISCORD_BOT_TOKEN: str = os.getenv("DISCORD_BOT_TOKEN", "")

    # Discord Configuration
    DISCORD_ACCOUNTABILITY_CHANNEL: str = os.getenv("DISCORD_ACCOUNTABILITY_GROUP", "")
    DISCORD_GUILD_ID: Optional[str] = os.getenv("DISCORD_GUILD_ID")

    # Notion Database IDs
    NOTION_DATABASE_USERS: str = os.getenv("NOTION_DATABASE_USERS", "")
    NOTION_DATABASE_HABITS: str = os.getenv("NOTION_DATABASE_HABITS", "")
    NOTION_DATABASE_PROOFS: str = os.getenv("NOTION_DATABASE_PROOFS", "")
    NOTION_DATABASE_PRICE_POOL: str = os.getenv("NOTION_DATABASE_PRICE_POOL", "")

    # Logging Configuration
    LOG_LEVEL: str = os.getenv("LOG_LEVEL", "INFO")
    LOG_FILE: str = "money_agent.log"

    # Feature Flags
    DRY_RUN: bool = os.getenv("DRY_RUN", "false").lower() == "true"
    ENABLE_DISCORD: bool = os.getenv("ENABLE_DISCORD", "true").lower() == "true"

    @classmethod
    def validate(cls) -> Dict[str, bool]:
        """
        Validate that all required settings are configured.

        Returns:
            Dictionary with validation results for each setting.
        """
        validations = {
            "anthropic_api_key": bool(cls.ANTHROPIC_API_KEY),
            "notion_token": bool(cls.NOTION_TOKEN),
            "discord_bot_token": bool(cls.DISCORD_BOT_TOKEN),
            "discord_channel": bool(cls.DISCORD_ACCOUNTABILITY_CHANNEL),
            "database_users": bool(cls.NOTION_DATABASE_USERS),
            "database_habits": bool(cls.NOTION_DATABASE_HABITS),
            "database_proofs": bool(cls.NOTION_DATABASE_PROOFS),
            "database_price_pool": bool(cls.NOTION_DATABASE_PRICE_POOL),
        }
        return validations

    @classmethod
    def is_valid(cls) -> bool:
        """
        Check if all required settings are configured.

        Returns:
            True if all settings are valid, False otherwise.
        """
        return all(cls.validate().values())

    @classmethod
    def get_missing_settings(cls) -> list[str]:
        """
        Get list of missing or invalid settings.

        Returns:
            List of setting names that are not configured.
        """
        validations = cls.validate()
        return [key for key, valid in validations.items() if not valid]

    @classmethod
    def print_status(cls) -> None:
        """Print configuration status."""
        print("\n" + "=" * 60)
        print("💰 MONEY AGENT CONFIGURATION STATUS")
        print("=" * 60)

        validations = cls.validate()
        for key, valid in validations.items():
            status = "✅" if valid else "❌"
            print(f"{status} {key.replace('_', ' ').title()}")

        print("\n" + "=" * 60)
        print(f"Schedule: Every {cls.SCHEDULE_DAY.title()} at {cls.SCHEDULE_HOUR:02d}:{cls.SCHEDULE_MINUTE:02d} {cls.SCHEDULE_TIMEZONE}")
        print(f"Charge per miss: €{cls.CHARGE_PER_MISS}")
        print(f"Dry run mode: {cls.DRY_RUN}")
        print(f"Discord enabled: {cls.ENABLE_DISCORD}")
        print("=" * 60 + "\n")

    @classmethod
    def get_database_id(cls, db_name: str) -> Optional[str]:
        """
        Get database ID by name.

        Args:
            db_name: Name of the database (users, habits, proofs, price_pool)

        Returns:
            Database ID or None if not found.
        """
        db_map = {
            "users": cls.NOTION_DATABASE_USERS,
            "habits": cls.NOTION_DATABASE_HABITS,
            "proofs": cls.NOTION_DATABASE_PROOFS,
            "price_pool": cls.NOTION_DATABASE_PRICE_POOL,
        }
        return db_map.get(db_name.lower())


# Create singleton instance
settings = MoneyAgentSettings()
