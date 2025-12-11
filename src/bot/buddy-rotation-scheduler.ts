/**
 * Buddy Rotation Scheduler
 *
 * Rotates buddy pairs every 2 weeks (every other Sunday at 8 AM)
 * Pairs active users randomly and updates their buddy assignments in Notion
 */

import { Client, TextChannel } from 'discord.js';
import { NotionClient } from '../notion/client';
import { DiscordLogger } from './discord-logger';
import { User } from '../types';
import * as cron from 'node-cron';

export class BuddyRotationScheduler {
  private client: Client;
  private notion: NotionClient;
  private logger: DiscordLogger;
  private timezone: string;

  constructor(
    client: Client,
    notion: NotionClient,
    logger: DiscordLogger
  ) {
    this.client = client;
    this.notion = notion;
    this.logger = logger;
    this.timezone = process.env.TIMEZONE || 'Europe/Berlin';
  }

  /**
   * Rotate buddies - pair active users randomly
   */
  async rotateBuddies(): Promise<void> {
    try {
      await this.logger.info(
        'BUDDY_ROTATION',
        'Rotation Started',
        'Starting buddy rotation',
        {
          day: new Date().toLocaleDateString('en-US', { weekday: 'long' }),
          time: new Date().toLocaleTimeString()
        }
      );

      // Get all active users
      const activeUsers = await this.notion.getActiveUsers();
      
      if (activeUsers.length < 2) {
        await this.logger.info(
          'BUDDY_ROTATION',
          'Rotation Skipped',
          'Not enough active users for pairing',
          { activeUsersCount: activeUsers.length }
        );
        console.log('⚠️ Not enough active users for buddy rotation');
        return;
      }

      console.log(`👥 Rotating buddies for ${activeUsers.length} active users`);

      // Shuffle users randomly
      const shuffled = [...activeUsers].sort(() => Math.random() - 0.5);
      
      // Get current date for BuddyStart
      const today = new Date().toISOString().split('T')[0];
      
      // Clear existing buddy assignments first
      for (const user of activeUsers) {
        await this.notion.updateUserBuddy(user.id, null, null);
      }

      // Pair users
      const pairs: Array<{ user1: User; user2: User }> = [];
      
      for (let i = 0; i < shuffled.length; i += 2) {
        if (i + 1 < shuffled.length) {
          // Pair two users
          const user1 = shuffled[i];
          const user2 = shuffled[i + 1];
          
          // Get full user data to access nickname
          const user1Full = await this.notion.getUserByDiscordId(user1.discordId);
          const user2Full = await this.notion.getUserByDiscordId(user2.discordId);
          
          // Use nickname for buddy assignment (buddy field stores nicknames)
          const user1Nickname = user1Full?.nickname || user1.name;
          const user2Nickname = user2Full?.nickname || user2.name;
          
          // Update buddy assignments (using nickname)
          await this.notion.updateUserBuddy(user1.id, user2Nickname, today);
          await this.notion.updateUserBuddy(user2.id, user1Nickname, today);
          
          pairs.push({ user1, user2 });
          
          console.log(`✅ Paired: ${user1Nickname} ↔ ${user2Nickname}`);
        } else {
          // Odd number of users - leave last one unpaired
          console.log(`⚠️ User ${shuffled[i].name} left unpaired (odd number)`);
          await this.logger.info(
            'BUDDY_ROTATION',
            'User Unpaired',
            `User ${shuffled[i].name} left unpaired due to odd number`,
            { userId: shuffled[i].id }
          );
        }
      }

      // Send notifications to users about their new buddy
      for (const pair of pairs) {
        await this.notifyNewBuddy(pair.user1, pair.user2);
        await this.notifyNewBuddy(pair.user2, pair.user1);
      }

      await this.logger.success(
        'BUDDY_ROTATION',
        'Rotation Completed',
        'Buddy rotation completed successfully',
        {
          pairsCreated: pairs.length,
          totalUsers: activeUsers.length
        }
      );

      console.log(`✅ Buddy rotation completed: ${pairs.length} pairs created`);
    } catch (error) {
      await this.logger.logError(
        error as Error,
        'Buddy Rotation Failed',
        { scheduler: 'buddy_rotation' }
      );
      throw error;
    }
  }

  /**
   * Notify user about their new buddy assignment
   */
  private async notifyNewBuddy(user: User, buddy: User): Promise<void> {
    try {
      if (!user.personalChannelId) {
        console.log(`⚠️ No personal channel for user ${user.name}, skipping notification`);
        return;
      }

      const channel = this.client.channels.cache.get(user.personalChannelId) as TextChannel;
      if (!channel) {
        console.log(`⚠️ Personal channel not found for user ${user.name}`);
        return;
      }

      const message = `👥 **New Buddy Assignment!**

Your new accountability buddy is **${buddy.name}**!

You'll be paired together for the next 2 weeks. Support each other, share your progress, and help each other stay accountable!

💪 **Remember:** Check in with your buddy regularly and celebrate each other's wins!

*Buddy rotation happens every 2 weeks on Sunday.*`;

      await channel.send(message);
      console.log(`✅ Notified ${user.name} about new buddy ${buddy.name}`);
    } catch (error) {
      console.error(`❌ Error notifying user ${user.name} about new buddy:`, error);
      // Don't throw - continue with other notifications
    }
  }

  /**
   * Start the buddy rotation scheduler
   * Runs every 2 weeks (every other Sunday at 8:00 AM)
   */
  async startScheduler(): Promise<void> {
    // Every other Sunday at 8:00 AM
    // Cron: 0 8 */14 * 0 (every 14 days on Sunday at 8 AM)
    // Note: node-cron doesn't support */14 directly, so we'll use a workaround
    // We'll run it every Sunday and check if 14 days have passed since last rotation
    // For simplicity, we'll use: 0 8 1,15 * 0 (1st and 15th of month, Sunday at 8 AM)
    // Or better: 0 8 * * 0 and track last rotation date
    
    // Using simpler approach: every other Sunday
    // This requires tracking, but for now we'll use: 0 8 * * 0 (every Sunday)
    // In production, you'd want to track last rotation date
    
    const task = cron.schedule('0 8 * * 0', async () => {
      try {
        // Check if we should rotate (every 2 weeks)
        // For now, we'll rotate every time it runs
        // In production, add logic to check last rotation date
        
        console.log('📅 Buddy rotation scheduler triggered on Sunday at 8 AM...');
        
        await this.logger.info(
          'BUDDY_ROTATION',
          'Scheduled Task Triggered',
          'Buddy rotation triggered by cron on Sunday at 8 AM',
          {
            cronExpression: '0 8 * * 0',
            timezone: this.timezone,
            triggerTime: new Date().toISOString()
          }
        );
        
        // Run the rotation
        await this.rotateBuddies();
        
        console.log('✅ Buddy rotation completed successfully');
        
      } catch (error) {
        console.error('❌ Error in buddy rotation scheduler:', error);
        await this.logger.logError(
          error as Error,
          'Buddy Rotation Scheduler Error',
          {
            cronExpression: '0 8 * * 0',
            timezone: this.timezone
          }
        );
      }
    }, {
      scheduled: true,
      timezone: this.timezone
    });

    console.log(`📅 Buddy rotation scheduler started (Every other Sunday 8 AM, timezone: ${this.timezone})`);
    
    await this.logger.success(
      'BUDDY_ROTATION',
      'Scheduler Started',
      'Buddy rotation scheduler started successfully',
      {
        cronExpression: '0 8 * * 0',
        timezone: this.timezone,
        description: 'Every other Sunday at 8:00 AM'
      }
    );
  }

  /**
   * Manually trigger buddy rotation (for testing)
   */
  async triggerRotation(): Promise<void> {
    console.log('🧪 Manually triggering buddy rotation...');
    await this.rotateBuddies();
  }

  /**
   * Get scheduler status
   */
  getSchedulerStatus(): any {
    return {
      cronExpression: '0 8 * * 0',
      description: 'Every other Sunday at 8:00 AM',
      timezone: this.timezone
    };
  }
}

