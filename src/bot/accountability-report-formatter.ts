/**
 * Accountability Report Formatter
 *
 * Formats weekly accountability reports for Discord with rich embeds
 * Includes leaderboard, per-user compliance, social insights, and pool summary
 */

import { EmbedBuilder, Colors, ColorResolvable } from 'discord.js';
import { WeeklyAccountabilityReport, UserCompliance, LeaderboardEntry, HabitCompliance } from '../types';

export class AccountabilityReportFormatter {

  /**
   * Create comprehensive Discord embeds for weekly accountability report
   */
  createReportEmbeds(report: WeeklyAccountabilityReport): EmbedBuilder[] {
    const embeds: EmbedBuilder[] = [];

    // 1. Header Embed with week info and summary stats
    embeds.push(this.createHeaderEmbed(report));

    // 2. Leaderboard Embed
    embeds.push(this.createLeaderboardEmbed(report));

    // 3. Per-user compliance embeds (one per user)
    report.userCompliance.forEach(user => {
      embeds.push(this.createUserComplianceEmbed(user, report.weekStart, report.weekEnd));
    });

    // 4. Social Insights Embed
    if (report.socialInsights) {
      embeds.push(this.createSocialInsightsEmbed(report.socialInsights));
    }

    // 5. Pool Summary Embed
    embeds.push(this.createPoolSummaryEmbed(report));

    return embeds;
  }

  /**
   * Create header embed with week info and summary stats
   */
  private createHeaderEmbed(report: WeeklyAccountabilityReport): EmbedBuilder {
    const weekLabel = this.formatWeekLabel(report.weekStart, report.weekEnd);
    const totalUsers = report.userCompliance.length;
    const perfectWeeks = report.userCompliance.filter(u => u.perfectWeek).length;
    const usersWithCharges = report.userCompliance.filter(u => u.totalCharge > 0).length;

    // Color based on overall performance
    let color: ColorResolvable = Colors.Green;
    if (report.totalWeeklyCharges > 5) color = 0xFF6B6B as ColorResolvable; // Red-orange
    else if (report.totalWeeklyCharges > 2) color = 0xFFD93D as ColorResolvable; // Gold/Yellow

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
            `💸 Users with charges: **${usersWithCharges}**`
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
   * Create user compliance embed
   */
  private createUserComplianceEmbed(user: UserCompliance, weekStart: string, weekEnd: string): EmbedBuilder {
    const color = user.perfectWeek ? Colors.Green :
                  user.overallCompletionRate >= 80 ? Colors.Gold :
                  user.overallCompletionRate >= 60 ? Colors.Orange : Colors.Red;

    const embed = new EmbedBuilder()
      .setTitle(`👤 ${user.name}`)
      .setDescription(`@${user.discordId}`)
      .setColor(color);

    // Add habit breakdown
    const habitsText = user.habits.map(habit =>
      this.formatHabitSummary(habit)
    ).join('\n');

    embed.addFields([
      {
        name: 'Habit Breakdown',
        value: habitsText || 'No habits tracked this week',
        inline: false
      }
    ]);

    // Add subtotal
    const subtotalText = user.totalCharge > 0
      ? `**Subtotal: €${user.totalCharge.toFixed(2)}**`
      : `**Subtotal: €0.00** 🎉 Perfect week!`;

    embed.addFields([
      {
        name: 'This Week',
        value: subtotalText,
        inline: true
      },
      {
        name: 'Overall Rate',
        value: `${user.overallCompletionRate.toFixed(1)}%`,
        inline: true
      },
      {
        name: 'Streak',
        value: user.currentStreak > 0 ? `🔥 ${user.currentStreak} weeks` : 'Start now!',
        inline: true
      }
    ]);

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
  private createSocialInsightsEmbed(insights: string): EmbedBuilder {
    const embed = new EmbedBuilder()
      .setTitle('🤝 SOCIAL INSIGHTS')
      .setDescription(insights)
      .setColor(Colors.Blue);

    return embed;
  }

  /**
   * Create pool summary embed
   */
  private createPoolSummaryEmbed(report: WeeklyAccountabilityReport): EmbedBuilder {
    const embed = new EmbedBuilder()
      .setTitle('💰 PRICE POOL SUMMARY')
      .setColor(Colors.DarkGold);

    const summaryText = [
      `This week's charges: **€${report.totalWeeklyCharges.toFixed(2)}**`,
      `Total pool balance: **€${report.totalPoolBalance.toFixed(2)}**`
    ].join('\n');

    embed.addFields([
      {
        name: 'Financial Summary',
        value: summaryText,
        inline: false
      }
    ]);

    // Add individual contributions if there are charges
    if (report.totalWeeklyCharges > 0) {
      const contributionsText = report.userCompliance
        .filter(u => u.totalCharge > 0)
        .map(u => `• ${u.name}: €${u.totalCharge.toFixed(2)}`)
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

    embed.setFooter({ text: '€0.50 per missed habit iteration' });

    return embed;
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
    lines.push('👥 USER COMPLIANCE');
    lines.push('─'.repeat(50));

    report.userCompliance.forEach(user => {
      lines.push(`\n${user.name} (@${user.discordId})`);
      user.habits.forEach(habit => {
        lines.push(this.formatHabitSummary(habit));
      });
      lines.push(`Subtotal: €${user.totalCharge.toFixed(2)}`);
    });

    lines.push('');
    lines.push('💰 PRICE POOL SUMMARY');
    lines.push('─'.repeat(50));
    lines.push(`This week's charges: €${report.totalWeeklyCharges.toFixed(2)}`);
    lines.push(`Total pool balance: €${report.totalPoolBalance.toFixed(2)}`);

    if (report.socialInsights) {
      lines.push('');
      lines.push('🤝 SOCIAL INSIGHTS');
      lines.push('─'.repeat(50));
      lines.push(report.socialInsights);
    }

    return lines.join('\n');
  }
}
