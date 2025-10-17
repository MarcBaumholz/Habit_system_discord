/**
 * Accountability Agent - Adaptive reminders and motivation management
 * Inspired by Microsoft AutoGen framework principles
 */

import { BaseAgent } from '../base/agent';
import { 
  UserContext, 
  AgentResponse, 
  AccountabilitySession,
  Proof,
  Habit
} from '../base/types';
import { PerplexityClient } from '../../ai/perplexity-client';
import { NotionClient } from '../../notion/client';

export class AccountabilityAgent extends BaseAgent {
  private perplexityClient: PerplexityClient;
  private notionClient: NotionClient;
  private readonly MARC_CHANNEL_ID = '1422681618304471131'; // Marc's channel

  constructor(perplexityClient: PerplexityClient, notionClient: NotionClient) {
    super('accountability', 'Accountability Agent', [
      'adaptive_reminders',
      'motivation_management',
      'progress_monitoring',
      'intervention_triggers',
      'celebration_detection'
    ]);
    
    this.perplexityClient = perplexityClient;
    this.notionClient = notionClient;
  }

  async initialize(): Promise<void> {
    this.log('info', 'Initializing Accountability Agent');
    
    if (!PerplexityClient.isAvailable()) {
      throw new Error('Perplexity API key not available');
    }
    
    this.log('info', 'Accountability Agent initialized successfully');
  }

  async processRequest(userContext: UserContext, message: string, metadata?: Record<string, any>): Promise<AgentResponse> {
    this.log('info', 'Processing accountability request', { userId: userContext.user.id });

    try {
      // Analyze user's recent progress and motivation
      const progressAnalysis = await this.analyzeProgress(userContext);
      
      // Determine appropriate intervention
      const intervention = await this.determineIntervention(userContext, progressAnalysis);
      
      // Generate personalized accountability message
      const accountabilityMessage = await this.generateAccountabilityMessage(userContext, intervention);
      
      // Store session
      const session = await this.createAccountabilitySession(userContext, intervention, accountabilityMessage);

      return {
        success: true,
        message: accountabilityMessage,
        data: {
          session: session,
          intervention: intervention,
          progressAnalysis: progressAnalysis
        },
        agentId: this.agentId,
        confidence: 0.8,
        timestamp: new Date()
      };

    } catch (error) {
      this.log('error', 'Accountability analysis failed', { error: error instanceof Error ? error.message : String(error) });
      return {
        success: false,
        message: "Accountability check failed. Please try again later.",
        data: null,
        agentId: this.agentId,
        confidence: 0,
        timestamp: new Date()
      };
    }
  }

  private async analyzeProgress(userContext: UserContext): Promise<any> {
    const prompt = `
    ROLE: Behavioral accountability coach specializing in motivation psychology and habit tracking.

    TASK: Analyze progress and determine appropriate intervention strategy.

    COMPREHENSIVE USER DATA:
    
    === HABIT PORTFOLIO ===
    - Current Habits: ${userContext.current_habits.map(h => h.name).join(', ')}
    - Total Habits: ${userContext.current_habits.length}
    
    === PERFORMANCE METRICS (Last 7 Days) ===
    - Recent Proofs: ${userContext.recent_proofs?.length || 0} submissions
    - Current Streak: ${userContext.current_streak || 0} days
    - Expected Completions: ${userContext.current_habits.length * 7}
    - Completion Rate: ${userContext.recent_proofs?.length || 0} / ${userContext.current_habits.length * 7} = ${Math.round((userContext.recent_proofs?.length || 0) / (userContext.current_habits.length * 7) * 100)}%

    === DETAILED PROOF DATA ===
    ${userContext.recent_proofs?.map(proof => 
      `- ${proof.date}: ${proof.unit} (${proof.is_minimal_dose ? 'Minimal dose' : 'Full'})`
    ).join('\n') || 'No recent proofs'}

    ANALYSIS FRAMEWORK (Follow each step):

    STEP 1 - Consistency Assessment (1-10):
    Evaluate day-to-day variability and regularity:
    - Are proofs distributed evenly across days?
    - Any consecutive missed days?
    - Minimal vs full dose ratio
    Score: ___ (1-10)
    Evidence: ___

    STEP 2 - Motivation Assessment (1-10):
    Indicators from data patterns:
    - Trend direction (improving/stable/declining)
    - Minimal dose frequency (high = low motivation)
    - Proof quality and timing patterns
    Score: ___ (1-10)
    Evidence: ___

    STEP 3 - Risk Factor Detection:
    Identify patterns indicating potential failure:
    - [ ] Consecutive missed days (>2)
    - [ ] Declining completion trend
    - [ ] Increased minimal doses (>50%)
    - [ ] Irregular timing patterns
    - [ ] Low overall completion rate (<50%)

    STEP 4 - Pattern Recognition:
    Success Patterns:
    - Days/times when habits succeed
    - Environmental factors
    - Energy/mood correlations
    
    Struggle Patterns:
    - Common failure points
    - External disruptions
    - Internal resistance

    STEP 5 - Intervention Classification:
    IF consistencyScore < 3 OR motivationLevel < 3:
      Type = "intervention" (urgent support needed)
    ELSE IF streak >= 5 AND consistencyScore >= 8:
      Type = "celebration" (positive reinforcement)
    ELSE IF patterns show decline OR completion rate < 60%:
      Type = "check-in" (gentle nudge)
    ELSE:
      Type = "encouragement" (maintain momentum)

    EXAMPLE OUTPUT:
    {
      "consistencyScore": 6,
      "motivationLevel": 7,
      "riskFactors": [
        {
          "factor": "Irregular timing patterns",
          "evidence": "Proofs submitted at random times without consistency",
          "severity": "medium"
        }
      ],
      "patterns": {
        "positive": ["Higher completion on weekdays", "Consistent morning habits"],
        "negative": ["Weekend drop-off", "Increased minimal doses"]
      },
      "recommendedIntervention": "check-in",
      "confidence": 0.8
    }

    CRITICAL OUTPUT REQUIREMENTS:
    - Return ONLY valid JSON
    - All scores must be integers 1-10
    - Risk factors must cite specific evidence
    - Patterns must reference actual data points
    - Intervention type must match decision logic

    VALIDATION CHECKLIST:
    ✓ Consistency score reflects actual day-to-day variability
    ✓ Motivation score based on trend and minimal dose usage
    ✓ Risk factors cite specific data evidence
    ✓ Intervention type follows logical decision tree
    ✓ JSON syntax is valid and complete
    `;

    const response = await this.perplexityClient.generateResponse(prompt);
    
    try {
      return JSON.parse(response);
    } catch (error) {
      return {
        consistencyScore: 5,
        motivationLevel: 5,
        riskFactors: ['Unknown patterns'],
        patterns: 'Insufficient data',
        recommendedIntervention: 'check_in'
      };
    }
  }

  private async determineIntervention(userContext: UserContext, progressAnalysis: any): Promise<any> {
    const { consistencyScore, motivationLevel, riskFactors, recommendedIntervention } = progressAnalysis;

    // Determine intervention type based on scores
    let interventionType = 'check_in';
    
    if (consistencyScore < 3 || motivationLevel < 3) {
      interventionType = 'intervention';
    } else if (consistencyScore > 8 && motivationLevel > 8) {
      interventionType = 'celebration';
    } else if (recommendedIntervention) {
      interventionType = recommendedIntervention;
    }

    return {
      type: interventionType,
      urgency: consistencyScore < 4 ? 'high' : consistencyScore < 7 ? 'medium' : 'low',
      focus: this.getInterventionFocus(interventionType, riskFactors),
      effectiveness: 0 // Will be updated based on user response
    };
  }

  private getInterventionFocus(interventionType: string, riskFactors: string[]): string {
    switch (interventionType) {
      case 'intervention':
        return 'Addressing motivation and consistency issues';
      case 'celebration':
        return 'Acknowledging success and maintaining momentum';
      case 'reminder':
        return 'Gentle nudge to maintain habit';
      default:
        return 'General check-in and support';
    }
  }

  private async generateAccountabilityMessage(userContext: UserContext, intervention: any): Promise<string> {
    const prompt = `
    ROLE: Empathetic accountability coach with expertise in motivational psychology and habit formation.

    TASK: Generate a personalized accountability message tailored to user's current situation.

    INTERVENTION CONTEXT:
    - User: ${userContext.user.name}
    - Intervention Type: ${intervention.type}
    - Urgency Level: ${intervention.urgency}
    - Focus Area: ${intervention.focus}

    USER HABITS:
    ${userContext.current_habits.map(h => `- ${h.name}`).join('\n')}

    MESSAGE GENERATION FRAMEWORK:

    STEP 1 - Tone Determination:
    ${intervention.type === 'intervention' ? 'URGENT: Firm but supportive, acknowledge difficulty, provide hope' : 
      intervention.type === 'celebration' ? 'CELEBRATORY: Enthusiastic, acknowledge success, maintain momentum' :
      intervention.type === 'check-in' ? 'SUPPORTIVE: Gentle, caring, non-judgmental' :
      'ENCOURAGING: Positive, motivating, forward-looking'}

    STEP 2 - Data Reference:
    MUST include specific data points from their recent performance:
    - Reference actual completion numbers
    - Mention specific habits by name
    - Acknowledge effort shown (even minimal doses)

    STEP 3 - Empathy Expression:
    Show understanding of their situation:
    - Acknowledge challenges without judgment
    - Validate their effort and commitment
    - Recognize that habit formation is difficult

    STEP 4 - Actionable Guidance:
    Provide ONE specific, immediate action they can take:
    - Must be actionable within 24 hours
    - Should address the primary issue identified
    - Must be specific, not generic advice

    STEP 5 - Motivation & Accountability:
    End with appropriate motivation level:
    - ${intervention.urgency === 'high' ? 'Strong accountability with support' : 
       intervention.urgency === 'medium' ? 'Balanced encouragement and accountability' :
       'Gentle motivation and encouragement'}

    EXAMPLE MESSAGES:

    INTERVENTION TYPE:
    "Hey ${userContext.user.name}, I've been tracking your progress and noticed you completed 3 out of 7 expected habits this week. I know this feels discouraging - habit formation is genuinely challenging. Your minimal dose on Tuesday showed real commitment even when motivation was low. For tomorrow, let's focus on just one habit: [specific habit]. Set your alarm 15 minutes earlier and do it before anything else. I believe in your ability to turn this around. What's your plan for tomorrow?"

    CELEBRATION TYPE:
    "Fantastic work, ${userContext.user.name}! You completed 6 out of 7 habits this week - that's 86% success rate! I'm especially impressed by your consistent morning routine and how you used minimal doses strategically on tough days. This shows real mastery of habit flexibility. Keep this momentum going - you're building the identity of someone who follows through. What's one small way you can celebrate this success today?"

    CHECK-IN TYPE:
    "Hi ${userContext.user.name}, I wanted to check in on your habit progress. You've completed 4 out of 7 habits this week - that's solid progress! I noticed you're doing well with [specific habit] but [other habit] has been challenging. How are you feeling about your routine? Is there anything specific making it difficult? Remember, even small steps count. What would help you most right now?"

    CRITICAL MESSAGE REQUIREMENTS:
    ✓ Reference specific data (numbers, habits, dates)
    ✓ Match tone to intervention type and urgency
    ✓ Include one specific, actionable step
    ✓ Show empathy and understanding
    ✓ End with appropriate motivation level
    ✓ Keep conversational and personal
    ✓ 2-4 sentences maximum

    VALIDATION CHECKLIST:
    ✓ No generic phrases like "keep up the good work"
    ✓ Mentions actual performance numbers
    ✓ Provides specific next action
    ✓ Tone matches intervention type
    ✓ Shows genuine empathy
    `;

    return await this.perplexityClient.generateResponse(prompt);
  }

  private async createAccountabilitySession(
    userContext: UserContext, 
    intervention: any, 
    message: string
  ): Promise<AccountabilitySession> {
    const session: AccountabilitySession = {
      id: `accountability_${Date.now()}`,
      userId: userContext.user.id,
      discordId: userContext.user.discord_id,
      sessionType: intervention.type as any,
      message: message,
      effectiveness: 0, // Will be updated based on user response
      createdAt: new Date().toISOString()
    };

    // Store in Notion (would be implemented in NotionClient)
    this.log('info', 'Accountability session created', { 
      sessionId: session.id,
      type: session.sessionType,
      userId: session.userId
    });

    return session;
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
    this.log('info', 'Accountability Agent cleanup completed');
  }
}
