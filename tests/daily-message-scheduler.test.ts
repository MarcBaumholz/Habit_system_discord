import { DailyMessageScheduler } from '../src/bot/daily-message-scheduler';
import { Client, TextChannel } from 'discord.js';
import { NotionClient } from '../src/notion/client';

jest.mock('../src/notion/client');

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
    expect(msg).toContain('Day 1/66');
  });

  it('sends a daily message to the accountability channel only at 7 AM', async () => {
    // Mock Date.prototype.getHours to return 7 (7 AM)
    const originalGetHours = Date.prototype.getHours;
    Date.prototype.getHours = jest.fn(() => 7);

    await scheduler.sendDailyMessage();
    expect(accountabilityChannel.send).toHaveBeenCalled();

    // Restore original method
    Date.prototype.getHours = originalGetHours;
  });

  it('does not send daily message outside of 7 AM', async () => {
    // Mock Date.prototype.getHours to return 10 (10 AM, not 7 AM)
    const originalGetHours = Date.prototype.getHours;
    Date.prototype.getHours = jest.fn(() => 10);

    await scheduler.sendDailyMessage();
    expect(accountabilityChannel.send).not.toHaveBeenCalled();

    // Restore original method
    Date.prototype.getHours = originalGetHours;
  });
});
