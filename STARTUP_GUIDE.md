# 🚀 Discord Habit System - Complete Startup Guide

## 📋 **Current Status Analysis**

✅ **What's Already Set Up:**
- Complete Discord bot codebase with TypeScript
- All Notion databases created and configured
- Discord channel IDs identified
- Bot commands and functionality implemented
- Test files and debugging tools ready

❌ **What's Missing:**
- Environment variables (.env file)
- Discord server permissions
- Bot token configuration
- Notion integration token

---

## 🎯 **Step-by-Step Startup Process**

### **Phase 1: Environment Setup (5 minutes)**

#### **Step 1.1: Create Environment File**
```bash
cd /home/pi/Documents/habit_System/Habit_system_discord
cp env.example .env
```

#### **Step 1.2: Get Your Discord Server ID**
1. Open Discord in your browser
2. Go to your server
3. Right-click on server name → "Copy Server ID"
4. Add this to your `.env` file as `DISCORD_GUILD_ID`

#### **Step 1.3: Get Discord Bot Token**
1. Go to https://discord.com/developers/applications/1365636340754026506
2. Go to "Bot" section
3. Copy the bot token
4. Add to `.env` as `DISCORD_BOT_TOKEN`

#### **Step 1.4: Get Notion Integration Token**
1. Go to https://www.notion.so/my-integrations
2. Find "Discord Habit System" integration
3. Copy the "Internal Integration Token"
4. Add to `.env` as `NOTION_TOKEN`

---

### **Phase 2: Discord Server Setup (10 minutes)**

#### **Step 2.1: Invite Bot to Server**
Use this URL (replace CLIENT_ID with 1365636340754026506):
```
https://discord.com/oauth2/authorize?client_id=1365636340754026506&permissions=8&integration_type=0&scope=bot
```

#### **Step 2.2: Create Required Channels**
Create these channels in your Discord server:

1. **#accountability-group-1** (ID: 1420295931689173002)
2. **#learnings-feed** (ID: 1420318536852705291) 
3. **#weekly-reviews** (ID: 1420318655165628478)
4. **#get-tools-to-help** (for habit toolbox)
5. **#personal-messages** (for private bot interactions)

#### **Step 2.3: Set Bot Permissions**
Ensure bot has these permissions:
- Send Messages
- Read Message History
- Add Reactions
- Attach Files
- Use Slash Commands
- Manage Messages (for cleanup)

---

### **Phase 3: Install Dependencies & Test (5 minutes)**

#### **Step 3.1: Install Dependencies**
```bash
cd /home/pi/Documents/habit_System/Habit_system_discord
npm install
```

#### **Step 3.2: Test Notion Connection**
```bash
node test-learning-simple.js
```

#### **Step 3.3: Test Discord Bot**
```bash
node test-bot-functionality.js
```

---

### **Phase 4: Start the System (2 minutes)**

#### **Step 4.1: Start the Bot**
```bash
npm run dev
```

#### **Step 4.2: Register Commands**
The bot will automatically register slash commands when it starts.

#### **Step 4.3: Test Commands**
In Discord, try these commands:
- `/join` - Register in the system
- `/habit add` - Create a test habit
- `/proof` - Submit a test proof
- `/summary` - Get your progress summary

---

## 🔧 **Troubleshooting Common Issues**

### **Issue 1: "Bot not responding"**
**Solution:**
- Check if bot is online in Discord
- Verify bot token in `.env`
- Check bot permissions in server

### **Issue 2: "Notion connection failed"**
**Solution:**
- Verify Notion token in `.env`
- Check if databases are shared with integration
- Run `node test-learning-simple.js` to test

### **Issue 3: "Commands not showing"**
**Solution:**
- Wait 1-2 minutes for command registration
- Try refreshing Discord
- Check if bot has proper permissions

### **Issue 4: "Channel not found"**
**Solution:**
- Verify channel IDs in `.env`
- Check if channels exist in Discord
- Use `node get-channel-id.js` to get correct IDs

---

## 📊 **System Verification Checklist**

### **Discord Setup:**
- [ ] Bot is online and responsive
- [ ] Slash commands are visible
- [ ] Bot can send messages in all channels
- [ ] Bot can react to messages

### **Notion Integration:**
- [ ] `/join` command creates user in Notion
- [ ] `/habit add` creates habit in Notion
- [ ] `/proof` creates proof in Notion
- [ ] `/learning` creates learning in Notion

### **Channel Functionality:**
- [ ] Accountability group processes messages
- [ ] Learnings feed posts insights
- [ ] Weekly reviews show summaries
- [ ] Tools channel provides habit strategies

---

## 🎯 **Ready-to-Use Commands**

Once everything is set up, users can immediately use:

### **Core Commands:**
- `/join` - Register in the habit system
- `/keystonehabit` - Create your foundation habit
- `/proof` - Submit daily evidence
- `/summary` - Track your progress
- `/learning` - Share insights
- `/hurdles` - Document obstacles

### **Advanced Features:**
- Automatic proof detection in accountability channel
- AI-powered habit matching
- 27+ habit tools in toolbox
- Weekly progress summaries
- Social accountability system

---

## 🚀 **Next Steps After Startup**

1. **Test with Real Users:**
   - Have friends join your Discord server
   - Test all commands with real data
   - Verify Notion data is being created

2. **Customize for Your Group:**
   - Adjust channel names if needed
   - Modify bot messages for your style
   - Set up your 66-day challenge start date

3. **Monitor and Optimize:**
   - Check Notion databases regularly
   - Monitor bot performance
   - Gather user feedback

---

## 📞 **Support & Debugging**

### **Debug Tools Available:**
- `debug-bot.js` - Basic message monitoring
- `debug-bot-enhanced.js` - Advanced habit matching
- `test-*.js` - Individual component testing

### **Logs to Monitor:**
- Console output shows bot status
- Notion API responses
- Discord message processing

### **Common Debug Commands:**
```bash
# Test Notion connection
node test-learning-simple.js

# Test Discord functionality  
node test-bot-functionality.js

# Monitor message processing
node debug-bot-enhanced.js
```

---

## ✅ **Success Indicators**

You'll know the system is working when:

1. **Bot responds to `/join`** → Creates user in Notion
2. **Bot responds to `/habit add`** → Creates habit in Notion  
3. **Bot responds to `/proof`** → Creates proof in Notion
4. **Messages in accountability channel** → Get automatic reactions
5. **Weekly summaries** → Appear in #weekly-reviews
6. **Learnings** → Appear in #learnings-feed

---

## 🎉 **You're Ready to Go!**

Your Discord Habit System is now a complete trust-based accountability platform with:

- ✅ **Discord Integration** - Real-time interactions
- ✅ **Notion Backend** - Structured data storage  
- ✅ **AI Analysis** - Smart proof detection
- ✅ **Social Accountability** - Group support system
- ✅ **66-Day Framework** - Proven habit formation
- ✅ **27+ Habit Tools** - Comprehensive toolbox

**Start your 66-day habit challenge today!** 🚀
