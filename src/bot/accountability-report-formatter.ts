/**
 * Accountability Report Formatter
 *
 * Formats weekly accountability reports for Discord with rich embeds
 * Includes leaderboard, per-user compliance, social insights, and pool summary
 */

import { EmbedBuilder, Colors, ColorResolvable } from 'discord.js';
import {
  WeeklyAccountabilityReport,
  UserComplianceSummary,
  HabitCompliance,
  BuddyPerformancePair,
  AdaptiveGoalRecommendation
} from '../types';

export class AccountabilityReportFormatter {
  private readonly PAYPAL_POOL_URL = 'https://www.paypal.com/pool/9lGmrdMzVH?sr=wccr';

  /**
   * Create comprehensive Discord embeds for weekly accountability report
   */
  createReportEmbeds(report: WeeklyAccountabilityReport): EmbedBuilder[] {
    const embeds: EmbedBuilder[] = [];

    // 1. Header Embed with week info and summary stats
    embeds.push(this.createHeaderEmbed(report));

    // 2. Leaderboard Embed
    embeds.push(this.createLeaderboardEmbed(report));

    // 3. Consolidated user compliance summary (single embed)
    embeds.push(this.createConsolidatedUserComplianceEmbed(report.userCompliance));

    // 4. Pool summary + social insights (combined)
    embeds.push(this.createPoolAndSocialEmbed(report));

    return embeds;
  }

  /**
   * Create header embed with week info and summary stats
   */
  private createHeaderEmbed(report: WeeklyAccountabilityReport): EmbedBuilder {
    const weekLabel = this.formatWeekLabel(report.weekStart, report.weekEnd);
    const totalUsers = report.summary.totalUsers;
    const perfectWeeks = report.summary.perfectWeeks;
    const usersWithCharges = report.summary.usersWithCharges;

    // Color based on overall performance
    let color: ColorResolvable = Colors.Green;
    if (report.summary.totalCharges > 5) color = 0xFF6B6B as ColorResolvable; // Red-orange
    else if (report.summary.totalCharges > 2) color = 0xFFD93D as ColorResolvable; // Gold/Yellow

    const embed = new EmbedBuilder()
      .setTitle('📊 WEEKLY ACCOUNTABILITY REPORT')
      .setDescription(`**Week:** ${weekLabel}`)
      .setColor(color)
      .addFields([
        {
          name: '📈 Quick Stats',
          value: [
            `👥 Users tracked: **${totalUsers}**`,
            `✨ Perfect weeks: **${perfectWeeks}**`,
            `💸 Users with charges: **${usersWithCharges}**`,
            `💰 Weekly charges: **€${report.summary.totalCharges.toFixed(2)}**`
          ].join('\n'),
          inline: false
        }
      ])
      .setTimestamp()
      .setFooter({ text: '🎯 Next check: Sunday at 8:00 PM' });

    return embed;
  }

  /**
   * Create leaderboard embed with rankings
   */
  private createLeaderboardEmbed(report: WeeklyAccountabilityReport): EmbedBuilder {
    const embed = new EmbedBuilder()
      .setTitle('🏆 LEADERBOARD')
      .setDescription('Ranked by overall completion rate')
      .setColor(Colors.Gold);

    if (report.leaderboard.length === 0) {
      embed.setDescription('No data available for this week.');
      return embed;
    }

    const leaderboardText = report.leaderboard.map(entry => {
      const badge = entry.badge || '';
      const streak = entry.currentStreak > 0 ? ` | 🔥 ${entry.currentStreak}w` : '';
      const completion = `${entry.completedHabits}/${entry.totalHabits}`;
      const rate = `${entry.overallCompletionRate.toFixed(1)}%`;

      return `${badge} **#${entry.rank}** ${entry.name} - ${rate} (${completion}${streak})`;
    }).join('\n');

    embed.addFields([
      {
        name: 'Rankings',
        value: leaderboardText.substring(0, 1024), // Discord field limit
        inline: false
      }
    ]);

    return embed;
  }

  /**
   * Create consolidated user compliance embed
   */
  private createConsolidatedUserComplianceEmbed(userCompliance: UserComplianceSummary[]): EmbedBuilder {
    const embed = new EmbedBuilder()
      .setTitle('👥 USER COMPLIANCE SUMMARY')
      .setColor(Colors.Blue);

    if (userCompliance.length === 0) {
      embed.setDescription('No compliance data available for this week.');
      return embed;
    }

    const complianceText = userCompliance.map(user => {
      const topHabits = user.habits.slice(0, 3);
      const habitSummary = topHabits.length > 0
        ? topHabits.map(habit => {
          const emoji = habit.missedCount === 0 ? '✅' : '❌';
          return `${emoji} ${habit.habitName} (${habit.completionRate.toFixed(0)}%)`;
        }).join(' | ')
        : 'No habits tracked';

      const streakText = user.streak > 0 ? `🔥 ${user.streak}w` : '—';
      const oneLiner = user.oneLiner ? ` — ${user.oneLiner}` : '';

      return `**${user.name}**: ${user.completionRate.toFixed(0)}% | €${user.totalCharge.toFixed(2)} | ${streakText}${oneLiner}\n${habitSummary}`;
    }).join('\n\n');

    embed.setDescription(complianceText.substring(0, 4096)); // Discord limit

    return embed;
  }

  /**
   * Format a single habit summary
   */
  private formatHabitSummary(habit: HabitCompliance): string {
    const emoji = habit.missedCount === 0 ? '✅' : '❌';
    const completion = `${habit.actualProofs}/${habit.targetFrequency}`;
    const percentage = `(${habit.completionRate.toFixed(0)}%)`;

    if (habit.missedCount === 0) {
      return `${emoji} **${habit.habitName}**: ${completion} completed ${percentage}`;
    } else {
      const charge = `→ €${habit.charge.toFixed(2)}`;
      return `${emoji} **${habit.habitName}**: ${completion} completed ${percentage} - ${habit.missedCount} missed ${charge}`;
    }
  }

  /**
   * Create social insights embed
   */
  private createPoolAndSocialEmbed(report: WeeklyAccountabilityReport): EmbedBuilder {
    const embed = new EmbedBuilder()
      .setTitle('💰 POOL SUMMARY + INSIGHTS')
      .setColor(Colors.DarkGold);

    const paymentRequests = report.userCompliance
      .filter(user => user.totalCharge > 0)
      .map(user => `• ${user.name}: €${user.totalCharge.toFixed(2)}`)
      .join('\n');

    if (paymentRequests) {
      embed.addFields([
        {
          name: 'Pay This Week',
          value: `Please pay your amount into the pool:\n${this.PAYPAL_POOL_URL}\n\n${paymentRequests}`.substring(0, 1024),
          inline: false
        }
      ]);
    }

    const summaryText = [
      `This week's charges: **€${report.poolSummary.weeklyCharges.toFixed(2)}**`,
      `Total pool balance: **€${report.poolSummary.poolBalance.toFixed(2)}**`
    ].join('\n');

    embed.addFields([
      {
        name: 'Financial Summary',
        value: summaryText,
        inline: false
      }
    ]);

    // Add individual contributions if there are charges
    if (report.poolSummary.weeklyCharges > 0) {
      const contributionsText = report.poolSummary.topContributors
        .map(u => `• ${u.name}: €${u.amount.toFixed(2)}`)
        .join('\n');

      if (contributionsText) {
        embed.addFields([
          {
            name: 'This Week\'s Contributors',
            value: contributionsText,
            inline: false
          }
        ]);
      }
    }

    const challengingHabitsText = this.formatChallengingHabits(report.challengingHabits);
    if (challengingHabitsText) {
      embed.addFields([
        {
          name: '⚠️ Challenging Habits',
          value: challengingHabitsText,
          inline: false
        }
      ]);
    }

    const buddyPerformanceText = this.formatBuddyPerformance(report.buddyPerformance.pairs, report.buddyPerformance.unpairedCount);
    if (buddyPerformanceText) {
      embed.addFields([
        {
          name: '👥 Buddy Performance',
          value: buddyPerformanceText,
          inline: false
        }
      ]);
    }

    const riskAlertsText = this.formatRiskAlerts(report.riskAlerts);
    if (riskAlertsText) {
      embed.addFields([
        {
          name: '🚨 Risk Alerts',
          value: riskAlertsText,
          inline: false
        }
      ]);
    }

    const perfectWeekText = this.formatPerfectWeekClub(report.perfectWeekClub, report.summary.totalUsers);
    if (perfectWeekText) {
      embed.addFields([
        {
          name: '✨ Perfect Week Club',
          value: perfectWeekText,
          inline: false
        }
      ]);
    }

    const adaptiveGoalsText = this.formatAdaptiveGoals(report.adaptiveGoals);
    if (adaptiveGoalsText) {
      embed.addFields([
        {
          name: '🔄 Adaptive Goal Cues',
          value: adaptiveGoalsText,
          inline: false
        }
      ]);
    }

    if (report.socialInsights.length > 0) {
      const insightsText = report.socialInsights.map(insight => `• ${insight}`).join('\n');
      embed.addFields([
        {
          name: 'Social Insights',
          value: insightsText.substring(0, 1024),
          inline: false
        }
      ]);
    }

    embed.setFooter({ text: '€0.50 per missed habit iteration' });

    return embed;
  }

  private formatChallengingHabits(challengingHabits: WeeklyAccountabilityReport['challengingHabits']): string {
    if (challengingHabits.length === 0) return '';

    return challengingHabits.map(habit =>
      `• ${habit.habitName}: ${habit.avgCompletionRate.toFixed(0)}% avg (${habit.usersStruggling} users struggling)`
    ).join('\n').substring(0, 1024);
  }

  private formatBuddyPerformance(pairs: BuddyPerformancePair[], unpairedCount: number): string {
    if (pairs.length === 0 && unpairedCount === 0) return '';

    const pairLines = pairs.map(pair => {
      const status = pair.status === 'both_on_track'
        ? 'both on track'
        : pair.status === 'both_struggling'
          ? 'both struggling'
          : 'mixed';
      return `• ${pair.userA} ↔ ${pair.userB}: ${pair.combinedCompletionRate.toFixed(1)}% | ${status}`;
    });

    if (unpairedCount > 0) {
      pairLines.push(`• ${unpairedCount} users without buddy pairs`);
    }

    return pairLines.join('\n').substring(0, 1024);
  }

  private formatRiskAlerts(riskAlerts: WeeklyAccountabilityReport['riskAlerts']): string {
    if (riskAlerts.length === 0) return '';
    return riskAlerts.map(alert => `• ${alert.name}: ${alert.reason}`).join('\n').substring(0, 1024);
  }

  private formatPerfectWeekClub(achievers: WeeklyAccountabilityReport['perfectWeekClub'], totalUsers: number): string {
    if (achievers.length === 0) return '';

    const achieverLines = achievers.map(user =>
      `• ${user.name} (${user.streak}w streak) | ${user.totalHabits} habits`
    );

    const successRate = totalUsers > 0 ? Math.round((achievers.length / totalUsers) * 100) : 0;
    achieverLines.push(`• ${achievers.length}/${totalUsers} users | ${successRate}% success rate`);

    return achieverLines.join('\n').substring(0, 1024);
  }

  private formatAdaptiveGoals(recommendations: AdaptiveGoalRecommendation[]): string {
    if (recommendations.length === 0) return '';

    return recommendations.map(rec => {
      return `• ${rec.name} → ${rec.habitName}: ${rec.targetFrequency}→${rec.recommendedTarget} (current ${rec.currentRate.toFixed(0)}%)`;
    }).join('\n').substring(0, 1024);
  }

  /**
   * Format week label (e.g., "Oct 21 - Oct 27, 2024")
   */
  private formatWeekLabel(startDate: string, endDate: string): string {
    const start = new Date(startDate);
    const end = new Date(endDate);

    const startMonth = start.toLocaleDateString('en-US', { month: 'short' });
    const startDay = start.getDate();
    const endMonth = end.toLocaleDateString('en-US', { month: 'short' });
    const endDay = end.getDate();
    const year = end.getFullYear();

    if (startMonth === endMonth) {
      return `${startMonth} ${startDay} - ${endDay}, ${year}`;
    } else {
      return `${startMonth} ${startDay} - ${endMonth} ${endDay}, ${year}`;
    }
  }

  /**
   * Create a simple text summary (for logging/testing)
   */
  createTextSummary(report: WeeklyAccountabilityReport): string {
    const weekLabel = this.formatWeekLabel(report.weekStart, report.weekEnd);
    const lines: string[] = [
      '📊 WEEKLY ACCOUNTABILITY REPORT',
      `Week: ${weekLabel}`,
      '',
      '🏆 LEADERBOARD',
      '─'.repeat(50)
    ];

    report.leaderboard.forEach(entry => {
      const badge = entry.badge || '';
      const streak = entry.currentStreak > 0 ? ` | 🔥 ${entry.currentStreak}w` : '';
      lines.push(`${badge} #${entry.rank} ${entry.name} - ${entry.overallCompletionRate.toFixed(1)}% (${entry.completedHabits}/${entry.totalHabits}${streak})`);
    });

    lines.push('');
    lines.push('👥 USER COMPLIANCE SUMMARY');
    lines.push('─'.repeat(50));

    report.userCompliance.forEach(user => {
      lines.push(`\n${user.name} (@${user.discordId})`);
      lines.push(`Rate: ${user.completionRate.toFixed(1)}% | Charge: €${user.totalCharge.toFixed(2)} | Streak: ${user.streak}w`);
      lines.push(`Summary: ${user.oneLiner}`);
      user.habits.forEach(habit => {
        lines.push(this.formatHabitSummary(habit));
      });
    });

    lines.push('');
    lines.push('💰 PRICE POOL SUMMARY');
    lines.push('─'.repeat(50));
    lines.push(`This week's charges: €${report.poolSummary.weeklyCharges.toFixed(2)}`);
    lines.push(`Total pool balance: €${report.poolSummary.poolBalance.toFixed(2)}`);
    lines.push(`Pay pool: ${this.PAYPAL_POOL_URL}`);

    const paymentRequests = report.userCompliance
      .filter(user => user.totalCharge > 0)
      .map(user => `${user.name}: €${user.totalCharge.toFixed(2)}`);
    if (paymentRequests.length > 0) {
      lines.push('Pay this week:');
      lines.push(...paymentRequests.map(item => `• ${item}`));
    }

    if (report.challengingHabits.length > 0) {
      lines.push('');
      lines.push('⚠️ CHALLENGING HABITS');
      lines.push('─'.repeat(50));
      report.challengingHabits.forEach(habit => {
        lines.push(`• ${habit.habitName}: ${habit.avgCompletionRate.toFixed(0)}% avg (${habit.usersStruggling} users struggling)`);
      });
    }

    if (report.buddyPerformance.pairs.length > 0 || report.buddyPerformance.unpairedCount > 0) {
      lines.push('');
      lines.push('👥 BUDDY PERFORMANCE');
      lines.push('─'.repeat(50));
      report.buddyPerformance.pairs.forEach(pair => {
        const status = pair.status === 'both_on_track'
          ? 'both on track'
          : pair.status === 'both_struggling'
            ? 'both struggling'
            : 'mixed';
        lines.push(`• ${pair.userA} ↔ ${pair.userB}: ${pair.combinedCompletionRate.toFixed(1)}% | ${status}`);
      });
      if (report.buddyPerformance.unpairedCount > 0) {
        lines.push(`• ${report.buddyPerformance.unpairedCount} users without buddy pairs`);
      }
    }

    if (report.riskAlerts.length > 0) {
      lines.push('');
      lines.push('🚨 RISK ALERTS');
      lines.push('─'.repeat(50));
      report.riskAlerts.forEach(alert => {
        lines.push(`• ${alert.name}: ${alert.reason}`);
      });
    }

    if (report.perfectWeekClub.length > 0) {
      lines.push('');
      lines.push('✨ PERFECT WEEK CLUB');
      lines.push('─'.repeat(50));
      report.perfectWeekClub.forEach(user => {
        lines.push(`• ${user.name} (${user.streak}w streak) | ${user.totalHabits} habits`);
      });
      const successRate = report.summary.totalUsers > 0
        ? Math.round((report.perfectWeekClub.length / report.summary.totalUsers) * 100)
        : 0;
      lines.push(`• ${report.perfectWeekClub.length}/${report.summary.totalUsers} users | ${successRate}% success rate`);
    }

    if (report.adaptiveGoals.length > 0) {
      lines.push('');
      lines.push('🔄 ADAPTIVE GOAL CUES');
      lines.push('─'.repeat(50));
      report.adaptiveGoals.forEach(rec => {
        lines.push(`• ${rec.name} → ${rec.habitName}: ${rec.targetFrequency}→${rec.recommendedTarget} (current ${rec.currentRate.toFixed(0)}%)`);
      });
    }

    if (report.socialInsights.length > 0) {
      lines.push('');
      lines.push('🤝 SOCIAL INSIGHTS');
      lines.push('─'.repeat(50));
      report.socialInsights.forEach(insight => lines.push(`• ${insight}`));
    }

    return lines.join('\n');
  }
}
