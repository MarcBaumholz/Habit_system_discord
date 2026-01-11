/**
 * Improved Accountability Agent
 * - Validated Notion data retrieval with caching
 * - Concise, Notion-style prompts
 * - Structured outputs with Zod validation
 */

import { BaseAgent } from '../base/agent';
import { UserContext, AgentResponse } from '../base/types';
import { PerplexityClient } from '../../ai/perplexity-client';
import { NotionClient } from '../../notion/client';

// Import improved modules
import { ImprovedNotionRetrieval } from '../improved/notion-retrieval';
import { ConcisePrompts } from '../improved/concise-prompts';
import {
  AccountabilityOutputSchema,
  NotionOutputFormatter,
  AccountabilityOutput
} from '../improved/output-schemas';
import {
  AgentStateFactory,
  StateTransitions,
  AccountabilityAgentState
} from '../improved/agent-state';

export class ImprovedAccountabilityAgent extends BaseAgent {
  private perplexityClient: PerplexityClient;
  private notionClient: NotionClient;
  private retrieval: ImprovedNotionRetrieval;
  private readonly MARC_CHANNEL_ID = '1422681618304471131';

  constructor(perplexityClient: PerplexityClient, notionClient: NotionClient) {
    super('accountability-improved', 'Improved Accountability Agent', [
      'adaptive_reminders',
      'motivation_management',
      'progress_monitoring',
      'intervention_triggers',
      'celebration_detection'
    ]);

    this.perplexityClient = perplexityClient;
    this.notionClient = notionClient;
    this.retrieval = new ImprovedNotionRetrieval(notionClient);
  }

  async initialize(): Promise<void> {
    this.log('info', 'Initializing Improved Accountability Agent');
    if (!PerplexityClient.isAvailable()) {
      throw new Error('Perplexity API key not available');
    }
    this.log('info', 'Improved Accountability Agent initialized successfully');
  }

  async cleanup(): Promise<void> {
    this.log('info', 'Cleaning up Improved Accountability Agent');
  }

  async processRequest(
    userContext: UserContext,
    message: string,
    metadata?: Record<string, any>
  ): Promise<AgentResponse> {
    const startTime = Date.now();

    try {
      this.log('info', `Processing improved accountability request for user ${userContext.user.name}`, {
        user_id: userContext.user.id
      });

      const response = await this.performAccountabilityCheck(userContext, metadata);

      const responseTime = Date.now() - startTime;
      this.updateMetrics(responseTime, true);

      this.log('info', 'Improved accountability request processed successfully', {
        response_time: responseTime,
        confidence: response.confidence
      });

      return response;

    } catch (error) {
      const responseTime = Date.now() - startTime;
      this.updateMetrics(responseTime, false);

      this.log('error', 'Failed to process improved accountability request', {
        error: error instanceof Error ? error.message : String(error),
        user_id: userContext.user.id
      });

      return this.handleError(error as Error, {
        user_id: userContext.user.id,
        request_type: 'accountability_check'
      });
    }
  }

  private async performAccountabilityCheck(
    userContext: UserContext,
    metadata?: Record<string, any>
  ): Promise<AgentResponse> {
    const state = AgentStateFactory.createAccountabilityState('accountability_check');

    try {
      // 1. Get comprehensive data (includes profile)
      const context = await this.retrieval.getComprehensiveUserContext(
        userContext.user.discord_id,
        7
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

      // 3. Get habit analysis
      const habitAnalysis = await this.retrieval.getHabitAnalysis(context.user.id, 7);

      // 4. Calculate metrics
      const totalDays = 90; // Standard 90-day challenge
      const currentDay = this.calculateCurrentDay(context.proofs);
      const activeStreaks = habitAnalysis.filter(h => h.streak > 0).length;
      const longestStreak = Math.max(0, ...habitAnalysis.map(h => h.streak));

      // 5. Analyze week performance
      const weekPerformanceData = habitAnalysis.map(h => ({
        habit: h.habitName,
        completed: h.actualProofs,
        target: h.targetFrequency,
        streak: h.streak,
      }));

      state.weekPerformance = habitAnalysis.map(h => ({
        habitName: h.habitName,
        completed: h.actualProofs,
        target: h.targetFrequency,
        streak: h.streak,
        status: this.determineStatus(h.completionRate)
      }));

      // 6. Update state metrics
      state.currentDay = currentDay;
      state.totalDays = totalDays;
      state.activeStreaks = activeStreaks;
      state.longestStreak = longestStreak;

      // 7. Generate concise prompt with profile
      const prompt = ConcisePrompts.generateAccountabilityPrompt({
        day: currentDay,
        totalDays: totalDays,
        weekPerformance: weekPerformanceData,
        longestStreak: longestStreak,
        profile: context.profile ? {
          personalityType: context.profile.personalityType,
          responseStyle: context.profile.responseStyle,
        } : undefined,
      });

      // 8. Generate structured response with retries
      const validated = await this.generateWithRetry(prompt, 3);

      // 9. Format for Discord
      const formattedResponse = NotionOutputFormatter.formatAccountabilityOutput(validated);

      // 10. Mark complete
      StateTransitions.markComplete(state);

      return {
        success: true,
        message: formattedResponse,
        data: {
          weekPerformance: state.weekPerformance,
          currentDay,
          totalDays,
          activeStreaks,
          longestStreak,
          validated
        },
        agentId: this.agentId,
        confidence: 0.85,
        timestamp: new Date()
      };

    } catch (error) {
      StateTransitions.addError(state, error instanceof Error ? error.message : String(error));
      throw error;
    }
  }

  private async generateWithRetry(
    prompt: string,
    maxRetries: number = 3
  ): Promise<AccountabilityOutput> {
    let lastError: Error | null = null;
    let currentPrompt = prompt;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const aiResponse = await this.perplexityClient.generateResponse(currentPrompt);
        const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);

        if (!jsonMatch) {
          throw new Error('No JSON found in AI response');
        }

        const parsed = JSON.parse(jsonMatch[0]);
        const validated = AccountabilityOutputSchema.parse(parsed);

        return validated;

      } catch (error) {
        lastError = error as Error;
        if (attempt < maxRetries) {
          currentPrompt += `\n\nIMPORTANT: Response MUST be valid JSON matching the exact schema. Previous attempt had error: ${lastError.message}`;
        }
      }
    }

    // Fallback
    return this.createFallbackOutput();
  }

  private createFallbackOutput(): AccountabilityOutput {
    return {
      status: {
        day: 0,
        totalDays: 90,
        activeStreaks: 0,
        longestStreak: 0,
      },
      weekPerformance: [],
      motivation: 'Keep tracking your habits daily',
      actions: ['Continue logging proofs', 'Review your progress'],
    };
  }

  private determineStatus(completionRate: number): 'on_track' | 'behind' | 'critical' {
    if (completionRate >= 80) return 'on_track';
    if (completionRate >= 50) return 'behind';
    return 'critical';
  }

  private calculateCurrentDay(proofs: any[]): number {
    if (proofs.length === 0) return 1;

    const oldestProof = proofs.reduce((oldest, p) => {
      const pDate = new Date(p.date);
      const oldDate = new Date(oldest.date);
      return pDate < oldDate ? p : oldest;
    });

    const daysSinceStart = Math.floor(
      (Date.now() - new Date(oldestProof.date).getTime()) / (1000 * 60 * 60 * 24)
    );

    return Math.min(daysSinceStart + 1, 90);
  }
}
