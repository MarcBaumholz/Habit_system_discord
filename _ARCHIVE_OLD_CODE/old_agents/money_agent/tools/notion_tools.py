"""
Notion database operations for Money Agent.
"""

import asyncio
from datetime import date, datetime
from typing import List, Dict, Optional, Any
from notion_client import AsyncClient
from money_agent.config.settings import settings
from money_agent.models.price_pool_models import PricePoolEntry
import logging

logger = logging.getLogger(__name__)


class NotionTools:
    """Tools for interacting with Notion databases."""

    def __init__(self, notion_token: Optional[str] = None):
        """
        Initialize Notion tools.

        Args:
            notion_token: Notion API token (uses settings if not provided)
        """
        self.token = notion_token or settings.NOTION_TOKEN
        self.client = AsyncClient(auth=self.token)
        self.retry_count = 3
        self.retry_delay = 1.0

    async def _retry_request(self, func, *args, **kwargs) -> Any:
        """
        Retry a Notion API request with exponential backoff.

        Args:
            func: Async function to call
            *args: Positional arguments for the function
            **kwargs: Keyword arguments for the function

        Returns:
            Result from the function call
        """
        for attempt in range(self.retry_count):
            try:
                return await func(*args, **kwargs)
            except Exception as e:
                if attempt == self.retry_count - 1:
                    raise
                wait_time = self.retry_delay * (2 ** attempt)
                logger.warning(f"Request failed (attempt {attempt + 1}/{self.retry_count}): {e}. Retrying in {wait_time}s...")
                await asyncio.sleep(wait_time)

    async def get_all_users(self) -> List[Dict[str, Any]]:
        """
        Get all users from the Users database.

        Returns:
            List of user dictionaries with parsed properties.
        """
        try:
            response = await self._retry_request(
                self.client.databases.query,
                database_id=settings.NOTION_DATABASE_USERS
            )

            users = []
            for page in response.get("results", []):
                user_data = self._parse_user_page(page)
                if user_data:
                    users.append(user_data)

            logger.info(f"Retrieved {len(users)} users from Notion")
            return users

        except Exception as e:
            logger.error(f"Error fetching users: {e}")
            raise

    def _parse_user_page(self, page: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Parse a user page from Notion."""
        try:
            properties = page.get("properties", {})

            # Extract Discord ID (rich_text property, not title!)
            discord_id_prop = properties.get("DiscordID", {})
            rich_text_array = discord_id_prop.get("rich_text", [])
            discord_id = rich_text_array[0].get("text", {}).get("content", "") if rich_text_array else ""

            # Extract Name (also rich_text)
            name_prop = properties.get("Name", {})
            name_array = name_prop.get("rich_text", [])
            name = name_array[0].get("text", {}).get("content", "") if name_array else ""

            # Try nickname as fallback
            if not name:
                nickname_prop = properties.get("nickname", {})
                nickname_array = nickname_prop.get("rich_text", [])
                name = nickname_array[0].get("text", {}).get("content", "") if nickname_array else ""

            if not discord_id:
                logger.warning(f"User page {page['id']} has no DiscordID, skipping")
                return None

            return {
                "id": page["id"],
                "discord_id": discord_id,
                "name": name or discord_id,
            }

        except Exception as e:
            logger.error(f"Error parsing user page: {e}")
            return None

    async def get_user_habits(self, user_id: str) -> List[Dict[str, Any]]:
        """
        Get all habits for a specific user by querying the Habits database.

        Args:
            user_id: Notion ID of the user

        Returns:
            List of habit dictionaries.
        """
        try:
            # Query habits database filtered by User relation
            filter_config = {
                "property": "User",
                "relation": {
                    "contains": user_id
                }
            }

            response = await self._retry_request(
                self.client.databases.query,
                database_id=settings.NOTION_DATABASE_HABITS,
                filter=filter_config
            )

            habits = []
            for page in response.get("results", []):
                habit_data = self._parse_habit_page(page)
                if habit_data:
                    habits.append(habit_data)

            logger.info(f"Found {len(habits)} habits for user {user_id}")
            return habits

        except Exception as e:
            logger.error(f"Error fetching habits for user {user_id}: {e}")
            return []

    async def get_habit_details(self, habit_id: str) -> Optional[Dict[str, Any]]:
        """
        Get details for a specific habit.

        Args:
            habit_id: Notion ID of the habit

        Returns:
            Dictionary with habit details or None if not found.
        """
        try:
            response = await self._retry_request(
                self.client.pages.retrieve,
                page_id=habit_id
            )

            return self._parse_habit_page(response)

        except Exception as e:
            logger.error(f"Error fetching habit {habit_id}: {e}")
            return None

    def _parse_habit_page(self, page: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Parse a habit page from Notion."""
        try:
            properties = page.get("properties", {})

            # Extract Habit name - try "Name" first (title), then "Habit"
            name_prop = properties.get("Name", {}) or properties.get("Habit", {})
            title_array = name_prop.get("title", [])
            name = title_array[0].get("text", {}).get("content", "") if title_array else ""

            # Extract Frequency (not "Target frequency")
            frequency_prop = properties.get("Frequency", {})
            frequency = frequency_prop.get("number", 0)

            if not name:
                logger.warning(f"Habit page {page['id']} has no name, skipping")
                return None

            return {
                "id": page["id"],
                "name": name,
                "target_frequency": int(frequency) if frequency else 0,
            }

        except Exception as e:
            logger.error(f"Error parsing habit page: {e}")
            return None

    async def get_weekly_proofs(
        self,
        user_id: str,
        habit_id: str,
        week_start: date,
        week_end: date
    ) -> List[Dict[str, Any]]:
        """
        Get proofs for a specific user and habit within a date range.

        Args:
            user_id: Notion ID of the user
            habit_id: Notion ID of the habit
            week_start: Start date of the week (Monday)
            week_end: End date of the week (Sunday)

        Returns:
            List of proof dictionaries.
        """
        try:
            # Query the Proofs database with filters
            filter_config = {
                "and": [
                    {
                        "property": "User",
                        "relation": {
                            "contains": user_id
                        }
                    },
                    {
                        "property": "Habit",
                        "relation": {
                            "contains": habit_id
                        }
                    },
                    {
                        "property": "Date",
                        "date": {
                            "on_or_after": week_start.isoformat()
                        }
                    },
                    {
                        "property": "Date",
                        "date": {
                            "on_or_before": week_end.isoformat()
                        }
                    }
                ]
            }

            response = await self._retry_request(
                self.client.databases.query,
                database_id=settings.NOTION_DATABASE_PROOFS,
                filter=filter_config
            )

            proofs = []
            for page in response.get("results", []):
                proof_data = self._parse_proof_page(page)
                if proof_data:
                    proofs.append(proof_data)

            logger.info(f"Found {len(proofs)} proofs for user {user_id}, habit {habit_id}")
            return proofs

        except Exception as e:
            logger.error(f"Error fetching proofs: {e}")
            return []

    def _parse_proof_page(self, page: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Parse a proof page from Notion."""
        try:
            properties = page.get("properties", {})

            # Extract Date
            date_prop = properties.get("Date", {})
            date_str = date_prop.get("date", {}).get("start")
            proof_date = datetime.fromisoformat(date_str).date() if date_str else None

            if not proof_date:
                return None

            return {
                "id": page["id"],
                "date": proof_date,
            }

        except Exception as e:
            logger.error(f"Error parsing proof page: {e}")
            return None

    async def create_price_pool_entry(
        self,
        discord_id: str,
        week_date: date,
        user_relation_id: str,
        message: str,
        price: float,
        batch: Optional[str] = None
    ) -> Optional[Dict[str, Any]]:
        """
        Create a new entry in the Price Pool database.

        Args:
            discord_id: Discord ID (Title property)
            week_date: Week start date
            user_relation_id: Notion ID for user relation
            message: Description of the charge
            price: Charge amount
            batch: Optional batch name (e.g., "january 2026")

        Returns:
            Created page data or None if failed.
        """
        try:
            properties = {
                "Discord ID": {
                    "title": [
                        {
                            "text": {
                                "content": discord_id
                            }
                        }
                    ]
                },
                "Week date": {
                    "date": {
                        "start": week_date.isoformat()
                    }
                },
                "User": {
                    "relation": [
                        {
                            "id": user_relation_id
                        }
                    ]
                },
                "Message": {
                    "rich_text": [
                        {
                            "text": {
                                "content": message
                            }
                        }
                    ]
                },
                "Price": {
                    "number": price
                }
            }

            # Add batch field if provided
            if batch:
                properties["Batch"] = {
                    "rich_text": [
                        {
                            "text": {
                                "content": batch
                            }
                        }
                    ]
                }

            if settings.DRY_RUN:
                logger.info(f"[DRY RUN] Would create price pool entry: {discord_id} - {message} - €{price} (batch: {batch})")
                return {"id": "dry-run-id", "properties": properties}

            response = await self._retry_request(
                self.client.pages.create,
                parent={"database_id": settings.NOTION_DATABASE_PRICE_POOL},
                properties=properties
            )

            logger.info(f"Created price pool entry for {discord_id}: €{price} (batch: {batch})")
            return response

        except Exception as e:
            logger.error(f"Error creating price pool entry: {e}")
            return None

    async def get_total_price_pool(self, batch: Optional[str] = None) -> float:
        """
        Get the total accumulated balance in the Price Pool.

        Args:
            batch: Optional batch name to filter by (e.g., "january 2026")

        Returns:
            Total balance in euros.
        """
        try:
            query_params = {
                "database_id": settings.NOTION_DATABASE_PRICE_POOL
            }

            # Add batch filter if provided
            if batch:
                query_params["filter"] = {
                    "property": "Batch",
                    "rich_text": {
                        "equals": batch
                    }
                }

            response = await self._retry_request(
                self.client.databases.query,
                **query_params
            )

            total = 0.0
            for page in response.get("results", []):
                properties = page.get("properties", {})
                price_prop = properties.get("Price", {})
                price = price_prop.get("number", 0.0)
                if price:
                    total += price

            logger.info(f"Total price pool balance: €{total:.2f} (batch: {batch or 'all'})")
            return total

        except Exception as e:
            logger.error(f"Error calculating total price pool: {e}")
            return 0.0

    async def get_weekly_price_pool_entries(self, week_start: date, batch: Optional[str] = None) -> List[PricePoolEntry]:
        """
        Get all Price Pool entries for a specific week.

        Args:
            week_start: Start date of the week (Monday)
            batch: Optional batch name to filter by (e.g., "january 2026")

        Returns:
            List of PricePoolEntry objects.
        """
        try:
            # Build filters
            filters = [
                {
                    "property": "Week date",
                    "date": {
                        "equals": week_start.isoformat()
                    }
                }
            ]

            # Add batch filter if provided
            if batch:
                filters.append({
                    "property": "Batch",
                    "rich_text": {
                        "equals": batch
                    }
                })

            # Use AND filter if multiple filters
            filter_config = {"and": filters} if len(filters) > 1 else filters[0]

            response = await self._retry_request(
                self.client.databases.query,
                database_id=settings.NOTION_DATABASE_PRICE_POOL,
                filter=filter_config
            )

            entries = []
            for page in response.get("results", []):
                entry = self._parse_price_pool_page(page)
                if entry:
                    entries.append(entry)

            logger.info(f"Found {len(entries)} price pool entries for week {week_start} (batch: {batch or 'all'})")
            return entries

        except Exception as e:
            logger.error(f"Error fetching weekly price pool entries: {e}")
            return []

    def _parse_price_pool_page(self, page: Dict[str, Any]) -> Optional[PricePoolEntry]:
        """Parse a price pool page from Notion."""
        try:
            properties = page.get("properties", {})

            # Extract Discord ID (Title)
            discord_id_prop = properties.get("Discord ID", {})
            title_array = discord_id_prop.get("title", [])
            discord_id = title_array[0].get("text", {}).get("content", "") if title_array else ""

            # Extract Week date
            date_prop = properties.get("Week date", {})
            date_str = date_prop.get("date", {}).get("start")
            week_date = datetime.fromisoformat(date_str).date() if date_str else None

            # Extract User relation
            user_prop = properties.get("User", {})
            user_relations = user_prop.get("relation", [])
            user_relation_id = user_relations[0].get("id") if user_relations else ""

            # Extract Message
            message_prop = properties.get("Message", {})
            message_array = message_prop.get("rich_text", [])
            message = message_array[0].get("text", {}).get("content", "") if message_array else ""

            # Extract Price
            price_prop = properties.get("Price", {})
            price = price_prop.get("number", 0.0)

            # Extract Batch (optional)
            batch_prop = properties.get("Batch", {})
            batch_array = batch_prop.get("rich_text", [])
            batch = batch_array[0].get("text", {}).get("content", "") if batch_array else None

            if not discord_id or not week_date or not price:
                return None

            return PricePoolEntry(
                id=page["id"],
                discord_id=discord_id,
                week_date=week_date,
                user_relation_id=user_relation_id,
                message=message,
                price=price,
                batch=batch
            )

        except Exception as e:
            logger.error(f"Error parsing price pool page: {e}")
            return None
