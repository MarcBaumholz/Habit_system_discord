import { MessageAnalyzer } from '../src/bot/message-analyzer';
import { NotionClient } from '../src/notion/client';
import { Client, Message } from 'discord.js';
import { Habit, User } from '../src/types';

jest.mock('../src/notion/client');

describe('MessageAnalyzer', () => {
  let notion: jest.Mocked<NotionClient>;
  let client: jest.Mocked<Client>;
  let analyzer: MessageAnalyzer;

  beforeEach(() => {
    notion = new NotionClient('', {}) as any;
    client = { } as any;
    analyzer = new MessageAnalyzer(notion, client);
  });

  const buildMessage = (content: string): Message => ({
    author: { id: 'u1', username: 'marc', bot: false },
    content,
    attachments: new Map(),
    react: jest.fn(),
    reply: jest.fn()
  } as any);

  it('creates proof for messages that look like proofs and matches habit', async () => {
    const user: User = { id: 'n1', discordId: 'u1', name: 'Marc', timezone: 'EU', bestTime: '09:00', trustCount: 0 };
    const habits: Habit[] = [
      { id: 'h1', userId: 'n1', name: 'Meditation', domains: ['Mindset'], frequency: 7, context: 'Morning', difficulty: 'Medium', smartGoal: 'Meditate 10 minutes', why: 'Focus', minimalDose: '2 min', habitLoop: 'cue', implementationIntentions: 'if-then', hurdles: 'tired', reminderType: 'calendar' }
    ];

    notion.getUserByDiscordId.mockResolvedValue(user);
    notion.getHabitsByUserId.mockResolvedValue(habits);
    notion.createProof.mockResolvedValue({ id: 'p1', userId: 'n1', habitId: 'h1', date: '2024-01-01', unit: '10 minutes', note: 'Meditation 10 minutes', isMinimalDose: false, isCheatDay: false });
    notion.getWeeklyFrequencyCount.mockResolvedValue({ current: 1, target: 7 });

    const message = buildMessage('Meditation done for 10 minutes ✅');
    await analyzer.analyzeMessage(message);

    expect(notion.createProof).toHaveBeenCalled();
    expect((message.react as jest.Mock)).toHaveBeenCalled();
    expect((message.reply as jest.Mock)).toHaveBeenCalledWith(expect.objectContaining({ content: expect.stringContaining('Proof Automatically Detected') }));
  });

  it('does nothing for non-proof messages', async () => {
    const user: User = { id: 'n1', discordId: 'u1', name: 'Marc', timezone: 'EU', bestTime: '09:00', trustCount: 0 };
    const habits: Habit[] = [
      { id: 'h1', userId: 'n1', name: 'Meditation', domains: ['Mindset'], frequency: 7, context: 'Morning', difficulty: 'Medium', smartGoal: 'Meditate 10 minutes', why: 'Focus', minimalDose: '2 min', habitLoop: 'cue', implementationIntentions: 'if-then', hurdles: 'tired', reminderType: 'calendar' }
    ];

    notion.getUserByDiscordId.mockResolvedValue(user);
    notion.getHabitsByUserId.mockResolvedValue(habits);

    const message = buildMessage('Hello everyone, how are you?');
    await analyzer.analyzeMessage(message);

    expect(notion.createProof).not.toHaveBeenCalled();
  });
});
