"""
Weekly scheduler for Money Agent using APScheduler.
"""

import asyncio
import pytz
from datetime import datetime
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from money_agent.agents.money_agent import MoneyAgent
from money_agent.config.settings import settings
import logging

logger = logging.getLogger(__name__)


class WeeklyScheduler:
    """Scheduler for running Money Agent weekly on Sundays at 9 PM."""

    def __init__(self, money_agent: MoneyAgent = None):
        """
        Initialize the weekly scheduler.

        Args:
            money_agent: MoneyAgent instance (creates new if not provided)
        """
        self.money_agent = money_agent or MoneyAgent()
        self.scheduler = AsyncIOScheduler()
        self.timezone = pytz.timezone(settings.SCHEDULE_TIMEZONE)
        self.is_running = False

        logger.info(f"WeeklyScheduler initialized with timezone: {self.timezone}")

    def start(self) -> None:
        """Start the scheduler."""
        if self.is_running:
            logger.warning("Scheduler is already running")
            return

        try:
            # Create cron trigger for Sunday at 21:00 (9 PM)
            trigger = CronTrigger(
                day_of_week=settings.SCHEDULE_DAY,  # 'sunday'
                hour=settings.SCHEDULE_HOUR,  # 21
                minute=settings.SCHEDULE_MINUTE,  # 0
                timezone=self.timezone
            )

            # Add job to scheduler
            self.scheduler.add_job(
                self._run_check_wrapper,
                trigger=trigger,
                id='weekly_accountability_check',
                name='Weekly Accountability Report',
                replace_existing=True
            )

            # Start the scheduler
            self.scheduler.start()
            self.is_running = True

            # Get next run time
            next_run = self.get_next_run_time()

            logger.info("=" * 70)
            logger.info("💰 Money Agent Scheduler Started")
            logger.info("=" * 70)
            logger.info(f"Schedule: Every {settings.SCHEDULE_DAY.title()} at "
                       f"{settings.SCHEDULE_HOUR:02d}:{settings.SCHEDULE_MINUTE:02d} "
                       f"{settings.SCHEDULE_TIMEZONE}")
            logger.info(f"Next run: {next_run}")
            logger.info(f"Charge per miss: €{settings.CHARGE_PER_MISS}")
            logger.info(f"Dry run mode: {settings.DRY_RUN}")
            logger.info("=" * 70)

            print("\n✅ Money Agent is now running in the background")
            print(f"📅 Next accountability check: {next_run}")
            print("Press Ctrl+C to stop\n")

        except Exception as e:
            logger.error(f"Error starting scheduler: {e}")
            raise

    async def _run_check_wrapper(self) -> None:
        """Wrapper for running the weekly check (handles async properly)."""
        try:
            logger.info("\n🔔 Scheduled weekly check triggered")
            result = await self.money_agent.run_weekly_check()

            if result.get("status") == "success":
                logger.info("✅ Scheduled weekly check completed successfully")
            else:
                logger.error(f"❌ Scheduled weekly check failed: {result}")

        except Exception as e:
            logger.error(f"Error in scheduled weekly check: {e}", exc_info=True)

    def stop(self) -> None:
        """Stop the scheduler gracefully."""
        if not self.is_running:
            logger.warning("Scheduler is not running")
            return

        try:
            self.scheduler.shutdown(wait=True)
            self.is_running = False
            logger.info("Scheduler stopped successfully")

        except Exception as e:
            logger.error(f"Error stopping scheduler: {e}")

    def get_next_run_time(self) -> str:
        """
        Get the next scheduled run time.

        Returns:
            Formatted string with next run time.
        """
        job = self.scheduler.get_job('weekly_accountability_check')

        if job and job.next_run_time:
            next_run = job.next_run_time.astimezone(self.timezone)
            return next_run.strftime("%A, %B %d, %Y at %I:%M %p %Z")

        return "Not scheduled"

    def get_status(self) -> dict:
        """
        Get scheduler status information.

        Returns:
            Dictionary with status information.
        """
        return {
            "is_running": self.is_running,
            "timezone": str(self.timezone),
            "schedule": f"Every {settings.SCHEDULE_DAY.title()} at "
                       f"{settings.SCHEDULE_HOUR:02d}:{settings.SCHEDULE_MINUTE:02d}",
            "next_run": self.get_next_run_time(),
            "dry_run_mode": settings.DRY_RUN,
            "discord_enabled": settings.ENABLE_DISCORD,
        }

    def print_status(self) -> None:
        """Print scheduler status to console."""
        status = self.get_status()

        print("\n" + "=" * 70)
        print("💰 MONEY AGENT SCHEDULER STATUS")
        print("=" * 70)
        print(f"Status: {'🟢 Running' if status['is_running'] else '🔴 Stopped'}")
        print(f"Schedule: {status['schedule']}")
        print(f"Timezone: {status['timezone']}")
        print(f"Next run: {status['next_run']}")
        print(f"Dry run mode: {status['dry_run_mode']}")
        print(f"Discord enabled: {status['discord_enabled']}")
        print("=" * 70 + "\n")


async def run_scheduler() -> None:
    """
    Run the scheduler indefinitely.

    This is the main entry point for running the Money Agent as a service.
    """
    scheduler = WeeklyScheduler()

    try:
        scheduler.start()

        # Keep running until interrupted
        while True:
            await asyncio.sleep(60)  # Check every minute

    except KeyboardInterrupt:
        logger.info("\n\nReceived shutdown signal (Ctrl+C)")
        print("\n🛑 Shutting down Money Agent...")
        scheduler.stop()
        print("✅ Money Agent stopped successfully\n")

    except Exception as e:
        logger.error(f"Error in scheduler: {e}", exc_info=True)
        scheduler.stop()
        raise
