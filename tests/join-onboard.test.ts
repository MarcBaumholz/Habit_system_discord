import { CommandHandler } from '../src/bot/commands';
import { NotionClient } from '../src/notion/client';
import { ChannelHandlers } from '../src/bot/channel-handlers';
import { PersonalChannelManager } from '../src/bot/personal-channel-manager';
import { DiscordLogger } from '../src/bot/discord-logger';
import { User } from '../src/types';

// Minimal discord.js mock focused on modal building used by onboarding flow
jest.mock('discord.js', () => {
  class ModalBuilder {
    public customId: string | undefined;
    public title: string | undefined;
    public components: unknown[] = [];
    public data: {
      custom_id?: string;
      title?: string;
      components?: unknown[];
    } = {};

    setCustomId(id: string): this {
      this.customId = id;
      this.data.custom_id = id;
      return this;
    }

    setTitle(title: string): this {
      this.title = title;
      this.data.title = title;
      return this;
    }

    addComponents(...components: unknown[]): this {
      this.components.push(...components);
      this.data.components = this.components;
      return this;
    }
  }

  class TextInputBuilder {
    public data: {
      customId?: string;
      label?: string;
      style?: string;
      placeholder?: string;
      required?: boolean;
    } = {};

    setCustomId(id: string): this {
      this.data.customId = id;
      return this;
    }

    setLabel(label: string): this {
      this.data.label = label;
      return this;
    }

    setStyle(style: string): this {
      this.data.style = style;
      return this;
    }

    setPlaceholder(placeholder: string): this {
      this.data.placeholder = placeholder;
      return this;
    }

    setRequired(required: boolean): this {
      this.data.required = required;
      return this;
    }
  }

  class ActionRowBuilder<T> {
    public components: T[] = [];

    addComponents(...components: T[]): this {
      this.components.push(...components);
      return this;
    }
  }

  class ButtonBuilder {
    public customId: string | undefined;
    public label: string | undefined;
    public style: string | undefined;

    setCustomId(id: string): this {
      this.customId = id;
      return this;
    }

    setLabel(label: string): this {
      this.label = label;
      return this;
    }

    setStyle(style: string): this {
      this.style = style;
      return this;
    }
  }

  const TextInputStyle = {
    Short: 'SHORT',
    Paragraph: 'PARAGRAPH'
  } as const;

  const ButtonStyle = {
    Primary: 'PRIMARY'
  } as const;

  return {
    SlashCommandBuilder: jest.fn(),
    CommandInteraction: jest.fn(),
    ChatInputCommandInteraction: jest.fn(),
    AttachmentBuilder: jest.fn(),
    ModalBuilder,
    TextInputBuilder,
    ActionRowBuilder,
    TextInputStyle,
    ButtonBuilder,
    ButtonStyle
  };
});

type TestContext = {
  handler: CommandHandler;
  mockNotion: jest.Mocked<NotionClient>;
  mockChannelHandlers: jest.Mocked<ChannelHandlers>;
  mockPersonalChannelManager: jest.Mocked<PersonalChannelManager>;
  mockLogger: jest.Mocked<DiscordLogger>;
};

const createTestContext = (): TestContext => {
  const mockNotion = {
    getUserByDiscordId: jest.fn(),
    getUserProfileByDiscordId: jest.fn(),
    createUserProfile: jest.fn(),
    createUser: jest.fn()
  } as unknown as jest.Mocked<NotionClient>;

  const mockChannelHandlers = {
    postInfoLog: jest.fn()
  } as unknown as jest.Mocked<ChannelHandlers>;

  const mockPersonalChannelManager = {
    createPersonalChannel: jest.fn()
  } as unknown as jest.Mocked<PersonalChannelManager>;

  const mockLogger = {
    info: jest.fn().mockResolvedValue(undefined),
    success: jest.fn().mockResolvedValue(undefined),
    error: jest.fn().mockResolvedValue(undefined),
    warning: jest.fn().mockResolvedValue(undefined),
    logError: jest.fn().mockResolvedValue(undefined)
  } as unknown as jest.Mocked<DiscordLogger>;

  const handler = new CommandHandler(
    mockNotion,
    mockChannelHandlers,
    mockPersonalChannelManager,
    mockLogger
  );

  return { handler, mockNotion, mockChannelHandlers, mockPersonalChannelManager, mockLogger };
};

describe('/join command', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('registers a brand-new user, creates personal channel, and sends welcome message', async () => {
    const { handler, mockNotion, mockPersonalChannelManager, mockChannelHandlers } = createTestContext();
    const discordId = 'user-new';
    const username = 'NewUser';
    const guild = { id: 'guild-1', name: 'Habit Guild' };

    mockNotion.getUserByDiscordId.mockResolvedValueOnce(null);
    mockPersonalChannelManager.createPersonalChannel.mockResolvedValueOnce('channel-personal');
    mockNotion.createUser.mockResolvedValueOnce({
      id: 'notion-user-1',
      discordId,
      name: username,
      timezone: 'Europe/Berlin',
      bestTime: '09:00',
      trustCount: 0,
      personalChannelId: 'channel-personal',
      status: 'active'
    } as User);
    mockChannelHandlers.postInfoLog.mockResolvedValueOnce(undefined);

    const interaction: any = {
      user: { id: discordId, username },
      guild,
      channelId: 'channel-join',
      channel: { id: 'channel-join', name: 'join' },
      deferReply: jest.fn().mockResolvedValue(undefined),
      editReply: jest.fn().mockResolvedValue(undefined),
      reply: jest.fn().mockResolvedValue(undefined),
      deferred: false
    };

    await handler.handleJoin(interaction);

    expect(interaction.deferReply).toHaveBeenCalledWith({ ephemeral: false });
    expect(mockNotion.getUserByDiscordId).toHaveBeenCalledWith(discordId);
    expect(mockPersonalChannelManager.createPersonalChannel).toHaveBeenCalledWith(discordId, username, guild);
    expect(mockNotion.createUser).toHaveBeenCalledWith(
      expect.objectContaining({
        discordId,
        name: username,
        personalChannelId: 'channel-personal'
      })
    );
    expect(mockChannelHandlers.postInfoLog).toHaveBeenCalled();
    expect(interaction.editReply).toHaveBeenCalledWith(
      expect.objectContaining({
        content: expect.stringContaining('Welcome to the Habit System')
      })
    );
  });

  it('returns welcome back message when user already exists', async () => {
    const { handler, mockNotion, mockPersonalChannelManager } = createTestContext();
    const discordId = 'user-existing';
    const username = 'ExistingUser';

    mockNotion.getUserByDiscordId.mockResolvedValueOnce({
      id: 'notion-existing',
      discordId,
      name: username,
      timezone: 'Europe/Berlin',
      bestTime: '09:00',
      trustCount: 2,
      personalChannelId: 'personal-existing',
      status: 'active'
    } as User);

    const interaction: any = {
      user: { id: discordId, username },
      guild: { id: 'guild-1', name: 'Habit Guild' },
      channelId: 'channel-join',
      channel: { id: 'channel-join', name: 'join' },
      deferReply: jest.fn().mockResolvedValue(undefined),
      editReply: jest.fn().mockResolvedValue(undefined),
      reply: jest.fn().mockResolvedValue(undefined),
      deferred: false
    };

    await handler.handleJoin(interaction);

    expect(interaction.deferReply).toHaveBeenCalled();
    expect(mockNotion.createUser).not.toHaveBeenCalled();
    expect(mockPersonalChannelManager.createPersonalChannel).not.toHaveBeenCalled();
    expect(interaction.editReply).toHaveBeenCalledWith(
      expect.objectContaining({
        content: expect.stringContaining('Welcome back')
      })
    );
  });
});

describe('/onboard command flow', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('asks the user to join when they are not registered', async () => {
    const { handler, mockNotion } = createTestContext();
    mockNotion.getUserByDiscordId.mockResolvedValueOnce(null);

    const interaction: any = {
      user: { id: 'user-1', username: 'TestUser' },
      replied: false,
      deferred: false,
      reply: jest.fn().mockResolvedValue(undefined),
      showModal: jest.fn().mockResolvedValue(undefined)
    };

    await handler.handleOnboard(interaction);

    expect(interaction.reply).toHaveBeenCalledWith(
      expect.objectContaining({
        content: expect.stringContaining('/join'),
        ephemeral: true
      })
    );
  });

  it('notifies the user when a profile already exists', async () => {
    const { handler, mockNotion } = createTestContext();
    const discordId = 'user-2';

    mockNotion.getUserByDiscordId.mockResolvedValueOnce({
      id: 'notion-user-2',
      discordId,
      name: 'TestUser',
      timezone: 'Europe/Berlin',
      bestTime: '09:00',
      trustCount: 0,
      status: 'active'
    } as User);
    mockNotion.getUserProfileByDiscordId.mockResolvedValueOnce({
      id: 'profile-1',
      discordId
    } as any);

    const interaction: any = {
      user: { id: discordId, username: 'TestUser' },
      replied: false,
      deferred: false,
      reply: jest.fn().mockResolvedValue(undefined),
      showModal: jest.fn().mockResolvedValue(undefined)
    };

    await handler.handleOnboard(interaction);

    expect(interaction.reply).toHaveBeenCalledWith(
      expect.objectContaining({
        content: expect.stringContaining('bereits ein Profil'),
        ephemeral: true
      })
    );
  });

  it('shows the first onboarding modal for a new user without profile', async () => {
    const { handler, mockNotion } = createTestContext();
    const discordId = 'user-3';

    mockNotion.getUserByDiscordId.mockResolvedValueOnce({
      id: 'notion-user-3',
      discordId,
      name: 'FreshUser',
      timezone: 'Europe/Berlin',
      bestTime: '09:00',
      trustCount: 0,
      status: 'active'
    } as User);
    mockNotion.getUserProfileByDiscordId.mockResolvedValueOnce(null);

    const interaction: any = {
      user: { id: discordId, username: 'FreshUser' },
      replied: false,
      deferred: false,
      showModal: jest.fn().mockResolvedValue(undefined)
    };

    await handler.handleOnboard(interaction);

    expect(interaction.showModal).toHaveBeenCalledTimes(1);
    const modal = interaction.showModal.mock.calls[0][0];
    expect(modal.customId).toBe('onboard_modal');
    expect(modal.components).toHaveLength(5);
  });

  it('stores first modal data and shows button to continue', async () => {
    const { handler } = createTestContext();
    const discordId = 'user-4';

    const interaction: any = {
      user: { id: discordId, username: 'FreshUser' },
      customId: 'onboard_modal',
      replied: false,
      deferred: false,
      reply: jest.fn().mockResolvedValue(undefined),
      fields: {
        getTextInputValue: jest.fn((field: string) => {
          switch (field) {
            case 'personality_type':
              return 'INTJ';
            case 'core_values':
              return 'Growth, Health';
            case 'life_vision':
              return 'Live a meaningful life';
            case 'main_goals':
              return 'Goal One\nGoal Two';
            case 'big_five':
              return 'O:7,C:6,E:5,A:4,N:3';
            default:
              return '';
          }
        })
      },
      channelId: 'channel-1',
      guild: { id: 'guild-1' }
    };

    await handler.handleOnboardModalSubmit(interaction);

    const cache = (handler as any).firstModalDataCache.get(discordId);
    expect(cache).toMatchObject({
      personalityType: 'INTJ',
      coreValues: ['Growth', 'Health'],
      lifeVision: 'Live a meaningful life',
      mainGoals: ['Goal One', 'Goal Two'],
      bigFiveTraits: 'O:7,C:6,E:5,A:4,N:3'
    });
    
    // Verify button reply instead of showModal
    expect(interaction.reply).toHaveBeenCalledTimes(1);
    const replyCall = interaction.reply.mock.calls[0][0];
    expect(replyCall.ephemeral).toBe(true);
    expect(replyCall.content).toContain('Erste Formular-Daten gespeichert');
    expect(replyCall.components).toHaveLength(1);
    expect(replyCall.components[0].components[0].customId).toBe('onboard_modal_2_trigger');
  });

  it('opens the second modal when button is clicked', async () => {
    const { handler } = createTestContext();
    const discordId = 'user-4';

    // First, set up cached data from first modal
    (handler as any).firstModalDataCache.set(discordId, {
      personalityType: 'INTJ',
      coreValues: ['Growth', 'Health'],
      lifeVision: 'Live a meaningful life',
      mainGoals: ['Goal One', 'Goal Two'],
      bigFiveTraits: 'O:7,C:6,E:5,A:4,N:3',
      timestamp: Date.now()
    });

    const buttonInteraction: any = {
      user: { id: discordId, username: 'FreshUser' },
      customId: 'onboard_modal_2_trigger',
      type: 3, // MessageComponent interaction type
      replied: false,
      deferred: false,
      showModal: jest.fn().mockResolvedValue(undefined),
      reply: jest.fn().mockResolvedValue(undefined),
      channelId: 'channel-1',
      guild: { id: 'guild-1' }
    };

    await handler.handleSecondOnboardModal(buttonInteraction);

    expect(buttonInteraction.showModal).toHaveBeenCalledTimes(1);
    const secondModal = buttonInteraction.showModal.mock.calls[0][0];
    expect(secondModal.customId).toBe('onboard_modal_2');
    expect(secondModal.components).toHaveLength(4);
  });

  it('creates a complete profile after second modal submission for a new user', async () => {
    const { handler, mockNotion } = createTestContext();
    const discordId = 'user-5';

    (handler as any).firstModalDataCache.set(discordId, {
      personalityType: 'ENFP',
      coreValues: ['Curiosity', 'Connection'],
      lifeVision: 'Inspire people at scale',
      mainGoals: ['Launch product', 'Grow community'],
      bigFiveTraits: 'O:8,C:5,E:7,A:6,N:4',
      timestamp: Date.now()
    });

    mockNotion.getUserByDiscordId.mockResolvedValueOnce({
      id: 'notion-user-5',
      discordId,
      name: 'OnboardUser',
      timezone: 'Europe/Berlin',
      bestTime: '09:00',
      trustCount: 0,
      status: 'active'
    } as User);

    mockNotion.createUserProfile.mockResolvedValueOnce({
      id: 'profile-5',
      discordId
    } as any);

    const interaction: any = {
      user: { id: discordId, username: 'OnboardUser' },
      replied: false,
      deferred: false,
      channelId: 'channel-1',
      guild: { id: 'guild-1' },
      deferReply: jest.fn().mockImplementation(async () => {
        interaction.deferred = true;
      }),
      editReply: jest.fn().mockResolvedValue(undefined),
      reply: jest.fn().mockResolvedValue(undefined),
      followUp: jest.fn().mockResolvedValue(undefined),
      fields: {
        getTextInputValue: jest.fn((field: string) => {
          switch (field) {
            case 'life_domains':
              return 'Health, Career';
            case 'life_phase':
              return 'Early Career';
            case 'desired_identity':
              return 'A resilient leader';
            case 'open_space':
              return 'Excited to grow!';
            default:
              return '';
          }
        })
      }
    };

    await handler.handleFinalOnboardSubmission(interaction);

    expect(interaction.deferReply).toHaveBeenCalledWith({ ephemeral: false });
    expect(mockNotion.createUserProfile).toHaveBeenCalledWith(
      expect.objectContaining({
        discordId,
        lifeDomains: ['Health', 'Career'],
        lifePhase: 'Early Career',
        desiredIdentity: 'A resilient leader',
        openSpace: 'Excited to grow!'
      })
    );
    expect((handler as any).firstModalDataCache.has(discordId)).toBe(false);
    expect(interaction.editReply).toHaveBeenCalledWith(
      expect.objectContaining({
        content: expect.stringContaining('Willkommen im System')
      })
    );
  });
});
