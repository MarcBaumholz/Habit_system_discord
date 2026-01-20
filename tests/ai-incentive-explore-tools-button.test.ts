/**
 * Verify Explore Tools button config for weekly AI incentive message.
 */

import { TestFramework } from '../src/test/test-framework';
import { buildExploreToolsButtonRow, EXPLORE_TOOLS_URL } from '../src/bot/ai-incentive-manager';
import * as dotenv from 'dotenv';

dotenv.config();

const TEST_CHANNEL_ID = process.env.DISCORD_TESTCHANNEL || '1454881425911316572';

async function runExploreToolsButtonTests() {
  const test = new TestFramework('AI Incentive Explore Tools Button', TEST_CHANNEL_ID);

  test.test('should build Explore Tools link button with correct URL', async () => {
    const row = buildExploreToolsButtonRow();
    const json = row.toJSON();

    TestFramework.assertEqual(json.components.length, 1, 'Expected a single button component');
    const button = json.components[0] as { label?: string; url?: string; style?: number };

    TestFramework.assertEqual(button.label, 'Explore Tools');
    TestFramework.assertEqual(button.url, EXPLORE_TOOLS_URL);
  });

  const results = await test.run();
  console.log(`\n✅ Explore Tools button tests completed:`);
  console.log(`   Total: ${results.total}`);
  console.log(`   Passed: ${results.passed}`);
  console.log(`   Failed: ${results.failed}`);
  console.log(`   Duration: ${results.duration}ms`);

  return results;
}

if (require.main === module) {
  runExploreToolsButtonTests().catch(console.error);
}

export { runExploreToolsButtonTests };
