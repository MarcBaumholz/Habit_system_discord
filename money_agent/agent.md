💰 Agent #4: Money Agent (Accountability System)
Core Purpose
Weekly accountability system that tracks habit compliance, calculates financial charges for missed habits, and generates group reports to maintain motivation and commitment.

Architecture Location
money_agent/
├── main.py                            # Weekly execution entry point
├── agents/
│   └── money_agent.py                 # Main orchestration agent
├── tools/
│   ├── notion_tools.py                # Notion DB operations
│   └── calculation_tools.py           # Charge calculations
├── discord_integration/
│   └── report_sender.py               # Discord report delivery
├── models/
│   └── compliance_models.py           # Data structures
└── config/
    └── settings.py                    # System configuration
Core Logic Flow
┌─────────────────────────────────────────────────────────┐
│ WEEKLY ACCOUNTABILITY CHECK                             │
│ Function: run_weekly_check()                            │
│ Location: agents/money_agent.py:43-141                │
│                                                          │
│ 6-Step Execution Pipeline:                              │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ STEP 1: USER COLLECTION                                 │
│ Function: get_active_users()                            │
│ Location: agents/money_agent.py:143-152                │
│                                                          │
│ • Queries Users database                                │
│ • Returns all users (filtering per habit)               │
│ • Extracts: id, name, discord_id                        │
└────────────┬────────────────────────────────────────────┘
             │
             v
┌─────────────────────────────────────────────────────────┐
│ STEP 2: COMPLIANCE CALCULATION (Per User)              │
│ Function: calculate_user_compliance()                   │
│ Location: agents/money_agent.py:154-223                │
│                                                          │
│ For each user:                                          │
│ a) Get user's active habits from Habits DB              │
│ b) For each habit:                                      │
│    • Fetch proofs from Proofs DB (Monday-Sunday)        │
│    • Compare actual vs target frequency                 │
│    • Calculate missed occurrences                       │
│    • Compute charge: €0.50 × missed_count²              │
│ c) Aggregate into UserCompliance object                 │
│                                                          │
│ Example Charge Calculation:                             │
│ • Missed 0 → €0.00                                      │
│ • Missed 1 → €0.50                                      │
│ • Missed 2 → €2.00                                      │
│ • Missed 3 → €4.50                                      │
│ • Missed 4 → €8.00                                      │
│ (Quadratic penalty increases commitment)                │
└────────────┬────────────────────────────────────────────┘
             │
             v
┌─────────────────────────────────────────────────────────┐
│ STEP 3: CHARGE GENERATION                               │
│ Function: generate_charges()                            │
│ Location: agents/money_agent.py:225-258                │
│                                                          │
│ • Creates Charge object for each missed habit           │
│ • Formats human-readable message                        │
│ • Links charge to user and week                         │
│                                                          │
│ Charge Message Format:                                  │
│ "Meditation: Missed 2 times (completed 3/5 this week)"  │
└────────────┬────────────────────────────────────────────┘
             │
             v
┌─────────────────────────────────────────────────────────┐
│ STEP 4: NOTION DATABASE SAVE                            │
│ Function: save_charges_to_notion()                      │
│ Location: agents/money_agent.py:260-288                │
│                                                          │
│ Saves to Price Pool Database:                           │
│ • Discord ID (relation to user)                         │
│ • Week date (start of week)                             │
│ • User relation (Notion page ID)                        │
│ • Message (readable description)                        │
│ • Price (charge amount)                                 │
└────────────┬────────────────────────────────────────────┘
             │
             v
┌─────────────────────────────────────────────────────────┐
│ STEP 5: POOL BALANCE CALCULATION                        │
│ Function: get_total_price_pool()                        │
│ Location: tools/notion_tools.py                        │
│                                                          │
│ • Queries all entries in Price Pool DB                  │
│ • Sums all charges                                      │
│ • Returns total accumulated pool                        │
└────────────┬────────────────────────────────────────────┘
             │
             v
┌─────────────────────────────────────────────────────────┐
│ STEP 6: DISCORD REPORT DELIVERY                         │
│ Function: send_report()                                 │
│ Location: discord_integration/report_sender.py         │
│                                                          │
│ Report Structure:                                       │
│ • Header: Week range and summary                        │
│ • Per-User Breakdown:                                   │
│   - Habit compliance table                              │
│   - Individual charges                                  │
│   - User total                                          │
│ • Footer:                                               │
│   - Total weekly charges                                │
│   - Updated pool balance                                │
│   - Motivational message                                │
│                                                          │
│ Delivery:                                               │
│ • Sends to accountability group channel                 │
│ • Uses Discord embed for rich formatting                │
│ • Includes emojis and visual hierarchy                  │
└─────────────────────────────────────────────────────────┘
Charge Calculation Logic
# Location: tools/calculation_tools.py

def calculate_charge(missed_count: int) -> float:
    """
    Quadratic penalty function for missed habits.

    Formula: charge = base_rate * missed_count²
    Base rate: €0.50

    Purpose: Escalating penalty creates stronger commitment
    mechanism and prevents casual habit skipping.
    """
    BASE_RATE = 0.50
    return BASE_RATE * (missed_count ** 2)
Key Features
Automated Weekly Checks: Runs every Sunday evening/Monday morning
Financial Accountability: Real monetary consequences for missed habits
Quadratic Penalty: Escalating charges prevent repeated failures
Transparent Reporting: Public group accountability via Discord
Price Pool System: Collective pool grows, creates shared resource
Per-Habit Tracking: Individual habit compliance visibility
Notion Integration: All data stored and queryable in Notion
Data Models
# Location: models/compliance_models.py

class HabitCompliance:
    habit_id: str
    habit_name: str
    target_frequency: int       # Times per week
    actual_proofs: int           # Actual completions
    missed_count: int            # Calculated missed
    charge: float                # Financial charge

class UserCompliance:
    user_id: str
    discord_id: str
    name: str
    habits: List[HabitCompliance]
    total_charge: float
    week_start: date
    week_end: date

class Charge:
    discord_id: str
    user_notion_id: str
    week_date: date
    habit_name: str
    missed_count: int
    charge: float
    message: str                 # Human-readable

class WeeklyReport:
    week_start: date
    week_end: date
    user_compliance: List[UserCompliance]
    total_weekly_charges: float
    total_pool_balance: float
How to Start
cd money_agent
python main.py
Scheduling
Set up a cron job or systemd timer to run weekly:

# Example cron: Every Sunday at 8 PM
0 20 * * 0 cd /path/to/money_agent && python main.py
Key Dependencies
notion-client - Database queries and writes
discord.py - Report delivery
pydantic - Data validation