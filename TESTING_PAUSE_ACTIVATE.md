# Testing Guide: Pause/Activate Commands

## Prerequisites

1. ✅ Bot is running and connected to Discord
2. ✅ You have a user registered (use `/join` if needed)
3. ✅ You have access to your personal channel (e.g., `personal-username`)
4. ✅ Notion Users database has:
   - `Status` property (Select type with "active" and "pause" options)
   - `Pause Reason` property (Rich Text)
   - `Pause Duration` property (Rich Text)

## Test Steps

### Test 1: Register Commands
1. Restart the bot (commands register on startup)
2. Check Discord - you should see `/pause` and `/activate` in command list
3. Try typing `/pause` - it should appear in autocomplete

### Test 2: Pause Command (Personal Channel - SUCCESS)
1. Navigate to your **personal channel** (e.g., `personal-yourname`)
2. Run: `/pause reason:"Taking a break due to vacation" duration:"2 weeks"`
3. **Expected Result:**
   - ✅ Bot responds with pause confirmation
   - ✅ Status in Notion Users DB changes to "pause"
   - ✅ Pause Reason field filled with your reason
   - ✅ Pause Duration field filled with "2 weeks"

### Test 3: Pause Command (Wrong Channel - FAIL)
1. Navigate to a **non-personal channel** (e.g., general channel)
2. Run: `/pause reason:"Test"`
3. **Expected Result:**
   - ❌ Bot responds: "This command can only be used in your personal channel."

### Test 4: Pause Command (Missing Reason - FAIL)
1. In your personal channel
2. Run: `/pause` (without reason)
3. **Expected Result:**
   - ❌ Bot responds: "Please provide a reason for pausing."

### Test 5: Verify Paused Users Excluded from Analysis
1. While paused, check:
   - Weekly analysis should skip you (if it runs)
   - You should NOT receive AI incentive messages
   - Group agent should exclude you from analysis

### Test 6: Activate Command (Personal Channel - SUCCESS)
1. Navigate to your **personal channel**
2. Run: `/activate`
3. **Expected Result:**
   - ✅ Bot responds with activation confirmation
   - ✅ Status in Notion Users DB changes back to "active"
   - ✅ Pause Reason field cleared
   - ✅ Pause Duration field cleared

### Test 7: Activate Command (Wrong Channel - FAIL)
1. Navigate to a **non-personal channel**
2. Run: `/activate`
3. **Expected Result:**
   - ❌ Bot responds: "This command can only be used in your personal channel."

### Test 8: Verify Reactivated Users Included in Analysis
1. After activating, wait for:
   - Weekly analysis to run (should include you now)
   - AI incentive messages (should receive if eligible)
   - Group agent (should include you)

## Verification Checklist

After each test, verify in Notion:

- [ ] Status property updated correctly
- [ ] Pause Reason stored (when paused)
- [ ] Pause Duration stored (when provided)
- [ ] Fields cleared on activation

## Common Issues

### Issue: "This command can only be used in your personal channel"
**Solution:** 
- Make sure you're in YOUR personal channel (not someone else's)
- Channel name must start with "personal-"
- Channel ID must match your `personalChannelId` in Notion

### Issue: "User not found"
**Solution:**
- Run `/join` first to register in the system
- Check that your Discord ID matches in Notion

### Issue: Commands not appearing in Discord
**Solution:**
- Restart the bot (commands register on startup)
- Wait a few seconds after restart
- Try refreshing Discord

### Issue: Status not updating in Notion
**Solution:**
- Check bot logs for errors
- Verify Notion database permissions
- Check that Status property exists and is Select type

## Test Script (Manual)

```bash
# 1. Restart bot
npm start

# 2. Check logs for command registration
# Should see: "Successfully reloaded application (/) commands."

# 3. In Discord personal channel:
/pause reason:"Test pause" duration:"1 week"

# 4. Check Notion - Status should be "pause"

# 5. In Discord personal channel:
/activate

# 6. Check Notion - Status should be "active"
```

## Expected Bot Logs

When pause command succeeds:
```
🔍 Starting pause process for user: [discord-id]
✅ User paused successfully: [username]
```

When activate command succeeds:
```
🔍 Starting activate process for user: [discord-id]
✅ User activated successfully: [username]
```

When weekly analysis skips paused user:
```
User Paused - Skipping Analysis
User [username] is paused, skipping weekly analysis
```

## Success Criteria

✅ All 8 tests pass
✅ Notion database updates correctly
✅ Commands work in personal channels only
✅ Paused users excluded from analysis
✅ Activated users included in analysis
✅ Error messages are clear and helpful

