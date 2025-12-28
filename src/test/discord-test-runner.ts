import { Client, TextChannel, EmbedBuilder } from 'discord.js';
import * as dotenv from 'dotenv';

dotenv.config();

export interface TestResult {
  name: string;
  status: 'passed' | 'failed' | 'skipped';
  duration?: number;
  error?: string;
  details?: string;
}

export interface TestSuite {
  name: string;
  tests: TestResult[];
  total: number;
  passed: number;
  failed: number;
  skipped: number;
  duration: number;
}

export class DiscordTestRunner {
  private client: Client;
  private testChannelId: string;
  private isReady: boolean = false;

  constructor(testChannelId: string) {
    this.testChannelId = testChannelId;
    this.client = new Client({
      intents: ['Guilds', 'GuildMessages', 'MessageContent']
    });
  }

  async initialize(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.client.once('ready', () => {
        this.isReady = true;
        console.log('✅ Discord Test Runner ready');
        resolve();
      });

      this.client.once('error', reject);

      const token = process.env.DISCORD_BOT_TOKEN || process.env.DISCORD_TOKEN;
      if (!token) {
        reject(new Error('DISCORD_BOT_TOKEN or DISCORD_TOKEN not found in environment'));
        return;
      }

      this.client.login(token).catch(reject);
    });
  }

  async sendTestResults(suite: TestSuite, codeChanges?: string): Promise<void> {
    if (!this.isReady) {
      await this.initialize();
    }

    const channel = await this.client.channels.fetch(this.testChannelId) as TextChannel;
    if (!channel) {
      throw new Error(`Test channel ${this.testChannelId} not found`);
    }

    const embed = new EmbedBuilder()
      .setTitle(`🧪 Test Results: ${suite.name}`)
      .setColor(suite.failed > 0 ? 0xff0000 : 0x00ff00)
      .setTimestamp()
      .addFields(
        {
          name: '📊 Summary',
          value: `**Total:** ${suite.total}\n**✅ Passed:** ${suite.passed}\n**❌ Failed:** ${suite.failed}\n**⏭️ Skipped:** ${suite.skipped}\n**⏱️ Duration:** ${suite.duration}ms`,
          inline: false
        }
      );

    if (suite.failed > 0) {
      const failedTests = suite.tests.filter(t => t.status === 'failed');
      const failedDetails = failedTests.map(t => 
        `**${t.name}**\n\`\`\`${t.error || 'Unknown error'}\`\`\``
      ).join('\n\n');
      
      embed.addFields({
        name: '❌ Failed Tests',
        value: failedDetails.substring(0, 1024) || 'No details available',
        inline: false
      });
    }

    if (codeChanges) {
      embed.addFields({
        name: '📝 Code Changes',
        value: `\`\`\`diff\n${codeChanges.substring(0, 1000)}\n\`\`\``,
        inline: false
      });
    }

    await channel.send({ embeds: [embed] });

    // Send detailed test results if there are failures
    if (suite.failed > 0 && suite.tests.length > 0) {
      const details = suite.tests.map(test => {
        const icon = test.status === 'passed' ? '✅' : test.status === 'failed' ? '❌' : '⏭️';
        return `${icon} **${test.name}** ${test.duration ? `(${test.duration}ms)` : ''}${test.error ? `\n   Error: ${test.error}` : ''}`;
      }).join('\n');

      if (details.length > 2000) {
        // Split into multiple messages if too long
        const chunks = details.match(/.{1,2000}/g) || [];
        for (const chunk of chunks) {
          await channel.send(`\`\`\`\n${chunk}\n\`\`\``);
        }
      } else {
        await channel.send(`\`\`\`\n${details}\n\`\`\``);
      }
    }
  }

  async sendTestStart(testName: string, description?: string): Promise<void> {
    if (!this.isReady) {
      await this.initialize();
    }

    const channel = await this.client.channels.fetch(this.testChannelId) as TextChannel;
    if (!channel) {
      throw new Error(`Test channel ${this.testChannelId} not found`);
    }

    const embed = new EmbedBuilder()
      .setTitle(`🚀 Starting Test: ${testName}`)
      .setColor(0x0099ff)
      .setTimestamp();

    if (description) {
      embed.setDescription(description);
    }

    await channel.send({ embeds: [embed] });
  }

  async destroy(): Promise<void> {
    await this.client.destroy();
    this.isReady = false;
  }
}
