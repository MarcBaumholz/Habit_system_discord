# 🧪 Testing Guide - New Habit Form Implementation

**Date:** January 2025  
**Purpose:** Test the complete keystone habit creation flow with all new features

---

## 🚀 Step 1: Build and Restart the Bot

### 1.1 Build the TypeScript Code
```bash
cd /home/pi/Documents/habit_System/Habit_system_discord
npm run build
```

**Expected Output:**
- Should compile without errors
- Creates/updates `dist/` folder

### 1.2 Restart PM2 Process
```bash
pm2 restart discord-habit-system
# OR if using different name:
pm2 restart habit-discord-bot
```

### 1.3 Check Bot Status
```bash
pm2 list
pm2 logs discord-habit-system --lines 20
```

**What to Look For:**
- ✅ Bot should show as "online" in Discord
- ✅ No error messages in logs
- ✅ Should see "Bot is ready!" message

---

## 📋 Step 2: Prepare Notion Database

### 2.1 Add New Fields to Habits Database

Go to your Notion Habits database and add these new properties:

1. **Selected Days** (Type: Multi-select)
   - Options: Mon, Tue, Wed, Thu, Fri, Sat, Sun

2. **Autonomy** (Type: Rich text)

3. **Curiosity Passion Purpose** (Type: Rich text)

4. **Consequences** (Type: Rich text)

5. **Commitment Signature** (Type: Rich text)

**Note:** If you don't add these fields, the bot will still work but won't save these values. The bot handles missing fields gracefully.

---

## 🎯 Step 3: Test the Complete Flow

### 3.1 Start the Flow

1. Go to your **personal Discord channel** (e.g., `#personal-yourname`)
2. Type: `keystonehabit` (or any variation: `keystone habit`, `keystone-habit`, etc.)

**Expected Result:**
- Bot should respond with a day selector message
- You should see 7 circular buttons: M, T, W, T, F, S, S
- A "Step 1/4: Continue to Basics" button (disabled until you select days)

### 3.2 Test Day Selector

1. **Click on different day buttons** (e.g., Mon, Wed, Fri)
   - ✅ Selected days should show with ✅ checkmark
   - ✅ Unselected days should show with ⭕ circle
   - ✅ Button colors should change (green for selected, gray for unselected)
   - ✅ Message should update showing "Selected: Mon, Wed, Fri (3 days/week)"
   - ✅ "Continue" button should become enabled

2. **Try to continue without selecting days**
   - ✅ Should show error: "Please select at least one day before continuing"

3. **Toggle days on/off**
   - ✅ Click a selected day to deselect it
   - ✅ Click an unselected day to select it
   - ✅ Count should update dynamically

### 3.3 Test Modal 1: Basics

1. **Click "Step 1/4: Continue to Basics"**
   - ✅ Modal should open with title "Step 1/4: Basics"
   - ✅ Should have 4 fields (NOT 5 - frequency removed):
     - What do you want to call this habit?
     - Which life categories? (comma-separated)
     - When and where will you do it?
     - Difficulty level? (easy/medium/hard)

2. **Fill out the form:**
   ```
   Name: Test Meditation
   Domains: health, mental wellness
   Context: Every morning at 7am in my bedroom
   Difficulty: medium
   ```

3. **Submit Modal 1**
   - ✅ Should show success message: "✅ Basics saved! Continue to the next step:"
   - ✅ Should show button: "Step 2/4: Goals & Motivation"

### 3.4 Test Modal 2: Goals & Motivation

1. **Click "Step 2/4: Goals & Motivation"**
   - ✅ Modal should open with title: "Step 2/4: Goals & Motivation (Balance challenge & skill)"
   - ✅ Should have 5 fields:
     - Enter a clear SMART goal (with explanation in placeholder)
     - What is your epic meaning? (NOT "Why is this habit important")
     - Minimal dose (0.8 rule)
     - Habit loop (cue → routine → reward)
     - Consequences of not committing? (NEW)

2. **Fill out the form:**
   ```
   SMART Goal: Meditate 10 minutes daily for better focus in 66 days
   Epic Meaning: I want to reduce stress and improve my mental clarity
   Minimal Dose: 2 minutes of breathing
   Habit Loop: Cue: Alarm rings → Routine: 10min meditation → Reward: Coffee
   Consequences: I'll feel more stressed and less focused, affecting my work
   ```

3. **Submit Modal 2**
   - ✅ Should show success message
   - ✅ Should show button: "Step 3/4: Reflection & Planning"

### 3.5 Test Modal 3: Reflection & Planning

1. **Click "Step 3/4: Reflection & Planning"**
   - ✅ Modal should open with title: "Step 3/4: Reflection & Planning"
   - ✅ Should have 4 fields (NOT 5 - Implementation Intentions removed):
     - Curiosity, passion & purpose? (NEW)
     - How does this give you control? (NEW - Autonomy)
     - What hurdles might get in the way?
     - How to be reminded? (with examples: Discord DM, Calendar, Phone Alarm)

2. **Fill out the form:**
   ```
   Curiosity/Passion/Purpose: I'm curious about mindfulness, passionate about self-improvement, serves my purpose of being a better leader
   Autonomy: This gives me control over my morning routine and mental state
   Hurdles: Too tired in mornings, time pressure, forgetfulness
   Reminder: Discord DM
   ```

3. **Submit Modal 3**
   - ✅ Should show a **SUMMARY SCREEN** (not immediately create habit)
   - ✅ Summary should display ALL collected data organized by category

### 3.6 Test Summary Screen

**Check the summary displays:**
- ✅ **Basics section:** Name, Domains, Days (with selected days), Context, Difficulty
- ✅ **Goals & Motivation section:** SMART Goal, Epic Meaning, Minimal Dose, Habit Loop, Consequences
- ✅ **Reflection & Planning section:** Curiosity/Passion/Purpose, Autonomy, Hurdles, Reminder
- ✅ Should show button: "Step 4/4: Sign 66-Day Commitment"

### 3.7 Test Modal 4: Commitment

1. **Click "Step 4/4: Sign 66-Day Commitment"**
   - ✅ Modal should open with title: "Step 4/4: 66-Day Commitment"
   - ✅ Should have 1 field: "Type 'I commit' to sign contract"

2. **Test validation:**
   - ❌ Type something wrong (e.g., "I agree") → Should show error
   - ❌ Type "commit" → Should show error
   - ✅ Type "I commit" (case-insensitive) → Should work
   - ✅ Type "i commit" → Should work
   - ✅ Type "I COMMIT" → Should work

3. **Submit with "I commit"**
   - ✅ Should create habit in Notion
   - ✅ Should show success message with all details
   - ✅ Should mention "66-Day Commitment: Signed"

---

## ✅ Step 4: Verify in Notion

### 4.1 Check Habit Was Created

1. Go to your Notion **Habits database**
2. Find the habit you just created (should be at the top)

### 4.2 Verify All Fields Are Saved

**Check these fields exist and have values:**
- ✅ Name: "Test Meditation"
- ✅ Domains: health, mental wellness
- ✅ Frequency: Should match number of selected days (e.g., 3)
- ✅ Selected Days: Should show selected days (e.g., Mon, Wed, Fri)
- ✅ Context: "Every morning at 7am in my bedroom"
- ✅ Difficulty: "medium"
- ✅ SMART Goal: Your goal text
- ✅ Why: Your epic meaning text
- ✅ Minimal Dose: "2 minutes of breathing"
- ✅ Habit Loop: Your habit loop text
- ✅ Consequences: Your consequences text
- ✅ Curiosity Passion Purpose: Your text
- ✅ Autonomy: Your autonomy text
- ✅ Hurdles: Your hurdles text
- ✅ Reminder Type: "Discord DM"
- ✅ Commitment Signature: "I commit"

**Note:** If some fields are missing, check:
1. Did you add the new fields to Notion database?
2. Check bot logs for any errors

---

## 🐛 Step 5: Test Edge Cases

### 5.1 Test Session Expiry
1. Start the flow
2. Wait 5+ minutes without completing
3. Try to continue
   - ✅ Should show "Session expired" error

### 5.2 Test Multiple Users
1. Have another user type `keystonehabit` in their personal channel
2. Both should be able to create habits simultaneously
   - ✅ Each user's data should be separate

### 5.3 Test Going Back
- Currently not supported (by design)
- Each step must be completed in order

### 5.4 Test Invalid Inputs
1. Try submitting empty required fields
   - ✅ Discord modals prevent this (required fields can't be empty)
2. Try very long text in fields
   - ✅ Should work (Discord has limits but they're generous)

---

## 📊 Step 6: Check Logs

### 6.1 View Real-Time Logs
```bash
pm2 logs discord-habit-system --lines 50
```

**What to Look For:**
- ✅ "Keystone habit created via modal flow: [habit-id]"
- ✅ No error messages
- ✅ Successful Notion API calls

### 6.2 Check for Errors
```bash
pm2 logs discord-habit-system --err --lines 50
```

**If you see errors:**
- Check Notion database permissions
- Verify all environment variables are set
- Check if new Notion fields were added correctly

---

## 🎯 Quick Test Checklist

Use this checklist to quickly verify everything works:

- [ ] Bot builds without errors (`npm run build`)
- [ ] Bot restarts successfully (`pm2 restart`)
- [ ] Bot is online in Discord
- [ ] Day selector appears when typing `keystonehabit`
- [ ] Can select/deselect days
- [ ] Modal 1 opens with 4 fields (no frequency field)
- [ ] Modal 2 opens with 5 fields (includes consequences)
- [ ] Modal 2 title includes "(Balance challenge & skill)"
- [ ] Modal 2 has "Epic Meaning" (not "Why")
- [ ] Modal 2 has "Minimal dose (0.8 rule)"
- [ ] Modal 3 opens with 4 fields (no Implementation Intentions)
- [ ] Modal 3 has Curiosity/Passion/Purpose field
- [ ] Modal 3 has Autonomy field
- [ ] Summary screen shows all data
- [ ] Modal 4 requires "I commit"
- [ ] Habit is created in Notion with all fields
- [ ] Success message shows all details

---

## 🆘 Troubleshooting

### Problem: Bot doesn't respond to `keystonehabit`
**Solution:**
1. Check bot is online: `pm2 list`
2. Check logs: `pm2 logs discord-habit-system`
3. Verify you're in your personal channel
4. Try restarting: `pm2 restart discord-habit-system`

### Problem: Day selector buttons don't work
**Solution:**
1. Check if button interactions are registered in `bot.ts`
2. Verify `handleButtonInteraction` is called
3. Check logs for button interaction errors

### Problem: Fields not saving to Notion
**Solution:**
1. Verify new fields exist in Notion database
2. Check field names match exactly (case-sensitive)
3. Check Notion database permissions
4. Review bot logs for Notion API errors

### Problem: Modal doesn't open
**Solution:**
1. Check Discord permissions
2. Verify modal is being shown (check logs)
3. Try refreshing Discord client
4. Check if you're clicking the button correctly

### Problem: "Session expired" too quickly
**Solution:**
- Current timeout is 5 minutes
- Complete the flow within 5 minutes
- Or restart by typing `keystonehabit` again

---

## 📝 Test Results Template

After testing, document your results:

```
Test Date: [DATE]
Tester: [YOUR NAME]

✅ Day Selector: [PASS/FAIL]
✅ Modal 1: [PASS/FAIL]
✅ Modal 2: [PASS/FAIL]
✅ Modal 3: [PASS/FAIL]
✅ Summary Screen: [PASS/FAIL]
✅ Modal 4: [PASS/FAIL]
✅ Notion Save: [PASS/FAIL]

Issues Found:
- [List any issues]

Notes:
- [Any observations]
```

---

## 🎉 Success Criteria

The implementation is successful if:
1. ✅ All 12 tasks from the plan are working
2. ✅ Flow completes end-to-end without errors
3. ✅ All data saves correctly to Notion
4. ✅ User experience is smooth and intuitive
5. ✅ Progress indicators show correctly
6. ✅ Summary displays all information
7. ✅ Commitment signature validates correctly

---

**Happy Testing! 🚀**

