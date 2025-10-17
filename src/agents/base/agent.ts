/**
 * Base Agent class for the Multi-Agent Habit Mentor System
 * Using TypeScript for type-safe agent interactions
 */

import { 
  AgentResponse, 
  UserContext, 
  AgentError, 
  SystemHealth,
  Metrics,
  AgentMetrics
} from './types';

// ============================================================================
// BASE AGENT CLASS
// ============================================================================

export abstract class BaseAgent {
  protected agentId: string;
  protected agentName: string;
  protected capabilities: string[];
  protected isActive: boolean = true;
  protected performanceMetrics: AgentMetrics = {
    response_time: 0,
    success_rate: 0,
    user_satisfaction: 0,
    recommendation_accuracy: 0,
    total_interactions: 0
  };

  constructor(agentId: string, agentName: string, capabilities: string[]) {
    this.agentId = agentId;
    this.agentName = agentName;
    this.capabilities = capabilities;
  }

  // ============================================================================
  // ABSTRACT METHODS - TO BE IMPLEMENTED BY SUBCLASSES
  // ============================================================================

  /**
   * Process a user request and generate a response
   */
  abstract processRequest(
    userContext: UserContext, 
    request: string, 
    metadata?: Record<string, any>
  ): Promise<AgentResponse>;

  /**
   * Initialize the agent with required resources
   */
  abstract initialize(): Promise<void>;

  /**
   * Clean up resources when agent is shut down
   */
  abstract cleanup(): Promise<void>;

  // ============================================================================
  // COMMON AGENT FUNCTIONALITY
  // ============================================================================

  /**
   * Get agent information
   */
  getAgentInfo(): { id: string; name: string; capabilities: string[] } {
    return {
      id: this.agentId,
      name: this.agentName,
      capabilities: this.capabilities
    };
  }

  /**
   * Check if agent can handle a specific request type
   */
  canHandle(requestType: string): boolean {
    return this.capabilities.includes(requestType) && this.isActive;
  }

  /**
   * Get current performance metrics
   */
  getPerformanceMetrics(): AgentMetrics {
    return { ...this.performanceMetrics };
  }

  /**
   * Update performance metrics
   */
  protected updateMetrics(
    responseTime: number, 
    success: boolean, 
    userSatisfaction?: number
  ): void {
    this.performanceMetrics.response_time = responseTime;
    this.performanceMetrics.total_interactions++;
    
    if (success) {
      this.performanceMetrics.success_rate = 
        (this.performanceMetrics.success_rate * (this.performanceMetrics.total_interactions - 1) + 1) / 
        this.performanceMetrics.total_interactions;
    } else {
      this.performanceMetrics.success_rate = 
        (this.performanceMetrics.success_rate * (this.performanceMetrics.total_interactions - 1)) / 
        this.performanceMetrics.total_interactions;
    }

    if (userSatisfaction !== undefined) {
      this.performanceMetrics.user_satisfaction = 
        (this.performanceMetrics.user_satisfaction * (this.performanceMetrics.total_interactions - 1) + userSatisfaction) / 
        this.performanceMetrics.total_interactions;
    }
  }

  /**
   * Log agent activity
   */
  protected log(level: 'info' | 'warn' | 'error', message: string, context?: Record<string, any>): void {
    const logEntry = {
      timestamp: new Date().toISOString(),
      agent: this.agentId,
      level,
      message,
      context
    };

    if (level === 'error') {
      console.error(JSON.stringify(logEntry));
    } else if (level === 'warn') {
      console.warn(JSON.stringify(logEntry));
    } else {
      console.log(JSON.stringify(logEntry));
    }
  }

  /**
   * Validate user context
   */
  protected validateUserContext(userContext: UserContext): void {
    if (!userContext.user) {
      throw new AgentError('User context is missing user data', this.agentId, 'MISSING_USER');
    }

    if (!userContext.user.id) {
      throw new AgentError('User ID is missing', this.agentId, 'MISSING_USER_ID');
    }

    if (!userContext.user.discord_id) {
      throw new AgentError('User Discord ID is missing', this.agentId, 'MISSING_DISCORD_ID');
    }
  }

  /**
   * Create a standardized agent response
   */
  protected createResponse(
    success: boolean,
    message: string,
    confidence: number,
    recommendations?: any[],
    insights?: any[],
    nextSteps?: string[],
    metadata?: Record<string, any>
  ): AgentResponse {
    return {
      success,
      message,
      confidence,
      recommendations,
      insights,
      next_steps: nextSteps,
      metadata,
      timestamp: new Date()
    };
  }

  /**
   * Handle errors gracefully
   */
  protected handleError(error: Error, context: Record<string, any> = {}): AgentResponse {
    this.log('error', `Agent error: ${error.message}`, {
      error: error.message,
      stack: error.stack,
      context
    });

    return this.createResponse(
      false,
      `I encountered an error while processing your request. Please try again later.`,
      0,
      [],
      [],
      ['Try rephrasing your request', 'Contact support if the issue persists'],
      { error: error.message, agent: this.agentId }
    );
  }

  // ============================================================================
  // AGENT LIFECYCLE MANAGEMENT
  // ============================================================================

  /**
   * Activate the agent
   */
  activate(): void {
    this.isActive = true;
    this.log('info', 'Agent activated');
  }

  /**
   * Deactivate the agent
   */
  deactivate(): void {
    this.isActive = false;
    this.log('info', 'Agent deactivated');
  }

  /**
   * Check if agent is healthy
   */
  async healthCheck(): Promise<boolean> {
    try {
      // Basic health check - can be overridden by subclasses
      return this.isActive;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.log('error', 'Health check failed', { error: errorMessage });
      return false;
    }
  }

  /**
   * Reset performance metrics
   */
  resetMetrics(): void {
    this.performanceMetrics = {
      response_time: 0,
      success_rate: 0,
      user_satisfaction: 0,
      recommendation_accuracy: 0,
      total_interactions: 0
    };
    this.log('info', 'Performance metrics reset');
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  /**
   * Calculate confidence score based on available data
   */
  protected calculateConfidence(
    dataQuality: number, 
    patternStrength: number, 
    userEngagement: number
  ): number {
    // Weighted average of factors
    const weights = { dataQuality: 0.4, patternStrength: 0.4, userEngagement: 0.2 };
    return Math.min(1.0, 
      (dataQuality * weights.dataQuality) + 
      (patternStrength * weights.patternStrength) + 
      (userEngagement * weights.userEngagement)
    );
  }

  /**
   * Format response for Discord
   */
  protected formatForDiscord(response: AgentResponse): string {
    let formatted = `**${this.agentName} Response:**\n\n${response.message}`;

    if (response.recommendations && response.recommendations.length > 0) {
      formatted += `\n\n**Recommendations:**`;
      response.recommendations.forEach((rec, index) => {
        formatted += `\n${index + 1}. ${rec.title}: ${rec.description}`;
      });
    }

    if (response.insights && response.insights.length > 0) {
      formatted += `\n\n**Insights:**`;
      response.insights.forEach((insight, index) => {
        formatted += `\n${index + 1}. ${insight.insight}`;
      });
    }

    if (response.next_steps && response.next_steps.length > 0) {
      formatted += `\n\n**Next Steps:**`;
      response.next_steps.forEach((step, index) => {
        formatted += `\n${index + 1}. ${step}`;
      });
    }

    return formatted;
  }

  /**
   * Extract key information from user context
   */
  protected extractKeyInfo(userContext: UserContext): {
    userId: string;
    userName: string;
    activeHabits: number;
    recentActivity: number;
    currentStreak: number;
  } {
    const userId = userContext.user.id;
    const userName = userContext.user.name;
    const activeHabits = userContext.current_habits.length;
    const recentActivity = userContext.recent_proofs.filter(p => 
      new Date(p.date) >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    ).length;
    const currentStreak = userContext.weekly_summary?.current_streak || 0;

    return {
      userId,
      userName,
      activeHabits,
      recentActivity,
      currentStreak
    };
  }

  /**
   * Generate contextual prompt for AI
   */
  protected generateContextualPrompt(
    basePrompt: string,
    userContext: UserContext,
    specificContext?: Record<string, any>
  ): string {
    const keyInfo = this.extractKeyInfo(userContext);
    
    let contextualPrompt = basePrompt;
    
    // Add user context
    contextualPrompt += `\n\nUser Context:
- Name: ${keyInfo.userName}
- Active Habits: ${keyInfo.activeHabits}
- Recent Activity (7 days): ${keyInfo.recentActivity}
- Current Streak: ${keyInfo.currentStreak}
- Timezone: ${userContext.user.timezone}
- Communication Style: ${userContext.user.communication_style || 'Not specified'}`;

    // Add specific context if provided
    if (specificContext) {
      contextualPrompt += `\n\nSpecific Context:`;
      Object.entries(specificContext).forEach(([key, value]) => {
        contextualPrompt += `\n- ${key}: ${value}`;
      });
    }

    // Add recent learnings and hurdles
    if (userContext.learnings.length > 0) {
      contextualPrompt += `\n\nRecent Learnings:`;
      userContext.learnings.slice(0, 3).forEach((learning, index) => {
        contextualPrompt += `\n${index + 1}. ${learning.text.substring(0, 100)}...`;
      });
    }

    if (userContext.hurdles.length > 0) {
      contextualPrompt += `\n\nCurrent Hurdles:`;
      userContext.hurdles.slice(0, 3).forEach((hurdle, index) => {
        contextualPrompt += `\n${index + 1}. ${hurdle.name}: ${hurdle.description}`;
      });
    }

    return contextualPrompt;
  }
}

// ============================================================================
// AGENT REGISTRY
// ============================================================================

export class AgentRegistry {
  private static instance: AgentRegistry;
  private agents: Map<string, BaseAgent> = new Map();

  private constructor() {}

  static getInstance(): AgentRegistry {
    if (!AgentRegistry.instance) {
      AgentRegistry.instance = new AgentRegistry();
    }
    return AgentRegistry.instance;
  }

  registerAgent(agent: BaseAgent): void {
    this.agents.set(agent.getAgentInfo().id, agent);
  }

  getAgent(agentId: string): BaseAgent | undefined {
    return this.agents.get(agentId);
  }

  getAllAgents(): BaseAgent[] {
    return Array.from(this.agents.values());
  }

  getActiveAgents(): BaseAgent[] {
    return this.getAllAgents().filter(agent => agent['isActive']);
  }

  getAgentsByCapability(capability: string): BaseAgent[] {
    return this.getAllAgents().filter(agent => 
      agent.canHandle(capability)
    );
  }

  async healthCheck(): Promise<SystemHealth> {
    const agents = this.getAllAgents();
    const serviceChecks = await Promise.allSettled(
      agents.map(agent => agent.healthCheck())
    );

    const services: SystemHealth['services'] = {
      notion: true, // Will be implemented with actual service checks
      neo4j: true,
      perplexity: true,
      discord: true
    };

    return {
      overall: serviceChecks.every(check => check.status === 'fulfilled'),
      services,
      timestamp: new Date(),
      response_times: {},
      error_rates: {}
    };
  }

  async shutdown(): Promise<void> {
    const agents = this.getAllAgents();
    await Promise.allSettled(
      agents.map(agent => agent.cleanup())
    );
    this.agents.clear();
  }
}
