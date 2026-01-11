/**
 * Mock Discord Helpers
 * Mock Discord.js objects for testing
 */

import { CommandInteraction, Message, TextChannel, User, Guild, ChannelType, Attachment } from 'discord.js';

/**
 * Create a mock Discord User
 */
export function createMockUser(id: string = '1234567890', username: string = 'TestUser'): Partial<User> {
  return {
    id,
    username,
    discriminator: '0',
    tag: `${username}#0`,
    bot: false,
    system: false,
    createdAt: new Date(),
    defaultAvatarURL: 'https://cdn.discordapp.com/embed/avatars/0.png',
    displayAvatarURL: () => 'https://cdn.discordapp.com/embed/avatars/0.png'
  } as Partial<User>;
}

/**
 * Create a mock Discord Guild
 */
export function createMockGuild(id: string = '1111111111'): Partial<Guild> {
  return {
    id,
    name: 'Test Guild',
    createdAt: new Date()
  } as Partial<Guild>;
}

/**
 * Create a mock Discord TextChannel
 */
export function createMockChannel(channelId: string, type: ChannelType = ChannelType.GuildText): Partial<TextChannel> {
  return {
    id: channelId,
    type,
    name: 'test-channel',
    createdAt: new Date(),
    send: jest.fn().mockResolvedValue({ id: 'message-id' }),
    delete: jest.fn().mockResolvedValue(true)
  } as any;
}

/**
 * Create a mock CommandInteraction for slash commands
 */
export function createMockInteraction(
  commandName: string,
  options: any = {},
  user?: Partial<User>,
  guildId?: string
): Partial<CommandInteraction> {
  const mockUser = user || createMockUser();
  const mockGuild = guildId ? createMockGuild(guildId) : createMockGuild();

  const optionsMap = new Map();
  Object.entries(options).forEach(([key, value]) => {
    optionsMap.set(key, value);
  });

  return {
    commandName,
    user: mockUser as User,
    guild: mockGuild as Guild,
    guildId: mockGuild.id,
    channelId: 'test-channel-id',
    id: 'interaction-id',
    createdAt: new Date(),
    replied: false,
    deferred: false,
    isChatInputCommand: () => true,
    isAutocomplete: () => false,
    isButton: () => false,
    isModalSubmit: () => false,
    deferReply: jest.fn().mockResolvedValue(undefined),
    reply: jest.fn().mockResolvedValue(undefined),
    editReply: jest.fn().mockResolvedValue(undefined),
    followUp: jest.fn().mockResolvedValue(undefined),
    options: {
      getString: jest.fn((name: string, required?: boolean) => options[name] || null),
      getBoolean: jest.fn((name: string) => options[name] || false),
      getInteger: jest.fn((name: string) => options[name] || null),
      getAttachment: jest.fn((name: string) => options[name] || null),
      get: jest.fn((name: string) => ({ value: options[name] })),
      data: []
    } as any
  } as Partial<CommandInteraction>;
}

/**
 * Create a mock autocomplete interaction
 */
export function createMockAutocompleteInteraction(
  commandName: string,
  focusedOption: string,
  focusedValue: string,
  user?: Partial<User>
): any {
  const mockUser = user || createMockUser();

  return {
    commandName,
    user: mockUser as User,
    isAutocomplete: () => true,
    respond: jest.fn().mockResolvedValue(undefined),
    options: {
      getFocused: jest.fn(() => focusedValue),
      getString: jest.fn(() => focusedValue),
      data: []
    }
  };
}

/**
 * Create a mock Discord Message
 */
export function createMockMessage(
  content: string,
  user?: Partial<User>,
  isWebhook: boolean = false,
  channelId: string = 'test-channel-id'
): Partial<Message> {
  const mockUser = user || createMockUser();

  return {
    id: `message-${Date.now()}`,
    content,
    author: mockUser as User,
    channelId,
    guildId: 'test-guild-id',
    createdAt: new Date(),
    webhookId: isWebhook ? 'webhook-id' : undefined,
    react: jest.fn().mockResolvedValue(undefined),
    reply: jest.fn().mockResolvedValue({ id: 'reply-message-id' }),
    delete: jest.fn().mockResolvedValue(true),
    attachments: new Map()
  } as any;
}

/**
 * Create a mock message with attachment
 */
export function createMockMessageWithAttachment(
  content: string,
  attachmentUrl: string,
  user?: Partial<User>
): Partial<Message> {
  const message = createMockMessage(content, user);

  const mockAttachment = {
    id: 'attachment-id',
    url: attachmentUrl,
    proxyURL: attachmentUrl,
    name: 'proof-image.jpg',
    size: 1024,
    contentType: 'image/jpeg'
  } as Partial<Attachment>;

  const attachments = new Map<string, Attachment>();
  attachments.set('attachment-id', mockAttachment as Attachment);

  return {
    ...message,
    attachments
  };
}

/**
 * Create a mock webhook message
 */
export function createMockWebhookMessage(
  content: string,
  webhookName: string,
  channelId: string = 'test-channel-id'
): Partial<Message> {
  const message = createMockMessage(content, undefined, true, channelId);

  return {
    ...message,
    webhookId: 'webhook-id',
    author: {
      ...message.author,
      username: webhookName,
      bot: true
    } as User
  };
}

/**
 * Create a mock button interaction
 */
export function createMockButtonInteraction(
  customId: string,
  user?: Partial<User>
): any {
  const mockUser = user || createMockUser();

  return {
    customId,
    user: mockUser as User,
    isButton: () => true,
    deferUpdate: jest.fn().mockResolvedValue(undefined),
    update: jest.fn().mockResolvedValue(undefined),
    reply: jest.fn().mockResolvedValue(undefined)
  };
}

/**
 * Create a mock modal submit interaction
 */
export function createMockModalSubmitInteraction(
  customId: string,
  fields: { [key: string]: string },
  user?: Partial<User>
): any {
  const mockUser = user || createMockUser();

  return {
    customId,
    user: mockUser as User,
    isModalSubmit: () => true,
    deferReply: jest.fn().mockResolvedValue(undefined),
    reply: jest.fn().mockResolvedValue(undefined),
    fields: {
      getTextInputValue: jest.fn((fieldId: string) => fields[fieldId] || '')
    }
  };
}
