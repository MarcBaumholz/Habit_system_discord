/**
 * Batch Lifecycle Integration Tests
 * Tests the complete batch workflow: creation → activation → completion
 */

import { TestFramework } from '../../src/test/test-framework';
import {
  getAllBatches,
  saveBatch,
  getBatchByName,
  getCurrentBatch,
  getCurrentBatchDay,
  shouldBatchStart,
  updateBatchStatus,
  clearAllBatches,
  isBatchActive,
  isBatchInPrePhase
} from '../../src/utils/batch-manager';
import { BatchMetadata } from '../../src/types';
import { testBatchPrePhase, testBatchActive, createTestBatch } from '../helpers/test-data';

const DISCORD_TEST_CHANNEL = process.env.DISCORD_TESTCHANNEL || '1454881425911316572';
const test = new TestFramework('Batch Lifecycle Tests', DISCORD_TEST_CHANNEL);

// Test 1: Create batch with future start date (pre-phase)
test.test('should create batch with future start date in pre-phase status', async () => {
  clearAllBatches();

  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + 7);
  const futureDateStr = futureDate.toISOString().split('T')[0];

  const endDate = new Date(futureDate);
  endDate.setDate(endDate.getDate() + 89);
  const endDateStr = endDate.toISOString().split('T')[0];

  const batch: BatchMetadata = {
    name: 'TEST-future-batch',
    createdDate: new Date().toISOString().split('T')[0],
    startDate: futureDateStr,
    endDate: endDateStr,
    status: 'pre-phase'
  };

  saveBatch(batch);

  const saved = getBatchByName('TEST-future-batch');
  TestFramework.assertNotEqual(saved, null, 'Batch should be saved');
  TestFramework.assertEqual(saved?.status, 'pre-phase', 'Batch should be in pre-phase');
  TestFramework.assertEqual(saved?.startDate, futureDateStr, 'Start date should match');

  clearAllBatches();
});

// Test 2: Create batch with immediate start (active)
test.test('should create batch with immediate start in active status', async () => {
  clearAllBatches();

  const today = new Date().toISOString().split('T')[0];
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + 89);
  const endDateStr = endDate.toISOString().split('T')[0];

  const batch: BatchMetadata = {
    name: 'TEST-immediate-batch',
    createdDate: today,
    startDate: today,
    endDate: endDateStr,
    status: 'active'
  };

  saveBatch(batch);

  const saved = getBatchByName('TEST-immediate-batch');
  TestFramework.assertNotEqual(saved, null, 'Batch should be saved');
  TestFramework.assertEqual(saved?.status, 'active', 'Batch should be active');
  TestFramework.assertEqual(saved?.startDate, today, 'Start date should be today');

  clearAllBatches();
});

// Test 3: Prevent duplicate active batches
test.test('should allow multiple batches but getCurrentBatch returns first active', async () => {
  clearAllBatches();

  const batch1 = createTestBatch({ name: 'TEST-batch-1', status: 'active' });
  const batch2 = createTestBatch({ name: 'TEST-batch-2', status: 'active' });

  saveBatch(batch1);
  saveBatch(batch2);

  const allBatches = getAllBatches();
  TestFramework.assertEqual(allBatches.length, 2, 'Should have 2 batches');

  const currentBatch = getCurrentBatch();
  TestFramework.assertNotEqual(currentBatch, null, 'Should have current batch');
  TestFramework.assertEqual(currentBatch?.name, 'TEST-batch-1', 'Should return first active batch');

  clearAllBatches();
});

// Test 4: Transition batch from pre-phase to active
test.test('should transition batch from pre-phase to active when shouldBatchStart returns true', async () => {
  clearAllBatches();

  // Create batch with start date = today (should start)
  const today = new Date().toISOString().split('T')[0];
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + 89);

  const batch: BatchMetadata = {
    name: 'TEST-transition-batch',
    createdDate: today,
    startDate: today,
    endDate: endDate.toISOString().split('T')[0],
    status: 'pre-phase'
  };

  saveBatch(batch);

  // Check if batch should start
  const shouldStart = shouldBatchStart();
  TestFramework.assertEqual(shouldStart, true, 'Batch should be ready to start');

  // Transition batch to active
  updateBatchStatus('active');

  const updated = getCurrentBatch();
  TestFramework.assertEqual(updated?.status, 'active', 'Batch status should be updated to active');

  clearAllBatches();
});

// Test 5: Calculate correct batch day (1-90)
test.test('should calculate correct batch day from start date', async () => {
  clearAllBatches();

  const today = new Date();
  const startDate = new Date(today);
  startDate.setDate(startDate.getDate() - 5); // Started 5 days ago

  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 89);

  const batch: BatchMetadata = {
    name: 'TEST-day-calculation',
    createdDate: startDate.toISOString().split('T')[0],
    startDate: startDate.toISOString().split('T')[0],
    endDate: endDate.toISOString().split('T')[0],
    status: 'active'
  };

  saveBatch(batch);

  const day = getCurrentBatchDay();
  TestFramework.assertNotEqual(day, null, 'Should have batch day');
  TestFramework.assertEqual(day, 6, 'Should be day 6 (started 5 days ago, so today is day 6)');

  clearAllBatches();
});

// Test 6: Return null for batch day in pre-phase
test.test('should return null for batch day when batch is in pre-phase', async () => {
  clearAllBatches();

  saveBatch(testBatchPrePhase);

  const day = getCurrentBatchDay();
  TestFramework.assertEqual(day, null, 'Pre-phase batch should not have a day number');

  clearAllBatches();
});

// Test 7: Mark batch as completed (day > 90)
test.test('should handle batch completion when day exceeds 90', async () => {
  clearAllBatches();

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 91); // Started 91 days ago

  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 89);

  const batch: BatchMetadata = {
    name: 'TEST-completed-batch',
    createdDate: startDate.toISOString().split('T')[0],
    startDate: startDate.toISOString().split('T')[0],
    endDate: endDate.toISOString().split('T')[0],
    status: 'active'
  };

  saveBatch(batch);

  const day = getCurrentBatchDay();
  // Day should be clamped to 90
  TestFramework.assertEqual(day, 90, 'Day should be clamped to maximum of 90');

  // Manually mark as completed
  updateBatchStatus('completed');

  const updated = getCurrentBatch();
  TestFramework.assertEqual(updated, null, 'Completed batch should not be current batch');

  clearAllBatches();
});

// Test 8: Test isBatchActive and isBatchInPrePhase helpers
test.test('should correctly identify batch status with helper functions', async () => {
  clearAllBatches();

  // Test active batch
  saveBatch(testBatchActive);
  TestFramework.assertEqual(isBatchActive(), true, 'Should detect active batch');
  TestFramework.assertEqual(isBatchInPrePhase(), false, 'Should not detect pre-phase');

  // Test pre-phase batch
  clearAllBatches();
  saveBatch(testBatchPrePhase);
  TestFramework.assertEqual(isBatchActive(), false, 'Should not detect active batch');
  TestFramework.assertEqual(isBatchInPrePhase(), true, 'Should detect pre-phase');

  clearAllBatches();
});

// Test 9: shouldBatchStart returns false for future start dates
test.test('should not start batch if start date is in future', async () => {
  clearAllBatches();

  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + 7);

  const batch: BatchMetadata = {
    name: 'TEST-future-start',
    createdDate: new Date().toISOString().split('T')[0],
    startDate: futureDate.toISOString().split('T')[0],
    endDate: new Date(futureDate.getTime() + 89 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: 'pre-phase'
  };

  saveBatch(batch);

  const shouldStart = shouldBatchStart();
  TestFramework.assertEqual(shouldStart, false, 'Batch with future start date should not start');

  clearAllBatches();
});

// Run all tests
test.run().catch(console.error);
