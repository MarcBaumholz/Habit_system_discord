/**
 * Mock Notion Client
 * Mock NotionClient methods for testing
 */

import { User, Habit, Proof } from '../../src/types';
import { testUser1, testUser2, testHabit1, testHabit2, testProof1 } from './test-data';

/**
 * Create a mock Notion client with jest mock functions
 */
export function createMockNotionClient() {
  return {
    // User methods
    getUserByDiscordId: jest.fn((discordId: string): Promise<User | null> => {
      if (discordId === testUser1.discordId) {
        return Promise.resolve(testUser1);
      }
      if (discordId === testUser2.discordId) {
        return Promise.resolve(testUser2);
      }
      return Promise.resolve(null);
    }),

    createUser: jest.fn((userData: Partial<User>): Promise<User> => {
      return Promise.resolve({
        id: `test-user-${Date.now()}`,
        discordId: userData.discordId || '1234567890',
        name: userData.name || 'Test User',
        personalChannelId: userData.personalChannelId,
        status: userData.status || 'active',
        trustCount: userData.trustCount || 0,
        batch: userData.batch || []
      });
    }),

    updateUser: jest.fn((userId: string, updates: Partial<User>): Promise<User> => {
      return Promise.resolve({
        ...testUser1,
        id: userId,
        ...updates
      });
    }),

    getActiveUsers: jest.fn((): Promise<User[]> => {
      return Promise.resolve([testUser1, testUser2]);
    }),

    getUsersInBatch: jest.fn((batchName: string): Promise<User[]> => {
      const users = [testUser1, testUser2].filter(user =>
        user.batch?.includes(batchName)
      );
      return Promise.resolve(users);
    }),

    addUserToBatch: jest.fn((userId: string, batchName: string): Promise<void> => {
      return Promise.resolve();
    }),

    addBatchToAllActiveUsers: jest.fn((batchName: string): Promise<number> => {
      return Promise.resolve(2); // Enrolled 2 users
    }),

    // Habit methods
    getHabitsByUserId: jest.fn((userId: string): Promise<Habit[]> => {
      if (userId === testUser1.id) {
        return Promise.resolve([testHabit1, testHabit2]);
      }
      return Promise.resolve([]);
    }),

    createHabit: jest.fn((habitData: Partial<Habit>): Promise<Habit> => {
      return Promise.resolve({
        id: `test-habit-${Date.now()}`,
        name: habitData.name || 'Test Habit',
        userId: habitData.userId || testUser1.id,
        smartGoal: habitData.smartGoal || 'Test goal',
        minimalDose: habitData.minimalDose || '10 min',
        frequency: habitData.frequency || 7,
        batch: habitData.batch,
        habitType: habitData.habitType || 'Build'
      });
    }),

    updateHabit: jest.fn((habitId: string, updates: Partial<Habit>): Promise<Habit> => {
      return Promise.resolve({
        ...testHabit1,
        id: habitId,
        ...updates
      });
    }),

    // Proof methods
    createProof: jest.fn((proofData: Partial<Proof>, attachmentUrl?: string): Promise<Proof> => {
      return Promise.resolve({
        id: `test-proof-${Date.now()}`,
        userId: proofData.userId || testUser1.id,
        habitId: proofData.habitId || testHabit1.id,
        date: proofData.date || new Date().toISOString().split('T')[0],
        unit: proofData.unit || '10 min',
        note: proofData.note,
        attachmentUrl: proofData.attachmentUrl || attachmentUrl,
        isMinimalDose: proofData.isMinimalDose || false,
        isCheatDay: proofData.isCheatDay || false,
        batch: proofData.batch
      });
    }),

    getProofsByUserId: jest.fn((userId: string, startDate?: string, endDate?: string): Promise<Proof[]> => {
      return Promise.resolve([testProof1]);
    }),

    getProofsByHabitId: jest.fn((habitId: string): Promise<Proof[]> => {
      return Promise.resolve([testProof1]);
    }),

    getWeeklyProofCount: jest.fn((userId: string, habitId: string): Promise<number> => {
      return Promise.resolve(5);
    }),

    // Learning methods
    createLearning: jest.fn((learningData: any): Promise<any> => {
      return Promise.resolve({
        id: `test-learning-${Date.now()}`,
        ...learningData
      });
    }),

    // Hurdle methods
    createHurdle: jest.fn((hurdleData: any): Promise<any> => {
      return Promise.resolve({
        id: `test-hurdle-${Date.now()}`,
        ...hurdleData
      });
    }),

    // Week methods
    createWeekEntry: jest.fn((weekData: any): Promise<any> => {
      return Promise.resolve({
        id: `test-week-${Date.now()}`,
        ...weekData
      });
    }),

    // Personality methods
    savePersonality: jest.fn((personalityData: any): Promise<any> => {
      return Promise.resolve({
        id: `test-personality-${Date.now()}`,
        ...personalityData
      });
    }),

    // Buddy methods
    updateBuddy: jest.fn((userId: string, buddyName: string, buddyStartDate: string): Promise<void> => {
      return Promise.resolve();
    }),

    getBuddyProgress: jest.fn((buddyName: string, weekStart: string, weekEnd: string): Promise<any> => {
      return Promise.resolve({
        name: buddyName,
        completionRate: 85,
        proofsCount: 6,
        habitsCount: 1
      });
    })
  };
}

/**
 * Mock Notion client type for TypeScript
 */
export type MockNotionClient = ReturnType<typeof createMockNotionClient>;

/**
 * Reset all mocks on the Notion client
 */
export function resetMockNotionClient(mockClient: MockNotionClient) {
  Object.values(mockClient).forEach(mockFn => {
    if (jest.isMockFunction(mockFn)) {
      mockFn.mockClear();
    }
  });
}
