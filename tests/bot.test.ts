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
    mockLogger = {
      info: jest.fn().mockResolvedValue(undefined),
      success: jest.fn().mockResolvedValue(undefined),
      error: jest.fn().mockResolvedValue(undefined),
      warning: jest.fn().mockResolvedValue(undefined),
      logError: jest.fn().mockResolvedValue(undefined)
    };
    commandHandler = new CommandHandler(mockNotion, mockChannelHandlers, mockPersonalChannelManager, mockLogger);
  });

  describe('handleJoin', () => {
    it('should create new user if not exists', async () => {
      const mockInteraction = {
        user: { id: '123', username: 'testuser' },
        guild: { 
          id: 'guild-123',
          name: 'Test Guild',
          roles: {
            everyone: { id: 'everyone-123' }
          },
          channels: {
            cache: {
              find: jest.fn().mockReturnValue(null)
            },
            create: jest.fn().mockResolvedValue({
              id: 'channel-123',
              name: 'personal-testuser',
              send: jest.fn().mockResolvedValue(undefined)
            })
          }
        },
        channelId: 'test-channel-123',
        channel: { id: 'test-channel-123', name: 'test-channel' },
        reply: jest.fn(),
        deferReply: jest.fn().mockResolvedValue(undefined),
        editReply: jest.fn().mockResolvedValue(undefined),
        deferred: false
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
        personalChannelId: 'channel-123',
        status: 'active'
      });
      expect(mockInteraction.deferReply).toHaveBeenCalledWith({ ephemeral: false });
      expect(mockInteraction.editReply).toHaveBeenCalledWith(expect.objectContaining({
        content: expect.stringContaining('Welcome to the Habit System')
      }));
    });

    it('should handle existing user', async () => {
      const mockInteraction = {
        user: { id: '123', username: 'testuser' },
        guild: { 
          id: 'guild-123',
          name: 'Test Guild'
        },
        channelId: 'test-channel-123',
        channel: { id: 'test-channel-123', name: 'test-channel' },
        reply: jest.fn(),
        deferReply: jest.fn().mockResolvedValue(undefined),
        editReply: jest.fn().mockResolvedValue(undefined),
        deferred: false
      };

      const existingUser = {
        id: 'user-123',
        discordId: '123',
        name: 'testuser',
        timezone: 'Europe/Berlin',
        bestTime: '09:00',
        trustCount: 5,
        personalChannelId: 'existing-channel-123',
        status: 'active' as const
      };

      mockNotion.getUserByDiscordId.mockResolvedValue(existingUser);

      await commandHandler.handleJoin(mockInteraction as any);

      expect(mockNotion.getUserByDiscordId).toHaveBeenCalledWith('123');
      expect(mockNotion.createUser).not.toHaveBeenCalled();
      expect(mockNotion.updateUser).not.toHaveBeenCalled();
      expect(mockInteraction.deferReply).toHaveBeenCalledWith({ ephemeral: false });
      expect(mockInteraction.editReply).toHaveBeenCalledWith(expect.objectContaining({
        content: expect.stringContaining('Welcome back')
      }));
    });

    it('should activate existing paused user when joining', async () => {
      const mockInteraction = {
        user: { id: '123', username: 'testuser' },
        guild: { 
          id: 'guild-123',
          name: 'Test Guild'
        },
        channelId: 'test-channel-123',
        channel: { id: 'test-channel-123', name: 'test-channel' },
        reply: jest.fn(),
        deferReply: jest.fn().mockResolvedValue(undefined),
        editReply: jest.fn().mockResolvedValue(undefined),
        deferred: false
      };

      const pausedUser = {
        id: 'user-123',
        discordId: '123',
        name: 'testuser',
        timezone: 'Europe/Berlin',
        bestTime: '09:00',
        trustCount: 5,
        personalChannelId: 'existing-channel-123',
        status: 'pause' as const
      };

      const activatedUser = {
        ...pausedUser,
        status: 'active' as const
      };

      mockNotion.getUserByDiscordId.mockResolvedValue(pausedUser);
      mockNotion.updateUser.mockResolvedValue(activatedUser);

      await commandHandler.handleJoin(mockInteraction as any);

      expect(mockNotion.getUserByDiscordId).toHaveBeenCalledWith('123');
      expect(mockNotion.updateUser).toHaveBeenCalledWith('user-123', { status: 'active' });
      expect(mockNotion.createUser).not.toHaveBeenCalled();
      expect(mockInteraction.deferReply).toHaveBeenCalledWith({ ephemeral: false });
      expect(mockInteraction.editReply).toHaveBeenCalledWith(expect.objectContaining({
        content: expect.stringContaining('Status Updated')
      }));
    });

    it('should set status to active for new users', async () => {
      const mockInteraction = {
        user: { id: '123', username: 'testuser' },
        guild: { 
          id: 'guild-123',
          name: 'Test Guild',
          roles: {
            everyone: { id: 'everyone-123' }
          },
          channels: {
            cache: {
              find: jest.fn().mockReturnValue(null)
            },
            create: jest.fn().mockResolvedValue({
              id: 'channel-123',
              name: 'personal-testuser',
              send: jest.fn().mockResolvedValue(undefined)
            })
          }
        },
        channelId: 'test-channel-123',
        channel: { id: 'test-channel-123', name: 'test-channel' },
        reply: jest.fn(),
        deferReply: jest.fn().mockResolvedValue(undefined),
        editReply: jest.fn().mockResolvedValue(undefined),
        deferred: false
      };

      mockNotion.getUserByDiscordId.mockResolvedValue(null);
      mockNotion.createUser.mockResolvedValue({
        id: 'user-123',
        discordId: '123',
        name: 'testuser',
        timezone: 'Europe/Berlin',
        bestTime: '09:00',
        trustCount: 0,
        personalChannelId: 'channel-123',
        status: 'active'
      });

      mockPersonalChannelManager.createPersonalChannel.mockResolvedValue('channel-123');

      await commandHandler.handleJoin(mockInteraction as any);

      expect(mockNotion.createUser).toHaveBeenCalledWith({
        discordId: '123',
        name: 'testuser',
        timezone: 'Europe/Berlin',
        bestTime: '09:00',
        trustCount: 0,
        personalChannelId: 'channel-123',
        status: 'active'
      });
    });
  });

  describe('handlePause', () => {
    it('should pause user and update status to pause', async () => {
      const mockInteraction = {
        user: { id: '123', username: 'testuser' },
        guild: { id: 'guild-123' },
        channelId: 'personal-testuser',
        channel: { id: 'personal-testuser', name: 'personal-testuser' },
        options: {
          getString: jest.fn((name: string) => {
            if (name === 'reason') return 'Taking a break';
            if (name === 'duration') return '2 weeks';
            return null;
          })
        },
        deferReply: jest.fn().mockResolvedValue(undefined),
        editReply: jest.fn().mockResolvedValue(undefined),
        deferred: false
      };

      const existingUser = {
        id: 'user-123',
        discordId: '123',
        name: 'testuser',
        timezone: 'Europe/Berlin',
        bestTime: '09:00',
        trustCount: 0,
        personalChannelId: 'personal-testuser',
        status: 'active' as const
      };

      const pausedUser = {
        ...existingUser,
        status: 'pause' as const
      };

      // Mock isPersonalChannel to return true
      jest.spyOn(commandHandler as any, 'isPersonalChannel').mockResolvedValue(true);

      mockNotion.getUserByDiscordId.mockResolvedValue(existingUser);
      mockNotion.updateUser.mockResolvedValue(pausedUser);

      await commandHandler.handlePause(mockInteraction as any);

      expect(mockNotion.getUserByDiscordId).toHaveBeenCalledWith('123');
      expect(mockNotion.updateUser).toHaveBeenCalledWith('user-123', { status: 'pause' });
      expect(mockInteraction.deferReply).toHaveBeenCalledWith({ ephemeral: true });
      expect(mockInteraction.editReply).toHaveBeenCalledWith(expect.objectContaining({
        content: expect.stringContaining('Pause Activated')
      }));
    });

    it('should require reason for pause', async () => {
      const mockInteraction = {
        user: { id: '123', username: 'testuser' },
        guild: { id: 'guild-123' },
        channelId: 'personal-testuser',
        channel: { id: 'personal-testuser', name: 'personal-testuser' },
        options: {
          getString: jest.fn((name: string) => {
            if (name === 'reason') return null;
            return null;
          })
        },
        deferReply: jest.fn().mockResolvedValue(undefined),
        editReply: jest.fn().mockResolvedValue(undefined),
        deferred: false
      };

      const existingUser = {
        id: 'user-123',
        discordId: '123',
        name: 'testuser',
        timezone: 'Europe/Berlin',
        bestTime: '09:00',
        trustCount: 0,
        personalChannelId: 'personal-testuser',
        status: 'active' as const
      };

      jest.spyOn(commandHandler as any, 'isPersonalChannel').mockResolvedValue(true);
      mockNotion.getUserByDiscordId.mockResolvedValue(existingUser);

      await commandHandler.handlePause(mockInteraction as any);

      expect(mockNotion.updateUser).not.toHaveBeenCalled();
      expect(mockInteraction.editReply).toHaveBeenCalledWith(expect.objectContaining({
        content: expect.stringContaining('Please provide a reason')
      }));
    });

    it('should only work in personal channel', async () => {
      const mockInteraction = {
        user: { id: '123', username: 'testuser' },
        guild: { id: 'guild-123' },
        channelId: 'general-channel',
        channel: { id: 'general-channel', name: 'general' },
        options: {
          getString: jest.fn((name: string) => {
            if (name === 'reason') return 'Test reason';
            return null;
          })
        },
        deferReply: jest.fn().mockResolvedValue(undefined),
        editReply: jest.fn().mockResolvedValue(undefined),
        deferred: false
      };

      const existingUser = {
        id: 'user-123',
        discordId: '123',
        name: 'testuser',
        timezone: 'Europe/Berlin',
        bestTime: '09:00',
        trustCount: 0,
        personalChannelId: 'personal-testuser',
        status: 'active' as const
      };

      jest.spyOn(commandHandler as any, 'isPersonalChannel').mockResolvedValue(false);
      mockNotion.getUserByDiscordId.mockResolvedValue(existingUser);

      await commandHandler.handlePause(mockInteraction as any);

      expect(mockNotion.updateUser).not.toHaveBeenCalled();
      expect(mockInteraction.editReply).toHaveBeenCalledWith(expect.objectContaining({
        content: expect.stringContaining('only be used in your personal channel')
      }));
    });
  });

  describe('handleActivate', () => {
    it('should activate user and update status to active', async () => {
      const mockInteraction = {
        user: { id: '123', username: 'testuser' },
        guild: { id: 'guild-123' },
        channelId: 'personal-testuser',
        channel: { id: 'personal-testuser', name: 'personal-testuser' },
        deferReply: jest.fn().mockResolvedValue(undefined),
        editReply: jest.fn().mockResolvedValue(undefined),
        deferred: false
      };

      const pausedUser = {
        id: 'user-123',
        discordId: '123',
        name: 'testuser',
        timezone: 'Europe/Berlin',
        bestTime: '09:00',
        trustCount: 0,
        personalChannelId: 'personal-testuser',
        status: 'pause' as const
      };

      const activatedUser = {
        ...pausedUser,
        status: 'active' as const
      };

      jest.spyOn(commandHandler as any, 'isPersonalChannel').mockResolvedValue(true);
      mockNotion.getUserByDiscordId.mockResolvedValue(pausedUser);
      mockNotion.updateUser.mockResolvedValue(activatedUser);

      await commandHandler.handleActivate(mockInteraction as any);

      expect(mockNotion.getUserByDiscordId).toHaveBeenCalledWith('123');
      expect(mockNotion.updateUser).toHaveBeenCalledWith('user-123', { status: 'active' });
      expect(mockInteraction.deferReply).toHaveBeenCalledWith({ ephemeral: true });
      expect(mockInteraction.editReply).toHaveBeenCalledWith(expect.objectContaining({
        content: expect.stringContaining('Activated')
      }));
    });

    it('should only work in personal channel', async () => {
      const mockInteraction = {
        user: { id: '123', username: 'testuser' },
        guild: { id: 'guild-123' },
        channelId: 'general-channel',
        channel: { id: 'general-channel', name: 'general' },
        deferReply: jest.fn().mockResolvedValue(undefined),
        editReply: jest.fn().mockResolvedValue(undefined),
        deferred: false
      };

      const pausedUser = {
        id: 'user-123',
        discordId: '123',
        name: 'testuser',
        timezone: 'Europe/Berlin',
        bestTime: '09:00',
        trustCount: 0,
        personalChannelId: 'personal-testuser',
        status: 'pause' as const
      };

      jest.spyOn(commandHandler as any, 'isPersonalChannel').mockResolvedValue(false);
      mockNotion.getUserByDiscordId.mockResolvedValue(pausedUser);

      await commandHandler.handleActivate(mockInteraction as any);

      expect(mockNotion.updateUser).not.toHaveBeenCalled();
      expect(mockInteraction.editReply).toHaveBeenCalledWith(expect.objectContaining({
        content: expect.stringContaining('only be used in your personal channel')
      }));
    });

    it('should handle user not found', async () => {
      const mockInteraction = {
        user: { id: '123', username: 'testuser' },
        guild: { id: 'guild-123' },
        channelId: 'personal-testuser',
        channel: { id: 'personal-testuser', name: 'personal-testuser' },
        deferReply: jest.fn().mockResolvedValue(undefined),
        editReply: jest.fn().mockResolvedValue(undefined),
        deferred: false
      };

      jest.spyOn(commandHandler as any, 'isPersonalChannel').mockResolvedValue(true);
      mockNotion.getUserByDiscordId.mockResolvedValue(null);

      await commandHandler.handleActivate(mockInteraction as any);

      expect(mockNotion.updateUser).not.toHaveBeenCalled();
      expect(mockInteraction.editReply).toHaveBeenCalledWith(expect.objectContaining({
        content: expect.stringContaining('User not found')
      }));
    });
  });
});
