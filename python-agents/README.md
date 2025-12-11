# Python CrewAI Agents for Habit System

This directory contains Python-based CrewAI agents that provide advanced analysis capabilities for the Habit System Discord bot.

## Setup

### 1. Install Python Dependencies

```bash
cd python-agents
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Configure Environment

```bash
cp .env.example .env
# Edit .env and add your API keys and database IDs
```

Required environment variables:
- `NOTION_TOKEN` - Your Notion integration token
- `NOTION_DATABASE_USERS` - Users database ID
- `NOTION_DATABASE_HABITS` - Habits database ID
- `NOTION_DATABASE_PROOFS` - Proofs database ID
- `PERPLEXITY_API_KEY` - Perplexity API key for LLM
- `AGENT_API_PORT` - Port for the API server (default: 8000)

### 3. Run the API Server

```bash
python api.py
```

The server will start on `http://localhost:8000` (or your configured port).

## Available Agents

### Mid-Week Team Dynamics Agent

**Purpose**: Analyzes all active users' habit progress at mid-week (Wednesday) and provides:
- Individual progress assessment for each habit
- Personalized motivational or supportive messages
- Group dynamics analysis (who's excelling, who needs support)

**Trigger**: Called automatically every Wednesday at 8pm via the TypeScript scheduler

**Endpoint**: `POST /analyze/midweek`

**Example Response**:
```json
{
  "status": "success",
  "timestamp": "2025-01-25T20:00:00",
  "analysis": "## Mid-Week Summary...",
  "metadata": {
    "day_of_week": "Wednesday",
    "agent_type": "team_dynamics_analyst"
  }
}
```

## API Endpoints

### Health Check
```bash
GET /health
```

### Run Mid-Week Analysis
```bash
POST /analyze/midweek
```

### Generic Analysis (routes to specific agents)
```bash
POST /analyze
{
  "agent_type": "midweek",
  "parameters": {}
}
```

## Testing the Agent

### Manual Test
```bash
python midweek_agent.py
```

### Test via API
```bash
# Start the server
python api.py

# In another terminal, test the endpoint
curl -X POST http://localhost:8000/analyze/midweek
```

## Architecture

- **api.py** - FastAPI REST service
- **midweek_agent.py** - Mid-week analysis agent implementation
- **tools/notion_tool.py** - Custom Notion tool for CrewAI
- **config/agents.yaml** - Agent configurations (role, goal, backstory)

## Integration with TypeScript Bot

The TypeScript bot calls this Python service via HTTP:

```typescript
const response = await axios.post('http://localhost:8000/analyze/midweek');
const analysis = response.data.analysis;
// Post analysis to Discord channel
```

## Future Agents

This architecture supports adding more agents easily:
1. Create new agent class in a separate file
2. Add configuration to `config/agents.yaml`
3. Add endpoint in `api.py`
4. Update TypeScript scheduler if needed
