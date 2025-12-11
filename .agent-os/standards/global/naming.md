# Naming Conventions

## General Principles

- Use descriptive, meaningful names that clearly indicate purpose
- Follow camelCase for variables, functions, and methods
- Use PascalCase for classes, types, and interfaces
- Use UPPER_SNAKE_CASE for constants
- Avoid abbreviations unless they're widely understood
- Prefix booleans with `is`, `has`, `should`, `can`, or `will`

## Variables

```typescript
// ✅ Good
const userId = user.id;
const isActive = true;
const hasPermission = checkPermission(user);
const shouldNotify = user.preferences.notifications;
const userCount = users.length;

// ❌ Bad
const id = user.id;
const active = true;
const perm = checkPermission(user);
const notify = user.preferences.notifications;
const cnt = users.length;
```

## Functions

```typescript
// ✅ Good
function getUserById(id: string): User | null { }
function createHabit(habitData: HabitInput): Promise<Habit> { }
function validateProof(proof: Proof): boolean { }
function sendDailyReminder(user: User): Promise<void> { }

// ❌ Bad
function get(id: string): User | null { }
function create(data: any): Promise<any> { }
function check(p: Proof): boolean { }
function send(u: User): Promise<void> { }
```

## Classes

```typescript
// ✅ Good
class NotionClient { }
class HabitBot { }
class AccountabilityAgent { }
class ProofProcessor { }

// ❌ Bad
class Client { }
class Bot { }
class Agent { }
class Processor { }
```

## Files and Directories

- Use kebab-case for file names: `accountability-agent.ts`
- Use descriptive names: `proof-processor.ts` not `processor.ts`
- Match file name to primary export when possible
- Group related files in directories: `agents/mentor/`, `bot/commands/`

## Constants

```typescript
// ✅ Good
const MAX_RETRY_ATTEMPTS = 3;
const DEFAULT_TIMEOUT = 5000;
const NOTION_API_VERSION = '2022-06-28';

// ❌ Bad
const maxRetries = 3;
const timeout = 5000;
const apiVersion = '2022-06-28';
```

