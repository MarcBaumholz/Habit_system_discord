import { ProofProcessor } from '../src/bot/proof-processor';
import { NotionClient } from '../src/notion/client';
import { Habit } from '../src/types';
import { Message } from 'discord.js';

describe('ProofProcessor', () => {
  const originalAccountabilityId = process.env.DISCORD_ACCOUNTABILITY_GROUP;
  const originalOpenRouterKey = process.env.OPENROUTER_API_KEY;
  const originalFetch = global.fetch;

  beforeEach(() => {
    process.env.DISCORD_ACCOUNTABILITY_GROUP = 'accountability-channel';
    process.env.OPENROUTER_API_KEY = 'test-key';
  });

  afterEach(() => {
    jest.resetAllMocks();
    if (originalFetch) {
      global.fetch = originalFetch;
    } else {
      // @ts-expect-error restore undefined
      delete global.fetch;
    }
  });

  afterAll(() => {
    process.env.DISCORD_ACCOUNTABILITY_GROUP = originalAccountabilityId;
    process.env.OPENROUTER_API_KEY = originalOpenRouterKey;
    if (originalFetch) {
      global.fetch = originalFetch;
    } else {
      // @ts-expect-error restore undefined
      delete global.fetch;
    }
  });

  const buildMessage = (overrides: Partial<Message> = {}): Message => {
    const attachments = new Map<string, any>();
    if (overrides.attachments === undefined) {
      attachments.set('1', {
        name: 'proof.jpg',
        url: 'https://example.com/proof.jpg',
        contentType: 'image/jpeg'
      });
    }

    return {
      id: 'message-1',
      channelId: 'accountability-channel',
      author: { id: 'discord-user-1', bot: false },
      content: 'Meditation 30 minutes ✅',
      createdAt: new Date('2024-01-01T08:00:00.000Z'),
      attachments: overrides.attachments === undefined ? (attachments as any) : overrides.attachments,
      react: jest.fn().mockResolvedValue(undefined),
      reply: jest.fn().mockResolvedValue(undefined),
      ...overrides
    } as unknown as Message;
  };

  const createNotionMock = () => {
    return {
      getUserByDiscordId: jest.fn().mockResolvedValue({
        id: 'notion-user-1',
        discordId: 'discord-user-1',
        name: 'Marc',
        timezone: 'Europe/Berlin',
        bestTime: '08:00',
        trustCount: 0
      }),
      getHabitsByUserId: jest.fn().mockResolvedValue([
        {
          id: 'habit-1',
          userId: 'notion-user-1',
          name: 'Morning Meditation',
          domains: ['Mindset'],
          frequency: 7,
          context: 'Morning routine',
          difficulty: 'Medium',
          smartGoal: 'Meditate daily',
          why: 'Stay focused',
          minimalDose: '5 minutes breathing',
          habitLoop: 'Wake up → meditate → start day',
          implementationIntentions: 'If late, meditate before breakfast',
          hurdles: 'Sleep in',
          reminderType: 'Calendar'
        } as Habit
      ]),
      createProof: jest.fn().mockResolvedValue(undefined)
    } as unknown as jest.Mocked<NotionClient>;
  };

  it('stores proof after successful classification', async () => {
    const notionMock = createNotionMock();
    const processor = new ProofProcessor(notionMock);
    const message = buildMessage();

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [
          {
            message: {
              content: JSON.stringify({
                habitName: 'Morning Meditation',
                unit: '30 min',
                note: 'Morning meditation session',
                isMinimalDose: false,
                isCheatDay: false
              })
            }
          }
        ]
      })
    }) as any;

    await processor.handleAccountabilityMessage(message);

    expect(notionMock.getUserByDiscordId).toHaveBeenCalledWith('discord-user-1');
    expect(notionMock.getHabitsByUserId).toHaveBeenCalledWith('notion-user-1');
    expect(notionMock.createProof).toHaveBeenCalledWith(expect.objectContaining({
      userId: 'notion-user-1',
      habitId: 'habit-1',
      unit: '30 min',
      note: 'Morning meditation session',
      attachmentUrl: 'https://example.com/proof.jpg',
      isMinimalDose: false,
      isCheatDay: false
    }));
    expect(message.react).toHaveBeenCalledWith('✅');
    expect(message.reply).not.toHaveBeenCalled();
  });

  it('asks user for clarification when classification fails to match habit', async () => {
    const notionMock = createNotionMock();
    const processor = new ProofProcessor(notionMock);
    const message = buildMessage();

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [
          {
            message: {
              content: JSON.stringify({
                habitName: 'unknown',
                unit: '1x',
                note: 'Could not determine',
                isMinimalDose: false,
                isCheatDay: false
              })
            }
          }
        ]
      })
    }) as any;

    await processor.handleAccountabilityMessage(message);

    expect(notionMock.createProof).not.toHaveBeenCalled();
    expect(message.reply).toHaveBeenCalled();
  });
});
