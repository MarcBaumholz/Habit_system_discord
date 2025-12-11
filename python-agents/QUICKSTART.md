# Quick Start Guide: CrewAI Mid-Week Analysis Agent

## Overview

You now have a CrewAI-powered mid-week analysis agent that:
- **Runs automatically every Wednesday at 8pm**
- **Analyzes all active users' habit progress**
- **Provides personalized feedback** (motivational or supportive)
- **Evaluates group dynamics** (top performers, who needs help)
- **Posts results to your Discord accountability channel**

## Quick Setup (5 minutes)

### 1. Set Up Python Environment

```bash
cd python-agents
./setup.sh
```

### 2. Configure Environment

```bash
# Copy template
cp .env.example .env

# Edit with your credentials
nano .env  # or use your preferred editor
```

Required values (copy from your main `.env` file):
- `NOTION_TOKEN` - Your Notion integration token
- `NOTION_DATABASE_USERS` - Users database ID
- `NOTION_DATABASE_HABITS` - Habits database ID
- `NOTION_DATABASE_PROOFS` - Proofs database ID
- `PERPLEXITY_API_KEY` - Your Perplexity API key

### 3. Start the Python Service

```bash
./start-api.sh
```

You should see:
```
🚀 Starting Habit System CrewAI Agents API
Server: http://localhost:8000
```

**Keep this terminal open** - the service needs to run continuously.

### 4. Test It Works

Open a new terminal and test:

```bash
# Health check
curl http://localhost:8000/health

# Manual test run
curl -X POST http://localhost:8000/analyze/midweek
```

The health check should show:
```json
{
  "status": "healthy",
  "all_configured": true
}
```

## What Happens Automatically

Once both services are running:

1. **Every Wednesday at 8pm**, the Discord bot will:
   - Call the Python CrewAI service
   - Wait for analysis to complete (2-5 minutes)
   - Post results to your accountability channel

2. **The CrewAI agent will**:
   - Get all active users from Notion
   - Calculate mid-week progress (by Wednesday, users should have ~3/7 of their weekly goal done)
   - Generate personalized feedback for each habit
   - Identify group patterns (who's doing great, who needs support)

## Manual Testing

### Test the Agent Directly

```bash
cd python-agents
source venv/bin/activate
python midweek_agent.py
```

This runs the analysis immediately and shows you the full output.

### Test via Discord (for testing only)

Add this to your bot code temporarily to trigger manually:

```typescript
// In a test command
if (this.midWeekScheduler) {
  await this.midWeekScheduler.triggerManually();
}
```

## Example Output

The agent will generate something like:

```markdown
## Mid-Week Summary - 2025-01-25

### Group Overview
Great momentum this week! 8 out of 10 users are on track with their habits.
The group is showing strong consistency, with particularly impressive
performance in morning routines and exercise habits.

### Individual Progress

**John** (2/3 habits on track)
- **Morning Exercise** (target: 5/week, completed: 3) - Excellent start!
  You're ahead of schedule and maintaining the discipline that will help
  you become the energetic person you want to be.
- **Meditation** (target: 7/week, completed: 2) - You're a bit behind your
  daily goal. Remember, just 5 minutes counts - your "why" is to reduce
  anxiety, and consistency matters more than duration.
- **Reading** (target: 3/week, completed: 1) - On track so far! Keep it up.

**Sarah** (3/3 habits on track)
- **Journaling** (target: 7/week, completed: 4) - Crushing it! Your consistency
  is inspiring the whole group.
...

### Team Dynamics Insights
- **Top Performers**: Sarah, Mike, and Lisa are all 100% on track - amazing work!
- **Need Support**: John could use some encouragement with meditation, Alex is
  struggling with morning routines - team, let's check in!
- **Key Patterns**: Morning habits have 85% completion rate vs 60% for evening
  habits. Group might benefit from focusing on morning routines.
```

## Troubleshooting

### "CrewAI service is not available"

**Problem**: Python service isn't running

**Solution**:
```bash
cd python-agents
./start-api.sh
```

### "Missing environment variables"

**Problem**: `.env` file not configured

**Solution**:
```bash
cd python-agents
nano .env  # Add your API keys
```

### "Invalid database ID"

**Problem**: Wrong Notion database IDs in `.env`

**Solution**: Copy the correct IDs from your main project `.env` file

### Analysis takes too long

**Problem**: Large number of users or slow API

**Solution**: This is normal. Analysis can take 2-5 minutes for 10-20 users.

## Production Deployment

### Keep Python Service Running 24/7

Option 1: Use screen/tmux
```bash
screen -S crewai
cd python-agents
./start-api.sh
# Press Ctrl+A, then D to detach
```

Option 2: Use systemd service
```bash
# Create /etc/systemd/system/crewai-agents.service
sudo systemctl start crewai-agents
sudo systemctl enable crewai-agents
```

Option 3: Use Docker
```bash
docker-compose up -d python-agents
```

## Adding More Agents (Future)

The system is designed to scale. To add more agents:

1. Create new agent file (e.g., `weekly_summary_agent.py`)
2. Add configuration to `config/agents.yaml`
3. Add endpoint in `api.py`
4. Create scheduler in TypeScript if needed

Potential future agents:
- **Sunday Summary Agent** - Full week review
- **Daily Motivation Agent** - Personalized morning message
- **Habit Recommendation Agent** - Suggest new habits based on personality
- **Peer Matching Agent** - Find accountability partners

## Questions to Consider

Before I test, I have a few questions:

1. **Do you have users and habits in your Notion databases already?** (The agent needs real data to analyze)

2. **What time zone are you in?** (Default is Europe/Berlin for the 8pm schedule)

3. **Would you like to test it manually first before waiting until Wednesday?**

4. **Should the agent post to a test channel first instead of the main accountability channel?**

Let me know and I'll help you test it!
