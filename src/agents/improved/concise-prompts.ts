/**
 * Concise Prompt Templates - Notion Style, Bullet Points, Minimal Words
 * Based on chatbot's prompt engineering + your requirement for brevity
 */

export class ConcisePrompts {
  // ============================================================================
  // SYSTEM INSTRUCTIONS - Applied to ALL agents
  // ============================================================================

  static readonly SYSTEM_CONSTRAINTS = `OUTPUT RULES (MANDATORY):
1. Notion markdown format only
2. Bullet points (•, ✅, ⚠️, 🎯) - one sentence max
3. Numbers/percentages for all metrics
4. NO fluff, NO filler words
5. Headers with emoji (##)
6. Max 2 bullets per section
7. ONE sentence = ONE insight
8. Keep responses SHORT and PRECISE

FORBIDDEN:
- "I think that", "It seems", "You should consider"
- Multi-sentence bullets
- Abstract advice without numbers
- More than 2 items per list
- Long explanations`;

  // ============================================================================
  // MENTOR AGENT - Weekly Analysis
  // ============================================================================

  static generateMentorWeeklyPrompt(data: {
    habits: Array<{ name: string; completed: number; target: number }>;
    completionRate: number;
    streak: number;
    learnings: string[];
    hurdles: string[];
    profile?: {
      personalityType?: string;
      coreValues?: string[];
      responseStyle?: string;
      lifeVision?: string;
    };
  }): string {
    const profileSection = data.profile ? `
PROFILE:
- Personality: ${data.profile.personalityType || 'Not set'}
- Core Values: ${data.profile.coreValues?.join(', ') || 'Not set'}
- Response Style: ${data.profile.responseStyle || 'Standard'}
${data.profile.lifeVision ? `- Vision: ${data.profile.lifeVision.substring(0, 100)}` : ''}
` : '';

    return `${this.SYSTEM_CONSTRAINTS}

TASK: Weekly analysis - BE CONCISE

${profileSection}DATA:
- Habits: ${data.habits.slice(0, 5).map(h => `${h.name} ${h.completed}/${h.target}`).join(' | ')}
- Completion: ${data.completionRate}%
- Streak: ${data.streak} days

REQUIRED OUTPUT (JSON):
{
  "performance": {
    "rating": "excellent|good|moderate|needs_attention",
    "completionRate": <number>,
    "streak": <number>
  },
  "habits": [
    {
      "habitName": "<name>",
      "completed": <number>,
      "target": <number>,
      "percentage": <number>,
      "status": "on_track|needs_attention|critical",
      "oneLiner": "<ONE sentence, max 80 chars>"
    }
  ],
  "successes": [
    "<ONE sentence, max 80 chars>",
    "<max 2 bullets>"
  ],
  "challenges": [
    "<ONE sentence, max 80 chars>",
    "<max 2 bullets>"
  ],
  "priorityAction": "<ONE sentence, max 100 chars>",
  "quickWin": "<ONE sentence, max 100 chars>",
  "adaptiveGoals": [
    {
      "habitName": "<name>",
      "currentRate": <number>,
      "recommendation": "<ONE sentence, max 80 chars>"
    }
  ]
}

RULES:
- ONE sentence per bullet, MAX 2 bullets per section
- Numbers required for all metrics
- NO speculation, ONLY data-based insights
- Match response style to user profile if provided
- If <80% completion → suggest goal adjustment
- If >=100% completion → suggest challenge increase`;
  }

  // ============================================================================
  // MENTOR AGENT - Habit Feedback
  // ============================================================================

  static generateMentorFeedbackPrompt(data: {
    habitName: string;
    completed: number;
    target: number;
    recentProofs: Array<{ date: string; completed: boolean }>;
    minimalDose: string;
  }): string {
    return `${this.SYSTEM_CONSTRAINTS}

TASK: Habit feedback

HABIT: ${data.habitName}
- Completed: ${data.completed}/${data.target}
- Completion rate: ${Math.round((data.completed / data.target) * 100)}%
- Recent proofs: ${data.recentProofs.length}
- Minimal dose: ${data.minimalDose}

OUTPUT (max 5 bullets):
✅ **Performance:** <ONE sentence with numbers>
🎯 **Pattern:** <ONE sentence observed pattern>
⚡ **Action:** <ONE sentence concrete next step>
🔄 **Adjustment:** <ONE sentence if needed>

NO explanations, ONLY actionable insights with data.`;
  }

  // ============================================================================
  // ACCOUNTABILITY AGENT - Check-in
  // ============================================================================

  static generateAccountabilityPrompt(data: {
    day: number;
    totalDays: number;
    weekPerformance: Array<{ habit: string; completed: number; target: number; streak: number }>;
    longestStreak: number;
    profile?: {
      personalityType?: string;
      responseStyle?: string;
    };
  }): string {
    const profileSection = data.profile ? `
PROFILE:
- Personality: ${data.profile.personalityType || 'Not set'}
- Response Style: ${data.profile.responseStyle || 'Standard'}
` : '';

    return `${this.SYSTEM_CONSTRAINTS}

TASK: Accountability check-in - BE CONCISE

${profileSection}PROGRESS: Day ${data.day}/${data.totalDays} (${Math.round((data.day / data.totalDays) * 100)}%)

WEEK:
${data.weekPerformance.slice(0, 5).map(wp =>
  `- ${wp.habit}: ${wp.completed}/${wp.target} (${wp.streak} day streak)`
).join('\n')}

LONGEST: ${data.longestStreak} days

REQUIRED OUTPUT (JSON):
{
  "status": {
    "day": ${data.day},
    "totalDays": ${data.totalDays},
    "activeStreaks": <count habits with streak>0>,
    "longestStreak": ${data.longestStreak}
  },
  "weekPerformance": [
    {
      "habitName": "<name>",
      "completed": <number>,
      "target": <number>,
      "streak": <number>,
      "emoji": "✅|⚠️|❌"
    }
  ],
  "motivation": "<ONE sentence with numbers, max 100 chars>",
  "actions": [
    "<ONE sentence for next 48h, max 80 chars>",
    "<max 2 bullets>"
  ],
  "buddyMessage": "<ONE sentence, max 100 chars>"
}

RULES:
- ✅ if >=target, ⚠️ if 50-99%, ❌ if <50%
- Motivation MUST reference specific numbers
- Actions MUST be concrete (time, habit, metric)
- Match tone to user profile if provided`;
  }

  // ============================================================================
  // GROUP AGENT - Team Dynamics
  // ============================================================================

  static generateGroupPrompt(data: {
    members: Array<{ name: string; completionRate: number }>;
    userCompletionRate: number;
    buddyName: string;
    buddyCompletionRate: number;
    profile?: {
      personalityType?: string;
      responseStyle?: string;
    };
  }): string {
    const profileSection = data.profile ? `
PROFILE:
- Personality: ${data.profile.personalityType || 'Not set'}
- Response Style: ${data.profile.responseStyle || 'Standard'}
` : '';
    const topPerformers = data.members
      .sort((a, b) => b.completionRate - a.completionRate)
      .slice(0, 3);

    return `${this.SYSTEM_CONSTRAINTS}

TASK: Group dynamics - BE CONCISE

${profileSection}MEMBERS: ${data.members.length}
AVG COMPLETION: ${Math.round(data.members.reduce((sum, m) => sum + m.completionRate, 0) / data.members.length)}%

TOP 2:
${topPerformers.slice(0, 2).map((m, i) => `${i + 1}. ${m.name}: ${m.completionRate}%`).join('\n')}

YOU: ${data.userCompletionRate}%
BUDDY (${data.buddyName}): ${data.buddyCompletionRate}%

REQUIRED OUTPUT (JSON):
{
  "groupStats": {
    "activeMembers": ${data.members.length},
    "avgCompletionRate": <number>,
    "topPerformer": "<name>"
  },
  "rankings": [
    { "rank": 1, "name": "<name>", "completionRate": <number> }
  ],
  "learningOpportunities": [
    {
      "learnFrom": "<name>",
      "skill": "<habit category>",
      "oneLiner": "<ONE sentence, max 80 chars>"
    }
  ],
  "buddySync": "<ONE sentence, max 100 chars>",
  "groupPattern": "<ONE sentence, max 100 chars>"
}

RULES:
- Max 2 rankings
- Max 1 learning opportunity
- Learning opportunity = specific skill + concrete question
- Match tone to user profile if provided`;
  }

  // ============================================================================
  // LEARNING AGENT - Insights
  // ============================================================================

  static generateLearningPrompt(data: {
    learnings: Array<{ topic: string; text: string; date: string }>;
    hurdles: Array<{ type: string; description: string; solution: string }>;
    profile?: {
      personalityType?: string;
      responseStyle?: string;
    };
  }): string {
    const profileSection = data.profile ? `
PROFILE:
- Personality: ${data.profile.personalityType || 'Not set'}
- Response Style: ${data.profile.responseStyle || 'Standard'}
` : '';
    // Group learnings by topic
    const topicCounts: Record<string, number> = {};
    data.learnings.forEach(l => {
      topicCounts[l.topic] = (topicCounts[l.topic] || 0) + 1;
    });

    return `${this.SYSTEM_CONSTRAINTS}

TASK: Extract learning insights - BE CONCISE

${profileSection}LEARNINGS (${data.learnings.length}):
${Object.entries(topicCounts).slice(0, 3).map(([topic, count]) =>
  `- ${topic}: ${count}x`
).join('\n')}

HURDLES (${data.hurdles.length}):
${data.hurdles.slice(0, 3).map(h => `- ${h.type}: ${h.description.substring(0, 40)}`).join('\n')}

REQUIRED OUTPUT (JSON):
{
  "insights": [
    {
      "topic": "<category>",
      "insight": "<ONE sentence pattern, max 80 chars>",
      "frequency": <number>
    }
  ],
  "hurdleSolutions": [
    {
      "hurdle": "<problem>",
      "solution": "<ONE sentence fix, max 80 chars>",
      "effectiveness": "high|medium|low"
    }
  ],
  "metaPattern": "<ONE sentence, max 100 chars>",
  "recommendation": "<ONE sentence, max 100 chars>"
}

RULES:
- Max 2 insights (most frequent topics)
- Max 2 hurdle solutions (proven high effectiveness)
- Meta-pattern = cross-topic observation
- Recommendation = actionable next step
- Match tone to user profile if provided`;
  }

  // ============================================================================
  // SHARED: Adaptive Goals Logic
  // ============================================================================

  static readonly ADAPTIVE_GOALS_LOGIC = `ADAPTIVE GOALS RULES:

IF completion_rate >= 100%:
  → "Exceeding goal - consider increasing challenge (skill-challenge balance)"
  → Focus: Progressive difficulty

IF completion_rate < 80%:
  → "Below target - reduce frequency or simplify minimal dose"
  → Ask: "What hurdles prevented completion?"
  → Focus: Barrier removal

IF completion_rate 80-100%:
  → "Optimal range - maintain current goal"
  → No changes needed

FORMAT: "<habit> (X%) — <ONE sentence recommendation>"`;

  // ============================================================================
  // SHARED: Time Analysis Logic
  // ============================================================================

  static readonly TIME_ANALYSIS_LOGIC = `TIME PATTERN ANALYSIS:

Extract from proofs:
- Morning (6-12): <count>
- Afternoon (12-18): <count>
- Evening (18-24): <count>

IF one time block >> others:
  → "<time> is your optimal window"

IF distribution even:
  → "No clear time preference"

OUTPUT: ONE sentence observation with numbers`;

  // ============================================================================
  // HELPER: Token Counter (Ensure brevity)
  // ============================================================================

  static readonly MAX_TOKENS = {
    mentorWeekly: 300,
    mentorFeedback: 150,
    accountability: 200,
    group: 200,
    learning: 200,
  };

  /**
   * Validates that response adheres to token limits
   */
  static validateResponseLength(response: string, maxTokens: number): boolean {
    // Rough estimate: 1 token ≈ 4 characters
    const estimatedTokens = response.length / 4;
    return estimatedTokens <= maxTokens;
  }

  /**
   * Truncates response if too long
   */
  static truncateResponse(response: string, maxTokens: number): string {
    const maxChars = maxTokens * 4;
    if (response.length <= maxChars) return response;

    // Truncate to last complete sentence
    const truncated = response.substring(0, maxChars);
    const lastPeriod = truncated.lastIndexOf('.');
    const lastNewline = truncated.lastIndexOf('\n');
    const cutPoint = Math.max(lastPeriod, lastNewline);

    return cutPoint > 0 ? truncated.substring(0, cutPoint + 1) : truncated;
  }
}
