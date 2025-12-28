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
  OptimalConditions,
  MultiWeekTrendAnalysis,
  AdaptiveGoalRecommendation,
  RecommendedChange,
  Habit
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
          response = await this.performWeeklyAnalysis(userContext, metadata);
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

  private async performWeeklyAnalysis(userContext: UserContext, metadata?: Record<string, any>): Promise<MentorResponse> {
    this.log('info', 'Performing weekly analysis', { user_id: userContext.user.id });

    // Get recent proofs for analysis (last 7 days for weekly summary)
    const recentProofs = userContext.recent_proofs.filter(proof => {
      const proofDate = new Date(proof.date);
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      return proofDate >= weekAgo;
    });

    // Get proofs for last 4 weeks (28 days) for multi-week trend analysis
    const fourWeeksAgo = new Date(Date.now() - 28 * 24 * 60 * 60 * 1000);
    const allProofsFor4Weeks = userContext.recent_proofs.filter(proof => {
      const proofDate = new Date(proof.date);
      return proofDate >= fourWeeksAgo;
    });

    // Get buddy progress if provided
    const buddyProgress = metadata?.buddyProgress as any;

    // Analyze habit patterns for the current week
    const habitAnalysis = await this.analyzeHabitsForWeek(userContext.current_habits, recentProofs);

    // Generate adaptive goals recommendations (basic, single-week)
    const adaptiveGoalsRecommendations = this.generateAdaptiveGoalsRecommendations(
      habitAnalysis,
      userContext.current_habits
    );

    // NEW: Analyze multi-week trends for flow state adaptive recommendations
    const multiWeekTrends = this.analyzeMultiWeekTrends(userContext, allProofsFor4Weeks, 4);

    // NEW: Generate specific adaptive recommendations based on 4-week trends
    const specificAdaptiveRecommendations = this.generateSpecificAdaptiveRecommendations(
      userContext.current_habits,
      multiWeekTrends
    );
    
    // Generate insights
    const patternInsights = await this.extractPatternInsights(userContext, recentProofs);
    
    // Provide coaching advice
    const coachingAdvice = await this.generateCoachingAdvice(userContext, habitAnalysis);
    
    // Assess progress
    const progressAssessment = await this.assessProgress(userContext, recentProofs);

    // Build buddy context section if buddy progress is available
    let buddyContextSection = '';
    if (buddyProgress) {
      buddyContextSection = `

=== YOUR BUDDY'S PROGRESS ===
👥 **Buddy:** ${buddyProgress.nickname}
- Completion Rate: ${buddyProgress.completionRate}%
- Current Streak: ${buddyProgress.currentStreak} days
- Habits Tracked: ${buddyProgress.habits.length}
- Proofs Submitted This Week: ${buddyProgress.proofs.length}
${buddyProgress.habitsWithIssues.length > 0 ? `\n⚠️ **Habits Needing Attention:**\n${buddyProgress.habitsWithIssues.map((issue: any) => `- ${issue.habitName}: ${issue.actualFrequency}/${issue.targetFrequency} (Goal: ${issue.goal})`).join('\n')}` : '\n✅ All habits on track!'}
`;
    }

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
${habitAnalysis.map(analysis => {
  const habit = userContext.current_habits.find(h => h.id === analysis.habit_id);
  const habitName = habit?.name || analysis.habit_id;
  const targetFrequency = analysis.target_frequency ?? 0;
  const actualProofs = analysis.actual_proofs ?? 0;
  const completionRate = analysis.completion_rate ?? 0;
  return `- ${habitName}: ${actualProofs}/${targetFrequency} completed (${Math.round(completionRate)}% of target)`;
}).join('\n')}

=== TEMPORAL PATTERNS ===
- Morning Completions: ${recentProofs.filter(p => p.completion_time && p.completion_time < 12).length}
- Afternoon Completions: ${recentProofs.filter(p => p.completion_time && p.completion_time >= 12 && p.completion_time < 18).length}
- Evening Completions: ${recentProofs.filter(p => p.completion_time && p.completion_time >= 18).length}${buddyContextSection}

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

STEP 7 - Adaptive Goals:
For each habit, evaluate completion rate against target frequency:

If completion rate >= 100%:
- Acknowledge excellent performance
- Suggest: "Consider improving challenge/skill balance - maybe raise your goal a little bit about reaching your habit or make it a little bit more complex"
- Focus on: Skill-challenge balance, progressive difficulty

If completion rate < 80%:
- Identify the gap: Use the actual/target numbers from ADAPTIVE GOALS DATA below (e.g., "You completed X/Y - that's Z% of your goal")
- Ask: "Why couldn't you achieve it? What were the hurdles?"
- Suggest: "Maybe adjust your goal to make it more achievable" or "just your habit to make it more easy for you to achieve"
- Focus on: Reducing barriers, simplifying, understanding obstacles

If completion rate is 80-100%:
- Acknowledge: "You're performing well within the optimal range"
- No changes needed, maintain current goals

ADAPTIVE GOALS DATA:
${adaptiveGoalsRecommendations.map(rec => {
  return `- ${rec.habit_name}: ${rec.completion_rate.toFixed(1)}% completion (${rec.threshold_category})`;
}).join('\n')}

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
7. **Adaptive Goals** (per-habit recommendations based on completion rate thresholds)

CRITICAL REQUIREMENTS:
✓ Every insight must cite specific data
✓ Every recommendation must be measurable
✓ Consider personality type in advice
✓ Match communication style to user
✓ Focus on patterns, not isolated events
✓ Provide hope and forward momentum
${buddyProgress ? `✓ Include a section about your buddy ${buddyProgress.nickname}'s progress and how you can support each other` : ''}`,
      userContext,
      { analysis_type: 'weekly', recent_proofs: recentProofs.length, buddyProgress: buddyProgress ? true : false }
    );

    const aiResponse = await this.perplexityClient.generateResponse(prompt);

    // Format the main weekly analysis
    const mainAnalysis = this.formatWeeklyAnalysis(aiResponse, habitAnalysis, adaptiveGoalsRecommendations);

    // NEW: Format and append the adaptive goals section (Flow State Theory)
    const adaptiveSection = this.formatAdaptiveGoalsSection(specificAdaptiveRecommendations, multiWeekTrends);

    // Combine main analysis with adaptive section at the END
    const fullMessage = mainAnalysis + adaptiveSection;

    return {
      success: true,
      message: fullMessage,
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
        proofs_analyzed: recentProofs.length,
        proofs_analyzed_4_weeks: allProofsFor4Weeks.length,
        adaptive_goals: adaptiveGoalsRecommendations,
        multi_week_trends: multiWeekTrends,
        specific_adaptive_recommendations: specificAdaptiveRecommendations
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

  /**
   * Calculate completion rate for a habit against its target frequency
   * Returns target frequency, actual proofs count, completion rate percentage, and missed count
   */
  private calculateHabitCompletionRate(habit: any, proofs: any[]): {
    targetFrequency: number;
    actualProofs: number;
    completionRate: number;
    missedCount: number;
  } {
    const targetFrequency = habit.frequency || 0;
    
    // Filter proofs for this habit and count completed ones only
    const habitProofs = proofs.filter(p => p.habit_id === habit.id);
    const actualProofs = habitProofs.filter(p => p.completed).length;
    
    // Calculate completion rate as percentage
    const completionRate = targetFrequency > 0 
      ? (actualProofs / targetFrequency) * 100 
      : actualProofs > 0 ? 100 : 0;
    
    // Calculate missed count (can't be negative)
    const missedCount = Math.max(0, targetFrequency - actualProofs);
    
    return {
      targetFrequency,
      actualProofs,
      completionRate,
      missedCount
    };
  }

  private async analyzeHabitsForWeek(habits: any[], proofs: any[]): Promise<HabitAnalysis[]> {
    const analyses: HabitAnalysis[] = [];

    for (const habit of habits) {
      const habitProofs = proofs.filter(p => p.habit_id === habit.id);
      const completedProofs = habitProofs.filter(p => p.completed);
      
      const successRate = habitProofs.length > 0 ? completedProofs.length / habitProofs.length : 0;
      const currentStreak = this.calculateCurrentStreak(habitProofs);
      const bestStreak = habit.best_streak || 0;

      // Calculate completion rate vs target frequency
      const completionData = this.calculateHabitCompletionRate(habit, proofs);

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
        success_patterns: successPatterns,
        target_frequency: completionData.targetFrequency,
        actual_proofs: completionData.actualProofs,
        completion_rate: completionData.completionRate,
        missed_count: completionData.missedCount
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

  /**
   * Generate adaptive goals recommendations based on completion rate thresholds
   * >= 100%: Suggest improving challenge/skill balance, raising goals, or making habits more complex
   * < 80%: Suggest adjusting goals to be easier, ask about hurdles
   * 80-100%: Acknowledge good performance, no changes needed
   */
  private generateAdaptiveGoalsRecommendations(
    habitAnalysis: HabitAnalysis[],
    habits: any[]
  ): Array<{
    habit_id: string;
    habit_name: string;
    completion_rate: number;
    recommendation: string;
    threshold_category: 'high_performer' | 'struggling' | 'optimal_range';
  }> {
    const recommendations: Array<{
      habit_id: string;
      habit_name: string;
      completion_rate: number;
      recommendation: string;
      threshold_category: 'high_performer' | 'struggling' | 'optimal_range';
    }> = [];

    for (const analysis of habitAnalysis) {
      const habit = habits.find(h => h.id === analysis.habit_id);
      if (!habit) continue;

      const completionRate = analysis.completion_rate ?? 0;
      const targetFrequency = analysis.target_frequency ?? 0;
      const actualProofs = analysis.actual_proofs ?? 0;
      const habitName = habit.name || analysis.habit_id;

      let recommendation: string;
      let thresholdCategory: 'high_performer' | 'struggling' | 'optimal_range';

      if (targetFrequency === 0) {
        // Edge case: no target frequency set
        recommendation = `No target frequency set for ${habitName}. Consider setting a weekly goal.`;
        thresholdCategory = 'optimal_range';
      } else if (completionRate >= 100) {
        // High performer: >= 100% completion
        thresholdCategory = 'high_performer';
        recommendation = `Excellent! You completed ${actualProofs}/${targetFrequency} (${Math.round(completionRate)}% of target). Consider improving your challenge/skill balance - maybe raise your goal a little bit about reaching your habit or make it a little bit more complex to maintain engagement and growth.`;
      } else if (completionRate < 80) {
        // Struggling: < 80% completion
        thresholdCategory = 'struggling';
        recommendation = `You completed ${actualProofs}/${targetFrequency} - that's ${Math.round(completionRate)}% of your goal. Why couldn't you achieve it? What were the hurdles? Maybe adjust your goal to make it more achievable, or just your habit to make it more easy for you to achieve.`;
      } else {
        // Optimal range: 80-100% completion
        thresholdCategory = 'optimal_range';
        recommendation = `You're performing well within the optimal range (${actualProofs}/${targetFrequency} = ${Math.round(completionRate)}% of target). Keep maintaining your current goals - you're in the sweet spot!`;
      }

      recommendations.push({
        habit_id: analysis.habit_id,
        habit_name: habitName,
        completion_rate: completionRate,
        recommendation,
        threshold_category: thresholdCategory
      });
    }

    return recommendations;
  }

  // ============================================================================
  // MULTI-WEEK TREND ANALYSIS (Flow State Theory)
  // ============================================================================

  /**
   * Analyze multi-week trends for all habits
   * Uses 4-week rolling window with weighted averages (recent weeks matter more)
   */
  private analyzeMultiWeekTrends(
    userContext: UserContext,
    allProofs: any[],
    weeksToAnalyze: number = 4
  ): MultiWeekTrendAnalysis[] {
    const analyses: MultiWeekTrendAnalysis[] = [];
    const now = new Date();

    for (const habit of userContext.current_habits) {
      const habitId = habit.id;
      const habitName = habit.name || habitId;
      const targetFrequency = habit.frequency || 1;

      // Calculate completion rate for each of the last N weeks
      const weeklyRates: number[] = [];

      for (let weekOffset = weeksToAnalyze - 1; weekOffset >= 0; weekOffset--) {
        const weekEnd = new Date(now);
        weekEnd.setDate(weekEnd.getDate() - (weekOffset * 7));
        const weekStart = new Date(weekEnd);
        weekStart.setDate(weekStart.getDate() - 7);

        // Filter proofs for this habit in this week
        const weekProofs = allProofs.filter(p => {
          const proofDate = new Date(p.date);
          const proofHabitId = p.habitId || p.habit_id;
          return proofDate >= weekStart &&
                 proofDate < weekEnd &&
                 proofHabitId === habitId;
        });

        const completionRate = (weekProofs.length / targetFrequency) * 100;
        weeklyRates.push(Math.min(completionRate, 150)); // Cap at 150% for outliers
      }

      // Calculate trend metrics
      const trendDirection = this.calculateTrendDirection(weeklyRates);
      const trendMagnitude = this.calculateTrendMagnitude(weeklyRates);
      const weightedAverage = this.calculateWeightedAverage(weeklyRates);
      const flowZone = this.determineFlowZone(weightedAverage);
      const weeksInZone = this.countWeeksInZone(weeklyRates, flowZone);

      analyses.push({
        habit_id: habitId,
        habit_name: habitName,
        weekly_completion_rates: weeklyRates,
        trend_direction: trendDirection,
        trend_magnitude: trendMagnitude,
        flow_zone_status: flowZone,
        weeks_in_current_zone: weeksInZone,
        weighted_average: weightedAverage
      });
    }

    return analyses;
  }

  /**
   * Determine flow zone based on weighted average completion rate
   * Uses flow state theory: too easy = boredom, optimal = engagement, too hard = anxiety
   */
  private determineFlowZone(weightedAverage: number): 'too_easy' | 'optimal' | 'too_hard' {
    if (weightedAverage >= 100) {
      return 'too_easy'; // Consistently exceeding - needs more challenge
    } else if (weightedAverage < 80) {
      return 'too_hard'; // Struggling - needs easier goals
    } else {
      return 'optimal'; // 80-100% is the sweet spot
    }
  }

  /**
   * Calculate weighted average where recent weeks matter more
   * Weights: W1=10%, W2=20%, W3=30%, W4=40%
   */
  private calculateWeightedAverage(weeklyRates: number[]): number {
    if (weeklyRates.length === 0) return 0;

    // Weights increase for more recent weeks
    const weights = [0.1, 0.2, 0.3, 0.4];
    const actualWeights = weights.slice(-weeklyRates.length); // Use last N weights for available weeks

    let weightedSum = 0;
    let weightTotal = 0;

    for (let i = 0; i < weeklyRates.length; i++) {
      const weight = actualWeights[i] || 0.25; // Default equal weight if not enough
      weightedSum += weeklyRates[i] * weight;
      weightTotal += weight;
    }

    return weightTotal > 0 ? weightedSum / weightTotal : 0;
  }

  /**
   * Calculate trend direction based on comparing first half vs second half of weeks
   */
  private calculateTrendDirection(weeklyRates: number[]): 'improving' | 'stable' | 'declining' {
    if (weeklyRates.length < 2) return 'stable';

    const midpoint = Math.floor(weeklyRates.length / 2);
    const firstHalf = weeklyRates.slice(0, midpoint);
    const secondHalf = weeklyRates.slice(midpoint);

    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

    const difference = secondAvg - firstAvg;
    const threshold = 10; // 10% change threshold

    if (difference > threshold) return 'improving';
    if (difference < -threshold) return 'declining';
    return 'stable';
  }

  /**
   * Calculate trend magnitude as percentage change per week
   */
  private calculateTrendMagnitude(weeklyRates: number[]): number {
    if (weeklyRates.length < 2) return 0;

    // Simple linear regression slope
    const n = weeklyRates.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;

    for (let i = 0; i < n; i++) {
      sumX += i;
      sumY += weeklyRates[i];
      sumXY += i * weeklyRates[i];
      sumX2 += i * i;
    }

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    return isNaN(slope) ? 0 : slope;
  }

  /**
   * Count how many consecutive weeks have been in the current zone
   */
  private countWeeksInZone(weeklyRates: number[], currentZone: 'too_easy' | 'optimal' | 'too_hard'): number {
    let count = 0;

    // Count from most recent week backwards
    for (let i = weeklyRates.length - 1; i >= 0; i--) {
      const rate = weeklyRates[i];
      const weekZone = this.determineFlowZone(rate);

      if (weekZone === currentZone) {
        count++;
      } else {
        break;
      }
    }

    return count;
  }

  /**
   * Generate specific adaptive recommendations based on multi-week trends
   */
  private generateSpecificAdaptiveRecommendations(
    habits: any[],
    multiWeekTrends: MultiWeekTrendAnalysis[]
  ): AdaptiveGoalRecommendation[] {
    const recommendations: AdaptiveGoalRecommendation[] = [];

    for (const trend of multiWeekTrends) {
      const habit = habits.find(h => h.id === trend.habit_id);
      if (!habit) continue;

      const recommendation: AdaptiveGoalRecommendation = {
        habit_id: trend.habit_id,
        habit_name: trend.habit_name,
        current_settings: {
          frequency: habit.frequency || 0,
          minimal_dose: habit.minimal_dose || habit.minimalDose || '',
          smart_goal: habit.smart_goal || habit.smartGoal || '',
          context: habit.context || '',
          implementation_intentions: habit.implementation_intentions || habit.implementationIntentions || ''
        },
        recommended_changes: [],
        flow_state_analysis: {
          current_zone: trend.flow_zone_status,
          confidence: this.calculateRecommendationConfidence(trend)
        },
        priority: this.determinePriority(trend)
      };

      // Generate specific recommendations based on flow zone
      if (trend.flow_zone_status === 'too_easy' && trend.weeks_in_current_zone >= 2) {
        const increaseRec = this.generateIncreaseRecommendation(habit, trend);
        if (increaseRec) {
          recommendation.recommended_changes.push(increaseRec);
        }
      } else if (trend.flow_zone_status === 'too_hard' && trend.weeks_in_current_zone >= 2) {
        const decreaseRec = this.generateDecreaseRecommendation(habit, trend);
        if (decreaseRec) {
          recommendation.recommended_changes.push(decreaseRec);
        }
      }

      // Only include if there are changes to recommend OR habit is optimal
      if (recommendation.recommended_changes.length > 0 || trend.flow_zone_status === 'optimal') {
        recommendations.push(recommendation);
      }
    }

    // Sort by priority: high first, then medium, then low
    return recommendations.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }

  /**
   * Generate recommendation to increase challenge for "too easy" habits
   */
  private generateIncreaseRecommendation(habit: any, trend: MultiWeekTrendAnalysis): RecommendedChange | null {
    const currentFrequency = habit.frequency || 1;
    const avgCompletion = trend.weighted_average;

    // Prefer increasing frequency if below 7
    if (currentFrequency < 7) {
      const newFrequency = Math.min(currentFrequency + 1, 7);
      return {
        parameter: 'frequency',
        current_value: currentFrequency,
        recommended_value: newFrequency,
        change_type: 'increase',
        rationale: `You've exceeded your goal for ${trend.weeks_in_current_zone} consecutive weeks (avg ${Math.round(avgCompletion)}%). Time to grow!`
      };
    }

    // If already at 7x/week, suggest improving minimal dose
    const currentMinimalDose = habit.minimal_dose || habit.minimalDose || '';
    if (currentMinimalDose) {
      return {
        parameter: 'minimal_dose',
        current_value: currentMinimalDose,
        recommended_value: `Increase beyond "${currentMinimalDose}"`,
        change_type: 'increase',
        rationale: `Already at max frequency. Consider raising the bar on minimum effort.`
      };
    }

    // Fallback: suggest making SMART goal more ambitious
    const currentSmartGoal = habit.smart_goal || habit.smartGoal || '';
    return {
      parameter: 'smart_goal',
      current_value: currentSmartGoal,
      recommended_value: 'Make more specific or ambitious',
      change_type: 'modify',
      rationale: `You're crushing it! Consider making your goal more challenging.`
    };
  }

  /**
   * Generate recommendation to decrease difficulty for "too hard" habits
   */
  private generateDecreaseRecommendation(habit: any, trend: MultiWeekTrendAnalysis): RecommendedChange | null {
    const currentFrequency = habit.frequency || 1;
    const avgCompletion = trend.weighted_average;

    // Prefer decreasing frequency if above 1
    if (currentFrequency > 1) {
      // Calculate a reasonable decrease based on how far below target
      const reductionFactor = avgCompletion < 50 ? 2 : 1;
      const newFrequency = Math.max(currentFrequency - reductionFactor, 1);
      return {
        parameter: 'frequency',
        current_value: currentFrequency,
        recommended_value: newFrequency,
        change_type: 'decrease',
        rationale: `${Math.round(avgCompletion)}% completion over ${trend.weeks_in_current_zone} weeks suggests the bar is too high. Build momentum first!`
      };
    }

    // If already at 1x/week, suggest simplifying minimal dose
    const currentMinimalDose = habit.minimal_dose || habit.minimalDose || '';
    if (currentMinimalDose) {
      return {
        parameter: 'minimal_dose',
        current_value: currentMinimalDose,
        recommended_value: `Simplify "${currentMinimalDose}"`,
        change_type: 'decrease',
        rationale: `Make the minimum acceptable effort easier to achieve consistently.`
      };
    }

    // Fallback: suggest narrowing context/implementation
    const currentContext = habit.context || '';
    return {
      parameter: 'context',
      current_value: currentContext,
      recommended_value: 'Narrow down when/where to make it easier',
      change_type: 'modify',
      rationale: `Simplify the conditions for when you do this habit.`
    };
  }

  /**
   * Calculate confidence score for a recommendation based on data quality
   */
  private calculateRecommendationConfidence(trend: MultiWeekTrendAnalysis): number {
    let confidence = 0.5; // Base confidence

    // More weeks of data = higher confidence
    if (trend.weekly_completion_rates.length >= 4) confidence += 0.2;
    else if (trend.weekly_completion_rates.length >= 2) confidence += 0.1;

    // More weeks in current zone = higher confidence
    if (trend.weeks_in_current_zone >= 3) confidence += 0.2;
    else if (trend.weeks_in_current_zone >= 2) confidence += 0.1;

    // Stable or clear trend = higher confidence
    if (trend.trend_direction !== 'stable') confidence += 0.1;

    return Math.min(confidence, 1.0);
  }

  /**
   * Determine priority based on how far from optimal and trend direction
   */
  private determinePriority(trend: MultiWeekTrendAnalysis): 'high' | 'medium' | 'low' {
    // Optimal zone is low priority (no changes needed)
    if (trend.flow_zone_status === 'optimal') return 'low';

    // Very far from optimal + declining = high priority
    if (trend.weighted_average < 50 && trend.trend_direction === 'declining') return 'high';
    if (trend.weighted_average > 130 && trend.weeks_in_current_zone >= 3) return 'high';

    // Been in non-optimal zone for a while = medium priority
    if (trend.weeks_in_current_zone >= 2) return 'medium';

    return 'low';
  }

  /**
   * Format the adaptive goals section for Discord output
   */
  private formatAdaptiveGoalsSection(
    recommendations: AdaptiveGoalRecommendation[],
    trends: MultiWeekTrendAnalysis[]
  ): string {
    if (trends.length === 0) {
      return '';
    }

    let output = '\n\n═══════════════════════════════════════\n';
    output += '🎯 **ADAPTIVE GOAL RECOMMENDATIONS**\n';
    output += '═══════════════════════════════════════\n\n';
    output += '*Based on your 4-week performance trends (Flow State Theory)*\n\n';

    // Add 4-week trend summary table
    output += '**📊 4-Week Trend Summary:**\n```\n';
    output += 'Habit            | W1   | W2   | W3   | W4   | Trend | Zone\n';
    output += '-----------------|------|------|------|------|-------|----------\n';

    for (const trend of trends) {
      const habitName = trend.habit_name.substring(0, 15).padEnd(16);
      const rates = trend.weekly_completion_rates.map(r => `${Math.round(r)}%`.padStart(4)).join(' | ');
      const trendIcon = trend.trend_direction === 'improving' ? '↑' :
                        trend.trend_direction === 'declining' ? '↓' : '→';
      const zoneLabel = trend.flow_zone_status === 'too_easy' ? 'Too Easy' :
                        trend.flow_zone_status === 'too_hard' ? 'Too Hard' : 'Optimal';
      output += `${habitName} | ${rates} | ${trendIcon.padStart(5)} | ${zoneLabel}\n`;
    }
    output += '```\n\n';

    // Add specific recommendations for each habit
    for (const rec of recommendations) {
      const zoneEmoji = rec.flow_state_analysis.current_zone === 'too_easy' ? '🚀' :
                        rec.flow_state_analysis.current_zone === 'too_hard' ? '💪' : '✅';
      const zoneName = rec.flow_state_analysis.current_zone === 'too_easy' ? 'TOO EASY' :
                       rec.flow_state_analysis.current_zone === 'too_hard' ? 'TOO HARD' : 'OPTIMAL';
      const trend = trends.find(t => t.habit_id === rec.habit_id);
      const avgRate = trend ? Math.round(trend.weighted_average) : 0;

      output += `${zoneEmoji} **${rec.habit_name}** - ${zoneName} (avg ${avgRate}%)\n`;

      if (rec.flow_state_analysis.current_zone === 'optimal') {
        output += `Keep current settings - you're in the flow zone!\n\n`;
      } else if (rec.recommended_changes.length > 0) {
        for (const change of rec.recommended_changes) {
          output += `**Current:** ${change.parameter} = ${change.current_value}\n`;
          output += `**Recommended:** ${change.parameter} → ${change.recommended_value}\n`;
          output += `**Why:** ${change.rationale}\n\n`;
        }
      }
    }

    // Add flow state theory explanation
    output += '---\n';
    output += '💡 **Flow State Theory:** The goal isn\'t 100% - it\'s 80-100%.\n';
    output += 'Too easy = boredom. Too hard = anxiety. Optimal = engaged growth.\n\n';
    output += '*These are recommendations only. Reply "I want to change my [habit]" or use /edit-habit*\n';

    return output;
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

  private formatWeeklyAnalysis(
    aiResponse: string, 
    habitAnalysis: HabitAnalysis[],
    adaptiveGoalsRecommendations: Array<{
      habit_id: string;
      habit_name: string;
      completion_rate: number;
      recommendation: string;
      threshold_category: 'high_performer' | 'struggling' | 'optimal_range';
    }>
  ): string {
    let formatted = `## 📊 Weekly Habit Analysis\n\n${aiResponse}\n\n`;
    
    if (habitAnalysis.length > 0) {
      formatted += `### 📈 Habit Performance Summary:\n`;
      habitAnalysis.forEach(analysis => {
        const targetFrequency = analysis.target_frequency ?? 0;
        const actualProofs = analysis.actual_proofs ?? 0;
        const completionRate = analysis.completion_rate ?? 0;
        // Find habit name from adaptive goals recommendations if available
        const habitName = adaptiveGoalsRecommendations.find(r => r.habit_id === analysis.habit_id)?.habit_name || analysis.habit_id;
        formatted += `- **${habitName}**: ${actualProofs}/${targetFrequency} completed (${Math.round(completionRate)}% of target), ${analysis.current_streak} day streak\n`;
      });
    }

    // Add Adaptive Goals section
    if (adaptiveGoalsRecommendations.length > 0) {
      formatted += `\n### 🎯 Adaptive Goals Recommendations:\n\n`;
      adaptiveGoalsRecommendations.forEach(rec => {
        const emoji = rec.threshold_category === 'high_performer' ? '🚀' 
          : rec.threshold_category === 'struggling' ? '💪' 
          : '✅';
        formatted += `${emoji} **${rec.habit_name}** (${Math.round(rec.completion_rate)}% completion):\n`;
        formatted += `${rec.recommendation}\n\n`;
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
