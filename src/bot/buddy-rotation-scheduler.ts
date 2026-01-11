/**
 * Buddy Assignment Manager
 *
 * Assigns buddy pairs at the start of each batch (90-day cycle)
 * Pairs active users in the current batch randomly and updates their buddy assignments in Notion
 * Buddies stay together for the entire 90-day batch
 */

import { Client, TextChannel } from 'discord.js';
import { NotionClient } from '../notion/client';
import { DiscordLogger } from './discord-logger';
import { User } from '../types';

export class BuddyRotationScheduler {
  private client: Client;
  private notion: NotionClient;
  private logger: DiscordLogger;

  constructor(
    client: Client,
    notion: NotionClient,
    logger: DiscordLogger
  ) {
    this.client = client;
    this.notion = notion;
    this.logger = logger;
  }

  /**
   * Assign buddies for a new batch - pair active users in the batch randomly
   * @param batchName - Name of the batch (e.g., "january 2026")
   * @returns Number of pairs created
   */
  async assignBuddiesForBatch(batchName: string): Promise<number> {
    try {
      await this.logger.info(
        'BUDDY_ASSIGNMENT',
        'Assignment Started',
        `Starting buddy assignment for batch: ${batchName}`,
        {
          batchName: batchName,
          time: new Date().toLocaleTimeString()
        }
      );

      // Get all active users in this batch
      const batchUsers = await this.notion.getUsersInBatch(batchName);
      const activeUsers = batchUsers.filter(user => user.status === 'active');

      if (activeUsers.length < 2) {
        await this.logger.info(
          'BUDDY_ASSIGNMENT',
          'Assignment Skipped',
          'Not enough active users in batch for pairing',
          {
            batchName: batchName,
            activeUsersCount: activeUsers.length
          }
        );
        console.log(`⚠️ Not enough active users in batch "${batchName}" for buddy assignment (${activeUsers.length} users)`);
        return 0;
      }

      console.log(`👥 Assigning buddies for ${activeUsers.length} active users in batch "${batchName}"`);

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
        'BUDDY_ASSIGNMENT',
        'Assignment Completed',
        `Buddy assignment completed successfully for batch: ${batchName}`,
        {
          batchName: batchName,
          pairsCreated: pairs.length,
          totalUsers: activeUsers.length
        }
      );

      console.log(`✅ Buddy assignment completed for batch "${batchName}": ${pairs.length} pairs created`);
      return pairs.length;
    } catch (error) {
      await this.logger.logError(
        error as Error,
        'Buddy Assignment Failed',
        { scheduler: 'buddy_assignment', batchName: batchName }
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

      const message = `👥 **Buddy Assignment for 90-Day Challenge!**

Your accountability buddy is **${buddy.name}**!

You'll be paired together for the **entire 90-day batch** (from Day 1 to Day 90). Support each other, share your progress, and help each other stay accountable throughout the journey!

💪 **Remember:** Check in with your buddy regularly and celebrate each other's wins!

*Your buddy stays with you for the full batch - no rotations!*`;

      await channel.send(message);
      console.log(`✅ Notified ${user.name} about new buddy ${buddy.name}`);
    } catch (error) {
      console.error(`❌ Error notifying user ${user.name} about new buddy:`, error);
      // Don't throw - continue with other notifications
    }
  }

  /**
   * Clear all buddy assignments (for testing/debugging)
   */
  async clearAllBuddies(): Promise<void> {
    try {
      const allUsers = await this.notion.getActiveUsers();

      for (const user of allUsers) {
        await this.notion.updateUserBuddy(user.id, null, null);
      }

      console.log(`✅ Cleared buddy assignments for ${allUsers.length} users`);

      await this.logger.info(
        'BUDDY_ASSIGNMENT',
        'Buddies Cleared',
        'All buddy assignments cleared',
        { usersAffected: allUsers.length }
      );
    } catch (error) {
      console.error('❌ Error clearing buddy assignments:', error);
      throw error;
    }
  }
}
