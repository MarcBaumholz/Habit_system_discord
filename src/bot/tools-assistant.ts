import { Client, Message, TextChannel } from 'discord.js';
import { ToolboxEngine, formatToolboxReply } from '../toolbox';
import { DEFAULT_TOOLS } from '../toolbox/tools-enhanced';
import { NotionClient } from '../notion/client';
import { User } from '../types';
import { PerplexityToolMatcher, ToolMatch } from '../ai/perplexity-tool-matcher';

export class ToolsAssistant {
  private client: Client;
  private engine: ToolboxEngine;
  private toolsChannelId?: string;
  private notion?: NotionClient;
  private aiMatcher?: PerplexityToolMatcher;

  constructor(client: Client, notion?: NotionClient) {
    this.client = client;
    this.engine = new ToolboxEngine(DEFAULT_TOOLS);
    this.toolsChannelId = process.env.DISCORD_TOOLS;
    this.notion = notion;

    // Initialize AI matcher if Perplexity API key is available
    if (process.env.PERPLEXITY_API_KEY) {
      this.aiMatcher = new PerplexityToolMatcher(process.env.PERPLEXITY_API_KEY);
      console.log('✅ AI-powered tool matching enabled');
    } else {
      console.log('⚠️ Perplexity API key not found, using rule-based matching only');
    }
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

      let matches: Array<{ tool: any; score: number; reasoning?: string }> = [];

      // Try AI matching first if available
      if (this.aiMatcher) {
        try {
          console.log('🤖 Using AI-powered tool matching...');
          const aiMatches = await this.aiMatcher.matchToolsWithAI(problem, DEFAULT_TOOLS);
          matches = aiMatches;
          console.log(`✅ AI found ${matches.length} tool(s)`);
        } catch (aiError) {
          console.error('⚠️ AI matching failed, falling back to rule-based:', aiError);
          // Fallback to rule-based matching
          matches = this.engine.matchTools(problem, 2);
        }
      } else {
        // Use rule-based matching if AI not available
        matches = this.engine.matchTools(problem, 2);
      }

      // Limit to maximum 2 tools
      matches = matches.slice(0, 2);

      const reply = formatToolboxReply(problem, matches);

      const channel = this.client.channels.cache.get(this.toolsChannelId) as TextChannel;
      if (!channel) return;
      await channel.send(reply);

      console.log(`🤖 Tool suggestion sent to ${message.author.username}: ${matches.map(m => m.tool.name).join(', ') || 'No matches'}`);

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
            console.log(`📚 Auto-logged tool suggestion for user ${user.name}: ${top.name}`);
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


