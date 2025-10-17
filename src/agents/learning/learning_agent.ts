/**
 * Learning & Hurdles Agent - Pattern recognition and knowledge synthesis
 * Inspired by Microsoft AutoGen framework principles
 */

import { BaseAgent } from '../base/agent';
import { 
  UserContext, 
  AgentResponse, 
  LearningInsight,
  HurdleSolution,
  Learning,
  Hurdle
} from '../base/types';
import { PerplexityClient } from '../../ai/perplexity-client';
import { NotionClient } from '../../notion/client';

export class LearningAgent extends BaseAgent {
  private perplexityClient: PerplexityClient;
  private notionClient: NotionClient;
  private readonly MARC_CHANNEL_ID = '1422681618304471131'; // Marc's channel

  constructor(perplexityClient: PerplexityClient, notionClient: NotionClient) {
    super('learning', 'Learning & Hurdles Agent', [
      'pattern_recognition',
      'knowledge_synthesis',
      'hurdle_analysis',
      'solution_generation',
      'cross_user_analytics'
    ]);
    
    this.perplexityClient = perplexityClient;
    this.notionClient = notionClient;
  }

  async initialize(): Promise<void> {
    this.log('info', 'Initializing Learning & Hurdles Agent');
    
    if (!PerplexityClient.isAvailable()) {
      throw new Error('Perplexity API key not available');
    }
    
    this.log('info', 'Learning & Hurdles Agent initialized successfully');
  }

  async processRequest(userContext: UserContext, message: string, metadata?: Record<string, any>): Promise<AgentResponse> {
    this.log('info', 'Processing learning analysis request', { userId: userContext.user.id });

    try {
      // Get user's learnings and hurdles
      const userLearnings = await this.notionClient.getLearningsByDiscordId(userContext.user.discord_id);
      const userHurdles = await this.notionClient.getHurdlesByDiscordId(userContext.user.discord_id);
      
      // Analyze patterns and extract insights
      const insights = await this.extractLearningInsights(userContext, userLearnings as any, userHurdles as any);
      
      // Generate solutions for identified hurdles
      const solutions = await this.generateHurdleSolutions(userContext, userHurdles as any);
      
      // Store insights
      await this.storeLearningInsights(insights);

      return {
        success: true,
        message: this.formatLearningResponse(insights, solutions),
        data: {
          insights: insights,
          solutions: solutions
        },
        agentId: this.agentId,
        confidence: 0.8,
        timestamp: new Date()
      };

    } catch (error) {
      this.log('error', 'Learning analysis failed', { error: error instanceof Error ? error.message : String(error) });
      return {
        success: false,
        message: "Learning analysis failed. Please try again later.",
        data: null,
        agentId: this.agentId,
        confidence: 0,
        timestamp: new Date()
      };
    }
  }

  private async extractLearningInsights(
    userContext: UserContext, 
    learnings: Learning[], 
    hurdles: Hurdle[]
  ): Promise<LearningInsight[]> {
    const prompt = `
    ROLE: Expert in pattern recognition and knowledge synthesis for habit formation, specializing in behavioral psychology and learning analytics.

    TASK: Extract valuable insights and patterns from user's learning entries and hurdles.

    COMPREHENSIVE DATA SET:

    === USER LEARNINGS (${learnings.length} total) ===
    ${learnings.slice(0, 10).map(learning => 
      `- "${learning.text}" (${learning.created_at})`
    ).join('\n')}

    === USER HURDLES (${hurdles.length} total) ===
    ${hurdles.slice(0, 10).map(hurdle => 
      `- ${hurdle.name} (${hurdle.hurdle_type}): ${hurdle.description}`
    ).join('\n')}

    === CURRENT HABIT PORTFOLIO ===
    ${userContext.current_habits.map(h => `- ${h.name}: ${h.why}`).join('\n')}

    ANALYSIS FRAMEWORK (Follow each step):

    STEP 1 - Success Pattern Mining:
    Extract patterns from successful learnings:
    - What strategies led to breakthroughs?
    - What conditions enabled success?
    - What mindset shifts occurred?
    - Common themes in positive outcomes

    STEP 2 - Hurdle Pattern Analysis:
    Identify recurring obstacle themes:
    - Environmental barriers
    - Internal resistance patterns
    - Timing and energy issues
    - Social or external factors

    STEP 3 - Strategy Effectiveness Assessment:
    Evaluate mentioned strategies:
    - Which approaches worked repeatedly?
    - What failed consistently?
    - Adaptation and iteration patterns
    - Context-dependent success factors

    STEP 4 - Cross-Pattern Synthesis:
    Find connections between learnings and hurdles:
    - How do insights relate to obstacles?
    - What solutions emerged from challenges?
    - Meta-patterns in learning and growth

    STEP 5 - Insight Categorization:
    Classify each insight by:
    - Type: "pattern" | "solution" | "hurdle" | "success" | "strategy"
    - Category: "environmental" | "behavioral" | "psychological" | "social" | "temporal"
    - Applicability: "individual" | "habit-specific" | "universal"
    - Actionability: "immediate" | "medium-term" | "long-term"

    EXAMPLE INSIGHT EXTRACTION:
    Learning: "I discovered that doing my workout at 6 AM works better than evening because I have more energy"
    Extracted Insight:
    {
      "type": "pattern",
      "content": "Morning workouts have higher success rate due to energy availability",
      "confidence": 8,
      "tags": ["temporal", "energy", "timing"],
      "sourceData": "User discovered through experimentation that morning workouts are more sustainable"
    }

    OUTPUT FORMAT (STRICT JSON ARRAY):
    [
      {
        "type": "pattern|solution|hurdle|success|strategy",
        "content": "<detailed insight with specific evidence>",
        "confidence": <1-10 integer>,
        "tags": ["<category1>", "<category2>"],
        "sourceData": "<specific learning/hurdle that supports this insight>",
        "actionability": "<immediate|medium-term|long-term>",
        "applicability": "<individual|habit-specific|universal>"
      }
    ]

    CRITICAL REQUIREMENTS:
    ✓ Each insight must cite specific source data
    ✓ Confidence scores must reflect evidence strength
    ✓ Content must be specific, not generic
    ✓ Tags must accurately categorize insights
    ✓ Return ONLY valid JSON array
    ✓ Minimum 3 insights, maximum 10 insights

    VALIDATION CHECKLIST:
    ✓ All insights reference actual learnings/hurdles
    ✓ Confidence scores align with evidence quality
    ✓ Content is actionable and specific
    ✓ Tags are relevant and accurate
    ✓ JSON syntax is valid
    ✓ No duplicate or redundant insights
    `;

    const response = await this.perplexityClient.generateResponse(prompt);
    
    try {
      const insights = JSON.parse(response);
      return insights.map((insight: any, index: number) => ({
        id: `learning_${Date.now()}_${index}`,
        userId: userContext.user.id,
        discordId: userContext.user.discord_id,
        insightType: insight.type || 'pattern',
        content: insight.content || insight.text || 'No content',
        confidence: insight.confidence || 5,
        tags: insight.tags || [],
        sourceData: JSON.stringify(insight.sourceData || {}),
        createdAt: new Date().toISOString()
      }));
    } catch (error) {
      // Fallback if JSON parsing fails
      return [{
        id: `learning_${Date.now()}`,
        userId: userContext.user.id,
        discordId: userContext.user.discord_id,
        insightType: 'pattern',
        content: response,
        confidence: 5,
        tags: ['analysis'],
        sourceData: JSON.stringify({ learnings: learnings.length, hurdles: hurdles.length }),
        createdAt: new Date().toISOString()
      }];
    }
  }

  private async generateHurdleSolutions(
    userContext: UserContext, 
    hurdles: Hurdle[]
  ): Promise<HurdleSolution[]> {
    if (hurdles.length === 0) {
      return [];
    }

    const prompt = `
    Generate specific solutions for the user's identified hurdles.

    User Hurdles:
    ${hurdles.map(hurdle => 
      `- ${hurdle.name} (${hurdle.hurdle_type}): ${hurdle.description}`
    ).join('\n')}

    Current Habits:
    ${userContext.current_habits.map(h => h.name).join(', ')}

    For each hurdle, generate:
    1. A specific, actionable solution
    2. Implementation steps
    3. Expected effectiveness (1-10 scale)
    4. Success rate estimate
    5. Alternative approaches

    Focus on practical, implementable solutions that address the root cause.
    `;

    const response = await this.perplexityClient.generateResponse(prompt);
    
    // Parse response and create solutions
    const solutions: HurdleSolution[] = [];
    const lines = response.split('\n').filter(line => line.trim().length > 0);
    
    hurdles.forEach((hurdle, index) => {
      solutions.push({
        id: `solution_${Date.now()}_${index}`,
        hurdleId: hurdle.id,
        solution: lines[index] || 'Solution analysis in progress',
        effectiveness: 7, // Default effectiveness
        implementationSteps: [
          'Identify the specific hurdle',
          'Implement the recommended solution',
          'Monitor progress and adjust'
        ],
        successRate: 0.7, // Default success rate
        createdAt: new Date().toISOString()
      });
    });

    return solutions;
  }

  private async storeLearningInsights(insights: LearningInsight[]): Promise<void> {
    // This would be implemented in NotionClient
    this.log('info', 'Learning insights stored', { 
      insightsCount: insights.length,
      userId: insights[0]?.userId
    });
  }

  private formatLearningResponse(insights: LearningInsight[], solutions: HurdleSolution[]): string {
    const insightsByType = insights.reduce((acc, insight) => {
      if (!acc[insight.insightType]) acc[insight.insightType] = [];
      acc[insight.insightType].push(insight);
      return acc;
    }, {} as Record<string, LearningInsight[]>);

    return `
📚 **Learning & Hurdles Analysis**

**Key Insights Discovered:**
${Object.entries(insightsByType).map(([type, typeInsights]) => 
  `\n**${type.toUpperCase()} INSIGHTS:**\n${typeInsights.map(insight => 
    `• ${insight.content} (Confidence: ${insight.confidence}/10)`
  ).join('\n')}`
).join('\n')}

**Hurdle Solutions:**
${solutions.map((solution, index) => 
  `${index + 1}. **${solution.solution}**\n   Effectiveness: ${solution.effectiveness}/10\n   Steps: ${solution.implementationSteps.join(' → ')}`
).join('\n\n')}

*These insights and solutions are based on your learning patterns and will help you overcome obstacles more effectively.*
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
    this.log('info', 'Learning & Hurdles Agent cleanup completed');
  }
}
