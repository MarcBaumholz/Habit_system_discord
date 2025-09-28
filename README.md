# Discord Habit System

A Discord bot for habit tracking with Notion integration, following the 66-day challenge framework.

## Features

- **Discord Commands**: `/join`, `/habit add`, `/proof`, `/summary`
- **Notion Integration**: Structured data storage for users, habits, proofs, learnings
- **66-Day Framework**: Weekly summaries, minimal dose support, cheat days
- **Social Accountability**: Trust system, group reactions, donation pool
- **Auto Proof Logging**: Messages in the accountability channel are classified via OpenRouter (DeepSeek) and stored as Notion proofs

## Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Variables
Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

Required variables:
- `DISCORD_BOT_TOKEN`: Your Discord bot token
- `DISCORD_CLIENT_ID`: Your Discord application ID
- `DISCORD_GUILD_ID`: Your Discord server ID
- `NOTION_TOKEN`: Your Notion integration token
- `NOTION_DATABASE_*`: Notion database IDs for each entity
- `DISCORD_PERSONAL_CHANNEL`: Channel ID that should host the keystone habit flow trigger
- `DISCORD_ACCOUNTABILITY_GROUP`: Channel where proofs are posted for automatic processing
- `OPENROUTER_API_KEY`: API key for proof classification via OpenRouter (DeepSeek free model by default)

### 3. Notion Setup
Create the following databases in Notion with these properties:

**Users Database:**
- Discord ID (Title)
- Name (Rich Text)
- Timezone (Rich Text)
- Best Time (Rich Text)
- Trust Count (Number)

**Habits Database:**
- Name (Title)
- User (Relation to Users)
- Domains (Multi-select)
- Frequency (Rich Text)
- Context (Rich Text)
- Difficulty (Rich Text)
- SMART Goal (Rich Text)
- Why (Rich Text)
- Minimal Dose (Rich Text)
- Habit Loop (Rich Text)
- Implementation Intentions (Rich Text)
- Hurdles (Rich Text)
- Reminder Type (Rich Text)

**Proofs Database:**
- User (Relation to Users)
- Habit (Relation to Habits)
- Date (Date)
- Unit (Rich Text)
- Note (Rich Text)
- Attachment URL (URL)
- Is Minimal Dose (Checkbox)
- Is Cheat Day (Checkbox)

**Learnings Database:**
- User (Relation to Users)
- Habit (Relation to Habits)
- Text (Rich Text)
- Created At (Date)

**Weeks Database:**
- User (Relation to Users)
- Week Num (Number)
- Start Date (Date)
- Summary (Rich Text)
- Score (Number)

**Groups Database:**
- Name (Title)
- Channel ID (Rich Text)
- Donation Pool (Number)

### 4. Run the Bot
```bash
# Development
npm run dev

# Production
npm run build
npm start
```

## Testing
```bash
npm test
```

## Commands

- `/join` - Register in the habit system
- `/habit add` - Create a new keystone habit
- `/proof` - Submit daily proof with measurement
- `/summary` - Get weekly progress summary
- `KeystoneHabit` (personal channel keyword) - Start the guided keystone habit creation flow

## Architecture

- **Discord Bot**: Handles commands and interactions
- **Notion Client**: Manages data persistence
- **TypeScript**: Type-safe development
- **Jest**: Testing framework
- **TDD**: Test-driven development approach

## What I Need From You

1. **Notion Integration Token**: Create a Notion integration and get the token
2. **Notion Database IDs**: Create the databases above and provide their IDs
3. **Discord Server Setup**: Ensure the bot has proper permissions in your server
4. **Testing**: Help test the commands once everything is set up

## Next Steps

1. Set up Notion databases with the schema above
2. Get your Notion integration token
3. Update `.env` with your values
4. Run `npm run dev` to test the bot
5. Test each command in Discord

The system is designed to be simple, test-driven, and follow the KISS principle as requested.
