/**
 * Improved Group Agent
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
  GroupOutputSchema,
  NotionOutputFormatter,
  GroupOutput
} from '../improved/output-schemas';
import {
  AgentStateFactory,
  StateTransitions,
  GroupAgentState
} from '../improved/agent-state';

export class ImprovedGroupAgent extends BaseAgent {
  private perplexityClient: PerplexityClient;
  private notionClient: NotionClient;
  private retrieval: ImprovedNotionRetrieval;

  constructor(perplexityClient: PerplexityClient, notionClient: NotionClient) {
    super('group-improved', 'Improved Group Agent', [
      'group_dynamics',
      'social_comparison',
      'buddy_matching',
      'team_insights',
      'collaboration'
    ]);

    this.perplexityClient = perplexityClient;
    this.notionClient = notionClient;
    this.retrieval = new ImprovedNotionRetrieval(notionClient);
  }

  async initialize(): Promise<void> {
    this.log('info', 'Initializing Improved Group Agent');
    if (!PerplexityClient.isAvailable()) {
      throw new Error('Perplexity API key not available');
    }
    this.log('info', 'Improved Group Agent initialized successfully');
  }

  async cleanup(): Promise<void> {
    this.log('info', 'Cleaning up Improved Group Agent');
  }

  async processRequest(
    userContext: UserContext,
    message: string,
    metadata?: Record<string, any>
  ): Promise<AgentResponse> {
    const startTime = Date.now();

    try {
      this.log('info', `Processing improved group request for user ${userContext.user.name}`, {
        user_id: userContext.user.id
      });

      const response = await this.performGroupAnalysis(userContext, metadata);

      const responseTime = Date.now() - startTime;
      this.updateMetrics(responseTime, true);

      this.log('info', 'Improved group request processed successfully', {
        response_time: responseTime,
        confidence: response.confidence
      });

      return response;

    } catch (error) {
      const responseTime = Date.now() - startTime;
      this.updateMetrics(responseTime, false);

      this.log('error', 'Failed to process improved group request', {
        error: error instanceof Error ? error.message : String(error),
        user_id: userContext.user.id
      });

      return this.handleError(error as Error, {
        user_id: userContext.user.id,
        request_type: 'group_analysis'
      });
    }
  }

  private async performGroupAnalysis(
    userContext: UserContext,
    metadata?: Record<string, any>
  ): Promise<AgentResponse> {
    const state = AgentStateFactory.createGroupState('group_analysis');

    try {
      // 1. Get comprehensive data for user
      const context = await this.retrieval.getComprehensiveUserContext(
        userContext.user.discord_id,
        7
      );

      if (!context.user) {
        throw new Error('User not found');
      }

      // 2. Get all active users (group members)
      const allUsers = await this.notionClient.getAllUsers();
      const activeUsers = allUsers.filter(u => u.status === 'active');

      // 3. Get group member data
      state.groupMembers = await Promise.all(
        activeUsers.slice(0, 10).map(async (user) => {
          const habits = await this.retrieval.getActiveHabitsByUserId(user.id);
          const analysis = await this.retrieval.getHabitAnalysis(user.id, 7);
          const avgCompletion = analysis.length > 0
            ? analysis.reduce((sum, a) => sum + a.completionRate, 0) / analysis.length
            : 0;

          return {
            name: user.name,
            completionRate: Math.round(avgCompletion),
            activeHabits: habits.length,
          };
        })
      );

      // 4. Get user's completion rate
      const userAnalysis = await this.retrieval.getHabitAnalysis(context.user.id, 7);
      const userCompletionRate = userAnalysis.length > 0
        ? Math.round(userAnalysis.reduce((sum, a) => sum + a.completionRate, 0) / userAnalysis.length)
        : 0;

      // 5. Get buddy progress
      const buddyData = await this.retrieval.getBuddyProgress(context.user.id);
      state.buddy = buddyData ? {
        name: buddyData.nickname,
        completionRate: buddyData.completionRate,
        habits: buddyData.habits,
        proofs: buddyData.proofs,
      } : null;
      const buddyCompletionRate = state.buddy ? Math.round(state.buddy.completionRate) : 0;

      // 6. Generate concise prompt with profile
      const prompt = ConcisePrompts.generateGroupPrompt({
        members: state.groupMembers,
        userCompletionRate,
        buddyName: state.buddy?.name || 'No buddy',
        buddyCompletionRate,
        profile: context.profile ? {
          personalityType: context.profile.personalityType,
          responseStyle: context.profile.responseStyle,
        } : undefined,
      });

      // 7. Generate structured response with retries
      const validated = await this.generateWithRetry(prompt, 3);

      // 8. Format for Discord
      const formattedResponse = NotionOutputFormatter.formatGroupOutput(validated);

      // 9. Mark complete
      StateTransitions.markComplete(state);

      return {
        success: true,
        message: formattedResponse,
        data: {
          groupMembers: state.groupMembers,
          buddy: state.buddy,
          validated
        },
        agentId: this.agentId,
        confidence: 0.8,
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
  ): Promise<GroupOutput> {
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
        const validated = GroupOutputSchema.parse(parsed);

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

  private createFallbackOutput(): GroupOutput {
    return {
      groupStats: {
        activeMembers: 0,
        avgCompletionRate: 0,
        topPerformer: 'Unknown',
      },
      rankings: [],
      learningOpportunities: [],
      buddySync: 'Group analysis temporarily unavailable',
      groupPattern: 'Continue tracking your habits',
    };
  }
}
