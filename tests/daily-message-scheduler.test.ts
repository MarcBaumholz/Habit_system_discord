import { DailyMessageScheduler } from '../src/bot/daily-message-scheduler';
import { Client, TextChannel } from 'discord.js';
import { NotionClient } from '../src/notion/client';
import { testUser1, testUser2, testUserPaused, testBatchActive } from './helpers/test-data';
import { User } from '../src/types';

jest.mock('../src/notion/client');
jest.mock('../src/utils/batch-manager', () => ({
  getCurrentBatch: jest.fn(),
  getCurrentBatchDay: jest.fn(),
  shouldBatchStart: jest.fn(),
  updateBatchStatus: jest.fn()
}));

describe('DailyMessageScheduler', () => {
  let client: jest.Mocked<Client>;
  let notion: jest.Mocked<NotionClient>;
  let scheduler: DailyMessageScheduler;
  let accountabilityChannel: jest.Mocked<TextChannel>;
  let mockLogger: any;

  beforeEach(() => {
    process.env.DISCORD_ACCOUNTABILITY_GROUP = 'acc';
    client = { channels: { cache: { get: jest.fn() } } } as any;
    notion = new NotionClient('', {}) as any;
    accountabilityChannel = { send: jest.fn() } as any;
    (client.channels.cache.get as jest.Mock).mockReturnValue(accountabilityChannel);

    mockLogger = {
      info: jest.fn().mockResolvedValue(undefined),
      success: jest.fn().mockResolvedValue(undefined),
      error: jest.fn().mockResolvedValue(undefined),
      warning: jest.fn().mockResolvedValue(undefined),
      logError: jest.fn().mockResolvedValue(undefined)
    };
    scheduler = new DailyMessageScheduler(client, notion, mockLogger);
  });

  afterEach(() => {
    delete process.env.DISCORD_ACCOUNTABILITY_GROUP;
  });

  it('generates a daily message', () => {
    const msg = scheduler.generateDailyMessage(1);
    expect(msg).toContain('Day 1/90');
  });

  it('sends a daily message to the accountability channel only at 6 AM', async () => {
    // Mock Date.prototype.getHours to return 6 (6 AM)
    const originalGetHours = Date.prototype.getHours;
    Date.prototype.getHours = jest.fn(() => 6);

    await scheduler.sendDailyMessage();
    expect(accountabilityChannel.send).toHaveBeenCalled();

    // Restore original method
    Date.prototype.getHours = originalGetHours;
  });

  it('does not send daily message outside of 6 AM', async () => {
    // Mock Date.prototype.getHours to return 10 (10 AM, not 6 AM)
    const originalGetHours = Date.prototype.getHours;
    Date.prototype.getHours = jest.fn(() => 10);

    await scheduler.sendDailyMessage();
    expect(accountabilityChannel.send).not.toHaveBeenCalled();

    // Restore original method
    Date.prototype.getHours = originalGetHours;
  });

  it('should only count active users when displaying enrolled count', async () => {
    // Import batch manager mocks
    const { getCurrentBatch, shouldBatchStart } = require('../src/utils/batch-manager');
    
    // Setup: Batch is starting (shouldBatchStart returns true)
    shouldBatchStart.mockReturnValue(true);
    getCurrentBatch.mockReturnValue(testBatchActive);

    // Mock getUsersInBatch to return mix of active and paused users
    const batchUsers: User[] = [
      testUser1,        // active
      testUser2,        // active
      testUserPaused    // pause status
    ];

    (notion.getUsersInBatch as jest.Mock).mockResolvedValue(batchUsers);

    // Call checkAndActivateBatch (which is called by sendDailyMessage)
    await scheduler.sendDailyMessage();

    // Verify that getUsersInBatch was called with correct batch name
    expect(notion.getUsersInBatch).toHaveBeenCalledWith(testBatchActive.name);

    // Verify the message sent contains only active user count (2, not 3)
    const sentMessage = (accountabilityChannel.send as jest.Mock).mock.calls.find(
      (call: any[]) => call[0]?.includes('Enrolled:')
    )?.[0];

    expect(sentMessage).toBeDefined();
    // Should show 2 active participants, not 3 total
    expect(sentMessage).toContain('Enrolled: 2 active participants');
    expect(sentMessage).not.toContain('Enrolled: 3');
  });

  it('should handle batch with only paused users correctly', async () => {
    const { getCurrentBatch, shouldBatchStart } = require('../src/utils/batch-manager');
    
    shouldBatchStart.mockReturnValue(true);
    getCurrentBatch.mockReturnValue(testBatchActive);

    // Only paused users in batch
    const batchUsers: User[] = [
      { ...testUserPaused, id: 'paused-1' },
      { ...testUserPaused, id: 'paused-2', discordId: '9999999999' }
    ];

    (notion.getUsersInBatch as jest.Mock).mockResolvedValue(batchUsers);

    await scheduler.sendDailyMessage();

    const sentMessage = (accountabilityChannel.send as jest.Mock).mock.calls.find(
      (call: any[]) => call[0]?.includes('Enrolled:')
    )?.[0];

    expect(sentMessage).toBeDefined();
    // Should show 0 active participants when all are paused
    expect(sentMessage).toContain('Enrolled: 0 active participants');
  });

  it('should handle batch with only active users correctly', async () => {
    const { getCurrentBatch, shouldBatchStart } = require('../src/utils/batch-manager');
    
    shouldBatchStart.mockReturnValue(true);
    getCurrentBatch.mockReturnValue(testBatchActive);

    // Only active users
    const batchUsers: User[] = [
      testUser1,
      testUser2,
      { ...testUser1, id: 'active-3', discordId: '3333333333', name: 'ActiveUser3' }
    ];

    (notion.getUsersInBatch as jest.Mock).mockResolvedValue(batchUsers);

    await scheduler.sendDailyMessage();

    const sentMessage = (accountabilityChannel.send as jest.Mock).mock.calls.find(
      (call: any[]) => call[0]?.includes('Enrolled:')
    )?.[0];

    expect(sentMessage).toBeDefined();
    // Should show 3 active participants (all are active)
    expect(sentMessage).toContain('Enrolled: 3 active participants');
  });
});
