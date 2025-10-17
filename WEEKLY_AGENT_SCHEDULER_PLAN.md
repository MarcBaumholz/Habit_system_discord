# 📅 Weekly Agent Scheduler - Implementation Plan

**Date:** October 13, 2025  
**Target Channel:** Marc's Channel (1422681618304471131)  
**Schedule:** Every Wednesday at 9:00 AM  

---

## 🎯 Goal

Create a comprehensive weekly agent scheduler that automatically triggers all 5 specialized agents every Wednesday at 9am to provide Marc with:
1. Weekly habit analysis (Mentor Agent)
2. Identity alignment check (Identity Agent)
3. Accountability review (Accountability Agent)
4. Learning insights synthesis (Learning Agent)
5. Group dynamics update (Group Agent)

---

## 📋 Implementation Steps

### Phase 1: Planning & Analysis ✅
- [x] Understand current agent architecture
- [x] Identify scheduler requirements
- [x] Define agent trigger sequence
- [x] Plan prompt enhancements

### Phase 2: Expand Agent Prompts
- [ ] Mentor Agent: Enhanced weekly analysis prompt
- [ ] Identity Agent: Deeper personality analysis
- [ ] Accountability Agent: Comprehensive motivation check
- [ ] Learning Agent: Pattern synthesis across weeks
- [ ] Group Agent: Social dynamics evolution

### Phase 3: Create Weekly Scheduler
- [ ] Create `WeeklyAgentScheduler` class
- [ ] Implement cron job for Wednesday 9am
- [ ] Add agent orchestration logic
- [ ] Add error handling and retry logic
- [ ] Add logging for each agent execution

### Phase 4: Update Channel Restrictions
- [ ] Update all agents to work with Marc's channel (1422681618304471131)
- [ ] Remove or update PERSONAL_CHANNEL_ID restrictions
- [ ] Add channel configuration to environment variables

### Phase 5: Create Agent Coordinator
- [ ] Build coordinator to run all agents sequentially
- [ ] Aggregate responses into single comprehensive report
- [ ] Format output for Discord (handle 2000 char limit)
- [ ] Add progress indicators

### Phase 6: Testing
- [ ] Test individual agent triggers
- [ ] Test full weekly report generation
- [ ] Test Discord message formatting
- [ ] Test error scenarios

### Phase 7: Deployment
- [ ] Update environment variables
- [ ] Deploy to production
- [ ] Monitor first execution
- [ ] Document for future reference

---

## 🤖 Agent Enhancement Details

### 1. Mentor Agent Enhancements
**Current Capability:** Weekly habit analysis  
**Enhanced Prompt:**
```
You are Marc's personal habit mentor conducting the weekly Wednesday review.

Analyze the past 7 days (last Wednesday to today) and provide:

1. WEEKLY PERFORMANCE SCORECARD
   - Overall completion rate vs. target
   - Streak status (maintained/broken/improved)
   - Best performing habits (top 3)
   - Struggling habits (needs attention)

2. PATTERN INSIGHTS
   - Best performance days and times
   - Environmental factors that helped/hindered
   - Energy level correlations
   - Mood impact analysis

3. SUCCESS FACTORS
   - What worked exceptionally well
   - New strategies discovered
   - Breakthrough moments
   - Surprising patterns

4. AREAS FOR IMPROVEMENT
   - Specific habits needing focus
   - Timing adjustments needed
   - Environmental optimizations
   - Hurdle prevention strategies

5. NEXT WEEK COACHING PLAN
   - Focus habit for the week
   - Specific daily targets
   - Implementation intentions
   - Milestone to achieve

Be specific, data-driven, encouraging, and actionable. Reference actual numbers and dates.
```

### 2. Identity Agent Enhancements
**Current Capability:** Personality-based recommendations  
**Enhanced Prompt:**
```
You are Marc's identity coach conducting the weekly identity alignment check.

Evaluate how Marc's habits align with his desired identity over the past week:

1. IDENTITY ALIGNMENT SCORE (1-10)
   - How well habits reflect desired identity
   - Progress toward identity goals
   - Identity evolution indicators

2. HABIT-IDENTITY MATCH ANALYSIS
   - Which habits strengthen desired identity
   - Which habits contradict identity goals
   - Gaps between current and desired self

3. PERSONALITY EXPRESSION
   - How habits utilize personality strengths
   - Personality-habit compatibility
   - Energy alignment with values

4. IDENTITY EVOLUTION TRACKING
   - Signs of identity transformation
   - Behavioral evidence of change
   - Self-concept shifts

5. IDENTITY-BASED RECOMMENDATIONS
   - Habits to add that align with identity
   - Habits to modify for better alignment
   - Identity statements to reinforce
   - Actions that embody desired self

Use Marc's personality profile, core values, and desired identity as foundation.
```

### 3. Accountability Agent Enhancements
**Current Capability:** Progress monitoring and motivation  
**Enhanced Prompt:**
```
You are Marc's accountability partner conducting the weekly check-in.

Provide a comprehensive accountability review:

1. CONSISTENCY ANALYSIS
   - Daily completion consistency (7-day view)
   - Missed habits analysis (reasons/patterns)
   - Minimal dose usage (appropriate or avoidance?)
   - Cheat day effectiveness

2. MOTIVATION ASSESSMENT
   - Current motivation level (1-10)
   - Motivation trends (rising/stable/declining)
   - Warning signs of burnout
   - Energy and enthusiasm indicators

3. RISK FACTORS
   - Habits at risk of being abandoned
   - Patterns suggesting upcoming struggles
   - External stressors impacting habits
   - Self-sabotage indicators

4. CELEBRATION MOMENTS
   - Wins worth celebrating
   - Consistency achievements
   - Breakthrough performances
   - Personal records

5. ACCOUNTABILITY ACTIONS
   - Immediate interventions needed
   - Support mechanisms to activate
   - Commitment renewal strategies
   - Weekly accountability pledge

Be firm but compassionate. Call out patterns honestly while maintaining motivation.
```

### 4. Learning Agent Enhancements
**Current Capability:** Pattern recognition and knowledge synthesis  
**Enhanced Prompt:**
```
You are Marc's learning synthesizer conducting weekly knowledge integration.

Synthesize learnings and extract actionable wisdom:

1. WEEKLY LEARNING HIGHLIGHTS
   - Top 3 insights from this week
   - Most valuable discoveries
   - Unexpected lessons
   - Aha moments

2. HURDLE ANALYSIS
   - Recurring obstacles identified
   - New hurdles that emerged
   - Solutions attempted (success rate)
   - Patterns in failure points

3. CROSS-HABIT PATTERNS
   - Insights applicable across multiple habits
   - Universal success strategies
   - Common failure triggers
   - Synergies between habits

4. KNOWLEDGE SYNTHESIS
   - Connecting this week's learnings to past insights
   - Building on previous discoveries
   - Validating or refuting hypotheses
   - Emerging theories about Marc's habit success

5. APPLIED LEARNING RECOMMENDATIONS
   - How to use this week's insights
   - Experiments to try next week
   - Learnings to share with community
   - Documentation suggestions

Transform raw learnings into wisdom and actionable strategies.
```

### 5. Group Agent Enhancements
**Current Capability:** Social coordination  
**Enhanced Prompt:**
```
You are Marc's social dynamics analyst conducting weekly community review.

Analyze Marc's social habit ecosystem:

1. COMMUNITY ENGAGEMENT
   - Interactions with accountability partners
   - Trust points earned/given
   - Social support received/provided
   - Group participation level

2. PEER INFLUENCE ANALYSIS
   - How others' success/struggles affected Marc
   - Positive social pressure indicators
   - Social motivation sources
   - Comparison effects (healthy vs. unhealthy)

3. GROUP DYNAMICS
   - Marc's role in the community
   - Influence level (leading/participating/following)
   - Contribution to group success
   - Benefit from group membership

4. SOCIAL ACCOUNTABILITY EFFECTIVENESS
   - Impact of public commitment
   - Response to group check-ins
   - Peer support utilization
   - Social celebration participation

5. COMMUNITY RECOMMENDATIONS
   - Accountability partners to connect with
   - Group challenges to join
   - Leadership opportunities
   - Support Marc can offer others
   - New community engagement strategies

Focus on how social dynamics enhance or hinder Marc's habit success.
```

---

## 🏗️ Technical Architecture

### WeeklyAgentScheduler Class
```typescript
class WeeklyAgentScheduler {
  private mentorAgent: MentorAgent;
  private identityAgent: IdentityAgent;
  private accountabilityAgent: AccountabilityAgent;
  private learningAgent: LearningAgent;
  private groupAgent: GroupAgent;
  private notionClient: NotionClient;
  private discordClient: Discord.Client;
  private targetChannelId: string;
  
  constructor(agents, notion, discord, channelId);
  
  async scheduleWeeklyReports(): void;
  async runWeeklyAnalysis(userId: string): Promise<void>;
  async gatherUserContext(userId: string): Promise<UserContext>;
  async executeAllAgents(userContext: UserContext): Promise<AgentReport[]>;
  async formatComprehensiveReport(reports: AgentReport[]): Promise<string[]>;
  async sendToDiscord(messages: string[]): Promise<void>;
}
```

### Cron Schedule
```typescript
// Every Wednesday at 9:00 AM
cron.schedule('0 9 * * 3', async () => {
  await weeklyScheduler.runWeeklyAnalysis('marc-user-id');
});
```

---

## 📊 What's Missing

### Critical Components
1. **User Context Aggregation**
   - Need comprehensive data gathering from Notion
   - Last 7 days of proofs, learnings, hurdles
   - Weekly comparison data (this week vs. last week)

2. **Response Aggregation**
   - Combine all 5 agent responses into cohesive report
   - Handle Discord 2000 character limit (split into multiple messages)
   - Format with emojis and sections for readability

3. **Error Handling**
   - Individual agent failures shouldn't stop entire report
   - Retry logic for API failures
   - Fallback responses when agents fail

4. **Progress Tracking**
   - Store weekly report history
   - Track trends across weeks
   - Compare current week to historical averages

5. **Notification System**
   - Send report to Marc's channel
   - Optional: Send summary to other channels
   - Add reactions for Marc to provide feedback

### Data Requirements
1. **Notion Database Queries**
   - Last 7 days proofs (with filters)
   - Last 7 days learnings
   - Active hurdles
   - User profile with personality data
   - Group membership and interactions

2. **Historical Data**
   - Previous week's scores for comparison
   - Trend data (4-week rolling average)
   - Best streaks and personal records

3. **Context Enrichment**
   - Time-based analysis (morning vs. evening performance)
   - Day-of-week patterns
   - Environmental context from proof notes
   - Mood and energy correlations

### Configuration Needs
1. **Environment Variables**
   ```env
   MARC_DISCORD_CHANNEL=1422681618304471131
   MARC_DISCORD_USER_ID=<marc-user-id>
   WEEKLY_REPORT_TIMEZONE=Europe/Berlin
   WEEKLY_REPORT_DAY=3  # Wednesday
   WEEKLY_REPORT_HOUR=9
   WEEKLY_REPORT_MINUTE=0
   ```

2. **Feature Flags**
   - Enable/disable individual agents
   - Adjust prompt verbosity
   - Toggle sections on/off

---

## 🔄 Execution Flow

```
1. Wednesday 9:00 AM Trigger
   ↓
2. Gather Marc's User Context
   - Fetch from Notion (users, habits, proofs, learnings, hurdles)
   - Calculate week-over-week changes
   - Prepare consolidated UserContext object
   ↓
3. Execute Agents Sequentially
   ├─ Mentor Agent (Weekly Analysis)
   ├─ Identity Agent (Alignment Check)
   ├─ Accountability Agent (Motivation Review)
   ├─ Learning Agent (Insights Synthesis)
   └─ Group Agent (Social Dynamics)
   ↓
4. Aggregate Responses
   - Combine all agent outputs
   - Format for Discord (handle char limits)
   - Add navigation and structure
   ↓
5. Send to Discord
   - Post to Marc's channel (1422681618304471131)
   - Add reaction options for feedback
   - Log successful delivery
   ↓
6. Store Report
   - Save to Notion for history
   - Update trends and metrics
   - Prepare for next week's comparison
```

---

## 🧪 Testing Strategy

### Manual Trigger
Create command to trigger immediate report:
```
/weekly-report    # Triggers full weekly analysis now
/test-agent <agent-name>    # Test individual agent
```

### Validation Checks
- [ ] All 5 agents execute successfully
- [ ] Report generated within 60 seconds
- [ ] Discord messages sent correctly
- [ ] Data stored in Notion
- [ ] Error scenarios handled gracefully

---

## 🚀 Implementation Priority

### High Priority (Do First)
1. Create WeeklyAgentScheduler class
2. Update agent channel restrictions
3. Enhance agent prompts
4. Test individual agent triggers

### Medium Priority (Do Second)
5. Create scheduler with cron
6. Build response aggregator
7. Implement Discord formatting

### Low Priority (Polish)
8. Add historical tracking
9. Create manual trigger command
10. Build feedback mechanism

---

**Next Steps:**
1. Start with Phase 2: Expand agent prompts
2. Create WeeklyAgentScheduler class
3. Test each agent individually
4. Integrate scheduler into bot
5. Deploy and monitor first execution

**Estimated Time:** 2-3 hours for full implementation and testing

