import { Client, TextChannel } from 'discord.js';
import { NotionClient } from '../notion/client';
import { DiscordLogger } from './discord-logger';
import { AIIncentiveManager } from './ai-incentive-manager';
import { BuddyRotationScheduler } from './buddy-rotation-scheduler';
import * as cron from 'node-cron';
import { getCurrentBatch, getCurrentBatchDay, shouldBatchStart, updateBatchStatus } from '../utils/batch-manager';

export class DailyMessageScheduler {
  private client: Client;
  private notion: NotionClient;
  private logger: DiscordLogger;
  private accountabilityChannelId: string;
  private motivationalQuotes: string[];
  private aiIncentiveManager: AIIncentiveManager;
  private buddyScheduler: BuddyRotationScheduler | null;

  constructor(client: Client, notion: NotionClient, logger: DiscordLogger, buddyScheduler?: BuddyRotationScheduler) {
    this.client = client;
    this.notion = notion;
    this.logger = logger;
    this.accountabilityChannelId = process.env.DISCORD_ACCOUNTABILITY_GROUP || '';
    this.aiIncentiveManager = new AIIncentiveManager(client, notion, logger);
    this.buddyScheduler = buddyScheduler || null;

    // Collection of motivational quotes for 90 days (batch day is calculated from batch-manager)
    this.motivationalQuotes = [
      "Der Schlüssel zum Erfolg ist anzufangen. - Mark Twain",
      "Erfolg ist nicht endgültig, Misserfolg ist nicht tödlich: der Mut weiterzumachen zählt. - Winston Churchill",
      "Der Weg anzufangen ist aufzuhören zu reden und zu handeln. - Walt Disney",
      "Lass dich nicht von deinen Ängsten treiben. Lass dich von deinen Träumen führen. - Roy T. Bennett",
      "Glaube an dich und du bist schon halb da. - Theodore Roosevelt",
      "Die Zukunft gehört denen, die an die Schönheit ihrer Träume glauben. - Eleanor Roosevelt",
      "In unseren dunkelsten Momenten müssen wir uns darauf konzentrieren, das Licht zu sehen. - Aristoteles",
      "Der einzige Weg, großartige Arbeit zu leisten, ist zu lieben, was du tust. - Steve Jobs",
      "Wenn du es träumen kannst, kannst du es auch tun. - Walt Disney",
      "Erfolg bedeutet, von Misserfolg zu Misserfolg zu gehen, ohne die Begeisterung zu verlieren. - Winston Churchill",
      "Die einzige unmögliche Reise ist die, die du nie beginnst. - Tony Robbins",
      "In der Mitte der Schwierigkeit liegt die Gelegenheit. - Albert Einstein",
      "Das Leben ist das, was dir passiert, während du beschäftigt bist, andere Pläne zu machen. - John Lennon",
      "Deine Zeit ist begrenzt, verschwende sie nicht damit, das Leben eines anderen zu leben. - Steve Jobs",
      "Der Unterschied zwischen gewöhnlichen und außergewöhnlichen Menschen ist der kleine Extra-Einsatz. - Jimmy Johnson",
      "Du musst nicht perfekt sein, um großartig zu sein. - Unbekannt",
      "Jeder Meister war einmal ein Anfänger. Jeder Experte war einmal ein Amateur. - Robin Sharma",
      "Die Zukunft hängt davon ab, was du heute tust. - Mahatma Gandhi",
      "Gib niemals auf, denn das ist der Ort und die Zeit, an der das Leben sich wenden wird. - Harriet Beecher Stowe",
      "Das Leben ist 10% was dir passiert und 90% wie du darauf reagierst. - Charles R. Swindoll",
      "Erfolg ist die Summe kleiner Anstrengungen, die Tag für Tag wiederholt werden. - Robert Collier",
      "Du kannst deine Vergangenheit nicht ändern, aber du kannst deine Zukunft gestalten. - Unbekannt",
      "Der einzige Weg, die Grenzen des Möglichen zu entdecken, ist, ein wenig darüber hinauszugehen. - Arthur C. Clarke",
      "Gib niemals jemandem die Macht über dein Leben, über deine Gedanken oder über deine Gefühle. - Unbekannt",
      "Das Geheimnis des Vorankommens ist das Anfangen. - Mark Twain",
      "Du bist nie zu alt, um dir ein neues Ziel zu setzen oder einen neuen Traum zu träumen. - C.S. Lewis",
      "Der Unterschied zwischen dem Unmöglichen und dem Möglichen liegt in der Entschlossenheit einer Person. - Tommy Lasorda",
      "Erfolg ist nicht der Schlüssel zum Glück. Glück ist der Schlüssel zum Erfolg. - Albert Schweitzer",
      "Wenn du glücklich bist, wirst du erfolgreich sein. - Albert Schweitzer",
      "Disziplin schlägt Motivation, wenn Motivation fehlt. - Unbekannt",
      "Kleine Schritte jeden Tag ergeben große Wege. - Unbekannt",
      "Konstanz ist ein Versprechen an dich selbst. - Unbekannt",
      "Heute ist der beste Tag, wieder anzufangen. - Unbekannt",
      "Ausdauer ist Talent, das nicht aufgibt. - Unbekannt",
      "Mach es einfach, aber mach es täglich. - Unbekannt",
      "Nicht die Geschwindigkeit zählt, sondern die Richtung. - Unbekannt",
      "Ein Prozent besser jeden Tag macht einen großen Unterschied. - Unbekannt",
      "Weniger Perfektion, mehr Fortschritt. - Unbekannt",
      "Was du heute tust, verändert dein Morgen. - Unbekannt",
      "Zähle die Tage nicht, mach die Tage zählbar. - Unbekannt",
      "Routine baut Freiheit. - Unbekannt",
      "Motivation startet, Gewohnheit trägt. - Unbekannt",
      "Bleib bei deinem Warum, wenn das Wie schwer wird. - Unbekannt",
      "Vertrauen wächst aus wiederholter Handlung. - Unbekannt",
      "Dein zukünftiges Ich dankt dir für heute. - Unbekannt",
      "Jeder Tag ist eine neue Wiederholung, nicht ein Neustart. - Unbekannt",
      "Klarheit kommt durchs Tun. - Unbekannt",
      "Ein kleiner Sieg am Morgen färbt den Tag. - Unbekannt",
      "Wer langsam geht, kommt weit. - Unbekannt",
      "Stärke wächst im Stillen, sichtbar wird sie später. - Unbekannt",
      "Die Gewohnheit ist die unsichtbare Architektur des Alltags. - Unbekannt",
      "Handle, bevor du dich bereit fühlst. - Unbekannt",
      "Fokus ist die Entscheidung, was du weglässt. - Unbekannt",
      "Die beste Motivation ist der sichtbare Fortschritt. - Unbekannt",
      "If life were predictable it would cease to be life, and be without flavor. - Eleanor Roosevelt",
      "The future belongs to those who believe in the beauty of their dreams. - Eleanor Roosevelt",
      "It is during our darkest moments that we must focus to see the light. - Aristotle",
      "The only way to do great work is to love what you do. - Steve Jobs",
      "If you can dream it, you can do it. - Walt Disney",
      "Success is walking from failure to failure with no loss of enthusiasm. - Winston Churchill",
      "The only impossible journey is the one you never begin. - Tony Robbins",
      "In the middle of difficulty lies opportunity. - Albert Einstein",
      "Life is what happens to you while you're busy making other plans. - John Lennon",
      "The way to get started is to quit talking and begin doing. - Walt Disney",
      "Your time is limited, don't waste it living someone else's life. - Steve Jobs",
      "Small steps, repeated daily, build unstoppable momentum. - Unknown",
      "Consistency beats intensity when intensity fades. - Unknown",
      "Action creates clarity. - Unknown",
      "Progress, not perfection. - Unknown",
      "Show up, even if it's small. - Unknown",
      "Your future self is built by today's habits. - Unknown",
      "Discipline is choosing what you want most over what you want now. - Unknown",
      "Start where you are. Use what you have. Do what you can. - Unknown",
      "Make it easy, make it obvious, make it daily. - Unknown",
      "One good day can start a great streak. - Unknown",
      "Habits are the compound interest of self-improvement. - Unknown",
      "The work you do today becomes the strength you use tomorrow. - Unknown",
      "Don't break the chain. - Unknown",
      "Aim for repeatable, not perfect. - Unknown",
      "Momentum loves a simple plan. - Unknown",
      "Do the next right thing. - Unknown",
      "Focus on the process and the results will follow. - Unknown",
      "Tiny wins add up fast. - Unknown",
      "You don't need more time, you need a clear priority. - Unknown",
      "Consistency is a form of self-respect. - Unknown",
      "Make today count in a small, concrete way. - Unknown",
      "Keep promises to yourself. - Unknown",
      "Build the habit, then let the habit build you. - Unknown",
      "A little progress each day beats a lot of progress someday. - Unknown",
      "Start again. Start better. Start now. - Unknown"
    ];
  }

  /**
   * Calculate the current day number (1-90) from active batch
   * Returns null if no active batch
   */
  getCurrentDay(): number | null {
    return getCurrentBatchDay();
  }

  /**
   * Get motivational quote for the current day
   */
  getQuoteForDay(day: number): string {
    const index = (day - 1) % this.motivationalQuotes.length;
    return this.motivationalQuotes[index];
  }

  /**
   * Generate daily motivational message
   */
  generateDailyMessage(day: number): string {
    const quote = this.getQuoteForDay(day);
    
    const messages = [
      `🌅 **Welcome to Day ${day}/90!**\n\n💪 *${quote}*\n\n🎯 Today's your day to shine! What habit will you conquer today?`,
      `☀️ **Good morning! Day ${day}/90 of your journey**\n\n✨ *${quote}*\n\n🚀 Ready to make today count?`,
      `🌞 **Day ${day}/90 - Let's go!**\n\n💫 *${quote}*\n\n🔥 Your consistency is building something amazing!`,
      `🌄 **Rise and grind! Day ${day}/90**\n\n⭐ *${quote}*\n\n💎 Every day you show up, you're getting stronger!`,
      `🌅 **Day ${day}/90 - You've got this!**\n\n🌟 *${quote}*\n\n⚡ Small actions, big changes - keep going!`
    ];

    // Use day number to cycle through different message formats
    const messageIndex = (day - 1) % messages.length;
    return messages[messageIndex];
  }

  /**
   * Check if batch should start and activate it
   * Called at the beginning of daily message scheduler
   */
  private async checkAndActivateBatch(): Promise<void> {
    try {
      // Check if batch should transition from pre-phase to active
      if (shouldBatchStart()) {
        const batch = getCurrentBatch();
        if (!batch) return;

        console.log(`🎯 Batch "${batch.name}" start date has arrived! Activating batch...`);

        // Update batch status to active
        updateBatchStatus('active');

        await this.logger.success(
          'BATCH_ACTIVATION',
          'Batch Activated',
          `Batch "${batch.name}" has been activated - Day 1 begins!`,
          {
            batchName: batch.name,
            startDate: batch.startDate
          }
        );

        // Get users who already joined during pre-phase
        const batchUsers = await this.notion.getUsersInBatch(batch.name);
        // Only count active users (filter out paused users)
        const activeUsers = batchUsers.filter(user => user.status === 'active');
        const enrolledCount = activeUsers.length;
        console.log(`👥 Batch "${batch.name}" has ${enrolledCount} active users (${batchUsers.length} total users) who joined during pre-phase`);

        // Assign buddies for the batch
        if (this.buddyScheduler) {
          try {
            const buddyPairsCount = await this.buddyScheduler.assignBuddiesForBatch(batch.name);
            console.log(`👥 Created ${buddyPairsCount} buddy pairs for batch "${batch.name}"`);

            await this.logger.success(
              'BUDDY_ASSIGNMENT',
              'Buddies Assigned on Day 1',
              `Assigned ${buddyPairsCount} buddy pairs for batch "${batch.name}"`,
              {
                batchName: batch.name,
                pairsCreated: buddyPairsCount,
                enrolledUsers: enrolledCount,
                totalUsers: batchUsers.length
              }
            );
          } catch (error) {
            console.error('❌ Error assigning buddies on batch activation:', error);
            await this.logger.logError(
              error as Error,
              'Buddy Assignment on Batch Activation Failed',
              { batchName: batch.name }
            );
          }
        }

        // Send announcement to accountability channel
        const channel = this.client.channels.cache.get(this.accountabilityChannelId) as TextChannel;
        if (channel) {
          await channel.send(
            `🎉 **Day 1 of 90 - Let's Go!**\n\n` +
            `📦 **Batch:** ${batch.name}\n` +
            `👥 **Enrolled:** ${enrolledCount} active participants\n` +
            `📅 **End Date:** ${batch.endDate}\n\n` +
            `💪 Your 90-day journey begins today! Check your personal channel for your buddy assignment and daily message.`
          );
        }
      }
    } catch (error) {
      console.error('❌ Error checking/activating batch:', error);
      await this.logger.logError(
        error as Error,
        'Batch Activation Check Failed',
        { component: 'DailyMessageScheduler' }
      );
    }
  }

  /**
   * Send daily motivational message to accountability channel
   */
  async sendDailyMessage(): Promise<void> {
    try {
      // First, check if batch should be activated (pre-phase → active transition)
      await this.checkAndActivateBatch();

      // Check if there's an active batch
      const batch = getCurrentBatch();
      if (!batch) {
        console.log('⏸️ No active batch - skipping daily message');
        return;
      }

      // Get current day
      const currentDay = this.getCurrentDay();
      if (!currentDay) {
        console.log('⏸️ Cannot determine current day - skipping daily message');
        return;
      }

      // Check if batch is completed (day 90 reached)
      if (currentDay > 90) {
        console.log(`✅ Batch "${batch.name}" completed (Day ${currentDay}) - skipping daily message`);
        return;
      }

      const channel = this.client.channels.cache.get(this.accountabilityChannelId) as TextChannel;
      if (!channel) {
        await this.logger.error(
          'SCHEDULER',
          'Daily Message Failed',
          'Accountability channel not found',
          {
            channelId: this.accountabilityChannelId,
            availableChannels: this.client.channels.cache.size
          }
        );
        console.error('Accountability channel not found');
        return;
      }

      const message = this.generateDailyMessage(currentDay);
      const now = new Date();

      // Send message immediately (cron scheduler handles timing)
      await channel.send(message);
      console.log(`✅ Daily message sent for batch "${batch.name}" - Day ${currentDay}/90`);

      // Log success
      await this.logger.success(
        'SCHEDULER',
        'Daily Message Sent',
        `Daily motivational message sent for batch "${batch.name}" - Day ${currentDay}/90`,
        {
          batchName: batch.name,
          day: currentDay,
          totalDays: 90,
          channelId: this.accountabilityChannelId,
          messageLength: message.length,
          sentAt: now.toISOString(),
          timezone: process.env.TIMEZONE || 'Europe/Berlin'
        }
      );

    } catch (error) {
      await this.logger.logError(
        error as Error,
        'Daily Message Sending',
        {
          channelId: this.accountabilityChannelId,
          currentDay: this.getCurrentDay()
        }
      );
      console.error('Error sending daily message:', error);
    }
  }

  /**
   * Test function to send daily message manually (for testing purposes)
   */
  async testSendDailyMessage(): Promise<void> {
    try {
      console.log('🧪 Testing daily message sending...');
      
      const channel = this.client.channels.cache.get(this.accountabilityChannelId) as TextChannel;
      if (!channel) {
        console.error('❌ Test failed: Accountability channel not found');
        return;
      }

      const currentDay = this.getCurrentDay();
      if (!currentDay) {
        console.error('❌ No active batch - cannot send test message');
        return;
      }
      const message = this.generateDailyMessage(currentDay);

      await channel.send(`🧪 **TEST MESSAGE** - ${message}`);
      console.log(`✅ Test message sent for day ${currentDay}/90`);
      
      await this.logger.success(
        'SCHEDULER',
        'Test Message Sent',
        `Test daily motivational message sent for day ${currentDay}/90`,
        {
          day: currentDay,
          totalDays: 90,
          channelId: this.accountabilityChannelId,
          messageLength: message.length,
          testMode: true
        }
      );
      
    } catch (error) {
      console.error('❌ Test failed:', error);
      await this.logger.logError(
        error as Error,
        'Test Daily Message Sending',
        {
          channelId: this.accountabilityChannelId,
          currentDay: this.getCurrentDay()
        }
      );
    }
  }

  /**
   * Start the daily message scheduler (runs at 6 AM every day)
   */
  startScheduler(): void {
    const timezone = process.env.TIMEZONE || 'Europe/Berlin';
    
    // Schedule for 6 AM every day (0 6 * * *)
    const task = cron.schedule('0 6 * * *', async () => {
      try {
        console.log('🕰️ Daily message scheduler triggered at 6 AM...');
        
        await this.logger.info(
          'SCHEDULER',
          'Scheduled Task Triggered',
          'Daily motivational message task triggered by cron at 6 AM',
          {
            cronExpression: '0 6 * * *',
            timezone: timezone,
            currentDay: this.getCurrentDay(),
            triggerTime: new Date().toISOString()
          }
        );
        
        // Send the daily message
        await this.sendDailyMessage();
        
        console.log('✅ Daily message scheduler completed successfully');
        
      } catch (error) {
        console.error('❌ Error in daily message scheduler:', error);
        await this.logger.logError(
          error as Error,
          'Daily Message Scheduler Error',
          {
            cronExpression: '0 6 * * *',
            timezone: timezone,
            currentDay: this.getCurrentDay()
          }
        );
      }
    }, {
      scheduled: true,
      timezone: timezone
    });

    // Schedule AI Incentive analysis for Sunday 8 PM (0 20 * * 0)
    const aiIncentiveTask = cron.schedule('0 20 * * 0', async () => {
      try {
        console.log('🧠 AI Incentive scheduler triggered on Sunday at 8 PM...');
        
        await this.logger.info(
          'AI_INCENTIVE',
          'AI Incentive Task Triggered',
          'Weekly AI incentive analysis triggered by cron on Sunday at 8 PM',
          {
            cronExpression: '0 20 * * 0',
            timezone: timezone,
            triggerTime: new Date().toISOString()
          }
        );
        
        // Run AI incentive analysis for all users
        await this.aiIncentiveManager.runWeeklyAIIncentiveAnalysis();
        
        console.log('✅ AI Incentive analysis completed successfully');
        
      } catch (error) {
        console.error('❌ Error in AI incentive scheduler:', error);
        await this.logger.logError(
          error as Error,
          'AI Incentive Scheduler Error',
          {
            cronExpression: '0 20 * * 0',
            timezone: timezone
          }
        );
      }
    }, {
      scheduled: true,
      timezone: timezone
    });

    console.log(`📅 Daily message scheduler started (6 AM daily, timezone: ${timezone})`);
    console.log(`🧠 AI Incentive scheduler started (Sunday 8 PM, timezone: ${timezone})`);
    
    const batch = getCurrentBatch();
    this.logger.success(
      'SCHEDULER',
      'Scheduler Started',
      'Daily message scheduler and AI incentive scheduler started successfully',
      {
        dailyCron: '0 6 * * *',
        aiIncentiveCron: '0 20 * * 0',
        timezone: timezone,
        accountabilityChannelId: this.accountabilityChannelId,
        activeBatch: batch ? batch.name : 'None',
        batchStartDate: batch ? batch.startDate : 'N/A',
        currentDay: this.getCurrentDay()
      }
    );
  }

  /**
   * Stop the scheduler
   */
  stopScheduler(): void {
    cron.getTasks().forEach(task => task.stop());
    console.log('⏹️ Daily message scheduler stopped');
  }

  /**
   * Manually trigger daily message (for testing)
   */
  async triggerDailyMessage(): Promise<void> {
    console.log('🧪 Manually triggering daily message...');
    await this.sendDailyMessage();
  }

  /**
   * Get scheduler status and current day info (for debugging)
   */
  getSchedulerStatus(): any {
    const batch = getCurrentBatch();
    const currentDay = this.getCurrentDay();

    if (!batch) {
      return {
        status: 'No active batch',
        currentDay: null,
        accountabilityChannelId: this.accountabilityChannelId,
        timezone: process.env.TIMEZONE || 'Europe/Berlin',
        cronExpression: '0 6 * * *'
      };
    }

    return {
      status: 'Active',
      batchName: batch.name,
      currentDay,
      startDate: batch.startDate,
      daysRemaining: currentDay ? Math.max(0, 90 - currentDay) : 0,
      accountabilityChannelId: this.accountabilityChannelId,
      timezone: process.env.TIMEZONE || 'Europe/Berlin',
      cronExpression: '0 6 * * *',
      nextMessageDate: currentDay && currentDay < 90 ? `Day ${currentDay + 1}/90` : 'Batch Complete!'
    };
  }
}
