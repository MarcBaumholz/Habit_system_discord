import { NotionClient } from '../src/notion/client';
import { Habit, Proof } from '../src/types';

describe('NotionClient.getWeeklyFrequencyCount', () => {
  const originalTimezone = process.env.TZ;

  beforeAll(() => {
    process.env.TZ = 'Europe/Berlin';
  });

  afterAll(() => {
    process.env.TZ = originalTimezone;
  });

  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  const buildClient = () => {
    return new NotionClient('test-token', {
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
  };

  const buildHabit = (): Habit => ({
    id: 'habit-1',
    userId: 'user-1',
    name: 'Kalorien zaehlen',
    domains: [],
    frequency: 6,
    context: '',
    difficulty: '',
    smartGoal: '',
    why: '',
    minimalDose: '',
    habitLoop: '',
    hurdles: '',
    reminderType: ''
  });

  it('uses local week boundaries for proof queries', async () => {
    const client = buildClient();
    const habit = buildHabit();

    jest.setSystemTime(new Date('2026-01-20T00:30:00.000+01:00'));

    jest.spyOn(client, 'getHabitsByUserId').mockResolvedValue([habit]);
    const proofsSpy = jest.spyOn(client, 'getProofsByUserId').mockResolvedValue([]);

    await client.getWeeklyFrequencyCount('user-1', 'habit-1');

    expect(proofsSpy).toHaveBeenCalledWith('user-1', '2026-01-19', '2026-01-25');
  });

  it('counts only proofs for the requested habit', async () => {
    const client = buildClient();
    const habit = buildHabit();
    const proofs: Proof[] = [
      { id: 'proof-1', userId: 'user-1', habitId: 'habit-1', date: '2026-01-19', unit: '1x', note: 'one', isMinimalDose: false, isCheatDay: false },
      { id: 'proof-2', userId: 'user-1', habitId: 'habit-1', date: '2026-01-20', unit: '1x', note: 'two', isMinimalDose: false, isCheatDay: false },
      { id: 'proof-3', userId: 'user-1', habitId: 'habit-2', date: '2026-01-20', unit: '1x', note: 'other', isMinimalDose: false, isCheatDay: false }
    ];

    jest.setSystemTime(new Date('2026-01-20T10:00:00.000+01:00'));

    jest.spyOn(client, 'getHabitsByUserId').mockResolvedValue([habit]);
    jest.spyOn(client, 'getProofsByUserId').mockResolvedValue(proofs);

    const result = await client.getWeeklyFrequencyCount('user-1', 'habit-1');

    expect(result).toEqual({ current: 2, target: 6 });
  });
});
