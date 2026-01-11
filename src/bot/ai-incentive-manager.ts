import { Client, TextChannel, AttachmentBuilder } from 'discord.js';
import { NotionClient } from '../notion/client';
import { User, Habit, Proof, UserProfile } from '../types';
import { DiscordLogger } from './discord-logger';
import { getCurrentBatch, isBatchActive } from '../utils/batch-manager';
import { MindmapGenerator } from '../utils/mindmap-generator';

// Enhanced habit analysis type for Notion-style weekly report
interface EnhancedHabitAnalysis {
  habitId: string;
  habitName: string;
  targetFrequency: number;
  actualFrequency: number;
  completionRate: number;
  needsImprovement: boolean;
  aiAnalysis: string;
  // 90-day journey tracking
  journey90: {
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

      // Get current batch
      const batch = getCurrentBatch();
      if (!batch) {
        console.log(`⚠️ No current batch found`);
        return;
      }

      // Get user's habits and filter by current batch
      const allHabits = await this.notion.getHabitsByUserId(user.id);
      const habits = allHabits.filter(h => h.batch === batch.name);

      if (habits.length === 0) {
        console.log(`⚠️ No habits found for user ${user.name} in batch ${batch.name}`);
        return;
      }

      // Get user's personality profile for personalized feedback
      const personalityProfile = await this.notion.getUserProfileByDiscordId(user.discordId);

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

      // Fetch all proofs for 90-day calculation and streak analytics
      const allProofs = await this.notion.getProofsByUserId(user.id);

      // Analyze each habit with enhanced data
      const habitAnalysis = await this.analyzeHabitsProgressEnhanced(
        user,
        habits,
        currentWeekProofs,
        lastWeekProofs,
        allProofs,
        personalityProfile,
        batch.startDate
      );

      // Get buddy analysis if user has a buddy
      let buddyAnalysis: {
        name: string;
        proofsThisWeek: number;
        completionRate: number;
        habitCount: number;
        habits: Array<{ name: string; completion: number; proofCount: number; target: number }>;
      } | null = null;
      if (user.buddy) {
        buddyAnalysis = await this.getBuddyAnalysis(user.buddy, batch.name, weekInfo);
      }

      // Always send weekly analysis (removed 80% threshold)
      await this.sendAIIncentiveMessage(user, habitAnalysis, weekInfo, buddyAnalysis);
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
    weekInfo: { weekStart: Date; weekEnd: Date },
    buddyAnalysis: {
      name: string;
      proofsThisWeek: number;
      completionRate: number;
      habitCount: number;
      habits: Array<{ name: string; completion: number; proofCount: number; target: number }>;
    } | null
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

      // Generate and send personalized mindmap first
      try {
        const mindmapImage = await this.generateWeeklyMindmap(user, habitAnalysis, weekInfo);
        if (mindmapImage) {
          const attachment = new AttachmentBuilder(mindmapImage, { name: 'weekly-mindmap.png' });
          await channel.send({
            content: '# 🗺️ Deine Wöchentliche Übersicht\n\n_Hier ist deine visuelle Zusammenfassung der Woche auf einen Blick:_',
            files: [attachment]
          });
        }
      } catch (error) {
        console.error(`⚠️ Error generating mindmap for ${user.name}:`, error);
        // Continue even if mindmap fails
      }

      // Create the AI incentive message
      const message = await this.createAIIncentiveMessage(user, habitAnalysis, weekInfo, buddyAnalysis);

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
  private async sendLongMessage(
    channel: TextChannel,
    message: string
  ): Promise<void> {
    const maxLength = 1950; // Leave some buffer for Discord's 2000 char limit

    if (message.length <= maxLength) {
      // Message is short enough, send as is
      await channel.send({ content: message });
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
   * Create Notion-style AI incentive message with enhanced analytics
   */
  private async createAIIncentiveMessage(
    user: User,
    habitAnalysis: EnhancedHabitAnalysis[],
    weekInfo: { weekStart: Date; weekEnd: Date },
    buddyAnalysis: {
      name: string;
      proofsThisWeek: number;
      completionRate: number;
      habitCount: number;
      habits: Array<{ name: string; completion: number; proofCount: number; target: number }>;
    } | null
  ): Promise<string> {
    const weekRange = `${weekInfo.weekStart.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })} - ${weekInfo.weekEnd.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })}`;

    // Calculate overall stats
    const totalCompletion = habitAnalysis.length > 0
      ? Math.round(habitAnalysis.reduce((sum, h) => sum + h.completionRate, 0) / habitAnalysis.length)
      : 0;

    const successfulHabits = habitAnalysis.filter(h => h.completionRate >= 80);
    const needsWorkHabits = habitAnalysis.filter(h => h.completionRate < 80);

    // === 1. HEADER ===
    let message = `# 📊 Wöchentliche Analyse\n`;
    message += `📅 ${weekRange}\n\n`;
    message += `---\n\n`;

    // === 2. OVERVIEW ===
    message += `## 🎯 Übersicht\n`;
    message += `• **Gesamt:** ${totalCompletion}% Abschlussrate\n`;
    message += `• **Stark:** ${successfulHabits.length}/${habitAnalysis.length} Gewohnheiten on track\n`;
    if (needsWorkHabits.length > 0) {
      message += `• **Fokus:** ${needsWorkHabits.length} ${needsWorkHabits.length === 1 ? 'braucht' : 'brauchen'} Aufmerksamkeit\n`;
    }
    message += `\n---\n\n`;

    // === 3. HABITS SECTION ===
    for (const habit of habitAnalysis) {
      const statusEmoji = habit.completionRate >= 80 ? '✅' : habit.completionRate >= 50 ? '🔶' : '🔴';
      const trendEmoji = habit.trend.direction === '↑' ? '📈' : habit.trend.direction === '↓' ? '📉' : '➡️';
      const streakEmoji = habit.streaks.current >= 7 ? '🔥' : habit.streaks.current >= 3 ? '⚡' : '';

      message += `## ${statusEmoji} ${habit.habitName}\n\n`;

      // 90-day progress
      const progressBar = this.generateProgressBar(habit.journey90.dayNumber, 90);
      message += `${progressBar} **Tag ${habit.journey90.dayNumber}/90**\n\n`;

      // This week's performance
      message += `**Diese Woche:** ${habit.actualFrequency}/${habit.targetFrequency} Proofs (${habit.completionRate}%)\n`;
      message += `**Streak:** ${habit.streaks.current} Tage ${streakEmoji} | Best: ${habit.streaks.best}\n`;
      message += `**Trend:** ${habit.trend.direction} ${habit.trend.percentChange > 0 ? '+' : ''}${habit.trend.percentChange}% ${trendEmoji}\n\n`;

      // AI feedback
      message += `> 💡 **AI Feedback:** ${habit.aiAnalysis}\n\n`;
      message += `---\n\n`;
    }

    // === 4. BUDDY CHECK-IN ===
    if (buddyAnalysis) {
      const buddyEmoji = buddyAnalysis.completionRate >= 80 ? '🔥' : buddyAnalysis.completionRate >= 50 ? '💪' : '🤝';
      message += `## ${buddyEmoji} Buddy Check-In: ${buddyAnalysis.name}\n\n`;

      // Show buddy's habits
      for (const buddyHabit of buddyAnalysis.habits) {
        const emoji = buddyHabit.completion >= 80 ? '✅' : buddyHabit.completion >= 50 ? '🔶' : '🔴';
        message += `${emoji} **${buddyHabit.name}:** ${buddyHabit.proofCount}/${buddyHabit.target} (${buddyHabit.completion}%)\n`;
      }

      // Dynamic message suggestion based on buddy's performance
      const buddyMessageHint = this.getBuddyMessageHint(buddyAnalysis);
      message += `\n💬 **${buddyMessageHint}**\n\n`;
      message += `---\n\n`;
    }

    // === 5. NEXT STEPS (AI-POWERED ADAPTIVE GOAL COACHING) ===
    const personalityProfile = await this.notion.getUserProfileByDiscordId(user.discordId);
    const nextStepsAdvice = await this.getAdaptiveGoalCoaching(user, habitAnalysis, totalCompletion, personalityProfile);
    message += `## 🚀 Nächste Schritte\n\n`;
    message += `${nextStepsAdvice}\n\n`;
    message += `---\n\n`;
    message += `💬 _Antworte hier, um über deine Gewohnheiten zu sprechen!_`;

    return message;
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
   * Enhanced habit analysis with 90-day journey, trends, and analytics
   */
  private async analyzeHabitsProgressEnhanced(
    user: User,
    habits: Habit[],
    currentWeekProofs: Proof[],
    lastWeekProofs: Proof[],
    allProofs: Proof[],
    personalityProfile: UserProfile | null,
    batchStartDate: string
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

      // Calculate 90-day journey from batch start date
      const journey90 = this.calculate90DayProgress(habitAllProofs, batchStartDate);

      // Calculate trend
      const lastWeekRate = Math.round((habitLastProofs.length / habit.frequency) * 100);
      const trend = this.calculateTrend(completionRate, lastWeekRate);

      // Analyze best/worst weekdays
      const weekdayAnalysis = this.analyzeWeekdays(habitAllProofs);

      // Calculate streak analytics
      const streaks = this.calculateStreakAnalytics(habitAllProofs);

      // Get AI analysis with enhanced context including personality
      const aiAnalysis = await this.getEnhancedPerplexityAnalysis(
        user,
        habit,
        habitCurrentProofs,
        actualFrequency,
        journey90,
        trend,
        streaks,
        personalityProfile
      );

      analysis.push({
        habitId: habit.id,
        habitName: habit.name,
        targetFrequency: habit.frequency,
        actualFrequency,
        completionRate,
        needsImprovement,
        aiAnalysis,
        journey90,
        trend,
        weekdayAnalysis,
        streaks
      });
    }

    return analysis;
  }

  /**
   * Calculate 90-day journey progress from batch start date
   * All habits in the same batch will have the same day number
   */
  private calculate90DayProgress(proofs: Proof[], batchStartDate: string): {
    dayNumber: number;
    daysRemaining: number;
    progressPercent: number;
    startDate: string;
  } {
    const startDate = new Date(batchStartDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    startDate.setHours(0, 0, 0, 0);

    // Calculate days since batch started
    const dayNumber = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    // Cap between 1 and 90
    const cappedDayNumber = Math.min(Math.max(dayNumber, 1), 90);
    const daysRemaining = Math.max(90 - dayNumber, 0);
    const progressPercent = Math.round((cappedDayNumber / 90) * 100);

    return {
      dayNumber: cappedDayNumber,
      daysRemaining,
      progressPercent,
      startDate: batchStartDate
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
   * Generate visual progress bar for 90-day journey
   */
  private generateProgressBar(current: number, total: number, width: number = 15): string {
    const filledCount = Math.round((current / total) * width);
    const emptyCount = width - filledCount;

    const filled = '█'.repeat(filledCount);
    const empty = '░'.repeat(emptyCount);

    return `${filled}${empty}`;
  }

  /**
   * Enhanced Perplexity AI analysis with 90-day context, personality, and habit details
   */
  private async getEnhancedPerplexityAnalysis(
    user: User,
    habit: Habit,
    proofs: Proof[],
    actualFrequency: number,
    journey90: { dayNumber: number; progressPercent: number },
    trend: { direction: string; percentChange: number },
    streaks: { current: number; best: number },
    personalityProfile: UserProfile | null
  ): Promise<string> {
    try {
      if (!process.env.PERPLEXITY_API_KEY) {
        return 'AI-Analyse nicht verfügbar';
      }

      const completionRate = Math.round((actualFrequency / habit.frequency) * 100);

      // Determine performance context
      let performanceContext = '';
      if (completionRate >= 80) {
        performanceContext = 'STARK - Nutzer performt sehr gut';
      } else if (completionRate >= 50) {
        performanceContext = 'OK - Nutzer ist auf dem Weg, braucht aber Schub';
      } else {
        performanceContext = 'SCHWACH - Nutzer braucht fundamentale Hilfe';
      }

      // Build personality context (if available)
      let personalityContext = '';
      if (personalityProfile) {
        const parts: string[] = [];
        if (personalityProfile.personalityType) parts.push(`Typ: ${personalityProfile.personalityType}`);
        if (personalityProfile.coreValues && personalityProfile.coreValues.length > 0) {
          parts.push(`Werte: ${personalityProfile.coreValues.join(', ')}`);
        }
        if (personalityProfile.lifeVision) parts.push(`Vision: ${personalityProfile.lifeVision}`);
        personalityContext = parts.length > 0 ? parts.join(' | ') : '';
      }

      // Build habit context from creation data
      const habitDetails: string[] = [];
      if (habit.why) habitDetails.push(`Why: ${habit.why}`);
      if (habit.context) habitDetails.push(`Kontext: ${habit.context}`);
      if (habit.smartGoal) habitDetails.push(`SMART Goal: ${habit.smartGoal}`);
      if (habit.selectedDays && habit.selectedDays.length > 0) {
        habitDetails.push(`Gewählte Tage: ${habit.selectedDays.join(', ')}`);
      }
      if (habit.domains && habit.domains.length > 0) {
        habitDetails.push(`Bereiche: ${habit.domains.join(', ')}`);
      }
      if (habit.hurdles) habitDetails.push(`Hürden: ${habit.hurdles}`);

      const prompt = `Du bist ein personalisierter Gewohnheitscoach. Gib einen SEHR kurzen, spezifischen Tipp (max 40 Wörter):

=== NUTZER-PROFIL ===
Name: ${user.name}
${personalityContext ? `Persönlichkeit: ${personalityContext}` : ''}

=== GEWOHNHEIT ===
Name: ${habit.name}
${habitDetails.join('\n')}
Minimal Dose: ${habit.minimalDose || '—'}

=== PERFORMANCE ===
Level: ${performanceContext}
Tag: ${journey90.dayNumber}/90
Diese Woche: ${actualFrequency}/${habit.frequency} (${completionRate}%)
Trend: ${trend.direction} ${trend.percentChange > 0 ? '+' : ''}${trend.percentChange}%
Streak: ${streaks.current} (Best: ${streaks.best})

=== COACHING-REGELN ===
1. MAX 40 Wörter - extrem präzise
2. Nutze PERSÖNLICHKEIT (Werte/Vision) wenn vorhanden
3. Beziehe WHY & KONTEXT der Gewohnheit ein
4. Erwähne GEWÄHLTE TAGE wenn relevant
5. Adressiere bekannte HÜRDEN wenn vorhanden
6. Performance-spezifisch:
   - STARK (≥80%): Herausforderung steigern, an Vision koppeln
   - OK (50-79%): Optimierung basierend auf Kontext & gewählten Tagen
   - SCHWACH (<50%): Radikal vereinfachen, zurück zum Why, Minimal Dose

Direkt, persönlich, umsetzbar. Tipp:`;

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
              content: `Du bist ein hochgradig personalisierter Gewohnheitsexperte. Du kennst den Nutzer (${user.name}) ${personalityProfile ? 'und seine Persönlichkeit' : ''} und basierst deine Tipps auf:
- Wissenschaftliche Prinzipien: 90-Tage-Regel, Tiny Habits (BJ Fogg), Atomic Habits (James Clear)
- Persönliche Motivation (Why) und Kontext der Gewohnheit
- Nutzerprofil und Persönlichkeit
- Konkrete Hürden und gewählte Tage
Sei extrem kurz, präzise und spreche den Nutzer direkt an.`
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

  /**
   * Get actionable hint based on habit performance
   */
  private getActionableHint(habit: EnhancedHabitAnalysis): string {
    // Very low completion rate (< 30%)
    if (habit.completionRate < 30) {
      return `Starte minimal: ${habit.journey90.dayNumber < 14 ? 'Gewöhne dich erst an die Routine' : 'Reduziere auf Minimal Dose'} (${habit.targetFrequency} → 1-2 Tage/Woche)`;
    }

    // Low completion rate (30-50%)
    if (habit.completionRate < 50) {
      return `Nutze deine stärksten Tage: Fokus auf ${habit.weekdayAnalysis.bestDays.slice(0, 2).join(' & ') || 'feste Wochentage'}`;
    }

    // Medium completion rate (50-79%)
    if (habit.completionRate < 80) {
      if (habit.trend.direction === '↓') {
        return `Trend stoppen: Was lief letzte Woche anders? Blocker identifizieren`;
      }
      return `Fast geschafft: +${habit.targetFrequency - habit.actualFrequency} Proof${habit.targetFrequency - habit.actualFrequency > 1 ? 's' : ''} für 100%`;
    }

    // High completion rate (80%+)
    if (habit.streaks.current < 3) {
      return `Streak aufbauen: ${3 - habit.streaks.current} Tag${3 - habit.streaks.current > 1 ? 'e' : ''} bis zur 3-Tage-Streak`;
    }

    if (habit.streaks.current < 7) {
      return `Streak Challenge: ${7 - habit.streaks.current} Tag${7 - habit.streaks.current > 1 ? 'e' : ''} bis zur Wochen-Streak 🔥`;
    }

    return 'Behalte dein Level – du machst es großartig! 💪';
  }

  /**
   * Get buddy's performance analysis for the week
   */
  private async getBuddyAnalysis(
    buddyNickname: string,
    batchName: string,
    weekInfo: { weekStart: Date; weekEnd: Date }
  ): Promise<{
    name: string;
    proofsThisWeek: number;
    completionRate: number;
    habitCount: number;
    habits: Array<{ name: string; completion: number; proofCount: number; target: number }>;
  } | null> {
    try {
      // Get buddy user by nickname
      const buddyUser = await this.notion.getUserByNickname(buddyNickname);
      if (!buddyUser) {
        console.log(`⚠️ Buddy not found: ${buddyNickname}`);
        return null;
      }

      // Get buddy's habits filtered by current batch
      const allBuddyHabits = await this.notion.getHabitsByUserId(buddyUser.id);
      const buddyHabits = allBuddyHabits.filter(h => h.batch === batchName);

      if (buddyHabits.length === 0) {
        return null;
      }

      // Get buddy's proofs for the week
      const buddyProofs = await this.notion.getProofsByUserId(
        buddyUser.id,
        weekInfo.weekStart.toISOString().split('T')[0],
        weekInfo.weekEnd.toISOString().split('T')[0]
      );

      // Calculate per-habit performance
      const habitsDetails = buddyHabits.map(habit => {
        const habitProofs = buddyProofs.filter(p => p.habitId === habit.id);
        const proofCount = habitProofs.length;
        const completion = Math.round((proofCount / habit.frequency) * 100);

        return {
          name: habit.name,
          completion,
          proofCount,
          target: habit.frequency
        };
      });

      // Calculate overall stats
      const totalTarget = buddyHabits.reduce((sum, h) => sum + h.frequency, 0);
      const actualProofs = buddyProofs.length;
      const completionRate = totalTarget > 0 ? Math.round((actualProofs / totalTarget) * 100) : 0;

      return {
        name: buddyUser.nickname || buddyUser.name,
        proofsThisWeek: actualProofs,
        completionRate,
        habitCount: buddyHabits.length,
        habits: habitsDetails
      };
    } catch (error) {
      console.error(`❌ Error getting buddy analysis for ${buddyNickname}:`, error);
      return null;
    }
  }

  /**
   * Get dynamic message hint based on buddy's performance
   */
  private getBuddyMessageHint(buddyAnalysis: {
    name: string;
    completionRate: number;
    habits: Array<{ name: string; completion: number }>;
  }): string {
    const name = buddyAnalysis.name;

    // Great performance (≥80%)
    if (buddyAnalysis.completionRate >= 80) {
      const topHabit = buddyAnalysis.habits.sort((a, b) => b.completion - a.completion)[0];
      return `Sag ${name} Glückwunsch zu ${topHabit?.name || 'der starken Woche'}! 🔥`;
    }

    // Decent performance (50-79%)
    if (buddyAnalysis.completionRate >= 50) {
      return `Frag ${name}, was diese Woche gut lief und wo du helfen kannst 💪`;
    }

    // Struggling (<50%)
    const worstHabit = buddyAnalysis.habits.sort((a, b) => a.completion - b.completion)[0];
    return `Check bei ${name} ein – ${worstHabit?.name || 'diese Woche'} war schwierig. Was ist passiert? 🤝`;
  }

  /**
   * Get AI-powered adaptive goal coaching based on overall performance and personality
   */
  private async getAdaptiveGoalCoaching(
    user: User,
    habitAnalysis: EnhancedHabitAnalysis[],
    totalCompletion: number,
    personalityProfile: UserProfile | null
  ): Promise<string> {
    try {
      if (!process.env.PERPLEXITY_API_KEY) {
        return this.getFallbackCoaching(habitAnalysis, totalCompletion);
      }

      // Prepare performance context
      const habitsContext = habitAnalysis.map(h =>
        `${h.habitName}: ${h.completionRate}% (Trend: ${h.trend.direction}, Tag ${h.journey90.dayNumber}/90)`
      ).join('\n');

      const performanceLevel = totalCompletion >= 80 ? 'EXZELLENT' :
                               totalCompletion >= 60 ? 'GUT' :
                               totalCompletion >= 40 ? 'AUSBAUFÄHIG' : 'KRITISCH';

      // Build personality context
      let personalityContext = '';
      if (personalityProfile) {
        const parts: string[] = [];
        if (personalityProfile.personalityType) parts.push(`Typ: ${personalityProfile.personalityType}`);
        if (personalityProfile.coreValues && personalityProfile.coreValues.length > 0) {
          parts.push(`Werte: ${personalityProfile.coreValues.join(', ')}`);
        }
        if (personalityProfile.lifeVision) parts.push(`Vision: ${personalityProfile.lifeVision}`);
        if (personalityProfile.mainGoals && personalityProfile.mainGoals.length > 0) {
          parts.push(`Hauptziele: ${personalityProfile.mainGoals.join(', ')}`);
        }
        if (personalityProfile.desiredIdentity) parts.push(`Identität: ${personalityProfile.desiredIdentity}`);
        personalityContext = parts.length > 0 ? `\n\nNutzer-Profil (${user.name}):\n${parts.join('\n')}` : '';
      }

      const prompt = `Du bist ein hochgradig personalisierter Gewohnheitsexperte (Atomic Habits, Tiny Habits, 90-Day Rule). Gib adaptive Ziel-Coaching (max 80 Wörter):

Performance-Level: ${performanceLevel} (${totalCompletion}% Gesamt-Abschluss)
${personalityContext}

Gewohnheiten:
${habitsContext}

Coaching-Regeln:
- EXZELLENT (≥80%): Herausforderung steigern an VISION & WERTE koppeln, nächstes Level, Habit Stacking
- GUT (60-79%): Optimieren basierend auf PERSÖNLICHKEIT, Blocker beseitigen, Konsistenz
- AUSBAUFÄHIG (40-59%): Ziele an WERTE anpassen, Minimal Dose, zurück zum Why
- KRITISCH (<40%): Radikal vereinfachen, 1 Habit priorisieren das zu VISION passt

Nutze Persönlichkeitsdaten wenn vorhanden. Gib 2-3 konkrete Schritte. Deutsch, direkt, persönlich. Keine Einleitung:`;

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
              content: `Du bist ein hochgradig personalisierter Gewohnheits-Coach für ${user.name}${personalityProfile ? ' und kennst sein Profil, seine Werte und Vision' : ''}. Basiere Coaching auf:
- Wissenschaft: 90-Tage-Regel, Tiny Habits (BJ Fogg), Atomic Habits (James Clear)
- Persönlichkeit: Nutze Werte, Vision, Motivatoren wenn verfügbar
- Individuelle Gewohnheits-Details: Why, Kontext, Hürden
Sei extrem konkret, persönlich und umsetzbar.`
            },
            { role: 'user', content: prompt }
          ]
        })
      });

      const data = await response.json();
      return data.choices[0].message.content.trim();

    } catch (error) {
      console.error('❌ Error getting adaptive goal coaching:', error);
      return this.getFallbackCoaching(habitAnalysis, totalCompletion);
    }
  }

  /**
   * Fallback coaching when AI is unavailable
   */
  private getFallbackCoaching(habitAnalysis: EnhancedHabitAnalysis[], totalCompletion: number): string {
    if (totalCompletion >= 80) {
      return `🚀 **Starke Woche!** Du bist auf Kurs. Nächster Schritt: Erhöhe die Messlatte oder stacke eine neue Gewohnheit.`;
    }

    if (totalCompletion >= 60) {
      const decliningHabit = habitAnalysis.find(h => h.trend.direction === '↓');
      if (decliningHabit) {
        return `📊 **Solide Performance.** Fokus: ${decliningHabit.habitName} – Identifiziere den Blocker der letzten Woche.`;
      }
      return `📊 **Guter Start!** Baue Konsistenz auf – kleine Verbesserungen diese Woche bringen dich näher an 80%.`;
    }

    const lowestHabit = [...habitAnalysis].sort((a, b) => a.completionRate - b.completionRate)[0];
    if (lowestHabit) {
      return `🔧 **Zeit für Anpassung:** Fokus auf **${lowestHabit.habitName}** – reduziere das Ziel auf Minimal Dose und baue von dort auf.`;
    }

    return `💪 Jeder Tag zählt – bleib dran!`;
  }

  /**
   * Generate personalized weekly mindmap image
   */
  private async generateWeeklyMindmap(
    user: User,
    habitAnalysis: EnhancedHabitAnalysis[],
    weekInfo: { weekStart: Date; weekEnd: Date }
  ): Promise<Buffer | null> {
    try {
      // Calculate overall metrics
      const totalCompletion = habitAnalysis.length > 0
        ? Math.round(habitAnalysis.reduce((sum, h) => sum + h.completionRate, 0) / habitAnalysis.length)
        : 0;

      // Calculate proofs completed (sum of all actual frequencies = total proofs submitted)
      // Note: This counts total proofs, not days (e.g., if 2 habits with frequency 7 and 4 = 11 total proofs)
      const daysCompleted = habitAnalysis.reduce((sum, h) => sum + h.actualFrequency, 0);
      const totalDays = habitAnalysis.reduce((sum, h) => sum + h.targetFrequency, 0);

      // Get strongest and weakest habits
      const sortedByRate = [...habitAnalysis].sort((a, b) => b.completionRate - a.completionRate);
      const strongest = sortedByRate[0]
        ? { name: sortedByRate[0].habitName, rate: sortedByRate[0].completionRate }
        : null;
      const weakest = sortedByRate[sortedByRate.length - 1]
        ? { name: sortedByRate[sortedByRate.length - 1].habitName, rate: sortedByRate[sortedByRate.length - 1].completionRate }
        : null;

      // Extract key insight from AI analysis
      const keyInsight = this.extractKeyInsightFromAnalysis(habitAnalysis);

      // Extract main action from analysis
      const mainAction = this.extractMainActionFromAnalysis(habitAnalysis, totalCompletion);

      // Calculate overall trend
      const avgTrendChange = habitAnalysis.length > 0
        ? habitAnalysis.reduce((sum, h) => sum + h.trend.percentChange, 0) / habitAnalysis.length
        : 0;
      const trend: '↑' | '↓' | '→' = avgTrendChange > 5 ? '↑' : avgTrendChange < -5 ? '↓' : '→';

      // Format week range
      const weekRange = `${weekInfo.weekStart.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })} - ${weekInfo.weekEnd.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })}`;

      // Generate mindmap
      const mindmapGenerator = new MindmapGenerator();
      const mindmapData = {
        userName: user.nickname || user.name,
        weekRange,
        overallScore: totalCompletion,
        daysCompleted,
        totalDays,
        strongestHabit: strongest,
        weakestHabit: weakest,
        keyInsight,
        mainAction,
        trend
      };

      return await mindmapGenerator.generateMindmap(mindmapData);
    } catch (error) {
      console.error('❌ Error generating mindmap:', error);
      return null;
    }
  }

  /**
   * Extract key insight from habit analysis
   */
  private extractKeyInsightFromAnalysis(habitAnalysis: EnhancedHabitAnalysis[]): string {
    // Find habits with best streaks or declining trends
    const bestStreak = habitAnalysis.reduce((max, h) => Math.max(max, h.streaks.current), 0);
    const decliningHabits = habitAnalysis.filter(h => h.trend.direction === '↓');

    if (bestStreak >= 7) {
      return `${bestStreak}-Tage-Streak aktiv!`;
    }

    if (decliningHabits.length > 0) {
      return `${decliningHabits.length} ${decliningHabits.length === 1 ? 'Gewohnheit' : 'Gewohnheiten'} im Abwärtstrend`;
    }

    const improvingHabits = habitAnalysis.filter(h => h.trend.direction === '↑');
    if (improvingHabits.length > 0) {
      return `${improvingHabits.length} ${improvingHabits.length === 1 ? 'Gewohnheit verbessert' : 'Gewohnheiten verbessern'} sich`;
    }

    return 'Konstante Performance';
  }

  /**
   * Extract main action from analysis
   */
  private extractMainActionFromAnalysis(habitAnalysis: EnhancedHabitAnalysis[], totalCompletion: number): string {
    // High performers: challenge them
    if (totalCompletion >= 80) {
      return 'Level erhöhen oder neue Gewohnheit stacken';
    }

    // Medium performers: focus on consistency
    if (totalCompletion >= 60) {
      const decliningHabit = habitAnalysis.find(h => h.trend.direction === '↓');
      if (decliningHabit) {
        return `Blocker bei "${decliningHabit.habitName}" identifizieren`;
      }
      return 'Konsistenz aufbauen - kleine Verbesserungen';
    }

    // Low performers: simplify
    const lowestHabit = [...habitAnalysis].sort((a, b) => a.completionRate - b.completionRate)[0];
    if (lowestHabit) {
      return `"${lowestHabit.habitName}" auf Minimal Dose reduzieren`;
    }

    return 'Dranbleiben - jeder Tag zählt!';
  }
}
