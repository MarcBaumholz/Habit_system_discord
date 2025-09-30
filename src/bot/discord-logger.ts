import { Client, TextChannel, Message, CommandInteraction, MessageReaction, User } from 'discord.js';

export interface LogEntry {
  timestamp: string;
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR' | 'DEBUG';
  category: string;
  title: string;
  description: string;
  metadata?: Record<string, any>;
  channelId?: string;
  userId?: string;
  guildId?: string;
}

export class DiscordLogger {
  private client: Client;
  private logChannelId: string;
  private logChannel: TextChannel | null = null;

  constructor(client: Client) {
    this.client = client;
    this.logChannelId = process.env.DISCORD_LOG_CHANNEL || '';
  }

  private async getLogChannel(): Promise<TextChannel | null> {
    if (!this.logChannelId) {
      console.warn('⚠️ DISCORD_LOG_CHANNEL not configured');
      return null;
    }

    // Check if client is ready
    if (!this.client.isReady()) {
      console.warn('⚠️ Discord client not ready, skipping log channel fetch');
      return null;
    }

    if (!this.logChannel) {
      try {
        const channel = await this.client.channels.fetch(this.logChannelId);
        if (channel && channel.isTextBased()) {
          this.logChannel = channel as TextChannel;
        } else {
          console.error('❌ Log channel not found or not text-based');
          return null;
        }
      } catch (error) {
        console.error('❌ Failed to fetch log channel:', error);
        return null;
      }
    }

    return this.logChannel;
  }

  private formatLogEntry(entry: LogEntry): string {
    const emoji = {
      'INFO': '📝',
      'SUCCESS': '✅',
      'WARNING': '⚠️',
      'ERROR': '❌',
      'DEBUG': '🔍'
    }[entry.type];

    let message = `${emoji} **${entry.type}** | **${entry.category}**\n`;
    message += `**${entry.title}**\n`;
    message += `${entry.description}\n`;
    message += `\`${entry.timestamp}\``;

    if (entry.metadata) {
      message += `\n\n**Metadata:**\n`;
      for (const [key, value] of Object.entries(entry.metadata)) {
        message += `• **${key}:** ${typeof value === 'object' ? JSON.stringify(value, null, 2) : value}\n`;
      }
    }

    if (entry.channelId) {
      message += `\n• **Channel:** <#${entry.channelId}>`;
    }

    if (entry.userId) {
      message += `\n• **User:** <@${entry.userId}>`;
    }

    if (entry.guildId) {
      message += `\n• **Guild:** ${entry.guildId}`;
    }

    return message;
  }

  async log(entry: LogEntry): Promise<void> {
    try {
      // Always log to console
      console.log(`[${entry.timestamp}] ${entry.type} ${entry.category}: ${entry.title}`);

      // Send to Discord log channel
      const channel = await this.getLogChannel();
      if (channel) {
        const formattedMessage = this.formatLogEntry(entry);
        
        // Split long messages if needed
      if (formattedMessage.length > 2000) {
        const parts = formattedMessage.match(/[\s\S]{1,1900}/g) || [];
        for (let i = 0; i < parts.length; i++) {
          const part = i === 0 ? parts[i] : `*Continued from previous message...*\n${parts[i]}`;
          if (part) {
            await channel.send(part);
          }
          if (i < parts.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 1000)); // Rate limit protection
          }
        }
      } else {
        await channel.send(formattedMessage);
      }
      }
    } catch (error) {
      console.error('❌ Failed to send log to Discord:', error);
    }
  }

  // Convenience methods for different log types
  async info(category: string, title: string, description: string, metadata?: Record<string, any>, context?: { channelId?: string; userId?: string; guildId?: string }): Promise<void> {
    await this.log({
      timestamp: new Date().toISOString(),
      type: 'INFO',
      category,
      title,
      description,
      metadata,
      ...context
    });
  }

  async success(category: string, title: string, description: string, metadata?: Record<string, any>, context?: { channelId?: string; userId?: string; guildId?: string }): Promise<void> {
    await this.log({
      timestamp: new Date().toISOString(),
      type: 'SUCCESS',
      category,
      title,
      description,
      metadata,
      ...context
    });
  }

  async warning(category: string, title: string, description: string, metadata?: Record<string, any>, context?: { channelId?: string; userId?: string; guildId?: string }): Promise<void> {
    await this.log({
      timestamp: new Date().toISOString(),
      type: 'WARNING',
      category,
      title,
      description,
      metadata,
      ...context
    });
  }

  async error(category: string, title: string, description: string, metadata?: Record<string, any>, context?: { channelId?: string; userId?: string; guildId?: string }): Promise<void> {
    await this.log({
      timestamp: new Date().toISOString(),
      type: 'ERROR',
      category,
      title,
      description,
      metadata,
      ...context
    });
  }

  async debug(category: string, title: string, description: string, metadata?: Record<string, any>, context?: { channelId?: string; userId?: string; guildId?: string }): Promise<void> {
    await this.log({
      timestamp: new Date().toISOString(),
      type: 'DEBUG',
      category,
      title,
      description,
      metadata,
      ...context
    });
  }

  // Specialized logging methods for Discord events
  async logMessageCreate(message: Message): Promise<void> {
    await this.info(
      'MESSAGE',
      'Message Created',
      `New message from ${message.author.username} in ${message.channel}`,
      {
        content: message.content.substring(0, 500),
        attachments: message.attachments.size,
        embeds: message.embeds.length,
        mentions: message.mentions.users.size
      },
      {
        channelId: message.channelId,
        userId: message.author.id,
        guildId: message.guild?.id
      }
    );
  }

  async logCommandInteraction(interaction: CommandInteraction): Promise<void> {
    const subcommand = (interaction as any).options?.getSubcommand(false);
    const commandName = subcommand ? `${interaction.commandName} ${subcommand}` : interaction.commandName;

    await this.info(
      'COMMAND',
      `Command Executed: /${commandName}`,
      `User ${interaction.user.username} executed /${commandName}`,
      {
        options: (interaction as any).options?.data?.map((opt: any) => ({
          name: opt.name,
          type: opt.type,
          value: opt.value
        })) || [],
        guild: interaction.guild?.name,
        channel: interaction.channel?.toString()
      },
      {
        channelId: interaction.channelId,
        userId: interaction.user.id,
        guildId: interaction.guild?.id
      }
    );
  }

  async logReactionAdd(reaction: MessageReaction, user: User): Promise<void> {
    await this.info(
      'REACTION',
      'Reaction Added',
      `${user.username} reacted with ${reaction.emoji.name}`,
      {
        emoji: reaction.emoji.toString(),
        messageContent: reaction.message.content?.substring(0, 200),
        messageId: reaction.message.id
      },
      {
        channelId: reaction.message.channelId,
        userId: user.id,
        guildId: reaction.message.guild?.id
      }
    );
  }

  async logChannelCreate(channel: TextChannel): Promise<void> {
    await this.success(
      'CHANNEL',
      'Channel Created',
      `New channel "${channel.name}" created`,
      {
        type: channel.type,
        topic: channel.topic,
        parent: channel.parent?.name
      },
      {
        channelId: channel.id,
        guildId: channel.guild?.id
      }
    );
  }

  async logChannelDelete(channel: TextChannel): Promise<void> {
    await this.warning(
      'CHANNEL',
      'Channel Deleted',
      `Channel "${channel.name}" was deleted`,
      {
        type: channel.type,
        wasPersonalChannel: channel.name.startsWith('personal-')
      },
      {
        channelId: channel.id,
        guildId: channel.guild?.id
      }
    );
  }

  async logUserJoin(user: any): Promise<void> {
    await this.success(
      'USER',
      'User Joined',
      `${user.username} joined the server`,
      {
        accountAge: user.createdAt,
        avatar: user.avatar
      },
      {
        userId: user.id,
        guildId: user.guild?.id
      }
    );
  }

  async logUserLeave(user: any): Promise<void> {
    await this.warning(
      'USER',
      'User Left',
      `${user.username} left the server`,
      {
        joinedAt: user.joinedAt,
        roles: user.roles?.cache?.map((role: any) => role.name)
      },
      {
        userId: user.id,
        guildId: user.guild?.id
      }
    );
  }

  async logNotionOperation(operation: string, success: boolean, details: Record<string, any>, context?: { channelId?: string; userId?: string; guildId?: string }): Promise<void> {
    const logType = success ? 'SUCCESS' : 'ERROR';
    const method = success ? this.success.bind(this) : this.error.bind(this);

    await method(
      'NOTION',
      `Notion ${operation}`,
      `${operation} ${success ? 'completed successfully' : 'failed'}`,
      details,
      context
    );
  }

  async logAIProcessing(operation: string, success: boolean, details: Record<string, any>, context?: { channelId?: string; userId?: string; guildId?: string }): Promise<void> {
    const logType = success ? 'SUCCESS' : 'ERROR';
    const method = success ? this.success.bind(this) : this.error.bind(this);

    await method(
      'AI',
      `AI ${operation}`,
      `${operation} ${success ? 'completed successfully' : 'failed'}`,
      details,
      context
    );
  }

  async logScheduledTask(task: string, success: boolean, details: Record<string, any>): Promise<void> {
    const logType = success ? 'SUCCESS' : 'ERROR';
    const method = success ? this.success.bind(this) : this.error.bind(this);

    await method(
      'SCHEDULER',
      `Scheduled Task: ${task}`,
      `${task} ${success ? 'executed successfully' : 'failed'}`,
      details
    );
  }

  async logSystemEvent(event: string, details: Record<string, any>): Promise<void> {
    await this.info(
      'SYSTEM',
      `System Event: ${event}`,
      `System event occurred: ${event}`,
      details
    );
  }

  async logError(error: Error, context: string, additionalDetails?: Record<string, any>, discordContext?: { channelId?: string; userId?: string; guildId?: string }): Promise<void> {
    await this.error(
      'ERROR',
      `Error in ${context}`,
      error.message,
      {
        stack: error.stack,
        name: error.name,
        ...additionalDetails
      },
      discordContext
    );
  }
}
