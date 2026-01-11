/**
 * Test Data Fixtures
 * Reusable test data for all test suites
 */

import { User, Habit, Proof, BatchMetadata } from '../../src/types';

// Test Batches
export const testBatchPrePhase: BatchMetadata = {
  name: 'TEST-batch-prephase',
  createdDate: '2026-01-01',
  startDate: '2026-01-20', // Future date
  endDate: '2026-03-27',
  status: 'pre-phase'
};

export const testBatchActive: BatchMetadata = {
  name: 'TEST-batch-active',
  createdDate: '2026-01-01',
  startDate: '2026-01-01',
  endDate: '2026-03-08',
  status: 'active'
};

export const testBatchCompleted: BatchMetadata = {
  name: 'TEST-batch-completed',
  createdDate: '2025-10-01',
  startDate: '2025-10-15',
  endDate: '2025-12-20',
  status: 'completed'
};

// Test Users
export const testUser1: User = {
  id: 'test-user-1-id',
  discordId: '1234567890',
  name: 'TestUser1',
  timezone: 'Europe/Berlin',
  bestTime: '08:00',
  personalChannelId: 'test-channel-1',
  status: 'active',
  trustCount: 0,
  batch: ['TEST-batch-active']
};

export const testUser2: User = {
  id: 'test-user-2-id',
  discordId: '0987654321',
  name: 'TestUser2',
  timezone: 'Europe/Berlin',
  bestTime: '09:00',
  personalChannelId: 'test-channel-2',
  status: 'active',
  trustCount: 0,
  batch: ['TEST-batch-active']
};

export const testUserPaused: User = {
  id: 'test-user-paused-id',
  discordId: '1111222233',
  name: 'TestUserPaused',
  timezone: 'Europe/Berlin',
  bestTime: '10:00',
  personalChannelId: 'test-channel-paused',
  status: 'pause',
  trustCount: 0,
  batch: ['TEST-batch-active']
};

// Test Habits
export const testHabit1: Habit = {
  id: 'test-habit-1-id',
  name: 'Morning Meditation',
  userId: 'test-user-1-id',
  domains: ['Mental Health', 'Mindfulness'],
  frequency: 7,
  context: 'After waking up',
  difficulty: 'Medium',
  smartGoal: 'Meditate for 20 minutes every morning',
  why: 'To improve focus and reduce stress',
  minimalDose: '5 min',
  habitLoop: 'Alarm → Meditation cushion → 5 min meditation',
  hurdles: 'Sleepiness in morning',
  reminderType: 'Alarm',
  batch: 'TEST-batch-active'
};

export const testHabit2: Habit = {
  id: 'test-habit-2-id',
  name: 'Evening Run',
  userId: 'test-user-1-id',
  domains: ['Physical Health', 'Exercise'],
  frequency: 5,
  context: 'After work',
  difficulty: 'High',
  smartGoal: 'Run 5km every evening',
  why: 'To improve cardiovascular health',
  minimalDose: '2 km',
  habitLoop: 'Change clothes → Running shoes → 2 km run',
  hurdles: 'Weather conditions',
  reminderType: 'Calendar',
  batch: 'TEST-batch-active'
};

export const testHabitOldBatch: Habit = {
  id: 'test-habit-old-id',
  name: 'Old Habit',
  userId: 'test-user-1-id',
  domains: ['Personal Development'],
  frequency: 7,
  context: 'Morning routine',
  difficulty: 'Low',
  smartGoal: 'Old habit from completed batch',
  why: 'Testing purposes',
  minimalDose: '10 min',
  habitLoop: 'Wake up → Habit → Done',
  hurdles: 'None',
  reminderType: 'None',
  batch: 'TEST-batch-completed'
};

export const testHabitUser2: Habit = {
  id: 'test-habit-user2-id',
  name: 'Reading Books',
  userId: 'test-user-2-id',
  domains: ['Knowledge', 'Learning'],
  frequency: 7,
  context: 'Before bed',
  difficulty: 'Low',
  smartGoal: 'Read 20 pages every day',
  why: 'To expand knowledge',
  minimalDose: '5 pages',
  habitLoop: 'Bedtime → Book → Read',
  hurdles: 'Fatigue',
  reminderType: 'Bedtime alarm',
  batch: 'TEST-batch-active'
};

// Test Proofs
export const testProof1: Proof = {
  id: 'test-proof-1-id',
  userId: 'test-user-1-id',
  habitId: 'test-habit-1-id',
  date: '2026-01-03',
  unit: '20 min',
  isMinimalDose: false,
  isCheatDay: false,
  batch: 'TEST-batch-active'
};

export const testProofMinimalDose: Proof = {
  id: 'test-proof-minimal-id',
  userId: 'test-user-1-id',
  habitId: 'test-habit-1-id',
  date: '2026-01-02',
  unit: '5 min',
  isMinimalDose: true,
  isCheatDay: false,
  batch: 'TEST-batch-active'
};

export const testProofCheatDay: Proof = {
  id: 'test-proof-cheat-id',
  userId: 'test-user-1-id',
  habitId: 'test-habit-2-id',
  date: '2026-01-01',
  unit: '0 km',
  isMinimalDose: false,
  isCheatDay: true,
  batch: 'TEST-batch-active'
};

// Helper function to create test users with custom properties
export function createTestUser(overrides: Partial<User> = {}): User {
  return {
    ...testUser1,
    ...overrides
  };
}

// Helper function to create test habits with custom properties
export function createTestHabit(overrides: Partial<Habit> = {}): Habit {
  return {
    ...testHabit1,
    ...overrides
  };
}

// Helper function to create test proofs with custom properties
export function createTestProof(overrides: Partial<Proof> = {}): Proof {
  return {
    ...testProof1,
    ...overrides
  };
}

// Helper function to create test batches with custom properties
export function createTestBatch(overrides: Partial<BatchMetadata> = {}): BatchMetadata {
  return {
    ...testBatchActive,
    ...overrides
  };
}

// Cleanup function to reset test data
export function cleanupTestData() {
  // This would be implemented to clean up test data from Notion or local storage
  console.log('Cleaning up test data...');
}
