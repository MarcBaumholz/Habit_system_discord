/**
 * Mentor Agent - Provides personalized habit coaching and feedback
 * Uses Pydantic AI with Perplexity for intelligent habit analysis
 */

import { BaseAgent } from '../base/agent';
import { 
  UserContext, 
  AgentResponse, 
  MentorResponse,
  HabitAnalysis,
  PatternInsight,
  CoachingAdvice,
  ProgressAssessment,
  SuccessPattern,
  FailurePattern,
  OptimalConditions
} from '../base/types';
import { PerplexityClient } from '../../ai/perplexity-client';
import { NotionClient } from '../../notion/client';

export class MentorAgent extends BaseAgent {
  private perplexityClient: PerplexityClient;
  private notionClient: NotionClient;
  private readonly MARC_CHANNEL_ID = '1422681618304471131'; // Marc's channel

  constructor(perplexityClient: PerplexityClient, notionClient: NotionClient) {
    super('mentor', 'Mentor Agent', [
      'habit_analysis',
      'pattern_recognition', 
      'coaching_advice',
      'progress_assessment',
      'feedback_generation'
    ]);
    
    this.perplexityClient = perplexityClient;
    this.notionClient = notionClient;
  }

  async initialize(): Promise<void> {
    this.log('info', 'Initializing Mentor Agent');
    
    // Verify Perplexity API is available
    if (!PerplexityClient.isAvailable()) {
      throw new Error('Perplexity API key not available');
    }
    
    this.log('info', 'Mentor Agent initialized successfully');
  }

  async cleanup(): Promise<void> {
    this.log('info', 'Cleaning up Mentor Agent');
    // Cleanup resources if needed
  }

  async processRequest(
    userContext: UserContext, 
    request: string, 
    metadata?: Record<string, any>
  ): Promise<AgentResponse> {
    const startTime = Date.now();
    
    try {
      this.validateUserContext(userContext);

      this.log('info', `Processing mentor request for user ${userContext.user.name}`, {
        request: request.substring(0, 100),
        user_id: userContext.user.id
      });

      // Determine request type and route accordingly
      const requestType = this.classifyRequest(request);
      let response: MentorResponse;

      switch (requestType) {
        case 'weekly_analysis':
          response = await this.performWeeklyAnalysis(userContext);
          break;
        case 'habit_feedback':
          response = await this.provideHabitFeedback(userContext, request);
          break;
        case 'pattern_analysis':
          response = await this.analyzeHabitPatterns(userContext);
          break;
        case 'coaching_advice':
          response = await this.provideCoachingAdvice(userContext, request);
          break;
        default:
          response = await this.provideGeneralCoaching(userContext, request);
      }

      const responseTime = Date.now() - startTime;
      this.updateMetrics(responseTime, true);

      this.log('info', 'Mentor request processed successfully', {
        response_time: responseTime,
        confidence: response.confidence
      });

      return response;

    } catch (error) {
      const responseTime = Date.now() - startTime;
      this.updateMetrics(responseTime, false);
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      this.log('error', 'Failed to process mentor request', {
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
  // REQUEST CLASSIFICATION
  // ============================================================================

  private classifyRequest(request: string): string {
    const lowerRequest = request.toLowerCase();
    
    if (lowerRequest.includes('weekly') || lowerRequest.includes('week') || lowerRequest.includes('summary')) {
      return 'weekly_analysis';
    } else if (lowerRequest.includes('habit') && (lowerRequest.includes('feedback') || lowerRequest.includes('analysis'))) {
      return 'habit_feedback';
    } else if (lowerRequest.includes('pattern') || lowerRequest.includes('trend')) {
      return 'pattern_analysis';
    } else if (lowerRequest.includes('advice') || lowerRequest.includes('help') || lowerRequest.includes('coaching')) {
      return 'coaching_advice';
    }
    
    return 'general_coaching';
  }

  // ============================================================================
  // CORE MENTOR FUNCTIONS
  // ============================================================================

  private async performWeeklyAnalysis(userContext: UserContext): Promise<MentorResponse> {
    this.log('info', 'Performing weekly analysis', { user_id: userContext.user.id });

    // Get recent proofs for analysis
    const recentProofs = userContext.recent_proofs.filter(proof => {
      const proofDate = new Date(proof.date);
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      return proofDate >= weekAgo;
    });

    // Analyze habit patterns
    const habitAnalysis = await this.analyzeHabitsForWeek(userContext.current_habits, recentProofs);
    
    // Generate insights
    const patternInsights = await this.extractPatternInsights(userContext, recentProofs);
    
    // Provide coaching advice
    const coachingAdvice = await this.generateCoachingAdvice(userContext, habitAnalysis);
    
    // Assess progress
    const progressAssessment = await this.assessProgress(userContext, recentProofs);

    const prompt = this.generateContextualPrompt(
      `ROLE: Senior habit formation mentor with expertise in behavioral psychology (BJ Fogg, James Clear), data-driven coaching, and pattern recognition.

TASK: Provide comprehensive weekly habit analysis with actionable insights.

COMPREHENSIVE WEEKLY DATA:

=== PERFORMANCE METRICS ===
- Habits Tracked: ${userContext.current_habits.length}
- Recent Completions: ${recentProofs.filter(p => p.completed).length}/${recentProofs.length}
- Current Streak: ${userContext.weekly_summary?.current_streak || 0} days
- Completion Rate: ${userContext.weekly_summary?.completion_rate || 0}%
- Best Streak This Week: ${recentProofs.length > 0 ? recentProofs.filter(p => p.completed).length : 0} days

=== HABIT BREAKDOWN ===
${userContext.current_habits.map(habit => {
  const habitProofs = recentProofs.filter(p => p.habit_id === habit.id);
  const habitRate = habitProofs.length > 0 ? Math.round((habitProofs.filter(p => p.completed).length / habitProofs.length) * 100) : 0;
  return `- ${habit.name}: ${habitRate}% completion (${habitProofs.filter(p => p.completed).length}/${habitProofs.length})`;
}).join('\n')}

=== TEMPORAL PATTERNS ===
- Morning Completions: ${recentProofs.filter(p => p.completion_time && p.completion_time < 12).length}
- Afternoon Completions: ${recentProofs.filter(p => p.completion_time && p.completion_time >= 12 && p.completion_time < 18).length}
- Evening Completions: ${recentProofs.filter(p => p.completion_time && p.completion_time >= 18).length}

ANALYSIS FRAMEWORK (Follow each step):

STEP 1 - Performance Assessment:
Overall Rating: <Excellent|Good|Moderate|Needs Attention|Critical>
Rationale: <based on completion rate, consistency, and trend>

STEP 2 - Success Pattern Recognition:
Identify what worked:
- Specific days/habits that succeeded
- Common success factors (time, environment, etc.)
- Repeatable patterns from previous weeks
Evidence: <cite specific data points>

STEP 3 - Challenge Identification:
Identify what didn't work:
- Missed habits and root causes
- Patterns in failures
- External vs internal factors
Evidence: <cite specific data points>

STEP 4 - Root Cause Analysis:
Primary issue: <motivation|environment|timing|habit_design|external_factors>
Supporting evidence: <3 specific data points>
Confidence: <0-1>

STEP 5 - Coaching Strategy Development:
For each identified issue:
1. Issue: <specific problem>
2. Impact: <effect on goals>
3. Action: <concrete, specific, measurable>
4. Expected outcome: <what will improve>
5. Timeline: <when to see results>

STEP 6 - Next Week Planning:
- Top Priority: <single most important focus>
- Quick Win: <easy change for immediate success>
- Experiment: <one thing to try>

EXAMPLE INSIGHTS:
"Your morning habits show 90% success rate, while evening habits only 40%. This suggests energy management is key. Consider moving challenging habits to morning when willpower is highest."

OUTPUT FORMAT:
Provide structured analysis covering:
1. **Weekly Assessment** (2-3 sentences)
2. **What Worked** (specific successes with data)
3. **What Didn't Work** (specific challenges with evidence)
4. **Root Cause** (primary issue with supporting data)
5. **Next Week Strategy** (3 actionable items)
6. **Encouragement** (personal, specific, genuine)

CRITICAL REQUIREMENTS:
✓ Every insight must cite specific data
✓ Every recommendation must be measurable
✓ Consider personality type in advice
✓ Match communication style to user
✓ Focus on patterns, not isolated events
✓ Provide hope and forward momentum`,
      userContext,
      { analysis_type: 'weekly', recent_proofs: recentProofs.length }
    );

    const aiResponse = await this.perplexityClient.generateResponse(prompt);
    
    return {
      success: true,
      message: this.formatWeeklyAnalysis(aiResponse, habitAnalysis),
      confidence: this.calculateConfidence(0.8, 0.7, 0.6),
      habit_analysis: habitAnalysis,
      pattern_insights: patternInsights,
      coaching_advice: coachingAdvice,
      progress_assessment: progressAssessment,
      recommendations: [],
      insights: patternInsights.map(pi => ({
        id: `insight_${Date.now()}`,
        category: 'pattern' as const,
        insight: pi.description,
        confidence: pi.confidence,
        supporting_evidence: pi.implications,
        applicability: 'individual' as const,
        actionable: true
      })),
      next_steps: coachingAdvice.map(ca => ca.message),
      metadata: {
        analysis_type: 'weekly',
        habits_analyzed: userContext.current_habits.length,
        proofs_analyzed: recentProofs.length
      },
      timestamp: new Date()
    };
  }

  private async provideHabitFeedback(userContext: UserContext, request: string): Promise<MentorResponse> {
    this.log('info', 'Providing habit feedback', { user_id: userContext.user.id });

    const prompt = this.generateContextualPrompt(
      `You are a habit coach providing specific feedback on the user's habits. 

User Request: ${request}

Focus on:
1. Specific habit performance analysis
2. What's working well
3. Areas for improvement
4. Practical suggestions
5. Motivation and encouragement

Be specific and actionable in your feedback.`,
      userContext,
      { request_type: 'habit_feedback' }
    );

    const aiResponse = await this.perplexityClient.generateResponse(prompt);
    
    return {
      success: true,
      message: aiResponse,
      confidence: this.calculateConfidence(0.7, 0.6, 0.7),
      habit_analysis: await this.analyzeHabitsForWeek(userContext.current_habits, userContext.recent_proofs),
      pattern_insights: [],
      coaching_advice: [],
      progress_assessment: await this.assessProgress(userContext, userContext.recent_proofs),
      recommendations: [],
      insights: [],
      next_steps: [],
      metadata: { request_type: 'habit_feedback' },
      timestamp: new Date()
    };
  }

  private async analyzeHabitPatterns(userContext: UserContext): Promise<MentorResponse> {
    this.log('info', 'Analyzing habit patterns', { user_id: userContext.user.id });

    const patterns = await this.extractPatternInsights(userContext, userContext.recent_proofs);
    const habitAnalysis = await this.analyzeHabitsForWeek(userContext.current_habits, userContext.recent_proofs);

    const prompt = this.generateContextualPrompt(
      `You are a habit coach analyzing patterns in the user's behavior. Identify key patterns that are helping or hindering their habit success.

Analyze:
1. Success patterns - what conditions lead to habit completion
2. Failure patterns - what leads to missed habits
3. Timing patterns - when habits work best
4. Environmental patterns - where habits succeed
5. Energy/mood patterns - how these affect habits

Provide actionable insights based on these patterns.`,
      userContext,
      { analysis_type: 'pattern' }
    );

    const aiResponse = await this.perplexityClient.generateResponse(prompt);

    return {
      success: true,
      message: aiResponse,
      confidence: this.calculateConfidence(0.8, 0.9, 0.6),
      habit_analysis: habitAnalysis,
      pattern_insights: patterns,
      coaching_advice: [],
      progress_assessment: await this.assessProgress(userContext, userContext.recent_proofs),
      recommendations: [],
      insights: patterns.map(pi => ({
        id: `pattern_${Date.now()}`,
        category: 'pattern' as const,
        insight: pi.description,
        confidence: pi.confidence,
        supporting_evidence: pi.implications,
        applicability: 'individual' as const,
        actionable: true
      })),
      next_steps: patterns.flatMap(pi => pi.recommendations),
      metadata: { analysis_type: 'pattern' },
      timestamp: new Date()
    };
  }

  private async provideCoachingAdvice(userContext: UserContext, request: string): Promise<MentorResponse> {
    this.log('info', 'Providing coaching advice', { user_id: userContext.user.id });

    const prompt = this.generateContextualPrompt(
      `You are an expert habit coach providing personalized advice. The user has asked for coaching help.

User Request: ${request}

Provide:
1. Specific, actionable advice
2. Strategies that match their personality and situation
3. Practical steps they can take immediately
4. Motivation and encouragement
5. Follow-up suggestions

Be empathetic, practical, and encouraging.`,
      userContext,
      { request_type: 'coaching' }
    );

    const aiResponse = await this.perplexityClient.generateResponse(prompt);

    return {
      success: true,
      message: aiResponse,
      confidence: this.calculateConfidence(0.8, 0.7, 0.8),
      habit_analysis: await this.analyzeHabitsForWeek(userContext.current_habits, userContext.recent_proofs),
      pattern_insights: [],
      coaching_advice: [{
        advice_type: 'general_coaching',
        message: aiResponse,
        urgency: 'medium' as const,
        actionable: true,
        expected_impact: 'Improved habit consistency'
      }],
      progress_assessment: await this.assessProgress(userContext, userContext.recent_proofs),
      recommendations: [],
      insights: [],
      next_steps: [],
      metadata: { request_type: 'coaching' },
      timestamp: new Date()
    };
  }

  private async provideGeneralCoaching(userContext: UserContext, request: string): Promise<MentorResponse> {
    this.log('info', 'Providing general coaching', { user_id: userContext.user.id });

    const prompt = this.generateContextualPrompt(
      `You are a supportive habit coach. The user has reached out for help with their habits.

User Message: ${request}

Provide helpful, encouraging, and practical guidance. Be specific about what they can do to improve their habit success.`,
      userContext,
      { request_type: 'general' }
    );

    const aiResponse = await this.perplexityClient.generateResponse(prompt);

    return {
      success: true,
      message: aiResponse,
      confidence: this.calculateConfidence(0.7, 0.6, 0.7),
      habit_analysis: await this.analyzeHabitsForWeek(userContext.current_habits, userContext.recent_proofs),
      pattern_insights: [],
      coaching_advice: [],
      progress_assessment: await this.assessProgress(userContext, userContext.recent_proofs),
      recommendations: [],
      insights: [],
      next_steps: [],
      metadata: { request_type: 'general' },
      timestamp: new Date()
    };
  }

  // ============================================================================
  // ANALYSIS HELPERS
  // ============================================================================

  private async analyzeHabitsForWeek(habits: any[], proofs: any[]): Promise<HabitAnalysis[]> {
    const analyses: HabitAnalysis[] = [];

    for (const habit of habits) {
      const habitProofs = proofs.filter(p => p.habit_id === habit.id);
      const completedProofs = habitProofs.filter(p => p.completed);
      
      const successRate = habitProofs.length > 0 ? completedProofs.length / habitProofs.length : 0;
      const currentStreak = this.calculateCurrentStreak(habitProofs);
      const bestStreak = habit.best_streak || 0;

      const optimalConditions = await this.analyzeOptimalConditions(completedProofs);
      const successPatterns = await this.identifySuccessPatterns(completedProofs);
      const failurePatterns = await this.identifyFailurePatterns(habitProofs.filter(p => !p.completed));

      analyses.push({
        habit_id: habit.id,
        success_rate: successRate,
        current_streak: currentStreak,
        best_streak: bestStreak,
        optimal_conditions: optimalConditions,
        failure_patterns: failurePatterns,
        success_patterns: successPatterns
      });
    }

    return analyses;
  }

  private async extractPatternInsights(userContext: UserContext, proofs: any[]): Promise<PatternInsight[]> {
    // Analyze patterns in the data
    const timePatterns = this.analyzeTimePatterns(proofs);
    const energyPatterns = this.analyzeEnergyPatterns(proofs);
    const contextPatterns = this.analyzeContextPatterns(proofs);

    return [
      {
        pattern_name: 'Time Patterns',
        description: timePatterns.description,
        confidence: timePatterns.confidence,
        implications: timePatterns.implications,
        recommendations: timePatterns.recommendations
      },
      {
        pattern_name: 'Energy Patterns',
        description: energyPatterns.description,
        confidence: energyPatterns.confidence,
        implications: energyPatterns.implications,
        recommendations: energyPatterns.recommendations
      },
      {
        pattern_name: 'Context Patterns',
        description: contextPatterns.description,
        confidence: contextPatterns.confidence,
        implications: contextPatterns.implications,
        recommendations: contextPatterns.recommendations
      }
    ];
  }

  private async generateCoachingAdvice(userContext: UserContext, habitAnalysis: HabitAnalysis[]): Promise<CoachingAdvice[]> {
    const advice: CoachingAdvice[] = [];

    // Generate advice based on habit analysis
    for (const analysis of habitAnalysis) {
      if (analysis.success_rate < 0.7) {
        advice.push({
          advice_type: 'improvement_focus',
          message: `Focus on improving ${analysis.habit_id} - current success rate is ${Math.round(analysis.success_rate * 100)}%`,
          urgency: analysis.success_rate < 0.5 ? 'high' : 'medium',
          actionable: true,
          expected_impact: 'Increased habit consistency'
        });
      }

      if (analysis.failure_patterns.length > 0) {
        advice.push({
          advice_type: 'failure_prevention',
          message: `Address common failure patterns in ${analysis.habit_id}`,
          urgency: 'medium',
          actionable: true,
          expected_impact: 'Reduced habit failures'
        });
      }
    }

    return advice;
  }

  private async assessProgress(userContext: UserContext, proofs: any[]): Promise<ProgressAssessment> {
    const recentProofs = proofs.filter(p => {
      const proofDate = new Date(p.date);
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      return proofDate >= weekAgo;
    });

    const completionRate = recentProofs.length > 0 ? 
      recentProofs.filter(p => p.completed).length / recentProofs.length : 0;

    const weeklyTrend = this.calculateWeeklyTrend(proofs);
    const achievements = this.identifyAchievements(recentProofs);
    const improvements = this.identifyImprovementAreas(userContext.current_habits, recentProofs);

    return {
      overall_progress: completionRate,
      weekly_trend: weeklyTrend,
      key_achievements: achievements,
      areas_for_improvement: improvements,
      next_milestones: this.generateNextMilestones(userContext, completionRate)
    };
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  private formatWeeklyAnalysis(aiResponse: string, habitAnalysis: HabitAnalysis[]): string {
    let formatted = `## 📊 Weekly Habit Analysis\n\n${aiResponse}\n\n`;
    
    if (habitAnalysis.length > 0) {
      formatted += `### 📈 Habit Performance Summary:\n`;
      habitAnalysis.forEach(analysis => {
        formatted += `- **${analysis.habit_id}**: ${Math.round(analysis.success_rate * 100)}% success rate, ${analysis.current_streak} day streak\n`;
      });
    }

    return formatted;
  }

  private calculateCurrentStreak(proofs: any[]): number {
    // Simple streak calculation - can be enhanced
    let streak = 0;
    const sortedProofs = proofs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    for (const proof of sortedProofs) {
      if (proof.completed) {
        streak++;
      } else {
        break;
      }
    }
    
    return streak;
  }

  private async analyzeOptimalConditions(proofs: any[]): Promise<OptimalConditions> {
    if (proofs.length === 0) {
      return {
        best_time: 'Not enough data',
        best_duration: 0,
        best_environment: [],
        best_context: 'Not enough data',
        energy_level: 'Not enough data',
        mood: 'Not enough data'
      };
    }

    // Analyze patterns in successful completions
    const times = proofs.map(p => p.completion_time).filter(t => t);
    const durations = proofs.map(p => p.duration).filter(d => d);
    const energyLevels = proofs.map(p => p.energy_level).filter(e => e);
    const moods = proofs.map(p => p.mood).filter(m => m);

    return {
      best_time: this.findMostCommon(times) || 'Not specified',
      best_duration: durations.length > 0 ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length) : 0,
      best_environment: this.findMostCommonEnvironments(proofs),
      best_context: 'Based on successful completions',
      energy_level: this.findMostCommon(energyLevels) || 'Not specified',
      mood: this.findMostCommon(moods) || 'Not specified'
    };
  }

  private async identifySuccessPatterns(proofs: any[]): Promise<SuccessPattern[]> {
    // Identify patterns in successful habit completions
    const patterns: SuccessPattern[] = [];

    if (proofs.length >= 3) {
      patterns.push({
        pattern_type: 'Consistency',
        frequency: proofs.length,
        conditions: ['Regular completion'],
        confidence: 0.8,
        description: `Consistent completion over ${proofs.length} instances`
      });
    }

    return patterns;
  }

  private async identifyFailurePatterns(proofs: any[]): Promise<FailurePattern[]> {
    // Identify patterns in failed habit attempts
    const patterns: FailurePattern[] = [];

    if (proofs.length >= 2) {
      patterns.push({
        pattern_type: 'Inconsistent Timing',
        frequency: proofs.length,
        triggers: ['Irregular schedule'],
        confidence: 0.6,
        description: `Missed habits due to timing issues`,
        suggested_solutions: ['Set specific time blocks', 'Use reminders', 'Create morning routine']
      });
    }

    return patterns;
  }

  private analyzeTimePatterns(proofs: any[]): any {
    const completedProofs = proofs.filter(p => p.completed);
    const times = completedProofs.map(p => p.completion_time).filter(t => t);

    if (times.length < 2) {
      return {
        description: 'Not enough data for time pattern analysis',
        confidence: 0.1,
        implications: ['Need more data to identify time patterns'],
        recommendations: ['Continue tracking completion times']
      };
    }

    const morningCount = times.filter(t => t < 12).length;
    const afternoonCount = times.filter(t => t >= 12 && t < 18).length;
    const eveningCount = times.filter(t => t >= 18).length;

    let bestTime = 'morning';
    if (afternoonCount > morningCount && afternoonCount > eveningCount) {
      bestTime = 'afternoon';
    } else if (eveningCount > morningCount && eveningCount > afternoonCount) {
      bestTime = 'evening';
    }

    return {
      description: `Habits are most successful in the ${bestTime}`,
      confidence: 0.7,
      implications: [`${bestTime} is your optimal habit time`],
      recommendations: [`Schedule habits for ${bestTime}`, `Prepare environment for ${bestTime} habits`]
    };
  }

  private analyzeEnergyPatterns(proofs: any[]): any {
    const completedProofs = proofs.filter(p => p.completed);
    const energyLevels = completedProofs.map(p => p.energy_level).filter(e => e);

    if (energyLevels.length < 2) {
      return {
        description: 'Not enough data for energy pattern analysis',
        confidence: 0.1,
        implications: ['Need more data to identify energy patterns'],
        recommendations: ['Track energy levels with habit completions']
      };
    }

    const highEnergyCount = energyLevels.filter(e => e === 'High').length;
    const mostCommonEnergy = this.findMostCommon(energyLevels);

    return {
      description: `Habits are most successful with ${mostCommonEnergy} energy`,
      confidence: 0.6,
      implications: [`Energy level affects habit success`],
      recommendations: [`Plan habits during high energy times`, `Boost energy before challenging habits`]
    };
  }

  private analyzeContextPatterns(proofs: any[]): any {
    const completedProofs = proofs.filter(p => p.completed);
    const contexts = completedProofs.flatMap(p => p.environmental_context || []);

    if (contexts.length < 2) {
      return {
        description: 'Not enough data for context pattern analysis',
        confidence: 0.1,
        implications: ['Need more data to identify context patterns'],
        recommendations: ['Track environmental context with habits']
      };
    }

    const contextCounts = this.countOccurrences(contexts);
    const bestContext = Object.keys(contextCounts).reduce((a, b) => 
      contextCounts[a] > contextCounts[b] ? a : b
    );

    return {
      description: `Habits are most successful in ${bestContext} environment`,
      confidence: 0.6,
      implications: [`Environment affects habit success`],
      recommendations: [`Optimize ${bestContext} environment`, `Recreate successful conditions`]
    };
  }

  private calculateWeeklyTrend(proofs: any[]): 'improving' | 'stable' | 'declining' {
    // Simple trend calculation - can be enhanced
    const thisWeek = proofs.filter(p => {
      const proofDate = new Date(p.date);
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      return proofDate >= weekAgo;
    });

    const lastWeek = proofs.filter(p => {
      const proofDate = new Date(p.date);
      const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      return proofDate >= twoWeeksAgo && proofDate < weekAgo;
    });

    const thisWeekRate = thisWeek.length > 0 ? thisWeek.filter(p => p.completed).length / thisWeek.length : 0;
    const lastWeekRate = lastWeek.length > 0 ? lastWeek.filter(p => p.completed).length / lastWeek.length : 0;

    if (thisWeekRate > lastWeekRate + 0.1) return 'improving';
    if (thisWeekRate < lastWeekRate - 0.1) return 'declining';
    return 'stable';
  }

  private identifyAchievements(proofs: any[]): string[] {
    const achievements: string[] = [];
    const completedCount = proofs.filter(p => p.completed).length;

    if (completedCount >= 5) {
      achievements.push(`Completed ${completedCount} habits this week`);
    }

    if (completedCount > 0) {
      achievements.push('Maintained consistent habit practice');
    }

    return achievements;
  }

  private identifyImprovementAreas(habits: any[], proofs: any[]): string[] {
    const improvements: string[] = [];
    
    for (const habit of habits) {
      const habitProofs = proofs.filter(p => p.habit_id === habit.id);
      if (habitProofs.length > 0) {
        const successRate = habitProofs.filter(p => p.completed).length / habitProofs.length;
        if (successRate < 0.7) {
          improvements.push(`Improve consistency with ${habit.name}`);
        }
      }
    }

    return improvements;
  }

  private generateNextMilestones(userContext: UserContext, completionRate: number): string[] {
    const milestones: string[] = [];

    if (completionRate < 0.5) {
      milestones.push('Aim for 50% completion rate next week');
    } else if (completionRate < 0.7) {
      milestones.push('Reach 70% completion rate');
    } else {
      milestones.push('Maintain 70%+ completion rate');
    }

    milestones.push('Build a 7-day streak');
    milestones.push('Complete all habits in one day');

    return milestones;
  }

  private findMostCommon(items: any[]): any {
    if (items.length === 0) return null;
    
    const counts = this.countOccurrences(items);
    return Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b);
  }

  private findMostCommonEnvironments(proofs: any[]): string[] {
    const allContexts = proofs.flatMap(p => p.environmental_context || []);
    const contextCounts = this.countOccurrences(allContexts);
    
    return Object.keys(contextCounts)
      .sort((a, b) => contextCounts[b] - contextCounts[a])
      .slice(0, 3);
  }

  private countOccurrences(items: any[]): Record<string, number> {
    return items.reduce((acc, item) => {
      acc[item] = (acc[item] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }
}
