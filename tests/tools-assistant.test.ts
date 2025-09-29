import { ToolsAssistant } from '../src/bot/tools-assistant';
import { ToolboxEngine, formatToolboxReply, HabitTool } from '../src/toolbox';
import { DEFAULT_TOOLS } from '../src/toolbox/tools';
import { NotionClient } from '../src/notion/client';
import { User, Learning } from '../src/types';
import { Client, Message, TextChannel } from 'discord.js';

// Mock Discord.js
jest.mock('discord.js', () => ({
  Client: jest.fn().mockImplementation(() => ({
    channels: {
      cache: {
        get: jest.fn()
      }
    }
  })),
  Message: jest.fn(),
  TextChannel: jest.fn()
}));

// Mock Notion client
jest.mock('../src/notion/client');

describe('ToolsAssistant', () => {
  let mockClient: jest.Mocked<Client>;
  let mockNotion: jest.Mocked<NotionClient>;
  let toolsAssistant: ToolsAssistant;
  let mockChannel: jest.Mocked<TextChannel>;

  beforeEach(() => {
    // Set up environment variable
    process.env.DISCORD_TOOLS = '1420517654300725319';
    
    mockClient = {
      channels: {
        cache: {
          get: jest.fn().mockReturnValue(undefined)
        }
      }
    } as unknown as jest.Mocked<Client>;

    mockNotion = new NotionClient('', {}) as jest.Mocked<NotionClient>;
    mockChannel = {
      send: jest.fn()
    } as unknown as jest.Mocked<TextChannel>;

    (mockClient.channels.cache.get as jest.Mock).mockReturnValue(mockChannel);

    toolsAssistant = new ToolsAssistant(mockClient, mockNotion);
  });

  afterEach(() => {
    delete process.env.DISCORD_TOOLS;
  });

  describe('handleMessage', () => {
    it('should respond with tool suggestions for time-related problems', async () => {
      const mockMessage = {
        author: { id: '123', bot: false },
        channelId: '1420517654300725319',
        content: 'i have the problem that i dont have time'
      } as unknown as Message;

      await toolsAssistant.handleMessage(mockMessage);

      expect(mockChannel.send).toHaveBeenCalledWith(
        expect.stringContaining('🤖 **Toolbox Suggestions**')
      );
      expect(mockChannel.send).toHaveBeenCalledWith(
        expect.stringContaining('Time Boxing')
      );
    });

    it('should respond with tool suggestions for focus-related problems', async () => {
      const mockMessage = {
        author: { id: '123', bot: false },
        channelId: '1420517654300725319',
        content: 'i get distracted easily'
      } as unknown as Message;

      await toolsAssistant.handleMessage(mockMessage);

      expect(mockChannel.send).toHaveBeenCalledWith(
        expect.stringContaining('🤖 **Toolbox Suggestions**')
      );
      expect(mockChannel.send).toHaveBeenCalledWith(
        expect.stringContaining('Deep Work Sprint')
      );
    });

    it('should respond with tool suggestions for routine-related problems', async () => {
      const mockMessage = {
        author: { id: '123', bot: false },
        channelId: '1420517654300725319',
        content: 'i forget to do my habits'
      } as unknown as Message;

      await toolsAssistant.handleMessage(mockMessage);

      expect(mockChannel.send).toHaveBeenCalledWith(
        expect.stringContaining('🤖 **Toolbox Suggestions**')
      );
      expect(mockChannel.send).toHaveBeenCalledWith(
        expect.stringContaining('Habit Stacking')
      );
    });

    it('should not respond if channel ID does not match', async () => {
      const mockMessage = {
        author: { id: '123', bot: false },
        channelId: 'different-channel-id',
        content: 'i have a problem'
      } as unknown as Message;

      await toolsAssistant.handleMessage(mockMessage);

      expect(mockChannel.send).not.toHaveBeenCalled();
    });

    it('should not respond if message is from a bot', async () => {
      const mockMessage = {
        author: { id: '123', bot: true },
        channelId: '1420517654300725319',
        content: 'i have a problem'
      } as unknown as Message;

      await toolsAssistant.handleMessage(mockMessage);

      expect(mockChannel.send).not.toHaveBeenCalled();
    });

    it('should not respond if DISCORD_TOOLS is not set', async () => {
      delete process.env.DISCORD_TOOLS;
      toolsAssistant = new ToolsAssistant(mockClient, mockNotion);

      const mockMessage = {
        author: { id: '123', bot: false },
        channelId: '1420517654300725319',
        content: 'i have a problem'
      } as unknown as Message;

      await toolsAssistant.handleMessage(mockMessage);

      expect(mockChannel.send).not.toHaveBeenCalled();
    });

    it('should handle empty message content', async () => {
      const mockMessage = {
        author: { id: '123', bot: false },
        channelId: '1420517654300725319',
        content: '   '
      } as unknown as Message;

      await toolsAssistant.handleMessage(mockMessage);

      expect(mockChannel.send).not.toHaveBeenCalled();
    });

    it('should log learning to Notion when user exists', async () => {
      const mockMessage = {
        author: { id: '123', bot: false },
        channelId: '1420517654300725319',
        content: 'i have the problem that i dont have time'
      } as unknown as Message;

      const mockUser: User = {
        id: 'user-123',
        discordId: '123',
        name: 'testuser',
        timezone: 'Europe/Berlin',
        bestTime: '09:00',
        trustCount: 0
      };

      const mockLearning: Learning = {
        id: 'learning-123',
        userId: 'user-123',
        habitId: 'user-123',
        text: 'Tool suggestion: Time Boxing — Block specific time slots to guarantee a start.',
        createdAt: '2024-01-01T00:00:00.000Z'
      };

      mockNotion.getUserByDiscordId.mockResolvedValue(mockUser);
      mockNotion.createLearning.mockResolvedValue(mockLearning);

      await toolsAssistant.handleMessage(mockMessage);

      expect(mockNotion.getUserByDiscordId).toHaveBeenCalledWith('123');
      expect(mockNotion.createLearning).toHaveBeenCalledWith({
        userId: 'user-123',
        habitId: 'user-123',
        discordId: '123',
        text: expect.stringContaining('Tool suggestion:'),
        createdAt: expect.any(String)
      });
    });
  });
});

describe('ToolboxEngine', () => {
  let engine: ToolboxEngine;

  beforeEach(() => {
    engine = new ToolboxEngine(DEFAULT_TOOLS);
  });

  describe('matchTools', () => {
    it('should match time-related problems to Time Boxing', () => {
      const matches = engine.matchTools('i dont have time', 3);
      
      expect(matches.length).toBeGreaterThan(0);
      expect(matches[0].tool.name).toBe('Time Boxing');
      expect(matches[0].score).toBeGreaterThan(0);
    });

    it('should match focus-related problems to Deep Work Sprint', () => {
      const matches = engine.matchTools('i get distracted', 3);
      
      expect(matches.length).toBeGreaterThan(0);
      expect(matches[0].tool.name).toBe('Deep Work Sprint');
      expect(matches[0].score).toBeGreaterThan(0);
    });

    it('should match routine-related problems to Habit Stacking', () => {
      const matches = engine.matchTools('i forget to do it', 3);
      
      expect(matches.length).toBeGreaterThan(0);
      expect(matches[0].tool.name).toBe('Habit Stacking');
      expect(matches[0].score).toBeGreaterThan(0);
    });

    it('should return empty array for unrelated problems', () => {
      const matches = engine.matchTools('random gibberish xyz', 3);
      
      expect(matches).toHaveLength(0);
    });

    it('should limit results to specified number', () => {
      const matches = engine.matchTools('time focus routine', 2);
      
      expect(matches.length).toBeLessThanOrEqual(2);
    });
  });

  describe('addTools', () => {
    it('should add new tools to the engine', () => {
      const newTool: HabitTool = {
        id: 'test-tool',
        name: 'Test Tool',
        summary: 'A test tool',
        categories: ['test'],
        keywords: ['test'],
        problemPatterns: ['test problem'],
        whenToUse: ['When testing'],
        steps: ['Step 1', 'Step 2'],
        sources: []
      };

      engine.addTools([newTool]);
      const matches = engine.matchTools('test problem', 3);
      
      expect(matches.length).toBeGreaterThan(0);
      expect(matches[0].tool.name).toBe('Test Tool');
    });
  });
});

describe('formatToolboxReply', () => {
  it('should format reply with matches', () => {
    const matches = [
      {
        tool: {
          id: 'test-tool',
          name: 'Test Tool',
          summary: 'A test tool',
          categories: ['test'],
          keywords: ['test'],
          problemPatterns: ['test problem'],
          whenToUse: ['When testing'],
          steps: ['Step 1', 'Step 2'],
          sources: ['https://example.com']
        },
        score: 10
      }
    ];

    const reply = formatToolboxReply('test problem', matches);
    
    expect(reply).toContain('🤖 **Toolbox Suggestions**');
    expect(reply).toContain('📝 Your problem: test problem');
    expect(reply).toContain('🔧 **Test Tool** — A test tool');
    expect(reply).toContain('• When to use: When testing');
    expect(reply).toContain('• How to apply:');
    expect(reply).toContain('- Step 1');
    expect(reply).toContain('- Step 2');
    expect(reply).toContain('• Sources: https://example.com');
  });

  it('should format reply for no matches', () => {
    const reply = formatToolboxReply('unrelated problem', []);
    
    expect(reply).toContain('🧰 I couldn\'t map your problem to a tool yet');
    expect(reply).toContain('Try describing it with a bit more detail');
  });

  it('should handle tools without sources', () => {
    const matches = [
      {
        tool: {
          id: 'test-tool',
          name: 'Test Tool',
          summary: 'A test tool',
          categories: ['test'],
          keywords: ['test'],
          problemPatterns: ['test problem'],
          whenToUse: ['When testing'],
          steps: ['Step 1'],
          sources: []
        },
        score: 10
      }
    ];

    const reply = formatToolboxReply('test problem', matches);
    
    expect(reply).toContain('🔧 **Test Tool** — A test tool');
    expect(reply).not.toContain('• Sources:');
  });
});
