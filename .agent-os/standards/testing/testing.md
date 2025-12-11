# Testing Standards

## Test-Driven Development

- Write tests before implementation
- Test behavior, not implementation
- Keep tests simple and focused
- Use descriptive test names

```typescript
// ✅ Good
describe('calculateStreak', () => {
  it('should return 0 for empty proofs array', () => {
    const proofs: Proof[] = [];
    expect(calculateStreak(proofs)).toBe(0);
  });
  
  it('should calculate streak with consecutive daily proofs', () => {
    const proofs = createMockProofs([
      '2024-01-01',
      '2024-01-02',
      '2024-01-03',
    ]);
    expect(calculateStreak(proofs)).toBe(3);
  });
  
  it('should allow one cheat day per week without breaking streak', () => {
    const proofs = createMockProofs([
      '2024-01-01', // Monday
      '2024-01-02', // Tuesday
      // Wednesday skipped (cheat day)
      '2024-01-04', // Thursday
      '2024-01-05', // Friday
    ]);
    expect(calculateStreak(proofs)).toBe(4);
  });
});

// ❌ Bad
describe('calculateStreak', () => {
  it('works', () => {
    expect(calculateStreak([])).toBe(0);
  });
});
```

## Test Organization

- Group related tests in describe blocks
- Use nested describes for complex scenarios
- Keep test files close to source files
- Use consistent naming: `*.test.ts` or `*.spec.ts`

```typescript
// ✅ Good
// File: src/bot/proof-processor.test.ts
import { ProofProcessor } from './proof-processor';

describe('ProofProcessor', () => {
  describe('validateProof', () => {
    it('should return true for valid proof', () => {
      // Test
    });
    
    it('should return false for proof without user', () => {
      // Test
    });
  });
  
  describe('processProof', () => {
    it('should create proof in Notion', async () => {
      // Test
    });
    
    it('should handle Notion API errors', async () => {
      // Test
    });
  });
});

// ❌ Bad
describe('Tests', () => {
  it('test1', () => { });
  it('test2', () => { });
  it('test3', () => { });
});
```

## Mocking

- Mock external dependencies (APIs, databases)
- Use Jest mocks for functions and modules
- Create mock data factories for complex objects
- Never use mock data in production code

```typescript
// ✅ Good
import { NotionClient } from '../notion/client';

jest.mock('../notion/client');

describe('HabitBot', () => {
  let mockNotionClient: jest.Mocked<NotionClient>;
  
  beforeEach(() => {
    mockNotionClient = new NotionClient({} as any) as jest.Mocked<NotionClient>;
    mockNotionClient.getUserById = jest.fn();
  });
  
  it('should create habit for user', async () => {
    const mockUser = createMockUser({ id: 'user-123' });
    mockNotionClient.getUserById.mockResolvedValue(mockUser);
    
    const bot = new HabitBot(mockNotionClient);
    const result = await bot.createHabit('user-123', { name: 'Meditation' });
    
    expect(result).toBeDefined();
    expect(mockNotionClient.getUserById).toHaveBeenCalledWith('user-123');
  });
});

function createMockUser(overrides?: Partial<User>): User {
  return {
    id: 'user-123',
    discordId: 'discord-123',
    name: 'Test User',
    trustCount: 0,
    ...overrides,
  };
}

// ❌ Bad
describe('HabitBot', () => {
  it('should create habit', async () => {
    const bot = new HabitBot(new NotionClient({ token: 'mock-token' }));
    // Uses real API - bad for unit tests
  });
});
```

## Async Testing

- Use async/await in tests
- Handle promise rejections
- Test both success and error cases
- Use proper timeout for slow operations

```typescript
// ✅ Good
describe('async operations', () => {
  it('should handle successful API call', async () => {
    const result = await fetchUserData('user-123');
    expect(result).toBeDefined();
    expect(result.id).toBe('user-123');
  });
  
  it('should handle API errors', async () => {
    mockApi.getUserById.mockRejectedValue(new Error('API Error'));
    
    await expect(fetchUserData('user-123')).rejects.toThrow('API Error');
  });
  
  it('should timeout after 5 seconds', async () => {
    mockApi.getUserById.mockImplementation(() => 
      new Promise(resolve => setTimeout(resolve, 10000))
    );
    
    await expect(
      Promise.race([
        fetchUserData('user-123'),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), 5000)
        ),
      ])
    ).rejects.toThrow('Timeout');
  }, 10000);
});

// ❌ Bad
describe('async operations', () => {
  it('should handle API call', () => {
    fetchUserData('user-123').then(result => {
      expect(result).toBeDefined();
    });
  });
});
```

## Test Coverage

- Aim for high coverage of business logic
- Don't obsess over 100% coverage
- Focus on critical paths and edge cases
- Test error handling

```typescript
// ✅ Good
describe('calculateStreak', () => {
  // Happy path
  it('should calculate streak with consecutive proofs', () => { });
  
  // Edge cases
  it('should return 0 for empty array', () => { });
  it('should handle single proof', () => { });
  it('should handle proofs with gaps', () => { });
  it('should handle cheat days correctly', () => { });
  
  // Error cases
  it('should throw error for invalid proof dates', () => { });
  it('should handle timezone differences', () => { });
});

// ❌ Bad
describe('calculateStreak', () => {
  it('should work', () => {
    expect(calculateStreak([createProof()])).toBe(1);
  });
});
```

## Integration Tests

- Test complete workflows
- Use test databases when possible
- Clean up after tests
- Test real integrations, not mocks

```typescript
// ✅ Good
describe('Habit creation workflow', () => {
  let testNotionClient: NotionClient;
  let testDiscordClient: Client;
  
  beforeAll(async () => {
    testNotionClient = new NotionClient({
      token: process.env.TEST_NOTION_TOKEN!,
      databases: testDatabases,
    });
    // Setup test Discord client
  });
  
  afterEach(async () => {
    // Clean up test data
    await cleanupTestData();
  });
  
  it('should create habit and notify user', async () => {
    const user = await testNotionClient.createUser({
      discordId: 'test-user',
      name: 'Test User',
    });
    
    const habit = await testNotionClient.createHabit({
      userId: user.id,
      name: 'Test Habit',
    });
    
    expect(habit).toBeDefined();
    expect(habit.userId).toBe(user.id);
  });
});

// ❌ Bad
describe('Habit creation', () => {
  it('should work', () => {
    // Uses production database - bad!
  });
});
```

