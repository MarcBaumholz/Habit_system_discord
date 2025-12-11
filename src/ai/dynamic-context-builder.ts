import { NotionClient } from '../notion/client';
import { ProfileStorage } from './profile-storage';
import { QueryClassifier, QueryIntent } from './query-classifier';
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
    userId: string
  ): Promise<DynamicContext> {
    // Classify query
    const classification = this.queryClassifier.classifyQuery(userQuery);
    const intent = classification.intent;

    console.log(`🔍 Query classified as: ${intent} (confidence: ${classification.confidence})`);

    // Get or generate profile
    const profileContent = await this.profileStorage.getOrGenerateProfile(discordId);
    
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
        context = await this.buildProgressCheckContext(profileContent, userId);
        break;

      case 'personality_advice':
        context = await this.buildPersonalityAdviceContext(profileContent);
        break;

      case 'hurdle_help':
        context = await this.buildHurdleHelpContext(profileContent, userId);
        break;

      case 'learning_insight':
        context = await this.buildLearningInsightContext(profileContent, userId);
        break;

      case 'general':
      default:
        context = await this.buildGeneralContext(profileContent);
        break;
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

    return lines.join('\n');
  }

  /**
   * Build context for progress check queries
   */
  private async buildProgressCheckContext(
    profileContent: string,
    userId: string
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

    return lines.join('\n');
  }

  /**
   * Build context for personality advice queries
   */
  private async buildPersonalityAdviceContext(profileContent: string): Promise<string> {
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

    return lines.join('\n');
  }

  /**
   * Build context for hurdle help queries
   */
  private async buildHurdleHelpContext(
    profileContent: string,
    userId: string
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

    return lines.join('\n');
  }

  /**
   * Build context for learning insight queries
   */
  private async buildLearningInsightContext(
    profileContent: string,
    userId: string
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

    return lines.join('\n');
  }

  /**
   * Build context for general queries
   */
  private async buildGeneralContext(profileContent: string): Promise<string> {
    const lines: string[] = [];

    // Extract summary section only
    const summarySection = this.extractSection(profileContent, '## Summary Statistics');
    lines.push(summarySection);

    // Extract personality section (minimal)
    const personalitySection = this.extractSection(profileContent, '## Personality Profile');
    if (personalitySection) {
      // Only first few lines
      const personalityLines = personalitySection.split('\n').slice(0, 5);
      lines.push('\n## Personality');
      lines.push(personalityLines.join('\n'));
    }

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
}

