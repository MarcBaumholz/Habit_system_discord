"""
Unit tests for CalculationTools.
"""

import pytest
from datetime import date, timedelta
from money_agent.tools.calculation_tools import CalculationTools


class TestCalculationTools:
    """Test suite for calculation tools."""

    def setup_method(self):
        """Setup test fixtures."""
        self.calc = CalculationTools()

    def test_get_current_week_range_monday(self):
        """Test week range when today is Monday."""
        # Monday, Oct 20, 2025 (actual Monday)
        target = date(2025, 10, 20)  # Monday
        week_start, week_end = self.calc.get_week_range_for_date(target)

        assert week_start == date(2025, 10, 20)  # Same Monday
        assert week_end == date(2025, 10, 26)  # Following Sunday
        assert (week_end - week_start).days == 6

    def test_get_current_week_range_sunday(self):
        """Test week range when today is Sunday."""
        # Sunday, Oct 26, 2025 (actual Sunday)
        target = date(2025, 10, 26)  # Sunday
        week_start, week_end = self.calc.get_week_range_for_date(target)

        assert week_start == date(2025, 10, 20)  # Previous Monday
        assert week_end == date(2025, 10, 26)  # Same Sunday
        assert (week_end - week_start).days == 6

    def test_get_current_week_range_wednesday(self):
        """Test week range when today is Wednesday (mid-week)."""
        # Wednesday, Oct 22, 2025 (actual Wednesday)
        target = date(2025, 10, 22)  # Wednesday
        week_start, week_end = self.calc.get_week_range_for_date(target)

        assert week_start == date(2025, 10, 20)  # Previous Monday
        assert week_end == date(2025, 10, 26)  # Following Sunday
        assert (week_end - week_start).days == 6

    def test_calculate_missed_occurrences_perfect(self):
        """Test when habit is completed perfectly."""
        missed = self.calc.calculate_missed_occurrences(target_frequency=5, actual_proofs=5)
        assert missed == 0

    def test_calculate_missed_occurrences_partial(self):
        """Test when habit is partially completed."""
        missed = self.calc.calculate_missed_occurrences(target_frequency=5, actual_proofs=3)
        assert missed == 2

    def test_calculate_missed_occurrences_none(self):
        """Test when habit has zero proofs."""
        missed = self.calc.calculate_missed_occurrences(target_frequency=5, actual_proofs=0)
        assert missed == 5

    def test_calculate_missed_occurrences_over_target(self):
        """Test when proofs exceed target (bonus completions)."""
        missed = self.calc.calculate_missed_occurrences(target_frequency=5, actual_proofs=7)
        assert missed == 0  # No missed, even with extra

    def test_calculate_charge_default_rate(self):
        """Test charge calculation with default rate."""
        charge = self.calc.calculate_charge(missed_count=2)
        assert charge == 1.00  # 2 × €0.50

    def test_calculate_charge_custom_rate(self):
        """Test charge calculation with custom rate."""
        charge = self.calc.calculate_charge(missed_count=2, charge_per_miss=1.00)
        assert charge == 2.00  # 2 × €1.00

    def test_calculate_charge_zero_missed(self):
        """Test charge when nothing is missed."""
        charge = self.calc.calculate_charge(missed_count=0)
        assert charge == 0.00

    def test_format_habit_summary_perfect(self):
        """Test formatting for perfectly completed habit."""
        summary = self.calc.format_habit_summary(
            habit_name="Meditation",
            target=5,
            actual=5,
            missed=0
        )
        assert summary.startswith("✅")
        assert "Meditation" in summary
        assert "5/5" in summary

    def test_format_habit_summary_with_charge(self):
        """Test formatting for habit with charges."""
        summary = self.calc.format_habit_summary(
            habit_name="Exercise",
            target=5,
            actual=3,
            missed=2,
            charge=1.00
        )
        assert summary.startswith("❌")
        assert "Exercise" in summary
        assert "3/5" in summary
        assert "2 missed" in summary
        assert "€1.00" in summary

    def test_format_charge_message(self):
        """Test charge message formatting."""
        message = self.calc.format_charge_message(
            habit_name="Journaling",
            missed=2,
            actual=3,
            target=5
        )
        assert "Journaling" in message
        assert "2 missed" in message
        assert "3/5 completed" in message

    def test_calculate_completion_rate_perfect(self):
        """Test completion rate for 100% completion."""
        rate = self.calc.calculate_completion_rate(actual=5, target=5)
        assert rate == 100.0

    def test_calculate_completion_rate_partial(self):
        """Test completion rate for partial completion."""
        rate = self.calc.calculate_completion_rate(actual=3, target=5)
        assert rate == 60.0

    def test_calculate_completion_rate_zero_target(self):
        """Test completion rate when target is zero."""
        rate = self.calc.calculate_completion_rate(actual=0, target=0)
        assert rate == 100.0  # Edge case: treat as complete

    def test_calculate_completion_rate_over_target(self):
        """Test completion rate when exceeding target."""
        rate = self.calc.calculate_completion_rate(actual=7, target=5)
        assert rate == 140.0

    def test_is_perfect_week_all_completed(self):
        """Test perfect week detection when all habits completed."""
        habits = [
            {"actual": 5, "target": 5},
            {"actual": 3, "target": 3},
            {"actual": 7, "target": 7}
        ]
        assert self.calc.is_perfect_week(habits) is True

    def test_is_perfect_week_one_incomplete(self):
        """Test perfect week detection with one incomplete habit."""
        habits = [
            {"actual": 5, "target": 5},
            {"actual": 2, "target": 3},  # Incomplete
            {"actual": 7, "target": 7}
        ]
        assert self.calc.is_perfect_week(habits) is False

    def test_is_perfect_week_empty_list(self):
        """Test perfect week with no habits."""
        habits = []
        assert self.calc.is_perfect_week(habits) is True  # Vacuously true

    def test_get_week_label_same_month(self):
        """Test week label formatting within same month."""
        week_start = date(2025, 10, 21)
        week_end = date(2025, 10, 27)
        label = self.calc.get_week_label(week_start, week_end)
        assert "Oct 21" in label
        assert "27, 2025" in label

    def test_get_week_label_different_months(self):
        """Test week label formatting across months."""
        week_start = date(2025, 10, 28)
        week_end = date(2025, 11, 3)
        label = self.calc.get_week_label(week_start, week_end)
        assert "Oct 28" in label
        assert "Nov" in label  # Just check for month, not specific day format
        assert "2025" in label

    def test_get_week_label_different_years(self):
        """Test week label formatting across years."""
        week_start = date(2025, 12, 29)
        week_end = date(2026, 1, 4)
        label = self.calc.get_week_label(week_start, week_end)
        assert "2025" in label
        assert "2026" in label

    def test_format_currency(self):
        """Test currency formatting."""
        assert self.calc.format_currency(1.50) == "€1.50"
        assert self.calc.format_currency(0) == "€0.00"
        assert self.calc.format_currency(10.5) == "€10.50"

    def test_validate_frequency_valid(self):
        """Test frequency validation for valid values."""
        assert self.calc.validate_frequency(0) is True
        assert self.calc.validate_frequency(3) is True
        assert self.calc.validate_frequency(7) is True

    def test_validate_frequency_invalid(self):
        """Test frequency validation for invalid values."""
        assert self.calc.validate_frequency(-1) is False
        assert self.calc.validate_frequency(8) is False
        assert self.calc.validate_frequency(100) is False

    def test_validate_proofs_valid(self):
        """Test proofs validation for valid counts."""
        assert self.calc.validate_proofs(5, target=5) is True
        assert self.calc.validate_proofs(0, target=5) is True
        assert self.calc.validate_proofs(7, target=5) is True  # Up to 2x

    def test_validate_proofs_invalid(self):
        """Test proofs validation for suspicious counts."""
        assert self.calc.validate_proofs(-1, target=5) is False
        assert self.calc.validate_proofs(11, target=5) is False  # More than 2x


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
