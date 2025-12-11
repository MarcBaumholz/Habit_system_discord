# Marc and Buddy System Test Guide

## Test Overview

This test runs all use cases for Marc and his buddy (Phi-lin) to verify the buddy system works correctly in Discord.

## What Gets Tested

### 1. **Test Message** ✅
- Sends a test notification to Marc's personal channel
- Verifies Discord connection and channel access

### 2. **Buddy Progress Display** ✅
- Retrieves Phi-lin's progress from the past 7 days
- Shows:
  - Completion Rate
  - Current Streak
  - Habits Tracked
  - Proofs Submitted
  - Habits with Issues (if any)

### 3. **Buddy Notification** ✅
- Checks if Phi-lin has any habits with issues
- If issues found, sends notification:
  > "Your buddy **Phi-lin** did not reach their goal with **[Habit Name]**. Their goal was: [goal]. Ask them why this happened and ask them for feedback."

### 4. **Full Weekly Analysis** ✅
- Runs complete weekly analysis with AI
- Includes:
  - Marc's personal progress
  - Phi-lin's buddy progress section
  - Adaptive goals recommendations
  - Next steps and coaching advice
  - Confidence score

## Expected Messages in Discord

### Message 1: Test Start
```
🧪 Buddy System Full Test

Running complete weekly analysis with buddy progress...
```

### Message 2: Weekly Analysis
```
🤖 Weekly Analysis - [Date]

[Full AI-generated analysis including:]
- Performance scorecard
- Pattern insights
- Success factors
- Areas for improvement
- Next week coaching plan
- Buddy progress section

Confidence Score: [X]%

Next Steps:
1. [Step 1]
2. [Step 2]
3. [Step 3]
```

### Message 3: Buddy Notification (if applicable)
```
⚠️ Buddy Check-in Needed

Your buddy Phi-lin did not reach their goal with [Habit Name]. 
Their goal was: [goal]. Ask them why this happened and ask them for feedback.
```

## Running the Test

### Option 1: Simple Test (Fast - No AI)
```bash
npx ts-node test-marc-discord-simple.ts
```
- Sends test messages
- Shows buddy progress
- No AI processing (faster)

### Option 2: Full Test (Complete - With AI)
```bash
npx ts-node test-marc-full-analysis.ts
```
- Runs complete weekly analysis
- Includes AI-generated content
- Takes 30-60 seconds

## What to Check in Discord

1. ✅ **Messages appear in Marc's personal channel**
2. ✅ **Buddy progress section is included**
3. ✅ **Buddy notification appears if Phi-lin has issues**
4. ✅ **All formatting is correct**
5. ✅ **No errors in messages**

## Current Buddy Pair

- **Marc** (klumpenklarmarc) ↔ **Phi-lin** (elprofesor8669)
- Both users are active
- Both have personal channels configured

## Troubleshooting

### If messages don't appear:
1. Check bot is logged in to Discord
2. Verify Marc's personal channel ID is correct
3. Check bot has permissions in the channel
4. Verify Notion API connection

### If buddy progress is missing:
1. Verify Marc has a buddy assigned in Notion
2. Check buddy's nickname matches exactly
3. Verify buddy has habits and proofs in the past week

## Test Results

After running the test, you should see:
- ✅ All messages sent successfully
- ✅ Buddy progress included
- ✅ Notifications working (if applicable)
- ✅ No errors in console

Check Marc's Discord channel to verify all messages display correctly!

