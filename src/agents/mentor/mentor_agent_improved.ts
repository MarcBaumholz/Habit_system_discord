/**
 * Improved Mentor Agent - Uses new architecture
 * - Validated Notion data retrieval with caching
 * - Concise, Notion-style prompts
 * - Structured outputs with Zod validation
 * - Explicit state management
 */

import { BaseAgent } from '../base/agent';
import {
  UserContext,
  AgentResponse,
  MentorResponse,
} from '../base/types';
import { PerplexityClient } from '../../ai/perplexity-client';
import { NotionClient } from '../../notion/client';

// Import improved modules
import { ImprovedNotionRetrieval } from '../improved/notion-retrieval';
import { ConcisePrompts } from '../improved/concise-prompts';
import {
  MentorWeeklyOutputSchema,
  NotionOutputFormatter,
  MentorWeeklyOutput
} from '../improved/output-schemas';
import {
  AgentStateFactory,
  StateTransitions,
  MentorAgentState
} from '../improved/agent-state';

export class ImprovedMentorAgent extends BaseAgent {
  private perplexityClient: PerplexityClient;
  private notionClient: NotionClient;
  private retrieval: ImprovedNotionRetrieval;
  private readonly MARC_CHANNEL_ID = '1422681618304471131'; // Marc's channel

  constructor(perplexityClient: PerplexityClient, notionClient: NotionClient) {
    super('mentor-improved', 'Improved Mentor Agent', [
      'habit_analysis',
      'pattern_recognition',
      'coaching_advice',
      'progress_assessment',
      'feedback_generation'
    ]);

    this.perplexityClient = perplexityClient;
    this.notionClient = notionClient;
    this.retrieval = new ImprovedNotionRetrieval(notionClient);
  }

  async initialize(): Promise<void> {
    this.log('info', 'Initializing Improved Mentor Agent');

    if (!PerplexityClient.isAvailable()) {
      throw new Error('Perplexity API key not available');
    }

    this.log('info', 'Improved Mentor Agent initialized successfully');
  }

  async cleanup(): Promise<void> {
    this.log('info', 'Cleaning up Improved Mentor Agent');
  }

  async processRequest(
    userContext: UserContext,
    request: string,
    metadata?: Record<string, any>
  ): Promise<AgentResponse> {
    const startTime = Date.now();

    try {
      this.validateUserContext(userContext);

      this.log('info', `Processing improved mentor request for user ${userContext.user.name}`, {
        request: request.substring(0, 100),
        user_id: userContext.user.id
      });

      // Determine request type
      const requestType = this.classifyRequest(request);
      let response: MentorResponse;

      switch (requestType) {
        case 'weekly_analysis':
          response = await this.performWeeklyAnalysis(userContext, metadata);
          break;
        default:
          response = await this.performWeeklyAnalysis(userContext, metadata);
      }

      const responseTime = Date.now() - startTime;
      this.updateMetrics(responseTime, true);

      this.log('info', 'Improved mentor request processed successfully', {
        response_time: responseTime,
        confidence: response.confidence,
        tokens_saved: this.estimateTokenSavings(response.message)
      });

      return response;

    } catch (error) {
      const responseTime = Date.now() - startTime;
      this.updateMetrics(responseTime, false);
      const errorMessage = error instanceof Error ? error.message : String(error);

      this.log('error', 'Failed to process improved mentor request', {
        error: errorMessage,
        user_id: userContext.user.id,
        request: request.substring(0, 100)
      });

      return this.handleError(error as Error, {
        user_id: userContext.user.id,
        request_type: 'mentor_analysis'
      });
    }
  }

  // ============================================================================
  // WEEKLY ANALYSIS - Improved Version
  // ============================================================================

  private async performWeeklyAnalysis(
    userContext: UserContext,
    metadata?: Record<string, any>
  ): Promise<MentorResponse> {
    this.log('info', 'Performing improved weekly analysis', { user_id: userContext.user.id });

    // Create explicit state
    const state = AgentStateFactory.createMentorState('weekly_analysis');

    try {
      // 1. Get comprehensive data with validation and caching (includes profile)
      const context = await this.retrieval.getComprehensiveUserContext(
        userContext.user.discord_id,
        7 // days back
      );

      if (!context.user) {
        throw new Error('User not found');
      }

      // 2. Update state
      StateTransitions.updateUserContext(
        state,
        context.user,
        context.habits,
        context.proofs,
        context.learnings,
        context.hurdles
      );

      // 3. Get habit analysis (efficient, validated)
      state.habitAnalysis = await this.retrieval.getHabitAnalysis(context.user.id, 7);

      // 4. Calculate overall metrics
      const completionRate = this.calculateOverallCompletionRate(state.habitAnalysis);
      const maxStreak = Math.max(0, ...state.habitAnalysis.map(h => h.streak));

      // 5. Get buddy progress if available
      state.buddyProgress = await this.retrieval.getBuddyProgress(context.user.id);

      // 6. Generate concise prompt with profile
      const prompt = ConcisePrompts.generateMentorWeeklyPrompt({
        habits: state.habitAnalysis.map(h => ({
          name: h.habitName,
          completed: h.actualProofs,
          target: h.targetFrequency,
        })),
        completionRate,
        streak: maxStreak,
        learnings: context.learnings.map(l => l.text || 'No description').slice(0, 2),
        hurdles: context.hurdles.map(h => h.description || 'No description').slice(0, 2),
        profile: context.profile ? {
          personalityType: context.profile.personalityType,
          coreValues: context.profile.coreValues,
          responseStyle: context.profile.responseStyle,
          lifeVision: context.profile.lifeVision,
        } : undefined,
      });

      this.log('info', 'Generated concise prompt', {
        prompt_length: prompt.length,
        estimated_tokens: Math.ceil(prompt.length / 4)
      });

      // 7. Generate structured response with retries
      const validated = await this.generateWithRetry(prompt, 3);

      // 8. Format for Discord (Notion style)
      const formattedResponse = NotionOutputFormatter.formatMentorOutput(validated);

      // 9. Add buddy section if available
      let fullMessage = formattedResponse;
      if (state.buddyProgress) {
        fullMessage += this.formatBuddySection(state.buddyProgress);
      }

      // 10. Mark complete
      StateTransitions.markComplete(state);

      // 11. Log summary
      this.log('info', '✅ Improved mentor analysis complete', StateTransitions.getSummary(state));

      return {
        success: true,
        message: fullMessage,
        confidence: this.calculateConfidence(0.9, 0.8, 0.7),
        habit_analysis: state.habitAnalysis.map(h => ({
          habit_id: h.habitId,
          success_rate: h.completionRate / 100,
          current_streak: h.streak,
          best_streak: h.streak,
          optimal_conditions: {
            best_time: 'Not analyzed',
            best_duration: 0,
            best_environment: [],
            best_context: '',
            energy_level: '',
            mood: ''
          },
          failure_patterns: [],
          success_patterns: [],
          target_frequency: h.targetFrequency,
          actual_proofs: h.actualProofs,
          completion_rate: h.completionRate,
          missed_count: Math.max(0, h.targetFrequency - h.actualProofs)
        })),
        pattern_insights: [],
        coaching_advice: [],
        progress_assessment: {
          overall_progress: completionRate / 100,
          weekly_trend: 'stable' as const,
          key_achievements: [],
          areas_for_improvement: [],
          next_milestones: []
        },
        recommendations: [],
        insights: [],
        next_steps: validated.priorityAction ? [validated.priorityAction] : [],
        metadata: {
          analysis_type: 'weekly',
          habits_analyzed: context.habits.length,
          proofs_analyzed: context.proofs.length,
          data_retrieval_method: 'improved_with_caching',
          prompt_type: 'concise',
          output_format: 'structured_with_validation',
          state_summary: StateTransitions.getSummary(state)
        },
        timestamp: new Date()
      };

    } catch (error) {
      StateTransitions.addError(state, error instanceof Error ? error.message : String(error));
      this.log('error', '❌ Improved mentor analysis failed', StateTransitions.getSummary(state));
      throw error;
    }
  }

  // ============================================================================
  // AI GENERATION WITH RETRY
  // ============================================================================

  private async generateWithRetry(
    prompt: string,
    maxRetries: number = 3
  ): Promise<MentorWeeklyOutput> {
    let lastError: Error | null = null;
    let currentPrompt = prompt;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        this.log('info', `AI generation attempt ${attempt}/${maxRetries}`);

        const aiResponse = await this.perplexityClient.generateResponse(currentPrompt);

        // Extract JSON from response
        const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          throw new Error('No JSON found in AI response');
        }

        const parsed = JSON.parse(jsonMatch[0]);

        // Validate with Zod schema
        const validated = MentorWeeklyOutputSchema.parse(parsed);

        this.log('info', `✅ Validation successful on attempt ${attempt}`);
        return validated;

      } catch (error) {
        lastError = error as Error;
        this.log('warn', `Attempt ${attempt}/${maxRetries} failed:`, {
          error: lastError.message
        });

        if (attempt < maxRetries) {
          // Add clarification to prompt for retry
          currentPrompt += `\n\nIMPORTANT: Response MUST be valid JSON matching the exact schema. Previous attempt had error: ${lastError.message}`;
        }
      }
    }

    // All retries failed, return fallback
    this.log('error', 'All AI generation attempts failed, returning fallback');
    return this.createFallbackOutput();
  }

  private createFallbackOutput(): MentorWeeklyOutput {
    return {
      performance: {
        rating: 'moderate',
        completionRate: 0,
        streak: 0,
      },
      habits: [],
      successes: ['Keep tracking your habits'],
      challenges: ['AI analysis temporarily unavailable'],
      priorityAction: 'Continue logging proofs daily',
      quickWin: 'Complete one habit today',
      adaptiveGoals: []
    };
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  private classifyRequest(request: string): string {
    const lowerRequest = request.toLowerCase();

    if (lowerRequest.includes('weekly') || lowerRequest.includes('week') || lowerRequest.includes('summary')) {
      return 'weekly_analysis';
    }

    return 'weekly_analysis'; // Default to weekly for improved version
  }

  private calculateOverallCompletionRate(habitAnalysis: any[]): number {
    if (habitAnalysis.length === 0) return 0;
    const avg = habitAnalysis.reduce((sum, a) => sum + a.completionRate, 0) / habitAnalysis.length;
    return Math.round(avg);
  }

  private formatBuddySection(buddyProgress: any): string {
    return `\n\n## 👥 Buddy Update\n\n**${buddyProgress.nickname}:**\n• Completion: ${Math.round(buddyProgress.completionRate)}%\n• Streak: ${buddyProgress.currentStreak} days\n• Active habits: ${buddyProgress.habits.length}\n`;
  }

  private estimateTokenSavings(message: string): number {
    // Estimate tokens (1 token ≈ 4 chars)
    const estimatedTokens = message.length / 4;
    const oldAverageTokens = 800; // Old verbose responses
    return Math.round(oldAverageTokens - estimatedTokens);
  }
}
