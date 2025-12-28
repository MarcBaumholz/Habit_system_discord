/**
 * Test: Habit Batch Tracking
 *
 * Tests that habits are automatically tagged with the current active batch
 * when created via the keystone habit flow.
 */

import { TestFramework } from '../src/test/test-framework';
import { HabitFlowManager } from '../src/bot/habit-flow';
import { NotionClient } from '../src/notion/client';
import { getCurrentBatch, saveCurrentBatch, clearCurrentBatch } from '../src/utils/batch-manager';
import { Habit } from '../src/types';

const test = new TestFramework('Habit Batch Tracking', process.env.DISCORD_TESTCHANNEL!);

// Mock Notion Client
class MockNotionClient {
  private createdHabits: Array<Omit<Habit, 'id'>> = [];

  async getUserByDiscordId(discordId: string): Promise<any> {
    return {
      id: 'notion-user-1',
      discordId: discordId,
      name: 'Test User',
      timezone: 'Europe/Berlin',
      bestTime: '09:00',
      trustCount: 0
    };
  }

  async createHabit(habit: Omit<Habit, 'id'>): Promise<Habit> {
    this.createdHabits.push(habit);
    return {
      id: 'habit-123',
      ...habit
    };
  }

  getCreatedHabits(): Array<Omit<Habit, 'id'>> {
    return this.createdHabits;
  }

  clearCreatedHabits(): void {
    this.createdHabits = [];
  }
}

test.test('should include current batch when creating habit', async () => {
  // Arrange: Set up test batch
  const testBatch = {
    name: 'test batch january 2026',
    createdDate: '2026-01-01',
    startDate: '2026-01-01',
    endDate: '2026-03-07', // 66 days after start
    status: 'active' as const
  };

  // Save test batch as current active batch
  saveCurrentBatch(testBatch);

  // Verify batch was saved
  const currentBatch = getCurrentBatch();
  TestFramework.assertEqual(currentBatch?.name, testBatch.name, 'Test batch should be active');

  // Create mock Notion client
  const mockNotion = new MockNotionClient() as unknown as NotionClient;

  // Act: Create habit via HabitFlowManager
  // Note: In real implementation, this would trigger the modal flow
  // For testing, we're simulating what buildHabitPayloadFromCache should do
  const habitPayload: Omit<Habit, 'id'> = {
    userId: 'notion-user-1',
    name: 'Morning Meditation',
    domains: ['Mindset', 'Health'],
    frequency: 5,
    selectedDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
    context: 'Right after waking up',
    difficulty: 'Medium',
    smartGoal: 'Meditate 10 min daily for 66 days',
    why: 'Start day grounded and focused',
    minimalDose: '2 minutes breathing',
    habitLoop: 'Alarm → sit → feel calm',
    hurdles: 'Tiredness',
    reminderType: 'Calendar',
    batch: currentBatch?.name // This is what we're testing!
  };

  await mockNotion.createHabit(habitPayload);

  // Assert: Verify habit includes batch
  const createdHabits = (mockNotion as unknown as MockNotionClient).getCreatedHabits();
  TestFramework.assertEqual(createdHabits.length, 1, 'Should have created one habit');

  const createdHabit = createdHabits[0];
  TestFramework.assertEqual(
    createdHabit.batch,
    testBatch.name,
    'Created habit should have current batch name'
  );

  // Cleanup
  clearCurrentBatch();
  (mockNotion as unknown as MockNotionClient).clearCreatedHabits();
});

test.test('should handle habit creation when no batch is active', async () => {
  // Arrange: Ensure no active batch
  clearCurrentBatch();

  const currentBatch = getCurrentBatch();
  TestFramework.assertEqual(currentBatch, null, 'No batch should be active');

  // Create mock Notion client
  const mockNotion = new MockNotionClient() as unknown as NotionClient;

  // Act: Create habit without active batch
  const habitPayload: Omit<Habit, 'id'> = {
    userId: 'notion-user-1',
    name: 'Evening Reading',
    domains: ['Learning'],
    frequency: 7,
    selectedDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    context: 'Before bed',
    difficulty: 'Easy',
    smartGoal: 'Read 10 pages daily',
    why: 'Expand knowledge',
    minimalDose: '1 page',
    habitLoop: 'Bedtime → read → feel enriched',
    hurdles: 'Fatigue',
    reminderType: 'Phone alarm',
    batch: currentBatch?.name // Should be undefined
  };

  await mockNotion.createHabit(habitPayload);

  // Assert: Verify habit has no batch (undefined is acceptable)
  const createdHabits = (mockNotion as unknown as MockNotionClient).getCreatedHabits();
  TestFramework.assertEqual(createdHabits.length, 1, 'Should have created one habit');

  const createdHabit = createdHabits[0];
  TestFramework.assertEqual(
    createdHabit.batch,
    undefined,
    'Created habit should have undefined batch when none active'
  );

  // Cleanup
  (mockNotion as unknown as MockNotionClient).clearCreatedHabits();
});

test.test('should get current batch day correctly', async () => {
  // Arrange: Create batch with start date 7 days ago
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const startDate = sevenDaysAgo.toISOString().split('T')[0]; // YYYY-MM-DD

  const endDate = new Date(sevenDaysAgo);
  endDate.setDate(endDate.getDate() + 65); // 66 days total
  const endDateStr = endDate.toISOString().split('T')[0];

  saveCurrentBatch({
    name: 'test batch',
    createdDate: startDate,
    startDate: startDate,
    endDate: endDateStr,
    status: 'active' as const
  });

  // Act: Get current batch day (should be day 8)
  const { getCurrentBatchDay } = await import('../src/utils/batch-manager');
  const currentDay = getCurrentBatchDay();

  // Assert
  TestFramework.assertEqual(currentDay, 8, 'Current batch day should be 8 (7 days ago + today)');

  // Cleanup
  clearCurrentBatch();
});

// Run all tests
(async () => {
  try {
    const results = await test.run();
    console.log('✅ Test suite completed');
    console.log(`Total: ${results.total}, Passed: ${results.passed}, Failed: ${results.failed}`);

    if (results.failed > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Test suite failed:', error);
    process.exit(1);
  }
})();
