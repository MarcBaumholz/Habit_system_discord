"""
Discord report formatting and sending functionality.
"""

import discord
from typing import List, Optional
from datetime import date
from money_agent.models.compliance_models import UserCompliance, WeeklyReport
from money_agent.tools.calculation_tools import CalculationTools
from money_agent.config.settings import settings
import logging

logger = logging.getLogger(__name__)


class ReportSender:
    """Handles formatting and sending Discord accountability reports."""

    def __init__(self, bot_token: Optional[str] = None):
        """
        Initialize the Discord report sender.

        Args:
            bot_token: Discord bot token (uses settings if not provided)
        """
        self.token = bot_token or settings.DISCORD_BOT_TOKEN
        self.channel_id = settings.DISCORD_ACCOUNTABILITY_CHANNEL
        self.calc = CalculationTools()

    async def send_report(self, report: WeeklyReport) -> bool:
        """
        Send the weekly accountability report to Discord.

        Args:
            report: WeeklyReport object with all compliance data

        Returns:
            True if sent successfully, False otherwise.
        """
        if not settings.ENABLE_DISCORD:
            logger.info("Discord sending disabled by settings")
            return False

        if settings.DRY_RUN:
            logger.info("[DRY RUN] Would send Discord report")
            print("\n" + "=" * 70)
            print("DRY RUN - DISCORD REPORT")
            print("=" * 70)
            print(self.format_report_text(report))
            print("=" * 70 + "\n")
            return True

        try:
            # Create Discord client with minimal intents
            intents = discord.Intents.default()
            client = discord.Client(intents=intents)

            @client.event
            async def on_ready():
                try:
                    # Get the channel
                    channel = await client.fetch_channel(int(self.channel_id))

                    if not channel:
                        logger.error(f"Channel {self.channel_id} not found")
                        await client.close()
                        return

                    # Send as embed for better formatting
                    embed = self.create_embed(report)
                    await channel.send(embed=embed)

                    logger.info(f"Report sent to Discord channel {self.channel_id}")
                    await client.close()

                except Exception as e:
                    logger.error(f"Error sending report: {e}")
                    await client.close()

            # Run the client
            await client.start(self.token)
            return True

        except Exception as e:
            logger.error(f"Error initializing Discord client: {e}")
            return False

    def create_embed(self, report: WeeklyReport) -> discord.Embed:
        """
        Create a Discord embed for the report.

        Args:
            report: WeeklyReport object

        Returns:
            Discord Embed object.
        """
        # Week label for title
        week_label = self.calc.get_week_label(report.week_start, report.week_end)

        # Create embed with color based on overall performance
        if report.total_weekly_charges == 0:
            color = discord.Color.green()  # Perfect week!
        elif report.total_weekly_charges < 5.0:
            color = discord.Color.gold()  # Some charges
        else:
            color = discord.Color.orange()  # Many charges

        embed = discord.Embed(
            title="📊 WEEKLY ACCOUNTABILITY REPORT",
            description=f"**Week:** {week_label}",
            color=color,
            timestamp=report.generated_at
        )

        # Add user compliance sections
        for user in report.user_compliance:
            field_value = self._format_user_compliance(user)
            embed.add_field(
                name=f"👤 {user.name} (@{user.discord_id})",
                value=field_value,
                inline=False
            )

        # Add summary section
        summary = self._format_summary(report)
        embed.add_field(
            name="💰 PRICE POOL SUMMARY",
            value=summary,
            inline=False
        )

        # Add footer with next check time
        next_check = self._get_next_check_date(report.generated_at)
        embed.set_footer(text=f"🎯 Next check: {next_check}")

        return embed

    def _format_user_compliance(self, user: UserCompliance) -> str:
        """Format a single user's compliance data."""
        lines = []

        for habit in user.habits:
            summary = self.calc.format_habit_summary(
                habit.habit_name,
                habit.target_frequency,
                habit.actual_proofs,
                habit.missed_count,
                habit.charge if habit.charge > 0 else None
            )
            lines.append(summary)

        # Add subtotal
        if user.total_charge > 0:
            lines.append(f"**Subtotal: {self.calc.format_currency(user.total_charge)}**")
        else:
            lines.append(f"**Subtotal: {self.calc.format_currency(0)}** 🎉")

        return "\n".join(lines)

    def _format_summary(self, report: WeeklyReport) -> str:
        """Format the price pool summary section."""
        lines = [
            f"This week's charges: **{self.calc.format_currency(report.total_weekly_charges)}**",
            f"Total pool balance: **{self.calc.format_currency(report.total_pool_balance)}**",
            "",
            f"📈 Users tracked: {report.total_users}",
            f"✨ Perfect weeks: {report.perfect_users}",
            f"💸 Users with charges: {report.users_with_charges}"
        ]

        return "\n".join(lines)

    def _get_next_check_date(self, current_date: date) -> str:
        """Get the next Sunday date formatted."""
        # Find next Sunday (7 days from now if today is Sunday)
        days_until_sunday = (6 - current_date.weekday()) % 7
        if days_until_sunday == 0:
            days_until_sunday = 7

        next_sunday = current_date + timedelta(days=days_until_sunday)
        return f"{next_sunday.strftime('%A, %b %d')} at {settings.SCHEDULE_HOUR:02d}:00"

    def format_report_text(self, report: WeeklyReport) -> str:
        """
        Format the report as plain text (for logging and dry runs).

        Args:
            report: WeeklyReport object

        Returns:
            Formatted text report.
        """
        week_label = self.calc.get_week_label(report.week_start, report.week_end)

        lines = [
            "📊 WEEKLY ACCOUNTABILITY REPORT",
            f"Week: {week_label}",
            "",
            "👥 USER COMPLIANCE",
            "─" * 70,
        ]

        for user in report.user_compliance:
            lines.append(f"\nUser: {user.name} (@{user.discord_id})")
            for habit in user.habits:
                summary = self.calc.format_habit_summary(
                    habit.habit_name,
                    habit.target_frequency,
                    habit.actual_proofs,
                    habit.missed_count,
                    habit.charge if habit.charge > 0 else None
                )
                lines.append(summary)

            lines.append(f"Subtotal: {self.calc.format_currency(user.total_charge)}")

        lines.extend([
            "",
            "💰 PRICE POOL SUMMARY",
            "─" * 70,
            f"This week's charges: {self.calc.format_currency(report.total_weekly_charges)}",
            f"Total pool balance: {self.calc.format_currency(report.total_pool_balance)}",
            "",
            f"📈 Users tracked: {report.total_users}",
            f"✨ Perfect weeks: {report.perfect_users}",
            f"💸 Users with charges: {report.users_with_charges}",
            "",
            f"🎯 Next check: {self._get_next_check_date(report.generated_at)}"
        ])

        return "\n".join(lines)

    async def send_test_message(self, message: str) -> bool:
        """
        Send a test message to the Discord channel.

        Args:
            message: Test message to send

        Returns:
            True if sent successfully, False otherwise.
        """
        if settings.DRY_RUN:
            logger.info(f"[DRY RUN] Would send test message: {message}")
            return True

        try:
            intents = discord.Intents.default()
            client = discord.Client(intents=intents)

            @client.event
            async def on_ready():
                try:
                    channel = await client.fetch_channel(int(self.channel_id))
                    await channel.send(message)
                    logger.info("Test message sent successfully")
                    await client.close()
                except Exception as e:
                    logger.error(f"Error sending test message: {e}")
                    await client.close()

            await client.start(self.token)
            return True

        except Exception as e:
            logger.error(f"Error sending test message: {e}")
            return False


# Fix missing import
from datetime import timedelta
