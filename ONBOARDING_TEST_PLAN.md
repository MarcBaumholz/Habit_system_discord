# 🧪 **Onboarding Test Plan - Complete Testing Guide**

## 🎯 **Test Objective:**
Verify that the `/onboard` command works correctly after all fixes have been applied.

---

## 📋 **Pre-Test Checklist:**

### ✅ **Bot Status:**
- [x] Bot is running (PID: 178939)
- [x] No startup errors in logs
- [x] Bot logged in as "Habit System#5492"
- [x] All schedulers started successfully

### ✅ **Configuration:**
- [x] Personality Database exists: `289d42a1faf580c8b37ac8be7a37fa9a`
- [x] Database ID matches `.env` file
- [x] User exists in Users Database (Marc: `383324294731661312`)
- [ ] **Database shared with integration** (needs verification)

---

## 🧪 **Test Steps:**

### **Step 1: Check Database Access**
**Command:** Check if the Personality Database is accessible
```bash
# Monitor logs for database access
tail -f logs/pm2-combined.log
```

### **Step 2: Test /onboard Command**
**Action:** Marc runs `/onboard` in Discord
**Expected Results:**
- ✅ No "Interaction has already been acknowledged" errors
- ✅ Modal opens successfully
- ✅ No Discord interaction errors

### **Step 3: Fill Out Modal**
**Action:** Fill out the onboarding modal with test data:
- **Personality Type:** INTJ
- **Core Values:** Health, Family, Growth
- **Life Vision:** Become the best version of myself
- **Main Goals:** 
  - Build consistent morning routine
  - Learn new skills
  - Improve relationships
- **Big Five Traits:** High conscientiousness, moderate extraversion

### **Step 4: Submit Modal**
**Expected Results:**
- ✅ Profile created successfully in Notion
- ✅ Success message displayed
- ✅ No database errors

---

## 🔍 **Monitoring Commands:**

### **Real-time Log Monitoring:**
```bash
# Monitor all logs
tail -f logs/pm2-combined.log

# Monitor only errors
tail -f logs/pm2-error.log

# Filter for onboard-related logs
tail -f logs/pm2-combined.log | grep -i "onboard\|modal\|profile"
```

### **Check Bot Status:**
```bash
# Check bot status
pm2 status

# Check bot logs
pm2 logs discord-habit-system
```

---

## 📊 **Expected Test Outcomes:**

### **✅ Success Scenario:**
1. `/onboard` command executes without errors
2. Modal opens and displays correctly
3. Form submission creates profile in Notion
4. Success message shows in Discord
5. No errors in logs

### **❌ Failure Scenarios:**
1. **Database Access Error:**
   - Error: "Could not find database"
   - Solution: Share database with integration

2. **Interaction Error:**
   - Error: "Interaction has already been acknowledged"
   - Solution: Check bot restart

3. **Modal Not Opening:**
   - Error: Command times out
   - Solution: Check Discord permissions

---

## 🚀 **Ready to Test:**

### **Current Status:**
- ✅ Bot is running successfully
- ✅ All code fixes applied
- ✅ Database exists and configured
- ⏳ Ready for Discord testing

### **Next Action:**
**Marc should now try `/onboard` in Discord!**

---

## 📝 **Test Results Log:**

**Test Date:** ___________
**Tester:** Marc
**Bot Version:** Latest (with fixes)

### **Test Results:**
- [ ] Step 1: Database access
- [ ] Step 2: Command execution
- [ ] Step 3: Modal display
- [ ] Step 4: Form submission
- [ ] Step 5: Profile creation
- [ ] Step 6: Success message

### **Issues Found:**
- [ ] None
- [ ] Database access issues
- [ ] Interaction errors
- [ ] Modal problems
- [ ] Other: ___________

### **Overall Result:**
- [ ] ✅ SUCCESS - Onboarding works perfectly
- [ ] ❌ PARTIAL - Some issues remain
- [ ] ❌ FAILED - Major issues need fixing

---

## 🔧 **If Issues Found:**

1. **Check logs immediately:** `tail -f logs/pm2-combined.log`
2. **Share error messages** for debugging
3. **Verify database sharing** with integration
4. **Check Discord permissions** for bot

**Ready to test! Go ahead and try `/onboard` in Discord!** 🚀
