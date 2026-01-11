"""
Tools for calculating habit compliance and charges.
"""

from datetime import date, timedelta
from typing import Tuple
from money_agent.config.settings import settings
import logging

logger = logging.getLogger(__name__)


class CalculationTools:
    """Tools for habit compliance calculations."""

    @staticmethod
    def get_current_week_range() -> Tuple[date, date]:
        """
        Get Monday-Sunday range for the week being reported.

        When running on Sunday, this returns the week that is ending.
        Week starts on Monday and ends on Sunday (the day the report runs).

        Returns:
            Tuple of (week_start, week_end) dates.
        """
        today = date.today()

        # Find the most recent Monday
        days_since_monday = today.weekday()  # Monday = 0, Sunday = 6
        week_start = today - timedelta(days=days_since_monday)

        # Week ends on Sunday (6 days after Monday)
        week_end = week_start + timedelta(days=6)

        logger.info(f"Current week range: {week_start} to {week_end}")
        return week_start, week_end

    @staticmethod
    def get_week_range_for_date(target_date: date) -> Tuple[date, date]:
        """
        Get Monday-Sunday range for a specific date.

        Args:
            target_date: Date to find the week for

        Returns:
            Tuple of (week_start, week_end) dates.
        """
        days_since_monday = target_date.weekday()
        week_start = target_date - timedelta(days=days_since_monday)
        week_end = week_start + timedelta(days=6)

        return week_start, week_end

    @staticmethod
    def calculate_missed_occurrences(target_frequency: int, actual_proofs: int) -> int:
        """
        Calculate the number of missed habit occurrences.

        Args:
            target_frequency: Expected number of completions per week
            actual_proofs: Actual number of proofs submitted

        Returns:
            Number of missed occurrences (always non-negative).
        """
        missed = max(0, target_frequency - actual_proofs)
        logger.debug(f"Target: {target_frequency}, Actual: {actual_proofs}, Missed: {missed}")
        return missed

    @staticmethod
    def calculate_charge(
        missed_count: int,
        charge_per_miss: float = None
    ) -> float:
        """
        Calculate the charge for missed habit occurrences.

        Args:
            missed_count: Number of missed occurrences
            charge_per_miss: Charge per missed occurrence (uses settings default if None)

        Returns:
            Total charge amount in euros.
        """
        if charge_per_miss is None:
            charge_per_miss = settings.CHARGE_PER_MISS

        charge = missed_count * charge_per_miss
        logger.debug(f"Missed: {missed_count} × €{charge_per_miss} = €{charge}")
        return charge

    @staticmethod
    def format_habit_summary(
        habit_name: str,
        target: int,
        actual: int,
        missed: int,
        charge: float = None
    ) -> str:
        """
        Format a summary string for a habit.

        Args:
            habit_name: Name of the habit
            target: Target frequency
            actual: Actual proofs
            missed: Missed occurrences
            charge: Charge amount (optional)

        Returns:
            Formatted summary string.
        """
        if missed == 0:
            return f"✅ {habit_name}: {actual}/{target} completed"
        else:
            charge_str = f" → €{charge:.2f}" if charge is not None else ""
            return f"❌ {habit_name}: {actual}/{target} completed ({missed} missed){charge_str}"

    @staticmethod
    def format_charge_message(habit_name: str, missed: int, actual: int, target: int) -> str:
        """
        Format a message for a charge entry.

        Args:
            habit_name: Name of the habit
            missed: Number of missed occurrences
            actual: Actual proofs
            target: Target frequency

        Returns:
            Formatted message string.
        """
        return f"{habit_name}: {missed} missed ({actual}/{target} completed)"

    @staticmethod
    def calculate_completion_rate(actual: int, target: int) -> float:
        """
        Calculate completion rate as a percentage.

        Args:
            actual: Actual number of completions
            target: Target number of completions

        Returns:
            Completion rate as a percentage (0-100).
        """
        if target == 0:
            return 100.0
        return (actual / target) * 100

    @staticmethod
    def is_perfect_week(habits_data: list[dict]) -> bool:
        """
        Check if all habits were completed perfectly.

        Args:
            habits_data: List of dictionaries with 'actual' and 'target' keys

        Returns:
            True if all habits met their targets, False otherwise.
        """
        return all(
            habit.get("actual", 0) >= habit.get("target", 0)
            for habit in habits_data
        )

    @staticmethod
    def get_week_label(week_start: date, week_end: date) -> str:
        """
        Format a label for the week.

        Args:
            week_start: Start date (Monday)
            week_end: End date (Sunday)

        Returns:
            Formatted week label (e.g., "Oct 21 - Oct 27, 2025")
        """
        if week_start.year == week_end.year:
            if week_start.month == week_end.month:
                return f"{week_start.strftime('%b %d')} - {week_end.strftime('%d, %Y')}"
            else:
                return f"{week_start.strftime('%b %d')} - {week_end.strftime('%b %d, %Y')}"
        else:
            return f"{week_start.strftime('%b %d, %Y')} - {week_end.strftime('%b %d, %Y')}"

    @staticmethod
    def format_currency(amount: float) -> str:
        """
        Format an amount as currency.

        Args:
            amount: Amount in euros

        Returns:
            Formatted currency string (e.g., "€1.50")
        """
        return f"€{amount:.2f}"

    @staticmethod
    def validate_frequency(frequency: int) -> bool:
        """
        Validate that a frequency value is reasonable.

        Args:
            frequency: Target frequency per week

        Returns:
            True if valid (0-7), False otherwise.
        """
        return 0 <= frequency <= 7

    @staticmethod
    def validate_proofs(proofs: int, target: int) -> bool:
        """
        Validate that proof count is reasonable.

        Args:
            proofs: Number of proofs
            target: Target frequency

        Returns:
            True if valid, False if suspicious (e.g., way more than target).
        """
        # Allow up to 2x target (in case of bonus completions)
        return 0 <= proofs <= (target * 2)
