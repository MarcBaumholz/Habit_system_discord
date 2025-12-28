/**
 * Example Test File
 * 
 * This demonstrates how to write tests that automatically
 * send results to the Discord test channel.
 */

import { TestFramework } from '../src/test/test-framework';
import * as dotenv from 'dotenv';

dotenv.config();

const TEST_CHANNEL_ID = process.env.DISCORD_TESTCHANNEL || '1454881425911316572';

async function runExampleTests() {
  const test = new TestFramework('Example Test Suite', TEST_CHANNEL_ID);

  // Example: Testing a simple function
  test.test('should add two numbers correctly', async () => {
    const add = (a: number, b: number) => a + b;
    const result = add(2, 3);
    TestFramework.assertEqual(result, 5);
  });

  // Example: Testing async function
  test.test('should handle async operations', async () => {
    const asyncFunction = async () => {
      return new Promise(resolve => setTimeout(() => resolve('done'), 100));
    };
    
    const result = await asyncFunction();
    TestFramework.assertEqual(result, 'done');
  });

  // Example: Testing error cases
  test.test('should throw error on invalid input', async () => {
    const validateInput = (input: string) => {
      if (!input) {
        throw new Error('Input is required');
      }
      return input;
    };

    TestFramework.assertThrows(() => validateInput(''), 'Input is required');
  });

  // Example: Testing with assertions
  test.test('should verify multiple conditions', async () => {
    const data = { name: 'Test', value: 42 };
    
    TestFramework.assert(data.name === 'Test', 'Name should be Test');
    TestFramework.assertEqual(data.value, 42);
    TestFramework.assertNotEqual(data.value, 0);
  });

  // Run all tests and send results to Discord
  const results = await test.run();
  
  console.log(`\n✅ Test suite completed:`);
  console.log(`   Total: ${results.total}`);
  console.log(`   Passed: ${results.passed}`);
  console.log(`   Failed: ${results.failed}`);
  console.log(`   Duration: ${results.duration}ms`);
  console.log(`\n📤 Results sent to Discord test channel: ${TEST_CHANNEL_ID}`);
  
  return results;
}

// Run if executed directly
if (require.main === module) {
  runExampleTests().catch(console.error);
}

export { runExampleTests };
