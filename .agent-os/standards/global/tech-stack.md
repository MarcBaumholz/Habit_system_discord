# Technology Stack Standards

## Default Tech Stack

This file defines the default technology choices for the Discord Habit System. When planning new features or making technology decisions, refer to this document.

## Core Stack

### Runtime & Language
- **Node.js**: JavaScript runtime
- **TypeScript**: Type-safe development
- **Target**: ES2020
- **Module**: CommonJS

### Discord Integration
- **discord.js v14**: Discord API client
- **Slash Commands**: Primary interaction method
- **Message Handling**: For accountability channel processing

### Data Storage
- **Notion API**: Primary data storage
  - Structured databases for all entities
  - Rich text, relations, and properties
  - Version history and collaboration

### AI & LLM
- **Perplexity Sonar**: Primary LLM
  - Cost-effective
  - High-quality responses
  - Used for agents and proof classification

### Process Management
- **PM2**: Production process manager
  - Auto-restart
  - Log management
  - Monitoring

### Scheduling
- **node-cron**: Task scheduling
  - Daily messages
  - Weekly summaries
  - Reminders

## Development Tools

- **TypeScript**: Compiler and type checking
- **Jest**: Testing framework
- **dotenv**: Environment management

## Architecture Patterns

- **Multi-Agent System**: Orchestrator pattern
- **Dependency Injection**: Constructor-based
- **Error Handling**: Explicit error handling, no mocks
- **Type Safety**: Strict TypeScript

## When to Use This Stack

- All new features should use this stack
- When choosing between alternatives, prefer stack components
- Document any deviations with rationale

## Future Considerations

- Neo4j for graph relationships (planned)
- Pydantic AI framework (potential migration)
- Docker containerization (optional)

