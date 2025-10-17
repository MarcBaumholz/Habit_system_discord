import { Client, TextChannel } from 'discord.js';
import { NotionClient } from '../notion/client';
import { DiscordLogger } from './discord-logger';
import { AIIncentiveManager } from './ai-incentive-manager';
import * as cron from 'node-cron';

export class DailyMessageScheduler {
  private client: Client;
  private notion: NotionClient;
  private logger: DiscordLogger;
  private accountabilityChannelId: string;
  private startDate: Date;
  private motivationalQuotes: string[];
  private aiIncentiveManager: AIIncentiveManager;

  constructor(client: Client, notion: NotionClient, logger: DiscordLogger) {
    this.client = client;
    this.notion = notion;
    this.logger = logger;
    this.accountabilityChannelId = process.env.DISCORD_ACCOUNTABILITY_GROUP || '';
    this.aiIncentiveManager = new AIIncentiveManager(client, notion, logger);
    
    // Set start date to Monday, October 6, 2025 (Day 1 of the challenge)
    // Since today is Tuesday (Day 2), we start counting from Monday
    this.startDate = new Date('2025-10-06T00:00:00.000Z'); // Monday, Day 1
    
    // Collection of motivational quotes for 66 days
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
      "Der einzige Weg, großartige Arbeit zu leisten, ist zu lieben, was du tust. - Steve Jobs",
      "Du kannst deine Vergangenheit nicht ändern, aber du kannst deine Zukunft gestalten. - Unbekannt",
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
      "Der einzige Weg, großartige Arbeit zu leisten, ist zu lieben, was du tust. - Steve Jobs",
      "Du kannst deine Vergangenheit nicht ändern, aber du kannst deine Zukunft gestalten. - Unbekannt",
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
      "If life were predictable it would cease to be life, and be without flavor. - Eleanor Roosevelt",
      "The future belongs to those who believe in the beauty of their dreams. - Eleanor Roosevelt",
      "It is during our darkest moments that we must focus to see the light. - Aristotle",
      "The only way to do great work is to love what you do. - Steve Jobs",
      "If you can dream it, you can do it. - Walt Disney"
    ];
  }

  /**
   * Calculate the current day number (1-66)
   * Monday Oct 6, 2025 = Day 1
   * Tuesday Oct 7, 2025 = Day 2  
   * Wednesday Oct 8, 2025 = Day 3
   */
  getCurrentDay(): number {
    const now = new Date();
    
    // Normalize both dates to start of day in UTC
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfStartDate = new Date(this.startDate.getFullYear(), this.startDate.getMonth(), this.startDate.getDate());
    
    // Calculate difference in days
    const timeDiff = startOfToday.getTime() - startOfStartDate.getTime();
    const daysDiff = Math.floor(timeDiff / (1000 * 3600 * 24)) + 1;
    
    // Clamp between 1 and 66, but ensure we don't go below 1
    const currentDay = Math.max(1, Math.min(daysDiff, 66));
    
    console.log(`📅 Day calculation: Today=${startOfToday.toISOString().split('T')[0]}, Start=${startOfStartDate.toISOString().split('T')[0]}, Day=${currentDay}`);
    
    return currentDay;
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
      `🌅 **Welcome to Day ${day}/66!**\n\n💪 *${quote}*\n\n🎯 Today's your day to shine! What habit will you conquer today?`,
      `☀️ **Good morning! Day ${day}/66 of your journey**\n\n✨ *${quote}*\n\n🚀 Ready to make today count?`,
      `🌞 **Day ${day}/66 - Let's go!**\n\n💫 *${quote}*\n\n🔥 Your consistency is building something amazing!`,
      `🌄 **Rise and grind! Day ${day}/66**\n\n⭐ *${quote}*\n\n💎 Every day you show up, you're getting stronger!`,
      `🌅 **Day ${day}/66 - You've got this!**\n\n🌟 *${quote}*\n\n⚡ Small actions, big changes - keep going!`
    ];

    // Use day number to cycle through different message formats
    const messageIndex = (day - 1) % messages.length;
    return messages[messageIndex];
  }

  /**
   * Send daily motivational message to accountability channel
   */
  async sendDailyMessage(): Promise<void> {
    try {
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

      const currentDay = this.getCurrentDay();
      const message = this.generateDailyMessage(currentDay);
      const now = new Date();

      // Send message immediately (cron scheduler handles timing)
      await channel.send(message);
      console.log(`✅ Daily message sent for day ${currentDay}/66`);
      
      // Log success
      await this.logger.success(
        'SCHEDULER',
        'Daily Message Sent',
        `Daily motivational message sent for day ${currentDay}/66`,
        {
          day: currentDay,
          totalDays: 66,
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
      const message = this.generateDailyMessage(currentDay);
      
      await channel.send(`🧪 **TEST MESSAGE** - ${message}`);
      console.log(`✅ Test message sent for day ${currentDay}/66`);
      
      await this.logger.success(
        'SCHEDULER',
        'Test Message Sent',
        `Test daily motivational message sent for day ${currentDay}/66`,
        {
          day: currentDay,
          totalDays: 66,
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

    // Schedule AI Incentive analysis for Sunday 8 AM (0 8 * * 0)
    const aiIncentiveTask = cron.schedule('0 8 * * 0', async () => {
      try {
        console.log('🧠 AI Incentive scheduler triggered on Sunday at 8 AM...');
        
        await this.logger.info(
          'AI_INCENTIVE',
          'AI Incentive Task Triggered',
          'Weekly AI incentive analysis triggered by cron on Sunday at 8 AM',
          {
            cronExpression: '0 8 * * 0',
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
            cronExpression: '0 8 * * 0',
            timezone: timezone
          }
        );
      }
    }, {
      scheduled: true,
      timezone: timezone
    });

    console.log(`📅 Daily message scheduler started (6 AM daily, timezone: ${timezone})`);
    console.log(`🧠 AI Incentive scheduler started (Sunday 8 AM, timezone: ${timezone})`);
    
    this.logger.success(
      'SCHEDULER',
      'Scheduler Started',
      'Daily message scheduler and AI incentive scheduler started successfully',
      {
        dailyCron: '0 6 * * *',
        aiIncentiveCron: '0 8 * * 0',
        timezone: timezone,
        accountabilityChannelId: this.accountabilityChannelId,
        startDate: this.startDate.toISOString(),
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
    const currentDay = this.getCurrentDay();
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfStartDate = new Date(this.startDate.getFullYear(), this.startDate.getMonth(), this.startDate.getDate());
    
    return {
      currentDay,
      startDate: this.startDate.toISOString(),
      today: startOfToday.toISOString(),
      daysSinceStart: Math.floor((startOfToday.getTime() - startOfStartDate.getTime()) / (1000 * 3600 * 24)),
      accountabilityChannelId: this.accountabilityChannelId,
      timezone: process.env.TIMEZONE || 'Europe/Berlin',
      cronExpression: '0 6 * * *',
      nextMessageDate: currentDay < 66 ? `Day ${currentDay + 1}/66` : 'Challenge Complete!'
    };
  }
}
