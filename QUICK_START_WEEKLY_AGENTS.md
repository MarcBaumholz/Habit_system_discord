# ⚡ Quick Start Guide - Weekly Agent Scheduler

**Get up and running in 5 minutes!**

---

## 🎯 What This Does

Every **Wednesday at 9:00 AM**, the system automatically:
1. Runs 5 AI agents to analyze your habits
2. Generates a comprehensive weekly report
3. Sends it to Marc's Discord channel (1422681618304471131)

---

## 🚀 Quick Setup (5 Minutes)

### Step 1: Update Environment Variables

```bash
cd /home/pi/Documents/habit_System/Habit_system_discord
nano .env
```

Add these two lines:
```bash
MARC_DISCORD_CHANNEL=1422681618304471131
MARC_DISCORD_USER_ID=<get-from-step-2>
```

### Step 2: Get Marc's User ID

```bash
# Build the project first
npm run build

# Find Marc's Notion user ID
node -e "
require('dotenv').config();
const { Client } = require('@notionhq/client');
const notion = new Client({ auth: process.env.NOTION_TOKEN });
notion.databases.query({ database_id: process.env.NOTION_DATABASE_USERS })
  .then(r => r.results.forEach(p => 
    console.log(\`\${p.properties['Discord ID']?.title?.[0]?.plain_text}: \${p.id}\`)
  ));
"
```

Copy Marc's ID and paste it into `.env`

### Step 3: Test It NOW (Don't Wait for Wednesday!)

```bash
npx ts-node test-weekly-agents.ts
```

You should see:
```
✅ Discord client ready
🤖 Initializing agents...
✅ All agents initialized successfully
🚀 Starting weekly analysis...
🧘‍♂️ Running Mentor Agent...
🆔 Running Identity Agent...
📊 Running Accountability Agent...
📚 Running Learning Agent...
👥 Running Group Agent...
✅ Weekly analysis complete!
```

### Step 4: Check Discord

Go to channel 1422681618304471131 - you should see a beautiful multi-section report!

### Step 5: Deploy

```bash
# Using Docker
npm run docker:build
npm run docker:restart

# OR using PM2
npm run build
pm2 restart discord-habit-bot
```

**Done!** Next Wednesday at 9am, the report will run automatically.

---

## 🧪 Quick Test Commands

```bash
# Full test with all agents
npx ts-node test-weekly-agents.ts

# Build and start bot
npm run build
npm start

# Check if scheduler is running
pm2 logs discord-habit-bot | grep "Weekly"
```

---

## 🐛 Common Issues

### "User not found"
→ Check `MARC_DISCORD_USER_ID` in .env

### "Channel not found"
→ Bot needs permission in channel 1422681618304471131

### "API key not available"
→ Check `PERPLEXITY_API_KEY` in .env

---

## 📅 Schedule

**Cron:** `0 9 * * 3` (Every Wednesday at 9:00 AM)  
**Timezone:** Europe/Berlin  
**Duration:** ~60 seconds  

---

## ✅ What's Included

### 5 AI Agents:
1. 🧘‍♂️ **Mentor** - Weekly habit performance analysis
2. 🆔 **Identity** - Personality alignment check
3. 📊 **Accountability** - Motivation & consistency review
4. 📚 **Learning** - Insights synthesis
5. 👥 **Group** - Social dynamics analysis

### Features:
- ✅ Automatic Wednesday 9am execution
- ✅ Comprehensive Notion data gathering
- ✅ Beautiful Discord formatting
- ✅ Smart message splitting (2000 char limit)
- ✅ Error handling & logging
- ✅ Manual test capability

---

## 📚 Full Documentation

- **Implementation Details:** `WEEKLY_AGENT_IMPLEMENTATION_SUMMARY.md`
- **Technical Plan:** `WEEKLY_AGENT_SCHEDULER_PLAN.md`
- **System Overview:** `AGENT_AND_TECH_STACK_OVERVIEW.md`

---

**Questions?** Check the troubleshooting section in WEEKLY_AGENT_IMPLEMENTATION_SUMMARY.md

**Ready to go!** 🎉

