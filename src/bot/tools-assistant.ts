import { Client, Message, TextChannel } from 'discord.js';
import { ToolboxEngine, formatToolboxReply } from '../toolbox';
import { DEFAULT_TOOLS } from '../toolbox/tools-enhanced';
import { NotionClient } from '../notion/client';
import { User } from '../types';

export class ToolsAssistant {
  private client: Client;
  private engine: ToolboxEngine;
  private toolsChannelId?: string;
  private notion?: NotionClient;

  constructor(client: Client, notion?: NotionClient) {
    this.client = client;
    this.engine = new ToolboxEngine(DEFAULT_TOOLS);
    this.toolsChannelId = process.env.DISCORD_TOOLS;
    this.notion = notion;
  }

  setTools(tools: any[]) {
    this.engine.addTools(tools);
  }

  async handleMessage(message: Message) {
    if (!this.toolsChannelId) return;
    if (message.author.bot) return;
    if (message.channelId !== this.toolsChannelId) return;

    try {
      const problem = message.content.trim();
      if (!problem) return;

      const matches = this.engine.matchTools(problem, 3);
      const reply = formatToolboxReply(problem, matches);

      const channel = this.client.channels.cache.get(this.toolsChannelId) as TextChannel;
      if (!channel) return;
      await channel.send(reply);

      // Auto-log top suggestion as a learning (if Notion is available and user is registered)
      if (this.notion && matches.length > 0) {
        try {
          const user: User | null = await this.notion.getUserByDiscordId(message.author.id);
          if (user) {
            const top = matches[0].tool;
            const learningText = `Tool suggestion: ${top.name} — ${top.summary}`;
            const createdAt = new Date().toISOString();
            await this.notion.createLearning({
              userId: user.id,
              habitId: user.id, // generic catch-all when not tied to a specific habit
              discordId: message.author.id,
              text: learningText,
              createdAt
            });
          }
        } catch (err) {
          console.error('Failed to auto-log toolbox learning:', err);
        }
      }
    } catch (error) {
      console.error('Error in ToolsAssistant:', error);
    }
  }
}


