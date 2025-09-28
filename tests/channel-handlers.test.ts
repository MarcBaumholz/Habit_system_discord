import { ChannelHandlers } from '../src/bot/channel-handlers';
import { NotionClient } from '../src/notion/client';
import { Client, TextChannel } from 'discord.js';

jest.mock('../src/notion/client');

describe('ChannelHandlers', () => {
  let client: jest.Mocked<Client>;
  let notion: jest.Mocked<NotionClient>;
  let handlers: ChannelHandlers;
  let learningsChannel: jest.Mocked<TextChannel>;
  let weeklyChannel: jest.Mocked<TextChannel>;

  beforeEach(() => {
    process.env.DISCORD_LEARNINGS_CHANNEL = 'learnings';
    process.env.DISCORD_WEEKLY_REVIEWS_CHANNEL = 'weekly';

    client = {
      channels: {
        cache: {
          get: jest.fn()
        }
      }
    } as unknown as jest.Mocked<Client>;

    notion = new NotionClient('', {}) as jest.Mocked<NotionClient>;

    learningsChannel = { send: jest.fn() } as unknown as jest.Mocked<TextChannel>;
    weeklyChannel = { send: jest.fn() } as unknown as jest.Mocked<TextChannel>;

    (client.channels.cache.get as jest.Mock)
      .mockImplementation((id: string) => (id === 'learnings' ? learningsChannel : id === 'weekly' ? weeklyChannel : undefined));

    handlers = new ChannelHandlers(client, notion);
  });

  afterEach(() => {
    delete process.env.DISCORD_LEARNINGS_CHANNEL;
    delete process.env.DISCORD_WEEKLY_REVIEWS_CHANNEL;
  });

  it('posts to learnings channel and creates learning', async () => {
    await handlers.postToLearningsChannel('Insight text', 'u1');

    expect(learningsChannel.send).toHaveBeenCalled();
    expect(notion.createLearning).toHaveBeenCalledWith(expect.objectContaining({ userId: 'u1', text: 'Insight text' }));
  });

  it('posts hurdle message to learnings channel', async () => {
    await handlers.postToHurdlesChannel('Fatigue', 'Too tired', 'Health', 'Marc');

    expect(learningsChannel.send).toHaveBeenCalled();
  });

  it('posts weekly review to weekly channel', async () => {
    await handlers.postWeeklyReview(3, { activeUsers: 5, completionRate: 80, totalProofs: 40, minimalDoses: 10, cheatDays: 3, topPerformers: '@u1 @u2' });

    expect(weeklyChannel.send).toHaveBeenCalledWith(expect.stringContaining('Weekly Review - Week 3'));
  });

  it('handles proof reactions with reply', async () => {
    const message: any = { reply: jest.fn() };
    await handlers.handleProofReaction({} as any, { emoji: { name: '👍' }, message } as any);
    expect(message.reply).toHaveBeenCalled();
  });

  it('posts donation pool update with missed days', async () => {
    await handlers.postDonationPoolUpdate(2, 20);
    expect(weeklyChannel.send).toHaveBeenCalledWith(expect.stringContaining('Donation Pool Update'));
  });

  it('posts perfect week when no missed days', async () => {
    await handlers.postDonationPoolUpdate(0, 0);
    expect(weeklyChannel.send).toHaveBeenCalledWith(expect.stringContaining('Perfect Week'));
  });
});
