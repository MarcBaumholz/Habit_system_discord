# 🆔 Identity Agent - Detailed Specification

## 🎯 **Agent Purpose**
The Identity Agent analyzes user personality traits, preferences, and identity to recommend habits that align with the user's authentic self and help them become who they want to be.

## 🧠 **Core Capabilities**

### **1. Personality Analysis** 🔍
- **Trait Assessment**: Analyzes user's personality characteristics
- **Preference Mapping**: Identifies user preferences and patterns
- **Identity Profiling**: Builds comprehensive user identity profile
- **Behavioral Pattern Recognition**: Understands how user naturally operates

### **2. Habit-Personality Matching** 🎯
- **Compatibility Scoring**: Rates how well habits match user's personality
- **Identity-Based Recommendations**: Suggests habits that align with desired identity
- **Goal-Personality Alignment**: Ensures goals match user's authentic self
- **Lifestyle Integration**: Recommends habits that fit user's lifestyle

### **3. Identity Evolution Tracking** 🌱
- **Identity Change Monitoring**: Tracks how habits shape user identity
- **Progress Alignment**: Ensures habit progress aligns with identity goals
- **Authenticity Validation**: Confirms habits support authentic self-expression
- **Identity Reinforcement**: Strengthens desired identity through habit success

## 🔧 **Technical Implementation**

### **Pydantic AI Agent Structure**
```typescript
interface IdentityAgent {
  model: 'perplexity:sonar-pro'
  outputType: IdentityResponse
  systemPrompt: IdentitySystemPrompt
  tools: [PersonalityTool, HabitMatchingTool, IdentityTrackingTool]
}

interface IdentityResponse {
  personalityProfile: PersonalityProfile
  habitRecommendations: HabitRecommendation[]
  identityAlignment: IdentityAlignment
  suggestions: IdentitySuggestion[]
  confidence: number
}

interface PersonalityProfile {
  traits: PersonalityTrait[]
  preferences: UserPreference[]
  identityGoals: string[]
  behavioralPatterns: BehavioralPattern[]
}
```

### **Data Sources & Access**

#### **Notion Database Access**
- **Users**: Basic personality information
- **Personal Profiles**: Extended personality data, values, interests
- **Habits**: Current and past habits with success rates
- **Proofs**: Habit completion patterns and context
- **Identity Goals**: User's desired identity and values

#### **Neo4j Graph Queries**
```cypher
// Find personality-habit correlations
MATCH (u:User {id: $userId})-[:HAS_PERSONALITY]->(p:Personality)
MATCH (p)-[:CORRELATES_WITH]->(h:Habit)
WHERE h.successRate > 0.7
RETURN h.name, h.type, correlation

// Find similar users with successful habits
MATCH (u1:User {id: $userId})-[:SIMILAR_PERSONALITY]->(u2:User)
MATCH (u2)-[:HAS_HABIT]->(h:Habit)
WHERE h.successRate > 0.8
RETURN h.name, h.description, h.context

// Analyze identity evolution
MATCH (u:User {id: $userId})-[:HAS_HABIT]->(h:Habit)
MATCH (h)-[:SUPPORTS_IDENTITY]->(i:Identity)
RETURN i.name, i.strength, h.name
```

## 🎭 **Personality Analysis Framework**

### **1. Big Five Personality Traits** 📊
```python
class PersonalityProfile:
    openness: float  # 0-1 scale
    conscientiousness: float
    extraversion: float
    agreeableness: float
    neuroticism: float
    
    # Derived traits
    creativity: float
    discipline: float
    social_energy: float
    empathy: float
    stress_resistance: float
```

### **2. Habit-Personality Mapping** 🎯
```python
HABIT_PERSONALITY_MAPPING = {
    "morning_routine": {
        "high_conscientiousness": 0.9,
        "low_extraversion": 0.7,
        "high_openness": 0.6
    },
    "social_exercise": {
        "high_extraversion": 0.8,
        "high_agreeableness": 0.7,
        "low_neuroticism": 0.6
    },
    "creative_practice": {
        "high_openness": 0.9,
        "low_conscientiousness": 0.5,
        "high_creativity": 0.8
    }
}
```

### **3. Identity-Based Recommendations** 🎭
```python
def get_identity_aligned_habits(user_profile: PersonalityProfile) -> List[HabitRecommendation]:
    """
    Recommends habits that align with user's personality and desired identity
    """
    recommendations = []
    
    # Analyze current identity goals
    identity_goals = get_identity_goals(user_profile.user_id)
    
    # Find habits that support identity goals
    for goal in identity_goals:
        supporting_habits = find_habits_for_identity(goal)
        
        # Score compatibility with personality
        for habit in supporting_habits:
            compatibility = calculate_personality_compatibility(
                habit, user_profile
            )
            
            if compatibility > 0.7:
                recommendations.append(HabitRecommendation(
                    habit=habit,
                    compatibility=compatibility,
                    identity_impact=calculate_identity_impact(habit, goal)
                ))
    
    return sorted(recommendations, key=lambda x: x.compatibility, reverse=True)
```

## 🎯 **Identity Analysis Algorithms**

### **1. Personality Trait Extraction**
```python
def extract_personality_traits(user_data: UserData) -> PersonalityProfile:
    """
    Extracts personality traits from user behavior and preferences
    """
    # Analyze habit patterns
    habit_patterns = analyze_habit_patterns(user_data.habits)
    
    # Analyze social preferences
    social_preferences = analyze_social_behavior(user_data.proofs)
    
    # Analyze goal-setting patterns
    goal_patterns = analyze_goal_patterns(user_data.goals)
    
    # Calculate Big Five traits
    traits = calculate_big_five_traits(
        habit_patterns, social_preferences, goal_patterns
    )
    
    return PersonalityProfile(
        traits=traits,
        preferences=extract_preferences(user_data),
        behavioral_patterns=identify_patterns(user_data)
    )
```

### **2. Identity-Goal Alignment**
```python
def check_identity_goal_alignment(
    habits: List[Habit], 
    identity_goals: List[str]
) -> IdentityAlignment:
    """
    Checks how well current habits align with desired identity
    """
    alignment_scores = {}
    
    for goal in identity_goals:
        supporting_habits = [h for h in habits if supports_identity(h, goal)]
        alignment_scores[goal] = len(supporting_habits) / len(habits)
    
    return IdentityAlignment(
        overall_alignment=sum(alignment_scores.values()) / len(alignment_scores),
        goal_alignments=alignment_scores,
        recommendations=get_alignment_recommendations(alignment_scores)
    )
```

### **3. Habit Compatibility Scoring**
```python
def calculate_habit_compatibility(
    habit: Habit, 
    personality: PersonalityProfile
) -> float:
    """
    Calculates how compatible a habit is with user's personality
    """
    # Get habit personality requirements
    requirements = HABIT_PERSONALITY_MAPPING.get(habit.type, {})
    
    compatibility_score = 0.0
    total_weight = 0.0
    
    for trait, required_level in requirements.items():
        user_trait_value = getattr(personality, trait, 0.5)
        
        # Calculate compatibility (closer values = higher compatibility)
        compatibility = 1 - abs(user_trait_value - required_level)
        weight = required_level  # Higher requirements = higher weight
        
        compatibility_score += compatibility * weight
        total_weight += weight
    
    return compatibility_score / total_weight if total_weight > 0 else 0.5
```

## 🎭 **Agent Behavior Patterns**

### **1. Personality Assessment Mode** 🔍
**Trigger**: When user first joins or requests personality analysis
**Action**: 
- Analyze existing data for personality indicators
- Generate comprehensive personality profile
- Identify key traits and preferences

**Prompt Engineering**:
```
You are a personality analyst specializing in habit formation.

User Data:
- Current habits: {habits}
- Habit success patterns: {successPatterns}
- User preferences: {preferences}
- Goals and values: {goals}

Analyze and provide:
1. Big Five personality traits assessment
2. Key behavioral patterns
3. Core preferences and values
4. Identity goals and aspirations
5. Habit formation style

Be specific and evidence-based in your analysis.
```

### **2. Identity-Based Recommendation Mode** 🎯
**Trigger**: When user requests habit recommendations
**Action**:
- Analyze personality-habit compatibility
- Recommend identity-aligned habits
- Suggest habit modifications

**Prompt Engineering**:
```
You are recommending habits based on personality and identity alignment.

User Profile:
- Personality traits: {personality}
- Identity goals: {identityGoals}
- Current habits: {currentHabits}
- Lifestyle factors: {lifestyle}

Recommend habits that:
1. Align with personality traits
2. Support identity goals
3. Fit lifestyle constraints
4. Build on existing strengths
5. Address growth opportunities

Provide specific, actionable recommendations with reasoning.
```

### **3. Identity Evolution Tracking Mode** 🌱
**Trigger**: Weekly identity progress review
**Action**:
- Track identity development through habits
- Assess progress toward identity goals
- Suggest identity reinforcement strategies

**Prompt Engineering**:
```
You are tracking identity evolution through habit formation.

Progress Data:
- Habit completions: {completions}
- Identity-supporting actions: {identityActions}
- Goal progress: {goalProgress}
- Behavioral changes: {behavioralChanges}

Analyze and provide:
1. Identity development progress
2. Habits supporting identity growth
3. Areas needing attention
4. Identity reinforcement strategies
5. Next steps for identity evolution

Focus on how habits are shaping the user's identity.
```

## 📊 **Identity Metrics & Analytics**

### **1. Identity Alignment Score**
```python
def calculate_identity_alignment_score(user_id: str) -> float:
    """
    Calculates how well user's habits align with their desired identity
    """
    habits = get_user_habits(user_id)
    identity_goals = get_identity_goals(user_id)
    
    total_alignment = 0.0
    for goal in identity_goals:
        supporting_habits = count_habits_supporting_goal(habits, goal)
        alignment = supporting_habits / len(habits)
        total_alignment += alignment
    
    return total_alignment / len(identity_goals)
```

### **2. Personality-Habit Compatibility**
```python
def track_personality_habit_compatibility(user_id: str) -> Dict[str, float]:
    """
    Tracks compatibility between user's personality and their habits
    """
    personality = get_personality_profile(user_id)
    habits = get_user_habits(user_id)
    
    compatibility_scores = {}
    for habit in habits:
        score = calculate_habit_compatibility(habit, personality)
        compatibility_scores[habit.name] = score
    
    return compatibility_scores
```

### **3. Identity Evolution Tracking**
```python
def track_identity_evolution(user_id: str, timeframe: str) -> IdentityEvolution:
    """
    Tracks how user's identity is evolving through habit formation
    """
    # Get historical data
    historical_habits = get_historical_habits(user_id, timeframe)
    current_habits = get_current_habits(user_id)
    
    # Analyze identity changes
    identity_strength_changes = analyze_identity_strength_changes(
        historical_habits, current_habits
    )
    
    return IdentityEvolution(
        identity_strength_changes=identity_strength_changes,
        new_identity_aspects=identify_new_identity_aspects(current_habits),
        identity_goals_progress=track_identity_goals_progress(user_id)
    )
```

## 🎯 **Integration Points**

### **Discord Integration**
- **Personal Channel**: Identity analysis and recommendations
- **Slash Commands**: `/identity-analysis`, `/personality-habits`, `/identity-goals`
- **Interactive Elements**: Personality quizzes, identity goal setting
- **Scheduled Messages**: Weekly identity progress updates

### **Notion Integration**
- **Personal Profiles**: Store personality assessments and identity goals
- **Habit Recommendations**: Track recommended vs. adopted habits
- **Identity Evolution**: Log identity development over time
- **Compatibility Scores**: Store habit-personality compatibility data

### **Neo4j Integration**
- **Personality-Habit Correlations**: Graph relationships between traits and habits
- **User Similarity**: Find users with similar personalities
- **Identity Networks**: Map identity goals and supporting habits
- **Evolution Tracking**: Track identity changes over time

## 🧪 **Testing Strategy**

### **Unit Tests**
- Personality trait extraction accuracy
- Habit compatibility scoring
- Identity alignment calculations
- Recommendation quality

### **Integration Tests**
- Notion data accuracy
- Neo4j query performance
- Discord message formatting
- Cross-agent communication

### **User Acceptance Tests**
- Personality assessment accuracy
- Recommendation relevance
- Identity goal alignment
- User satisfaction with recommendations

## 📈 **Success Metrics**

### **Technical Metrics**
- Personality assessment accuracy: > 80%
- Recommendation relevance: > 85%
- Response time: < 3 seconds
- Data consistency: > 99%

### **User Experience Metrics**
- User engagement with recommendations
- Habit adoption rate from recommendations
- Identity goal progress
- User satisfaction with personality insights

---

## 🚀 **Implementation Priority**

### **Phase 1: Basic Personality Analysis** (Week 1-2)
1. Personality trait extraction from existing data
2. Basic habit-personality compatibility scoring
3. Simple identity-based recommendations
4. Notion integration for personality profiles

### **Phase 2: Advanced Identity Matching** (Week 3-4)
1. Neo4j integration for personality-habit correlations
2. Complex identity goal alignment analysis
3. User similarity matching
4. Advanced recommendation algorithms

### **Phase 3: Identity Evolution Tracking** (Week 5-6)
1. Identity development monitoring
2. Long-term identity evolution analysis
3. Identity reinforcement strategies
4. Cross-user identity pattern analysis

### **Phase 4: Optimization & Personalization** (Week 7-8)
1. Recommendation quality improvement
2. Personality assessment refinement
3. User feedback integration
4. Advanced analytics and insights

---

*The Identity Agent ensures that habit recommendations are not just effective, but also authentic to the user's personality and supportive of their desired identity transformation.*
