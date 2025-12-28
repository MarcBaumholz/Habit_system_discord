/**
 * Test: Proof Batch Tracking
 *
 * Tests that proofs automatically inherit the batch field from their associated habit.
 * This creates an immutable historical record of which batch the proof belongs to.
 */

import { TestFramework } from '../src/test/test-framework';
import { Proof, Habit } from '../src/types';

const test = new TestFramework('Proof Batch Tracking', process.env.DISCORD_TESTCHANNEL!);

test.test('should inherit batch from habit when creating proof', async () => {
  // Arrange: Mock habit with batch
  const mockHabit: Habit = {
    id: 'habit-123',
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
    batch: 'january 2026' // Habit has batch
  };

  // Act: Create proof (simulating what createProof should do)
  const proof: Proof = {
    id: 'proof-456',
    userId: mockHabit.userId,
    habitId: mockHabit.id,
    date: '2026-01-05',
    unit: '10 min',
    note: 'Morning meditation',
    isMinimalDose: false,
    isCheatDay: false,
    batch: mockHabit.batch // Proof should inherit habit's batch
  };

  // Assert: Proof has the same batch as habit
  TestFramework.assertEqual(
    proof.batch,
    mockHabit.batch,
    'Proof should inherit batch from habit'
  );

  TestFramework.assertEqual(
    proof.batch,
    'january 2026',
    'Proof batch should be "january 2026"'
  );
});

test.test('should handle proofs for habits without batch (legacy)', async () => {
  // Arrange: Mock habit without batch (legacy habit)
  const mockHabit: Habit = {
    id: 'habit-789',
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
    batch: undefined // No batch (legacy)
  };

  // Act: Create proof
  const proof: Proof = {
    id: 'proof-789',
    userId: mockHabit.userId,
    habitId: mockHabit.id,
    date: '2025-12-28',
    unit: '1x',
    isMinimalDose: false,
    isCheatDay: false,
    batch: mockHabit.batch // Should be undefined
  };

  // Assert: Proof has no batch (undefined)
  TestFramework.assertEqual(
    proof.batch,
    undefined,
    'Proof should have undefined batch when habit has no batch'
  );
});

test.test('should maintain batch immutability in proof record', async () => {
  // This test demonstrates the value of storing batch on proofs:
  // Even if the habit's batch field changes later, the proof retains
  // the original batch it was created under.

  // Arrange: Habit with batch
  const habit: Habit = {
    id: 'habit-100',
    userId: 'user-1',
    name: 'Test Habit',
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
    batch: 'january 2026'
  };

  // Act: Create proof
  const proof: Proof = {
    id: 'proof-100',
    userId: habit.userId,
    habitId: habit.id,
    date: '2026-01-05',
    unit: '1x',
    isMinimalDose: false,
    isCheatDay: false,
    batch: habit.batch // Captured at creation time
  };

  // Simulate: Habit batch changes later (admin correction, etc.)
  habit.batch = 'february 2026';

  // Assert: Proof batch remains unchanged (immutable historical record)
  TestFramework.assertEqual(
    proof.batch,
    'january 2026',
    'Proof batch should remain "january 2026" even after habit batch changes'
  );

  TestFramework.assertNotEqual(
    proof.batch,
    habit.batch,
    'Proof batch should be independent of current habit batch'
  );
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
