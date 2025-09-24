import { NotionClient } from '../src/notion/client';
import { CommandHandler } from '../src/bot/commands';

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

  beforeEach(() => {
    mockNotion = new NotionClient('', {}) as jest.Mocked<NotionClient>;
    commandHandler = new CommandHandler(mockNotion);
  });

  describe('handleJoin', () => {
    it('should create new user if not exists', async () => {
      const mockInteraction = {
        user: { id: '123', username: 'testuser' },
        reply: jest.fn()
      };

      mockNotion.getUserByDiscordId.mockResolvedValue(null);
      mockNotion.createUser.mockResolvedValue({
        id: 'user-123',
        discordId: '123',
        name: 'testuser',
        timezone: 'Europe/Berlin',
        bestTime: '09:00',
        trustCount: 0
      });

      await commandHandler.handleJoin(mockInteraction as any);

      expect(mockNotion.getUserByDiscordId).toHaveBeenCalledWith('123');
      expect(mockNotion.createUser).toHaveBeenCalledWith({
        discordId: '123',
        name: 'testuser',
        timezone: 'Europe/Berlin',
        bestTime: '09:00',
        trustCount: 0
      });
      expect(mockInteraction.reply).toHaveBeenCalledWith({
        content: 'Welcome to the habit system, testuser! Use `/habit add` to create your first keystone habit.',
        ephemeral: true
      });
    });

    it('should handle existing user', async () => {
      const mockInteraction = {
        user: { id: '123', username: 'testuser' },
        reply: jest.fn()
      };

      const existingUser = {
        id: 'user-123',
        discordId: '123',
        name: 'testuser',
        timezone: 'Europe/Berlin',
        bestTime: '09:00',
        trustCount: 5
      };

      mockNotion.getUserByDiscordId.mockResolvedValue(existingUser);

      await commandHandler.handleJoin(mockInteraction as any);

      expect(mockNotion.getUserByDiscordId).toHaveBeenCalledWith('123');
      expect(mockNotion.createUser).not.toHaveBeenCalled();
      expect(mockInteraction.reply).toHaveBeenCalledWith({
        content: 'Welcome to the habit system, testuser! Use `/habit add` to create your first keystone habit.',
        ephemeral: true
      });
    });
  });
});