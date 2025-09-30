import { Client, Guild, TextChannel, PermissionFlagsBits, ChannelType } from 'discord.js';
import { NotionClient } from '../notion/client';

export class PersonalChannelManager {
  private client: Client;
  private notion: NotionClient;

  constructor(client: Client, notion: NotionClient) {
    this.client = client;
    this.notion = notion;
  }

  async createPersonalChannel(userId: string, username: string, guild: Guild): Promise<string | null> {
    try {
      console.log(`🏠 Creating personal channel for user: ${username} (${userId})`);

      // Create channel name (Discord has a 100 character limit for channel names)
      const channelName = `personal-${username.toLowerCase().replace(/[^a-z0-9-]/g, '')}`.substring(0, 100);
      
      // Check if channel already exists
      const existingChannel = guild.channels.cache.find(ch => ch.name === channelName);
      if (existingChannel) {
        console.log(`⚠️ Channel ${channelName} already exists: ${existingChannel.id}`);
        return existingChannel.id;
      }
      
      // Create the private channel
      const channel = await guild.channels.create({
        name: channelName,
        type: ChannelType.GuildText,
        permissionOverwrites: [
          {
            id: guild.roles.everyone.id,
            deny: [PermissionFlagsBits.ViewChannel]
          },
          {
            id: userId,
            allow: [
              PermissionFlagsBits.ViewChannel,
              PermissionFlagsBits.SendMessages,
              PermissionFlagsBits.ReadMessageHistory,
              PermissionFlagsBits.AddReactions,
              PermissionFlagsBits.AttachFiles,
              PermissionFlagsBits.EmbedLinks
            ]
          },
          {
            id: this.client.user!.id,
            allow: [
              PermissionFlagsBits.ViewChannel,
              PermissionFlagsBits.SendMessages,
              PermissionFlagsBits.ReadMessageHistory,
              PermissionFlagsBits.AddReactions,
              PermissionFlagsBits.EmbedLinks,
              PermissionFlagsBits.ManageMessages
            ]
          }
        ]
      });

      console.log(`✅ Personal channel created: ${channel.name} (${channel.id})`);

      // Send welcome message
      await this.sendWelcomeMessage(channel, username);

      return channel.id;

    } catch (error) {
      console.error('❌ Error creating personal channel:', error);
      return null;
    }
  }

  private async sendWelcomeMessage(channel: TextChannel, username: string) {
    try {
      const welcomeEmbed = {
        color: 0x00ff00,
        title: `🏠 Welcome to your Personal Habit Space, ${username}!`,
        description: `This is your private channel where you can:\n\n` +
          `🎯 **Create & Manage Habits**\n` +
          `📊 **Track Your Progress**\n` +
          `💡 **Get Personal Insights**\n` +
          `🔧 **Set Up Keystone Habits**\n` +
          `📈 **View Your Analytics**\n\n` +
          `**Available Commands:**\n` +
          `\`/keystonehabit\` - Create your keystone habit\n` +
          `\`/habit add\` - Add new habits\n` +
          `\`/proof\` - Submit daily proof\n` +
          `\`/summary\` - Get your weekly summary\n` +
          `\`/learning\` - Share insights\n` +
          `\`/hurdles\` - Log obstacles\n\n` +
          `💪 **Let's build amazing habits together!**`,
        footer: {
          text: 'Your personal habit tracking space'
        },
        timestamp: new Date().toISOString()
      };

      await channel.send({ embeds: [welcomeEmbed] });

      // Send a follow-up message with quick start guide
      const quickStartEmbed = {
        color: 0x0099ff,
        title: '🚀 Quick Start Guide',
        description: `**Step 1:** Use \`/keystonehabit\` to create your most important habit\n` +
          `**Step 2:** Start tracking with \`/proof\` daily\n` +
          `**Step 3:** Join the accountability channel to share progress\n` +
          `**Step 4:** Use \`/summary\` weekly to see your growth\n\n` +
          `*This channel is private - only you and the bot can see it!*`,
        footer: {
          text: 'Ready to start your habit journey?'
        }
      };

      await channel.send({ embeds: [quickStartEmbed] });

    } catch (error) {
      console.error('❌ Error sending welcome message:', error);
    }
  }

  async getPersonalChannel(userId: string): Promise<TextChannel | null> {
    try {
      const user = await this.notion.getUserByDiscordId(userId);
      if (!user || !user.personalChannelId) {
        return null;
      }

      const channel = this.client.channels.cache.get(user.personalChannelId) as TextChannel;
      return channel || null;

    } catch (error) {
      console.error('❌ Error getting personal channel:', error);
      return null;
    }
  }

  async sendPersonalMessage(userId: string, content: string, embed?: any) {
    try {
      const channel = await this.getPersonalChannel(userId);
      if (!channel) {
        console.log(`❌ No personal channel found for user: ${userId}`);
        return false;
      }

      if (embed) {
        await channel.send({ content, embeds: [embed] });
      } else {
        await channel.send(content);
      }

      return true;

    } catch (error) {
      console.error('❌ Error sending personal message:', error);
      return false;
    }
  }
}
