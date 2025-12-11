/**
 * Mid-Week Analysis Scheduler
 *
 * Schedules and executes mid-week habit analysis using the CrewAI agent
 * Runs every Wednesday at 8pm (20:00)
 */

import * as cron from 'node-cron';
import { TextChannel } from 'discord.js';
import { crewAIClient } from '../agents/crewai-client';
import { DiscordLogger } from './discord-logger';

export class MidWeekScheduler {
  private cronTask: cron.ScheduledTask | null = null;
  private isRunning: boolean = false;
  private discordLogger: DiscordLogger;
  private accountabilityChannel: TextChannel;

  constructor(accountabilityChannel: TextChannel, discordLogger: DiscordLogger) {
    this.accountabilityChannel = accountabilityChannel;
    this.discordLogger = discordLogger;
  }

  /**
   * Start the mid-week analysis scheduler
   * Runs every Wednesday at 20:00 (8pm) Europe/Berlin timezone
   */
  start(): void {
    if (this.isRunning) {
      console.log('⏭️  Mid-week scheduler is already running');
      return;
    }

    // Cron expression: "0 20 * * 3" = Every Wednesday at 20:00 (8pm)
    // 0 = minute 0
    // 20 = hour 20 (8pm)
    // * = any day of month
    // * = any month
    // 3 = Wednesday (0 = Sunday, 1 = Monday, ..., 3 = Wednesday)
    const cronExpression = '0 20 * * 3';
    const timezone = process.env.TIMEZONE || 'Europe/Berlin';

    console.log(`\n${'='.repeat(60)}`);
    console.log('📅 STARTING MID-WEEK ANALYSIS SCHEDULER');
    console.log(`${'='.repeat(60)}`);
    console.log(`Schedule: Every Wednesday at 20:00 (8pm)`);
    console.log(`Timezone: ${timezone}`);
    console.log(`Cron Expression: ${cronExpression}`);
    console.log(`${'='.repeat(60)}\n`);

    this.cronTask = cron.schedule(
      cronExpression,
      async () => {
        await this.runMidWeekAnalysis();
      },
      {
        scheduled: true,
        timezone: timezone,
      }
    );

    this.isRunning = true;

    this.discordLogger.info(
      'MIDWEEK_SCHEDULER',
      '📅 Mid-Week Analysis Scheduler Started',
      `Scheduled for every Wednesday at 20:00 (${timezone})\n` +
      `Next run: ${this.getNextRunTime().toLocaleString('en-US', { timeZone: timezone })}`
    );

    console.log('✅ Mid-week scheduler started successfully');
  }

  /**
   * Stop the scheduler
   */
  stop(): void {
    if (this.cronTask) {
      this.cronTask.stop();
      this.cronTask = null;
      this.isRunning = false;
      console.log('🛑 Mid-week scheduler stopped');

      this.discordLogger.info(
        'MIDWEEK_SCHEDULER',
        '🛑 Mid-Week Scheduler Stopped',
        'Mid-week analysis scheduler has been stopped'
      );
    }
  }

  /**
   * Execute mid-week analysis
   */
  private async runMidWeekAnalysis(): Promise<void> {
    const today = new Date();
    const dayName = today.toLocaleDateString('en-US', { weekday: 'long' });

    console.log(`\n${'='.repeat(60)}`);
    console.log(`🎯 EXECUTING MID-WEEK ANALYSIS`);
    console.log(`${'='.repeat(60)}`);
    console.log(`Time: ${today.toLocaleString()}`);
    console.log(`Day: ${dayName}`);
    console.log(`${'='.repeat(60)}\n`);

    try {
      // Check if CrewAI service is available
      const isAvailable = await crewAIClient.isAvailable();

      if (!isAvailable) {
        const errorMsg = '❌ CrewAI service is not available. Please ensure the Python agent service is running.';
        console.error(errorMsg);

        await this.discordLogger.error(
          'MIDWEEK_SCHEDULER',
          '❌ Mid-Week Analysis Failed',
          errorMsg + '\n\nTo start the service:\n```bash\ncd python-agents\npython api.py\n```'
        );
        return;
      }

      // Log start
      await this.discordLogger.info(
        'MIDWEEK_SCHEDULER',
        '🎯 Mid-Week Analysis Started',
        `Running team dynamics analysis for ${dayName}...\n` +
        `This may take a few minutes.`
      );

      // Run the analysis
      const result = await crewAIClient.runMidWeekAnalysis();

      if (result.status === 'success' && result.analysis) {
        // Post analysis to accountability channel
        await this.postAnalysisToChannel(result.analysis);

        // Log success
        await this.discordLogger.success(
          'MIDWEEK_SCHEDULER',
          '✅ Mid-Week Analysis Complete',
          `Successfully generated and posted mid-week analysis\n` +
          `Timestamp: ${result.timestamp}`
        );

        console.log('✅ Mid-week analysis completed and posted successfully');
      } else {
        throw new Error(result.error || 'Analysis failed with unknown error');
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error('❌ Error running mid-week analysis:', errorMsg);

      await this.discordLogger.error(
        'MIDWEEK_SCHEDULER',
        '❌ Mid-Week Analysis Error',
        `Failed to run mid-week analysis:\n\`\`\`\n${errorMsg}\n\`\`\``
      );
    }

    console.log(`\n${'='.repeat(60)}`);
    console.log('🏁 MID-WEEK ANALYSIS EXECUTION COMPLETE');
    console.log(`${'='.repeat(60)}\n`);
  }

  /**
   * Post analysis results to the accountability channel
   */
  private async postAnalysisToChannel(analysis: string): Promise<void> {
    // Discord has a 2000 character limit, so we need to split long messages
    const maxLength = 1900; // Leave some buffer

    if (analysis.length <= maxLength) {
      await this.accountabilityChannel.send(analysis);
    } else {
      // Split by sections (look for ## headers)
      const sections = analysis.split('\n## ');

      let currentMessage = '';

      for (let i = 0; i < sections.length; i++) {
        const section = i === 0 ? sections[i] : '## ' + sections[i];

        if ((currentMessage + section).length > maxLength) {
          // Send current message and start a new one
          if (currentMessage) {
            await this.accountabilityChannel.send(currentMessage);
            currentMessage = '';
          }

          // If a single section is too long, split it by paragraphs
          if (section.length > maxLength) {
            const paragraphs = section.split('\n\n');
            for (const para of paragraphs) {
              if ((currentMessage + para).length > maxLength) {
                if (currentMessage) {
                  await this.accountabilityChannel.send(currentMessage);
                }
                currentMessage = para + '\n\n';
              } else {
                currentMessage += para + '\n\n';
              }
            }
          } else {
            currentMessage = section;
          }
        } else {
          currentMessage += section;
        }
      }

      // Send any remaining message
      if (currentMessage) {
        await this.accountabilityChannel.send(currentMessage);
      }
    }
  }

  /**
   * Manually trigger mid-week analysis (for testing)
   */
  async triggerManually(): Promise<void> {
    console.log('🔧 Manually triggering mid-week analysis...');
    await this.runMidWeekAnalysis();
  }

  /**
   * Get the next scheduled run time
   */
  private getNextRunTime(): Date {
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 = Sunday, 3 = Wednesday
    const hour = now.getHours();

    let daysUntilWednesday: number;

    if (dayOfWeek < 3) {
      // Before Wednesday this week
      daysUntilWednesday = 3 - dayOfWeek;
    } else if (dayOfWeek === 3 && hour < 20) {
      // It's Wednesday but before 8pm
      daysUntilWednesday = 0;
    } else {
      // After Wednesday this week, go to next Wednesday
      daysUntilWednesday = 7 - dayOfWeek + 3;
    }

    const nextRun = new Date(now);
    nextRun.setDate(now.getDate() + daysUntilWednesday);
    nextRun.setHours(20, 0, 0, 0);

    return nextRun;
  }

  /**
   * Get scheduler status
   */
  getStatus(): { isRunning: boolean; nextRun: Date | null } {
    return {
      isRunning: this.isRunning,
      nextRun: this.isRunning ? this.getNextRunTime() : null,
    };
  }
}
