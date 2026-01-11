import { NotionClient } from '../notion/client';
import { ProfileStorage } from './profile-storage';
import { QueryClassifier, QueryIntent, QueryClassification } from './query-classifier';
import { ContextCompressor } from './context-compressor';
import { Habit, Proof } from '../types';

export interface DynamicContext {
  context: string;
  queryIntent: QueryIntent;
  tokensUsed: number;
}

export class DynamicContextBuilder {
  private notion: NotionClient;
  private profileStorage: ProfileStorage;
  private queryClassifier: QueryClassifier;
  private compressor: ContextCompressor;

  constructor(
    notion: NotionClient,
    profileStorage: ProfileStorage,
    queryClassifier: QueryClassifier,
    compressor: ContextCompressor
  ) {
    this.notion = notion;
    this.profileStorage = profileStorage;
    this.queryClassifier = queryClassifier;
    this.compressor = compressor;
  }

  /**
   * Build context dynamically based on query intent
   */
  async buildContext(
    discordId: string,
    userQuery: string,
    userId: string,
    existingClassification?: QueryClassification
  ): Promise<DynamicContext> {
    // Classify query (allow pre-classification from caller)
    const classification = existingClassification || this.queryClassifier.classifyQuery(userQuery);
    const intent = classification.intent;

    console.log(`🔍 Query classified as: ${intent} (confidence: ${classification.confidence})`);

    // Get or generate profile
    const profileContent = await this.profileStorage.getOrGenerateProfile(discordId);
    
    // Get user profile to access responseStyle
    const userProfile = await this.notion.getUserProfileByDiscordId(discordId);
    
    // Build context based on intent
    let context: string;

    switch (intent) {
      case 'habit_analysis':
        context = await this.buildHabitAnalysisContext(
          profileContent,
          userId,
          classification.mentionedHabits
        );
        break;

      case 'progress_check':
        context = await this.buildProgressCheckContext(profileContent, userId, classification.mentionedHabits);
        break;

      case 'personality_advice':
        context = await this.buildPersonalityAdviceContext(profileContent, userId, classification.mentionedHabits);
        break;

      case 'hurdle_help':
        context = await this.buildHurdleHelpContext(profileContent, userId, classification.mentionedHabits);
        break;

      case 'learning_insight':
        context = await this.buildLearningInsightContext(profileContent, userId, classification.mentionedHabits);
        break;

      case 'general':
      default:
        context = await this.buildGeneralContext(profileContent, userId, classification.mentionedHabits);
        break;
    }

    // Add response style preference to context if available
    if (userProfile?.responseStyle) {
      context = `## Response Style Preference\nUser prefers: ${userProfile.responseStyle}\n\n${context}`;
    }

    // Compress context to fit token budget
    const compressedContext = this.compressor.compressToTokenBudget(context, 2000);
    const tokensUsed = this.compressor.estimateTokens(compressedContext);

    return {
      context: compressedContext,
      queryIntent: intent,
      tokensUsed,
    };
  }

  /**
   * Build context for habit analysis queries
   */
  private async buildHabitAnalysisContext(
    profileContent: string,
    userId: string,
    mentionedHabits?: string[]
  ): Promise<string> {
    const lines: string[] = [];

    // Extract habits section from profile
    const habitsSection = this.extractSection(profileContent, '## Habits Overview');
    lines.push(habitsSection);

    // Extract personality section
    const personalitySection = this.extractSection(profileContent, '## Personality Profile');
    lines.push(personalitySection);

    // Get current week proofs
    const proofs = await this.getCurrentWeekProofs(userId);
    const habits = await this.notion.getHabitsByUserId(userId);

    // Filter proofs for mentioned habits if specified
    let relevantProofs = proofs;
    if (mentionedHabits && mentionedHabits.length > 0) {
      const habitMap = new Map(habits.map(h => [h.name.toLowerCase(), h]));
      const relevantHabitIds = new Set<string>();
      
      mentionedHabits.forEach(mentioned => {
        const habit = Array.from(habitMap.entries()).find(
          ([name]) => name.includes(mentioned.toLowerCase()) || mentioned.toLowerCase().includes(name)
        );
        if (habit) {
          relevantHabitIds.add(habit[1].id);
        }
      });

      if (relevantHabitIds.size > 0) {
        relevantProofs = proofs.filter(p => relevantHabitIds.has(p.habitId));
      }
    }

    // Add current week proofs
    lines.push('\n## Current Week Activity');
    lines.push(this.compressor.compressProofs(relevantProofs, habits));

    // Add summary stats
    const summary = await this.notion.getUserSummary(userId);
    lines.push('\n## Summary');
    lines.push(this.compressor.compressSummary(summary));
    lines.push('\n## Live Summary Keywords (Notion)');
    lines.push(this.buildSummaryKeywordBlock(summary));

    lines.push('\n## Habit Keywords (Notion)');
    lines.push(this.buildHabitKeywordBlock(habits, proofs, mentionedHabits));

    return lines.join('\n');
  }

  /**
   * Build context for progress check queries
   */
  private async buildProgressCheckContext(
    profileContent: string,
    userId: string,
    mentionedHabits?: string[]
  ): Promise<string> {
    const lines: string[] = [];

    // Extract summary section from profile
    const summarySection = this.extractSection(profileContent, '## Summary Statistics');
    lines.push(summarySection);

    // Get current week proofs (summary format)
    const proofs = await this.getCurrentWeekProofs(userId);
    const habits = await this.notion.getHabitsByUserId(userId);
    
    lines.push('\n## This Week\'s Proofs');
    lines.push(this.compressor.compressProofs(proofs, habits));

    // Add current summary
    const summary = await this.notion.getUserSummary(userId);
    lines.push('\n## Current Status');
    lines.push(this.compressor.compressSummary(summary));

    lines.push('\n## Notion Summary Keywords');
    lines.push(this.buildSummaryKeywordBlock(summary));

    lines.push('\n## Habit Keywords (Notion)');
    lines.push(this.buildHabitKeywordBlock(habits, proofs, mentionedHabits));

    return lines.join('\n');
  }

  /**
   * Build context for personality advice queries
   */
  private async buildPersonalityAdviceContext(
    profileContent: string,
    userId: string,
    mentionedHabits?: string[]
  ): Promise<string> {
    const lines: string[] = [];

    // Extract personality section
    const personalitySection = this.extractSection(profileContent, '## Personality Profile');
    lines.push(personalitySection);

    // Extract alignment section
    const alignmentSection = this.extractSection(profileContent, '## Personality-Habit Alignment');
    if (alignmentSection) {
      lines.push(alignmentSection);
    }

    // Extract habits overview (for alignment analysis)
    const habitsSection = this.extractSection(profileContent, '## Habits Overview');
    lines.push(habitsSection);

    const habits = await this.notion.getHabitsByUserId(userId);
    const proofs = await this.getCurrentWeekProofs(userId);

    lines.push('\n## Habit Keywords (Notion)');
    lines.push(this.buildHabitKeywordBlock(habits, proofs, mentionedHabits));

    return lines.join('\n');
  }

  /**
   * Build context for hurdle help queries
   */
  private async buildHurdleHelpContext(
    profileContent: string,
    userId: string,
    mentionedHabits?: string[]
  ): Promise<string> {
    const lines: string[] = [];

    // Extract habits section
    const habitsSection = this.extractSection(profileContent, '## Habits Overview');
    lines.push(habitsSection);

    // Get recent hurdles
    const hurdles = await this.notion.getHurdlesByUserId(userId, 3);
    
    if (hurdles.length > 0) {
      lines.push('\n## Recent Hurdles');
      lines.push(
        this.compressor.compressHurdles(
          hurdles.map(h => ({ name: h.name, description: h.description })),
          3
        )
      );
    }

    const habits = await this.notion.getHabitsByUserId(userId);
    const proofs = await this.getCurrentWeekProofs(userId);
    const summary = await this.notion.getUserSummary(userId);

    lines.push('\n## Live Summary Keywords');
    lines.push(this.buildSummaryKeywordBlock(summary));

    lines.push('\n## Habit Keywords (Notion)');
    lines.push(this.buildHabitKeywordBlock(habits, proofs, mentionedHabits));

    return lines.join('\n');
  }

  /**
   * Build context for learning insight queries
   */
  private async buildLearningInsightContext(
    profileContent: string,
    userId: string,
    mentionedHabits?: string[]
  ): Promise<string> {
    const lines: string[] = [];

    // Extract habits section
    const habitsSection = this.extractSection(profileContent, '## Habits Overview');
    lines.push(habitsSection);

    // Get recent learnings
    const learnings = await this.notion.getLearningsByUserId(userId, 3);
    
    if (learnings.length > 0) {
      lines.push('\n## Recent Learnings');
      lines.push(
        this.compressor.compressLearnings(
          learnings.map(l => ({ text: l.text })),
          3
        )
      );
    }

    const habits = await this.notion.getHabitsByUserId(userId);
    const proofs = await this.getCurrentWeekProofs(userId);
    const summary = await this.notion.getUserSummary(userId);

    lines.push('\n## Live Summary Keywords');
    lines.push(this.buildSummaryKeywordBlock(summary));

    lines.push('\n## Habit Keywords (Notion)');
    lines.push(this.buildHabitKeywordBlock(habits, proofs, mentionedHabits));

    return lines.join('\n');
  }

  /**
   * Build context for general queries
   */
  private async buildGeneralContext(
    profileContent: string,
    userId: string,
    mentionedHabits?: string[]
  ): Promise<string> {
    const lines: string[] = [];

    // Extract summary section only
    const summarySection = this.extractSection(profileContent, '## Summary Statistics');
    if (summarySection) {
      lines.push(summarySection);
    }

    // Extract personality section (minimal)
    const personalitySection = this.extractSection(profileContent, '## Personality Profile');
    if (personalitySection) {
      // Only first few lines
      const personalityLines = personalitySection.split('\n').slice(0, 5);
      lines.push('\n## Personality');
      lines.push(personalityLines.join('\n'));
    }

    const summary = await this.notion.getUserSummary(userId);
    lines.push('\n## Live Summary Keywords (Notion)');
    lines.push(this.buildSummaryKeywordBlock(summary));

    const habits = await this.notion.getHabitsByUserId(userId);
    const proofs = await this.getCurrentWeekProofs(userId);
    lines.push('\n## Habit Keywords (Notion)');
    lines.push(this.buildHabitKeywordBlock(habits, proofs, mentionedHabits));

    return lines.join('\n');
  }

  /**
   * Extract a section from profile Markdown
   */
  private extractSection(profileContent: string, sectionHeader: string): string {
    const lines = profileContent.split('\n');
    const startIndex = lines.findIndex(line => line.trim() === sectionHeader);
    
    if (startIndex === -1) {
      return '';
    }

    const sectionLines: string[] = [sectionHeader];
    
    // Find next section or end of file
    for (let i = startIndex + 1; i < lines.length; i++) {
      const line = lines[i];
      
      // Stop at next section header
      if (line.startsWith('##') && line !== sectionHeader) {
        break;
      }
      
      sectionLines.push(line);
    }

    return sectionLines.join('\n');
  }

  /**
   * Get current week proofs (Monday-Sunday)
   */
  private async getCurrentWeekProofs(userId: string): Promise<Proof[]> {
    try {
      const now = new Date();
      const dayOfWeek = now.getDay();
      const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      
      const monday = new Date(now);
      monday.setDate(now.getDate() - daysToMonday);
      monday.setHours(0, 0, 0, 0);
      
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      sunday.setHours(23, 59, 59, 999);
      
      const startDate = monday.toISOString().split('T')[0];
      const endDate = sunday.toISOString().split('T')[0];
      
      return await this.notion.getProofsByUserId(userId, startDate, endDate);
    } catch (error) {
      console.error('Error getting current week proofs:', error);
      return [];
    }
  }

  private buildSummaryKeywordBlock(summary: {
    completionRate: number;
    currentStreak: number;
    bestStreak: number;
    totalHabits: number;
    weekProofs: number;
    weekDays: number;
    weekStartDate?: string;
    weekEndDate?: string;
  }): string {
    if (!summary) {
      return 'Keine Live-Zusammenfassung verfügbar.';
    }

    const lines: string[] = [];
    lines.push(`- **Completion Rate:** ${summary.completionRate.toFixed(1)}%`);
    lines.push(`- **Current Streak:** ${summary.currentStreak} Tage`);
    lines.push(`- **Best Streak:** ${summary.bestStreak} Tage`);
    lines.push(`- **Week Proofs:** ${summary.weekProofs}/${summary.weekDays}`);
    lines.push(`- **Total Habits:** ${summary.totalHabits}`);

    if (summary.weekStartDate && summary.weekEndDate) {
      lines.push(`- **Week Range:** ${summary.weekStartDate} → ${summary.weekEndDate}`);
    }

    return lines.join('\n');
  }

  private buildHabitKeywordBlock(
    habits: Habit[],
    proofs: Proof[],
    mentionedHabits?: string[]
  ): string {
    if (!habits || habits.length === 0) {
      return 'Keine Habits in Notion gefunden.';
    }

    const selectedHabits = this.selectRelevantHabits(habits, mentionedHabits);

    if (selectedHabits.length === 0) {
      return 'Keine passenden Habits zur Anfrage gefunden.';
    }

    return selectedHabits.map(habit => {
      const matchingProofs = proofs.filter(proof => proof.habitId === habit.id);
      const lastProof = matchingProofs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
      const lastProofDisplay = lastProof ? this.formatDate(lastProof.date) : 'Kein Nachweis diese Woche';

      const parts: string[] = [
        `**Habit:** ${habit.name}`,
        `**Frequency:** ${habit.frequency}/Woche`,
        `**Last Proof:** ${lastProofDisplay}`,
        `**Week Proofs:** ${matchingProofs.length}`
      ];

      if (habit.minimalDose) {
        parts.push(`**Minimal Dose:** ${habit.minimalDose}`);
      }

      if (habit.why) {
        parts.push(`**Why:** ${this.compressor.truncateText(habit.why, 120)}`);
      }

      if (habit.domains && habit.domains.length > 0) {
        parts.push(`**Domains:** ${habit.domains.slice(0, 3).join(', ')}`);
      }

      return `- ${parts.join(' | ')}`;
    }).join('\n');
  }

  private selectRelevantHabits(habits: Habit[], mentionedHabits?: string[]): Habit[] {
    if (!mentionedHabits || mentionedHabits.length === 0) {
      return habits.slice(0, Math.min(5, habits.length));
    }

    const normalizedMentions = mentionedHabits.map(m => m.toLowerCase().trim()).filter(Boolean);
    const matches = habits.filter(habit => {
      const habitName = habit.name?.toLowerCase() || '';
      return normalizedMentions.some(mention => habitName.includes(mention) || mention.includes(habitName));
    });

    if (matches.length === 0) {
      return habits.slice(0, Math.min(5, habits.length));
    }

    return matches;
  }

  private formatDate(raw?: string): string {
    if (!raw) {
      return 'Keine Daten';
    }

    const parsed = new Date(raw);
    if (Number.isNaN(parsed.getTime())) {
      return raw;
    }

    return parsed.toLocaleDateString('de-DE', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  }
}
