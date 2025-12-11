# Weekly Challenge System - Setup Guide

## Overview
The Weekly Challenge System has been successfully implemented! This guide will help you set it up and deploy it.

## 1. Create Notion Database

### Database Name: Challenge Proofs

Create a new database in Notion with the following properties:

| Property Name | Type | Required |
|--------------|------|----------|
| **Title** | title | ✅ |
| **Challenge Number** | number | ✅ |
| **Challenge Name** | rich_text | ✅ |
| **User** | relation (to Users DB) | ✅ |
| **Date** | date | ✅ |
| **Unit** | rich_text | ✅ |
| **Note** | rich_text | ❌ |
| **Is Minimal Dose** | checkbox | ✅ |
| **Week Start** | date | ✅ |
| **Week End** | date | ✅ |

### Steps:
1. Open your Notion workspace
2. Create a new database (table view recommended)
3. Name it "Challenge Proofs"
4. Add each property with the exact names and types listed above
5. Set up the "User" relation to point to your existing Users database
6. Get the database ID:
   - Click "..." on the database
   - Select "Copy link to view"
   - Extract the ID from the URL: `https://notion.so/{workspace}/{DATABASE_ID}?v=...`

## 2. Update Environment Variables

Add these two new variables to your `.env` file:

```bash
# Weekly Challenges
DISCORD_WEEKLY_CHALLENGES=1435745502988599348
NOTION_DATABASE_CHALLENGE_PROOFS=your_database_id_here
```

Replace `your_database_id_here` with the database ID you extracted in step 1.

## 3. Build and Deploy

```bash
# Build the TypeScript code
npm run build

# Deploy with Docker
npm run docker:deploy

# Or manually restart
npm run docker:restart
```

## 4. System Features

### Automatic Scheduling

The system runs three automated jobs:

1. **Sunday 9 AM** - Evaluation of last week's challenge
   - Counts proofs for each participant
   - Determines winners (met completion requirement)
   - Awards €1 credit to winners
   - Posts results with leaderboard

2. **Sunday 3 PM** - New challenge deployment
   - Rotates to next challenge (1→2→3→...→20→1)
   - Posts challenge embed with "Join Challenge" button
   - Starts new week tracking

3. **Wednesday 12 PM** - Mid-week reminder
   - Shows current progress stats
   - Motivates participants
   - Displays who's on track

### User Flow

1. **Sunday 3 PM**: Challenge is posted to weekly challenges channel
2. **Users click "Join Challenge"** button
3. **Throughout the week**: Users submit proofs in the channel (plain messages)
4. **Bot validates**: 1 proof per day max, must be joined
5. **Bot tracks**: Counts proofs, checks against requirement
6. **Sunday 9 AM**: Evaluation runs, winners get €1 credit

### Proof Submission

Users simply type their achievement in the weekly challenges channel:
- "90 minutes deep work on refactoring"
- "3 pages morning journal"
- "16 hour fast completed"

The bot will:
- Validate user joined the challenge
- Check they haven't submitted today already
- Save to Notion
- React with ⭐ (minimal) or ✅ (full)
- Show progress (e.g., "3/5 days completed")

## 5. The 20 Challenges

All challenges are defined in [challenges/weekly-challenges.md](challenges/weekly-challenges.md)

Categories:
- **CEO Habits**: Deep Work, Reading, Strategic Thinking, 5 AM Club
- **Biohacking**: Cold Exposure, Intermittent Fasting, Breath Work, Morning Sunlight
- **Life Improvement**: Journaling, Meditation, Gratitude, Acts of Kindness, Learning
- **Productivity**: Creative Hour, Planning & Review
- **Health**: HIIT, Zone 2 Cardio, Protein Optimization, No Alcohol

## 6. Monitoring

### Logs to Check
- `npm run docker:logs` - See all system logs
- Look for: `✅ Challenge Scheduler started successfully`
- Challenge joins are logged to Discord info channel

### Testing

To manually trigger a challenge deployment (for testing):
```typescript
// In Discord, you can ask me to add a manual trigger command
// Or trigger via code:
challengeScheduler.manualDeployChallenge();
```

### State Management

Challenge state is persisted to `challenge-state.json` in the project root:
```json
{
  "currentChallengeIndex": 0,
  "currentWeekStart": "2025-01-12",
  "currentWeekEnd": "2025-01-19",
  "joinedUserIds": ["user123", "user456"],
  "challengeMessageId": "message789",
  "lastEvaluationDate": "2025-01-12T09:00:00.000Z",
  "lastUpdated": "2025-01-12T15:00:00.000Z"
}
```

## 7. Rewards System

- Challenges use the existing **Price Pool database**
- Winners get negative entries (credits): `-1.00`
- Message: "Challenge completion reward - earned €1"
- This reduces their total owed or builds positive balance

## 8. Troubleshooting

### Challenge not posting on Sunday?
- Check timezone in `.env`: `TIMEZONE=Europe/Berlin`
- Verify cron jobs started: Look for log messages on bot startup
- Check `challenge-state.json` exists

### Users can't join?
- Verify they have Status = "active" in Users database
- Check they haven't already joined (ephemeral error message will show)

### Proofs not saving?
- Ensure NOTION_DATABASE_CHALLENGE_PROOFS is set correctly
- Check database has all required properties
- Verify User relation is connected

### Evaluation not running?
- Check last Sunday's logs at 9 AM
- Verify proofs exist in Notion for that week
- Check `lastEvaluationDate` in state file

## 9. Future Enhancements

Potential improvements:
- Add `/challenge-progress` command to see current status
- Allow users to view challenge history
- Add challenge leaderboard (all-time stats)
- Implement challenge streaks
- Add bonus rewards for consecutive completions
- AI-powered proof validation (detect minimal vs full)

## 10. Architecture Summary

```
Weekly Challenges System
├── challenge-manager.ts        → Loads 20 challenges
├── challenge-state.ts          → Persists state to JSON
├── challenge-scheduler.ts      → 3 cron jobs (eval, deploy, reminder)
├── challenge-proof-processor.ts → Handles proof submissions
├── bot.ts                      → Button handler, message routing
├── notion/client.ts            → DB operations
└── challenge-state.json        → Persisted state file
```

## Support

For issues or questions, check:
1. [CHALLENGE_NOTION_SCHEMA.md](CHALLENGE_NOTION_SCHEMA.md) - Database schema details
2. [challenges/weekly-challenges.md](challenges/weekly-challenges.md) - All 20 challenges
3. [README.md](README.md) - General system documentation

---

## Quick Setup Checklist

- [ ] Create Challenge Proofs database in Notion
- [ ] Add all 10 properties with exact names
- [ ] Set up User relation
- [ ] Copy database ID
- [ ] Add NOTION_DATABASE_CHALLENGE_PROOFS to .env
- [ ] Add DISCORD_WEEKLY_CHALLENGES to .env (already done)
- [ ] Run `npm run build`
- [ ] Run `npm run docker:deploy`
- [ ] Verify logs show "Challenge Scheduler started"
- [ ] Wait for Sunday 3 PM or manually trigger first challenge
- [ ] Test joining and submitting proof

🎉 **You're all set!** The challenge system will run automatically every week.
