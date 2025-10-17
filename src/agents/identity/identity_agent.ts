/**
 * Identity Agent - Personality-based habit recommendations and identity alignment
 * Inspired by Microsoft AutoGen framework principles
 */

import { BaseAgent } from '../base/agent';
import { 
  UserContext, 
  AgentResponse, 
  IdentityAnalysis,
  UserProfile,
  Habit
} from '../base/types';
import { PerplexityClient } from '../../ai/perplexity-client';
import { NotionClient } from '../../notion/client';

export class IdentityAgent extends BaseAgent {
  private perplexityClient: PerplexityClient;
  private notionClient: NotionClient;
  private readonly MARC_CHANNEL_ID = '1422681618304471131'; // Marc's channel

  constructor(perplexityClient: PerplexityClient, notionClient: NotionClient) {
    super('identity', 'Identity Agent', [
      'personality_analysis',
      'habit_identity_matching',
      'identity_evolution_tracking',
      'personality_based_recommendations',
      'identity_alignment_scoring'
    ]);
    
    this.perplexityClient = perplexityClient;
    this.notionClient = notionClient;
  }

  async initialize(): Promise<void> {
    this.log('info', 'Initializing Identity Agent');
    
    if (!PerplexityClient.isAvailable()) {
      throw new Error('Perplexity API key not available');
    }
    
    this.log('info', 'Identity Agent initialized successfully');
  }

  async processRequest(userContext: UserContext, message: string, metadata?: Record<string, any>): Promise<AgentResponse> {
    this.log('info', 'Processing identity analysis request', { userId: userContext.user.id });

    try {
      // Get user profile from Notion
      const userProfile = await this.notionClient.getUserProfileByDiscordId(userContext.user.discord_id);
      
      if (!userProfile) {
      return {
        success: false,
        message: "Please complete your personality profile first using `/onboard` command.",
        data: null,
        agentId: this.agentId,
        confidence: 0,
        timestamp: new Date()
      };
      }

      // Analyze identity and habits
      const identityAnalysis = await this.analyzeIdentityAlignment(userContext, userProfile as any);
      
      // Generate personalized recommendations
      const recommendations = await this.generateIdentityBasedRecommendations(userContext, userProfile as any, identityAnalysis);
      
      // Store analysis in Notion
      await this.storeIdentityAnalysis(identityAnalysis);

      return {
        success: true,
        message: this.formatIdentityResponse(identityAnalysis, recommendations),
        data: {
          analysis: identityAnalysis,
          recommendations: recommendations
        },
        agentId: this.agentId,
        confidence: 0.8,
        timestamp: new Date()
      };

    } catch (error) {
      this.log('error', 'Identity analysis failed', { error: error instanceof Error ? error.message : String(error) });
      return {
        success: false,
        message: "Identity analysis failed. Please try again later.",
        data: null,
        agentId: this.agentId,
        confidence: 0,
        timestamp: new Date()
      };
    }
  }

  private async analyzeIdentityAlignment(userContext: UserContext, userProfile: UserProfile): Promise<IdentityAnalysis> {
    const prompt = `
    ROLE: Expert in identity-based habit formation (James Clear methodology) with 15 years of behavioral psychology experience.

    TASK: Evaluate identity-habit alignment using systematic analysis.

    COMPREHENSIVE USER CONTEXT:
    
    === IDENTITY PROFILE ===
    - Personality Type: ${userProfile.personalityType || 'Not specified'}
    - Core Values: ${userProfile.coreValues?.join(', ') || 'Not specified'}
    - Life Vision: ${userProfile.lifeVision || 'Not specified'}
    - Main Goals: ${userProfile.mainGoals?.join(', ') || 'Not specified'}
    - Life Phase: ${userProfile.lifePhase || 'Not specified'}
    - Desired Identity: ${userProfile.desiredIdentity || 'Not specified'}

    === CURRENT HABITS ===
    ${userContext.current_habits.map(habit => `- ${habit.name}: ${habit.why}`).join('\n')}

    ANALYSIS FRAMEWORK (Follow each step):

    STEP 1 - Personality Analysis:
    Analyze how ${userProfile.personalityType || 'this personality type'} individuals typically form habits:
    - Natural tendencies and strengths
    - Common struggle areas  
    - Optimal habit structures
    - Best motivation triggers

    STEP 2 - Value Alignment Check:
    Compare each current habit against core values:
    ${userProfile.coreValues?.map(v => `- Does habit align with "${v}"? Why/why not?`).join('\n') || '- No core values specified'}

    STEP 3 - Identity Gap Analysis:
    Current identity signals vs. Desired identity (${userProfile.desiredIdentity || 'Not specified'}):
    - What habits support desired identity?
    - What habits conflict with it?
    - What's missing from current habit portfolio?

    STEP 4 - Scoring Framework:
    - Personality Score (1-10): Rate habit-personality fit based on research
    - Alignment Score (1-10): Rate value-habit alignment strength
    - Confidence (0-1): How certain are you based on available data?

    STEP 5 - Recommendation Generation:
    Generate 3 specific habits that would strengthen "${userProfile.desiredIdentity || 'their desired identity'}"

    EXAMPLE OUTPUT:
    {
      "personalityScore": 8,
      "habitAlignmentScore": 6,
      "identityEvolutionStage": "Developing",
      "recommendedHabits": [
        {
          "habit": "Morning journaling for 10 minutes",
          "alignmentReason": "Supports introspective nature and value of self-reflection",
          "implementation": "Place journal by bed, write after waking up",
          "expectedImpact": "Strengthens 'I am a reflective person' identity"
        }
      ],
      "identityInsights": "High conscientiousness aligns with structured habits. Consider identity-based habit formation focusing on 'I am a person who...'",
      "confidenceLevel": 0.8,
      "reasoningSteps": [
        "Personality analysis: Conscientious individuals benefit from routine-based habits",
        "Value alignment: Current habits partially support stated values",
        "Gap analysis: Missing habits that directly reinforce desired identity"
      ]
    }

    CRITICAL OUTPUT REQUIREMENTS:
    - Return ONLY valid JSON, no additional text
    - All scores must be integers 1-10
    - Each habit must be specific and measurable
    - Reasoning must reference actual user data
    - Identity evolution stage: "Forming" | "Developing" | "Established" | "Mastered"

    VALIDATION CHECKLIST:
    ✓ All required fields present
    ✓ Scores within valid ranges
    ✓ Habits are specific and actionable
    ✓ Reasoning aligns with provided data
    ✓ JSON syntax is valid
    `;

    const response = await this.perplexityClient.generateResponse(prompt);
    
    try {
      const analysis = JSON.parse(response);
      return {
        id: `identity_${Date.now()}`,
        userId: userContext.user.id,
        discordId: userContext.user.discord_id,
        personalityScore: analysis.personalityScore || 5,
        habitAlignmentScore: analysis.habitAlignmentScore || 5,
        identityEvolutionStage: analysis.identityEvolutionStage || 'Developing',
        recommendedHabits: analysis.recommendedHabits || [],
        identityInsights: analysis.identityInsights || 'No specific insights available',
        createdAt: new Date().toISOString()
      };
    } catch (error) {
      // Fallback if JSON parsing fails
      return {
        id: `identity_${Date.now()}`,
        userId: userContext.user.id,
        discordId: userContext.user.discord_id,
        personalityScore: 5,
        habitAlignmentScore: 5,
        identityEvolutionStage: 'Developing',
        recommendedHabits: [],
        identityInsights: response,
        createdAt: new Date().toISOString()
      };
    }
  }

  private async generateIdentityBasedRecommendations(
    userContext: UserContext, 
    userProfile: UserProfile, 
    analysis: IdentityAnalysis
  ): Promise<string[]> {
    const prompt = `
    ROLE: Identity-based habit formation specialist focusing on James Clear's methodology.

    TASK: Generate personalized habit recommendations based on comprehensive identity analysis.

    ANALYSIS CONTEXT:
    - Personality Score: ${analysis.personalityScore}/10
    - Habit Alignment Score: ${analysis.habitAlignmentScore}/10
    - Identity Evolution Stage: ${analysis.identityEvolutionStage}
    - Current Insights: ${analysis.identityInsights}

    USER IDENTITY:
    - Core Values: ${userProfile.coreValues?.join(', ') || 'Not specified'}
    - Desired Identity: ${userProfile.desiredIdentity || 'Not specified'}
    - Personality Type: ${userProfile.personalityType || 'Not specified'}
    - Life Phase: ${userProfile.lifePhase || 'Not specified'}

    CURRENT HABITS:
    ${userContext.current_habits.map(h => `- ${h.name}: ${h.why}`).join('\n')}

    RECOMMENDATION FRAMEWORK:

    STEP 1 - Identity Gap Analysis:
    Identify what's missing to fully embody "${userProfile.desiredIdentity || 'their desired identity'}"

    STEP 2 - Personality Optimization:
    Leverage ${userProfile.personalityType || 'their personality type'} strengths for habit success

    STEP 3 - Value Integration:
    Ensure recommendations align with: ${userProfile.coreValues?.join(', ') || 'their core values'}

    STEP 4 - Implementation Design:
    Create specific, measurable, actionable habits with clear identity connections

    EXAMPLE RECOMMENDATION:
    1. **Morning Identity Affirmation (5 minutes)**
       - **Why it aligns**: Directly reinforces desired identity through daily repetition
       - **Implementation**: Write "I am [desired identity]" 10 times each morning
       - **Expected impact**: Strengthens identity belief within 30 days
       - **Personality fit**: Works well for ${userProfile.personalityType || 'most personality types'}

    OUTPUT REQUIREMENTS:
    Generate 3-5 numbered recommendations following this exact format:
    
    1. **[Habit Name]**
       - **Why it aligns**: [Specific reason related to identity/values]
       - **Implementation**: [Concrete, actionable steps]
       - **Expected impact**: [Specific outcome in 30 days]
       - **Personality fit**: [Why this works for their type]

    CRITICAL RULES:
    ✓ Each habit must be specific and measurable
    ✓ Must directly support desired identity
    ✓ Implementation must be actionable within 24 hours
    ✓ Consider current life phase and constraints
    ✓ Reference specific personality traits
    `;

    const response = await this.perplexityClient.generateResponse(prompt);
    return response.split('\n').filter(line => line.trim().length > 0);
  }

  private async storeIdentityAnalysis(analysis: IdentityAnalysis): Promise<void> {
    // This would be implemented in NotionClient
    // For now, we'll log the analysis
    this.log('info', 'Identity analysis completed', { 
      userId: analysis.userId,
      personalityScore: analysis.personalityScore,
      habitAlignmentScore: analysis.habitAlignmentScore
    });
  }

  private formatIdentityResponse(analysis: IdentityAnalysis, recommendations: string[]): string {
    return `
🆔 **Identity Analysis Complete**

**Your Identity Profile:**
• Personality Score: ${analysis.personalityScore}/10
• Habit Alignment: ${analysis.habitAlignmentScore}/10
• Evolution Stage: ${analysis.identityEvolutionStage}

**Key Insights:**
${analysis.identityInsights}

**Identity-Aligned Recommendations:**
${recommendations.map((rec, index) => `${index + 1}. ${rec}`).join('\n')}

*These recommendations are tailored to your personality and values to help you build habits that align with your desired identity.*
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
    this.log('info', 'Identity Agent cleanup completed');
  }
}
