# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Discord Habit System is a Discord bot for habit tracking with Notion integration, following the 66-day challenge framework. The system combines automated proof logging, AI-driven message analysis, multi-agent coordination, and personal assistant features to help users build and maintain keystone habits.

**Key Technologies:**
- TypeScript (strict mode)
- Discord.js v14
- Notion API (@notionhq/client)
- Perplexity AI (Sonar model) for message classification
- Jest for testing
- Docker for deployment

## Development Commands

### Build and Run
```bash
# Development mode with hot reload
npm run dev

# Build TypeScript
npm run build

# Production mode
npm start
```

### Testing
```bash
# Run all tests
npm test

# Watch mode for TDD
npm run test:watch
```

### Docker Deployment
```bash
# Build Docker image
npm run docker:build

# Start container
npm run docker:start

# Stop container
npm run docker:stop

# Restart container
npm run docker:restart

# View logs
npm run docker:logs

# Full deployment
npm run docker:deploy

# Update and redeploy
npm run docker:update
```

### Helpful Scripts
```bash
# Deploy changes (git add, commit, build, restart)
./deploy.sh

# Docker control scripts
./docker-commands.sh start|stop|restart|logs

# Update and deploy
./update-and-deploy.sh
```

## Architecture

### Core Components

**1. Bot Layer (`src/bot/`):**
- `bot.ts` - Main HabitBot class that orchestrates all subsystems
- `commands.ts` - CommandHandler for slash commands (`/join`, `/proof`, `/summary`, etc.)
- `channel-handlers.ts` - Manages channel-specific message routing
- `habit-flow.ts` - Guided habit creation flow in personal channels
- `proof-processor.ts` - Processes proof submissions and validates minimal dose logic
- `message-analyzer.ts` - AI-powered message classification (uses Perplexity Sonar)
- `personal-channel-manager.ts` - Creates and manages per-user private channels
- `personal-assistant.ts` - Personal AI assistant for user questions
- `tools-assistant.ts` - Matches user requests to available tools
- `daily-message-scheduler.ts` - Sends scheduled messages using node-cron
- `weekly-agent-scheduler.ts` - Triggers weekly summaries via multi-agent system
- `ai-incentive-manager.ts` - Gamification and incentive tracking
- `discord-logger.ts` - Centralized logging to Discord info channel
- `webhook-poller.ts` - Polls for new messages in accountability channel

**2. Notion Integration (`src/notion/`):**
- `client.ts` - NotionClient wrapper for all database operations
- Manages 8 databases: Users, Habits, Proofs, Learnings, Hurdles, Weeks, Groups, Personality

**3. Multi-Agent System (`src/agents/`):**
The system uses a Pydantic AI-inspired architecture with specialized agents:

- `orchestrator/orchestrator.ts` - Routes requests to appropriate agents
- `mentor/mentor_agent.ts` - Provides habit guidance and mentorship
- `identity/identity_agent.ts` - Analyzes personality and habit alignment
- `accountability/accountability_agent.ts` - Manages check-ins and interventions
- `group/group_agent.ts` - Analyzes group dynamics and compatibility
- `learning/learning_agent.ts` - Identifies patterns and learning insights
- `base/agent.ts` - BaseAgent abstract class all agents inherit from
- `base/types.ts` - Type definitions for agent system

**4. AI Integration (`src/ai/`):**
- `perplexity-client.ts` - Perplexity API client for message classification

**5. Toolbox System (`src/toolbox/`):**
- `tools.ts` - Tool definitions for semantic matching
- `tools-enhanced.ts` - Enhanced tool capabilities
- `index.ts` - Toolbox exports

**6. Types (`src/types/`):**
- `index.ts` - All TypeScript interfaces (User, Habit, Proof, Learning, etc.)

### Data Flow

1. **User Joins**: `/join` → creates User in Notion → creates personal channel → sends personality questionnaire
2. **Habit Creation**: "KeystoneHabit" in personal channel → guided flow via `habit-flow.ts` → creates Habit in Notion
3. **Proof Submission**:
   - Manual: `/proof` command → proof-processor validates minimal dose → saves to Notion
   - Automatic: Message in accountability channel → webhook-poller → message-analyzer classifies → proof-processor saves
4. **Weekly Summary**: Cron job → weekly-agent-scheduler → orchestrator coordinates agents → generates summary → posts to user channel
5. **Agent Coordination**: Personal channel message → orchestrator → routes to appropriate agent(s) → aggregates responses

### Key Design Patterns

**Multi-Agent Coordination:**
- Orchestrator uses AgentRegistry (singleton) to manage agent lifecycle
- Agents inherit from BaseAgent with common capabilities: logging, validation, response formatting
- Type-safe agent communication using Pydantic AI principles (see `src/agents/base/types.ts`)

**Notion Schema Mapping:**
- Field names in Notion use exact casing (e.g., "DiscordID", "Trust Count")
- Relations use `{ relation: [{ id: ... }] }` format
- Multi-select uses `{ multi_select: [{ name: ... }] }` format

**Message Classification:**
- Uses Perplexity Sonar model for semantic analysis
- Classifies messages as: proof, question, learning, hurdle, general
- Extracts habit context and relevant metadata

**Proof Validation:**
- Minimal dose logic checks if proof meets minimum requirement
- Supports cheat days (marked separately in Notion)
- Automatic proof detection from accountability channel messages

## Important Field Names in Notion

When working with Notion databases, use these exact field names:

**Users DB:**
- `DiscordID` (rich_text, NOT title)
- `Name` (rich_text)
- `Personal Channel ID` (rich_text)
- `Trust Count` (number)
- `Status` (select: active/pause)

**Habits DB:**
- `Name` (title)
- `User` (relation to Users)
- `SMART Goal ` (note trailing space!)
- `Minimal Dose` (rich_text)

**Proofs DB:**
- `User` (relation to Users)
- `Habit` (relation to Habits)
- `Is Minimal Dose` (checkbox)
- `Is Cheat Day` (checkbox)

**Personality DB:**
- `DiscordID` (rich_text)
- `User` (relation to Users)
- Core values, life vision, personality type fields

## Testing Guidelines

- Tests located in `tests/` directory
- Use Jest with `ts-jest` preset
- Test files must match `**/*.test.ts` pattern
- Mock Notion and Discord APIs for unit tests
- Integration tests available: `test-join-command.js`, `test-automatic-proofing.js`, etc.

## Environment Variables

Required `.env` variables (see `src/index.ts` for validation):

```
DISCORD_BOT_TOKEN
DISCORD_CLIENT_ID
DISCORD_GUILD_ID
NOTION_TOKEN
NOTION_DATABASE_USERS
NOTION_DATABASE_HABITS
NOTION_DATABASE_PROOFS
NOTION_DATABASE_LEARNINGS
NOTION_DATABASE_HURDLES
NOTION_DATABASE_WEEKS
NOTION_DATABASE_GROUPS
NOTION_DATABASE_PERSONALITY
DISCORD_PERSONAL_CHANNEL
DISCORD_ACCOUNTABILITY_GROUP
DISCORD_TOOLS
DISCORD_INFO_CHANNEL
PERPLEXITY_API_KEY
```

## Development Workflow (from .cursor/rules)

The project follows a structured development workflow:

1. **Plan First**: Create detailed plan before coding, break into smallest clear steps
2. **Save Plan**: Document plans in MD files explaining what and why
3. **Minimal Code**: Write only necessary code, less is better
4. **Test After Each Step**: Always test small implementations immediately
5. **Consult Documentation**: Reference implementation docs, project structure, and UI/UX specs before making changes
6. **Bug Tracking**: Check for similar issues before fixing, document all errors and solutions

## Common Pitfalls

**Notion Field Names:**
- Always use exact casing as defined in Notion database schema
- `DiscordID` is rich_text, not title (title field varies by database)
- `SMART Goal ` has a trailing space in the field name

**Agent System:**
- Orchestrator only processes requests from designated personal channel (hardcoded channel ID check)
- Agents must be initialized before use via AgentRegistry
- Always validate UserContext before processing requests

**Proof Detection:**
- Webhook poller polls every 10 seconds for new messages
- Message analyzer uses AI classification (can have false positives)
- Minimal dose logic requires comparing proof unit to habit's minimal dose string

**Discord Permissions:**
- Bot needs GatewayIntentBits: Guilds, GuildMessages, MessageContent, GuildWebhooks
- Personal channels are created dynamically with specific permissions

## Key Files to Reference

- `src/index.ts` - Entry point, environment validation
- `src/bot/bot.ts` - Main bot orchestration, event setup
- `src/notion/client.ts` - All Notion database operations
- `src/agents/orchestrator/orchestrator.ts` - Agent routing logic
- `src/types/index.ts` - TypeScript type definitions
- `README.md` - Setup instructions and feature overview
- `.cursor/rules/codingurle.mdc` - Development workflow rules

## Docker Notes

- Dockerfile uses multi-stage build for optimization
- Container runs `npm start` (production mode)
- Logs are accessible via `docker logs` or `npm run docker:logs`
- `.dockerignore` excludes node_modules, dist, tests, and documentation
- `docker-compose.yml` available for orchestration
