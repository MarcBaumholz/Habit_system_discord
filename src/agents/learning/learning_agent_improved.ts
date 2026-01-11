/**
 * Improved Learning Agent
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
  LearningOutputSchema,
  NotionOutputFormatter,
  LearningOutput
} from '../improved/output-schemas';
import {
  AgentStateFactory,
  StateTransitions,
  LearningAgentState
} from '../improved/agent-state';

export class ImprovedLearningAgent extends BaseAgent {
  private perplexityClient: PerplexityClient;
  private notionClient: NotionClient;
  private retrieval: ImprovedNotionRetrieval;

  constructor(perplexityClient: PerplexityClient, notionClient: NotionClient) {
    super('learning-improved', 'Improved Learning Agent', [
      'pattern_extraction',
      'insight_synthesis',
      'hurdle_resolution',
      'knowledge_curation',
      'meta_learning'
    ]);

    this.perplexityClient = perplexityClient;
    this.notionClient = notionClient;
    this.retrieval = new ImprovedNotionRetrieval(notionClient);
  }

  async initialize(): Promise<void> {
    this.log('info', 'Initializing Improved Learning Agent');
    if (!PerplexityClient.isAvailable()) {
      throw new Error('Perplexity API key not available');
    }
    this.log('info', 'Improved Learning Agent initialized successfully');
  }

  async cleanup(): Promise<void> {
    this.log('info', 'Cleaning up Improved Learning Agent');
  }

  async processRequest(
    userContext: UserContext,
    message: string,
    metadata?: Record<string, any>
  ): Promise<AgentResponse> {
    const startTime = Date.now();

    try {
      this.log('info', `Processing improved learning request for user ${userContext.user.name}`, {
        user_id: userContext.user.id
      });

      const response = await this.performLearningAnalysis(userContext, metadata);

      const responseTime = Date.now() - startTime;
      this.updateMetrics(responseTime, true);

      this.log('info', 'Improved learning request processed successfully', {
        response_time: responseTime,
        confidence: response.confidence
      });

      return response;

    } catch (error) {
      const responseTime = Date.now() - startTime;
      this.updateMetrics(responseTime, false);

      this.log('error', 'Failed to process improved learning request', {
        error: error instanceof Error ? error.message : String(error),
        user_id: userContext.user.id
      });

      return this.handleError(error as Error, {
        user_id: userContext.user.id,
        request_type: 'learning_analysis'
      });
    }
  }

  private async performLearningAnalysis(
    userContext: UserContext,
    metadata?: Record<string, any>
  ): Promise<AgentResponse> {
    const state = AgentStateFactory.createLearningState('learning_analysis');

    try {
      // 1. Get comprehensive data
      const context = await this.retrieval.getComprehensiveUserContext(
        userContext.user.discord_id,
        28 // Last 28 days for learning analysis
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

      // 3. Analyze learning topics
      state.learningTopics = new Map();
      context.learnings.forEach(learning => {
        // Simple topic extraction (you can enhance this)
        const topic = learning.habitId || 'General';
        state.learningTopics.set(topic, (state.learningTopics.get(topic) || 0) + 1);
      });

      // 4. Get top insights
      state.topInsights = Array.from(state.learningTopics.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([topic, frequency]) => ({
          topic,
          insight: `Pattern identified in ${topic}`,
          frequency,
        }));

      // 5. Analyze hurdle solutions
      state.hurdleSolutions = context.hurdles.slice(0, 3).map(hurdle => ({
        hurdle: hurdle.description || 'Unknown hurdle',
        solution: 'Analyze patterns to find solution',
        effectiveness: 'medium' as const,
        timesUsed: 1,
      }));

      // 6. Prepare data for prompt
      const learningsData = context.learnings.map(l => ({
        topic: l.habitId || 'General',
        text: l.text,
        date: l.createdAt,
      }));

      const hurdlesData = context.hurdles.map(h => ({
        type: h.hurdleType || 'Other',
        description: h.description || '',
        solution: '', // Solutions are analyzed by AI
      }));

      // 7. Generate concise prompt with profile
      const prompt = ConcisePrompts.generateLearningPrompt({
        learnings: learningsData,
        hurdles: hurdlesData,
        profile: context.profile ? {
          personalityType: context.profile.personalityType,
          responseStyle: context.profile.responseStyle,
        } : undefined,
      });

      // 8. Generate structured response with retries
      const validated = await this.generateWithRetry(prompt, 3);

      // 9. Format for Discord
      const formattedResponse = NotionOutputFormatter.formatLearningOutput(validated);

      // 10. Store meta-pattern and recommendation in state
      state.metaPattern = validated.metaPattern;
      state.recommendation = validated.recommendation;

      // 11. Mark complete
      StateTransitions.markComplete(state);

      return {
        success: true,
        message: formattedResponse,
        data: {
          topInsights: state.topInsights,
          hurdleSolutions: state.hurdleSolutions,
          metaPattern: state.metaPattern,
          recommendation: state.recommendation,
          validated
        },
        agentId: this.agentId,
        confidence: 0.75,
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
  ): Promise<LearningOutput> {
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
        const validated = LearningOutputSchema.parse(parsed);

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

  private createFallbackOutput(): LearningOutput {
    return {
      insights: [],
      hurdleSolutions: [],
      metaPattern: 'Continue logging learnings and hurdles for better insights',
      recommendation: 'Track your progress daily to identify patterns',
    };
  }
}
