# Discord Habit System - Technology Stack

## Core Technologies

### Runtime & Language
- **Node.js**: JavaScript runtime environment
- **TypeScript**: Type-safe development with strict mode enabled
- **Target**: ES2020
- **Module System**: CommonJS

### Discord Integration
- **discord.js v14**: Discord API client library
  - Slash commands
  - Message handling
  - Channel management
  - User interactions

### Data Storage
- **Notion API**: Primary data storage and structured workflows
  - Users database
  - Habits database
  - Proofs database
  - Learnings database
  - Hurdles database
  - Weeks database
  - Groups database
  - Personality database
  - Price Pool database
  - Challenge Proofs database

### AI & LLM
- **Perplexity Sonar**: Primary LLM for all agents
  - Cost-effective, high-quality responses
  - Used for proof classification
  - Agent reasoning and analysis
- **OpenRouter/DeepSeek**: Alternative LLM for specific tasks (proof classification)

### Process Management
- **PM2**: Process manager for production deployment
  - Auto-restart on failure
  - Log management
  - Process monitoring

### Scheduling
- **node-cron**: Task scheduling for:
  - Daily messages
  - Weekly agent summaries
  - Challenge reminders
  - Accountability reports

### Development Tools
- **TypeScript Compiler**: Type checking and compilation
- **Jest**: Testing framework
- **dotenv**: Environment variable management

## Architecture Patterns

### Multi-Agent System
- **Orchestrator Pattern**: Central agent routes requests to specialized agents
- **Agent Specialization**: Each agent has a specific responsibility
  - Mentor Agent: Personalized coaching
  - Identity Agent: Personality-based recommendations
  - Accountability Agent: Motivation and reminders
  - Group Agent: Social dynamics
  - Learning Agent: Knowledge extraction

### Data Flow
```
Discord Message → Orchestrator → Route to Agent(s) → Notion Query → Response → Discord
```

### Error Handling
- Comprehensive error handling at all layers
- Logging system for debugging and monitoring
- Graceful degradation when services are unavailable

## Code Organization

### Directory Structure
```
src/
├── agents/              # Multi-agent system
│   ├── orchestrator/   # Request routing
│   ├── mentor/         # Coaching agent
│   ├── identity/       # Personality matching
│   ├── accountability/ # Motivation agent
│   ├── group/          # Social dynamics
│   └── learning/       # Knowledge extraction
├── bot/                # Discord bot logic
│   ├── commands.ts     # Slash command handlers
│   ├── bot.ts          # Bot initialization
│   └── ...             # Feature modules
├── notion/             # Notion API client
├── ai/                 # AI/LLM clients
└── types/              # TypeScript type definitions
```

## Design Principles

1. **Single Responsibility**: Each module/agent has one clear purpose
2. **KISS (Keep It Simple)**: Avoid over-engineering
3. **Test-Driven Development**: Write tests first
4. **Clean Code**: Readable, maintainable code
5. **No Mock Data**: Real error handling, no fallbacks
6. **Type Safety**: Leverage TypeScript for compile-time safety

## External Dependencies

### APIs
- Discord API (via discord.js)
- Notion API (via @notionhq/client)
- Perplexity API (via axios)
- OpenRouter API (via axios)

### Environment Variables
- Discord credentials (token, client ID, guild ID)
- Notion credentials (token, database IDs)
- Channel IDs (personal, accountability, info, tools, weekly challenges)
- API keys (Perplexity, OpenRouter)

## Deployment

- **Production**: PM2 process manager
- **Build**: TypeScript compilation to `dist/`
- **Entry Point**: `dist/index.js`
- **Logs**: Stored in `logs/` directory

## Future Considerations

- Neo4j integration for graph relationships (planned)
- Pydantic AI framework migration (potential)
- Docker containerization (optional, currently using PM2)

