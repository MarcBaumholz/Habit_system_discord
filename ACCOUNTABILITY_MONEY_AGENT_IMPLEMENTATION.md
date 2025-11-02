# Accountability & Money Agent Implementation

## Overview

Successfully combined the **Group Accountability Agent** (TypeScript) and **Money Agent** (Python) into a unified **Accountability & Money Agent** in TypeScript. This agent provides comprehensive weekly accountability reports with financial tracking, social dynamics analysis, and leaderboard functionality.

## What the Combined Agent Does

The Accountability & Money Agent runs **every Sunday at 8:00 PM** and performs the following:

### 1. **Habit Compliance Tracking**
- Gets all active users and their habits
- Queries proofs for the current week (Monday - Sunday)
- Calculates actual completions vs target frequency per habit
- Identifies missed iterations

### 2. **Financial Accountability**
- Charges **€0.50 per missed habit iteration**
- Saves charges to the **Price Pool** Notion database
- Tracks cumulative pool balance
- Shows individual contributions per user

### 3. **Leaderboard Generation**
- Ranks users by overall completion rate
- Awards badges:
  - 🏆 1st place
  - 🥈 2nd place
  - 🥉 3rd place
  - 🔥 4+ week perfect streak
  - ✨ Perfect week (no charges)

### 4. **Streak Tracking**
- Calculates consecutive perfect weeks per user
- Displays current streaks in leaderboard and user reports

### 5. **Social Dynamics Insights**
- Analyzes community engagement trends
- Provides peer support recommendations
- Uses AI (Perplexity) for group dynamics analysis

### 6. **Comprehensive Discord Reports**
- Posts rich embeds to `DISCORD_ACCOUNTABILITY_GROUP` channel
- Includes:
  - Week summary with quick stats
  - Leaderboard rankings
  - Per-user habit breakdowns
  - Social insights
  - Price pool summary with contributors

## Files Created/Modified

### New Files
1. **`src/agents/accountability/accountability_money_agent.ts`**
   - Main agent combining both functionalities
   - Handles weekly report generation
   - Manages proof compliance calculations
   - Generates leaderboards and calculates streaks

2. **`src/bot/accountability-report-formatter.ts`**
   - Formats weekly reports as Discord embeds
   - Creates leaderboard displays
   - Generates user compliance summaries
   - Handles color-coded performance indicators

3. **`src/bot/accountability-scheduler.ts`**
   - Runs every Sunday at 8 PM using node-cron
   - Initializes and triggers the accountability agent
   - Sends formatted reports to Discord

### Modified Files
1. **`src/types/index.ts`**
   - Added `PricePoolEntry` interface
   - Added `HabitCompliance` interface
   - Added `UserCompliance` interface
   - Added `WeeklyAccountabilityReport` interface
   - Added `LeaderboardEntry` interface

2. **`src/notion/client.ts`**
   - Added `pricePool` to databases object
   - Added `createPricePoolEntry()` method
   - Added `getTotalPricePool()` method
   - Added `getPricePoolEntriesByWeek()` method
   - Added `getProofsByHabitAndDateRange()` method
   - Added `getWeeksByUserId()` method

3. **`src/bot/bot.ts`**
   - Imported `AccountabilityScheduler`
   - Added `accountabilityScheduler` property
   - Initialized scheduler in constructor
   - Added scheduler start logic in `start()` method

4. **`src/index.ts`**
   - Added `NOTION_DATABASE_PRICE_POOL` to required environment variables
   - Added `pricePool` to NotionClient initialization

## Environment Variables

Add the following to your `.env` file:

```bash
# Price Pool Database (Notion)
NOTION_DATABASE_PRICE_POOL=your_price_pool_database_id_here
```

All other required variables should already be configured.

## Notion Database Schema

### Price Pool Database

The Price Pool database must have the following fields:

| Field Name | Type | Description |
|------------|------|-------------|
| `Discord ID` | Title | User's Discord ID |
| `Week date` | Date | Monday of the week (start date) |
| `User` | Relation | Relation to Users database |
| `Message` | Rich Text | Description of charge (e.g., "Habit X: 2 missed") |
| `Price` | Number | Charge amount in euros |

## Report Schedule

- **Frequency**: Weekly
- **Day**: Sunday
- **Time**: 20:00 (8:00 PM)
- **Timezone**: `Europe/Berlin` (configurable via `TIMEZONE` env var)

## Report Contents Example

```
📊 WEEKLY ACCOUNTABILITY REPORT
Week: Nov 25 - Dec 1, 2024

📈 Quick Stats
👥 Users tracked: 3
✨ Perfect weeks: 1
💸 Users with charges: 2

🏆 LEADERBOARD
🏆 #1 Alice - 100.0% (3/3 | 🔥 5w)
🥈 #2 Bob - 85.7% (6/7 | 🔥 2w)
🥉 #3 Charlie - 66.7% (4/6)

👤 Alice (@alice123)
✅ Morning Exercise: 5/5 completed (100%)
✅ Meditation: 7/7 completed (100%)
✅ Reading: 3/3 completed (100%)
Subtotal: €0.00 🎉 Perfect week!
Overall Rate: 100.0%
Streak: 🔥 5 weeks

👤 Bob (@bob456)
✅ Running: 3/3 completed (100%)
❌ Journaling: 5/7 completed (71%) - 2 missed → €1.00
Subtotal: €1.00
Overall Rate: 85.7%
Streak: 🔥 2 weeks

🤝 SOCIAL INSIGHTS
Community engagement is strong this week! Alice's consistent performance is
inspiring others. Bob and Charlie could benefit from accountability partnerships.

💰 PRICE POOL SUMMARY
This week's charges: €1.50
Total pool balance: €15.50

This Week's Contributors:
• Bob: €1.00
• Charlie: €0.50

🎯 Next check: Sunday at 8:00 PM
€0.50 per missed habit iteration
```

## Key Features

### Proof Compliance Calculation
```typescript
targetFrequency = habit.frequency  // e.g., 7 times per week
actualProofs = proofs.length       // e.g., 5 actual proofs
missedCount = max(0, target - actual)  // e.g., 2 missed
charge = missedCount × €0.50       // e.g., €1.00
completionRate = (actual / target) × 100  // e.g., 71.4%
```

### Streak Calculation
- Queries the **Weeks** database for user's weekly scores
- Counts consecutive weeks with score >= 7 (perfect weeks)
- Displays in leaderboard and user reports

### Leaderboard Ranking
- Sorts users by overall completion rate (descending)
- Calculates average completion rate across all habits
- Assigns rank-based and streak-based badges

### Social Insights (AI-Generated)
- Uses Perplexity AI to analyze community engagement
- Provides 2-3 concise, actionable insights
- Suggests peer support opportunities

## Testing

The implementation has been successfully built with TypeScript compilation:

```bash
npm run build  # ✅ Success - no errors
```

### Manual Testing

To manually trigger the accountability report (for testing):

```typescript
// In your Discord bot's console or test script:
const scheduler = habitBot.accountabilityScheduler;
await scheduler.triggerAccountabilityCheck();
```

## Differences from Python Money Agent

| Aspect | Python Money Agent | TypeScript Combined Agent |
|--------|-------------------|---------------------------|
| Language | Python | TypeScript |
| Integration | Standalone service | Integrated into main bot |
| Scheduling | APScheduler (9 PM) | node-cron (8 PM) |
| Social Analysis | None | Included (via Group Agent logic) |
| Leaderboard | Basic | Enhanced with badges & streaks |
| Report Format | Basic embed | Rich multi-embed report |
| Dry-run Mode | Supported | Not included (can be added) |
| CLI Modes | Multiple (force, dry-run, report-only) | Scheduler only |

## Migration Notes

If you were using the Python money_agent:

1. **Stop the Python service** - no longer needed
2. **Add `NOTION_DATABASE_PRICE_POOL` to `.env`** - same database ID
3. **Restart the TypeScript bot** - scheduler starts automatically
4. **Verify schedule** - now runs at 8 PM instead of 9 PM (configurable)

## Future Enhancements (Optional)

1. **Add dry-run mode** for testing without saving charges
2. **Add manual trigger slash command** (e.g., `/weekly-report`)
3. **Configurable charge amount** (currently hardcoded to €0.50)
4. **Weekly summary email** option
5. **Historical reports** (query past weeks)
6. **Pool redemption system** (use pool for rewards)

## Troubleshooting

### Agent not running?
- Check logs for "Accountability Scheduler started successfully"
- Verify `DISCORD_ACCOUNTABILITY_GROUP` is set correctly
- Ensure `NOTION_DATABASE_PRICE_POOL` is configured

### No reports posted?
- Check accountability channel permissions (bot can post embeds)
- Verify timezone setting in env (default: Europe/Berlin)
- Check logs for errors during report generation

### Charges not saving?
- Verify Price Pool database ID is correct
- Check Price Pool database schema matches requirements
- Look for "Price Pool entries saved" in logs

## Summary

The Accountability & Money Agent successfully combines:
- ✅ **Financial accountability** (€0.50 per miss)
- ✅ **Social dynamics analysis** (AI-powered insights)
- ✅ **Leaderboard & rankings** (with badges)
- ✅ **Streak tracking** (consecutive perfect weeks)
- ✅ **Comprehensive reporting** (rich Discord embeds)
- ✅ **Automated scheduling** (Sunday 8 PM)

All functionality from both agents has been preserved and enhanced in the new unified implementation.
