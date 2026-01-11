/**
 * Accountability Scheduler
 *
 * Runs the Accountability & Money Agent every Sunday at 8 PM
 * Generates and sends weekly accountability reports to the accountability channel
 */

import { Client, TextChannel } from 'discord.js';
import { NotionClient } from '../notion/client';
import { DiscordLogger } from './discord-logger';
import { PerplexityClient } from '../ai/perplexity-client';
import { AccountabilityMoneyAgent } from '../agents/accountability/accountability_money_agent';
import { AccountabilityReportFormatter } from './accountability-report-formatter';
import * as cron from 'node-cron';

export class AccountabilityScheduler {
  private client: Client;
  private notion: NotionClient;
  private logger: DiscordLogger;
  private perplexityClient: PerplexityClient;
  private agent: AccountabilityMoneyAgent;
  private formatter: AccountabilityReportFormatter;

  // Configuration
  private accountabilityChannelId: string;
  private timezone: string;

  constructor(
    client: Client,
    notion: NotionClient,
    logger: DiscordLogger
  ) {
    this.client = client;
    this.notion = notion;
    this.logger = logger;
    this.accountabilityChannelId = process.env.DISCORD_ACCOUNTABILITY_GROUP || '';
    this.timezone = process.env.TIMEZONE || 'Europe/Berlin';

    // Initialize Perplexity client
    this.perplexityClient = new PerplexityClient(process.env.PERPLEXITY_API_KEY!);

    // Initialize agent
    this.agent = new AccountabilityMoneyAgent(this.perplexityClient, this.notion);

    // Initialize formatter
    this.formatter = new AccountabilityReportFormatter();
  }

  /**
   * Initialize the agent
   */
  async initialize(): Promise<void> {
    try {
      await this.agent.initialize();

      await this.logger.success(
        'ACCOUNTABILITY_SCHEDULER',
        'Agent Initialized',
        'Accountability & Money Agent initialized successfully',
        {
          targetChannel: this.accountabilityChannelId,
          schedule: 'Every Sunday at 20:00 (8 PM)'
        }
      );

      console.log('✅ Accountability & Money Agent initialized');
    } catch (error) {
      await this.logger.logError(
        error as Error,
        'Accountability Agent Initialization Failed',
        { scheduler: 'accountability' }
      );
      throw error;
    }
  }

  /**
   * Run the weekly accountability check and send report
   */
  async runWeeklyAccountabilityCheck(): Promise<void> {
    try {
      await this.logger.info(
        'ACCOUNTABILITY_SCHEDULER',
        'Weekly Check Started',
        'Starting weekly accountability and money check',
        {
          day: new Date().toLocaleDateString('en-US', { weekday: 'long' }),
          time: new Date().toLocaleTimeString()
        }
      );

      // Get the accountability channel
      const channel = await this.getAccountabilityChannel();

      // Send "processing" message
      await channel.send('⏳ **Generating Weekly Accountability Report...**\n\nThis will take about 30 seconds...');

      // Generate the comprehensive report
      const report = await this.agent.generateWeeklyReport();

      await this.logger.info(
        'ACCOUNTABILITY_SCHEDULER',
        'Report Generated',
        'Weekly accountability report generated successfully',
        {
          users: report.userCompliance.length,
          totalCharges: report.summary.totalCharges,
          poolBalance: report.poolSummary.poolBalance
        }
      );

      // Format and send the report
      await this.sendReport(channel, report);

      await this.logger.success(
        'ACCOUNTABILITY_SCHEDULER',
        'Weekly Check Completed',
        'Weekly accountability check completed successfully',
        {
          users: report.userCompliance.length,
          weeklyCharges: `€${report.summary.totalCharges.toFixed(2)}`,
          poolBalance: `€${report.poolSummary.poolBalance.toFixed(2)}`
        }
      );

      console.log('✅ Weekly accountability check completed');

    } catch (error) {
      await this.logger.logError(
        error as Error,
        'Weekly Accountability Check Failed',
        { scheduler: 'accountability' }
      );

      // Try to send error message to channel
      try {
        const channel = await this.getAccountabilityChannel();
        await channel.send('❌ **Weekly Accountability Report Failed**\n\nAn error occurred while generating the report. Please check logs for details.');
      } catch (sendError) {
        console.error('Failed to send error message to channel:', sendError);
      }

      throw error;
    }
  }

  /**
   * Send the formatted report to Discord
   */
  private async sendReport(channel: TextChannel, report: any): Promise<void> {
    try {
      // Create embeds
      const embeds = this.formatter.createReportEmbeds(report);

      // Discord has a limit of 10 embeds per message
      // If we have more than 10, split them into multiple messages
      const MAX_EMBEDS_PER_MESSAGE = 10;

      for (let i = 0; i < embeds.length; i += MAX_EMBEDS_PER_MESSAGE) {
        const embedBatch = embeds.slice(i, i + MAX_EMBEDS_PER_MESSAGE);
        await channel.send({ embeds: embedBatch });

        // Small delay between batches to avoid rate limiting
        if (i + MAX_EMBEDS_PER_MESSAGE < embeds.length) {
          await this.delay(1000);
        }
      }

      await this.logger.info(
        'ACCOUNTABILITY_SCHEDULER',
        'Report Sent',
        `Sent ${embeds.length} embeds to accountability channel`,
        { embedCount: embeds.length }
      );

    } catch (error) {
      await this.logger.logError(
        error as Error,
        'Report Sending Failed',
        { channelId: this.accountabilityChannelId }
      );
      throw error;
    }
  }

  /**
   * Get the accountability Discord channel
   */
  private async getAccountabilityChannel(): Promise<TextChannel> {
    const channel = this.client.channels.cache.get(this.accountabilityChannelId) as TextChannel;
    if (!channel) {
      throw new Error(`Accountability channel not found: ${this.accountabilityChannelId}`);
    }
    return channel;
  }

  /**
   * Start the weekly scheduler
   * Runs every Sunday at 20:00 (8 PM)
   */
  startScheduler(): void {
    // Sunday at 20:00 (8 PM) - cron format: minute hour day-of-month month day-of-week
    // '0 20 * * 0' means: at minute 0, hour 20 (8 PM), any day of month, any month, Sunday (0)
    const task = cron.schedule('0 20 * * 0', async () => {
      try {
        console.log('📅 Accountability scheduler triggered on Sunday at 8 PM...');

        await this.logger.info(
          'ACCOUNTABILITY_SCHEDULER',
          'Scheduled Task Triggered',
          'Weekly accountability check triggered by cron on Sunday at 8 PM',
          {
            cronExpression: '0 20 * * 0',
            timezone: this.timezone,
            triggerTime: new Date().toISOString()
          }
        );

        // Run the weekly accountability check
        await this.runWeeklyAccountabilityCheck();

        console.log('✅ Weekly accountability check completed successfully');

      } catch (error) {
        console.error('❌ Error in accountability scheduler:', error);
        await this.logger.logError(
          error as Error,
          'Accountability Scheduler Error',
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

    console.log(`📅 Accountability scheduler started (Sunday 8 PM, timezone: ${this.timezone})`);
    console.log(`🎯 Target channel: ${this.accountabilityChannelId}`);

    this.logger.success(
      'ACCOUNTABILITY_SCHEDULER',
      'Scheduler Started',
      'Accountability scheduler started successfully',
      {
        cronExpression: '0 20 * * 0',
        description: 'Every Sunday at 20:00 (8 PM)',
        timezone: this.timezone,
        targetChannel: this.accountabilityChannelId
      }
    );
  }

  /**
   * Manually trigger accountability check (for testing)
   */
  async triggerAccountabilityCheck(): Promise<void> {
    console.log('🧪 Manually triggering accountability check...');
    await this.runWeeklyAccountabilityCheck();
  }

  /**
   * Get scheduler status
   */
  getSchedulerStatus(): any {
    return {
      cronExpression: '0 20 * * 0',
      description: 'Every Sunday at 20:00 (8 PM)',
      timezone: this.timezone,
      targetChannel: this.accountabilityChannelId,
      features: [
        'Habit compliance tracking',
        'Financial accountability (€0.50 per miss)',
        'Leaderboard with rankings',
        'Streak tracking',
        'Social dynamics insights',
        'Price pool management'
      ]
    };
  }

  /**
   * Delay helper function
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
