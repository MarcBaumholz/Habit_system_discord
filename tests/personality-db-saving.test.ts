import { CommandHandler } from '../src/bot/commands';
import { NotionClient } from '../src/notion/client';
import { ChannelHandlers } from '../src/bot/channel-handlers';

// Mock Discord.js
jest.mock('discord.js', () => {
  const actual = jest.requireActual('discord.js');
  return {
    ...actual,
    ModalBuilder: jest.fn().mockImplementation(() => ({
      setCustomId: jest.fn().mockReturnThis(),
      setTitle: jest.fn().mockReturnThis(),
      addComponents: jest.fn().mockReturnThis()
    })),
    TextInputBuilder: jest.fn().mockImplementation(() => ({
      setCustomId: jest.fn().mockReturnThis(),
      setLabel: jest.fn().mockReturnThis(),
      setStyle: jest.fn().mockReturnThis(),
      setPlaceholder: jest.fn().mockReturnThis(),
      setRequired: jest.fn().mockReturnThis()
    })),
    ActionRowBuilder: jest.fn().mockImplementation(() => ({
      addComponents: jest.fn().mockReturnThis()
    }))
  };
});

// Mock Notion client
jest.mock('../src/notion/client');

describe('Personality DB Saving - Modal Data Preservation', () => {
  let commandHandler: CommandHandler;
  let mockNotion: jest.Mocked<NotionClient>;
  let mockChannelHandlers: jest.Mocked<ChannelHandlers>;
  let mockPersonalChannelManager: any;
  let mockLogger: any;
  const discordId = '123456789';

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Setup Notion mock
    mockNotion = {
      getUserByDiscordId: jest.fn(),
      createUserProfile: jest.fn(),
      getUserProfileByDiscordId: jest.fn()
    } as unknown as jest.Mocked<NotionClient>;

    // Setup ChannelHandlers mock
    mockChannelHandlers = {
      postToLearningsChannel: jest.fn(),
      postWeeklyReview: jest.fn(),
      postDailyReminder: jest.fn(),
      postGroupEncouragement: jest.fn(),
      handleProofReaction: jest.fn(),
      postDonationPoolUpdate: jest.fn(),
      postInfoLog: jest.fn()
    } as unknown as jest.Mocked<ChannelHandlers>;

    // Setup PersonalChannelManager mock
    mockPersonalChannelManager = {
      createPersonalChannel: jest.fn(),
      getPersonalChannel: jest.fn(),
      sendPersonalMessage: jest.fn(),
      sendWelcomeMessage: jest.fn()
    };

    // Setup Logger mock
    mockLogger = {
      info: jest.fn().mockResolvedValue(undefined),
      success: jest.fn().mockResolvedValue(undefined),
      error: jest.fn().mockResolvedValue(undefined),
      warning: jest.fn().mockResolvedValue(undefined),
      logError: jest.fn().mockResolvedValue(undefined),
      logCommandInteraction: jest.fn().mockResolvedValue(undefined)
    };

    commandHandler = new CommandHandler(
      mockNotion,
      mockChannelHandlers,
      mockPersonalChannelManager,
      mockLogger
    );
  });

  describe('First Modal Data Storage', () => {
    it('should extract and store first modal data before showing second modal', async () => {
      // Mock user
      const mockUser = {
        id: 'user-123',
        discord_id: discordId,
        name: 'Test User'
      };
      mockNotion.getUserByDiscordId.mockResolvedValue(mockUser as any);

      // Mock first modal interaction
      const mockInteraction = {
        user: { id: discordId, username: 'testuser' },
        customId: 'onboard_modal',
        fields: {
          getTextInputValue: jest.fn((id: string) => {
            switch (id) {
              case 'personality_type':
                return 'INTJ';
              case 'core_values':
                return 'Freiheit, Gesundheit, Familie';
              case 'life_vision':
                return 'I want to achieve financial freedom and maintain good health';
              case 'main_goals':
                return 'Goal 1\nGoal 2\nGoal 3';
              case 'big_five':
                return '{"openness": 0.8, "conscientiousness": 0.9}';
              default:
                return '';
            }
          })
        },
        replied: false,
        deferred: false,
        showModal: jest.fn().mockResolvedValue(undefined)
      } as any;

      // Execute first modal submission
      await commandHandler.handleOnboardModalSubmit(mockInteraction);

      // Verify second modal was shown
      expect(mockInteraction.showModal).toHaveBeenCalled();

      // Verify data was stored in cache (check by trying to access it)
      // Since we can't directly access private properties, we'll verify by checking
      // that the second modal submission can retrieve the data
    });
  });

  describe('Complete Profile Creation with Both Modals', () => {
    it('should combine first and second modal data when creating profile', async () => {
      // Mock user
      const mockUser = {
        id: 'user-123',
        discord_id: discordId,
        name: 'Test User'
      };
      mockNotion.getUserByDiscordId.mockResolvedValue(mockUser as any);

      // Mock created profile
      const mockProfile = {
        id: 'profile-123',
        discordId: discordId,
        personalityType: 'INTJ',
        coreValues: ['Freiheit', 'Gesundheit', 'Familie'],
        lifeVision: 'Test vision',
        mainGoals: ['Goal 1', 'Goal 2'],
        bigFiveTraits: '{}',
        lifeDomains: ['Health', 'Career'],
        lifePhase: 'Early Career',
        desiredIdentity: 'Test identity',
        openSpace: 'Test notes'
      };
      mockNotion.createUserProfile.mockResolvedValue(mockProfile as any);

      // Step 1: Submit first modal to store data
      const firstModalInteraction = {
        user: { id: discordId, username: 'testuser' },
        customId: 'onboard_modal',
        fields: {
          getTextInputValue: jest.fn((id: string) => {
            switch (id) {
              case 'personality_type':
                return 'INTJ';
              case 'core_values':
                return 'Freiheit, Gesundheit, Familie';
              case 'life_vision':
                return 'I want to achieve financial freedom';
              case 'main_goals':
                return 'Goal 1\nGoal 2';
              case 'big_five':
                return '{"openness": 0.8}';
              default:
                return '';
            }
          })
        },
        replied: false,
        deferred: false,
        showModal: jest.fn().mockResolvedValue(undefined)
      } as any;

      await commandHandler.handleOnboardModalSubmit(firstModalInteraction);

      // Step 2: Submit second modal - this should retrieve stored data and create profile
      const secondModalInteraction = {
        user: { id: discordId, username: 'testuser' },
        customId: 'onboard_modal_2',
        fields: {
          getTextInputValue: jest.fn((id: string) => {
            switch (id) {
              case 'life_domains':
                return 'Health, Career, Relationships';
              case 'life_phase':
                return 'Early Career';
              case 'desired_identity':
                return 'I want to be a successful entrepreneur';
              case 'open_space':
                return 'Additional notes and thoughts';
              default:
                return '';
            }
          })
        },
        replied: false,
        deferred: false,
        deferReply: jest.fn().mockResolvedValue(undefined),
        reply: jest.fn().mockResolvedValue(undefined),
        editReply: jest.fn().mockResolvedValue(undefined),
        followUp: jest.fn().mockResolvedValue(undefined),
        guild: { id: 'guild-123' },
        channelId: 'channel-123'
      } as any;

      await commandHandler.handleFinalOnboardSubmission(secondModalInteraction);

      // Verify createUserProfile was called with complete data
      expect(mockNotion.createUserProfile).toHaveBeenCalledTimes(1);
      const createProfileCall = mockNotion.createUserProfile.mock.calls[0][0];

      // Verify first modal data is present
      expect(createProfileCall.personalityType).toBe('INTJ');
      expect(createProfileCall.coreValues).toEqual(['Freiheit', 'Gesundheit', 'Familie']);
      expect(createProfileCall.lifeVision).toBe('I want to achieve financial freedom');
      expect(createProfileCall.mainGoals).toEqual(['Goal 1', 'Goal 2']);
      expect(createProfileCall.bigFiveTraits).toBe('{"openness": 0.8}');

      // Verify second modal data is present
      expect(createProfileCall.lifeDomains).toEqual(['Health', 'Career', 'Relationships']);
      expect(createProfileCall.lifePhase).toBe('Early Career');
      expect(createProfileCall.desiredIdentity).toBe('I want to be a successful entrepreneur');
      expect(createProfileCall.openSpace).toBe('Additional notes and thoughts');

      // Verify auto-filled fields
      expect(createProfileCall.discordId).toBe(discordId);
      expect(createProfileCall.user).toEqual(mockUser);
      expect(createProfileCall.joinDate).toBeDefined();
    });

    it('should handle missing first modal data gracefully', async () => {
      // Mock user
      const mockUser = {
        id: 'user-123',
        discord_id: discordId,
        name: 'Test User'
      };
      mockNotion.getUserByDiscordId.mockResolvedValue(mockUser as any);

      // Submit second modal without first modal data (simulating expired/missing cache)
      const secondModalInteraction = {
        user: { id: discordId, username: 'testuser' },
        customId: 'onboard_modal_2',
        fields: {
          getTextInputValue: jest.fn((id: string) => {
            switch (id) {
              case 'life_domains':
                return 'Health, Career';
              case 'life_phase':
                return 'Early Career';
              default:
                return '';
            }
          })
        },
        replied: false,
        deferred: false,
        deferReply: jest.fn().mockResolvedValue(undefined),
        reply: jest.fn().mockResolvedValue(undefined),
        followUp: jest.fn().mockResolvedValue(undefined)
      } as any;

      await commandHandler.handleFinalOnboardSubmission(secondModalInteraction);

      // Verify createUserProfile was NOT called
      expect(mockNotion.createUserProfile).not.toHaveBeenCalled();

      // Verify error message was sent
      expect(secondModalInteraction.reply).toHaveBeenCalledWith(
        expect.objectContaining({
          content: expect.stringContaining('Erste Formulardaten nicht gefunden')
        })
      );
    });

    it('should clean up cache after successful profile creation', async () => {
      // Mock user
      const mockUser = {
        id: 'user-123',
        discord_id: discordId,
        name: 'Test User'
      };
      mockNotion.getUserByDiscordId.mockResolvedValue(mockUser as any);

      // Mock created profile
      const mockProfile = {
        id: 'profile-123',
        discordId: discordId
      };
      mockNotion.createUserProfile.mockResolvedValue(mockProfile as any);

      // Submit first modal
      const firstModalInteraction = {
        user: { id: discordId, username: 'testuser' },
        customId: 'onboard_modal',
        fields: {
          getTextInputValue: jest.fn((id: string) => {
            if (id === 'core_values') return 'Value1, Value2';
            if (id === 'life_vision') return 'Vision';
            if (id === 'main_goals') return 'Goal1';
            return '';
          })
        },
        replied: false,
        deferred: false,
        showModal: jest.fn().mockResolvedValue(undefined)
      } as any;

      await commandHandler.handleOnboardModalSubmit(firstModalInteraction);

      // Submit second modal
      const secondModalInteraction = {
        user: { id: discordId, username: 'testuser' },
        customId: 'onboard_modal_2',
        fields: {
          getTextInputValue: jest.fn(() => '')
        },
        replied: false,
        deferred: false,
        deferReply: jest.fn().mockResolvedValue(undefined),
        editReply: jest.fn().mockResolvedValue(undefined),
        guild: { id: 'guild-123' },
        channelId: 'channel-123'
      } as any;

      await commandHandler.handleFinalOnboardSubmission(secondModalInteraction);

      // Verify profile was created
      expect(mockNotion.createUserProfile).toHaveBeenCalled();

      // Try to submit second modal again - should fail because cache is cleared
      const secondModalInteraction2 = {
        user: { id: discordId, username: 'testuser' },
        customId: 'onboard_modal_2',
        fields: {
          getTextInputValue: jest.fn(() => '')
        },
        replied: false,
        deferred: false,
        deferReply: jest.fn().mockResolvedValue(undefined),
        reply: jest.fn().mockResolvedValue(undefined),
        followUp: jest.fn().mockResolvedValue(undefined)
      } as any;

      await commandHandler.handleFinalOnboardSubmission(secondModalInteraction2);

      // Should have called createUserProfile only once (from first submission)
      expect(mockNotion.createUserProfile).toHaveBeenCalledTimes(1);
      // Should have shown error message for missing data
      expect(secondModalInteraction2.reply).toHaveBeenCalledWith(
        expect.objectContaining({
          content: expect.stringContaining('Erste Formulardaten nicht gefunden')
        })
      );
    });
  });

  describe('Error Handling', () => {
    it('should clean up cache on database error', async () => {
      // Mock user
      const mockUser = {
        id: 'user-123',
        discord_id: discordId,
        name: 'Test User'
      };
      mockNotion.getUserByDiscordId.mockResolvedValue(mockUser as any);

      // Mock database error
      mockNotion.createUserProfile.mockRejectedValue(
        new Error('Could not find database with ID: xxx')
      );

      // Submit first modal
      const firstModalInteraction = {
        user: { id: discordId, username: 'testuser' },
        customId: 'onboard_modal',
        fields: {
          getTextInputValue: jest.fn((id: string) => {
            if (id === 'core_values') return 'Value1';
            if (id === 'life_vision') return 'Vision';
            if (id === 'main_goals') return 'Goal1';
            return '';
          })
        },
        replied: false,
        deferred: false,
        showModal: jest.fn().mockResolvedValue(undefined)
      } as any;

      await commandHandler.handleOnboardModalSubmit(firstModalInteraction);

      // Submit second modal - should trigger database error
      const secondModalInteraction = {
        user: { id: discordId, username: 'testuser' },
        customId: 'onboard_modal_2',
        fields: {
          getTextInputValue: jest.fn(() => '')
        },
        replied: false,
        deferred: false,
        deferReply: jest.fn().mockResolvedValue(undefined),
        reply: jest.fn().mockResolvedValue(undefined),
        followUp: jest.fn().mockResolvedValue(undefined),
        editReply: jest.fn().mockResolvedValue(undefined),
        guild: { id: 'guild-123' },
        channelId: 'channel-123'
      } as any;

      await commandHandler.handleFinalOnboardSubmission(secondModalInteraction);

      // Verify cache was cleaned up - try submitting again should fail
      const secondModalInteraction2 = {
        user: { id: discordId, username: 'testuser' },
        customId: 'onboard_modal_2',
        fields: {
          getTextInputValue: jest.fn(() => '')
        },
        replied: false,
        deferred: false,
        deferReply: jest.fn().mockResolvedValue(undefined),
        reply: jest.fn().mockResolvedValue(undefined),
        followUp: jest.fn().mockResolvedValue(undefined)
      } as any;

      await commandHandler.handleFinalOnboardSubmission(secondModalInteraction2);

      // Should show error about missing first modal data (cache was cleaned)
      expect(secondModalInteraction2.reply).toHaveBeenCalledWith(
        expect.objectContaining({
          content: expect.stringContaining('Erste Formulardaten nicht gefunden')
        })
      );
    });
  });
});

