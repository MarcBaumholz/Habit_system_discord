import { ProofProcessor } from '../src/bot/proof-processor';
import { NotionClient } from '../src/notion/client';
import { Habit, Proof, User } from '../src/types';
import { Message } from 'discord.js';
import { parseDateString } from '../src/utils/date-utils';

jest.mock('axios');
const mockedAxios = jest.mocked(require('axios'));

describe('ProofProcessor weekly count response (simulated live)', () => {
  const originalAccountabilityId = process.env.DISCORD_ACCOUNTABILITY_GROUP;
  const originalPerplexityKey = process.env.PERPLEXITY_API_KEY;
  const originalTimezone = process.env.TZ;

  beforeAll(() => {
    process.env.TZ = 'Europe/Berlin';
  });

  beforeEach(() => {
    process.env.DISCORD_ACCOUNTABILITY_GROUP = 'accountability-channel';
    process.env.PERPLEXITY_API_KEY = 'test-key';
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  afterAll(() => {
    process.env.DISCORD_ACCOUNTABILITY_GROUP = originalAccountabilityId;
    process.env.PERPLEXITY_API_KEY = originalPerplexityKey;
    process.env.TZ = originalTimezone;
  });

  const buildUser = (): User => ({
    id: 'notion-user-1',
    discordId: 'discord-user-1',
    name: 'Marc',
    timezone: 'Europe/Berlin',
    bestTime: '08:00',
    trustCount: 0
  });

  const buildHabit = (): Habit => ({
    id: 'habit-1',
    userId: 'notion-user-1',
    name: 'Kalorien zaehlen',
    domains: ['Health'],
    frequency: 6,
    context: 'Daily tracking',
    difficulty: 'Medium',
    smartGoal: 'Track calories daily',
    why: 'Healthy nutrition',
    minimalDose: 'Log any meal',
    habitLoop: 'Meal -> log calories',
    hurdles: 'Forgetting',
    reminderType: 'Discord',
    batch: 'jan2026'
  });

  const buildMessage = (): Message => {
    return {
      id: 'message-1',
      channelId: 'accountability-channel',
      author: { id: 'discord-user-1', bot: false, username: 'Marc' },
      content: 'kalorien zaehlen',
      createdAt: new Date(),
      attachments: new Map(),
      react: jest.fn().mockResolvedValue(undefined),
      reply: jest.fn().mockResolvedValue(undefined)
    } as unknown as Message;
  };

  it('responds with 3/6 after adding current proof', async () => {
    jest.setSystemTime(new Date('2026-01-20T10:00:00.000+01:00'));

    const notion = new NotionClient('test-token', {
      users: 'users-db',
      habits: 'habits-db',
      proofs: 'proofs-db',
      learnings: 'learnings-db',
      hurdles: 'hurdles-db',
      weeks: 'weeks-db',
      groups: 'groups-db',
      personality: 'personality-db',
      pricePool: 'price-pool-db',
      challengeProofs: 'challenge-proofs-db'
    });

    const user = buildUser();
    const habit = buildHabit();

    const proofsStore: Proof[] = [
      {
        id: 'proof-1',
        userId: user.id,
        habitId: habit.id,
        date: '2026-01-19',
        unit: '1x',
        note: 'logged',
        isMinimalDose: false,
        isCheatDay: false,
        batch: habit.batch
      },
      {
        id: 'proof-2',
        userId: user.id,
        habitId: habit.id,
        date: '2026-01-20',
        unit: '1x',
        note: 'logged',
        isMinimalDose: false,
        isCheatDay: false,
        batch: habit.batch
      },
      {
        id: 'proof-previous-week',
        userId: user.id,
        habitId: habit.id,
        date: '2026-01-18',
        unit: '1x',
        note: 'sunday',
        isMinimalDose: false,
        isCheatDay: false,
        batch: habit.batch
      }
    ];

    jest.spyOn(notion, 'getUserByDiscordId').mockResolvedValue(user);
    jest.spyOn(notion, 'getHabitsByUserId').mockResolvedValue([habit]);

    jest.spyOn(notion, 'createProof').mockImplementation(async (proof) => {
      const newProof: Proof = { id: 'proof-new', ...proof };
      proofsStore.push(newProof);
      return newProof;
    });

    jest.spyOn(notion, 'getProofsByUserId').mockImplementation(async (_userId, startDate, endDate) => {
      if (!startDate || !endDate) {
        return proofsStore;
      }
      const start = parseDateString(startDate);
      const end = parseDateString(endDate);
      return proofsStore.filter(proof => {
        const proofDate = parseDateString(proof.date);
        return proofDate >= start && proofDate <= end;
      });
    });

    mockedAxios.post.mockResolvedValue({
      data: {
        choices: [
          {
            message: {
              content: JSON.stringify({
                habitName: habit.name,
                unit: '1x',
                note: 'calorie log',
                isMinimalDose: false,
                isCheatDay: false
              })
            }
          }
        ]
      }
    });

    const processor = new ProofProcessor(notion);
    const message = buildMessage();

    await processor.handleAccountabilityMessage(message);

    const replyCalls = (message.reply as jest.Mock).mock.calls;
    expect(replyCalls.length).toBe(1);
    const replyPayload = replyCalls[0][0];
    const replyContent = typeof replyPayload === 'string'
      ? replyPayload
      : replyPayload?.content || '';

    console.log('BOT_REPLY:', replyContent);
    expect(replyContent).toContain('This Week: 3/6');
  });
});
