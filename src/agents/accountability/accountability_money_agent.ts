/**
 * Accountability & Money Agent - Combined financial accountability and social dynamics
 *
 * Responsibilities:
 * 1. Track habit compliance and calculate fees (€0.50 per missed iteration)
 * 2. Generate leaderboards with rankings and streaks
 * 3. Analyze social dynamics and group compatibility
 * 4. Send weekly reports to accountability channel every Sunday at 8 PM
 * 5. Manage Price Pool database entries
 */

import { BaseAgent } from '../base/agent';
import { UserContext, AgentResponse } from '../base/types';
import { PerplexityClient } from '../../ai/perplexity-client';
import { NotionClient } from '../../notion/client';
import {
  User,
  Habit,
  Proof,
  HabitCompliance,
  GroupAnalysis,
  UserCompliance,
  WeeklyAccountabilityReport,
  LeaderboardEntry,
  Group
} from '../../types';

export class AccountabilityMoneyAgent extends BaseAgent {
  private perplexityClient: PerplexityClient;
  private notionClient: NotionClient;
  private readonly CHARGE_PER_MISS = 0.50; // €0.50 per missed iteration

  constructor(perplexityClient: PerplexityClient, notionClient: NotionClient) {
    super('accountability_money', 'Accountability & Money Agent', [
      'habit_compliance_tracking',
      'financial_accountability',
      'leaderboard_generation',
      'social_dynamics_analysis',
      'group_coordination',
      'weekly_reporting'
    ]);

    this.perplexityClient = perplexityClient;
    this.notionClient = notionClient;
  }

  async initialize(): Promise<void> {
    this.log('info', 'Initializing Accountability & Money Agent');

    if (!PerplexityClient.isAvailable()) {
      throw new Error('Perplexity API key not available');
    }

    this.log('info', 'Accountability & Money Agent initialized successfully');
  }

  async processRequest(userContext: UserContext, message: string, metadata?: Record<string, any>): Promise<AgentResponse> {
    this.log('info', 'Processing accountability request', { userId: userContext.user.id });

    try {
      // If this is a weekly report request, generate full report
      if (metadata?.type === 'weekly_report') {
        const report = await this.generateWeeklyReport();
        return {
          success: true,
          message: 'Weekly report generated successfully',
          data: report,
          agentId: this.agentId,
          confidence: 1.0,
          timestamp: new Date()
        };
      }

      // Otherwise, handle individual analysis requests
      const allUsers = await this.notionClient.getActiveUsers();
      const groups = await this.notionClient.getAllGroups();

      const groupAnalysis = await this.analyzeGroupDynamics(userContext, allUsers as any, groups as any);

      return {
        success: true,
        message: this.formatGroupResponse(groupAnalysis),
        data: { analysis: groupAnalysis },
        agentId: this.agentId,
        confidence: 0.8,
        timestamp: new Date()
      };

    } catch (error) {
      this.log('error', 'Accountability analysis failed', { error: error instanceof Error ? error.message : String(error) });
      return {
        success: false,
        message: "Accountability analysis failed. Please try again later.",
        data: null,
        agentId: this.agentId,
        confidence: 0,
        timestamp: new Date()
      };
    }
  }

  /**
   * Generate comprehensive weekly accountability report
   */
  async generateWeeklyReport(): Promise<WeeklyAccountabilityReport> {
    this.log('info', 'Generating weekly accountability report');

    const { weekStart, weekEnd } = this.getCurrentWeekRange();
    this.log('info', `Week range: ${weekStart} to ${weekEnd}`);

    // Step 1: Get all active users
    const allUsers = await this.notionClient.getActiveUsers();
    this.log('info', `Found ${allUsers.length} active users`);

    // Step 2: Calculate compliance for each user
    const userCompliance: UserCompliance[] = [];

    for (const user of allUsers) {
      try {
        const compliance = await this.calculateUserCompliance(user, weekStart, weekEnd);
        if (compliance && compliance.habits.length > 0) {
          userCompliance.push(compliance);
        }
      } catch (error) {
        this.log('error', `Failed to calculate compliance for user ${user.name}`, { error });
      }
    }

    this.log('info', `Calculated compliance for ${userCompliance.length} users`);

    // Step 3: Generate leaderboard
    const leaderboard = this.generateLeaderboard(userCompliance);

    // Step 4: Save charges to Price Pool
    await this.saveChargesToPricePool(userCompliance, weekStart);

    // Step 5: Get total pool balance
    const totalPoolBalance = await this.notionClient.getTotalPricePool();

    // Step 6: Get social insights
    const socialInsights = await this.generateSocialInsights(allUsers as any);

    // Step 7: Calculate total weekly charges
    const totalWeeklyCharges = userCompliance.reduce((sum, user) => sum + user.totalCharge, 0);

    const report: WeeklyAccountabilityReport = {
      weekStart,
      weekEnd,
      userCompliance,
      leaderboard,
      totalWeeklyCharges,
      totalPoolBalance,
      socialInsights,
      generatedAt: new Date().toISOString()
    };

    this.log('info', 'Weekly report generated successfully', {
      usersProcessed: userCompliance.length,
      totalCharges: totalWeeklyCharges,
      poolBalance: totalPoolBalance
    });

    return report;
  }

  /**
   * Calculate habit compliance for a single user
   */
  private async calculateUserCompliance(
    user: User,
    weekStart: string,
    weekEnd: string
  ): Promise<UserCompliance | null> {
    try {
      // Get user's habits
      const habits = await this.notionClient.getHabitsByUserId(user.id);

      if (!habits || habits.length === 0) {
        this.log('info', `User ${user.name} has no habits, skipping`);
        return null;
      }

      const habitCompliance: HabitCompliance[] = [];

      // Process each habit
      for (const habit of habits) {
        // Get proofs for this habit in the week range
        const proofs = await this.notionClient.getProofsByHabitAndDateRange(
          habit.id,
          weekStart,
          weekEnd
        );

        const targetFrequency = habit.frequency; // Expected times per week
        const actualProofs = proofs.length;
        const missedCount = Math.max(0, targetFrequency - actualProofs);
        const charge = missedCount * this.CHARGE_PER_MISS;
        const completionRate = targetFrequency > 0 ? (actualProofs / targetFrequency) * 100 : 100;

        habitCompliance.push({
          habitId: habit.id,
          habitName: habit.name,
          targetFrequency,
          actualProofs,
          missedCount,
          charge,
          completionRate
        });
      }

      // Calculate user-level metrics
      const totalCharge = habitCompliance.reduce((sum, h) => sum + h.charge, 0);
      const perfectWeek = habitCompliance.every(h => h.missedCount === 0);
      const totalHabits = habitCompliance.length;
      const completedHabits = habitCompliance.filter(h => h.missedCount === 0).length;
      const overallCompletionRate = habitCompliance.reduce((sum, h) => sum + h.completionRate, 0) / totalHabits;

      // Get current streak (consecutive perfect weeks)
      const currentStreak = await this.calculateUserStreak(user.id);

      return {
        userId: user.id,
        discordId: user.discordId,
        name: user.name,
        habits: habitCompliance,
        totalCharge,
        perfectWeek,
        totalHabits,
        completedHabits,
        overallCompletionRate,
        currentStreak
      };

    } catch (error) {
      this.log('error', `Error calculating compliance for user ${user.name}`, { error });
      return null;
    }
  }

  /**
   * Calculate user's current perfect week streak
   */
  private async calculateUserStreak(userId: string): Promise<number> {
    try {
      // Get all weeks for this user from the Weeks database
      const weeks = await this.notionClient.getWeeksByUserId(userId);

      if (!weeks || weeks.length === 0) {
        return 0;
      }

      // Sort by week number descending (most recent first)
      const sortedWeeks = weeks.sort((a, b) => b.weekNum - a.weekNum);

      // Count consecutive perfect weeks (score >= 7)
      let streak = 0;
      for (const week of sortedWeeks) {
        if (week.score >= 7) {
          streak++;
        } else {
          break;
        }
      }

      return streak;
    } catch (error) {
      this.log('error', 'Error calculating streak', { userId, error });
      return 0;
    }
  }

  /**
   * Generate leaderboard from user compliance data
   */
  private generateLeaderboard(userCompliance: UserCompliance[]): LeaderboardEntry[] {
    // Sort by overall completion rate (descending)
    const sorted = [...userCompliance].sort((a, b) => b.overallCompletionRate - a.overallCompletionRate);

    const leaderboard: LeaderboardEntry[] = sorted.map((user, index) => {
      const rank = index + 1;
      let badge: string | undefined;

      // Assign badges
      if (rank === 1) badge = '🏆';
      else if (rank === 2) badge = '🥈';
      else if (rank === 3) badge = '🥉';
      else if (user.currentStreak >= 4) badge = '🔥'; // Fire for 4+ week streak
      else if (user.perfectWeek) badge = '✨'; // Sparkle for perfect week

      return {
        rank,
        userId: user.userId,
        discordId: user.discordId,
        name: user.name,
        overallCompletionRate: user.overallCompletionRate,
        totalHabits: user.totalHabits,
        completedHabits: user.completedHabits,
        currentStreak: user.currentStreak,
        badge
      };
    });

    return leaderboard;
  }

  /**
   * Save charges to Price Pool database
   */
  private async saveChargesToPricePool(
    userCompliance: UserCompliance[],
    weekDate: string
  ): Promise<void> {
    this.log('info', 'Saving charges to Price Pool database');

    let savedCount = 0;
    let errorCount = 0;

    for (const user of userCompliance) {
      for (const habit of user.habits) {
        if (habit.charge > 0) {
          try {
            const message = `${habit.habitName}: ${habit.missedCount} missed (${habit.actualProofs}/${habit.targetFrequency} completed)`;

            await this.notionClient.createPricePoolEntry({
              discordId: user.discordId,
              userId: user.userId,
              weekDate,
              message,
              price: habit.charge
            });

            savedCount++;
          } catch (error) {
            this.log('error', `Error saving charge for user ${user.name}, habit ${habit.habitName}`, { error });
            errorCount++;
          }
        }
      }
    }

    this.log('info', `Price Pool entries saved: ${savedCount} success, ${errorCount} errors`);
  }

  /**
   * Generate social insights using Group Agent logic
   */
  private async generateSocialInsights(allUsers: User[]): Promise<string> {
    try {
      const groups = await this.notionClient.getAllGroups();

      const prompt = `
      ROLE: Social dynamics expert analyzing weekly accountability group performance.

      TASK: Generate brief social insights for the weekly accountability report.

      COMMUNITY DATA:
      - Total Active Users: ${allUsers.length}
      - Total Groups: ${groups.length}

      Generate 2-3 concise insights about:
      1. Overall community engagement and motivation trends
      2. Peer support opportunities or collaboration suggestions
      3. Group dynamics observations

      Keep it brief (3-4 sentences max) and actionable.
      `;

      const response = await this.perplexityClient.generateResponse(prompt);
      return response || 'Community is actively engaged in building healthy habits together!';

    } catch (error) {
      this.log('error', 'Error generating social insights', { error });
      return 'Keep supporting each other in your habit journey!';
    }
  }

  /**
   * Analyze group dynamics (from original Group Agent)
   */
  private async analyzeGroupDynamics(
    userContext: UserContext,
    allUsers: User[],
    groups: Group[]
  ): Promise<GroupAnalysis> {
    const prompt = `
    ROLE: Social dynamics expert specializing in habit accountability groups.

    TASK: Analyze group dynamics and social compatibility.

    TARGET USER:
    - Name: ${userContext.user.name}
    - Current Habits: ${userContext.current_habits.map(h => h.name).join(', ')}
    - Trust Count: ${userContext.user.trust_count}

    COMMUNITY (${allUsers.length} users):
    ${allUsers.slice(0, 10).map(user => `- ${user.name} (Trust: ${user.trustCount})`).join('\n')}

    OUTPUT FORMAT (STRICT JSON):
    {
      "compatibilityScore": <1-10>,
      "influenceLevel": "<high|medium|low>",
      "groupDynamics": "<analysis>",
      "recommendations": ["<rec1>", "<rec2>", "<rec3>"]
    }
    `;

    const response = await this.perplexityClient.generateResponse(prompt);

    try {
      const analysis = JSON.parse(response);
      return {
        id: `group_${Date.now()}`,
        groupId: groups[0]?.id || 'default',
        userId: userContext.user.id,
        discordId: userContext.user.discord_id,
        compatibilityScore: analysis.compatibilityScore || 5,
        influenceLevel: (analysis.influenceLevel || 'medium') as 'high' | 'medium' | 'low',
        groupDynamics: analysis.groupDynamics || 'Standard dynamics',
        recommendations: analysis.recommendations || [],
        createdAt: new Date().toISOString()
      } as GroupAnalysis;
    } catch (error) {
      return {
        id: `group_${Date.now()}`,
        groupId: groups[0]?.id || 'default',
        userId: userContext.user.id,
        discordId: userContext.user.discord_id,
        compatibilityScore: 5,
        influenceLevel: 'medium' as 'high' | 'medium' | 'low',
        groupDynamics: response,
        recommendations: ['Join accountability groups', 'Find habit buddies'],
        createdAt: new Date().toISOString()
      } as GroupAnalysis;
    }
  }

  private formatGroupResponse(analysis: GroupAnalysis): string {
    return `
👥 **Group Dynamics Analysis**

**Your Social Profile:**
• Compatibility Score: ${analysis.compatibilityScore}/10
• Influence Level: ${analysis.influenceLevel}
• Group Dynamics: ${analysis.groupDynamics}

**Social Recommendations:**
${analysis.recommendations.map((rec, index) => `${index + 1}. ${rec}`).join('\n')}

*These recommendations will help you build a supportive community around your habits.*
    `.trim();
  }

  /**
   * Get current week range (Monday to Sunday)
   */
  private getCurrentWeekRange(): { weekStart: string; weekEnd: string } {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, ...
    const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

    const monday = new Date(today);
    monday.setDate(today.getDate() + daysToMonday);

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);

    return {
      weekStart: monday.toISOString().split('T')[0],
      weekEnd: sunday.toISOString().split('T')[0]
    };
  }

  async healthCheck(): Promise<boolean> {
    try {
      if (!PerplexityClient.isAvailable()) {
        return false;
      }
      return true;
    } catch (error) {
      return false;
    }
  }

  async cleanup(): Promise<void> {
    this.log('info', 'Accountability & Money Agent cleanup completed');
  }
}
