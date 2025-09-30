import { PersonalAssistant } from '../src/bot/personal-assistant';
import { NotionClient } from '../src/notion/client';
import { DiscordLogger } from '../src/bot/discord-logger';

// Mock Discord.js
jest.mock('discord.js', () => ({
  Client: jest.fn(),
  Message: jest.fn(),
  TextChannel: jest.fn()
}));

// Mock Notion client
jest.mock('../src/notion/client');

describe('PersonalAssistant', () => {
  let mockClient: any;
  let mockNotion: jest.Mocked<NotionClient>;
  let mockLogger: any;
  let assistant: PersonalAssistant;

  beforeEach(() => {
    mockClient = {
      channels: {
        cache: {
          get: jest.fn()
        }
      }
    };

    mockNotion = new NotionClient('', {}) as jest.Mocked<NotionClient>;

    mockLogger = {
      info: jest.fn().mockResolvedValue(undefined),
      success: jest.fn().mockResolvedValue(undefined),
      error: jest.fn().mockResolvedValue(undefined),
      warning: jest.fn().mockResolvedValue(undefined),
      logError: jest.fn().mockResolvedValue(undefined)
    };

    assistant = new PersonalAssistant(mockClient, mockNotion, mockLogger);
  });

  describe('handlePersonalChannelMessage', () => {
    it('should not handle messages outside personal channels', async () => {
      const mockMessage = {
        author: { bot: false },
        channel: { name: 'general' },
        content: 'hello'
      } as any;

      const result = await assistant.handlePersonalChannelMessage(mockMessage);
      expect(result).toBe(false);
    });

    it('should not handle bot messages', async () => {
      const mockMessage = {
        author: { bot: true },
        channel: { name: 'personal-test' },
        content: 'hello'
      } as any;

      const result = await assistant.handlePersonalChannelMessage(mockMessage);
      expect(result).toBe(false);
    });

    it('should handle greetings in personal channels', async () => {
      const mockChannel = {
        send: jest.fn().mockResolvedValue(undefined)
      };

      const mockMessage = {
        author: { bot: false, username: 'testuser' },
        channel: { ...mockChannel, name: 'personal-testuser' },
        channelId: 'test-channel',
        guild: { id: 'test-guild' },
        content: 'hello there'
      } as any;

      const result = await assistant.handlePersonalChannelMessage(mockMessage);
      expect(result).toBe(true);
      expect(mockChannel.send).toHaveBeenCalled();
      expect(mockLogger.info).toHaveBeenCalledWith(
        'PERSONAL_ASSISTANT',
        'Greeting Response',
        expect.stringContaining('testuser'),
        expect.objectContaining({
          channelId: 'test-channel',
          responseType: 'greeting'
        }),
        expect.objectContaining({
          channelId: 'test-channel',
          userId: undefined,
          guildId: 'test-guild'
        })
      );
    });

    it('should handle questions in personal channels', async () => {
      const mockChannel = {
        send: jest.fn().mockResolvedValue(undefined)
      };

      const mockMessage = {
        author: { bot: false, username: 'testuser' },
        channel: { ...mockChannel, name: 'personal-testuser' },
        channelId: 'test-channel',
        guild: { id: 'test-guild' },
        content: 'how do I create a habit?'
      } as any;

      const result = await assistant.handlePersonalChannelMessage(mockMessage);
      expect(result).toBe(true);
      expect(mockChannel.send).toHaveBeenCalled();
      expect(mockLogger.info).toHaveBeenCalledWith(
        'PERSONAL_ASSISTANT',
        'Question Response',
        expect.stringContaining('testuser'),
        expect.objectContaining({
          responseType: 'question'
        }),
        expect.any(Object)
      );
    });

    it('should handle mood checks in personal channels', async () => {
      const mockChannel = {
        send: jest.fn().mockResolvedValue(undefined)
      };

      const mockMessage = {
        author: { bot: false, username: 'testuser' },
        channel: { ...mockChannel, name: 'personal-testuser' },
        channelId: 'test-channel',
        guild: { id: 'test-guild' },
        content: 'I am feeling tired today'
      } as any;

      const result = await assistant.handlePersonalChannelMessage(mockMessage);
      expect(result).toBe(true);
      expect(mockChannel.send).toHaveBeenCalled();
      expect(mockLogger.info).toHaveBeenCalledWith(
        'PERSONAL_ASSISTANT',
        'Mood Check Response',
        expect.stringContaining('testuser'),
        expect.objectContaining({
          responseType: 'mood_check'
        }),
        expect.any(Object)
      );
    });

    it('should handle progress updates in personal channels', async () => {
      const mockChannel = {
        send: jest.fn().mockResolvedValue(undefined)
      };

      const mockMessage = {
        author: { bot: false, username: 'testuser' },
        channel: { ...mockChannel, name: 'personal-testuser' },
        channelId: 'test-channel',
        guild: { id: 'test-guild' },
        content: 'I made great progress today!'
      } as any;

      const result = await assistant.handlePersonalChannelMessage(mockMessage);
      expect(result).toBe(true);
      expect(mockChannel.send).toHaveBeenCalled();
      expect(mockLogger.info).toHaveBeenCalledWith(
        'PERSONAL_ASSISTANT',
        'Progress Update Response',
        expect.stringContaining('testuser'),
        expect.objectContaining({
          responseType: 'progress_update'
        }),
        expect.any(Object)
      );
    });
  });

  describe('sendPersonalRecommendation', () => {
    it('should send recommendation to valid channel', async () => {
      const mockChannel = {
        send: jest.fn().mockResolvedValue(undefined)
      };

      mockClient.channels.cache.get.mockReturnValue(mockChannel);

      await assistant.sendPersonalRecommendation('user123', 'channel123', 'Test recommendation');

      expect(mockChannel.send).toHaveBeenCalledWith('Test recommendation');
      expect(mockLogger.info).toHaveBeenCalledWith(
        'PERSONAL_ASSISTANT',
        'Proactive Recommendation',
        expect.stringContaining('user123'),
        expect.objectContaining({
          channelId: 'channel123',
          recommendationType: 'proactive'
        }),
        expect.objectContaining({
          channelId: 'channel123',
          userId: 'user123'
        })
      );
    });

    it('should handle missing channel gracefully', async () => {
      mockClient.channels.cache.get.mockReturnValue(null);

      await assistant.sendPersonalRecommendation('user123', 'nonexistent', 'Test recommendation');

      expect(mockLogger.info).not.toHaveBeenCalled();
    });
  });
});
