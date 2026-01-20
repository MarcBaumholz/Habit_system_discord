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
  HabitCompliance,
  GroupAnalysis,
  UserCompliance,
  UserComplianceSummary,
  WeeklyAccountabilityReport,
  LeaderboardEntry,
  Group,
  WeeklyPoolContributor,
  ChallengingHabitSummary,
  BuddyPerformanceSummary,
  BuddyPerformancePair,
  RiskAlert,
  PerfectWeekAchiever,
  AdaptiveGoalRecommendation
} from '../../types';
import { getCurrentBatch, filterHabitsByCurrentBatch, isBatchActive } from '../../utils/batch-manager';
import { ensurePoolResetWeekStart } from '../../utils/pool-reset-manager';

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
      // Get active users in current batch
      const batch = getCurrentBatch();
      let allUsers: User[] = [];
      if (batch && isBatchActive()) {
        const batchUsers = await this.notionClient.getUsersInBatch(batch.name);
        allUsers = batchUsers.filter(user => user.status === 'active');
      }

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

    // Check if batch is active
    if (!isBatchActive()) {
      this.log('info', 'No active batch - returning empty report');
      return this.createEmptyReport();
    }

    const batch = getCurrentBatch();
    if (!batch) {
      return this.createEmptyReport();
    }

    this.log('info', `Generating report for batch: ${batch.name}`);

    const weekWindow = this.getCurrentWeekWindow();
    const weekStart = weekWindow.weekStartDate;
    const weekEnd = weekWindow.weekEndDate;
    this.log('info', `Week range: ${weekStart} to ${weekEnd}`);

    // Step 1: Get active users in current batch
    const batchUsers = await this.notionClient.getUsersInBatch(batch.name);
    const allUsers = batchUsers.filter(user => user.status === 'active');
    this.log('info', `Found ${allUsers.length} active users in batch "${batch.name}" (${batchUsers.length} total in batch)`);

    // Step 2: Calculate compliance for each user
    const userCompliance: UserCompliance[] = [];

    for (const user of allUsers) {
      try {
        const compliance = await this.calculateUserCompliance(
          user,
          weekStart,
          weekEnd,
          weekWindow.weekStartIso,
          weekWindow.weekEndIso
        );
        if (compliance && compliance.habits.length > 0) {
          userCompliance.push(compliance);
        }
      } catch (error) {
        this.log('error', `Failed to calculate compliance for user ${user.name}`, { error });
      }
    }

    this.log('info', `Calculated compliance for ${userCompliance.length} users`);

    // Step 3: Generate leaderboard (top 5)
    const leaderboard = this.generateLeaderboard(userCompliance).slice(0, 5);

    // Step 4: Save charges to Price Pool
    await this.saveChargesToPricePool(userCompliance, weekStart);

    // Step 5: Get pool balance since the last reset (reset happens once when the code first runs)
    const currentBatch = getCurrentBatch();
    const poolResetWeekStart = ensurePoolResetWeekStart(weekStart);
    this.log('info', 'Pool reset baseline', { poolResetWeekStart });
    const totalPoolBalance = await this.notionClient.getTotalPricePool(currentBatch?.name, {
      sinceWeekStart: poolResetWeekStart
    });

    // Step 6: Calculate total weekly charges
    const totalWeeklyCharges = userCompliance.reduce((sum, user) => sum + user.totalCharge, 0);

    // Step 7: Get social insights (structured, validated)
    const socialInsights = await this.generateSocialInsightsWithRetry(userCompliance, leaderboard);

    // Step 8: Build summaries and limits
    const summary = {
      totalUsers: userCompliance.length,
      perfectWeeks: userCompliance.filter(u => u.perfectWeek).length,
      usersWithCharges: userCompliance.filter(u => u.totalCharge > 0).length,
      totalCharges: totalWeeklyCharges,
      poolBalance: totalPoolBalance,
    };

    const userComplianceSummary = this.buildUserComplianceSummary(userCompliance);
    const poolSummary = this.buildPoolSummary(userCompliance, totalWeeklyCharges, totalPoolBalance);
    const challengingHabits = this.buildChallengingHabits(userCompliance);
    const buddyPerformance = this.buildBuddyPerformance(allUsers, userCompliance);
    const riskAlerts = this.buildRiskAlerts(userCompliance);
    const perfectWeekClub = this.buildPerfectWeekClub(userCompliance);
    const adaptiveGoals = this.buildAdaptiveGoals(userCompliance);

    const report: WeeklyAccountabilityReport = {
      weekStart,
      weekEnd,
      summary,
      leaderboard,
      userCompliance: userComplianceSummary,
      socialInsights,
      poolSummary,
      challengingHabits,
      buddyPerformance,
      riskAlerts,
      perfectWeekClub,
      adaptiveGoals,
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
   * Create empty report when no batch is active
   */
  private createEmptyReport(): WeeklyAccountabilityReport {
    const weekWindow = this.getCurrentWeekWindow();
    const weekStart = weekWindow.weekStartDate;
    const weekEnd = weekWindow.weekEndDate;

    return {
      weekStart,
      weekEnd,
      summary: {
        totalUsers: 0,
        perfectWeeks: 0,
        usersWithCharges: 0,
        totalCharges: 0,
        poolBalance: 0
      },
      leaderboard: [],
      userCompliance: [],
      socialInsights: [],
      poolSummary: {
        weeklyCharges: 0,
        poolBalance: 0,
        topContributors: []
      },
      challengingHabits: [],
      buddyPerformance: {
        pairs: [],
        unpairedCount: 0
      },
      riskAlerts: [],
      perfectWeekClub: [],
      adaptiveGoals: [],
      generatedAt: new Date().toISOString()
    };
  }

  /**
   * Calculate habit compliance for a single user
   */
  private async calculateUserCompliance(
    user: User,
    weekStart: string,
    weekEnd: string,
    weekStartIso: string,
    weekEndIso: string
  ): Promise<UserCompliance | null> {
    try {
      // Get user's habits and filter by current batch
      const allHabits = await this.notionClient.getHabitsByUserId(user.id);
      const habits = filterHabitsByCurrentBatch(allHabits);

      if (!habits || habits.length === 0) {
        this.log('info', `User ${user.name} has no habits in current batch, skipping`);
        return null;
      }

      const habitCompliance: HabitCompliance[] = [];

      // Process each habit
      for (const habit of habits) {
        // Get proofs for this habit in the week range.
        // Note: All proofs are counted (isMinimalDose and isCheatDay are not excluded). If
        // isCheatDay should not count toward the target, or isMinimalDose should count as
        // partial, that logic would need to be added here.
        const proofs = await this.notionClient.getProofsByHabitAndDateRange(
          habit.id,
          weekStartIso,
          weekEndIso
        );

        const targetFrequency = habit.frequency; // Expected times per week
        const actualProofs = proofs.length;
        const missedCount = Math.max(0, targetFrequency - actualProofs);
        const charge = missedCount * this.CHARGE_PER_MISS;
        const completionRate =
          targetFrequency > 0
            ? Math.min(100, (actualProofs / targetFrequency) * 100)
            : 100;

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

    // Get current batch for all entries
    const currentBatch = getCurrentBatch();
    const batchName = currentBatch?.name;

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
              price: habit.charge,
              batch: batchName
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
  private async generateSocialInsights(
    userCompliance: UserCompliance[],
    leaderboard: LeaderboardEntry[]
  ): Promise<string[]> {
    const topPerformers = leaderboard.slice(0, 3);
    const usersWithCharges = userCompliance.filter(u => u.totalCharge > 0).length;
    const perfectWeeks = userCompliance.filter(u => u.perfectWeek).length;
    const totalCharges = userCompliance.reduce((sum, u) => sum + u.totalCharge, 0);

    const prompt = `
    ROLE: Social dynamics analyst for weekly accountability report.

    DATA:
    - Top performers: ${topPerformers.map(u => `${u.name} (${u.overallCompletionRate.toFixed(0)}%)`).join(', ') || 'None'}
    - Users with charges: ${usersWithCharges}
    - Perfect weeks: ${perfectWeeks}
    - Total charges: €${totalCharges.toFixed(2)}

    OUTPUT (STRICT):
    - 2 bullets max, one sentence each, max 80 chars
    - Use specific numbers from data
    - Skip bullet 2 if no clear peer-support opportunity
    - Return as JSON array: ["bullet1", "bullet2"]
    `.trim();

    const response = await this.perplexityClient.generateResponse(prompt);
    const parsed = this.parseJsonArray(response);
    return this.normalizeInsights(parsed);
  }

  private async generateSocialInsightsWithRetry(
    userCompliance: UserCompliance[],
    leaderboard: LeaderboardEntry[],
    maxRetries: number = 3
  ): Promise<string[]> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const insights = await this.generateSocialInsights(userCompliance, leaderboard);
        if (insights.length === 0) {
          throw new Error('No insights returned');
        }
        return insights;
      } catch (error) {
        lastError = error as Error;
        this.log('warn', `Social insights attempt ${attempt} failed`, { error: lastError.message });
      }
    }

    this.log('warn', 'Social insights retries exhausted, using fallback', {
      error: lastError?.message
    });
    return this.generateFallbackInsights(userCompliance, leaderboard);
  }

  private generateFallbackInsights(
    userCompliance: UserCompliance[],
    leaderboard: LeaderboardEntry[]
  ): string[] {
    if (userCompliance.length === 0) {
      return ['No active users tracked this week'];
    }

    const avgRate = userCompliance.reduce((sum, u) => sum + u.overallCompletionRate, 0) / userCompliance.length;
    const usersWithCharges = userCompliance.filter(u => u.totalCharge > 0).length;
    const topPerformer = leaderboard[0];

    const insights: string[] = [];
    if (topPerformer) {
      insights.push(`${topPerformer.name} leads at ${topPerformer.overallCompletionRate.toFixed(0)}%`);
    }
    insights.push(`Group avg ${avgRate.toFixed(0)}% | ${usersWithCharges} with charges`);

    return this.normalizeInsights(insights);
  }

  private parseJsonArray(response: string): string[] {
    const match = response.match(/\[[\s\S]*\]/);
    if (!match) {
      throw new Error('No JSON array found in AI response');
    }

    const parsed = JSON.parse(match[0]);
    if (!Array.isArray(parsed)) {
      throw new Error('AI response JSON is not an array');
    }

    return parsed.map(item => String(item));
  }

  private normalizeInsights(insights: string[]): string[] {
    const normalized = insights
      .map(item => item.trim().replace(/^[-•\s]+/, '').replace(/\s+/g, ' ').replace(/[.!?]\s*$/, ''))
      .filter(item => item.length > 0)
      .slice(0, 2)
      .map(item => this.truncateInsight(item, 80));

    return normalized;
  }

  private truncateInsight(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    return `${text.slice(0, Math.max(0, maxLength - 3)).trim()}...`;
  }

  private buildUserComplianceSummary(userCompliance: UserCompliance[]): UserComplianceSummary[] {
    return [...userCompliance]
      .sort((a, b) => {
        if (b.totalCharge !== a.totalCharge) return b.totalCharge - a.totalCharge;
        return b.overallCompletionRate - a.overallCompletionRate;
      })
      .slice(0, 10)
      .map(user => {
        const sortedHabits = [...user.habits].sort((a, b) => {
          if (b.missedCount !== a.missedCount) return b.missedCount - a.missedCount;
          return a.completionRate - b.completionRate;
        });

        const topHabits = sortedHabits.slice(0, 5);
        const oneLiner = this.buildUserOneLiner(user);

        return {
          name: user.name,
          discordId: user.discordId,
          completionRate: user.overallCompletionRate,
          habits: topHabits,
          totalCharge: user.totalCharge,
          streak: user.currentStreak,
          oneLiner
        };
      });
  }

  private buildPoolSummary(
    userCompliance: UserCompliance[],
    weeklyCharges: number,
    poolBalance: number
  ): { weeklyCharges: number; poolBalance: number; topContributors: WeeklyPoolContributor[] } {
    const topContributors = [...userCompliance]
      .filter(user => user.totalCharge > 0)
      .sort((a, b) => b.totalCharge - a.totalCharge)
      .slice(0, 3)
      .map(user => ({
        name: user.name,
        amount: user.totalCharge
      }));

    return {
      weeklyCharges,
      poolBalance,
      topContributors
    };
  }

  private buildChallengingHabits(userCompliance: UserCompliance[]): ChallengingHabitSummary[] {
    const habitMap = new Map<string, { totalRate: number; count: number; struggling: number }>();

    userCompliance.forEach(user => {
      user.habits.forEach(habit => {
        const entry = habitMap.get(habit.habitName) || { totalRate: 0, count: 0, struggling: 0 };
        entry.totalRate += habit.completionRate;
        entry.count += 1;
        if (habit.completionRate < 60) {
          entry.struggling += 1;
        }
        habitMap.set(habit.habitName, entry);
      });
    });

    const summaries: ChallengingHabitSummary[] = Array.from(habitMap.entries()).map(([habitName, data]) => ({
      habitName,
      avgCompletionRate: data.count > 0 ? data.totalRate / data.count : 0,
      usersStruggling: data.struggling
    }));

    return summaries
      .filter(item => item.usersStruggling > 0)
      .sort((a, b) => a.avgCompletionRate - b.avgCompletionRate)
      .slice(0, 3);
  }

  private buildBuddyPerformance(allUsers: User[], userCompliance: UserCompliance[]): BuddyPerformanceSummary {
    const complianceByDiscord = new Map(userCompliance.map(u => [u.discordId, u]));
    const userByNickname = new Map<string, User>();
    const userByName = new Map<string, User>();

    allUsers.forEach(user => {
      if (user.nickname) {
        userByNickname.set(user.nickname.toLowerCase(), user);
      }
      userByName.set(user.name.toLowerCase(), user);
    });

    const pairs: BuddyPerformancePair[] = [];
    const seenPairs = new Set<string>();
    let unpairedCount = 0;

    allUsers.forEach(user => {
      if (!user.buddy) {
        unpairedCount += 1;
        return;
      }

      const buddyKey = user.buddy.toLowerCase();
      const buddyUser = userByNickname.get(buddyKey) || userByName.get(buddyKey);
      if (!buddyUser) {
        unpairedCount += 1;
        return;
      }

      const userComplianceData = complianceByDiscord.get(user.discordId);
      const buddyComplianceData = complianceByDiscord.get(buddyUser.discordId);

      if (!userComplianceData || !buddyComplianceData) {
        unpairedCount += 1;
        return;
      }

      const pairKey = [user.id, buddyUser.id].sort().join(':');
      if (seenPairs.has(pairKey)) {
        return;
      }
      seenPairs.add(pairKey);

      const combinedCompletionRate =
        (userComplianceData.overallCompletionRate + buddyComplianceData.overallCompletionRate) / 2;
      const bothOnTrack = userComplianceData.overallCompletionRate >= 80 && buddyComplianceData.overallCompletionRate >= 80;
      const bothStruggling = userComplianceData.overallCompletionRate < 60 && buddyComplianceData.overallCompletionRate < 60;

      const status: BuddyPerformancePair['status'] = bothOnTrack
        ? 'both_on_track'
        : bothStruggling
          ? 'both_struggling'
          : 'mixed';

      pairs.push({
        userA: user.name,
        userB: buddyUser.name,
        combinedCompletionRate,
        status
      });
    });

    return {
      pairs: pairs.slice(0, 3),
      unpairedCount
    };
  }

  private buildRiskAlerts(userCompliance: UserCompliance[]): RiskAlert[] {
    const alerts: RiskAlert[] = userCompliance
      .map(user => {
        const habitsBelow50 = user.habits.filter(habit => habit.completionRate < 50).length;
        let reason = '';

        // Priority: multiple struggling habits > low overall rate > high charges
        if (habitsBelow50 >= 2) {
          reason = `${habitsBelow50} habits below 50%`;
        } else if (user.overallCompletionRate < 60) {
          reason = 'overall below 60%';
        } else if (user.totalCharge >= 2) {
          reason = `charges €${user.totalCharge.toFixed(2)}`;
        }

        return reason.length > 0 ? {
          name: user.name,
          reason
        } : null;
      })
      .filter((alert): alert is RiskAlert => alert !== null);

    return alerts
      .sort((a, b) => {
        const aUser = userCompliance.find(u => u.name === a.name);
        const bUser = userCompliance.find(u => u.name === b.name);
        if (!aUser || !bUser) return 0;
        return aUser.overallCompletionRate - bUser.overallCompletionRate;
      })
      .slice(0, 3);
  }

  private buildPerfectWeekClub(userCompliance: UserCompliance[]): PerfectWeekAchiever[] {
    return userCompliance
      .filter(user => user.perfectWeek)
      .sort((a, b) => b.currentStreak - a.currentStreak)
      .slice(0, 5)
      .map(user => ({
        name: user.name,
        streak: user.currentStreak,
        totalHabits: user.totalHabits
      }));
  }

  private buildAdaptiveGoals(userCompliance: UserCompliance[]): AdaptiveGoalRecommendation[] {
    const recommendations: AdaptiveGoalRecommendation[] = [];

    userCompliance.forEach(user => {
      user.habits.forEach(habit => {
        // Only suggest reduction if completion rate is below 70% and target is > 1
        if (habit.completionRate >= 70 || habit.targetFrequency <= 1) {
          return;
        }

        // More aggressive reduction for very low completion rates
        const reduction = habit.completionRate < 50 ? 2 : 1;
        const recommendedTarget = Math.max(1, habit.targetFrequency - reduction);

        // Only add if there's an actual reduction
        if (recommendedTarget < habit.targetFrequency) {
          recommendations.push({
            name: user.name,
            habitName: habit.habitName,
            currentRate: habit.completionRate,
            targetFrequency: habit.targetFrequency,
            recommendedTarget
          });
        }
      });
    });

    return recommendations
      .sort((a, b) => a.currentRate - b.currentRate)
      .slice(0, 3);
  }

  private buildUserOneLiner(user: UserCompliance): string {
    let oneLiner: string;
    if (user.perfectWeek) {
      oneLiner = `Perfect week across ${user.totalHabits} habits`;
    } else if (user.totalCharge > 0) {
      oneLiner = `${user.completedHabits}/${user.totalHabits} habits on track; charges €${user.totalCharge.toFixed(2)}`;
    } else {
      oneLiner = `${user.overallCompletionRate.toFixed(0)}% completion with steady progress`;
    }
    return this.truncateInsight(oneLiner.replace(/[.!?]\s*$/, ''), 100);
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
  private getCurrentWeekWindow(): {
    weekStartDate: string;
    weekEndDate: string;
    weekStartIso: string;
    weekEndIso: string;
  } {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, ...
    const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

    const monday = new Date(today);
    monday.setDate(today.getDate() + daysToMonday);
    monday.setHours(2, 0, 0, 0);

    const nextMonday = new Date(monday);
    nextMonday.setDate(monday.getDate() + 7);
    nextMonday.setHours(2, 0, 0, 0);

    const sunday = new Date(nextMonday);
    sunday.setDate(nextMonday.getDate() - 1);

    return {
      weekStartDate: monday.toISOString().split('T')[0],
      weekEndDate: sunday.toISOString().split('T')[0],
      weekStartIso: monday.toISOString(),
      weekEndIso: new Date(nextMonday.getTime() - 1).toISOString()
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
