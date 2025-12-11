# TypeScript Backend Standards

## Type Definitions

- Define interfaces for all data structures
- Use strict typing - avoid `any`
- Create shared types in `src/types/`
- Use type unions for enums or fixed sets of values

```typescript
// ✅ Good
interface User {
  id: string;
  discordId: string;
  name: string;
  timezone?: string;
  trustCount: number;
}

type HabitDifficulty = 'easy' | 'medium' | 'hard';
type ReminderType = 'daily' | 'weekly' | 'custom';

interface Habit {
  id: string;
  name: string;
  userId: string;
  difficulty: HabitDifficulty;
  reminderType: ReminderType;
  createdAt: Date;
}

// ❌ Bad
interface User {
  id: any;
  discordId: string;
  name: string;
  data: any;
}
```

## Classes and Interfaces

- Use interfaces for data structures
- Use classes for behavior and state management
- Implement interfaces explicitly when needed
- Keep classes focused and cohesive

```typescript
// ✅ Good
interface NotionClientConfig {
  token: string;
  databases: {
    users: string;
    habits: string;
    proofs: string;
  };
}

class NotionClient {
  private config: NotionClientConfig;
  
  constructor(config: NotionClientConfig) {
    this.config = config;
  }
  
  async getUserById(id: string): Promise<User | null> {
    // Implementation
  }
}

// ❌ Bad
class NotionClient {
  constructor(public token: string, public dbs: any) {
    // Implementation
  }
}
```

## Async Operations

- Always use async/await for asynchronous operations
- Return Promise types explicitly
- Handle errors with try/catch
- Use Promise.all for parallel operations

```typescript
// ✅ Good
async function getHabitsForUser(userId: string): Promise<Habit[]> {
  try {
    const habits = await notion.getHabits(userId);
    return habits;
  } catch (error) {
    console.error(`Failed to get habits for user ${userId}:`, error);
    throw error;
  }
}

async function processMultipleUsers(userIds: string[]): Promise<void> {
  const promises = userIds.map(id => processUser(id));
  await Promise.all(promises);
}

// ❌ Bad
function getHabitsForUser(userId: string) {
  return notion.getHabits(userId).then(habits => habits);
}
```

## Error Handling

- Always handle errors explicitly
- Create custom error classes for domain-specific errors
- Provide meaningful error messages
- Never use mock data as fallback

```typescript
// ✅ Good
class NotionError extends Error {
  constructor(message: string, public statusCode?: number) {
    super(message);
    this.name = 'NotionError';
  }
}

async function createHabit(data: HabitInput): Promise<Habit> {
  try {
    const habit = await notion.createHabit(data);
    return habit;
  } catch (error) {
    if (error.statusCode === 404) {
      throw new NotionError('Notion database not found', 404);
    }
    throw new NotionError(`Failed to create habit: ${error.message}`);
  }
}

// ❌ Bad
async function createHabit(data: HabitInput): Promise<Habit> {
  try {
    return await notion.createHabit(data);
  } catch (error) {
    return { id: 'mock-id', name: data.name };
  }
}
```

## Module Exports

- Use named exports for multiple exports
- Use default exports sparingly (only for main class/function)
- Export types and interfaces
- Keep exports focused and minimal

```typescript
// ✅ Good
export class NotionClient {
  // Implementation
}

export interface NotionClientConfig {
  token: string;
  databases: Record<string, string>;
}

export type HabitInput = {
  name: string;
  userId: string;
};

// ❌ Bad
export default {
  NotionClient,
  NotionClientConfig,
  HabitInput,
};
```

## Dependency Injection

- Pass dependencies as constructor parameters
- Use interfaces for dependencies when possible
- Avoid global state
- Make dependencies explicit

```typescript
// ✅ Good
class AccountabilityAgent {
  constructor(
    private notion: NotionClient,
    private aiClient: PerplexityClient,
    private logger: Logger
  ) {}
  
  async processRequest(request: AgentRequest): Promise<AgentResponse> {
    // Implementation using this.notion, this.aiClient, this.logger
  }
}

// ❌ Bad
class AccountabilityAgent {
  async processRequest(request: AgentRequest): Promise<AgentResponse> {
    const notion = new NotionClient();
    const aiClient = new PerplexityClient();
    // Implementation
  }
}
```

## Configuration

- Load configuration from environment variables
- Validate configuration at startup
- Use TypeScript types for configuration
- Never hardcode configuration values

```typescript
// ✅ Good
interface BotConfig {
  token: string;
  clientId: string;
  guildId: string;
  channels: {
    personal: string;
    accountability: string;
    info: string;
  };
}

function loadConfig(): BotConfig {
  const config: BotConfig = {
    token: process.env.DISCORD_BOT_TOKEN!,
    clientId: process.env.DISCORD_CLIENT_ID!,
    guildId: process.env.DISCORD_GUILD_ID!,
    channels: {
      personal: process.env.DISCORD_PERSONAL_CHANNEL!,
      accountability: process.env.DISCORD_ACCOUNTABILITY_GROUP!,
      info: process.env.DISCORD_INFO_CHANNEL!,
    },
  };
  
  // Validate
  if (!config.token || !config.clientId || !config.guildId) {
    throw new Error('Missing required Discord configuration');
  }
  
  return config;
}

// ❌ Bad
const config = {
  token: process.env.DISCORD_BOT_TOKEN || 'default-token',
  clientId: '123456789',
};
```

