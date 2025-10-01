import { Client, TextChannel } from 'discord.js';
import { NotionClient } from '../notion/client';
import { DiscordLogger } from './discord-logger';
import * as cron from 'node-cron';

export class DailyMessageScheduler {
  private client: Client;
  private notion: NotionClient;
  private logger: DiscordLogger;
  private accountabilityChannelId: string;
  private startDate: Date;
  private motivationalQuotes: string[];

  constructor(client: Client, notion: NotionClient, logger: DiscordLogger) {
    this.client = client;
    this.notion = notion;
    this.logger = logger;
    this.accountabilityChannelId = process.env.DISCORD_ACCOUNTABILITY_GROUP || '';
    
    // Set start date to tomorrow (so it starts counting from day 1)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0); // Start of tomorrow
    this.startDate = tomorrow;
    
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
   */
  getCurrentDay(): number {
    const today = new Date();
    const timeDiff = today.getTime() - this.startDate.getTime();
    const daysDiff = Math.floor(timeDiff / (1000 * 3600 * 24)) + 1;
    return Math.min(Math.max(daysDiff, 1), 66); // Clamp between 1 and 66
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

      // Only send message if it's actually time for daily message (not on startup)
      const now = new Date();
      const currentHour = now.getHours();
      
      // Only send if it's actually 6 AM (or close to it)
      if (currentHour === 6) {
        await channel.send(message);
        console.log(`✅ Daily message sent for day ${currentDay}/66`);
        
        // Only log success if message was actually sent
        await this.logger.success(
          'SCHEDULER',
          'Daily Message Sent',
          `Daily motivational message sent for day ${currentDay}/66`,
          {
            day: currentDay,
            totalDays: 66,
            channelId: this.accountabilityChannelId,
            messageLength: message.length,
            sentAt: now.toISOString()
          }
        );
      } else {
        console.log(`⏰ Daily message scheduled for day ${currentDay}/66 (will send at 6 AM)`);
        
        // Log scheduling info instead of success
        await this.logger.info(
          'SCHEDULER',
          'Daily Message Scheduled',
          `Daily motivational message scheduled for day ${currentDay}/66 (will send at 6 AM)`,
          {
            day: currentDay,
            totalDays: 66,
            channelId: this.accountabilityChannelId,
            messageLength: message.length,
            currentHour: currentHour,
            scheduledFor: '06:00'
          }
        );
      }

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
    // Schedule for 6 AM every day (0 6 * * *)
    const task = cron.schedule('0 6 * * *', async () => {
      console.log('🕰️ Sending daily motivational message...');
      await this.logger.info(
        'SCHEDULER',
        'Scheduled Task Triggered',
        'Daily motivational message task triggered by cron',
        {
          cronExpression: '0 6 * * *',
          timezone: process.env.TIMEZONE || 'Europe/Berlin'
        }
      );
      await this.sendDailyMessage();
    }, {
      scheduled: true,
      timezone: process.env.TIMEZONE || 'Europe/Berlin'
    });

    console.log('📅 Daily message scheduler started (6 AM daily)');
    
    this.logger.success(
      'SCHEDULER',
      'Scheduler Started',
      'Daily message scheduler started successfully',
      {
        cronExpression: '0 6 * * *',
        timezone: process.env.TIMEZONE || 'Europe/Berlin',
        accountabilityChannelId: this.accountabilityChannelId
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
}
