# 🤖 Habit System - Multi-Agent Architecture

## 🎯 System Goal

**Create real behavior change through intelligent, personalized AI agents that understand users deeply, provide adaptive support, and coordinate to maximize habit formation success.**

---

## 📋 Table of Contents

1. [System Overview](#system-overview)
2. [Orchestrator](#orchestrator)
3. [Core Agents](#core-agents)
4. [Database Interactions](#database-interactions)
5. [Trigger System](#trigger-system)
6. [Agent Coordination](#agent-coordination)
7. [Implementation with Claude SDK](#implementation-with-claude-sdk)
8. [Behavior Change Principles](#behavior-change-principles)

---

## 🏗️ System Overview

### Architecture Pattern

```
┌─────────────────────────────────────────────────────────────┐
│                      ORCHESTRATOR                            │
│  (Request Routing, Agent Coordination, Response Aggregation) │
└───────────────────────┬─────────────────────────────────────┘
                        │
        ┌───────────────┼───────────────┬───────────────┐
        │               │               │               │
        ▼               ▼               ▼               ▼
   ┌─────────┐    ┌──────────┐   ┌──────────┐   ┌──────────┐
   │ Mentor  │    │ Identity │   │Accountab.│   │  Group   │
   │  Agent  │    │  Agent   │   │  Agent   │   │  Agent   │
   └────┬────┘    └─────┬────┘   └─────┬────┘   └─────┬────┘
        │               │              │              │
        └───────────────┼──────────────┴──────────────┘
                        │
                        ▼
                 ┌──────────────┐
                 │   Learning   │
                 │   & Hurdles  │
                 │    Agent     │
                 └──────────────┘
                        │
                        ▼
         ┌──────────────────────────────┐
         │      Notion Databases         │
         │  Users │ Habits │ Proofs │... │
         └──────────────────────────────┘
```

### Core Principles

1. **Specialization**: Each agent has a specific role
2. **Coordination**: Orchestrator routes and combines agent responses
3. **Intelligence**: Perplexity AI powers all agents with context-aware responses
4. **Data-Driven**: All insights backed by Notion database analysis
5. **Behavior Change**: Every interaction designed to drive real habit formation

---

## 🎭 Orchestrator

### Purpose
**Central coordinator that routes requests to appropriate agents, manages multi-agent responses, and ensures coherent user experience.**

### Responsibilities

1. **Request Routing**
   - Analyzes incoming messages
   - Determines which agent(s) should handle request
   - Scores agents based on relevance and performance

2. **Agent Coordination**
   - Selects primary agent for main response
   - Selects supporting agents for additional context
   - Manages agent execution order

3. **Response Aggregation**
   - Combines responses from multiple agents
   - Removes duplicate recommendations
   - Calculates overall confidence score

4. **System Monitoring**
   - Tracks agent performance
   - Health checks for all services
   - Error handling and fallback responses

### Implementation Details

```typescript
class Orchestrator extends BaseAgent {
  capabilities: [
    'request_routing',
    'agent_coordination', 
    'response_aggregation',
    'system_monitoring'
  ]
  
  primaryResponsibility: "Route requests and coordinate agents"
}
```

### Database Access
- **Reads**: All databases (for context gathering)
- **Writes**: None (orchestrator doesn't modify data)

### Triggers
- **Manual**: Every `/agent` command
- **Automatic**: None (called by other systems)

---

## 🤖 Core Agents

---

### 1. 🧘‍♂️ Mentor Agent

#### Purpose
**Personalized habit coach that analyzes patterns, provides feedback, and offers strategic guidance based on historical data.**

#### Core Capabilities

```typescript
capabilities: [
  'habit_analysis',        // Deep analysis of habit performance
  'pattern_recognition',   // Identify success and failure patterns
  'coaching_advice',       // Personalized improvement suggestions
  'progress_assessment',   // Track progress over time
  'feedback_generation'    // Generate weekly/daily reports
]
```

#### What It Does

1. **Pattern Analysis**
   - Identifies successful habit patterns
   - Recognizes common failure points
   - Discovers correlations between habits
   - Finds optimal timing and contexts

2. **Personalized Coaching**
   - Provides contextual advice
   - Offers strategic habit modifications
   - Suggests goal refinements
   - Delivers motivational support

3. **Weekly Analysis** (Main Function)
   - Comprehensive performance review
   - Habit-by-habit breakdown
   - Success pattern identification
   - Actionable next steps

#### Sub-Functions

| Function | Purpose | Triggered By |
|----------|---------|--------------|
| `performWeeklyAnalysis()` | Complete week review | Wednesday 9 AM |
| `analyzeHabitPatterns()` | Find success patterns | User request |
| `provideHabitFeedback()` | Habit-specific advice | User request |
| `provideCoachingAdvice()` | General coaching | User request |

#### Database Interactions

**Reads:**
- **Users**: Get user info, timezone, preferences
- **Habits**: All user habits with context
- **Proofs**: Historical completion data (30+ days)
- **Learnings**: Past insights and discoveries
- **Weeks**: Historical weekly summaries
- **Personality**: User profile for context

**Writes:**
- None (analysis only)

**Key Queries:**
```typescript
// Get comprehensive user data for analysis
const user = await notion.getUserByDiscordId(discordId);
const habits = await notion.getHabitsByUserId(user.id);
const proofs = await notion.getProofsByUserId(user.id);
const learnings = await notion.getLearningsByUserId(user.id);
const summary = await notion.getUserSummary(user.id);
```

#### Triggers

**Automatic:**
- Every Wednesday at 9 AM (weekly analysis)

**Manual:**
- `/mentor` command
- Messages containing: "habit", "feedback", "analysis", "coaching", "weekly", "progress"

#### AI Prompt Structure

```
ROLE: Expert habit coach with 15 years experience in behavioral psychology

TASK: Analyze user's habit data and provide actionable insights

CONTEXT:
- User Profile: {name, timezone, preferences}
- Current Habits: {list with details}
- Recent Performance: {7-day proofs}
- Historical Data: {30-day trends}
- Past Learnings: {user insights}

OUTPUT:
1. Performance summary
2. Pattern analysis
3. Success factors
4. Areas for improvement
5. Specific recommendations
```

#### Behavior Change Focus

- **Identifies what works**: Reinforces successful patterns
- **Spots early warning signs**: Catches declining motivation
- **Personalizes advice**: Based on individual data
- **Celebrates wins**: Builds positive momentum
- **Provides specifics**: Actionable, not generic advice

---

### 2. 🆔 Identity Agent

#### Purpose
**Digital twin that ensures habits align with personality, values, and desired identity. Recommends habits based on deep personality understanding.**

#### Core Capabilities

```typescript
capabilities: [
  'personality_analysis',                // Analyze MBTI, Big Five traits
  'habit_identity_matching',            // Match habits to personality
  'identity_evolution_tracking',        // Track identity changes
  'personality_based_recommendations',  // Suggest aligned habits
  'identity_alignment_scoring'          // Score habit-identity fit
]
```

#### What It Does

1. **Personality Analysis**
   - Analyzes MBTI type
   - Evaluates Big Five traits
   - Understands core values
   - Maps life vision

2. **Habit-Identity Matching**
   - Scores habit alignment with personality
   - Identifies misaligned habits
   - Suggests identity-based habits
   - Uses "I am" framing

3. **Identity Evolution**
   - Tracks desired vs. current identity
   - Monitors identity development
   - Detects identity shifts
   - Celebrates identity milestones

#### Sub-Functions

| Function | Purpose | Triggered By |
|----------|---------|--------------|
| `analyzeIdentityAlignment()` | Check habit-personality fit | User request |
| `generateIdentityBasedRecommendations()` | Suggest aligned habits | User request |
| `trackIdentityEvolution()` | Monitor identity changes | Weekly |
| `scoreHabitAlignment()` | Rate habit-identity fit | Per habit |

#### Database Interactions

**Reads:**
- **Personality**: Complete personality profile
  - Personality type (MBTI)
  - Core values
  - Life vision
  - Main goals
  - Big Five traits
  - Life domains
  - Desired identity
- **Users**: Basic user info
- **Habits**: All user habits for alignment check
- **Proofs**: Habit success rates

**Writes:**
- None (analysis only)

**Key Queries:**
```typescript
// Get personality and habit data
const profile = await notion.getUserProfileByDiscordId(discordId);
const habits = await notion.getHabitsByUserId(userId);
const summary = await notion.getUserSummary(userId);

// Analyze alignment
const alignment = analyzeIdentityAlignment(profile, habits);
```

#### Triggers

**Automatic:**
- None (on-demand only)

**Manual:**
- `/identity` command
- Messages containing: "identity", "personality", "recommendation", "values", "who am I"

#### AI Prompt Structure

```
ROLE: Identity psychology expert specializing in James Clear's identity-based habit formation

TASK: Analyze personality-habit alignment and recommend identity-based habits

PERSONALITY PROFILE:
- MBTI Type: {personalityType}
- Core Values: {coreValues}
- Life Vision: {lifeVision}
- Desired Identity: {desiredIdentity}
- Big Five Traits: {bigFiveTraits}

CURRENT HABITS:
{list of habits with domains}

OUTPUT:
1. Identity alignment score per habit
2. Well-aligned habits (reinforce)
3. Misaligned habits (modify/remove)
4. Identity-based habit recommendations
5. "I am" statements to reinforce identity
```

#### Behavior Change Focus

- **Identity-based habits**: "I am" vs. "I want to"
- **Values alignment**: Habits that reflect core values
- **Long-term vision**: Connects daily habits to life vision
- **Authenticity**: Habits that feel natural to personality
- **Evolution tracking**: Shows identity development over time

---

### 3. 📊 Accountability Agent

#### Purpose
**Adaptive motivation engine that monitors progress, detects struggling patterns, sends interventions, and celebrates successes.**

#### Core Capabilities

```typescript
capabilities: [
  'adaptive_reminders',      // Smart reminder timing
  'motivation_management',   // Personalized motivation
  'progress_monitoring',     // Track daily/weekly progress
  'intervention_triggers',   // Detect when user needs help
  'celebration_detection'    // Recognize achievements
]
```

#### What It Does

1. **Progress Monitoring**
   - Tracks daily completion rates
   - Monitors streaks
   - Detects declining patterns
   - Identifies risk periods

2. **Adaptive Interventions**
   - Sends personalized reminders
   - Provides motivational messages
   - Offers support during struggles
   - Adjusts tone based on situation

3. **Celebration Management**
   - Recognizes milestone achievements
   - Celebrates streak continuations
   - Acknowledges comeback efforts
   - Reinforces positive patterns

#### Sub-Functions

| Function | Purpose | Triggered By |
|----------|---------|--------------|
| `analyzeProgress()` | Check recent performance | Daily/Weekly |
| `determineIntervention()` | Decide intervention type | Progress analysis |
| `generateAccountabilityMessage()` | Create personalized message | Intervention trigger |
| `sendAdaptiveReminder()` | Send smart reminder | Schedule + context |
| `celebrateMilestone()` | Recognize achievement | Milestone detection |

#### Database Interactions

**Reads:**
- **Users**: User info, timezone, best time for reminders
- **Habits**: All habits with frequency targets
- **Proofs**: Recent proofs (7-14 days)
  - Completion status
  - Minimal dose usage
  - Cheat days
- **Weeks**: Weekly scores for trend analysis

**Writes:**
- None (sends messages, doesn't write to DB)

**Key Queries:**
```typescript
// Get progress data
const habits = await notion.getHabitsByUserId(userId);
const proofs = await notion.getProofsByUserId(userId, last7Days, today);
const summary = await notion.getUserSummary(userId);

// Calculate metrics
const completionRate = calculateCompletionRate(proofs, habits);
const streakStatus = calculateStreak(proofs);
const riskLevel = assessRiskLevel(completionRate, streakStatus);
```

#### Triggers

**Automatic:**
- Daily at user's best time (for reminders)
- When completion rate drops below threshold
- When streak is at risk
- When milestone achieved

**Manual:**
- `/accountability` command
- Messages containing: "accountability", "motivation", "check in", "intervention"

#### AI Prompt Structure

```
ROLE: Behavioral accountability coach specializing in motivation psychology

TASK: Determine appropriate intervention and generate motivational message

PROGRESS ANALYSIS:
- Completion Rate (7 days): {completionRate}%
- Current Streak: {streak} days
- Risk Level: {low|medium|high}
- Recent Performance: {trend}
- Minimal Doses: {count}
- Cheat Days: {count}

HABIT PORTFOLIO:
{habits with targets and actuals}

INTERVENTION STRATEGY:
- Type: {encouragement|reminder|intervention|celebration}
- Tone: {supportive|firm|celebratory}
- Focus: {specific habit or general}

OUTPUT:
Personalized accountability message
```

#### Behavior Change Focus

- **Timely interventions**: Catch issues early
- **Personalized motivation**: Based on progress patterns
- **Positive reinforcement**: Celebrates all progress
- **Adaptive support**: Adjusts intensity to user state
- **Streak protection**: Prevents break patterns

---

### 4. 👥 Group Agent

#### Purpose
**Social dynamics optimizer that forms compatible groups, monitors group health, and leverages peer accountability.**

#### Core Capabilities

```typescript
capabilities: [
  'group_formation',                 // Match compatible users
  'social_coordination',             // Coordinate group activities
  'peer_influence_analysis',         // Analyze social dynamics
  'group_dynamics_optimization',     // Improve group health
  'collaborative_goal_management'    // Manage group goals
]
```

#### What It Does

1. **Group Formation**
   - Matches users by personality
   - Considers habit domains
   - Balances high/low performers
   - Creates sustainable groups

2. **Group Dynamics Monitoring**
   - Tracks group motivation
   - Identifies struggling members
   - Detects group health issues
   - Monitors interaction patterns

3. **Social Coordination**
   - Encourages peer support
   - Facilitates knowledge sharing
   - Manages group challenges
   - Celebrates group wins

#### Sub-Functions

| Function | Purpose | Triggered By |
|----------|---------|--------------|
| `analyzeGroupDynamics()` | Check group health | Weekly |
| `formOptimalGroups()` | Create new groups | Admin request |
| `monitorGroupMotivation()` | Track group energy | Daily |
| `facilitatePeerSupport()` | Connect high/low performers | Detection |
| `recommendGroupActions()` | Suggest group activities | Group analysis |

#### Database Interactions

**Reads:**
- **Groups**: All groups with channel IDs
- **Users**: All users with performance data
- **Habits**: User habits for domain matching
- **Proofs**: Recent proofs for performance clustering
- **Personality**: For compatibility matching

**Writes:**
- **Groups**: Create new groups, update donation pools

**Key Queries:**
```typescript
// Get group and member data
const groups = await notion.getAllGroups();
const allUsers = await notion.getAllUsers();

// For each group
const members = await getGroupMembers(group.channelId);
const memberProofs = await Promise.all(
  members.map(m => notion.getProofsByUserId(m.id))
);

// Analyze dynamics
const groupHealth = analyzeGroupHealth(members, memberProofs);
const riskMembers = identifyAtRiskMembers(memberProofs);
```

#### Triggers

**Automatic:**
- Weekly group health check
- When group member falls behind (3+ days)
- When group achieves collective milestone

**Manual:**
- `/group` command
- Messages containing: "group", "social", "peer", "community", "team"

#### AI Prompt Structure

```
ROLE: Social dynamics expert specializing in group psychology and accountability

TASK: Analyze group dynamics and recommend actions

GROUP CONTEXT:
- Group Name: {name}
- Members: {count}
- Channel: {channelId}

MEMBER PERFORMANCE:
{list of members with completion rates, streaks}

GROUP METRICS:
- Average Completion Rate: {rate}%
- Group Motivation: {high|medium|low}
- At-Risk Members: {count}
- High Performers: {count}

OUTPUT:
1. Group health assessment
2. At-risk member identification
3. High performer engagement strategies
4. Group activity recommendations
5. Peer support suggestions
```

#### Behavior Change Focus

- **Peer accountability**: Harnesses social pressure positively
- **Group identity**: "We are habit builders"
- **Balanced groups**: High performers mentor low performers
- **Early intervention**: Prevents group breakdown
- **Collective wins**: Celebrates group achievements

---

### 5. 📚 Learning & Hurdles Agent

#### Purpose
**Pattern mining and knowledge synthesis agent that extracts insights from learnings, analyzes hurdles, and generates solutions.**

#### Core Capabilities

```typescript
capabilities: [
  'pattern_recognition',     // Find patterns in learnings
  'knowledge_synthesis',     // Combine insights
  'hurdle_analysis',        // Analyze obstacles
  'solution_generation',    // Generate hurdle solutions
  'cross_user_analytics'    // Learn from all users
]
```

#### What It Does

1. **Learning Analysis**
   - Extracts key insights from user learnings
   - Identifies recurring themes
   - Finds actionable wisdom
   - Connects learnings to habits

2. **Hurdle Pattern Recognition**
   - Categorizes hurdles by type
   - Identifies common obstacles
   - Recognizes hurdle patterns
   - Predicts potential hurdles

3. **Solution Generation**
   - Provides specific hurdle solutions
   - Shares strategies that worked for others
   - Suggests preventive measures
   - Creates implementation plans

#### Sub-Functions

| Function | Purpose | Triggered By |
|----------|---------|--------------|
| `extractLearningInsights()` | Mine insights from learnings | Weekly |
| `analyzeHurdlePatterns()` | Find common obstacles | User request |
| `generateHurdleSolutions()` | Create solution strategies | Hurdle detection |
| `synthesizeKnowledge()` | Combine all learnings | Monthly |
| `predictUpcomingHurdles()` | Forecast obstacles | Habit analysis |

#### Database Interactions

**Reads:**
- **Learnings**: All user learnings
  - Text content
  - Associated habits
  - Creation dates
- **Hurdles**: All user hurdles
  - Hurdle types
  - Descriptions
  - Associated habits
  - Dates encountered
- **Habits**: For context
- **Proofs**: To correlate with learnings/hurdles

**Writes:**
- **Learnings**: Store synthesized insights
- **Hurdles**: Store identified patterns

**Key Queries:**
```typescript
// Get learning and hurdle data
const learnings = await notion.getLearningsByDiscordId(discordId);
const hurdles = await notion.getHurdlesByDiscordId(discordId);
const habits = await notion.getHabitsByUserId(userId);

// For cross-user analysis (future)
const allLearnings = await getAllUsersLearnings();
const commonHurdles = identifyCommonHurdles(allLearnings);
```

#### Triggers

**Automatic:**
- Weekly learning synthesis
- When new hurdle is logged
- Monthly pattern analysis

**Manual:**
- `/learning` command
- Messages containing: "learning", "hurdle", "obstacle", "pattern", "insight"

#### AI Prompt Structure

```
ROLE: Expert in pattern recognition and knowledge synthesis for habit formation

TASK: Extract insights and generate solutions

USER LEARNINGS ({count} total):
{list of learning entries with dates and habits}

USER HURDLES ({count} total):
{list of hurdles with types, descriptions, habits}

HABIT CONTEXT:
{related habits with success rates}

OUTPUT:
1. Key learning insights (top 5)
2. Common hurdle patterns
3. Hurdle-specific solutions
4. Preventive strategies
5. Next learning opportunities
```

#### Behavior Change Focus

- **Learn from experience**: Captures what works
- **Obstacle awareness**: Identifies barriers early
- **Solution-focused**: Provides actionable solutions
- **Pattern recognition**: Learns from repeated experiences
- **Cross-pollination**: Shares wisdom across users (future)

---

## 💾 Database Interactions

### Read Access Matrix

| Agent | Users | Habits | Proofs | Learnings | Weeks | Groups | Hurdles | Personality |
|-------|-------|--------|--------|-----------|-------|--------|---------|-------------|
| **Orchestrator** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Mentor** | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ |
| **Identity** | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ |
| **Accountability** | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ |
| **Group** | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ | ✅ |
| **Learning** | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ |

### Write Access Matrix

| Agent | Users | Habits | Proofs | Learnings | Weeks | Groups | Hurdles | Personality |
|-------|-------|--------|--------|-----------|-------|--------|---------|-------------|
| **Orchestrator** | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Mentor** | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Identity** | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Accountability** | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Group** | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| **Learning** | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ✅ | ❌ |

**Note:** Most agents are read-only. Bot commands handle writes to databases.

---

## ⚡ Trigger System

### Automatic Triggers (Scheduled)

| Time | Agent | Action | Purpose |
|------|-------|--------|---------|
| **Wed 9 AM** | Mentor | Weekly Analysis | Comprehensive week review |
| **Wed 9 AM** | Identity | Identity Check | Alignment assessment |
| **Wed 9 AM** | Accountability | Progress Check | Intervention if needed |
| **Wed 9 AM** | Learning | Learning Synthesis | Extract weekly insights |
| **Wed 9 AM** | Group | Group Health Check | Monitor group dynamics |
| **Daily 6 AM** | (Bot) | Daily Count Message | Send habit counts |
| **User Best Time** | Accountability | Adaptive Reminder | Personalized reminder |

### Manual Triggers (Commands)

| Command | Primary Agent | Supporting Agents |
|---------|---------------|-------------------|
| `/agent <query>` | Orchestrator → Routes | All available |
| `/mentor` | Mentor | Learning |
| `/identity` | Identity | - |
| `/accountability` | Accountability | - |
| `/group` | Group | - |
| `/learning` | Learning | - |

### Context-Based Triggers

Messages containing keywords automatically route to agents:

| Keywords | Agent Routed To |
|----------|----------------|
| habit, feedback, coaching, analysis | Mentor |
| identity, personality, values, who am I | Identity |
| accountability, motivation, check in | Accountability |
| group, social, peer, team | Group |
| learning, hurdle, obstacle, pattern | Learning |

### Event-Based Triggers

| Event | Agent | Action |
|-------|-------|--------|
| Completion rate < 50% for 3 days | Accountability | Intervention |
| 7-day streak achieved | Accountability | Celebration |
| New hurdle logged | Learning | Generate solution |
| Group member inactive 3+ days | Group | Peer support nudge |
| Milestone achieved (10, 30, 66 days) | Accountability | Major celebration |

---

## 🔄 Agent Coordination

### Request Flow

```
User Message
    │
    ▼
┌─────────────┐
│ Orchestrator│ 
│  Receives   │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Classify   │  (Determine agent(s) needed)
│  Request    │
└──────┬──────┘
       │
       ├────────────────┬───────────────┐
       ▼                ▼               ▼
┌────────────┐   ┌────────────┐  ┌────────────┐
│  Primary   │   │ Supporting │  │ Supporting │
│   Agent    │   │  Agent 1   │  │  Agent 2   │
└─────┬──────┘   └──────┬─────┘  └──────┬─────┘
      │                 │                │
      └─────────────────┴────────────────┘
                        │
                        ▼
               ┌────────────────┐
               │   Aggregate    │
               │   Responses    │
               └────────┬───────┘
                        │
                        ▼
               ┌────────────────┐
               │  Send to User  │
               └────────────────┘
```

### Agent Selection Logic

1. **Primary Agent Selection**
   - Score each agent based on:
     - Keyword matching (40%)
     - Performance metrics (30%)
     - Specialization match (20%)
     - Response time (10%)
   - Select highest scoring agent

2. **Supporting Agent Selection**
   - Add agents that provide complementary context
   - Limit to 2 supporting agents max
   - Skip if confidence > 0.9

3. **Response Aggregation**
   - Primary response as base
   - Merge recommendations from supporting agents
   - Remove duplicates
   - Average confidence scores

---

## 🛠️ Implementation with Claude SDK

### Base Agent Structure

```typescript
import { Agent } from '@anthropic-ai/agent-sdk';

export class BaseAgent {
  protected agentId: string;
  protected agentName: string;
  protected capabilities: string[];
  protected perplexityClient: PerplexityClient;
  protected notionClient: NotionClient;
  
  constructor(
    id: string,
    name: string,
    capabilities: string[]
  ) {
    this.agentId = id;
    this.agentName = name;
    this.capabilities = capabilities;
  }
  
  // Core methods all agents implement
  abstract async initialize(): Promise<void>;
  abstract async processRequest(
    userContext: UserContext,
    request: string,
    metadata?: Record<string, any>
  ): Promise<AgentResponse>;
  
  // Shared utilities
  protected validateUserContext(context: UserContext): void {
    if (!context.user?.id) {
      throw new Error('Invalid user context');
    }
  }
  
  protected async gatherUserData(userId: string): Promise<UserContext> {
    // Gather comprehensive user data from Notion
    const user = await this.notionClient.getUserByDiscordId(userId);
    const habits = await this.notionClient.getHabitsByUserId(user.id);
    const proofs = await this.notionClient.getProofsByUserId(user.id);
    // ... etc
    
    return {
      user,
      current_habits: habits,
      recent_proofs: proofs,
      // ... etc
    };
  }
}
```

### Agent Implementation Pattern

```typescript
export class MentorAgent extends BaseAgent {
  constructor(perplexityClient: PerplexityClient, notionClient: NotionClient) {
    super('mentor', 'Mentor Agent', [
      'habit_analysis',
      'pattern_recognition',
      'coaching_advice'
    ]);
    
    this.perplexityClient = perplexityClient;
    this.notionClient = notionClient;
  }
  
  async initialize(): Promise<void> {
    // Verify dependencies
    if (!PerplexityClient.isAvailable()) {
      throw new Error('Perplexity API not available');
    }
    
    console.log('✅ Mentor Agent initialized');
  }
  
  async processRequest(
    userContext: UserContext,
    request: string,
    metadata?: Record<string, any>
  ): Promise<AgentResponse> {
    // 1. Validate context
    this.validateUserContext(userContext);
    
    // 2. Classify request type
    const requestType = this.classifyRequest(request);
    
    // 3. Route to appropriate sub-function
    let response: MentorResponse;
    switch (requestType) {
      case 'weekly_analysis':
        response = await this.performWeeklyAnalysis(userContext);
        break;
      case 'pattern_analysis':
        response = await this.analyzeHabitPatterns(userContext);
        break;
      // ... etc
    }
    
    // 4. Return formatted response
    return this.formatResponse(response);
  }
  
  private async performWeeklyAnalysis(
    userContext: UserContext
  ): Promise<MentorResponse> {
    // Build AI prompt
    const prompt = this.buildWeeklyAnalysisPrompt(userContext);
    
    // Call Perplexity AI
    const aiResponse = await this.perplexityClient.generateResponse(prompt);
    
    // Parse and structure response
    return {
      success: true,
      message: aiResponse,
      analysis: this.parseAnalysis(aiResponse),
      recommendations: this.extractRecommendations(aiResponse),
      confidence: 0.85
    };
  }
}
```

### Orchestrator Implementation

```typescript
export class Orchestrator extends BaseAgent {
  private agentRegistry: AgentRegistry;
  
  async processRequest(
    userContext: UserContext,
    request: string
  ): Promise<OrchestratorResponse> {
    // 1. Determine agent capabilities
    const capabilities = await this.determineAgentCapabilities(request);
    
    // 2. Select primary and supporting agents
    const primaryAgent = this.selectPrimaryAgent(capabilities, request);
    const supportingAgents = this.selectSupportingAgents(capabilities, request);
    
    // 3. Execute agents
    const primaryResponse = await primaryAgent.processRequest(
      userContext,
      request
    );
    
    const supportingResponses = await Promise.all(
      supportingAgents.map(agent => 
        agent.processRequest(userContext, request)
      )
    );
    
    // 4. Aggregate responses
    const aggregated = this.aggregateResponses(
      primaryResponse,
      supportingResponses
    );
    
    return {
      success: true,
      primary_agent: primaryAgent.agentId,
      response: aggregated,
      confidence: aggregated.confidence
    };
  }
}
```

### Agent Registry

```typescript
export class AgentRegistry {
  private static instance: AgentRegistry;
  private agents: Map<string, BaseAgent> = new Map();
  
  static getInstance(): AgentRegistry {
    if (!AgentRegistry.instance) {
      AgentRegistry.instance = new AgentRegistry();
    }
    return AgentRegistry.instance;
  }
  
  registerAgent(agent: BaseAgent): void {
    this.agents.set(agent.agentId, agent);
  }
  
  getAgent(agentId: string): BaseAgent | undefined {
    return this.agents.get(agentId);
  }
  
  getAllAgents(): BaseAgent[] {
    return Array.from(this.agents.values());
  }
  
  getActiveAgents(): BaseAgent[] {
    return this.getAllAgents().filter(agent => agent.isActive);
  }
}
```

---

## 🎯 Behavior Change Principles

### How Agents Drive Real Change

#### 1. **Data-Driven Insights**
- All recommendations backed by user's actual data
- Patterns identified from real behavior
- No generic advice – everything personalized

#### 2. **Identity-Based Formation**
- Habits framed as identity ("I am" vs. "I want to")
- Personality alignment increases adherence
- Values-based habit selection

#### 3. **Timely Interventions**
- Catch declining motivation early
- Prevent streak breaks before they happen
- Intervene when patterns show risk

#### 4. **Social Accountability**
- Peer pressure used positively
- Group identity reinforces individual habits
- High performers mentor low performers

#### 5. **Pattern Recognition**
- Learn from successes and failures
- Identify optimal contexts and timing
- Predict and prevent future obstacles

#### 6. **Adaptive Support**
- Support level matches user state
- Intensity varies with progress
- Celebrates all wins, big and small

#### 7. **Knowledge Synthesis**
- Captures learnings for future reference
- Shares successful strategies
- Builds personal habit wisdom

---

## 📊 Success Metrics

### Agent Performance Tracking

| Metric | Measurement | Target |
|--------|-------------|--------|
| **Response Time** | Time to process request | < 3 seconds |
| **Confidence Score** | Agent confidence in response | > 0.75 |
| **User Satisfaction** | Feedback ratings | > 4.0/5.0 |
| **Success Rate** | Successful completions | > 95% |
| **Intervention Effectiveness** | Behavior change after intervention | > 60% |

### Behavior Change Metrics

| Metric | Measurement | Target |
|--------|-------------|--------|
| **Habit Adherence** | Weekly completion rate | > 70% |
| **Streak Duration** | Average streak length | > 14 days |
| **Identity Alignment** | Habit-personality fit | > 80% |
| **Learning Capture** | Insights logged per week | > 2 |
| **Group Health** | Group motivation score | > 75% |

---

## 🚀 Next Steps

### Phase 1: Current State (✅ Complete)
- ✅ 5 agents implemented
- ✅ Orchestrator routing
- ✅ Notion database integration
- ✅ Weekly scheduler (Wed 9 AM)
- ✅ Manual commands working

### Phase 2: Enhancements (In Progress)
- ⏳ Daily adaptive reminders
- ⏳ Event-based triggers
- ⏳ Milestone celebrations
- ⏳ Group formation algorithm

### Phase 3: Future (Planned)
- 📋 Cross-user learning analytics
- 📋 Predictive hurdle detection
- 📋 AI-powered habit recommendations
- 📋 Real-time group dynamics
- 📋 Neo4j graph analytics

---

## 📝 Summary

**The Habit System uses 5 specialized AI agents coordinated by an orchestrator to provide comprehensive, personalized habit formation support:**

1. **Mentor Agent**: Analyzes patterns and provides coaching
2. **Identity Agent**: Ensures personality-habit alignment
3. **Accountability Agent**: Monitors progress and intervenes
4. **Group Agent**: Optimizes social dynamics
5. **Learning Agent**: Extracts insights and generates solutions

**All agents work together to create real behavior change through:**
- Data-driven personalization
- Identity-based habit formation
- Timely interventions
- Social accountability
- Pattern recognition
- Adaptive support
- Knowledge synthesis

**Result**: Users build lasting habits aligned with their identity, supported by AI that understands them deeply and coordinates intelligently to maximize success.

---

**Last Updated:** October 20, 2025  
**Version:** 2.0  
**Status:** Production - 5 Agents Active

