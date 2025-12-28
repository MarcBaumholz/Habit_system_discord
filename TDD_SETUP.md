# Test-Driven Development (TDD) Setup

## Overview

This system implements TDD with automatic test execution and Discord integration. All test results are sent to Discord test channel `1454881425911316572`.

## Configuration

### Environment Variables

Add to your `.env` file:

```bash
DISCORD_TESTCHANNEL=1454881425911316572
DISCORD_BOT_TOKEN=your_bot_token_here
```

### Test Channel

- **Channel ID**: `1454881425911316572`
- **Purpose**: Receive all test execution results
- **Format**: Rich embeds with test summaries and details

## Usage

### Running Tests

```bash
# Run all tests and send results to Discord
npm run test:discord

# Watch mode - automatically run tests on file changes
npm run test:discord:watch
```

### Writing Tests

Create test files in `tests/` directory:

```typescript
// tests/my-feature.test.ts
import { TestFramework } from '../src/test/test-framework';
import * as dotenv from 'dotenv';

dotenv.config();

const test = new TestFramework('My Feature', process.env.DISCORD_TESTCHANNEL!);

test.test('should do something', async () => {
  // Arrange
  const input = { /* test data */ };
  
  // Act
  const result = await functionUnderTest(input);
  
  // Assert
  TestFramework.assertEqual(result.success, true);
});

await test.run();
```

## Test Framework API

### TestFramework Class

```typescript
const test = new TestFramework('Suite Name', channelId);

// Add test
test.test('test name', async () => {
  // Test code
});

// Run all tests
await test.run();
```

### Assertions

- `TestFramework.assert(condition, message?)` - Assert condition is true
- `TestFramework.assertEqual(actual, expected, message?)` - Assert equality
- `TestFramework.assertNotEqual(actual, expected, message?)` - Assert not equal
- `TestFramework.assertThrows(fn, expectedError?)` - Assert function throws

## Integration with Development Tools

### Cursor Rules

Rules are in `.cursorrules` - Cursor will automatically:
- Write tests before implementation
- Run tests on code changes
- Send results to Discord

### Claude Rules

Rules are in `.claude/rules/tdd-rules.md` - Claude will:
- Follow TDD workflow
- Write tests first
- Send results to Discord test channel

### Agent OS Rules

Rules are in `.agent-os/rules/tdd-rules.md` - Agent OS will:
- Monitor code changes
- Execute tests automatically
- Post results to Discord

## Workflow

1. **Write Test** (Red Phase)
   - Create test file
   - Write test that describes expected behavior
   - Test should fail initially

2. **Implement Feature** (Green Phase)
   - Write minimal code to make test pass
   - Run tests: `npm run test:discord`
   - Results automatically sent to Discord

3. **Refactor** (Refactor Phase)
   - Improve code quality
   - Keep tests green
   - Verify in Discord test channel

## Test Result Format in Discord

```
🧪 Test Results: Feature Name
📊 Summary: Total: 5 | ✅ Passed: 4 | ❌ Failed: 1 | ⏱️ Duration: 234ms

❌ Failed Tests:
test_name
Error: Expected X but got Y

📝 Code Changes:
[Git diff of changes]
```

## File Structure

```
Habit_system_discord/
├── src/
│   └── test/
│       ├── discord-test-runner.ts  # Discord integration
│       └── test-framework.ts       # Test framework
├── tests/
│   └── *.test.ts                   # Test files
├── scripts/
│   └── run-tests-discord.ts        # Test runner script
├── .cursorrules                    # Cursor TDD rules
├── .claude/
│   └── rules/
│       └── tdd-rules.md            # Claude TDD rules
└── .agent-os/
    └── rules/
        └── tdd-rules.md            # Agent OS TDD rules
```

## Example Test

See `tests/example.test.ts` for a complete example.

## Continuous Testing

The system supports:
- **Watch Mode**: `npm run test:discord:watch` - Auto-run on file changes
- **Pre-commit Hooks**: Run tests before git commit (to be configured)
- **CI/CD Integration**: Run tests in deployment pipeline

## Troubleshooting

### Tests not sending to Discord

1. Check `DISCORD_TESTCHANNEL` is set in `.env`
2. Verify bot token is correct
3. Ensure bot has permission to send messages in test channel
4. Check bot is online

### Test timeout errors

Increase timeout in test:
```typescript
test.test('slow test', async () => {
  // Test code
}, 10000); // 10 second timeout
```

## Next Steps

1. Add `DISCORD_TESTCHANNEL` to `.env`
2. Run example test: `npm run test:discord`
3. Check Discord test channel for results
4. Start writing tests for your features!
