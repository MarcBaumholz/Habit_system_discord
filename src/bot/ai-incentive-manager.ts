import { Client, TextChannel, AttachmentBuilder } from 'discord.js';
import { NotionClient } from '../notion/client';
import { User, Habit, Proof } from '../types';
import { DiscordLogger } from './discord-logger';
import { generateTrendGraph } from '../utils/trend-graph-generator';
import { getCurrentBatch, isBatchActive } from '../utils/batch-manager';

// Enhanced habit analysis type for Notion-style weekly report
interface EnhancedHabitAnalysis {
  habitId: string;
  habitName: string;
  targetFrequency: number;
  actualFrequency: number;
  completionRate: number;
  needsImprovement: boolean;
  aiAnalysis: string;
  // 66-day journey tracking
  journey66: {
    dayNumber: number;
    daysRemaining: number;
    progressPercent: number;
    startDate: string | null;
  };
  // Trend comparison
  trend: {
    direction: '↑' | '↓' | '→';
    percentChange: number;
    lastWeekRate: number;
  };
  // Weekday analysis
  weekdayAnalysis: {
    bestDays: string[];
    worstDays: string[];
  };
  // Streak analytics
  streaks: {
    current: number;
    best: number;
    average: number;
  };
  // Weekly trend data for graph generation
  weeklyTrendData?: {
    weeks: number[];
    proofCounts: number[];
    hasMinimumData: boolean;
  };
  // All proofs for this habit (for graph generation)
  allProofs?: Proof[];
}

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

      // Check if batch is active
      if (!isBatchActive()) {
        console.log('⏸️ No active batch - skipping AI incentive analysis');
        await this.logger.info(
          'AI_INCENTIVE',
          'Analysis Skipped',
          'No active batch - AI incentive analysis skipped'
        );
        return;
      }

      const batch = getCurrentBatch();
      if (!batch) return;

      console.log(`📊 Running AI incentive analysis for batch: ${batch.name}`);

      // Get users in current batch
      const users = await this.getAllUsers();
      console.log(`📊 Found ${users.length} active users in batch "${batch.name}" for AI analysis`);

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
              batchName: batch.name,
              error: (error as Error).message
            }
          );
        }
      }

      console.log(`✅ Weekly AI incentive analysis completed for batch "${batch.name}"`);
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
   * Analyze individual user's weekly progress and send weekly analysis
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

      // Get current and last week's info for trend comparison
      const weekInfo = this.getCurrentWeekInfo();
      const lastWeekInfo = this.getLastWeekInfo();

      // Fetch current week proofs
      const currentWeekProofs = await this.notion.getProofsByUserId(
        user.id,
        weekInfo.weekStart.toISOString().split('T')[0],
        weekInfo.weekEnd.toISOString().split('T')[0]
      );

      // Fetch last week proofs for trend comparison
      const lastWeekProofs = await this.notion.getProofsByUserId(
        user.id,
        lastWeekInfo.weekStart.toISOString().split('T')[0],
        lastWeekInfo.weekEnd.toISOString().split('T')[0]
      );

      // Fetch all proofs for 66-day calculation and streak analytics
      const allProofs = await this.notion.getProofsByUserId(user.id);

      // Analyze each habit with enhanced data
      const habitAnalysis = await this.analyzeHabitsProgressEnhanced(
        habits,
        currentWeekProofs,
        lastWeekProofs,
        allProofs
      );

      // Always send weekly analysis (removed 80% threshold)
      await this.sendAIIncentiveMessage(user, habitAnalysis, weekInfo);
      console.log(`✅ Weekly analysis sent to user ${user.name}`);

    } catch (error) {
      console.error(`❌ Error analyzing user ${user.name}:`, error);
      throw error;
    }
  }

  /**
   * Send weekly analysis message to user's personal channel
   */
  private async sendAIIncentiveMessage(
    user: User,
    habitAnalysis: EnhancedHabitAnalysis[],
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

      // Create the AI incentive message with attachments
      const { message, attachments } = await this.createAIIncentiveMessage(user, habitAnalysis, weekInfo);
      
      // Send message with proper splitting if too long, including attachments
      await this.sendLongMessage(channel, message, attachments);

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
   * Attachments are sent with the first message
   */
  private async sendLongMessage(
    channel: TextChannel, 
    message: string, 
    attachments: AttachmentBuilder[] = []
  ): Promise<void> {
    const maxLength = 1950; // Leave some buffer for Discord's 2000 char limit
    
    if (message.length <= maxLength) {
      // Message is short enough, send as is with attachments
      await channel.send({ content: message, files: attachments });
      return;
    }

    console.log(`📝 Message too long (${message.length} chars), splitting into multiple parts...`);
    
    // Split message into logical chunks
    const chunks = this.splitMessageIntoChunks(message, maxLength);
    
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const partIndicator = chunks.length > 1 ? `\n\n*Teil ${i + 1}/${chunks.length}*\n` : '';
      
      // Send attachments with the first message only
      if (i === 0 && attachments.length > 0) {
        await channel.send({ 
          content: partIndicator + chunk, 
          files: attachments 
        });
      } else {
        await channel.send(partIndicator + chunk);
      }
      
      // Small delay between messages to avoid rate limiting
      if (i < chunks.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    console.log(`✅ Sent message in ${chunks.length} parts${attachments.length > 0 ? ' with attachments' : ''}`);
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
   * Create Notion-style AI incentive message with enhanced analytics
   * Returns message text and graph attachments
   */
  private async createAIIncentiveMessage(
    user: User,
    habitAnalysis: EnhancedHabitAnalysis[],
    weekInfo: { weekStart: Date; weekEnd: Date }
  ): Promise<{ message: string; attachments: AttachmentBuilder[] }> {
    const weekRange = `${weekInfo.weekStart.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })} - ${weekInfo.weekEnd.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })}`;

    // Calculate overall stats
    const totalCompletion = habitAnalysis.length > 0
      ? Math.round(habitAnalysis.reduce((sum, h) => sum + h.completionRate, 0) / habitAnalysis.length)
      : 0;

    const successfulHabits = habitAnalysis.filter(h => h.completionRate >= 80);
    const needsWorkHabits = habitAnalysis.filter(h => h.completionRate < 80);

    let message = `# Wöchentliche Analyse\n`;
    message += `📅 ${weekRange}\n\n`;
    message += `---\n\n`;

    // Overall summary
    message += `## Übersicht\n`;
    message += `• **Gesamt:** ${totalCompletion}% Abschlussrate\n`;
    message += `• **Stark:** ${successfulHabits.length}/${habitAnalysis.length} Gewohnheiten\n`;
    message += `• **Fokus:** ${needsWorkHabits.length} brauchen Aufmerksamkeit\n\n`;
    message += `---\n\n`;

    // Generate graphs and collect attachments
    const attachments: AttachmentBuilder[] = [];
    let graphIndex = 0;

    // Each habit section
    for (const habit of habitAnalysis) {
      const statusEmoji = habit.completionRate >= 80 ? '✅' : habit.completionRate >= 50 ? '🔶' : '🔴';
      const trendEmoji = habit.trend.direction === '↑' ? '📈' : habit.trend.direction === '↓' ? '📉' : '➡️';
      const streakEmoji = habit.streaks.current >= 7 ? '🔥' : habit.streaks.current >= 3 ? '⚡' : '';

      message += `## ${statusEmoji} ${habit.habitName}\n\n`;

      // 66-day progress bar
      const progressBar = this.generateProgressBar(habit.journey66.dayNumber, 66);
      message += `**66-Tage-Reise:** ${progressBar} Tag ${habit.journey66.dayNumber}/66\n\n`;

      // Stats table (simplified for Discord)
      message += `| Diese Woche | Trend |\n`;
      message += `|-------------|-------|\n`;
      message += `| ${habit.actualFrequency}/${habit.targetFrequency} (${habit.completionRate}%) | ${habit.trend.direction} ${habit.trend.percentChange > 0 ? '+' : ''}${habit.trend.percentChange}% ${trendEmoji} |\n\n`;

      // Streak info
      message += `**Streak:** ${habit.streaks.current} Tage ${streakEmoji} | **Best:** ${habit.streaks.best} Tage\n`;

      // Best/worst days
      const bestDaysStr = habit.weekdayAnalysis.bestDays.length > 0
        ? habit.weekdayAnalysis.bestDays.join(', ')
        : '—';
      const worstDaysStr = habit.weekdayAnalysis.worstDays.length > 0
        ? habit.weekdayAnalysis.worstDays.slice(0, 3).join(', ')
        : '—';

      message += `**Stärkste Tage:** ${bestDaysStr}\n`;
      message += `**Schwächste Tage:** ${worstDaysStr}\n\n`;

      // Generate trend graph if we have at least 4 weeks of data
      if (habit.weeklyTrendData?.hasMinimumData && habit.allProofs) {
        try {
          const graphBuffer = await generateTrendGraph(habit.habitId, habit.allProofs, habit.habitName);
          
          if (graphBuffer) {
            graphIndex++;
            const attachment = new AttachmentBuilder(graphBuffer, {
              name: `trend-${habit.habitId}-${graphIndex}.png`,
              description: `Wochen-Trend für ${habit.habitName}`
            });
            attachments.push(attachment);
            
            message += `📊 **Wochen-Trend**\n`;
            message += `*Siehe angehängtes Diagramm*\n\n`;
          }
        } catch (error) {
          console.error(`❌ Error generating graph for habit ${habit.habitName}:`, error);
          // Continue without graph
        }
      }

      // AI tip (quoted for emphasis)
      message += `> 🤖 ${habit.aiAnalysis}\n\n`;
      message += `---\n\n`;
    }

    // Next steps section
    message += `## Nächste Schritte\n`;

    // Generate actionable next steps based on analysis
    const nextSteps: string[] = [];

    // Find the habit that needs most attention
    const lowestHabit = [...habitAnalysis].sort((a, b) => a.completionRate - b.completionRate)[0];
    if (lowestHabit && lowestHabit.completionRate < 80) {
      nextSteps.push(`**${lowestHabit.habitName}:** Fokussiere auf 1 Tag diese Woche`);
    }

    // Find habit with declining trend
    const decliningHabit = habitAnalysis.find(h => h.trend.direction === '↓');
    if (decliningHabit) {
      nextSteps.push(`**${decliningHabit.habitName}:** Identifiziere den Blocker`);
    }

    // Encourage streak building
    const nearStreakHabit = habitAnalysis.find(h => h.streaks.current >= 2 && h.streaks.current < 7);
    if (nearStreakHabit) {
      nextSteps.push(`**${nearStreakHabit.habitName}:** ${7 - nearStreakHabit.streaks.current} Tage bis zur Wochenstreak!`);
    }

    // Default encouragement
    if (nextSteps.length === 0) {
      nextSteps.push('Halte dein Momentum – du bist auf Kurs!');
    }

    for (let i = 0; i < Math.min(nextSteps.length, 3); i++) {
      message += `${i + 1}. ${nextSteps[i]}\n`;
    }

    message += `\n💬 *Antworte hier, um über deine Gewohnheiten zu sprechen!*`;

    return { message, attachments };
  }

  /**
   * Get active users in current batch (excludes paused users and users not in batch)
   */
  private async getAllUsers(): Promise<User[]> {
    try {
      const batch = getCurrentBatch();
      if (!batch) {
        console.log('⚠️ No current batch found');
        return [];
      }

      console.log(`🔍 Fetching active users in batch "${batch.name}" for AI incentive analysis...`);

      // Get users in current batch
      const batchUsers = await this.notion.getUsersInBatch(batch.name);

      // Filter for active users only (exclude paused users)
      const activeUsers = batchUsers.filter(user => user.status === 'active');

      console.log(`📊 Found ${activeUsers.length} active users in batch "${batch.name}" (${batchUsers.length} total in batch)`);
      return activeUsers;
    } catch (error) {
      console.error('❌ Error getting active batch users:', error);
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

  /**
   * Get last week info (Monday to Sunday)
   */
  private getLastWeekInfo(): { weekStart: Date; weekEnd: Date } {
    const currentWeek = this.getCurrentWeekInfo();

    const weekStart = new Date(currentWeek.weekStart);
    weekStart.setDate(weekStart.getDate() - 7);

    const weekEnd = new Date(currentWeek.weekEnd);
    weekEnd.setDate(weekEnd.getDate() - 7);

    return { weekStart, weekEnd };
  }

  /**
   * Enhanced habit analysis with 66-day journey, trends, and analytics
   */
  private async analyzeHabitsProgressEnhanced(
    habits: Habit[],
    currentWeekProofs: Proof[],
    lastWeekProofs: Proof[],
    allProofs: Proof[]
  ): Promise<EnhancedHabitAnalysis[]> {
    const analysis: EnhancedHabitAnalysis[] = [];

    for (const habit of habits) {
      // Filter proofs for this habit
      const habitCurrentProofs = currentWeekProofs.filter(p => p.habitId === habit.id);
      const habitLastProofs = lastWeekProofs.filter(p => p.habitId === habit.id);
      const habitAllProofs = allProofs.filter(p => p.habitId === habit.id);

      // Basic metrics
      const actualFrequency = habitCurrentProofs.length;
      const completionRate = Math.round((actualFrequency / habit.frequency) * 100);
      const needsImprovement = completionRate < 80;

      // Calculate 66-day journey
      const journey66 = this.calculate66DayProgress(habitAllProofs);

      // Calculate trend
      const lastWeekRate = Math.round((habitLastProofs.length / habit.frequency) * 100);
      const trend = this.calculateTrend(completionRate, lastWeekRate);

      // Analyze best/worst weekdays
      const weekdayAnalysis = this.analyzeWeekdays(habitAllProofs);

      // Calculate streak analytics
      const streaks = this.calculateStreakAnalytics(habitAllProofs);

      // Calculate weekly trend data for graph
      const weeklyTrendData = this.calculateWeeklyTrendData(habitAllProofs);

      // Get AI analysis with enhanced context
      const aiAnalysis = await this.getEnhancedPerplexityAnalysis(
        habit,
        habitCurrentProofs,
        actualFrequency,
        journey66,
        trend,
        streaks
      );

      analysis.push({
        habitId: habit.id,
        habitName: habit.name,
        targetFrequency: habit.frequency,
        actualFrequency,
        completionRate,
        needsImprovement,
        aiAnalysis,
        journey66,
        trend,
        weekdayAnalysis,
        streaks,
        weeklyTrendData,
        allProofs: habitAllProofs
      });
    }

    return analysis;
  }

  /**
   * Calculate 66-day journey progress from first proof date
   */
  private calculate66DayProgress(proofs: Proof[]): {
    dayNumber: number;
    daysRemaining: number;
    progressPercent: number;
    startDate: string | null;
  } {
    if (proofs.length === 0) {
      return { dayNumber: 0, daysRemaining: 66, progressPercent: 0, startDate: null };
    }

    // Sort proofs by date and find the earliest
    const sortedProofs = [...proofs].sort((a, b) =>
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    const firstProofDate = new Date(sortedProofs[0].date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    firstProofDate.setHours(0, 0, 0, 0);

    const dayNumber = Math.floor((today.getTime() - firstProofDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    const cappedDayNumber = Math.min(dayNumber, 66);
    const daysRemaining = Math.max(66 - dayNumber, 0);
    const progressPercent = Math.round((cappedDayNumber / 66) * 100);

    return {
      dayNumber: cappedDayNumber,
      daysRemaining,
      progressPercent,
      startDate: sortedProofs[0].date
    };
  }

  /**
   * Calculate trend direction and percentage change
   */
  private calculateTrend(
    thisWeekRate: number,
    lastWeekRate: number
  ): { direction: '↑' | '↓' | '→'; percentChange: number; lastWeekRate: number } {
    const percentChange = thisWeekRate - lastWeekRate;

    let direction: '↑' | '↓' | '→';
    if (percentChange > 5) {
      direction = '↑';
    } else if (percentChange < -5) {
      direction = '↓';
    } else {
      direction = '→';
    }

    return { direction, percentChange, lastWeekRate };
  }

  /**
   * Analyze best and worst performing weekdays
   */
  private analyzeWeekdays(proofs: Proof[]): { bestDays: string[]; worstDays: string[] } {
    const dayNames = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
    const dayCounts: Record<number, number> = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };

    // Count proofs per weekday
    for (const proof of proofs) {
      const day = new Date(proof.date).getDay();
      dayCounts[day]++;
    }

    // Sort days by count
    const sortedDays = Object.entries(dayCounts)
      .map(([day, count]) => ({ day: parseInt(day), count }))
      .sort((a, b) => b.count - a.count);

    // Get best and worst days (exclude days with 0 if there are active days)
    const activeDays = sortedDays.filter(d => d.count > 0);

    if (activeDays.length === 0) {
      return { bestDays: [], worstDays: dayNames };
    }

    const maxCount = activeDays[0].count;
    const minCount = activeDays[activeDays.length - 1].count;

    const bestDays = activeDays
      .filter(d => d.count === maxCount)
      .map(d => dayNames[d.day]);

    const worstDays = sortedDays
      .filter(d => d.count === minCount || d.count === 0)
      .map(d => dayNames[d.day]);

    return { bestDays, worstDays };
  }

  /**
   * Calculate streak analytics: current, best, and average
   */
  private calculateStreakAnalytics(proofs: Proof[]): {
    current: number;
    best: number;
    average: number;
  } {
    if (proofs.length === 0) {
      return { current: 0, best: 0, average: 0 };
    }

    // Sort proofs by date
    const sortedDates = [...new Set(proofs.map(p => p.date))]
      .sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

    if (sortedDates.length === 0) {
      return { current: 0, best: 0, average: 0 };
    }

    // Calculate streaks
    const streaks: number[] = [];
    let currentStreak = 1;
    let bestStreak = 1;

    for (let i = 1; i < sortedDates.length; i++) {
      const prevDate = new Date(sortedDates[i - 1]);
      const currDate = new Date(sortedDates[i]);
      const diffDays = Math.floor((currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        currentStreak++;
      } else {
        streaks.push(currentStreak);
        if (currentStreak > bestStreak) {
          bestStreak = currentStreak;
        }
        currentStreak = 1;
      }
    }

    // Don't forget the last streak
    streaks.push(currentStreak);
    if (currentStreak > bestStreak) {
      bestStreak = currentStreak;
    }

    // Check if current streak is active (includes today or yesterday)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const lastProofDate = new Date(sortedDates[sortedDates.length - 1]);
    lastProofDate.setHours(0, 0, 0, 0);
    const daysSinceLastProof = Math.floor((today.getTime() - lastProofDate.getTime()) / (1000 * 60 * 60 * 24));

    // If last proof was more than 1 day ago, current streak is 0
    const activeCurrentStreak = daysSinceLastProof <= 1 ? currentStreak : 0;

    // Calculate average streak
    const averageStreak = streaks.length > 0
      ? Math.round(streaks.reduce((a, b) => a + b, 0) / streaks.length)
      : 0;

    return {
      current: activeCurrentStreak,
      best: bestStreak,
      average: averageStreak
    };
  }

  /**
   * Calculate weekly trend data for graph generation
   */
  private calculateWeeklyTrendData(proofs: Proof[]): {
    weeks: number[];
    proofCounts: number[];
    hasMinimumData: boolean;
  } {
    if (proofs.length === 0) {
      return { weeks: [], proofCounts: [], hasMinimumData: false };
    }

    // Sort proofs by date and find the earliest
    const sortedProofs = [...proofs].sort((a, b) =>
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    const firstProofDate = new Date(sortedProofs[0].date);
    firstProofDate.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Calculate total days since first proof
    const totalDays = Math.floor((today.getTime() - firstProofDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    
    // Calculate total weeks (round up)
    const totalWeeks = Math.ceil(totalDays / 7);

    // Need at least 4 weeks of data
    if (totalWeeks < 4) {
      return { weeks: [], proofCounts: [], hasMinimumData: false };
    }

    // Group proofs by week
    const weeks: number[] = [];
    const proofCounts: number[] = [];
    
    for (let week = 1; week <= totalWeeks; week++) {
      const weekStartDay = (week - 1) * 7 + 1;
      const weekEndDay = week * 7;
      
      const weekStartDate = new Date(firstProofDate);
      weekStartDate.setDate(firstProofDate.getDate() + weekStartDay - 1);
      weekStartDate.setHours(0, 0, 0, 0);
      
      const weekEndDate = new Date(firstProofDate);
      weekEndDate.setDate(firstProofDate.getDate() + weekEndDay - 1);
      weekEndDate.setHours(23, 59, 59, 999);

      // Count proofs in this week
      const weekProofs = sortedProofs.filter(proof => {
        const proofDate = new Date(proof.date);
        proofDate.setHours(0, 0, 0, 0);
        return proofDate >= weekStartDate && proofDate <= weekEndDate;
      });

      weeks.push(week);
      proofCounts.push(weekProofs.length);
    }

    return {
      weeks,
      proofCounts,
      hasMinimumData: true
    };
  }

  /**
   * Generate visual progress bar for 66-day journey
   */
  private generateProgressBar(current: number, total: number, width: number = 15): string {
    const filledCount = Math.round((current / total) * width);
    const emptyCount = width - filledCount;

    const filled = '█'.repeat(filledCount);
    const empty = '░'.repeat(emptyCount);

    return `${filled}${empty}`;
  }

  /**
   * Enhanced Perplexity AI analysis with 66-day context and research-backed tips
   */
  private async getEnhancedPerplexityAnalysis(
    habit: Habit,
    proofs: Proof[],
    actualFrequency: number,
    journey66: { dayNumber: number; progressPercent: number },
    trend: { direction: string; percentChange: number },
    streaks: { current: number; best: number }
  ): Promise<string> {
    try {
      if (!process.env.PERPLEXITY_API_KEY) {
        return 'AI-Analyse nicht verfügbar';
      }

      const completionRate = Math.round((actualFrequency / habit.frequency) * 100);

      const prompt = `Du bist ein Gewohnheitscoach. Gib einen SEHR kurzen Tipp (max 40 Wörter) basierend auf:

Gewohnheit: ${habit.name}
66-Tage-Reise: Tag ${journey66.dayNumber}/66 (${journey66.progressPercent}%)
Diese Woche: ${actualFrequency}/${habit.frequency} (${completionRate}%)
Trend: ${trend.direction} ${trend.percentChange > 0 ? '+' : ''}${trend.percentChange}%
Aktueller Streak: ${streaks.current} Tage | Best: ${streaks.best} Tage
Ziel: ${habit.smartGoal || 'Nicht definiert'}
Kontext: ${habit.context || 'Nicht definiert'}

Regeln:
1. MAX 40 Wörter - extrem kurz!
2. Nur EINEN konkreten, umsetzbaren Tipp
3. Beziehe dich auf die Daten (Streak, Tag im 66-Tage-Zyklus, Trend)
4. Bei gutem Fortschritt: Lob + nächste Herausforderung
5. Bei schwachem Fortschritt: Tiny Habit Ansatz (2-Min-Regel)
6. Deutsch, direkt, motivierend

Antworte nur mit dem Tipp, keine Einleitung:`;

      const response = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'sonar',
          messages: [
            {
              role: 'system',
              content: 'Du bist ein Gewohnheitsexperte. Basiere deine Tipps auf Forschung: 66-Tage-Regel (Phillippa Lally), Tiny Habits (BJ Fogg), Atomic Habits (James Clear). Sei extrem kurz und konkret.'
            },
            { role: 'user', content: prompt }
          ]
        })
      });

      const data = await response.json();
      return data.choices[0].message.content.trim();

    } catch (error) {
      console.error('❌ Error getting Perplexity analysis:', error);
      return 'Bleib dran - jeder Tag zählt!';
    }
  }
}
