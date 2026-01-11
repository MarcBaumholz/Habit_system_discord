/**
 * Structured Output Schemas - Ensures concise, Notion-style outputs
 * Based on chatbot's structured output pattern
 */

import { z } from 'zod';

// ============================================================================
// OUTPUT FORMAT CONSTRAINTS
// ============================================================================

/**
 * All agent outputs MUST follow Notion style:
 * - Bullet points (•, ✅, ⚠️, 🎯)
 * - One-sentence max per bullet
 * - No fluff, only essential data
 * - Headers with emoji
 * - Numbers/percentages for metrics
 */

// ============================================================================
// MENTOR AGENT OUTPUTS
// ============================================================================

export const HabitStatusSchema = z.object({
  habitName: z.string(),
  completed: z.number(),
  target: z.number(),
  percentage: z.number(),
  status: z.enum(['on_track', 'needs_attention', 'critical']),
  oneLiner: z.string().max(100), // ONE sentence analysis
});

export const MentorWeeklyOutputSchema = z.object({
  // Performance (3 bullets max)
  performance: z.object({
    rating: z.enum(['excellent', 'good', 'moderate', 'needs_attention']),
    completionRate: z.number(),
    streak: z.number(),
  }),

  // Habits status (bullet list) - MAX 5 habits
  habits: z.array(HabitStatusSchema).max(5),

  // What worked (2 bullets max, one sentence each)
  successes: z.array(z.string().max(80)).max(2),

  // What didn't work (2 bullets max, one sentence each)
  challenges: z.array(z.string().max(80)).max(2),

  // Top priority action (ONE sentence)
  priorityAction: z.string().max(100),

  // Quick win (ONE sentence)
  quickWin: z.string().max(100),

  // Adaptive goals (only if needed) - MAX 2
  adaptiveGoals: z.array(z.object({
    habitName: z.string(),
    currentRate: z.number(),
    recommendation: z.string().max(80), // ONE sentence
  })).max(2).optional(),
});

export type MentorWeeklyOutput = z.infer<typeof MentorWeeklyOutputSchema>;

// ============================================================================
// ACCOUNTABILITY AGENT OUTPUTS
// ============================================================================

export const AccountabilityOutputSchema = z.object({
  // Current status (numbers only)
  status: z.object({
    day: z.number(), // e.g., 27/90
    totalDays: z.number(),
    activeStreaks: z.number(),
    longestStreak: z.number(),
  }),

  // This week (bullet list) - MAX 5 habits
  weekPerformance: z.array(z.object({
    habitName: z.string(),
    completed: z.number(),
    target: z.number(),
    streak: z.number(),
    emoji: z.enum(['✅', '⚠️', '❌']),
  })).max(5),

  // Motivation message (ONE sentence)
  motivation: z.string().max(100),

  // Next 48h actions (2 max, one sentence each)
  actions: z.array(z.string().max(80)).max(2),

  // Buddy message (ONE sentence, optional)
  buddyMessage: z.string().max(100).optional(),
});

export type AccountabilityOutput = z.infer<typeof AccountabilityOutputSchema>;

// ============================================================================
// GROUP AGENT OUTPUTS
// ============================================================================

export const GroupOutputSchema = z.object({
  // Group stats (numbers only)
  groupStats: z.object({
    activeMembers: z.number(),
    avgCompletionRate: z.number(),
    topPerformer: z.string(),
  }),

  // Rankings (top 2 only)
  rankings: z.array(z.object({
    rank: z.number(),
    name: z.string(),
    completionRate: z.number(),
  })).max(2),

  // Learning opportunities (1 max, one sentence)
  learningOpportunities: z.array(z.object({
    learnFrom: z.string(),
    skill: z.string(),
    oneLiner: z.string().max(80),
  })).max(1),

  // Buddy sync (ONE sentence)
  buddySync: z.string().max(100),

  // Group pattern (ONE sentence, optional)
  groupPattern: z.string().max(100).optional(),
});

export type GroupOutput = z.infer<typeof GroupOutputSchema>;

// ============================================================================
// LEARNING AGENT OUTPUTS
// ============================================================================

export const LearningOutputSchema = z.object({
  // Key insights (2 max, one sentence each)
  insights: z.array(z.object({
    topic: z.string().max(40),
    insight: z.string().max(80),
    frequency: z.number(), // How many times logged
  })).max(2),

  // Hurdle solutions (2 max)
  hurdleSolutions: z.array(z.object({
    hurdle: z.string().max(40),
    solution: z.string().max(80),
    effectiveness: z.enum(['high', 'medium', 'low']),
  })).max(2),

  // Meta-pattern (ONE sentence)
  metaPattern: z.string().max(100),

  // Recommended approach (ONE sentence)
  recommendation: z.string().max(100),
});

export type LearningOutput = z.infer<typeof LearningOutputSchema>;

// ============================================================================
// OUTPUT FORMATTER - Converts schemas to Notion markdown
// ============================================================================

export class NotionOutputFormatter {
  /**
   * Formats Mentor output in Notion style
   */
  static formatMentorOutput(output: MentorWeeklyOutput): string {
    const lines: string[] = [];

    // Header
    lines.push('## 📊 Weekly Analysis\n');

    // Performance
    const perfEmoji = {
      excellent: '🌟',
      good: '✅',
      moderate: '⚠️',
      needs_attention: '🔴',
    }[output.performance.rating];

    lines.push(`**Performance:** ${perfEmoji} ${output.performance.rating.toUpperCase()}`);
    lines.push(`• Completion: ${output.performance.completionRate}%`);
    lines.push(`• Streak: ${output.performance.streak} days\n`);

    // Habits (max 5)
    if (output.habits.length > 0) {
      lines.push('**Habits:**');
      output.habits.slice(0, 5).forEach(h => {
        const emoji = h.status === 'on_track' ? '✅' : h.status === 'needs_attention' ? '⚠️' : '❌';
        lines.push(`${emoji} **${h.habitName}** (${h.completed}/${h.target}) — ${h.oneLiner}`);
      });
      lines.push('');
    }

    // Successes
    if (output.successes.length > 0) {
      lines.push('**What Worked:**');
      output.successes.forEach(s => lines.push(`• ${s}`));
      lines.push('');
    }

    // Challenges
    if (output.challenges.length > 0) {
      lines.push('**What Didn\'t Work:**');
      output.challenges.forEach(c => lines.push(`• ${c}`));
      lines.push('');
    }

    // Actions
    lines.push('**🎯 Priority Action:**');
    lines.push(`• ${output.priorityAction}\n`);

    lines.push('**⚡ Quick Win:**');
    lines.push(`• ${output.quickWin}\n`);

    // Adaptive goals (if needed)
    if (output.adaptiveGoals && output.adaptiveGoals.length > 0) {
      lines.push('**🔄 Adaptive Goals:**');
      output.adaptiveGoals.forEach(ag => {
        lines.push(`• ${ag.habitName} (${ag.currentRate}%) — ${ag.recommendation}`);
      });
    }

    return lines.join('\n');
  }

  /**
   * Formats Accountability output in Notion style
   */
  static formatAccountabilityOutput(output: AccountabilityOutput): string {
    const lines: string[] = [];

    lines.push('## 📊 Accountability Check-In\n');

    // Status
    lines.push(`**Progress:** Day ${output.status.day}/${output.status.totalDays} (${Math.round(output.status.day / output.status.totalDays * 100)}%)`);
    lines.push(`**Active Streaks:** ${output.status.activeStreaks} | **Longest:** ${output.status.longestStreak} days\n`);

    // Week performance (max 5)
    if (output.weekPerformance.length > 0) {
      lines.push('**This Week:**');
      output.weekPerformance.slice(0, 5).forEach(wp => {
        lines.push(`${wp.emoji} **${wp.habitName}:** ${wp.completed}/${wp.target} — Streak: ${wp.streak} days`);
      });
      lines.push('');
    }

    // Motivation
    lines.push(`💪 ${output.motivation}\n`);

    // Actions
    lines.push('**Next 48h:**');
    output.actions.forEach(a => lines.push(`• ${a}`));

    // Buddy message
    if (output.buddyMessage) {
      lines.push(`\n👥 **Buddy:** ${output.buddyMessage}`);
    }

    return lines.join('\n');
  }

  /**
   * Formats Group output in Notion style
   */
  static formatGroupOutput(output: GroupOutput): string {
    const lines: string[] = [];

    lines.push('## 👥 Group Dynamics\n');

    // Stats
    lines.push(`**Active Members:** ${output.groupStats.activeMembers} | **Avg Completion:** ${output.groupStats.avgCompletionRate}%`);
    lines.push(`**Top Performer:** ${output.groupStats.topPerformer}\n`);

    // Rankings (max 2)
    if (output.rankings.length > 0) {
      lines.push('**Rankings:**');
      output.rankings.slice(0, 2).forEach(r => {
        const medal = r.rank === 1 ? '🥇' : '🥈';
        lines.push(`${medal} ${r.name}: ${r.completionRate}%`);
      });
      lines.push('');
    }

    // Learning opportunities
    if (output.learningOpportunities.length > 0) {
      lines.push('**Learn From:**');
      output.learningOpportunities.forEach(lo => {
        lines.push(`• ${lo.learnFrom} (${lo.skill}) — ${lo.oneLiner}`);
      });
      lines.push('');
    }

    // Buddy sync
    lines.push(`👥 **Buddy Sync:** ${output.buddySync}`);

    // Group pattern
    if (output.groupPattern) {
      lines.push(`\n📊 **Pattern:** ${output.groupPattern}`);
    }

    return lines.join('\n');
  }

  /**
   * Formats Learning output in Notion style
   */
  static formatLearningOutput(output: LearningOutput): string {
    const lines: string[] = [];

    lines.push('## 🧠 Learning Insights\n');

    // Insights
    lines.push('**Key Insights:**');
    output.insights.forEach(i => {
      lines.push(`• **${i.topic}** (${i.frequency}x) — ${i.insight}`);
    });
    lines.push('');

    // Hurdle solutions
    if (output.hurdleSolutions.length > 0) {
      lines.push('**Hurdle Solutions:**');
      output.hurdleSolutions.forEach(hs => {
        const emoji = hs.effectiveness === 'high' ? '✅' : hs.effectiveness === 'medium' ? '⚠️' : '❌';
        lines.push(`${emoji} **${hs.hurdle}** — ${hs.solution}`);
      });
      lines.push('');
    }

    // Meta-pattern
    lines.push(`🎯 **Meta-Pattern:** ${output.metaPattern}\n`);

    // Recommendation
    lines.push(`💡 **Recommended:** ${output.recommendation}`);

    return lines.join('\n');
  }
}

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

export class OutputValidator {
  /**
   * Validates and fixes output to ensure Notion style compliance
   */
  static validateAndFix<T>(
    output: any,
    schema: z.ZodType<T>,
    agentName: string
  ): { valid: boolean; data?: T; errors?: string[] } {
    try {
      const validated = schema.parse(output);
      return { valid: true, data: validated };
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors = error.issues.map((e: any) =>
          `${e.path.join('.')}: ${e.message}`
        );
        console.error(`❌ ${agentName} output validation failed:`, errors);
        return { valid: false, errors };
      }
      return { valid: false, errors: ['Unknown validation error'] };
    }
  }

  /**
   * Ensures sentences are concise (max length)
   */
  static truncateSentence(text: string, maxLength: number = 100): string {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + '...';
  }

  /**
   * Removes fluff words and verbose language
   */
  static makeConcise(text: string): string {
    // Remove filler words
    const fluff = [
      'I think that',
      'It seems like',
      'You should consider',
      'It would be beneficial to',
      'You might want to',
      'Perhaps you could',
      'One thing you could do is',
    ];

    let result = text;
    fluff.forEach(phrase => {
      result = result.replace(new RegExp(phrase, 'gi'), '');
    });

    // Trim and clean up
    return result.trim().replace(/\s+/g, ' ');
  }
}
