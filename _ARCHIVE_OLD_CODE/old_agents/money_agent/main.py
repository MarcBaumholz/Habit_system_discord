#!/usr/bin/env python3
"""
Money Agent - Weekly Accountability and Price Pool Management

Main entry point for running the Money Agent with various modes.
"""

import asyncio
import argparse
import sys
import logging
from datetime import date, datetime
from money_agent.agents.money_agent import MoneyAgent
from money_agent.scheduler.weekly_scheduler import run_scheduler, WeeklyScheduler
from money_agent.config.settings import settings
from money_agent.tools.calculation_tools import CalculationTools


def setup_logging(log_level: str = "INFO") -> None:
    """
    Configure logging for the application.

    Args:
        log_level: Logging level (DEBUG, INFO, WARNING, ERROR)
    """
    logging.basicConfig(
        level=getattr(logging, log_level.upper()),
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        handlers=[
            logging.StreamHandler(sys.stdout),
            logging.FileHandler(settings.LOG_FILE)
        ]
    )


async def run_once(dry_run: bool = False) -> None:
    """
    Run the accountability check once (force run).

    Args:
        dry_run: If True, don't save to Notion or send to Discord
    """
    if dry_run:
        settings.DRY_RUN = True
        print("\n🧪 DRY RUN MODE - No changes will be saved\n")

    agent = MoneyAgent()
    result = await agent.run_weekly_check()

    print("\n" + "=" * 70)
    print("EXECUTION SUMMARY")
    print("=" * 70)

    for key, value in result.items():
        print(f"{key.replace('_', ' ').title()}: {value}")

    print("=" * 70 + "\n")


async def generate_report_only() -> None:
    """Generate and display the report without saving charges."""
    print("\n📊 Generating accountability report (read-only mode)...\n")

    agent = MoneyAgent()
    report = await agent.generate_manual_report()

    # Display report
    from money_agent.discord_integration.report_sender import ReportSender
    sender = ReportSender()
    report_text = sender.format_report_text(report)

    print("\n" + "=" * 70)
    print(report_text)
    print("=" * 70 + "\n")


async def run_scheduler_mode() -> None:
    """Run the scheduler in daemon mode."""
    print("\n🚀 Starting Money Agent in scheduled mode...\n")

    # Validate configuration
    if not settings.is_valid():
        print("❌ Configuration validation failed!")
        print("\nMissing or invalid settings:")
        for setting in settings.get_missing_settings():
            print(f"  - {setting}")
        print("\nPlease check your .env file and try again.\n")
        sys.exit(1)

    # Show configuration
    settings.print_status()

    # Run scheduler
    await run_scheduler()


def check_config() -> None:
    """Check configuration and display status."""
    settings.print_status()

    if settings.is_valid():
        print("✅ All settings configured correctly\n")
        sys.exit(0)
    else:
        print("❌ Configuration incomplete\n")
        print("Missing settings:")
        for setting in settings.get_missing_settings():
            print(f"  - {setting}")
        print()
        sys.exit(1)


def show_next_run() -> None:
    """Show when the next scheduled run will occur."""
    calc = CalculationTools()
    week_start, week_end = calc.get_current_week_range()
    week_label = calc.get_week_label(week_start, week_end)

    print("\n" + "=" * 70)
    print("📅 SCHEDULE INFORMATION")
    print("=" * 70)
    print(f"Current week: {week_label}")
    print(f"Schedule: Every {settings.SCHEDULE_DAY.title()} at "
          f"{settings.SCHEDULE_HOUR:02d}:{settings.SCHEDULE_MINUTE:02d} "
          f"{settings.SCHEDULE_TIMEZONE}")

    scheduler = WeeklyScheduler()
    scheduler.start()
    print(f"Next run: {scheduler.get_next_run_time()}")
    scheduler.stop()

    print("=" * 70 + "\n")


async def test_discord() -> None:
    """Test Discord connection by sending a test message."""
    from money_agent.discord_integration.report_sender import ReportSender

    print("\n🧪 Testing Discord connection...\n")

    sender = ReportSender()
    success = await sender.send_test_message(
        "🧪 Test message from Money Agent - Connection successful!"
    )

    if success:
        print("✅ Discord test message sent successfully\n")
    else:
        print("❌ Failed to send Discord test message\n")


def main() -> None:
    """Main entry point with CLI argument parsing."""
    parser = argparse.ArgumentParser(
        description="Money Agent - Weekly Accountability & Price Pool Management",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python main.py                    # Run scheduler (daemon mode)
  python main.py --force            # Run check immediately
  python main.py --dry-run          # Run check without saving (preview)
  python main.py --report           # Generate report only (read-only)
  python main.py --config           # Check configuration
  python main.py --next             # Show next scheduled run
  python main.py --test-discord     # Test Discord connection

Environment Variables:
  See .env file for required configuration
        """
    )

    parser.add_argument(
        '--force',
        action='store_true',
        help='Run accountability check immediately (ignore schedule)'
    )

    parser.add_argument(
        '--dry-run',
        action='store_true',
        help='Run in dry-run mode (no changes saved, preview only)'
    )

    parser.add_argument(
        '--report',
        action='store_true',
        help='Generate and display report only (read-only, no charges saved)'
    )

    parser.add_argument(
        '--config',
        action='store_true',
        help='Check configuration and exit'
    )

    parser.add_argument(
        '--next',
        action='store_true',
        help='Show next scheduled run time'
    )

    parser.add_argument(
        '--test-discord',
        action='store_true',
        help='Test Discord connection'
    )

    parser.add_argument(
        '--log-level',
        choices=['DEBUG', 'INFO', 'WARNING', 'ERROR'],
        default='INFO',
        help='Set logging level (default: INFO)'
    )

    args = parser.parse_args()

    # Setup logging
    setup_logging(args.log_level)

    # Handle commands
    try:
        if args.config:
            check_config()

        elif args.next:
            show_next_run()

        elif args.test_discord:
            asyncio.run(test_discord())

        elif args.report:
            asyncio.run(generate_report_only())

        elif args.force:
            asyncio.run(run_once(dry_run=args.dry_run))

        else:
            # Default: Run scheduler
            asyncio.run(run_scheduler_mode())

    except KeyboardInterrupt:
        print("\n\n👋 Goodbye!\n")
        sys.exit(0)

    except Exception as e:
        logging.error(f"Fatal error: {e}", exc_info=True)
        print(f"\n❌ Fatal error: {e}\n")
        sys.exit(1)


if __name__ == "__main__":
    main()
