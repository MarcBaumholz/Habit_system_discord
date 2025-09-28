import { DailyMessageScheduler } from '../src/bot/daily-message-scheduler';
import { Client, TextChannel } from 'discord.js';
import { NotionClient } from '../src/notion/client';

jest.mock('../src/notion/client');

describe('DailyMessageScheduler', () => {
  let client: jest.Mocked<Client>;
  let notion: jest.Mocked<NotionClient>;
  let scheduler: DailyMessageScheduler;
  let accountabilityChannel: jest.Mocked<TextChannel>;

  beforeEach(() => {
    process.env.DISCORD_ACCOUNTABILITY_GROUP = 'acc';
    client = { channels: { cache: { get: jest.fn() } } } as any;
    notion = new NotionClient('', {}) as any;
    accountabilityChannel = { send: jest.fn() } as any;
    (client.channels.cache.get as jest.Mock).mockReturnValue(accountabilityChannel);

    scheduler = new DailyMessageScheduler(client, notion);
  });

  afterEach(() => {
    delete process.env.DISCORD_ACCOUNTABILITY_GROUP;
  });

  it('generates a daily message', () => {
    const msg = scheduler.generateDailyMessage(1);
    expect(msg).toContain('Day 1/66');
  });

  it('sends a daily message to the accountability channel', async () => {
    await scheduler.sendDailyMessage();
    expect(accountabilityChannel.send).toHaveBeenCalled();
  });
});
