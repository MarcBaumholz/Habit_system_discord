import { Client, TextChannel } from 'discord.js';
import { NotionClient } from '../notion/client';
import { User, Habit, Proof } from '../types';
import { DiscordLogger } from './discord-logger';

export class AIIncentiveManager {
  private client: Client;
  private notion: NotionClient;
  private logger: DiscordLogger;

  constructor(client: Client, notion: NotionClient, logger: DiscordLogger) {
    this.client = client;
    this.notion = notion;
    this.logger = logger;
  }

  /**
   * Main method to run weekly AI incentive analysis for all users
   */
  async runWeeklyAIIncentiveAnalysis(): Promise<void> {
    try {
      console.log('🧠 Starting weekly AI incentive analysis...');
      
      // Get all users from Notion
      const users = await this.getAllUsers();
      console.log(`📊 Found ${users.length} users for AI analysis`);

      for (const user of users) {
        try {
          await this.analyzeUserWeeklyProgress(user);
        } catch (error) {
          console.error(`❌ Error analyzing user ${user.name}:`, error);
          await this.logger.error(
            'AI_INCENTIVE',
            'User Analysis Failed',
            `Failed to analyze user ${user.name}`,
            {
              userId: user.id,
              error: (error as Error).message
            }
          );
        }
      }

      console.log('✅ Weekly AI incentive analysis completed');
    } catch (error) {
      console.error('❌ Error in weekly AI incentive analysis:', error);
      await this.logger.error(
        'AI_INCENTIVE',
        'Weekly Analysis Failed',
        'Failed to run weekly AI incentive analysis',
        {
          error: (error as Error).message
        }
      );
    }
  }

  /**
   * Analyze individual user's weekly progress and send AI incentive if needed
   */
  private async analyzeUserWeeklyProgress(user: User): Promise<void> {
    try {
      console.log(`🔍 Analyzing weekly progress for user: ${user.name}`);

      // Get user's habits
      const habits = await this.notion.getHabitsByUserId(user.id);
      if (habits.length === 0) {
        console.log(`⚠️ No habits found for user ${user.name}`);
        return;
      }

      // Get current week's proofs
      const weekInfo = this.getCurrentWeekInfo();
      const weekProofs = await this.notion.getProofsByUserId(
        user.id, 
        weekInfo.weekStart.toISOString().split('T')[0],
        weekInfo.weekEnd.toISOString().split('T')[0]
      );

      // Analyze each habit
      const habitAnalysis = await this.analyzeHabitsProgress(habits, weekProofs);
      
      // Check if AI incentive is needed
      const needsIncentive = this.shouldSendAIIncentive(habitAnalysis);
      
      if (needsIncentive) {
        await this.sendAIIncentiveMessage(user, habitAnalysis, weekInfo);
      } else {
        console.log(`✅ User ${user.name} is on track - no incentive needed`);
      }

    } catch (error) {
      console.error(`❌ Error analyzing user ${user.name}:`, error);
      throw error;
    }
  }

  /**
   * Analyze habits progress using Perplexity AI
   */
  private async analyzeHabitsProgress(habits: Habit[], weekProofs: Proof[]): Promise<{
    habitId: string;
    habitName: string;
    targetFrequency: number;
    actualFrequency: number;
    completionRate: number;
    needsImprovement: boolean;
    aiAnalysis: string;
  }[]> {
    const analysis = [];

    for (const habit of habits) {
      const habitProofs = weekProofs.filter(proof => proof.habitId === habit.id);
      const actualFrequency = habitProofs.length;
      const completionRate = Math.round((actualFrequency / habit.frequency) * 100);
      const needsImprovement = completionRate < 80; // Less than 80% completion

      // Get AI analysis for this habit
      const aiAnalysis = await this.getPerplexityAnalysis(habit, habitProofs, actualFrequency);

      analysis.push({
        habitId: habit.id,
        habitName: habit.name,
        targetFrequency: habit.frequency,
        actualFrequency,
        completionRate,
        needsImprovement,
        aiAnalysis
      });
    }

    return analysis;
  }

  /**
   * Get Perplexity AI analysis for a specific habit
   */
  private async getPerplexityAnalysis(habit: Habit, proofs: Proof[], actualFrequency: number): Promise<string> {
    try {
      if (!process.env.PERPLEXITY_API_KEY) {
        return "AI analysis not available - Perplexity API key missing";
      }

      const proofDetails = proofs.map(proof => ({
        date: proof.date,
        unit: proof.unit,
        note: proof.note,
        isMinimalDose: proof.isMinimalDose,
        isCheatDay: proof.isCheatDay
      }));

      const prompt = `You are a personal habit coach AI. Analyze this user's habit progress and provide motivational, constructive feedback.

Habit Details:
- Name: ${habit.name}
- Target: ${habit.frequency} times per week
- Actual: ${actualFrequency} times this week
- Completion Rate: ${Math.round((actualFrequency / habit.frequency) * 100)}%
- SMART Goal: ${habit.smartGoal}
- Context: ${habit.context}
- Why: ${habit.why}

This Week's Proofs:
${JSON.stringify(proofDetails, null, 2)}

Instructions:
1. If completion rate is 80% or higher: Give positive reinforcement and encouragement
2. If completion rate is below 80%: Provide constructive feedback and ask what challenges they faced
3. Be supportive, not judgmental
4. Suggest specific improvements if needed
5. Keep response under 60 words (very short!)
6. Write in German
7. Be concise and direct

Provide a motivational, helpful response:`;

      const response = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'sonar',
          messages: [
            { role: 'system', content: 'You are a supportive personal habit coach. Be encouraging and constructive.' },
            { role: 'user', content: prompt }
          ]
        })
      });

      const data = await response.json();
      return data.choices[0].message.content.trim();

    } catch (error) {
      console.error('❌ Error getting Perplexity analysis:', error);
      return "AI analysis temporarily unavailable";
    }
  }

  /**
   * Check if user needs AI incentive
   */
  private shouldSendAIIncentive(habitAnalysis: any[]): boolean {
    // Send incentive if any habit has less than 80% completion
    return habitAnalysis.some(habit => habit.needsImprovement);
  }

  /**
   * Send AI incentive message to user's personal channel
   */
  private async sendAIIncentiveMessage(
    user: User, 
    habitAnalysis: any[], 
    weekInfo: { weekStart: Date; weekEnd: Date }
  ): Promise<void> {
    try {
      if (!user.personalChannelId) {
        console.log(`⚠️ No personal channel for user ${user.name}`);
        return;
      }

      const channel = this.client.channels.cache.get(user.personalChannelId) as TextChannel;
      if (!channel) {
        console.log(`⚠️ Personal channel not found for user ${user.name}`);
        return;
      }

      // Create the AI incentive message
      const message = await this.createAIIncentiveMessage(user, habitAnalysis, weekInfo);
      
      // Send message with proper splitting if too long
      await this.sendLongMessage(channel, message);

      console.log(`✅ AI incentive sent to user ${user.name}`);

      await this.logger.success(
        'AI_INCENTIVE',
        'AI Incentive Sent',
        `AI incentive sent to user ${user.name}`,
        {
          userId: user.id,
          habitsAnalyzed: habitAnalysis.length,
          needsImprovement: habitAnalysis.filter(h => h.needsImprovement).length
        }
      );

    } catch (error) {
      console.error(`❌ Error sending AI incentive to user ${user.name}:`, error);
      throw error;
    }
  }

  /**
   * Send a long message by splitting it into multiple Discord messages if needed
   */
  private async sendLongMessage(channel: TextChannel, message: string): Promise<void> {
    const maxLength = 1950; // Leave some buffer for Discord's 2000 char limit
    
    if (message.length <= maxLength) {
      // Message is short enough, send as is
      await channel.send(message);
      return;
    }

    console.log(`📝 Message too long (${message.length} chars), splitting into multiple parts...`);
    
    // Split message into logical chunks
    const chunks = this.splitMessageIntoChunks(message, maxLength);
    
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const partIndicator = chunks.length > 1 ? `\n\n*Teil ${i + 1}/${chunks.length}*\n` : '';
      
      await channel.send(partIndicator + chunk);
      
      // Small delay between messages to avoid rate limiting
      if (i < chunks.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    console.log(`✅ Sent message in ${chunks.length} parts`);
  }

  /**
   * Split a long message into logical chunks while preserving content structure
   */
  private splitMessageIntoChunks(message: string, maxLength: number): string[] {
    const chunks: string[] = [];
    
    // First, try to split by major sections (double newlines)
    const sections = message.split('\n\n');
    let currentChunk = '';
    
    for (const section of sections) {
      // If adding this section would exceed the limit, start a new chunk
      if (currentChunk.length + section.length + 2 > maxLength && currentChunk.length > 0) {
        chunks.push(currentChunk.trim());
        currentChunk = section;
      } else {
        currentChunk += (currentChunk ? '\n\n' : '') + section;
      }
    }
    
    // Add the last chunk if it has content
    if (currentChunk.trim()) {
      chunks.push(currentChunk.trim());
    }
    
    // If any chunk is still too long, split it further by lines
    const finalChunks: string[] = [];
    for (const chunk of chunks) {
      if (chunk.length <= maxLength) {
        finalChunks.push(chunk);
      } else {
        // Split by lines for very long sections
        const lines = chunk.split('\n');
        let currentSubChunk = '';
        
        for (const line of lines) {
          if (currentSubChunk.length + line.length + 1 > maxLength && currentSubChunk.length > 0) {
            finalChunks.push(currentSubChunk.trim());
            currentSubChunk = line;
          } else {
            currentSubChunk += (currentSubChunk ? '\n' : '') + line;
          }
        }
        
        if (currentSubChunk.trim()) {
          finalChunks.push(currentSubChunk.trim());
        }
      }
    }
    
    return finalChunks;
  }

  /**
   * Create the AI incentive message content
   */
  private async createAIIncentiveMessage(
    user: User, 
    habitAnalysis: any[], 
    weekInfo: { weekStart: Date; weekEnd: Date }
  ): Promise<string> {
    const weekRange = `${weekInfo.weekStart.toLocaleDateString('de-DE')} - ${weekInfo.weekEnd.toLocaleDateString('de-DE')}`;
    
    const strugglingHabits = habitAnalysis.filter(h => h.needsImprovement);
    const successfulHabits = habitAnalysis.filter(h => !h.needsImprovement);

    let message = `🧠 **Wöchentliche AI-Analyse - ${weekRange}**\n\n`;
    message += `Hallo ${user.name}! 👋 Hier ist mein Feedback:\n\n`;

    // Show successful habits first (compact)
    if (successfulHabits.length > 0) {
      message += `🎉 **Erfolgreiche Gewohnheiten:**\n`;
      for (const habit of successfulHabits) {
        message += `✅ ${habit.habitName}: ${habit.actualFrequency}/${habit.targetFrequency} (${habit.completionRate}%)\n`;
      }
      message += `\n`;
    }

    // Show struggling habits with AI analysis (compact)
    if (strugglingHabits.length > 0) {
      message += `🤔 **Gewohnheiten, die Aufmerksamkeit brauchen:**\n\n`;
      
      for (const habit of strugglingHabits) {
        message += `📊 **${habit.habitName}**\n`;
        message += `• ${habit.actualFrequency}/${habit.targetFrequency} (${habit.completionRate}%)\n\n`;
        
        message += `🤖 **AI-Feedback:**\n`;
        message += `${habit.aiAnalysis}\n\n`;
        
        message += `💭 **Fragen:**\n`;
        message += `• Was hat dich gehindert?\n`;
        message += `• Was möchtest du ändern?\n`;
        message += `• Brauchst du Unterstützung?\n\n`;
      }
    }

    message += `💪 **Nächste Woche wird besser!**\n`;
    message += `Antworte hier, wenn du über deine Gewohnheiten sprechen möchtest! 🚀`;

    return message;
  }

  /**
   * Get all users from Notion
   */
  private async getAllUsers(): Promise<User[]> {
    try {
      console.log('🔍 Fetching all users from Notion for AI incentive analysis...');
      const users = await this.notion.getAllUsers();
      console.log(`📊 Found ${users.length} users for AI analysis`);
      return users;
    } catch (error) {
      console.error('❌ Error getting all users:', error);
      return [];
    }
  }

  /**
   * Get current week info (Monday to Sunday)
   */
  private getCurrentWeekInfo(): { weekStart: Date; weekEnd: Date } {
    const now = new Date();
    const currentDay = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const daysFromMonday = currentDay === 0 ? 6 : currentDay - 1; // Sunday = 6 days from Monday
    
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - daysFromMonday);
    weekStart.setHours(0, 0, 0, 0);
    
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    return { weekStart, weekEnd };
  }
}
