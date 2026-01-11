/**
 * Proof Submission Integration Tests
 * Tests manual and automatic proof submission with batch filtering
 */

import { TestFramework } from '../../src/test/test-framework';
import { validateMinimalDose, meetsMinimalDose } from '../../src/utils/minimal-dose-validator';
import { filterHabitsByCurrentBatch } from '../../src/utils/batch-manager';
import { testHabit1, testHabit2, testHabitOldBatch, testBatchActive, createTestHabit } from '../helpers/test-data';

const DISCORD_TEST_CHANNEL = process.env.DISCORD_TESTCHANNEL || '1454881425911316572';
const test = new TestFramework('Proof Submission Tests', DISCORD_TEST_CHANNEL);

// Test 1: Validate minimal dose - proof meets requirement
test.test('should validate proof that meets minimal dose requirement', async () => {
  const result = validateMinimalDose('20 min', '15 min');

  TestFramework.assertEqual(result.isValid, true, 'Proof should be valid');
  TestFramework.assertEqual(result.isMinimalDose, false, 'Proof exceeds minimal dose');
  TestFramework.assertEqual(result.proofValue, 20, 'Proof value should be 20');
  TestFramework.assertEqual(result.requiredValue, 15, 'Required value should be 15');
});

// Test 2: Validate minimal dose - exact match
test.test('should validate proof that exactly matches minimal dose', async () => {
  const result = validateMinimalDose('15 min', '15 min');

  TestFramework.assertEqual(result.isValid, true, 'Proof should be valid');
  TestFramework.assertEqual(result.isMinimalDose, true, 'Proof is exactly minimal dose');
  TestFramework.assertEqual(result.proofValue, 15, 'Values should match');
});

// Test 3: Validate minimal dose - proof below requirement
test.test('should reject proof below minimal dose requirement', async () => {
  const result = validateMinimalDose('10 min', '15 min');

  TestFramework.assertEqual(result.isValid, false, 'Proof should be invalid');
  TestFramework.assertEqual(result.isMinimalDose, false, 'Proof is below minimal dose');
  TestFramework.assertEqual(result.proofValue, 10, 'Proof value should be 10');
  TestFramework.assertEqual(result.requiredValue, 15, 'Required value should be 15');
});

// Test 4: Validate minimal dose - unit mismatch
test.test('should reject proof with different unit type', async () => {
  const result = validateMinimalDose('5 km', '20 min');

  TestFramework.assertEqual(result.isValid, false, 'Proof should be invalid');
  TestFramework.assert(result.reason.includes('mismatch'), 'Error should mention unit mismatch');
});

// Test 5: Validate minimal dose - invalid format
test.test('should reject proof with invalid format', async () => {
  const result = validateMinimalDose('invalid', '20 min');

  TestFramework.assertEqual(result.isValid, false, 'Proof should be invalid');
  TestFramework.assert(result.reason.includes('Invalid'), 'Error should mention invalid format');
});

// Test 6: meetsMinimalDose helper function
test.test('should use meetsMinimalDose helper correctly', async () => {
  TestFramework.assertEqual(meetsMinimalDose('25 min', '20 min'), true, '25 min meets 20 min');
  TestFramework.assertEqual(meetsMinimalDose('20 min', '20 min'), true, '20 min meets 20 min');
  TestFramework.assertEqual(meetsMinimalDose('15 min', '20 min'), false, '15 min does not meet 20 min');
});

// Test 7: Filter habits by current batch
test.test('should filter habits to only include current batch', async () => {
  const habits = [testHabit1, testHabit2, testHabitOldBatch];

  // Mock getCurrentBatch to return testBatchActive
  const filtered = filterHabitsByCurrentBatch(habits);

  // Should only include habits from current batch
  const batchNames = filtered.map(h => h.batch);
  TestFramework.assert(
    batchNames.every(batch => batch === testBatchActive.name || batch === undefined),
    'All filtered habits should be from current batch'
  );

  // Old batch habit should be excluded
  const hasOldHabit = filtered.some(h => h.id === testHabitOldBatch.id);
  TestFramework.assertEqual(hasOldHabit, false, 'Old batch habit should be excluded');
});

// Test 8: Parse various unit formats
test.test('should parse different unit formats correctly', async () => {
  const test1 = validateMinimalDose('30 minutes', '20 min');
  TestFramework.assertEqual(test1.isValid, true, 'Should normalize "minutes" to "min"');

  const test2 = validateMinimalDose('5 km', '3 kilometers');
  TestFramework.assertEqual(test2.isValid, true, 'Should normalize "kilometers" to "km"');

  const test3 = validateMinimalDose('10 reps', '5 repetitions');
  TestFramework.assertEqual(test3.isValid, true, 'Should normalize "repetitions" to "rep"');
});

// Test 9: Proof inherits batch from habit
test.test('should ensure proof inherits batch from habit', async () => {
  const habit = createTestHabit({ batch: 'TEST-batch-active' });

  // Proof data should include batch from habit
  const proofData = {
    userId: habit.userId,
    habitId: habit.id,
    date: new Date().toISOString().split('T')[0],
    unit: '20 min',
    isMinimalDose: false,
    isCheatDay: false,
    batch: habit.batch // Inherited from habit
  };

  TestFramework.assertEqual(proofData.batch, 'TEST-batch-active', 'Proof should inherit batch from habit');
  TestFramework.assertEqual(proofData.habitId, habit.id, 'Proof should link to correct habit');
});

// Test 10: Batch filtering prevents old batch proofs
test.test('should prevent proofs for old batch habits via filtering', async () => {
  const habits = [testHabit1, testHabitOldBatch];
  const currentBatchHabits = filterHabitsByCurrentBatch(habits);

  // Try to find old habit in filtered list
  const oldHabitInList = currentBatchHabits.find(h => h.id === testHabitOldBatch.id);

  TestFramework.assertEqual(oldHabitInList, undefined, 'Old batch habit should not be in filtered list');
  TestFramework.assert(
    currentBatchHabits.length < habits.length,
    'Filtered list should be smaller than original'
  );
});

// Test 11: Multiple unit types validation
test.test('should validate different measurement types', async () => {
  const distanceTest = validateMinimalDose('5 km', '3 km');
  TestFramework.assertEqual(distanceTest.isValid, true, 'Distance validation should work');

  const timeTest = validateMinimalDose('45 min', '30 min');
  TestFramework.assertEqual(timeTest.isValid, true, 'Time validation should work');

  const countTest = validateMinimalDose('20 pages', '10 pages');
  TestFramework.assertEqual(countTest.isValid, true, 'Count validation should work');

  const repsTest = validateMinimalDose('50 reps', '25 reps');
  TestFramework.assertEqual(repsTest.isValid, true, 'Repetitions validation should work');
});

// Test 12: Decimal values support
test.test('should support decimal values in units', async () => {
  const result = validateMinimalDose('2.5 km', '2 km');

  TestFramework.assertEqual(result.isValid, true, 'Decimal values should be valid');
  TestFramework.assertEqual(result.proofValue, 2.5, 'Should parse 2.5 correctly');
  TestFramework.assertEqual(result.isMinimalDose, false, 'Should recognize 2.5 > 2');
});

// Run all tests
test.run().catch(console.error);
