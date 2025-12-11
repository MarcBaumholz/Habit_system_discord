# Best Practices

## Core Principles

1. **KISS (Keep It Simple, Stupid)**: Prefer simple solutions over complex ones
2. **Single Responsibility**: Each function, class, and module should have one clear purpose
3. **DRY (Don't Repeat Yourself)**: Extract common patterns into reusable functions
4. **Test-Driven Development**: Write tests first, then implement
5. **Clean Code**: Code should be readable and maintainable
6. **No Mock Data**: Always handle errors properly, never use mock fallbacks

## Architecture

### Module Organization
- Group related functionality together
- Keep modules focused and cohesive
- Use clear directory structure: `agents/`, `bot/`, `notion/`, `ai/`, `types/`

### Dependency Management
- Minimize dependencies
- Keep dependencies up-to-date
- Use TypeScript types for external libraries
- Avoid circular dependencies

### Error Handling
- Always handle errors explicitly
- Provide meaningful error messages
- Log errors with sufficient context
- Never silently fail or use mock data

```typescript
// ✅ Good
async function createHabit(data: HabitInput): Promise<Habit> {
  if (!data.name || !data.userId) {
    throw new Error('Habit name and userId are required');
  }
  
  try {
    const habit = await notion.createHabit(data);
    return habit;
  } catch (error) {
    console.error('Failed to create habit:', { data, error });
    throw new Error(`Failed to create habit: ${error.message}`);
  }
}

// ❌ Bad
async function createHabit(data: HabitInput): Promise<Habit> {
  const habit = await notion.createHabit(data) || { id: 'mock-id', name: data.name };
  return habit;
}
```

## Async/Await

- Always use async/await instead of promise chains
- Handle errors with try/catch
- Use Promise.all for parallel operations
- Avoid blocking the event loop

```typescript
// ✅ Good
async function processMultipleProofs(proofs: Proof[]): Promise<void> {
  try {
    await Promise.all(proofs.map(proof => processProof(proof)));
  } catch (error) {
    console.error('Failed to process proofs:', error);
    throw error;
  }
}

// ❌ Bad
function processMultipleProofs(proofs: Proof[]): void {
  proofs.forEach(proof => {
    processProof(proof).catch(err => console.log(err));
  });
}
```

## Type Safety

- Use TypeScript types and interfaces
- Avoid `any` type - use `unknown` if type is truly unknown
- Define interfaces for external data structures
- Use type guards for runtime type checking

```typescript
// ✅ Good
interface HabitInput {
  name: string;
  userId: string;
  frequency: number;
}

function createHabit(input: HabitInput): Promise<Habit> {
  // Implementation
}

// ❌ Bad
function createHabit(input: any): Promise<any> {
  // Implementation
}
```

## Environment Variables

- Always validate required environment variables at startup
- Use descriptive variable names
- Document required variables in README
- Never hardcode secrets or configuration

```typescript
// ✅ Good
const requiredEnvVars = [
  'DISCORD_BOT_TOKEN',
  'NOTION_TOKEN',
  'PERPLEXITY_API_KEY',
];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}

// ❌ Bad
const token = process.env.DISCORD_BOT_TOKEN || 'default-token';
```

## Logging

- Use structured logging with context
- Log errors with sufficient detail
- Use appropriate log levels (error, warn, info, debug)
- Don't log sensitive information (tokens, passwords)

```typescript
// ✅ Good
console.error('Failed to process proof:', {
  proofId: proof.id,
  userId: proof.userId,
  error: error.message,
  stack: error.stack,
});

// ❌ Bad
console.log('Error:', error);
console.log('Token:', process.env.DISCORD_BOT_TOKEN);
```

## Testing

- Write tests for all business logic
- Test error cases, not just happy paths
- Use descriptive test names
- Keep tests simple and focused
- Mock external dependencies appropriately

```typescript
// ✅ Good
describe('calculateStreak', () => {
  it('should return 0 for empty proofs array', () => {
    expect(calculateStreak([])).toBe(0);
  });

  it('should calculate streak with consecutive proofs', () => {
    const proofs = createMockProofs(['2024-01-01', '2024-01-02', '2024-01-03']);
    expect(calculateStreak(proofs)).toBe(3);
  });

  it('should allow one cheat day per week without breaking streak', () => {
    // Test implementation
  });
});
```

