/**
 * Orchestrator - Coordinates and routes requests to appropriate agents
 * Uses Pydantic AI principles for type-safe agent coordination
 */

import { BaseAgent, AgentRegistry } from '../base/agent';
import { 
  UserContext, 
  OrchestratorRequest, 
  OrchestratorResponse,
  AgentResponse,
  AgentCapabilities,
  SystemHealth
} from '../base/types';
import { MentorAgent } from '../mentor/mentor_agent';
import { IdentityAgent } from '../identity/identity_agent';
import { AccountabilityAgent } from '../accountability/accountability_agent';
import { GroupAgent } from '../group/group_agent';
import { LearningAgent } from '../learning/learning_agent';
import { PerplexityClient } from '../../ai/perplexity-client';
import { NotionClient } from '../../notion/client';

export class Orchestrator extends BaseAgent {
  private agentRegistry: AgentRegistry;
  private perplexityClient: PerplexityClient;
  private notionClient: NotionClient;
  private readonly PERSONAL_CHANNEL_ID = '1422681618304471131'; // Your personal channel

  constructor(perplexityClient: PerplexityClient, notionClient: NotionClient) {
    super('orchestrator', 'Orchestrator', [
      'request_routing',
      'agent_coordination',
      'response_aggregation',
      'system_monitoring'
    ]);

    this.agentRegistry = AgentRegistry.getInstance();
    this.perplexityClient = perplexityClient;
    this.notionClient = notionClient;
  }

  async initialize(): Promise<void> {
    this.log('info', 'Initializing Orchestrator');

    // Initialize and register agents
    await this.initializeAgents();

    // Verify system health
    const health = await this.getSystemHealth();
    if (!health.overall) {
      this.log('warn', 'System health check failed during initialization', { health });
    }

    this.log('info', 'Orchestrator initialized successfully');
  }

  async cleanup(): Promise<void> {
    this.log('info', 'Cleaning up Orchestrator');
    await this.agentRegistry.shutdown();
  }

  async processRequest(
    userContext: UserContext, 
    request: string, 
    metadata?: Record<string, any>
  ): Promise<AgentResponse> {
    const startTime = Date.now();
    
    try {
      this.validateUserContext(userContext);
      
      // Only process requests from your personal channel
      if (userContext.user.discord_id !== this.PERSONAL_CHANNEL_ID) {
        return this.createResponse(
          false,
          'This system is currently only available for the designated user.',
          0,
          [],
          [],
          ['Contact administrator for access']
        );
      }

      this.log('info', `Processing orchestrator request for user ${userContext.user.name}`, {
        request: request.substring(0, 100),
        user_id: userContext.user.id
      });

      // Create orchestrator request
      const orchestratorRequest: OrchestratorRequest = {
        user_id: userContext.user.id,
        message: request,
        context: metadata?.context || 'general',
        channel_id: userContext.user.personal_channel_id,
        timestamp: new Date(),
        user_context: userContext
      };

      // Process the request
      const orchestratorResponse = await this.processOrchestratorRequest(orchestratorRequest);

      const responseTime = Date.now() - startTime;
      this.updateMetrics(responseTime, true);

      this.log('info', 'Orchestrator request processed successfully', {
        response_time: responseTime,
        primary_agent: orchestratorResponse.primary_agent,
        confidence: orchestratorResponse.confidence
      });

      return this.createResponse(
        orchestratorResponse.success,
        orchestratorResponse.response.message,
        orchestratorResponse.confidence,
        orchestratorResponse.response.recommendations,
        orchestratorResponse.response.insights,
        orchestratorResponse.response.next_steps,
        {
          primary_agent: orchestratorResponse.primary_agent,
          agents_involved: orchestratorResponse.agents_involved,
          processing_time: orchestratorResponse.processing_time
        }
      );

    } catch (error) {
      const responseTime = Date.now() - startTime;
      this.updateMetrics(responseTime, false);
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      this.log('error', 'Failed to process orchestrator request', {
        error: errorMessage,
        user_id: userContext.user.id,
        request: request.substring(0, 100)
      });

      return this.handleError(error as Error, {
        user_id: userContext.user.id,
        request_type: 'orchestrator_coordination'
      });
    }
  }

  // ============================================================================
  // ORCHESTRATOR CORE FUNCTIONALITY
  // ============================================================================

  private async processOrchestratorRequest(
    request: OrchestratorRequest
  ): Promise<OrchestratorResponse> {
    const startTime = Date.now();

    try {
      // Determine which agents should handle this request
      const agentCapabilities = await this.determineAgentCapabilities(request);
      const primaryAgent = this.selectPrimaryAgent(agentCapabilities, request);
      const supportingAgents = this.selectSupportingAgents(agentCapabilities, request, primaryAgent);

      this.log('info', 'Selected agents for request', {
        primary_agent: primaryAgent?.getAgentInfo().id,
        supporting_agents: supportingAgents.map(a => a.getAgentInfo().id),
        request_context: request.context
      });

      // Process with primary agent
      let primaryResponse: AgentResponse;
      if (primaryAgent) {
        primaryResponse = await primaryAgent.processRequest(
          request.user_context!,
          request.message,
          { context: request.context, channel_id: request.channel_id }
        );
      } else {
        // Fallback response if no suitable agent found
        primaryResponse = await this.generateFallbackResponse(request);
      }

      // Process with supporting agents if needed
      const supportingResponses: AgentResponse[] = [];
      for (const agent of supportingAgents) {
        try {
          const response = await agent.processRequest(
            request.user_context!,
            request.message,
            { 
              context: request.context, 
              primary_response: primaryResponse,
              channel_id: request.channel_id 
            }
          );
          supportingResponses.push(response);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          this.log('warn', 'Supporting agent failed', {
            agent: agent.getAgentInfo().id,
            error: errorMessage
          });
        }
      }

      // Aggregate responses
      const aggregatedResponse = await this.aggregateResponses(
        primaryResponse,
        supportingResponses,
        request
      );

      const processingTime = Date.now() - startTime;

      return {
        success: aggregatedResponse.success,
        primary_agent: primaryAgent?.getAgentInfo().id || 'fallback',
        agents_involved: [
          primaryAgent?.getAgentInfo().id,
          ...supportingAgents.map(a => a.getAgentInfo().id)
        ].filter(Boolean) as string[],
        response: aggregatedResponse,
        processing_time: processingTime,
        confidence: aggregatedResponse.confidence,
        follow_up_required: this.determineFollowUpRequired(aggregatedResponse),
        follow_up_agents: this.determineFollowUpAgents(aggregatedResponse, request),
        metadata: {
          request_id: `req_${Date.now()}`,
          user_id: request.user_id,
          context: request.context,
          processing_time: processingTime
        }
      };

    } catch (error) {
      const processingTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      this.log('error', 'Orchestrator processing failed', {
        error: errorMessage,
        request_id: request.user_id,
        processing_time: processingTime
      });

      return {
        success: false,
        primary_agent: 'error',
        agents_involved: [],
        response: {
          success: false,
          message: 'I encountered an error while processing your request. Please try again later.',
          confidence: 0,
          recommendations: [],
          insights: [],
          next_steps: ['Try rephrasing your request', 'Contact support if the issue persists'],
          metadata: { error: errorMessage },
          timestamp: new Date()
        },
        processing_time: processingTime,
        confidence: 0,
        follow_up_required: false,
        follow_up_agents: [],
        metadata: {
          error: errorMessage,
          request_id: `req_${Date.now()}`,
          processing_time: processingTime
        }
      };
    }
  }

  // ============================================================================
  // AGENT SELECTION AND ROUTING
  // ============================================================================

  private async determineAgentCapabilities(request: OrchestratorRequest): Promise<AgentCapabilities[]> {
    const availableAgents = this.agentRegistry.getActiveAgents();
    const capabilities: AgentCapabilities[] = [];

    for (const agent of availableAgents) {
      const agentInfo = agent.getAgentInfo();
      const performanceMetrics = agent.getPerformanceMetrics();
      
      // Determine if agent can handle this request
      const canHandle = this.canAgentHandleRequest(agent, request);
      
      capabilities.push({
        agent_id: agentInfo.id,
        capabilities: agentInfo.capabilities,
        specializations: this.determineSpecializations(agent, request),
        performance_metrics: performanceMetrics,
        availability: canHandle,
        last_updated: new Date()
      });
    }

    return capabilities.filter(cap => cap.availability);
  }

  private canAgentHandleRequest(agent: BaseAgent, request: OrchestratorRequest): boolean {
    if (!agent.canHandle(request.context)) {
      return false;
    }

    // Route based on command context and message content
    const message = request.message.toLowerCase();
    const context = (request as any).metadata?.context || '';
    
    // Identity Agent routing
    if (agent.getAgentInfo().id === 'identity') {
      return context === 'identity_command' || 
             message.includes('identity') || 
             message.includes('personality') ||
             message.includes('identity alignment');
    }
    
    // Accountability Agent routing
    if (agent.getAgentInfo().id === 'accountability') {
      return context === 'accountability_command' || 
             message.includes('accountability') || 
             message.includes('motivation') ||
             message.includes('check in') ||
             message.includes('intervention');
    }
    
    // Group Agent routing
    if (agent.getAgentInfo().id === 'group') {
      return context === 'group_command' || 
             message.includes('group') || 
             message.includes('social') ||
             message.includes('peer') ||
             message.includes('community');
    }
    
    // Learning Agent routing
    if (agent.getAgentInfo().id === 'learning') {
      return context === 'learning_command' || 
             message.includes('learning') || 
             message.includes('hurdle') ||
             message.includes('pattern') ||
             message.includes('insight');
    }
    
    // Mentor Agent routing (fallback for general habit coaching)
    if (agent.getAgentInfo().id === 'mentor') {
      return context === 'mentor_command' || 
             message.includes('habit') || 
             message.includes('coaching') ||
             message.includes('feedback') ||
             message.includes('analysis');
    }

    // Additional context-specific logic
    switch (agent.getAgentInfo().id) {
      case 'mentor':
        return message.includes('habit') || 
               message.includes('feedback') || 
               message.includes('analysis') ||
               message.includes('coaching') ||
               message.includes('weekly') ||
               message.includes('progress');
      
      case 'identity':
        return message.includes('personality') ||
               message.includes('identity') ||
               message.includes('recommendation') ||
               message.includes('match');
      
      case 'accountability':
        return message.includes('reminder') ||
               message.includes('motivation') ||
               message.includes('incentive') ||
               message.includes('support');
      
      case 'group':
        return message.includes('group') ||
               message.includes('social') ||
               message.includes('partner') ||
               message.includes('team');
      
      case 'learning':
        return message.includes('learning') ||
               message.includes('insight') ||
               message.includes('pattern') ||
               message.includes('hurdle');
      
      default:
        return true; // Default to allowing if agent is active
    }
  }

  private determineSpecializations(agent: BaseAgent, request: OrchestratorRequest): string[] {
    const agentId = agent.getAgentInfo().id;
    const message = request.message.toLowerCase();
    const specializations: string[] = [];

    switch (agentId) {
      case 'mentor':
        if (message.includes('weekly')) specializations.push('weekly_analysis');
        if (message.includes('pattern')) specializations.push('pattern_analysis');
        if (message.includes('coaching')) specializations.push('coaching_advice');
        break;
      
      case 'identity':
        if (message.includes('personality')) specializations.push('personality_analysis');
        if (message.includes('recommendation')) specializations.push('habit_matching');
        break;
      
      case 'accountability':
        if (message.includes('reminder')) specializations.push('reminder_system');
        if (message.includes('motivation')) specializations.push('motivation_engine');
        break;
      
      case 'group':
        if (message.includes('formation')) specializations.push('group_formation');
        if (message.includes('dynamics')) specializations.push('group_dynamics');
        break;
      
      case 'learning':
        if (message.includes('pattern')) specializations.push('pattern_mining');
        if (message.includes('insight')) specializations.push('insight_extraction');
        break;
    }

    return specializations;
  }

  private selectPrimaryAgent(
    capabilities: AgentCapabilities[], 
    request: OrchestratorRequest
  ): BaseAgent | null {
    // Score agents based on relevance and performance
    const agentScores = capabilities.map(cap => ({
      agent: this.agentRegistry.getAgent(cap.agent_id)!,
      score: this.calculateAgentScore(cap, request)
    }));

    // Sort by score and select the best one
    agentScores.sort((a, b) => b.score - a.score);
    
    if (agentScores.length > 0 && agentScores[0].score > 0.5) {
      return agentScores[0].agent;
    }

    return null;
  }

  private calculateAgentScore(capability: AgentCapabilities, request: OrchestratorRequest): number {
    let score = 0;

    // Base score from performance metrics
    score += capability.performance_metrics.success_rate * 0.3;
    score += capability.performance_metrics.user_satisfaction * 0.2;
    score += (1 - capability.performance_metrics.response_time / 3000) * 0.1; // Normalize response time

    // Bonus for specializations
    if (capability.specializations.length > 0) {
      score += 0.2;
    }

    // Bonus for relevant capabilities
    const message = request.message.toLowerCase();
    const relevantCapabilities = capability.capabilities.filter(cap => {
      return message.includes(cap.replace('_', ' ')) || 
             message.includes(cap) ||
             request.context.includes(cap);
    });
    
    score += relevantCapabilities.length * 0.1;

    return Math.min(1.0, score);
  }

  private selectSupportingAgents(
    capabilities: AgentCapabilities[], 
    request: OrchestratorRequest,
    primaryAgent: BaseAgent | null
  ): BaseAgent[] {
    const supportingAgents: BaseAgent[] = [];

    // Add agents that can provide supporting context
    for (const cap of capabilities) {
      if (primaryAgent && cap.agent_id === primaryAgent.getAgentInfo().id) {
        continue; // Skip primary agent
      }

      // Select agents that can provide relevant supporting information
      if (this.shouldIncludeSupportingAgent(cap, request)) {
        const agent = this.agentRegistry.getAgent(cap.agent_id);
        if (agent) {
          supportingAgents.push(agent);
        }
      }
    }

    // Limit to 2 supporting agents to avoid over-processing
    return supportingAgents.slice(0, 2);
  }

  private shouldIncludeSupportingAgent(
    capability: AgentCapabilities, 
    request: OrchestratorRequest
  ): boolean {
    // Simple logic for now - can be enhanced
    const message = request.message.toLowerCase();
    
    // Include learning agent for pattern-related requests
    if (capability.agent_id === 'learning' && 
        (message.includes('pattern') || message.includes('insight'))) {
      return true;
    }

    // Include identity agent for habit-related requests
    if (capability.agent_id === 'identity' && message.includes('habit')) {
      return true;
    }

    // Include accountability agent for motivation-related requests
    if (capability.agent_id === 'accountability' && 
        (message.includes('motivation') || message.includes('support'))) {
      return true;
    }

    return false;
  }

  // ============================================================================
  // RESPONSE AGGREGATION
  // ============================================================================

  private async aggregateResponses(
    primaryResponse: AgentResponse,
    supportingResponses: AgentResponse[],
    request: OrchestratorRequest
  ): Promise<AgentResponse> {
    // Start with primary response
    let aggregatedResponse = { ...primaryResponse };

    // Merge supporting responses
    for (const supportingResponse of supportingResponses) {
      if (supportingResponse.success) {
        // Combine recommendations
        if (supportingResponse.recommendations) {
          aggregatedResponse.recommendations = [
            ...(aggregatedResponse.recommendations || []),
            ...supportingResponse.recommendations
          ];
        }

        // Combine insights
        if (supportingResponse.insights) {
          aggregatedResponse.insights = [
            ...(aggregatedResponse.insights || []),
            ...supportingResponse.insights
          ];
        }

        // Combine next steps
        if (supportingResponse.next_steps) {
          aggregatedResponse.next_steps = [
            ...(aggregatedResponse.next_steps || []),
            ...supportingResponse.next_steps
          ];
        }

        // Update confidence (average)
        aggregatedResponse.confidence = 
          (aggregatedResponse.confidence + supportingResponse.confidence) / 2;
      }
    }

    // Remove duplicates
    aggregatedResponse.recommendations = this.removeDuplicateRecommendations(
      aggregatedResponse.recommendations || []
    );
    aggregatedResponse.insights = this.removeDuplicateInsights(
      aggregatedResponse.insights || []
    );
    aggregatedResponse.next_steps = this.removeDuplicateSteps(
      aggregatedResponse.next_steps || []
    );

    // Update metadata
    aggregatedResponse.metadata = {
      ...aggregatedResponse.metadata,
      supporting_responses: supportingResponses.length,
      aggregation_method: 'merge_and_deduplicate'
    };

    return aggregatedResponse;
  }

  private removeDuplicateRecommendations(recommendations: any[]): any[] {
    const seen = new Set();
    return recommendations.filter(rec => {
      const key = rec.title || rec.description;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  private removeDuplicateInsights(insights: any[]): any[] {
    const seen = new Set();
    return insights.filter(insight => {
      const key = insight.insight || insight.description;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  private removeDuplicateSteps(steps: string[]): string[] {
    return [...new Set(steps)];
  }

  // ============================================================================
  // FALLBACK AND ERROR HANDLING
  // ============================================================================

  private async generateFallbackResponse(request: OrchestratorRequest): Promise<AgentResponse> {
    this.log('warn', 'Generating fallback response', { 
      user_id: request.user_id,
      context: request.context 
    });

    const fallbackPrompt = `You are a helpful habit coach assistant. The user has asked: "${request.message}"

Provide a helpful response about habit formation and improvement. Be encouraging and practical.`;

    try {
      const aiResponse = await this.perplexityClient.generateResponse(fallbackPrompt);
      
      return {
        success: true,
        message: aiResponse,
        confidence: 0.5, // Lower confidence for fallback
        recommendations: [],
        insights: [],
        next_steps: ['Try being more specific about what you need help with'],
        metadata: { 
          response_type: 'fallback',
          agent: 'orchestrator'
        },
        timestamp: new Date()
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        success: false,
        message: 'I apologize, but I\'m having trouble processing your request right now. Please try again later.',
        confidence: 0,
        recommendations: [],
        insights: [],
        next_steps: ['Try rephrasing your request', 'Contact support if the issue persists'],
        metadata: { 
          response_type: 'error',
          error: errorMessage
        },
        timestamp: new Date()
      };
    }
  }

  private determineFollowUpRequired(response: AgentResponse): boolean {
    // Simple logic - can be enhanced
    return response.confidence < 0.7 || 
           (response.recommendations ? response.recommendations.length === 0 : false);
  }

  private determineFollowUpAgents(
    response: AgentResponse, 
    request: OrchestratorRequest
  ): string[] {
    const followUpAgents: string[] = [];

    if (response.confidence < 0.7) {
      // Add learning agent for low confidence responses
      followUpAgents.push('learning');
    }

    if (response.recommendations && response.recommendations.length === 0) {
      // Add mentor agent if no recommendations
      followUpAgents.push('mentor');
    }

    return followUpAgents;
  }

  // ============================================================================
  // AGENT INITIALIZATION
  // ============================================================================

  private async initializeAgents(): Promise<void> {
    this.log('info', 'Initializing agents');

    try {
      // Initialize Mentor Agent
      const mentorAgent = new MentorAgent(this.perplexityClient, this.notionClient);
      await mentorAgent.initialize();
      this.agentRegistry.registerAgent(mentorAgent);
      this.log('info', 'Mentor Agent initialized and registered');

      // Initialize Identity Agent
      const identityAgent = new IdentityAgent(this.perplexityClient, this.notionClient);
      await identityAgent.initialize();
      this.agentRegistry.registerAgent(identityAgent);
      this.log('info', 'Identity Agent initialized and registered');

      // Initialize Accountability Agent
      const accountabilityAgent = new AccountabilityAgent(this.perplexityClient, this.notionClient);
      await accountabilityAgent.initialize();
      this.agentRegistry.registerAgent(accountabilityAgent);
      this.log('info', 'Accountability Agent initialized and registered');

      // Initialize Group Agent
      const groupAgent = new GroupAgent(this.perplexityClient, this.notionClient);
      await groupAgent.initialize();
      this.agentRegistry.registerAgent(groupAgent);
      this.log('info', 'Group Agent initialized and registered');

      // Initialize Learning & Hurdles Agent
      const learningAgent = new LearningAgent(this.perplexityClient, this.notionClient);
      await learningAgent.initialize();
      this.agentRegistry.registerAgent(learningAgent);
      this.log('info', 'Learning & Hurdles Agent initialized and registered');

      this.log('info', 'All agents initialized successfully');

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.log('error', 'Failed to initialize agents', { error: errorMessage });
      throw error;
    }
  }

  // ============================================================================
  // SYSTEM MONITORING
  // ============================================================================

  async getSystemHealth(): Promise<SystemHealth> {
    try {
      const systemHealth = await this.agentRegistry.healthCheck();
      
      // Add orchestrator-specific health checks
      const agentCount = this.agentRegistry.getAllAgents().length;
      const activeAgentCount = this.agentRegistry.getActiveAgents().length;

      return {
        ...systemHealth,
        services: {
          ...systemHealth.services
        }
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.log('error', 'Health check failed', { error: errorMessage });
      return {
        overall: false,
        services: {
          notion: false,
          neo4j: false,
          perplexity: false,
          discord: false
        },
        timestamp: new Date(),
        response_times: {},
        error_rates: {}
      };
    }
  }

  async getSystemStatus(): Promise<{
    agents: any[];
    capabilities: AgentCapabilities[];
    health: SystemHealth;
  }> {
    const agents = this.agentRegistry.getAllAgents().map(agent => ({
      ...agent.getAgentInfo(),
      isActive: agent['isActive'],
      metrics: agent.getPerformanceMetrics()
    }));

    const capabilities = await this.determineAgentCapabilities({
      user_id: 'system',
      message: 'system status',
      context: 'system',
      channel_id: 'system',
      timestamp: new Date()
    });

    const health = await this.getSystemHealth();

    return { agents, capabilities, health };
  }
}
