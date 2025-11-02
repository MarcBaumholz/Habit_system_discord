# Pause/Activate User System - Implementation Summary

## ✅ Implementation Complete

This document summarizes the implementation of the pause/activate functionality for the Habit System Discord Bot.

## Overview

Users can now pause their participation in the habit system using `/pause` and reactivate using `/activate`. Paused users are excluded from all weekly analysis, reports, and agent processing.

## Changes Made

### 1. Type Updates (`src/types/index.ts`)
- Added `status?: 'active' | 'pause'` to User interface (defaults to 'active')
- Added `pauseReason?: string` for storing pause reason
- Added `pauseDuration?: string` for storing pause duration (informational only)

### 2. NotionClient Updates (`src/notion/client.ts`)
- **getUserByDiscordId()**: Now extracts Status, Pause Reason, and Pause Duration from Notion
- **updateUser()**: Supports updating status, pauseReason, and pauseDuration fields
- **createUser()**: Sets default status to 'active' when creating new users
- **getAllUsers()**: Now extracts status fields (returns all users with status)
- **getActiveUsers()**: NEW method that returns only users with status 'active' (used by analysis/agents)

### 3. Discord Commands

#### `/pause` Command (`src/bot/bot.ts`, `src/bot/commands.ts`)
- **Parameters:**
  - `reason` (required): Why the user is pausing
  - `duration` (optional): How long they expect to pause (informational)
- **Features:**
  - Only works in user's personal channel (verified by channel name and ID)
  - Updates user status to 'pause' in Notion
  - Stores pause reason and duration
  - Sends confirmation message

#### `/activate` Command (`src/bot/bot.ts`, `src/bot/commands.ts`)
- **Parameters:** None
- **Features:**
  - Only works in user's personal channel
  - Updates user status to 'active' in Notion
  - Clears pause reason and duration
  - Sends welcome back message

### 4. Filter Paused Users

#### Weekly Agent Scheduler (`src/bot/weekly-agent-scheduler.ts`)
- **gatherUserContext()**: Checks user status before gathering context
- **runWeeklyAnalysis()**: Skips analysis if user is paused, sends appropriate message
- Paused users receive a message explaining they're paused and how to reactivate

#### AI Incentive Manager (`src/bot/ai-incentive-manager.ts`)
- **getAllUsers()**: Now uses `getActiveUsers()` instead
- Only active users receive weekly AI incentive messages

#### Group Agent (`src/agents/group/group_agent.ts`)
- **processRequest()**: Uses `getActiveUsers()` instead of `getAllUsers()`
- Paused users are excluded from group dynamics analysis

## Personal Channel Verification

Both `/pause` and `/activate` commands verify:
1. Channel name starts with "personal-"
2. Channel ID matches user's `personalChannelId` from Notion

If verification fails, command returns an error message.

## Database Requirements

Ensure your Notion Users database has these properties:
- **Status** (Select type): Options: "active", "pause"
- **Pause Reason** (Rich Text): Optional, stores reason for pausing
- **Pause Duration** (Rich Text): Optional, informational only

## Testing Checklist

1. ✅ Type definitions updated
2. ✅ NotionClient methods updated
3. ✅ Command definitions added
4. ✅ Command handlers implemented
5. ✅ Personal channel verification implemented
6. ✅ Weekly scheduler filters paused users
7. ✅ AI incentive manager filters paused users
8. ✅ Group agent filters paused users
9. ✅ No linting errors

## Next Steps for Manual Testing

1. **Test `/pause` command:**
   - Use in personal channel with reason and duration
   - Verify status updated in Notion
   - Try using in non-personal channel (should fail)

2. **Test `/activate` command:**
   - Use in personal channel
   - Verify status set back to 'active' in Notion
   - Verify pause fields cleared

3. **Test paused user exclusion:**
   - Pause a user
   - Verify they don't appear in weekly analysis
   - Verify they don't receive AI incentive messages
   - Verify they're excluded from group analysis

4. **Test activation:**
   - Activate paused user
   - Verify they're included in analysis again

## Notes

- Status defaults to 'active' for backward compatibility with existing users
- Pause duration is informational only (doesn't auto-activate)
- Commands are restricted to personal channels for privacy
- All analysis/agents exclude paused users
- Weekly analysis will skip paused users completely with a message

## Files Modified

1. `src/types/index.ts` - Added status fields to User interface
2. `src/notion/client.ts` - Updated user CRUD methods and added getActiveUsers()
3. `src/bot/bot.ts` - Added command definitions
4. `src/bot/commands.ts` - Added handlePause() and handleActivate() methods
5. `src/bot/weekly-agent-scheduler.ts` - Added status check before analysis
6. `src/bot/ai-incentive-manager.ts` - Uses getActiveUsers()
7. `src/agents/group/group_agent.ts` - Uses getActiveUsers()

