/**
 * Group Agent - Social coordination and group dynamics management
 * Inspired by Microsoft AutoGen framework principles
 */

import { BaseAgent } from '../base/agent';
import { 
  UserContext, 
  AgentResponse, 
  GroupAnalysis,
  Group,
  User
} from '../base/types';
import { PerplexityClient } from '../../ai/perplexity-client';
import { NotionClient } from '../../notion/client';

export class GroupAgent extends BaseAgent {
  private perplexityClient: PerplexityClient;
  private notionClient: NotionClient;
  private readonly MARC_CHANNEL_ID = '1422681618304471131'; // Marc's channel

  constructor(perplexityClient: PerplexityClient, notionClient: NotionClient) {
    super('group', 'Group Agent', [
      'group_formation',
      'social_coordination',
      'peer_influence_analysis',
      'group_dynamics_optimization',
      'collaborative_goal_management'
    ]);
    
    this.perplexityClient = perplexityClient;
    this.notionClient = notionClient;
  }

  async initialize(): Promise<void> {
    this.log('info', 'Initializing Group Agent');
    
    if (!PerplexityClient.isAvailable()) {
      throw new Error('Perplexity API key not available');
    }
    
    this.log('info', 'Group Agent initialized successfully');
  }

  async processRequest(userContext: UserContext, message: string, metadata?: Record<string, any>): Promise<AgentResponse> {
    this.log('info', 'Processing group analysis request', { userId: userContext.user.id });

    try {
      // Get all users and groups
      const allUsers = await this.notionClient.getAllUsers();
      const groups = await this.notionClient.getAllGroups();
      
      // Analyze group dynamics and user compatibility
      const groupAnalysis = await this.analyzeGroupDynamics(userContext, allUsers as any, groups as any);
      
      // Generate group recommendations
      const recommendations = await this.generateGroupRecommendations(userContext, groupAnalysis);
      
      // Store analysis
      await this.storeGroupAnalysis(groupAnalysis);

      return {
        success: true,
        message: this.formatGroupResponse(groupAnalysis, recommendations),
        data: {
          analysis: groupAnalysis,
          recommendations: recommendations
        },
        agentId: this.agentId,
        confidence: 0.8,
        timestamp: new Date()
      };

    } catch (error) {
      this.log('error', 'Group analysis failed', { error: error instanceof Error ? error.message : String(error) });
      return {
        success: false,
        message: "Group analysis failed. Please try again later.",
        data: null,
        agentId: this.agentId,
        confidence: 0,
        timestamp: new Date()
      };
    }
  }

  private async analyzeGroupDynamics(
    userContext: UserContext, 
    allUsers: User[], 
    groups: Group[]
  ): Promise<GroupAnalysis> {
    const prompt = `
    ROLE: Social dynamics expert specializing in group psychology, social accountability, and community-based habit formation.

    TASK: Analyze group dynamics and social compatibility for optimal habit formation support.

    COMPREHENSIVE SOCIAL CONTEXT:

    === TARGET USER ===
    - Name: ${userContext.user.name}
    - Current Habits: ${userContext.current_habits.map(h => h.name).join(', ')}
    - Trust Count: ${userContext.user.trust_count}
    - Personality: ${userContext.user.personality_type || 'Not specified'}
    - Communication Style: ${userContext.user.communication_style || 'Not specified'}

    === AVAILABLE COMMUNITY (${allUsers.length} total users) ===
    ${allUsers.slice(0, 10).map(user => 
      `- ${user.name} (Trust: ${user.trust_count}, Personality: ${user.personality_type || 'Unknown'})`
    ).join('\n')}

    === EXISTING GROUPS ===
    ${groups.map(group => 
      `- ${group.name} (Pool: €${group.donation_pool || 0})`
    ).join('\n')}

    ANALYSIS FRAMEWORK (Follow each step):

    STEP 1 - Individual Compatibility Assessment:
    Evaluate compatibility with each potential partner:
    - Personality alignment (similar vs complementary)
    - Habit overlap and synergy
    - Communication style compatibility
    - Trust level and social capital
    - Mutual support potential
    Score: ___ (1-10)

    STEP 2 - Social Influence Analysis:
    Assess user's potential influence in groups:
    - Trust count relative to community average
    - Habit consistency and reliability
    - Communication effectiveness
    - Leadership potential
    - Peer respect level
    Influence Level: <high|medium|low>

    STEP 3 - Group Dynamics Evaluation:
    Analyze existing group structures:
    - Group size and intimacy level
    - Financial commitment (donation pools)
    - Member diversity and balance
    - Support mechanisms in place
    - Potential for positive peer pressure

    STEP 4 - Social Accountability Opportunities:
    Identify specific accountability mechanisms:
    - Peer partnerships for mutual support
    - Group challenges and competitions
    - Shared goal setting and tracking
    - Regular check-ins and feedback
    - Social recognition and celebration

    STEP 5 - Recommendation Generation:
    Create specific social engagement strategies:
    - Ideal partner profiles
    - Group formation strategies
    - Accountability system design
    - Community engagement approach
    - Long-term relationship building

    EXAMPLE ANALYSIS:
    User with high trust count and consistent habits:
    - Compatibility Score: 8 (high trust and reliability)
    - Influence Level: high (respected community member)
    - Group Dynamics: "Strong potential as accountability partner for struggling members"
    - Recommendations: ["Form accountability partnership with 1-2 struggling members", "Lead group challenges"]

    OUTPUT FORMAT (STRICT JSON):
    {
      "compatibilityScore": <1-10 integer>,
      "influenceLevel": "<high|medium|low>",
      "groupDynamics": "<detailed analysis of social position and potential>",
      "recommendations": [
        "<specific recommendation 1>",
        "<specific recommendation 2>",
        "<specific recommendation 3>"
      ],
      "idealPartnerProfile": "<description of best accountability partner>",
      "socialOpportunities": [
        "<specific social opportunity 1>",
        "<specific social opportunity 2>"
      ],
      "riskFactors": [
        "<potential social risk 1>",
        "<potential social risk 2>"
      ],
      "confidence": <0-1 decimal>
    }

    CRITICAL REQUIREMENTS:
    ✓ Compatibility score based on actual user data
    ✓ Influence level reflects community position
    ✓ Recommendations must be specific and actionable
    ✓ Consider personality and communication styles
    ✓ Account for trust levels and social capital
    ✓ Return ONLY valid JSON

    VALIDATION CHECKLIST:
    ✓ All scores within valid ranges
    ✓ Recommendations are specific and actionable
    ✓ Analysis considers user's current social position
    ✓ Suggestions align with habit formation goals
    ✓ JSON syntax is valid and complete
    `;

    const response = await this.perplexityClient.generateResponse(prompt);
    
    try {
      const analysis = JSON.parse(response);
      return {
        id: `group_${Date.now()}`,
        groupId: groups[0]?.id || 'default',
        userId: userContext.user.id,
        discordId: userContext.user.discord_id,
        compatibilityScore: analysis.compatibilityScore || 5,
        influenceLevel: analysis.influenceLevel || 'medium',
        groupDynamics: analysis.groupDynamics || 'Standard group dynamics',
        recommendations: analysis.recommendations || [],
        performance: 'good' as any,
        dynamics: analysis.groupDynamics || 'Standard group dynamics' as any,
        compatibility: analysis.compatibilityScore || 5 as any,
        risks: [] as any,
        createdAt: new Date().toISOString()
      } as any;
    } catch (error) {
      return {
        id: `group_${Date.now()}`,
        groupId: groups[0]?.id || 'default',
        userId: userContext.user.id,
        discordId: userContext.user.discord_id,
        compatibilityScore: 5,
        influenceLevel: 'medium',
        groupDynamics: response,
        recommendations: ['Join accountability groups', 'Find habit buddies'],
        performance: 'good' as any,
        dynamics: response as any,
        compatibility: 5 as any,
        risks: [] as any,
        createdAt: new Date().toISOString()
      };
    }
  }

  private async generateGroupRecommendations(
    userContext: UserContext, 
    analysis: GroupAnalysis
  ): Promise<string[]> {
    const prompt = `
    Generate specific group and social recommendations based on the group analysis.

    Analysis:
    - Compatibility Score: ${analysis.compatibilityScore}/10
    - Influence Level: ${analysis.influenceLevel}
    - Group Dynamics: ${analysis.groupDynamics}

    User Context:
    - Current Habits: ${userContext.current_habits.map(h => h.name).join(', ')}
    - Trust Count: ${userContext.user.trust_count}

    Generate 3-5 specific recommendations for:
    1. Group formation strategies
    2. Social accountability opportunities
    3. Peer support mechanisms
    4. Collaborative goal setting
    5. Community engagement

    Each recommendation should be actionable and specific to their situation.
    `;

    const response = await this.perplexityClient.generateResponse(prompt);
    return response.split('\n').filter(line => line.trim().length > 0);
  }

  private async storeGroupAnalysis(analysis: GroupAnalysis): Promise<void> {
    // This would be implemented in NotionClient
    this.log('info', 'Group analysis completed', { 
      userId: analysis.userId,
      compatibilityScore: analysis.compatibilityScore,
      influenceLevel: analysis.influenceLevel
    });
  }

  private formatGroupResponse(analysis: GroupAnalysis, recommendations: string[]): string {
    return `
👥 **Group Dynamics Analysis**

**Your Social Profile:**
• Compatibility Score: ${analysis.compatibilityScore}/10
• Influence Level: ${analysis.influenceLevel}
• Group Dynamics: ${analysis.groupDynamics}

**Social Recommendations:**
${recommendations.map((rec, index) => `${index + 1}. ${rec}`).join('\n')}

*These recommendations will help you build a supportive community around your habits and leverage social accountability for better success.*
    `.trim();
  }

  async healthCheck(): Promise<boolean> {
    try {
      if (!PerplexityClient.isAvailable()) {
        return false;
      }
      return true;
    } catch (error) {
      return false;
    }
  }

  async cleanup(): Promise<void> {
    this.log('info', 'Group Agent cleanup completed');
  }
}
