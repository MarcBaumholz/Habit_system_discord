import { NotionClient } from '../notion/client';
import { Habit, UserProfile, User } from '../types';
import * as crypto from 'crypto';

export interface ProfileData {
  user: User;
  personality: UserProfile | null;
  habits: Habit[];
  summary: {
    totalHabits: number;
    completionRate: number;
    currentStreak: number;
    bestStreak: number;
    weekProofs: number;
    weekDays: number;
  };
}

export class ProfileGenerator {
  private notion: NotionClient;

  constructor(notion: NotionClient) {
    this.notion = notion;
  }

  /**
   * Generate a comprehensive user profile Markdown file
   */
  async generateProfile(discordId: string): Promise<string> {
    try {
      console.log(`📝 Generating profile for Discord ID: ${discordId}`);

      // Get user data
      const user = await this.notion.getUserByDiscordId(discordId);
      if (!user) {
        throw new Error(`User not found for Discord ID: ${discordId}`);
      }

      // Get personality profile
      const personality = await this.notion.getUserProfileByDiscordId(discordId);

      // Get all habits
      const habits = await this.notion.getHabitsByUserId(user.id);

      // Get user summary
      const summaryData = await this.notion.getUserSummary(user.id);

      const profileData: ProfileData = {
        user,
        personality,
        habits,
        summary: {
          totalHabits: summaryData.totalHabits,
          completionRate: summaryData.completionRate,
          currentStreak: summaryData.currentStreak,
          bestStreak: summaryData.bestStreak,
          weekProofs: summaryData.weekProofs,
          weekDays: summaryData.weekDays,
        },
      };

      return this.buildMarkdown(profileData);
    } catch (error) {
      console.error('❌ Error generating profile:', error);
      throw error;
    }
  }

  /**
   * Build Markdown content from profile data
   */
  private buildMarkdown(data: ProfileData): string {
    const timestamp = new Date().toISOString();
    const lines: string[] = [];

    // Header
    lines.push(`# User Profile: ${data.user.name}`);
    lines.push('');
    lines.push(`**Discord ID:** ${data.user.discordId}`);
    lines.push(`**Generated:** ${timestamp}`);
    lines.push('');
    
    // Log what data we have for debugging
    console.log(`📊 Profile data for ${data.user.name}:`, {
      hasPersonality: !!data.personality,
      habitsCount: data.habits.length,
      hasSummary: !!data.summary,
      personalityFields: data.personality ? {
        type: !!data.personality.personalityType,
        coreValues: data.personality.coreValues?.length || 0,
        lifeVision: !!data.personality.lifeVision,
        desiredIdentity: !!data.personality.desiredIdentity,
        bigFive: !!data.personality.bigFiveTraits,
        mainGoals: data.personality.mainGoals?.length || 0,
      } : null
    });

    // Personality Profile Section
    lines.push('## Personality Profile');
    if (data.personality) {
      if (data.personality.personalityType) {
        lines.push(`- **Type:** ${data.personality.personalityType}`);
      }
      if (data.personality.coreValues && data.personality.coreValues.length > 0) {
        lines.push(`- **Core Values:** ${data.personality.coreValues.join(', ')}`);
      }
      if (data.personality.lifeVision) {
        lines.push(`- **Life Vision:** ${data.personality.lifeVision}`);
      }
      if (data.personality.desiredIdentity) {
        lines.push(`- **Desired Identity:** ${data.personality.desiredIdentity}`);
      }
      if (data.personality.bigFiveTraits) {
        lines.push(`- **Big Five Traits:** ${data.personality.bigFiveTraits}`);
      }
      if (data.personality.lifeDomains && data.personality.lifeDomains.length > 0) {
        lines.push(`- **Life Domains:** ${data.personality.lifeDomains.join(', ')}`);
      }
      if (data.personality.lifePhase) {
        lines.push(`- **Life Phase:** ${data.personality.lifePhase}`);
      }
      if (data.personality.mainGoals && data.personality.mainGoals.length > 0) {
        lines.push('- **Main Goals:**');
        data.personality.mainGoals.forEach(goal => {
          lines.push(`  - ${goal}`);
        });
      }
    } else {
      lines.push('- *No personality profile available*');
    }
    lines.push('');

    // Habits Overview Section
    lines.push('## Habits Overview');
    if (data.habits.length === 0) {
      lines.push('*No habits defined yet*');
    } else {
      data.habits.forEach((habit, index) => {
        lines.push(`### ${index + 1}. ${habit.name}`);
        lines.push(`- **Frequency:** ${habit.frequency} times/week`);
        if (habit.why) {
          lines.push(`- **Why:** ${habit.why}`);
        }
        if (habit.smartGoal) {
          lines.push(`- **Goal:** ${habit.smartGoal}`);
        }
        if (habit.minimalDose) {
          lines.push(`- **Minimal Dose:** ${habit.minimalDose}`);
        }
        if (habit.domains && habit.domains.length > 0) {
          lines.push(`- **Domains:** ${habit.domains.join(', ')}`);
        }
        if (habit.context) {
          lines.push(`- **Context:** ${habit.context}`);
        }
        if (habit.difficulty) {
          lines.push(`- **Difficulty:** ${habit.difficulty}`);
        }
        
        // Calculate personality fit (simple heuristic based on personality type and habit domains)
        const personalityFit = this.calculatePersonalityFit(habit, data.personality);
        if (personalityFit) {
          lines.push(`- **Personality Fit:** ${personalityFit}`);
        }
        
        lines.push('');
      });
    }
    lines.push('');

    // Summary Statistics Section
    lines.push('## Summary Statistics');
    lines.push(`- **Total Habits:** ${data.summary.totalHabits}`);
    lines.push(`- **Completion Rate:** ${data.summary.completionRate.toFixed(1)}%`);
    lines.push(`- **Current Streak:** ${data.summary.currentStreak} days`);
    lines.push(`- **Best Streak:** ${data.summary.bestStreak} days`);
    lines.push(`- **This Week:** ${data.summary.weekProofs}/${data.summary.weekDays} days`);
    lines.push('');

    // Personality-Habit Alignment Section
    if (data.personality && data.habits.length > 0) {
      lines.push('## Personality-Habit Alignment');
      const alignment = this.generateAlignmentAnalysis(data.habits, data.personality);
      lines.push(alignment);
      lines.push('');
    }

    // Why Section - Explain habit choices
    if (data.habits.length > 0) {
      lines.push('## Why These Habits?');
      data.habits.forEach(habit => {
        if (habit.why) {
          lines.push(`- **${habit.name}:** ${habit.why}`);
        }
      });
      lines.push('');
    }

    // Footer
    lines.push('---');
    lines.push(`*Profile generated: ${timestamp}*`);
    lines.push(`*Last updated: ${timestamp}*`);

    return lines.join('\n');
  }

  /**
   * Calculate personality fit for a habit (simple heuristic)
   */
  private calculatePersonalityFit(habit: Habit, personality: UserProfile | null): string | null {
    if (!personality || !personality.personalityType) {
      return null;
    }

    // Simple alignment based on personality type characteristics
    const type = personality.personalityType.toUpperCase();
    
    // INTJ/INTP: Analytical, structured habits
    if (type.startsWith('INT')) {
      if (habit.smartGoal && habit.smartGoal.length > 20) {
        return 'High - Analytical approach aligns with INT personality';
      }
    }
    
    // ENFP/ENFJ: Social, relationship-focused habits
    if (type.startsWith('ENF')) {
      if (habit.domains.some(d => d.toLowerCase().includes('social') || d.toLowerCase().includes('relationship'))) {
        return 'High - Social focus aligns with ENF personality';
      }
    }
    
    // ESTJ/ESFJ: Routine, consistency-focused
    if (type.startsWith('EST') || type.startsWith('ESF')) {
      if (habit.frequency >= 5) {
        return 'High - High frequency aligns with EST/ESF preference for routine';
      }
    }

    // Default: Medium fit
    return 'Medium - General alignment';
  }

  /**
   * Generate alignment analysis between habits and personality
   */
  private generateAlignmentAnalysis(habits: Habit[], personality: UserProfile): string {
    if (!personality.personalityType) {
      return 'Personality type not specified, unable to analyze alignment.';
    }

    const type = personality.personalityType.toUpperCase();
    const analysis: string[] = [];

    analysis.push(`Based on ${personality.personalityType} personality type:`);

    // Analyze habit frequency patterns
    const avgFrequency = habits.reduce((sum, h) => sum + h.frequency, 0) / habits.length;
    if (avgFrequency >= 5) {
      analysis.push('- High-frequency habits suggest a preference for routine and consistency.');
    } else if (avgFrequency <= 3) {
      analysis.push('- Lower-frequency habits suggest flexibility and adaptability.');
    }

    // Analyze habit domains
    const allDomains = habits.flatMap(h => h.domains);
    const domainCounts = new Map<string, number>();
    allDomains.forEach(domain => {
      domainCounts.set(domain, (domainCounts.get(domain) || 0) + 1);
    });

    if (personality.coreValues && personality.coreValues.length > 0) {
      analysis.push(`- Core values (${personality.coreValues.join(', ')}) should align with habit domains.`);
    }

    if (personality.desiredIdentity) {
      analysis.push(`- Desired identity: "${personality.desiredIdentity}"`);
      analysis.push('- Habits should support this identity transformation.');
    }

    return analysis.join('\n');
  }

  /**
   * Calculate hash of profile data for change detection
   */
  calculateProfileHash(profileContent: string): string {
    return crypto.createHash('sha256').update(profileContent).digest('hex');
  }
}

