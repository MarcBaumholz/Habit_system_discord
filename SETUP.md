# Discord Habit System - Complete Setup Guide

## 🚀 Quick Start

```bash
# 1. Clone the repository
git clone <your-repo-url>
cd habit_system

# 2. Install dependencies
npm install

# 3. Create environment file
cp .env.example .env

# 4. Edit environment variables
nano .env  # or your preferred editor

# 5. Build and test
npm run build
npm test

# 6. Start the bot
npm start
```

## 📋 System Requirements

### **Node.js & npm**
- Node.js >= 18.0.0
- npm >= 9.0.0

### **External Services**
- Discord Server with Bot Permissions
- Notion Workspace with Integration Access
- Perplexity API Account

## 🔧 Environment Variables Setup

### **Discord Configuration**
```bash
DISCORD_BOT_TOKEN=your_discord_bot_token
DISCORD_CLIENT_ID=your_discord_application_id
DISCORD_GUILD_ID=your_discord_server_id
```

**How to get:**
1. Go to https://discord.com/developers/applications
2. Create new application
3. Go to "Bot" tab → Copy token
4. Go to "General Information" → Copy Application ID
5. Right-click your Discord server → Copy Server ID

### **Notion Configuration**
```bash
NOTION_TOKEN=your_notion_integration_token
NOTION_DATABASE_USERS=your_users_database_id
NOTION_DATABASE_HABITS=your_habits_database_id
NOTION_DATABASE_PROOFS=your_proofs_database_id
NOTION_DATABASE_LEARNINGS=your_learnings_database_id
NOTION_DATABASE_HURDLES=your_hurdles_database_id
NOTION_DATABASE_WEEKS=your_weeks_database_id
NOTION_DATABASE_GROUPS=your_groups_database_id
```

**How to get:**
1. Go to https://www.notion.so/my-integrations
2. Create new integration → Copy token
3. Create databases in Notion with required properties
4. Share databases with your integration
5. Copy database IDs from Notion URLs

### **Discord Channels**
```bash
DISCORD_PERSONAL_CHANNEL=your_personal_channel_id
DISCORD_ACCOUNTABILITY_GROUP=your_accountability_channel_id
DISCORD_TOOLS=your_tools_channel_id
DISCORD_INFO_CHANNEL=your_info_channel_id
```

**How to get:**
1. Right-click each Discord channel
2. Select "Copy Channel ID"
3. Add to your .env file

### **AI Configuration**
```bash
PERPLEXITY_API_KEY=your_perplexity_api_key
```

**How to get:**
1. Go to https://www.perplexity.ai/settings/api
2. Generate API key
3. Add to your .env file

## 🏗️ Notion Database Setup

### **1. Users Database**
Create with these properties:
- **Discord ID** (Title)
- **Name** (Rich Text)
- **Timezone** (Rich Text)
- **Best Time** (Rich Text)
- **Trust Count** (Number)
- **Personal Channel ID** (Rich Text)

### **2. Habits Database**
Create with these properties:
- **Name** (Title)
- **User** (Relation to Users)
- **Domains** (Multi-select)
- **Frequency** (Number)
- **Context** (Rich Text)
- **Difficulty** (Rich Text)
- **SMART Goal** (Rich Text)
- **Why** (Rich Text)
- **Minimal Dose** (Rich Text)
- **Habit Loop** (Rich Text)
- **Implementation Intentions** (Rich Text)
- **Hurdles** (Rich Text)
- **Reminder Type** (Rich Text)

### **3. Proofs Database**
Create with these properties:
- **Title** (Title)
- **User** (Relation to Users)
- **Habit** (Relation to Habits)
- **Date** (Date)
- **Unit** (Rich Text)
- **Note** (Rich Text)
- **Proof** (Files & media)
- **Is Minimal Dose** (Checkbox)
- **Is Cheat Day** (Checkbox)

### **4. Learnings Database**
Create with these properties:
- **Discord ID** (Title)
- **User** (Relation to Users)
- **Habit** (Relation to Habits)
- **Text** (Rich Text)
- **Created At** (Date)

### **5. Hurdles Database**
Create with these properties:
- **Name** (Title)
- **User** (Relation to Users)
- **Habit** (Relation to Habits)
- **Hurdle Type** (Select: Time Management, Motivation, Environment, Social, Health, Resources, Knowledge, Habit Stacking, Perfectionism, Other)
- **Description** (Rich Text)
- **Date** (Date)

### **6. Weeks Database**
Create with these properties:
- **Discord ID** (Title)
- **User** (Relation to Users)
- **Week Num** (Number)
- **Start Date** (Date)
- **Summary** (Rich Text)
- **Score** (Number)

### **7. Groups Database**
Create with these properties:
- **Name** (Title)
- **Channel ID** (Rich Text)
- **Donation Pool** (Number)

## 🤖 Discord Bot Permissions

Your bot needs these permissions:
- ✅ Send Messages
- ✅ Use Slash Commands
- ✅ Manage Channels
- ✅ Read Message History
- ✅ Add Reactions
- ✅ Embed Links
- ✅ Attach Files

## 🧪 Testing

```bash
# Run all tests
npm test

# Run specific test
npm test -- tests/bot.test.ts

# Run tests with coverage
npm test -- --coverage
```

## 🚀 Deployment

### **Local Development**
```bash
npm start
```

### **Production Deployment**
```bash
# Build for production
npm run build

# Start with PM2 (recommended)
npm install -g pm2
pm2 start dist/index.js --name "habit-bot"
pm2 save
pm2 startup
```

## 📊 Features Included

- ✅ **Personal Discord Channels** - Auto-created for each user
- ✅ **Slash Commands** - `/join`, `/habit add`, `/proof`, `/summary`, `/learning`, `/hurdles`, `/keystonehabit`
- ✅ **AI Proof Classification** - Perplexity API integration
- ✅ **Notion Integration** - Full CRUD operations
- ✅ **Info Logging** - Public notifications for user activity
- ✅ **Daily Scheduling** - Automated motivational messages
- ✅ **Comprehensive Testing** - 46 tests covering all functionality

## 🆘 Troubleshooting

### **Common Issues:**

1. **"Missing required environment variable"**
   - Check your `.env` file has all required variables
   - Ensure no typos in variable names

2. **"Discord channel not found"**
   - Verify channel IDs are correct
   - Ensure bot has access to channels

3. **"Notion API error"**
   - Check your Notion token is valid
   - Ensure databases are shared with your integration
   - Verify database properties match requirements

4. **"Bot not responding to commands"**
   - Check bot permissions in Discord
   - Ensure slash commands are registered
   - Verify bot is online

### **Getting Help:**
- Check the logs for error messages
- Run `npm test` to verify setup
- Ensure all environment variables are set correctly

## 🎉 Success Indicators

When everything is working, you'll see:
```
✅ Bot is ready!
✅ Logged in as: YourBot#1234
✅ Slash commands registered
✅ Daily scheduler started
```

Your Discord Habit System is now ready to help users build lasting habits! 🚀
