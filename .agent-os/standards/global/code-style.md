# Code Style Standards

## TypeScript Configuration

- Use strict mode: `"strict": true`
- Target ES2020
- Use CommonJS modules
- Enable `esModuleInterop` and `skipLibCheck`

## Formatting

- Use 2 spaces for indentation
- Use single quotes for strings (unless interpolation requires double quotes)
- Always use semicolons
- Maximum line length: 100 characters (soft limit)
- Trailing commas in multi-line objects and arrays

```typescript
// ✅ Good
const config = {
  token: process.env.DISCORD_BOT_TOKEN,
  clientId: process.env.DISCORD_CLIENT_ID,
  guildId: process.env.DISCORD_GUILD_ID,
};

// ❌ Bad
const config = {token: process.env.DISCORD_BOT_TOKEN, clientId: process.env.DISCORD_CLIENT_ID}
```

## Imports

- Group imports: external packages first, then internal modules
- Use absolute imports when possible
- Sort imports alphabetically within groups

```typescript
// ✅ Good
import dotenv from 'dotenv';
import { Client, GatewayIntentBits } from 'discord.js';

import { HabitBot } from './bot/bot';
import { NotionClient } from './notion/client';
import { Orchestrator } from './agents/orchestrator/orchestrator';
```

## Functions

- Keep functions small and focused (single responsibility)
- Prefer pure functions when possible
- Use async/await instead of promises chains
- Always handle errors appropriately

```typescript
// ✅ Good
async function getUserHabits(userId: string): Promise<Habit[]> {
  try {
    const habits = await notion.getHabits(userId);
    return habits;
  } catch (error) {
    console.error(`Failed to get habits for user ${userId}:`, error);
    throw error;
  }
}

// ❌ Bad
function getUserHabits(userId: string) {
  return notion.getHabits(userId).then(habits => habits).catch(err => console.log(err));
}
```

## Error Handling

- Always handle errors explicitly
- Provide meaningful error messages
- Log errors with context
- Never use mock data or fallbacks - throw proper errors

```typescript
// ✅ Good
if (!process.env.DISCORD_BOT_TOKEN) {
  throw new Error('Missing required environment variable: DISCORD_BOT_TOKEN');
}

try {
  await processProof(proof);
} catch (error) {
  console.error('Failed to process proof:', error);
  throw new Error(`Proof processing failed: ${error.message}`);
}

// ❌ Bad
const token = process.env.DISCORD_BOT_TOKEN || 'mock-token';
try {
  await processProof(proof);
} catch (error) {
  // Silent failure
}
```

## Comments

- Write self-documenting code instead of comments when possible
- Use comments to explain "why", not "what"
- Document complex algorithms or business logic
- Keep comments up-to-date with code changes

```typescript
// ✅ Good
// Calculate streak using 66-day challenge rules: consecutive days with proof,
// allowing one cheat day per week without breaking the streak
function calculateStreak(proofs: Proof[]): number {
  // Implementation
}

// ❌ Bad
// Get user
function getUser(id: string) {
  // Return user
  return user;
}
```

