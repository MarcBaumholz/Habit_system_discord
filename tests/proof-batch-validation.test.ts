/**
 * Test: Proof Batch Validation
 *
 * Tests that only habits from the current active batch can receive proofs.
 * Habits from previous/completed batches should be filtered out.
 */

import { TestFramework } from '../src/test/test-framework';
import { getCurrentBatch, saveCurrentBatch, clearCurrentBatch } from '../src/utils/batch-manager';
import { Habit } from '../src/types';

const test = new TestFramework('Proof Batch Validation', process.env.DISCORD_TESTCHANNEL!);

// Helper function we'll create to filter habits by current batch
function filterHabitsByCurrentBatch(habits: Habit[]): Habit[] {
  const currentBatch = getCurrentBatch();

  if (!currentBatch) {
    // If no batch is active, return all habits (backward compatibility)
    return habits;
  }

  // Filter to only include habits that match the current batch
  return habits.filter(habit => habit.batch === currentBatch.name);
}

test.test('should only return habits from current batch', async () => {
  // Arrange: Create test batch
  const currentBatchName = 'january 2026';
  saveCurrentBatch({
    name: currentBatchName,
    startDate: '2026-01-01'
  });

  // Create mock habits from different batches
  const allHabits: Habit[] = [
    {
      id: 'habit-1',
      userId: 'user-1',
      name: 'Morning Meditation',
      domains: ['Mindset'],
      frequency: 5,
      context: 'Morning',
      difficulty: 'Medium',
      smartGoal: 'Meditate daily',
      why: 'Clarity',
      minimalDose: '2 min',
      habitLoop: 'Alarm → sit → calm',
      hurdles: 'Time',
      reminderType: 'Calendar',
      batch: 'january 2026' // Current batch
    },
    {
      id: 'habit-2',
      userId: 'user-1',
      name: 'Evening Reading',
      domains: ['Learning'],
      frequency: 7,
      context: 'Evening',
      difficulty: 'Easy',
      smartGoal: 'Read daily',
      why: 'Growth',
      minimalDose: '1 page',
      habitLoop: 'Bedtime → read → enriched',
      hurdles: 'Fatigue',
      reminderType: 'Phone',
      batch: 'december 2025' // Old batch
    },
    {
      id: 'habit-3',
      userId: 'user-1',
      name: 'Gym Workout',
      domains: ['Health'],
      frequency: 3,
      context: 'Gym',
      difficulty: 'Hard',
      smartGoal: 'Workout 3x/week',
      why: 'Strength',
      minimalDose: '10 min',
      habitLoop: 'Gym → workout → strong',
      hurdles: 'Motivation',
      reminderType: 'Buddy',
      batch: 'january 2026' // Current batch
    },
    {
      id: 'habit-4',
      userId: 'user-1',
      name: 'Old Habit',
      domains: ['Other'],
      frequency: 1,
      context: 'Anywhere',
      difficulty: 'Easy',
      smartGoal: 'Do something',
      why: 'Reason',
      minimalDose: '1x',
      habitLoop: 'Cue → do → reward',
      hurdles: 'None',
      reminderType: 'None',
      batch: undefined // No batch (legacy habit)
    }
  ];

  // Act: Filter habits by current batch
  const currentBatchHabits = filterHabitsByCurrentBatch(allHabits);

  // Assert: Should only get habits from current batch
  TestFramework.assertEqual(
    currentBatchHabits.length,
    2,
    'Should return only 2 habits from current batch'
  );

  TestFramework.assertEqual(
    currentBatchHabits[0].name,
    'Morning Meditation',
    'First habit should be from current batch'
  );

  TestFramework.assertEqual(
    currentBatchHabits[1].name,
    'Gym Workout',
    'Second habit should be from current batch'
  );

  // Verify old batch habits are excluded
  const oldHabitIncluded = currentBatchHabits.some(h => h.batch === 'december 2025');
  TestFramework.assertEqual(
    oldHabitIncluded,
    false,
    'Should not include habits from old batch'
  );

  // Cleanup
  clearCurrentBatch();
});

test.test('should return all habits when no batch is active', async () => {
  // Arrange: Clear any active batch
  clearCurrentBatch();

  const currentBatch = getCurrentBatch();
  TestFramework.assertEqual(currentBatch, null, 'No batch should be active');

  // Create mock habits
  const allHabits: Habit[] = [
    {
      id: 'habit-1',
      userId: 'user-1',
      name: 'Habit 1',
      domains: ['Test'],
      frequency: 1,
      context: 'Test',
      difficulty: 'Easy',
      smartGoal: 'Test',
      why: 'Test',
      minimalDose: '1x',
      habitLoop: 'Test',
      hurdles: 'None',
      reminderType: 'None',
      batch: 'old batch'
    },
    {
      id: 'habit-2',
      userId: 'user-1',
      name: 'Habit 2',
      domains: ['Test'],
      frequency: 1,
      context: 'Test',
      difficulty: 'Easy',
      smartGoal: 'Test',
      why: 'Test',
      minimalDose: '1x',
      habitLoop: 'Test',
      hurdles: 'None',
      reminderType: 'None',
      batch: undefined
    }
  ];

  // Act: Filter habits (should return all when no batch is active)
  const filteredHabits = filterHabitsByCurrentBatch(allHabits);

  // Assert: Should return all habits for backward compatibility
  TestFramework.assertEqual(
    filteredHabits.length,
    allHabits.length,
    'Should return all habits when no batch is active'
  );
});

test.test('should handle empty habits array gracefully', async () => {
  // Arrange
  saveCurrentBatch({
    name: 'test batch',
    startDate: '2026-01-01'
  });

  const emptyHabits: Habit[] = [];

  // Act
  const filteredHabits = filterHabitsByCurrentBatch(emptyHabits);

  // Assert
  TestFramework.assertEqual(
    filteredHabits.length,
    0,
    'Should return empty array when input is empty'
  );

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
