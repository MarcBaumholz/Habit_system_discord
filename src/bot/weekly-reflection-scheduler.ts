import { Client, TextChannel, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import * as cron from 'node-cron';
import { NotionClient } from '../notion/client';
import { DiscordLogger } from './discord-logger';
import { User } from '../types';
import { formatLocalDate } from '../utils/date-utils';

export class WeeklyReflectionScheduler {
  private client: Client;
  private notion: NotionClient;
  private logger: DiscordLogger;
  private timezone: string;

  constructor(client: Client, notion: NotionClient, logger: DiscordLogger) {
    this.client = client;
    this.notion = notion;
    this.logger = logger;
    this.timezone = process.env.TIMEZONE || 'Europe/Berlin';
  }

  startScheduler(): void {
    const task = cron.schedule('0 20 * * 0', async () => {
      try {
        console.log('📅 Weekly reflection scheduler triggered on Sunday at 8 PM...');

        await this.logger.info(
          'WEEKLY_REFLECTION',
          'Scheduled Task Triggered',
          'Weekly reflection prompts triggered by cron on Sunday at 8 PM',
          {
            cronExpression: '0 20 * * 0',
            timezone: this.timezone,
            triggerTime: new Date().toISOString()
          }
        );

        await this.sendWeeklyReflectionPrompt();

        console.log('✅ Weekly reflection prompts sent successfully');
      } catch (error) {
        console.error('❌ Error in weekly reflection scheduler:', error);
        await this.logger.logError(
          error as Error,
          'Weekly Reflection Scheduler Error',
          {
            cronExpression: '0 20 * * 0',
            timezone: this.timezone
          }
        );
      }
    }, {
      scheduled: true,
      timezone: this.timezone
    });

    console.log(`📅 Weekly reflection scheduler started (Sunday 8 PM, timezone: ${this.timezone})`);
    task.start();
  }

  private async sendWeeklyReflectionPrompt(): Promise<void> {
    const users = await this.notion.getAllUsers();
    const activeUsers = users.filter(user => user.status !== 'pause' && user.personalChannelId);
    const weekInfo = this.notion.getCurrentWeekInfo();
    const weekStartDate = formatLocalDate(weekInfo.weekStart);

    console.log(`📝 Sending weekly reflection prompts to ${activeUsers.length} active users`);

    let sentCount = 0;

    for (const user of activeUsers) {
      try {
        const shouldSend = await this.shouldSendReflectionPrompt(user, weekStartDate);
        if (!shouldSend) {
          continue;
        }

        const channel = await this.fetchUserChannel(user.personalChannelId as string);
        if (!channel) {
          continue;
        }

        await channel.send({
          content:
            '📝 **Weekly Reflection**\n\n' +
            'Take 2 minutes to close your week with four simple questions.\n' +
            'One short form, one clear plan for next week.',
          components: [this.buildReflectionButtonRow(weekStartDate)]
        });

        sentCount += 1;
        await this.delay(400);
      } catch (error) {
        console.error(`❌ Error sending weekly reflection prompt to ${user.name}:`, error);
      }
    }

    await this.logger.success(
      'WEEKLY_REFLECTION',
      'Prompts Sent',
      `Sent weekly reflection prompts to ${sentCount} users`,
      {
        totalUsers: users.length,
        activeUsers: activeUsers.length,
        sentCount,
        weekStartDate
      }
    );
  }

  private async shouldSendReflectionPrompt(user: User, weekStartDate: string): Promise<boolean> {
    if (!user.personalChannelId) {
      return false;
    }

    const existingWeek = await this.notion.getWeekByUserAndStartDate(user.id, weekStartDate);
    if (existingWeek?.reflectionCompleted) {
      return false;
    }

    return true;
  }

  private async fetchUserChannel(channelId: string): Promise<TextChannel | null> {
    try {
      const channel = await this.client.channels.fetch(channelId);
      return channel as TextChannel;
    } catch (error) {
      console.error(`❌ Could not fetch personal channel ${channelId}:`, error);
      return null;
    }
  }

  private buildReflectionButtonRow(weekStartDate: string): ActionRowBuilder<ButtonBuilder> {
    const button = new ButtonBuilder()
      .setCustomId(`weekly_reflection_start_${weekStartDate}`)
      .setLabel('Start Reflection')
      .setStyle(ButtonStyle.Primary);

    return new ActionRowBuilder<ButtonBuilder>().addComponents(button);
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
