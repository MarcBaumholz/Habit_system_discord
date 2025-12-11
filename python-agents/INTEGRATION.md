# CrewAI Agent Integration Guide

This guide explains how the Python CrewAI agents integrate with the TypeScript Discord bot.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Discord Bot (TypeScript)                   │
│  ┌────────────────────────────────────────────────────────┐  │
│  │             MidWeekScheduler (src/bot/)                │  │
│  │  - Runs every Wednesday at 8pm                         │  │
│  │  - Triggers via cron job                               │  │
│  └────────────────┬───────────────────────────────────────┘  │
│                   │                                           │
│                   │ HTTP POST /analyze/midweek               │
│                   ▼                                           │
│  ┌────────────────────────────────────────────────────────┐  │
│  │         CrewAIClient (src/agents/crewai-client.ts)     │  │
│  │  - Makes HTTP requests to Python service               │  │
│  │  - Handles responses and errors                        │  │
│  └────────────────┬───────────────────────────────────────┘  │
└───────────────────┼───────────────────────────────────────────┘
                    │
                    │ HTTP
                    │
┌───────────────────▼───────────────────────────────────────────┐
│               Python FastAPI Service (port 8000)              │
│  ┌────────────────────────────────────────────────────────┐  │
│  │                  api.py (FastAPI)                      │  │
│  │  - Receives HTTP requests                              │  │
│  │  - Routes to appropriate agents                        │  │
│  └────────────────┬───────────────────────────────────────┘  │
│                   │                                           │
│                   ▼                                           │
│  ┌────────────────────────────────────────────────────────┐  │
│  │          MidWeekAnalysisAgent (midweek_agent.py)       │  │
│  │  - CrewAI agent with Team Dynamics role                │  │
│  │  - Uses Perplexity LLM (Sonar model)                   │  │
│  │  - Accesses Notion via custom tool                     │  │
│  └────────────────┬───────────────────────────────────────┘  │
│                   │                                           │
│                   ▼                                           │
│  ┌────────────────────────────────────────────────────────┐  │
│  │        NotionHabitTool (tools/notion_tool.py)          │  │
│  │  - Custom CrewAI tool                                  │  │
│  │  - Queries Notion databases                            │  │
│  │  - Calculates progress metrics                         │  │
│  └────────────────┬───────────────────────────────────────┘  │
└───────────────────┼───────────────────────────────────────────┘
                    │
                    ▼
              Notion API
```

## Setup Steps

### 1. Python Environment Setup

```bash
cd python-agents
./setup.sh
```

This will:
- Create a Python virtual environment
- Install all required dependencies (CrewAI, FastAPI, Notion client, etc.)

### 2. Environment Configuration

Copy the environment template:
```bash
cp .env.example .env
```

Edit `.env` and add your credentials:
```env
# Notion API
NOTION_TOKEN=your_notion_integration_token
NOTION_DATABASE_USERS=your_users_database_id
NOTION_DATABASE_HABITS=your_habits_database_id
NOTION_DATABASE_PROOFS=your_proofs_database_id

# Perplexity API for LLM
PERPLEXITY_API_KEY=your_perplexity_api_key

# API Server Port (optional)
AGENT_API_PORT=8000
```

### 3. Start the Python API Service

```bash
cd python-agents
./start-api.sh
```

Or manually:
```bash
cd python-agents
source venv/bin/activate
python api.py
```

The service will start on `http://localhost:8000`

### 4. Configure TypeScript Bot

Add to your main `.env` file (in the project root):
```env
CREWAI_API_URL=http://localhost:8000
```

### 5. Start the TypeScript Bot

```bash
npm run dev  # Development mode
# or
npm start    # Production mode
```

The bot will automatically:
- Initialize the MidWeekScheduler
- Connect to the Python CrewAI service
- Schedule mid-week analysis for every Wednesday at 8pm

## Testing the Integration

### Test the Python Service Directly

```bash
cd python-agents
source venv/bin/activate
python midweek_agent.py
```

### Test via HTTP API

```bash
# Check health
curl http://localhost:8000/health

# Trigger mid-week analysis
curl -X POST http://localhost:8000/analyze/midweek
```

### Test via Discord Bot

You can manually trigger the analysis (for testing) by adding a test command or directly calling:

```typescript
// In your bot code
if (this.midWeekScheduler) {
  await this.midWeekScheduler.triggerManually();
}
```

## How It Works

### Weekly Cycle

1. **Wednesday 8pm (20:00)** - Cron trigger fires
2. **TypeScript Scheduler** - MidWeekScheduler wakes up
3. **HTTP Request** - CrewAIClient calls Python service
4. **Agent Execution** - Python CrewAI agent:
   - Fetches all active users from Notion
   - Gets their habits and weekly targets
   - Retrieves proofs submitted so far this week
   - Analyzes progress (actual vs expected by mid-week)
   - Uses Perplexity LLM to generate personalized feedback
5. **Response Processing** - TypeScript receives analysis
6. **Discord Posting** - Results posted to accountability channel

### Mid-Week Analysis Logic

The agent calculates expected progress based on:
- **Target**: User's weekly frequency goal (e.g., 5 times per week)
- **Current Day**: Wednesday = day 3 of 7
- **Expected by Wednesday**: `(target × 3) / 7`

Example:
- User wants to exercise 5 times/week
- By Wednesday, expected: `(5 × 3) / 7 = 2.14 ≈ 2 times`
- If user has 3 proofs → **On track** ✅
- If user has 1 proof → **Behind** ⚠️

## Error Handling

### Python Service Unavailable

If the Python service is not running when the scheduler triggers:

```
❌ CrewAI service is not available
```

The bot will:
1. Log the error to the Discord info channel
2. Provide instructions to start the service
3. Continue running (other features unaffected)

### Analysis Timeout

The TypeScript client has a 5-minute timeout for analysis requests. If exceeded:

```
❌ Mid-week analysis failed: timeout of 300000ms exceeded
```

Solutions:
- Check Python service logs for errors
- Verify Notion API connectivity
- Ensure Perplexity API key is valid

### Notion API Errors

If Notion queries fail:

```
{"error": "Failed to query Notion: Invalid database ID"}
```

Verify:
- Database IDs are correct in `.env`
- Notion integration has access to the databases
- Database schemas match expected field names

## Monitoring

### Python Service Logs

```bash
# Real-time logs
cd python-agents
source venv/bin/activate
python api.py

# Logs will show:
# - Incoming requests
# - Agent execution progress
# - Notion queries
# - LLM interactions
```

### Discord Bot Logs

Check the Discord info channel for:
- Scheduler start confirmations
- Analysis success/failure notifications
- Detailed error messages

### Health Checks

```bash
# Check Python service health
curl http://localhost:8000/health

# Response shows:
# - Environment variable configuration
# - Missing variables (if any)
# - Available agents
```

## Production Deployment

### Option 1: Separate Servers

Run Python service on separate server:

1. Deploy Python service to port 8000
2. Update `CREWAI_API_URL` in TypeScript bot's `.env`
3. Ensure network connectivity between services

### Option 2: Same Server

Run both services on the same server:

1. Start Python service: `./start-api.sh` (runs in background)
2. Start TypeScript bot: `npm start`
3. Use process managers (PM2, systemd) to keep both running

Example with PM2:
```bash
# Python service
pm2 start python-agents/api.py --name crewai-agents --interpreter python3

# TypeScript bot
pm2 start npm --name habit-bot -- start
```

### Docker Deployment

Create a multi-container setup:

```yaml
# docker-compose.yml
version: '3.8'

services:
  python-agents:
    build: ./python-agents
    ports:
      - "8000:8000"
    env_file:
      - ./python-agents/.env

  discord-bot:
    build: .
    depends_on:
      - python-agents
    environment:
      - CREWAI_API_URL=http://python-agents:8000
    env_file:
      - .env
```

## Troubleshooting

### Issue: "CrewAI service unavailable"

**Solution**: Ensure Python service is running
```bash
cd python-agents
./start-api.sh
```

### Issue: "Missing environment variables"

**Solution**: Check `.env` configuration
```bash
curl http://localhost:8000/health
# Look at "missing_variables" in response
```

### Issue: Analysis not running on Wednesday

**Solution**: Verify timezone configuration
- Check `TIMEZONE` in main `.env`
- Scheduler uses `Europe/Berlin` by default
- Verify cron expression: `0 20 * * 3` (Wed 8pm)

### Issue: LLM responses are poor

**Solution**:
- Verify `PERPLEXITY_API_KEY` is valid
- Check Perplexity API quota/limits
- Review agent configuration in `config/agents.yaml`
- Adjust LLM temperature (default: 0.7)

## Future Extensions

This architecture supports adding more agents easily:

1. Create new agent class (e.g., `end_of_week_agent.py`)
2. Add configuration to `config/agents.yaml`
3. Add endpoint in `api.py`
4. Create TypeScript scheduler if needed
5. Update integration documentation

Example agents to add:
- **End-of-Week Summary Agent** - Sunday evening full week review
- **Motivation Agent** - Daily personalized motivation
- **Peer Matching Agent** - Match users for accountability partnerships
- **Insight Extraction Agent** - Learn from user learnings and hurdles
