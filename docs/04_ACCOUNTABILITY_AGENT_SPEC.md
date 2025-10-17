# 📊 Accountability Agent - Detailed Specification

## 🎯 **Agent Purpose**
The Accountability Agent provides adaptive reminders, incentives, and motivation to help users stay committed to their habits and achieve their goals through intelligent accountability mechanisms.

## 🧠 **Core Capabilities**

### **1. Adaptive Reminder System** ⏰
- **Smart Timing**: Learns optimal reminder times for each user
- **Context-Aware Reminders**: Considers user's current situation and mood
- **Escalation Management**: Gradual increase in reminder intensity
- **Personalized Messaging**: Tailored reminder content based on user preferences

### **2. Incentive & Motivation Engine** 💪
- **Progress Celebrations**: Acknowledges achievements and milestones
- **Social Accountability**: Leverages group dynamics for motivation
- **Gamification Elements**: Points, streaks, and achievement systems
- **Loss Aversion**: Uses commitment devices and consequences

### **3. Goal Tracking & Intervention** 🎯
- **Real-time Progress Monitoring**: Tracks habit completion in real-time
- **Early Warning System**: Detects when users are at risk of failure
- **Intervention Triggers**: Automatic support when users struggle
- **Recovery Assistance**: Helps users get back on track after setbacks

## 🔧 **Technical Implementation**

### **Pydantic AI Agent Structure**
```typescript
interface AccountabilityAgent {
  model: 'perplexity:sonar-pro'
  outputType: AccountabilityResponse
  systemPrompt: AccountabilitySystemPrompt
  tools: [ReminderTool, IncentiveTool, ProgressTrackingTool, InterventionTool]
}

interface AccountabilityResponse {
  reminderMessage: string
  incentives: Incentive[]
  progressUpdate: ProgressUpdate
  interventions: Intervention[]
  motivation: MotivationMessage
}

interface ReminderMessage {
  content: string
  urgency: 'low' | 'medium' | 'high' | 'critical'
  timing: Date
  channel: 'personal' | 'group' | 'public'
}
```

### **Data Sources & Access**

#### **Notion Database Access**
- **Users**: Reminder preferences, motivation style, timezone
- **Habits**: Reminder settings, incentive preferences, escalation rules
- **Proofs**: Completion patterns, optimal reminder times
- **Reminder History**: Past reminder effectiveness and user responses
- **Incentive Systems**: Points, rewards, and achievement tracking

#### **Neo4j Graph Queries**
```cypher
// Find optimal reminder times
MATCH (u:User {id: $userId})-[:HAS_HABIT]->(h:Habit)
MATCH (h)-[:HAS_PROOF]->(p:Proof)
WHERE p.completed = true AND p.time IS NOT NULL
RETURN h.name, p.time, count(p) as success_count
ORDER BY success_count DESC

// Analyze reminder effectiveness
MATCH (u:User {id: $userId})-[:RECEIVED_REMINDER]->(r:Reminder)
MATCH (r)-[:LED_TO]->(p:Proof)
RETURN r.type, r.timing, count(p) as effectiveness

// Find motivation patterns
MATCH (u:User {id: $userId})-[:HAS_HABIT]->(h:Habit)
MATCH (h)-[:MOTIVATED_BY]->(m:Motivation)
WHERE m.effectiveness > 0.7
RETURN m.type, m.content, m.effectiveness
```

## ⏰ **Reminder System Architecture**

### **1. Smart Timing Algorithm**
```python
class ReminderTimingEngine:
    def __init__(self, user_id: str):
        self.user_id = user_id
        self.timing_data = self.load_timing_data()
    
    def calculate_optimal_time(self, habit: Habit) -> OptimalTiming:
        """
        Calculates the best time to send reminders for a specific habit
        """
        # Analyze historical success patterns
        success_times = self.get_successful_completion_times(habit)
        
        # Consider user preferences
        user_preferences = self.get_user_timing_preferences()
        
        # Factor in external constraints
        constraints = self.get_timing_constraints(habit)
        
        # Calculate optimal window
        optimal_window = self.find_optimal_window(
            success_times, user_preferences, constraints
        )
        
        return OptimalTiming(
            best_time=optimal_window.start,
            window_duration=optimal_window.duration,
            confidence=self.calculate_timing_confidence(optimal_window)
        )
```

### **2. Adaptive Escalation System**
```python
class EscalationManager:
    def __init__(self):
        self.escalation_levels = [
            'gentle_reminder',
            'supportive_nudge', 
            'concerned_check_in',
            'urgent_intervention',
            'crisis_support'
        ]
    
    def determine_escalation_level(self, user_id: str, habit_id: str) -> str:
        """
        Determines appropriate escalation level based on user behavior
        """
        # Analyze recent performance
        recent_performance = self.get_recent_performance(user_id, habit_id)
        
        # Check for patterns
        failure_pattern = self.analyze_failure_pattern(user_id, habit_id)
        
        # Consider user responsiveness
        responsiveness = self.get_user_responsiveness(user_id)
        
        # Determine escalation level
        if recent_performance.success_rate > 0.8:
            return 'gentle_reminder'
        elif recent_performance.success_rate > 0.6:
            return 'supportive_nudge'
        elif recent_performance.success_rate > 0.4:
            return 'concerned_check_in'
        elif recent_performance.success_rate > 0.2:
            return 'urgent_intervention'
        else:
            return 'crisis_support'
```

### **3. Context-Aware Messaging**
```python
def generate_contextual_reminder(
    user: User, 
    habit: Habit, 
    context: UserContext
) -> ReminderMessage:
    """
    Generates personalized reminder based on current context
    """
    # Analyze current context
    current_mood = context.get_current_mood()
    recent_activity = context.get_recent_activity()
    external_factors = context.get_external_factors()
    
    # Select appropriate tone and content
    if current_mood == 'stressed':
        tone = 'supportive'
        content = generate_supportive_reminder(habit, user)
    elif current_mood == 'motivated':
        tone = 'energetic'
        content = generate_energetic_reminder(habit, user)
    elif recent_activity == 'struggling':
        tone = 'encouraging'
        content = generate_encouraging_reminder(habit, user)
    else:
        tone = 'neutral'
        content = generate_standard_reminder(habit, user)
    
    return ReminderMessage(
        content=content,
        tone=tone,
        urgency=determine_urgency(context),
        personalization_level='high'
    )
```

## 💪 **Incentive & Motivation System**

### **1. Progress Celebration Engine**
```python
class ProgressCelebrationEngine:
    def __init__(self):
        self.milestone_types = [
            'first_completion',
            'streak_milestones',
            'weekly_goals',
            'monthly_achievements',
            'habit_mastery'
        ]
    
    def detect_milestones(self, user_id: str, habit_id: str) -> List[Milestone]:
        """
        Detects achievement milestones for celebration
        """
        milestones = []
        
        # Check for streak milestones
        current_streak = self.get_current_streak(user_id, habit_id)
        if current_streak in [3, 7, 14, 30, 66, 100]:
            milestones.append(Milestone(
                type='streak_milestone',
                value=current_streak,
                significance=self.calculate_streak_significance(current_streak)
            ))
        
        # Check for weekly goals
        weekly_progress = self.get_weekly_progress(user_id, habit_id)
        if weekly_progress.goal_achieved:
            milestones.append(Milestone(
                type='weekly_goal',
                value=weekly_progress.completion_rate,
                significance='high'
            ))
        
        return milestones
```

### **2. Social Accountability System**
```python
class SocialAccountabilityManager:
    def __init__(self):
        self.accountability_types = [
            'peer_check_in',
            'group_sharing',
            'mentor_reporting',
            'public_commitment',
            'buddy_system'
        ]
    
    def activate_social_accountability(
        self, 
        user_id: str, 
        habit_id: str, 
        level: str
    ) -> SocialAccountabilityAction:
        """
        Activates appropriate social accountability mechanism
        """
        if level == 'low':
            return self.setup_peer_check_in(user_id, habit_id)
        elif level == 'medium':
            return self.setup_group_sharing(user_id, habit_id)
        elif level == 'high':
            return self.setup_mentor_reporting(user_id, habit_id)
        elif level == 'critical':
            return self.setup_public_commitment(user_id, habit_id)
```

### **3. Gamification Elements**
```python
class GamificationEngine:
    def __init__(self):
        self.point_systems = {
            'habit_completion': 10,
            'streak_bonus': 5,
            'weekly_goal': 25,
            'helping_others': 15,
            'learning_share': 10
        }
    
    def calculate_points(self, user_id: str, action: str) -> int:
        """
        Calculates points for user actions
        """
        base_points = self.point_systems.get(action, 0)
        
        # Apply multipliers
        streak_multiplier = self.get_streak_multiplier(user_id)
        consistency_multiplier = self.get_consistency_multiplier(user_id)
        
        total_points = base_points * streak_multiplier * consistency_multiplier
        
        return int(total_points)
```

## 🎯 **Agent Behavior Patterns**

### **1. Proactive Reminder Mode** ⏰
**Trigger**: Scheduled based on optimal timing for each habit
**Action**: 
- Send personalized reminder message
- Adjust timing based on effectiveness
- Escalate if user consistently misses

**Prompt Engineering**:
```
You are sending a personalized reminder for {userName}'s habit: {habitName}

Context:
- User's current streak: {currentStreak}
- Optimal completion time: {optimalTime}
- Recent performance: {recentPerformance}
- User's motivation style: {motivationStyle}
- Current mood indicators: {moodIndicators}

Create a reminder that:
1. Is appropriately urgent ({urgencyLevel})
2. Matches user's communication style
3. Provides specific motivation for this habit
4. Includes helpful context or tips
5. Maintains encouraging tone

Keep it concise but personal.
```

### **2. Progress Celebration Mode** 🎉
**Trigger**: When user achieves milestones or goals
**Action**:
- Celebrate achievement with personalized message
- Award points or recognition
- Share success with group (if appropriate)
- Set next milestone

**Prompt Engineering**:
```
You are celebrating {userName}'s achievement: {achievement}

Achievement Details:
- Type: {achievementType}
- Value: {achievementValue}
- Significance: {significance}
- User's journey: {journeyContext}
- Previous struggles: {pastChallenges}

Create a celebration message that:
1. Acknowledges the specific achievement
2. Highlights the user's effort and growth
3. Connects to their larger goals
4. Encourages continued progress
5. Shares appropriate pride and excitement

Be genuine and specific in your praise.
```

### **3. Crisis Intervention Mode** 🚨
**Trigger**: When user misses multiple habits or shows signs of giving up
**Action**:
- Immediate supportive intervention
- Identify root causes of struggle
- Provide emergency support strategies
- Activate additional accountability measures

**Prompt Engineering**:
```
URGENT: {userName} is struggling with their habits and needs immediate support.

Crisis Details:
- Missed habits: {missedHabits}
- Streak broken: {brokenStreak}
- Signs of giving up: {givingUpSigns}
- User's personality: {personality}
- Support network: {supportNetwork}

Provide immediate intervention:
1. Acknowledge the struggle without judgment
2. Identify likely causes of the setback
3. Offer 2-3 simple recovery strategies
4. Activate appropriate support mechanisms
5. Rebuild confidence with achievable next steps

Be compassionate, practical, and hopeful.
```

## 📊 **Accountability Metrics & Analytics**

### **1. Reminder Effectiveness Tracking**
```python
def track_reminder_effectiveness(user_id: str) -> ReminderEffectiveness:
    """
    Tracks how effective different reminder strategies are
    """
    reminders = get_reminder_history(user_id)
    
    effectiveness_by_type = {}
    effectiveness_by_timing = {}
    effectiveness_by_content = {}
    
    for reminder in reminders:
        # Calculate effectiveness
        effectiveness = calculate_reminder_effectiveness(reminder)
        
        # Track by type
        if reminder.type not in effectiveness_by_type:
            effectiveness_by_type[reminder.type] = []
        effectiveness_by_type[reminder.type].append(effectiveness)
        
        # Track by timing
        time_slot = categorize_time_slot(reminder.sent_time)
        if time_slot not in effectiveness_by_timing:
            effectiveness_by_timing[time_slot] = []
        effectiveness_by_timing[time_slot].append(effectiveness)
    
    return ReminderEffectiveness(
        overall_effectiveness=calculate_overall_effectiveness(reminders),
        by_type=effectiveness_by_type,
        by_timing=effectiveness_by_timing,
        recommendations=get_effectiveness_recommendations(effectiveness_by_type)
    )
```

### **2. Motivation Style Analysis**
```python
def analyze_motivation_style(user_id: str) -> MotivationStyle:
    """
    Analyzes what types of motivation work best for the user
    """
    # Analyze response to different motivation types
    motivation_responses = get_motivation_response_history(user_id)
    
    # Calculate effectiveness by motivation type
    motivation_effectiveness = {}
    for motivation_type in ['intrinsic', 'extrinsic', 'social', 'achievement', 'fear']:
        responses = [r for r in motivation_responses if r.type == motivation_type]
        effectiveness = calculate_motivation_effectiveness(responses)
        motivation_effectiveness[motivation_type] = effectiveness
    
    # Identify dominant motivation style
    dominant_style = max(motivation_effectiveness, key=motivation_effectiveness.get)
    
    return MotivationStyle(
        dominant_style=dominant_style,
        effectiveness_scores=motivation_effectiveness,
        recommendations=get_motivation_recommendations(motivation_effectiveness)
    )
```

## 🎯 **Integration Points**

### **Discord Integration**
- **Personal Channel**: Direct accountability messages and reminders
- **Group Channels**: Social accountability and group motivation
- **Slash Commands**: `/remind-me`, `/check-progress`, `/request-support`
- **Interactive Buttons**: Quick responses to accountability prompts
- **Scheduled Messages**: Automated reminders and progress checks

### **Notion Integration**
- **Reminder Settings**: Store user preferences and timing data
- **Progress Tracking**: Log reminder effectiveness and user responses
- **Incentive History**: Track points, rewards, and achievements
- **Accountability Logs**: Record accountability actions and outcomes

### **Neo4j Integration**
- **Reminder Patterns**: Graph relationships between reminders and success
- **Motivation Networks**: Map effective motivation strategies
- **Social Connections**: Track accountability relationships
- **Behavioral Patterns**: Analyze accountability response patterns

## 🧪 **Testing Strategy**

### **Unit Tests**
- Reminder timing algorithms
- Escalation logic
- Incentive calculations
- Progress tracking accuracy

### **Integration Tests**
- Discord message delivery
- Notion data synchronization
- Neo4j query performance
- Cross-agent communication

### **User Acceptance Tests**
- Reminder effectiveness
- User satisfaction with accountability
- Motivation response quality
- Intervention success rates

## 📈 **Success Metrics**

### **Technical Metrics**
- Reminder delivery success: > 99%
- Response time: < 1 second
- Escalation accuracy: > 85%
- System uptime: > 99.9%

### **User Experience Metrics**
- Habit completion rate improvement
- User engagement with accountability features
- Reminder effectiveness ratings
- User retention rate

---

## 🚀 **Implementation Priority**

### **Phase 1: Basic Reminder System** (Week 1-2)
1. Simple reminder scheduling and delivery
2. Basic escalation logic
3. Progress tracking integration
4. Discord message formatting

### **Phase 2: Smart Timing & Personalization** (Week 3-4)
1. Optimal timing algorithms
2. Context-aware messaging
3. User preference learning
4. Reminder effectiveness tracking

### **Phase 3: Incentive & Motivation Systems** (Week 5-6)
1. Progress celebration engine
2. Gamification elements
3. Social accountability features
4. Motivation style analysis

### **Phase 4: Advanced Intervention** (Week 7-8)
1. Crisis intervention protocols
2. Advanced escalation management
3. Predictive failure detection
4. Recovery assistance systems

---

*The Accountability Agent ensures users stay motivated and committed to their habits through intelligent, personalized accountability mechanisms that adapt to their needs and preferences.*
