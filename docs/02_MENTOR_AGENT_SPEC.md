# 🧘‍♂️ Mentor Agent - Detailed Specification

## 🎯 **Agent Purpose**
The Mentor Agent serves as a personalized habit coach that analyzes patterns, provides feedback, and offers actionable advice to help users succeed with their habits.

## 🧠 **Core Capabilities**

### **1. Pattern Analysis** 📊
- **Success Pattern Recognition**: Identifies what worked in the past
- **Failure Pattern Detection**: Recognizes common failure points
- **Trend Analysis**: Tracks progress over time
- **Correlation Discovery**: Finds relationships between habits and outcomes

### **2. Personalized Coaching** 💬
- **Contextual Advice**: Provides advice based on current situation
- **Motivational Support**: Encourages users during difficult times
- **Strategic Guidance**: Suggests habit modifications and improvements
- **Goal Refinement**: Helps adjust goals based on performance

### **3. Feedback Generation** 📝
- **Weekly Reports**: Comprehensive habit performance analysis
- **Daily Check-ins**: Quick motivational messages
- **Progress Celebrations**: Acknowledges achievements
- **Constructive Criticism**: Points out areas for improvement

## 🔧 **Technical Implementation**

### **Pydantic AI Agent Structure**
```typescript
interface MentorAgent {
  // Core agent with Perplexity integration
  model: 'perplexity:sonar-pro'
  outputType: MentorResponse
  systemPrompt: MentorSystemPrompt
  tools: [NotionTool, Neo4jTool, AnalysisTool]
}

interface MentorResponse {
  message: string
  suggestions: string[]
  analysis: HabitAnalysis
  nextSteps: string[]
  confidence: number
}
```

### **Data Sources & Access**

#### **Notion Database Access**
- **Users**: Personal info, preferences, timezone
- **Habits**: Definitions, goals, frequency, context
- **Proofs**: Completion history, notes, evidence
- **Learnings**: User insights and discoveries
- **Weeks**: Weekly summaries and scores
- **Personal Profiles**: Extended personality data

#### **Neo4j Graph Queries**
```cypher
// Find successful habit patterns
MATCH (u:User {id: $userId})-[:HAS_HABIT]->(h:Habit)
WHERE h.successRate > 0.7
RETURN h.name, h.context, h.frequency

// Analyze failure patterns
MATCH (u:User {id: $userId})-[:PROVIDES_PROOF]->(p:Proof)
WHERE p.completed = false
RETURN p.habit, p.date, p.note

// Find habit correlations
MATCH (h1:Habit)-[:CORRELATES_WITH]->(h2:Habit)
WHERE h1.userId = $userId
RETURN h1.name, h2.name, correlation
```

## 🎭 **Agent Behavior Patterns**

### **1. Morning Analysis Mode** 🌅
**Trigger**: Daily at 9 AM (user's timezone)
**Action**: 
- Analyze previous day's performance
- Send motivational message
- Suggest daily focus areas

**Prompt Engineering**:
```
You are analyzing yesterday's habit performance for {userName}.

Context:
- Completed habits: {completedHabits}
- Missed habits: {missedHabits}
- User's goals: {goals}
- Previous patterns: {patterns}

Provide:
1. Brief analysis of yesterday's performance
2. One key insight or observation
3. Today's focus suggestion
4. Motivational encouragement

Keep response under 200 words, be specific and actionable.
```

### **2. Weekly Deep Analysis Mode** 📈
**Trigger**: Sunday evening
**Action**:
- Comprehensive week analysis
- Pattern identification
- Next week recommendations

**Prompt Engineering**:
```
You are a habit coach providing weekly analysis for {userName}.

Week Data:
- Habit completions: {weekProofs}
- Success rate: {successRate}%
- Best performing habits: {topHabits}
- Struggling habits: {strugglingHabits}
- User learnings: {learnings}
- Identified hurdles: {hurdles}

Provide detailed analysis including:
1. What went well this week
2. Patterns you've identified
3. Specific challenges and solutions
4. Recommendations for next week
5. One key habit to focus on

Be encouraging but honest, provide actionable insights.
```

### **3. Crisis Intervention Mode** 🚨
**Trigger**: When user misses 3+ habits in a row
**Action**:
- Immediate support message
- Identify root cause
- Provide emergency strategies

**Prompt Engineering**:
```
URGENT: User {userName} is struggling with habits.

Situation:
- Missed habits: {missedHabits}
- Streak broken: {brokenStreak}
- Last success: {lastSuccess}
- User's personality: {personality}

Provide immediate support:
1. Acknowledge the struggle
2. Identify likely causes
3. Suggest 2-3 emergency strategies
4. Offer hope and encouragement
5. Propose a simple restart plan

Be empathetic, practical, and motivating.
```

## 📊 **Analysis Algorithms**

### **1. Success Pattern Detection**
```python
def analyze_success_patterns(user_id: str, habit_id: str) -> SuccessPattern:
    """
    Analyzes what conditions lead to habit success
    """
    # Query successful proof instances
    successful_proofs = get_successful_proofs(user_id, habit_id)
    
    # Analyze patterns in:
    # - Time of day
    # - Day of week
    # - Weather/context
    # - Preceding habits
    # - User mood/energy
    
    return SuccessPattern(
        optimal_time=find_optimal_time(successful_proofs),
        best_context=find_best_context(successful_proofs),
        success_triggers=find_success_triggers(successful_proofs)
    )
```

### **2. Failure Pattern Analysis**
```python
def analyze_failure_patterns(user_id: str, habit_id: str) -> FailurePattern:
    """
    Identifies common failure points and obstacles
    """
    failed_proofs = get_failed_proofs(user_id, habit_id)
    
    # Analyze failure patterns:
    # - Common failure times
    # - Recurring obstacles
    # - External factors
    # - Internal resistance
    
    return FailurePattern(
        failure_times=find_failure_times(failed_proofs),
        common_obstacles=find_common_obstacles(failed_proofs),
        resistance_patterns=find_resistance_patterns(failed_proofs)
    )
```

### **3. Habit Correlation Analysis**
```python
def find_habit_correlations(user_id: str) -> List[HabitCorrelation]:
    """
    Finds relationships between different habits
    """
    # Use Neo4j to find:
    # - Habits that support each other
    # - Habits that compete
    # - Optimal habit sequences
    # - Habit clusters
    
    return correlations
```

## 🎯 **Coaching Strategies**

### **1. Micro-Adjustments** 🔧
- **Time Optimization**: Suggest better times for habits
- **Context Refinement**: Recommend environmental changes
- **Habit Stacking**: Suggest habit combinations
- **Minimal Dose**: Recommend smaller, more achievable goals

### **2. Motivation Techniques** 💪
- **Progress Celebration**: Highlight wins and improvements
- **Future Self Connection**: Help visualize long-term benefits
- **Identity Reinforcement**: Connect habits to user's identity
- **Social Proof**: Share relevant success stories

### **3. Obstacle Management** 🚧
- **Anticipation**: Help prepare for known challenges
- **Flexibility**: Suggest backup plans
- **Environment Design**: Recommend environmental changes
- **Mindset Shifts**: Help reframe challenges

## 📱 **Integration Points**

### **Discord Integration**
- **Personal Channel**: Primary communication channel
- **Slash Commands**: `/mentor-feedback`, `/habit-analysis`
- **Scheduled Messages**: Daily and weekly reports
- **Interactive Buttons**: Quick feedback and responses

### **Notion Integration**
- **Real-time Data**: Access to latest user data
- **Learning Capture**: Store insights and recommendations
- **Progress Tracking**: Update user progress metrics
- **Feedback History**: Maintain coaching conversation history

### **Neo4j Integration**
- **Pattern Queries**: Complex relationship analysis
- **Graph Analytics**: PageRank for habit importance
- **Correlation Analysis**: Find hidden connections
- **Predictive Modeling**: Forecast habit success

## 🧪 **Testing Strategy**

### **Unit Tests**
- Pattern analysis functions
- Coaching response generation
- Data query accuracy
- Error handling

### **Integration Tests**
- Notion API connectivity
- Neo4j query performance
- Discord message formatting
- Agent response quality

### **User Acceptance Tests**
- Coaching effectiveness
- User satisfaction
- Response relevance
- Actionability of advice

## 📈 **Performance Metrics**

### **Technical Metrics**
- Response time: < 2 seconds
- Accuracy: > 85% relevant advice
- Uptime: > 99.5%
- Error rate: < 1%

### **User Experience Metrics**
- User engagement: Daily active usage
- Habit improvement: Success rate increase
- User satisfaction: Feedback scores
- Actionability: User follows recommendations

---

## 🚀 **Implementation Priority**

### **Phase 1: Core Functionality** (Week 1-2)
1. Basic agent structure with Pydantic AI
2. Notion database integration
3. Simple pattern analysis
4. Basic coaching responses

### **Phase 2: Advanced Analysis** (Week 3-4)
1. Neo4j integration
2. Complex pattern detection
3. Correlation analysis
4. Predictive insights

### **Phase 3: Personalized Coaching** (Week 5-6)
1. Personality-based coaching
2. Context-aware responses
3. Advanced prompting strategies
4. Crisis intervention

### **Phase 4: Optimization** (Week 7-8)
1. Performance optimization
2. Response quality improvement
3. User feedback integration
4. Advanced analytics

---

*The Mentor Agent serves as the heart of the habit coaching system, providing personalized, data-driven guidance that helps users understand their patterns and improve their habit success rates.*
