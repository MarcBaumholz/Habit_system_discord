import { TestFramework } from '../src/test/test-framework';
import {
  getAllBatches,
  getActiveBatches,
  saveBatch,
  getBatchByName,
  clearAllBatches
} from '../src/utils/batch-manager';
import { BatchMetadata } from '../src/types';
import fs from 'fs';
import path from 'path';

const DISCORD_TEST_CHANNEL = process.env.DISCORD_TESTCHANNEL || '1454881425911316572';
const test = new TestFramework('Batch Management System', DISCORD_TEST_CHANNEL);

// Test data
const mockBatch1: BatchMetadata = {
  name: 'january 2026',
  createdDate: '2026-01-01',
  startDate: '2026-01-15',
  endDate: '2026-03-22',
  status: 'pre-phase'
};

const mockBatch2: BatchMetadata = {
  name: 'february 2026',
  createdDate: '2026-01-20',
  startDate: '2026-02-01',
  endDate: '2026-04-08',
  status: 'active'
};

const mockBatch3: BatchMetadata = {
  name: 'march 2026',
  createdDate: '2026-02-15',
  startDate: '2026-03-01',
  endDate: '2026-05-06',
  status: 'completed'
};

// Note: Tests will clean up at the start of each test

test.test('should return empty array when no batches exist', async () => {
  clearAllBatches();
  const batches = getAllBatches();
  TestFramework.assertEqual(Array.isArray(batches), true);
  TestFramework.assertEqual(batches.length, 0);
});

test.test('should save a new batch successfully', async () => {
  clearAllBatches();
  saveBatch(mockBatch1);

  const batches = getAllBatches();
  TestFramework.assertEqual(batches.length, 1);
  TestFramework.assertEqual(batches[0].name, 'january 2026');
  TestFramework.assertEqual(batches[0].status, 'pre-phase');
});

test.test('should save multiple batches', async () => {
  clearAllBatches();
  saveBatch(mockBatch1);
  saveBatch(mockBatch2);
  saveBatch(mockBatch3);

  const batches = getAllBatches();
  TestFramework.assertEqual(batches.length, 3);
});

test.test('should get batch by name', async () => {
  clearAllBatches();
  saveBatch(mockBatch1);
  saveBatch(mockBatch2);

  const batch = getBatchByName('february 2026');
  TestFramework.assertNotEqual(batch, null);
  TestFramework.assertEqual(batch?.name, 'february 2026');
  TestFramework.assertEqual(batch?.status, 'active');
});

test.test('should return null for non-existent batch name', async () => {
  clearAllBatches();
  saveBatch(mockBatch1);

  const batch = getBatchByName('nonexistent batch');
  TestFramework.assertEqual(batch, null);
});

test.test('should get only active batches', async () => {
  clearAllBatches();
  saveBatch(mockBatch1); // pre-phase
  saveBatch(mockBatch2); // active
  saveBatch(mockBatch3); // completed

  const activeBatches = getActiveBatches();
  TestFramework.assertEqual(activeBatches.length, 2);

  // Should include pre-phase and active, but not completed
  const statuses = activeBatches.map(b => b.status);
  TestFramework.assertEqual(statuses.includes('pre-phase'), true);
  TestFramework.assertEqual(statuses.includes('active'), true);
  TestFramework.assertEqual(statuses.includes('completed'), false);
});

test.test('should return empty array when no active batches exist', async () => {
  clearAllBatches();
  saveBatch(mockBatch3); // completed batch only

  const activeBatches = getActiveBatches();
  TestFramework.assertEqual(activeBatches.length, 0);
});

test.test('should update existing batch when saving with same name', async () => {
  clearAllBatches();
  saveBatch(mockBatch1);

  // Update the batch
  const updatedBatch: BatchMetadata = {
    ...mockBatch1,
    status: 'active' // Change from pre-phase to active
  };
  saveBatch(updatedBatch);

  const batches = getAllBatches();
  TestFramework.assertEqual(batches.length, 1); // Should still be only 1 batch
  TestFramework.assertEqual(batches[0].status, 'active'); // Status should be updated
});

test.test('should clear all batches', async () => {
  saveBatch(mockBatch1);
  saveBatch(mockBatch2);

  clearAllBatches();

  const batches = getAllBatches();
  TestFramework.assertEqual(batches.length, 0);
});

// Run all tests
test.run();
