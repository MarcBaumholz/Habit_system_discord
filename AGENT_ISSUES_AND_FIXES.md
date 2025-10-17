# 🔧 **Weekly Agent Issues & Fixes**

## 📊 **Current Agent Status:**

### ❌ **FAILING AGENTS:**

#### 1. 🧘‍♂️ **Mentor Agent - CRITICAL FAILURE**
**Error:** `User Discord ID is missing`

**Root Cause:**
- The `getUserByDiscordId()` method in `NotionClient` is returning **empty `name` and `discordId` fields**
- Looking at the debug output from your test:
  ```
  ✅ User found: {
    id: '285d42a1-faf5-811e-bdd5-f484103d799e',
    name: '',          ← EMPTY!
    discordId: '',     ← EMPTY!
    hasPersonalChannel: true
  }
  ```

**The Problem:**
In `src/notion/client.ts` lines 330-331:
```typescript
discordId: getTitleContent(page.properties['DiscordID']),  // Wrong property type!
name: getRichTextContent(page.properties['Name']),         // Wrong property name!
```

**Looking at your Notion structure:**
```json
"DiscordID": {
  "type": "rich_text",  ← It's rich_text, NOT title!
  "rich_text": [...]
},
"Name": {
  "type": "title",      ← This is the TITLE property!
  "title": [...]
}
```

**The Fix:**
```typescript
// Line 330-331 should be:
discordId: getRichTextContent(page.properties['DiscordID']),  // Use getRichTextContent for DiscordID
name: getTitleContent(page.properties['Name']),               // Use getTitleContent for Name
```

**Impact:** Once fixed, Mentor Agent will work correctly with full user context.

---

#### 2. 🆔 **Identity Agent - MISSING DATABASE**
**Error:** `Could not find database with ID: undefine-d---`

**Root Cause:**
- Missing environment variable: `NOTION_DATABASE_PROFILES`
- The Identity Agent requires a **User Profiles** database that doesn't exist yet

**The Fix:**
You have 2 options:

**Option A: Create User Profiles Database in Notion**
1. Create a new Notion database called "User Profiles"
2. Add these properties:
   - `User` (Relation to Users database)
   - `Personality Type` (Text)
   - `Core Values` (Multi-select)
   - `Life Vision` (Text)
   - `Main Goals` (Multi-select)
   - `Life Phase` (Select)
   - `Desired Identity` (Text)
   - `Communication Style` (Select)
3. Share it with your Notion integration
4. Add to `.env`:
   ```bash
   NOTION_DATABASE_PROFILES=your-database-id-here
   ```

**Option B: Disable Identity Agent Until Profiles Exist**
Modify `src/bot/weekly-agent-scheduler.ts` to skip Identity Agent:
```typescript
// Comment out Identity Agent initialization
// this.identityAgent = new IdentityAgent(this.perplexityClient, this.notion);
```

**Recommendation:** Use **Option B** for now, implement **Option A** later when you're ready to add personality profiles.

---

### ⚠️ **WORKING BUT LIMITED:**

#### 3. 📊 **Accountability Agent - WORKING**
**Status:** ✅ Generating responses, but generic due to missing data

**Why Limited:**
- No habits found in database
- No recent proofs
- Providing fallback generic advice

**Fix:** Add habits and proofs to Notion, agent will automatically improve.

---

#### 4. 📚 **Learning Agent - WORKING**
**Status:** ✅ Running successfully, but no data to analyze

**Why Limited:**
- Learnings database query error: `Could not find property with name or id: Discord ID`
- The Learnings database uses a different property name

**The Problem:**
In `src/notion/client.ts` line 845 (getLearningsByDiscordId):
```typescript
filter: {
  property: 'Discord ID',  // ← This property doesn't exist!
  rich_text: { equals: discordId }
}
```

**The Fix:**
Check your Notion Learnings database - the property might be named:
- `DiscordID` (no space)
- `User` (relation)
- Something else

Update the query accordingly.

---

#### 5. 👥 **Group Agent - WORKING**
**Status:** ✅ Running successfully, providing generic analysis

**Why Limited:**
- User personality fields are `undefined`
- Trust count is `undefined`
- No detailed user profile data

**Fix:** Once you fix the `getUserByDiscordId()` method (Fix #1), this will improve automatically.

---

## 🔧 **IMMEDIATE ACTION PLAN:**

### **Phase 1: Critical Fixes (Do Now)**

1. **Fix getUserByDiscordId() - HIGHEST PRIORITY**
   ```bash
   File: src/notion/client.ts
   Lines: 330-331
   
   Change:
   discordId: getTitleContent(page.properties['DiscordID']),
   name: getRichTextContent(page.properties['Name']),
   
   To:
   discordId: getRichTextContent(page.properties['DiscordID']),
   name: getTitleContent(page.properties['Name']),
   ```

2. **Disable Identity Agent Temporarily**
   ```bash
   File: src/bot/weekly-agent-scheduler.ts
   
   Comment out:
   // this.identityAgent = new IdentityAgent(this.perplexityClient, this.notion);
   // await this.identityAgent.initialize(),
   // And remove from activeAgents array
   ```

3. **Fix Learnings Database Query**
   ```bash
   File: src/notion/client.ts
   Line: ~845
   
   Check your Notion Learnings database property name
   Update the filter property name to match
   ```

### **Phase 2: Data Population (Next)**

4. **Add Habits to Notion**
   - Use `/habit add` command in Discord
   - Or manually add to Notion Habits database

5. **Submit Some Proofs**
   - Use `/proof` command in Discord
   - Track at least 3-5 days of habit completions

6. **Add Learnings and Hurdles**
   - Document what works and what doesn't
   - Agents will analyze patterns

### **Phase 3: Enhancement (Later)**

7. **Create User Profiles Database**
   - Add personality assessment
   - Complete onboarding with `/onboard`

8. **Re-enable Identity Agent**
   - Once profiles database exists
   - Uncomment initialization code

---

## 🎯 **Expected Results After Fixes:**

### **After Phase 1 (Critical Fixes):**
- ✅ Mentor Agent: Will work with full user context
- ✅ Accountability Agent: Will provide user-specific advice
- ✅ Learning Agent: Will fetch and analyze learnings
- ✅ Group Agent: Will use real user data
- ⏸️ Identity Agent: Disabled (no errors)

### **After Phase 2 (Data Population):**
- 🎯 All agents provide **personalized, actionable insights**
- 📊 Rich analysis based on your actual habit data
- 💪 Specific recommendations for improvement

### **After Phase 3 (Enhancement):**
- 🆔 Identity Agent: Full personality-habit alignment analysis
- 🚀 Complete multi-agent system fully operational

---

## 📝 **Testing After Fixes:**

```bash
# 1. Apply fixes to code
# 2. Rebuild if using Docker
npm run build

# 3. Run test again
npx ts-node test-weekly-agents.ts

# 4. Check Discord for improved results
```

---

## 🔍 **How to Verify Each Agent:**

### **Mentor Agent:**
- ✅ Should show your actual habits by name
- ✅ Should reference specific completion numbers
- ✅ Should provide personalized coaching

### **Accountability Agent:**
- ✅ Should mention your actual streak
- ✅ Should reference specific habits you're struggling with
- ✅ Should provide targeted intervention

### **Learning Agent:**
- ✅ Should list your actual learnings
- ✅ Should identify patterns from your notes
- ✅ Should suggest solutions based on your hurdles

### **Group Agent:**
- ✅ Should show your actual trust count
- ✅ Should reference your personality type
- ✅ Should suggest specific accountability partners

### **Identity Agent (when re-enabled):**
- ✅ Should analyze your personality-habit alignment
- ✅ Should reference your core values
- ✅ Should suggest identity-aligned habits

---

## 📌 **Summary:**

**Currently Working:**
- ✅ Accountability Agent (generic)
- ✅ Learning Agent (no data)
- ✅ Group Agent (generic)

**Currently Broken:**
- ❌ Mentor Agent (user data extraction bug)
- ❌ Identity Agent (missing database)

**After Critical Fixes:**
- ✅ All agents except Identity will work perfectly
- 🎯 Rich, personalized analysis
- 💪 Actionable insights based on your data

---

**Next Step:** Apply Fix #1 (getUserByDiscordId) and test again!

