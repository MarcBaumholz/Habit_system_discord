"""
Main Money Agent orchestrator for weekly accountability checks.
"""

from datetime import date
from typing import List, Dict, Any, Optional
from money_agent.tools.notion_tools import NotionTools
from money_agent.tools.calculation_tools import CalculationTools
from money_agent.discord_integration.report_sender import ReportSender
from money_agent.models.compliance_models import (
    HabitCompliance,
    UserCompliance,
    Charge,
    WeeklyReport
)
from money_agent.config.settings import settings
import logging

logger = logging.getLogger(__name__)


class MoneyAgent:
    """
    Orchestrator for weekly habit accountability checks.

    Responsibilities:
    - Fetch all active users and their habits
    - Calculate habit compliance for each user
    - Generate charges for missed habits
    - Save charges to Notion Price Pool DB
    - Generate and send Discord report
    """

    def __init__(self):
        """Initialize the Money Agent with tools."""
        self.notion = NotionTools()
        self.calc = CalculationTools()
        self.discord = ReportSender()
        self.name = "MoneyAgent"

        logger.info("MoneyAgent initialized")

    async def run_weekly_check(self) -> Dict[str, Any]:
        """
        Run the complete weekly accountability check.

        Returns:
            Dictionary with execution summary.
        """
        logger.info("=" * 70)
        logger.info("Starting weekly accountability check")
        logger.info("=" * 70)

        try:
            # Get current week range
            week_start, week_end = self.calc.get_current_week_range()
            logger.info(f"Checking week: {week_start} to {week_end}")

            # Step 1: Get all active users
            logger.info("\n[Step 1/6] Fetching users from Notion...")
            users = await self.get_active_users()
            logger.info(f"Found {len(users)} users")

            if not users:
                logger.warning("No users found, aborting check")
                return {"status": "aborted", "reason": "no_users"}

            # Step 2: Calculate compliance for each user
            logger.info("\n[Step 2/6] Calculating habit compliance...")
            all_compliance: List[UserCompliance] = []

            for user in users:
                logger.info(f"\nProcessing user: {user['name']} ({user['discord_id']})")
                compliance = await self.calculate_user_compliance(
                    user,
                    week_start,
                    week_end
                )

                if compliance:
                    all_compliance.append(compliance)
                    logger.info(
                        f"  → {len(compliance.habits)} habits, "
                        f"€{compliance.total_charge:.2f} total charge"
                    )

            # Step 3: Generate charges
            logger.info("\n[Step 3/6] Generating charge entries...")
            all_charges: List[Charge] = []

            for compliance in all_compliance:
                charges = self.generate_charges(compliance)
                all_charges.extend(charges)
                logger.info(f"  {compliance.name}: {len(charges)} charges")

            logger.info(f"Total charges to create: {len(all_charges)}")

            # Step 4: Save charges to Notion
            logger.info("\n[Step 4/6] Saving charges to Notion Price Pool...")
            await self.save_charges_to_notion(all_charges)

            # Step 5: Get total pool balance
            logger.info("\n[Step 5/6] Calculating price pool balance...")
            total_pool = await self.notion.get_total_price_pool()
            logger.info(f"Total price pool balance: €{total_pool:.2f}")

            # Step 6: Generate and send report
            logger.info("\n[Step 6/6] Generating and sending report...")
            total_weekly_charges = sum(c.total_charge for c in all_compliance)

            report = WeeklyReport(
                week_start=week_start,
                week_end=week_end,
                user_compliance=all_compliance,
                total_weekly_charges=total_weekly_charges,
                total_pool_balance=total_pool
            )

            # Send to Discord
            await self.discord.send_report(report)

            logger.info("\n" + "=" * 70)
            logger.info("Weekly accountability check completed successfully")
            logger.info("=" * 70)

            return {
                "status": "success",
                "week_start": str(week_start),
                "week_end": str(week_end),
                "users_processed": len(all_compliance),
                "total_charges": len(all_charges),
                "total_weekly_amount": total_weekly_charges,
                "total_pool_balance": total_pool,
            }

        except Exception as e:
            logger.error(f"Error during weekly check: {e}", exc_info=True)
            return {
                "status": "error",
                "error": str(e)
            }

    async def get_active_users(self) -> List[Dict[str, Any]]:
        """
        Get all active users from the Users database.

        Returns:
            List of user dictionaries (all users, filtering happens per-user based on habits).
        """
        users = await self.notion.get_all_users()
        logger.info(f"Retrieved {len(users)} users (will check habits per user)")
        return users

    async def calculate_user_compliance(
        self,
        user: Dict[str, Any],
        week_start: date,
        week_end: date
    ) -> Optional[UserCompliance]:
        """
        Calculate habit compliance for a single user.

        Args:
            user: User dictionary from Notion
            week_start: Start date of the week (Monday)
            week_end: End date of the week (Sunday)

        Returns:
            UserCompliance object or None if error.
        """
        try:
            habit_compliance_list: List[HabitCompliance] = []

            # Get habits for this user from Habits DB
            habits = await self.notion.get_user_habits(user["id"])

            if not habits:
                logger.info(f"User {user['name']} has no habits, skipping")
                return None

            # Process each habit
            for habit in habits:
                # Get proofs for this habit
                proofs = await self.notion.get_weekly_proofs(
                    user["id"],
                    habit["id"],
                    week_start,
                    week_end
                )

                # Calculate compliance
                target = habit["target_frequency"]
                actual = len(proofs)
                missed = self.calc.calculate_missed_occurrences(target, actual)
                charge = self.calc.calculate_charge(missed)

                habit_compliance = HabitCompliance(
                    habit_id=habit["id"],
                    habit_name=habit["name"],
                    target_frequency=target,
                    actual_proofs=actual,
                    missed_count=missed,
                    charge=charge
                )

                habit_compliance_list.append(habit_compliance)

            # Calculate total charge
            total_charge = sum(h.charge for h in habit_compliance_list)

            return UserCompliance(
                user_id=user["id"],
                discord_id=user["discord_id"],
                name=user["name"],
                habits=habit_compliance_list,
                total_charge=total_charge,
                week_start=week_start,
                week_end=week_end
            )

        except Exception as e:
            logger.error(f"Error calculating compliance for user {user.get('name')}: {e}")
            return None

    def generate_charges(self, compliance: UserCompliance) -> List[Charge]:
        """
        Generate charge entries for a user's missed habits.

        Args:
            compliance: UserCompliance object

        Returns:
            List of Charge objects (only for habits with charges).
        """
        charges = []

        for habit in compliance.habits:
            if habit.charge > 0:
                message = self.calc.format_charge_message(
                    habit.habit_name,
                    habit.missed_count,
                    habit.actual_proofs,
                    habit.target_frequency
                )

                charge = Charge(
                    discord_id=compliance.discord_id,
                    user_notion_id=compliance.user_id,
                    week_date=compliance.week_start,
                    habit_name=habit.habit_name,
                    missed_count=habit.missed_count,
                    charge=habit.charge,
                    message=message
                )

                charges.append(charge)

        return charges

    async def save_charges_to_notion(self, charges: List[Charge]) -> None:
        """
        Save all charges to the Notion Price Pool database.

        Args:
            charges: List of Charge objects to save.
        """
        if not charges:
            logger.info("No charges to save")
            return

        success_count = 0
        for charge in charges:
            try:
                result = await self.notion.create_price_pool_entry(
                    discord_id=charge.discord_id,
                    week_date=charge.week_date,
                    user_relation_id=charge.user_notion_id,
                    message=charge.message,
                    price=charge.charge
                )

                if result:
                    success_count += 1

            except Exception as e:
                logger.error(f"Error saving charge for {charge.discord_id}: {e}")

        logger.info(f"Saved {success_count}/{len(charges)} charges to Notion")

    async def generate_manual_report(
        self,
        week_start: Optional[date] = None,
        week_end: Optional[date] = None
    ) -> WeeklyReport:
        """
        Generate a report for a specific week (for testing/manual runs).

        Args:
            week_start: Start date (defaults to current week)
            week_end: End date (defaults to current week)

        Returns:
            WeeklyReport object.
        """
        if not week_start or not week_end:
            week_start, week_end = self.calc.get_current_week_range()

        logger.info(f"Generating manual report for {week_start} to {week_end}")

        users = await self.get_active_users()
        all_compliance = []

        for user in users:
            compliance = await self.calculate_user_compliance(user, week_start, week_end)
            if compliance:
                all_compliance.append(compliance)

        total_weekly_charges = sum(c.total_charge for c in all_compliance)
        total_pool = await self.notion.get_total_price_pool()

        return WeeklyReport(
            week_start=week_start,
            week_end=week_end,
            user_compliance=all_compliance,
            total_weekly_charges=total_weekly_charges,
            total_pool_balance=total_pool
        )
