import { NotionClient } from '../src/notion/client';
import { CommandHandler } from '../src/bot/commands';
import { ChannelHandlers } from '../src/bot/channel-handlers';

// Mock Discord.js
jest.mock('discord.js', () => ({
  SlashCommandBuilder: jest.fn(),
  CommandInteraction: jest.fn(),
  AttachmentBuilder: jest.fn()
}));

// Mock Notion client
jest.mock('../src/notion/client');

describe('CommandHandler', () => {
  let mockNotion: jest.Mocked<NotionClient>;
  let commandHandler: CommandHandler;
  let mockChannelHandlers: jest.Mocked<ChannelHandlers>;
  let mockPersonalChannelManager: any;

  beforeEach(() => {
    mockNotion = new NotionClient('', {}) as jest.Mocked<NotionClient>;
    mockChannelHandlers = {
      postToLearningsChannel: jest.fn(),
      postWeeklyReview: jest.fn(),
      postDailyReminder: jest.fn(),
      postGroupEncouragement: jest.fn(),
      handleProofReaction: jest.fn(),
      postDonationPoolUpdate: jest.fn(),
      postInfoLog: jest.fn()
    } as unknown as jest.Mocked<ChannelHandlers>;

    mockPersonalChannelManager = {
      createPersonalChannel: jest.fn(),
      getPersonalChannel: jest.fn(),
      sendPersonalMessage: jest.fn(),
      sendWelcomeMessage: jest.fn(),
      client: {} as any,
      notion: mockNotion
    } as any;
    commandHandler = new CommandHandler(mockNotion, mockChannelHandlers, mockPersonalChannelManager);
  });

  describe('handleJoin', () => {
    it('should create new user if not exists', async () => {
      const mockInteraction = {
        user: { id: '123', username: 'testuser' },
        guild: { id: 'guild-123' },
        reply: jest.fn()
      };

      mockNotion.getUserByDiscordId.mockResolvedValue(null);
      mockNotion.createUser.mockResolvedValue({
        id: 'user-123',
        discordId: '123',
        name: 'testuser',
        timezone: 'Europe/Berlin',
        bestTime: '09:00',
        trustCount: 0,
        personalChannelId: 'channel-123'
      });

      // Mock the personal channel manager
      mockPersonalChannelManager.createPersonalChannel.mockResolvedValue('channel-123');

      await commandHandler.handleJoin(mockInteraction as any);

      expect(mockNotion.getUserByDiscordId).toHaveBeenCalledWith('123');
      expect(mockNotion.createUser).toHaveBeenCalledWith({
        discordId: '123',
        name: 'testuser',
        timezone: 'Europe/Berlin',
        bestTime: '09:00',
        trustCount: 0,
        personalChannelId: 'channel-123'
      });
      expect(mockInteraction.reply).toHaveBeenCalledWith(expect.objectContaining({
        content: expect.stringContaining('Welcome to the Habit System'),
        ephemeral: false
      }));
    });

    it('should handle existing user', async () => {
      const mockInteraction = {
        user: { id: '123', username: 'testuser' },
        guild: { id: 'guild-123' },
        reply: jest.fn()
      };

      const existingUser = {
        id: 'user-123',
        discordId: '123',
        name: 'testuser',
        timezone: 'Europe/Berlin',
        bestTime: '09:00',
        trustCount: 5,
        personalChannelId: 'existing-channel-123'
      };

      mockNotion.getUserByDiscordId.mockResolvedValue(existingUser);

      await commandHandler.handleJoin(mockInteraction as any);

      expect(mockNotion.getUserByDiscordId).toHaveBeenCalledWith('123');
      expect(mockNotion.createUser).not.toHaveBeenCalled();
      expect(mockInteraction.reply).toHaveBeenCalledWith(expect.objectContaining({
        content: expect.stringContaining('Welcome to the Habit System'),
        ephemeral: false
      }));
    });
  });
});
