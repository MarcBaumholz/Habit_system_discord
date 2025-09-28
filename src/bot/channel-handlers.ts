import { Client, TextChannel } from 'discord.js';
import { NotionClient } from '../notion/client';

export class ChannelHandlers {
  private client: Client;
  private notion: NotionClient;
  private learningsChannelId: string;
  private weeklyReviewsChannelId: string;

  constructor(client: Client, notion: NotionClient) {
    this.client = client;
    this.notion = notion;
    this.learningsChannelId = process.env.DISCORD_LEARNINGS_CHANNEL || '';
    this.weeklyReviewsChannelId = process.env.DISCORD_WEEKLY_REVIEWS_CHANNEL || '';
  }

  async postToLearningsChannel(content: string, userId: string) {
    try {
      const channel = this.client.channels.cache.get(this.learningsChannelId) as TextChannel;
      if (!channel) {
        console.error('Learnings channel not found');
        return;
      }

      await channel.send({
        content: `💡 **New Learning Shared**\n\n${content}\n\n*Shared by <@${userId}>*`,
        allowedMentions: { users: [userId] }
      });

      // Also save to Notion
      await this.notion.createLearning({
        userId,
        habitId: 'general', // For now, we'll use a general habit ID
        text: content,
        createdAt: new Date().toISOString()
      });

    } catch (error) {
      console.error('Error posting to learnings channel:', error);
    }
  }

  async postToHurdlesChannel(name: string, description: string, type: string, userName: string) {
    try {
      const channel = this.client.channels.cache.get(this.learningsChannelId) as TextChannel;
      if (!channel) {
        console.error('Learnings and hurdles channel not found');
        return;
      }

      const message = `🚧 **New Hurdle Documented**

**${name}**
${description}

📊 **Details:**
• Type: ${type}
• Date: ${new Date().toLocaleDateString()}

*Documented by ${userName}*

💪 **Community Support Needed!**
Share strategies to help overcome this hurdle!`;

      await channel.send(message);

    } catch (error) {
      console.error('Error posting to hurdles channel:', error);
    }
  }

  async postWeeklyReview(weekNumber: number, groupStats: any) {
    try {
      const channel = this.client.channels.cache.get(this.weeklyReviewsChannelId) as TextChannel;
      if (!channel) {
        console.error('Weekly reviews channel not found');
        return;
      }

      const reviewMessage = `📊 **Weekly Review - Week ${weekNumber}**

🎯 **Group Statistics:**
• Active Users: ${groupStats.activeUsers || 0}
• Completion Rate: ${groupStats.completionRate || 0}%
• Total Proofs: ${groupStats.totalProofs || 0}
• Minimal Doses: ${groupStats.minimalDoses || 0}
• Cheat Days: ${groupStats.cheatDays || 0}

💡 **Reflection Questions:**
• What worked well this week?
• What challenges did you face?
• What will you do differently next week?
• Share one key learning from your habit journey!

🌟 **Top Performers:**
${groupStats.topPerformers || 'Keep up the great work everyone!'}

*Use \`/summary\` to see your personal progress*`;

      await channel.send(reviewMessage);

    } catch (error) {
      console.error('Error posting weekly review:', error);
    }
  }

  async postDailyReminder(userId: string, habitName: string, bestTime: string) {
    try {
      // This would be sent to the user's DM or personal channel
      // For now, we'll log it
      console.log(`Daily reminder for ${userId}: Time for ${habitName} at ${bestTime}`);
      
      // In a real implementation, you'd send this to the user's DM
      // const user = await this.client.users.fetch(userId);
      // await user.send(`🌅 Good morning! Time for your daily ${habitName}. Use \`/proof\` when done!`);

    } catch (error) {
      console.error('Error sending daily reminder:', error);
    }
  }

  async postGroupEncouragement(channelId: string, message: string) {
    try {
      const channel = this.client.channels.cache.get(channelId) as TextChannel;
      if (!channel) {
        console.error('Channel not found');
        return;
      }

      await channel.send(message);

    } catch (error) {
      console.error('Error posting group encouragement:', error);
    }
  }

  async handleProofReaction(proofMessage: any, reaction: any) {
    try {
      // When someone reacts to a proof, we can acknowledge it
      if (reaction.emoji.name === '👍' || reaction.emoji.name === '🎉') {
        await reaction.message.reply('✅ Great job! Keep up the consistency!');
      }

    } catch (error) {
      console.error('Error handling proof reaction:', error);
    }
  }

  async postDonationPoolUpdate(missedDays: number, totalPool: number) {
    try {
      const channel = this.client.channels.cache.get(this.weeklyReviewsChannelId) as TextChannel;
      if (!channel) {
        console.error('Weekly reviews channel not found');
        return;
      }

      if (missedDays > 0) {
        await channel.send(`💰 **Donation Pool Update**
        
📉 Missed Days This Week: ${missedDays}
💵 Total Pool: €${totalPool}
🎯 Remember: Missing a day adds €10 to the pool
💪 Let's reduce missed days next week!`);

      } else {
        await channel.send(`🎉 **Perfect Week!**
        
✅ Zero missed days this week!
🏆 Everyone stayed consistent
💪 Keep up the amazing work!`);

      }

    } catch (error) {
      console.error('Error posting donation pool update:', error);
    }
  }
}