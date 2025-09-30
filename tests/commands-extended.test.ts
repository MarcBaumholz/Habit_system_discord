import { CommandHandler } from '../src/bot/commands';
import { ChannelHandlers } from '../src/bot/channel-handlers';
import { NotionClient } from '../src/notion/client';
import { User, Habit, Learning, Hurdle } from '../src/types';

// Mock Discord.js
jest.mock('discord.js', () => ({
  SlashCommandBuilder: jest.fn(),
  CommandInteraction: jest.fn(),
  AttachmentBuilder: jest.fn()
}));

// Mock Notion client
jest.mock('../src/notion/client');

describe('CommandHandler (extended)', () => {
  let mockNotion: jest.Mocked<NotionClient>;
  let mockChannelHandlers: jest.Mocked<ChannelHandlers>;
  let handler: CommandHandler;
  let mockLogger: any;

  beforeEach(() => {
    mockNotion = new NotionClient('', {}) as jest.Mocked<NotionClient>;
    mockChannelHandlers = {
      postToLearningsChannel: jest.fn(),
      postWeeklyReview: jest.fn(),
      postDailyReminder: jest.fn(),
      postGroupEncouragement: jest.fn(),
      handleProofReaction: jest.fn(),
      postDonationPoolUpdate: jest.fn(),
      postToHurdlesChannel: jest.fn()
    } as unknown as jest.Mocked<ChannelHandlers>;

    const mockPersonalChannelManager = {
      createPersonalChannel: jest.fn(),
      getPersonalChannel: jest.fn(),
      sendPersonalMessage: jest.fn(),
      sendWelcomeMessage: jest.fn(),
      client: {} as any,
      notion: mockNotion
    } as any;
    mockLogger = {
      info: jest.fn().mockResolvedValue(undefined),
      success: jest.fn().mockResolvedValue(undefined),
      error: jest.fn().mockResolvedValue(undefined),
      warning: jest.fn().mockResolvedValue(undefined),
      logError: jest.fn().mockResolvedValue(undefined)
    };
    handler = new CommandHandler(mockNotion, mockChannelHandlers, mockPersonalChannelManager, mockLogger);
  });

  describe('handleHabitAdd', () => {
    it('creates habit when user exists', async () => {
      const mockInteraction: any = {
        isChatInputCommand: () => true,
        user: { id: 'u1', username: 'marc' },
        options: {
          getString: (name: string) => ({
            name: 'name', domains: 'health,fitness', context: 'home', difficulty: 'medium', smart_goal: 'Run', why: 'Health', minimal_dose: '5m', habit_loop: 'cue->routine->reward', implementation_intentions: 'if-then', hurdles: 'time', reminder_type: 'phone'
          } as any)[name],
          getInteger: (name: string) => (name === 'frequency' ? 5 : null)
        },
        reply: jest.fn()
      };

      const user: User = { id: 'n1', discordId: 'u1', name: 'marc', timezone: 'EU', bestTime: '09:00', trustCount: 0 };
      const habit: Habit = {
        id: 'h1', userId: 'n1', name: 'Run', domains: ['health','fitness'], frequency: 5, context: 'home', difficulty: 'medium', smartGoal: 'Run', why: 'Health', minimalDose: '5m', habitLoop: 'cue->routine->reward', implementationIntentions: 'if-then', hurdles: 'time', reminderType: 'phone'
      };

      mockNotion.getUserByDiscordId.mockResolvedValue(user);
      mockNotion.createHabit.mockResolvedValue(habit);

      await handler.handleHabitAdd(mockInteraction);

      expect(mockNotion.createHabit).toHaveBeenCalledWith(expect.objectContaining({ userId: 'n1', frequency: 5 }));
      expect(mockInteraction.reply).toHaveBeenCalledWith(expect.objectContaining({ content: expect.stringContaining('Keystone Habit Created'), ephemeral: false }));
    });

    it('asks user to join if not registered', async () => {
      const mockInteraction: any = {
        isChatInputCommand: () => true,
        user: { id: 'u1' },
        options: { getString: jest.fn().mockReturnValue('x'), getInteger: jest.fn().mockReturnValue(1) },
        reply: jest.fn()
      };
      mockNotion.getUserByDiscordId.mockResolvedValue(null);

      await handler.handleHabitAdd(mockInteraction);

      expect(mockInteraction.reply).toHaveBeenCalledWith(expect.objectContaining({ content: expect.stringContaining('/join'), ephemeral: true }));
    });
  });

  describe('handleProof', () => {
    it('creates proof and posts learning when note is long', async () => {
      const mockInteraction: any = {
        isChatInputCommand: () => true,
        user: { id: 'u1', username: 'marc' },
        options: {
          getString: (name: string) => (name === 'unit' ? '30 min' : name === 'note' ? 'This is a sufficiently long note' : ''),
          getBoolean: () => false,
          getAttachment: () => undefined
        },
        reply: jest.fn()
      };

      const user: User = { id: 'n1', discordId: 'u1', name: 'marc', timezone: 'EU', bestTime: '09:00', trustCount: 0 };
      mockNotion.getUserByDiscordId.mockResolvedValue(user);
      mockNotion.createProof.mockResolvedValue({ id: 'p1', userId: 'n1', habitId: 'n1', date: '2024-01-01', unit: '30 min', note: 'x', isMinimalDose: false, isCheatDay: false });

      await handler.handleProof(mockInteraction);

      expect(mockNotion.createProof).toHaveBeenCalled();
      expect(mockInteraction.reply).toHaveBeenCalledWith(expect.objectContaining({ content: expect.stringContaining('Submitted'), ephemeral: false }));
      expect(mockChannelHandlers.postToLearningsChannel).toHaveBeenCalled();
    });

    it('asks user to join if not registered', async () => {
      const mockInteraction: any = {
        isChatInputCommand: () => true,
        user: { id: 'u1' },
        options: { getString: jest.fn().mockReturnValue('x'), getBoolean: jest.fn().mockReturnValue(false), getAttachment: jest.fn().mockReturnValue(undefined) },
        reply: jest.fn()
      };
      mockNotion.getUserByDiscordId.mockResolvedValue(null);
      await handler.handleProof(mockInteraction);
      expect(mockInteraction.reply).toHaveBeenCalledWith(expect.objectContaining({ content: expect.stringContaining('/join'), ephemeral: true }));
    });
  });

  describe('handleSummary', () => {
    it('replies with weekly summary', async () => {
      const mockInteraction: any = {
        isChatInputCommand: () => true,
        user: { id: 'u1', username: 'marc' },
        options: { getInteger: jest.fn().mockReturnValue(null) },
        reply: jest.fn(),
        deferReply: jest.fn().mockResolvedValue(undefined),
        editReply: jest.fn().mockResolvedValue(undefined),
        deferred: false
      };

      const user: User = { id: 'n1', discordId: 'u1', name: 'marc', timezone: 'EU', bestTime: '09:00', trustCount: 0 };
      mockNotion.getUserByDiscordId.mockResolvedValue(user);
      mockNotion.getUserSummary.mockResolvedValue({
        totalProofs: 10,
        minimalDoses: 2,
        cheatDays: 1,
        completionRate: 71,
        currentStreak: 5,
        bestStreak: 8,
        totalHabits: 2,
        weekProofs: 5,
        weekDays: 7
      });

      await handler.handleSummary(mockInteraction);

      expect(mockInteraction.editReply).toHaveBeenCalledWith(expect.objectContaining({ content: expect.stringContaining('Your Weekly Summary') }));
    });

    it('asks user to join if not registered', async () => {
      const mockInteraction: any = { 
        isChatInputCommand: () => true, 
        user: { id: 'u1' }, 
        options: { getInteger: jest.fn().mockReturnValue(null) }, 
        reply: jest.fn(),
        deferReply: jest.fn().mockResolvedValue(undefined),
        editReply: jest.fn().mockResolvedValue(undefined),
        deferred: false
      };
      mockNotion.getUserByDiscordId.mockResolvedValue(null);
      await handler.handleSummary(mockInteraction);
      expect(mockInteraction.editReply).toHaveBeenCalledWith(expect.objectContaining({ content: expect.stringContaining('/join') }));
    });
  });

  describe('handleLearning', () => {
    it('creates learning and posts to channel', async () => {
      const mockInteraction: any = {
        isChatInputCommand: () => true,
        user: { id: 'u1' },
        options: { getString: jest.fn().mockReturnValue('My insight') },
        reply: jest.fn()
      };

      const user: User = { id: 'n1', discordId: 'u1', name: 'marc', timezone: 'EU', bestTime: '09:00', trustCount: 0 };
      const learning: Learning = { id: 'l1', userId: 'n1', habitId: 'n1', text: 'My insight', createdAt: new Date().toISOString() };
      mockNotion.getUserByDiscordId.mockResolvedValue(user);
      mockNotion.createLearning.mockResolvedValue(learning);

      await handler.handleLearning(mockInteraction);

      expect(mockNotion.createLearning).toHaveBeenCalled();
      expect(mockChannelHandlers.postToLearningsChannel).toHaveBeenCalledWith('My insight', 'u1');
      expect(mockInteraction.reply).toHaveBeenCalledWith(expect.objectContaining({ content: expect.stringContaining('Learning Shared'), ephemeral: false }));
    });

    it('asks user to join if not registered', async () => {
      const mockInteraction: any = { isChatInputCommand: () => true, user: { id: 'u1' }, options: { getString: jest.fn().mockReturnValue('x') }, reply: jest.fn() };
      mockNotion.getUserByDiscordId.mockResolvedValue(null);
      await handler.handleLearning(mockInteraction);
      expect(mockInteraction.reply).toHaveBeenCalledWith(expect.objectContaining({ content: expect.stringContaining('/join'), ephemeral: true }));
    });
  });

  describe('handleHurdles', () => {
    it('creates hurdle and posts to channel', async () => {
      const mockInteraction: any = {
        isChatInputCommand: () => true,
        user: { id: 'u1', username: 'marc' },
        options: {
          getString: (name: string) => ({ name: 'Fatigue', type: 'Health', description: 'Too tired in the morning' } as any)[name]
        },
        reply: jest.fn()
      };

      const user: User = { id: 'n1', discordId: 'u1', name: 'marc', timezone: 'EU', bestTime: '09:00', trustCount: 0 };
      const habit: Habit = { id: 'h1', userId: 'n1', name: 'Meditation', domains: ['Mindset'], frequency: 7, context: 'Morning', difficulty: 'Medium', smartGoal: '10 min', why: 'Focus', minimalDose: '2 min', habitLoop: 'cue', implementationIntentions: 'if-then', hurdles: 'tired', reminderType: 'calendar' };
      const hurdle: Hurdle = { id: 'hd1', userId: 'n1', habitId: 'h1', name: 'Fatigue', hurdleType: 'Health', description: 'Too tired in the morning', date: '2024-01-01' };

      mockNotion.getUserByDiscordId.mockResolvedValue(user);
      mockNotion.getHabitsByUserId.mockResolvedValue([habit]);
      mockNotion.createHurdle.mockResolvedValue(hurdle);

      await handler.handleHurdles(mockInteraction);

      expect(mockNotion.createHurdle).toHaveBeenCalled();
      expect(mockChannelHandlers.postToHurdlesChannel).toHaveBeenCalledWith('Fatigue', 'Too tired in the morning', 'Health', 'marc');
      expect(mockInteraction.reply).toHaveBeenCalledWith(expect.objectContaining({ content: expect.stringContaining('Hurdle Documented'), ephemeral: false }));
    });

    it('asks user to join if not registered', async () => {
      const mockInteraction: any = { isChatInputCommand: () => true, user: { id: 'u1' }, options: { getString: jest.fn().mockReturnValue('x') }, reply: jest.fn() };
      mockNotion.getUserByDiscordId.mockResolvedValue(null);
      await handler.handleHurdles(mockInteraction);
      expect(mockInteraction.reply).toHaveBeenCalledWith(expect.objectContaining({ content: expect.stringContaining('/join'), ephemeral: true }));
    });
  });
});
