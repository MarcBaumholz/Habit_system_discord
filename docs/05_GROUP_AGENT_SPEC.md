# 👥 Group Agent - Detailed Specification

## 🎯 **Agent Purpose**
The Group Agent manages group dynamics, analyzes group performance, matches users with compatible accountability partners, and prevents group breakdowns through intelligent social coordination.

## 🧠 **Core Capabilities**

### **1. Group Formation & Matching** 🤝
- **Compatibility Analysis**: Matches users based on personality, goals, and habits
- **Dynamic Group Formation**: Creates optimal group compositions
- **Group Stability Prediction**: Identifies groups at risk of breaking apart
- **Intervention Strategies**: Implements strategies to maintain group cohesion

### **2. Group Performance Analysis** 📊
- **Collective Progress Tracking**: Monitors group-wide habit success rates
- **Peer Influence Analysis**: Understands how group members affect each other
- **High/Low Performer Identification**: Recognizes group dynamics and roles
- **Group Motivation Management**: Maintains positive group energy

### **3. Social Coordination** 🌐
- **Communication Facilitation**: Encourages positive group interactions
- **Conflict Resolution**: Mediates disputes and tensions
- **Group Rituals**: Establishes positive group traditions and practices
- **Peer Support Activation**: Leverages group members to support struggling individuals

## 🔧 **Technical Implementation**

### **Pydantic AI Agent Structure**
```typescript
interface GroupAgent {
  model: 'perplexity:sonar-pro'
  outputType: GroupResponse
  systemPrompt: GroupSystemPrompt
  tools: [GroupMatchingTool, PerformanceAnalysisTool, SocialCoordinationTool]
}

interface GroupResponse {
  groupAnalysis: GroupAnalysis
  recommendations: GroupRecommendation[]
  interventions: GroupIntervention[]
  socialActions: SocialAction[]
  groupHealth: GroupHealth
}

interface GroupAnalysis {
  performance: GroupPerformance
  dynamics: GroupDynamics
  compatibility: CompatibilityMatrix
  risks: RiskAssessment[]
}
```

### **Data Sources & Access**

#### **Notion Database Access**
- **Users**: Personality profiles, preferences, communication styles
- **Groups**: Group compositions, roles, performance history
- **Habits**: Shared habits, group challenges, collaborative goals
- **Proofs**: Group performance data, peer influence patterns
- **Group Interactions**: Communication logs, support exchanges

#### **Neo4j Graph Queries**
```cypher
// Find compatible users for group formation
MATCH (u1:User)-[:HAS_PERSONALITY]->(p1:Personality)
MATCH (u2:User)-[:HAS_PERSONALITY]->(p2:Personality)
WHERE u1 <> u2 AND p1.compatibility_score > 0.7
RETURN u1, u2, p1.compatibility_score

// Analyze group performance patterns
MATCH (g:Group)-[:CONTAINS]->(u:User)
MATCH (u)-[:HAS_HABIT]->(h:Habit)
MATCH (h)-[:HAS_PROOF]->(p:Proof)
RETURN g.name, avg(p.success_rate) as group_performance

// Identify group influence patterns
MATCH (u1:User)-[:INFLUENCES]->(u2:User)
MATCH (u2)-[:HAS_HABIT]->(h:Habit)
WHERE u1.group_id = u2.group_id
RETURN u1.name, u2.name, h.name, influence_strength
```

## 🤝 **Group Formation Algorithms**

### **1. Compatibility Scoring System**
```python
class GroupCompatibilityEngine:
    def __init__(self):
        self.compatibility_factors = [
            'personality_traits',
            'habit_types',
            'goal_alignment',
            'communication_style',
            'motivation_level',
            'time_preferences',
            'support_needs'
        ]
    
    def calculate_user_compatibility(
        self, 
        user1: User, 
        user2: User
    ) -> CompatibilityScore:
        """
        Calculates compatibility between two users for group formation
        """
        compatibility_scores = {}
        
        # Personality compatibility
        personality_score = self.calculate_personality_compatibility(
            user1.personality, user2.personality
        )
        compatibility_scores['personality'] = personality_score
        
        # Habit alignment
        habit_score = self.calculate_habit_alignment(
            user1.habits, user2.habits
        )
        compatibility_scores['habits'] = habit_score
        
        # Goal alignment
        goal_score = self.calculate_goal_alignment(
            user1.goals, user2.goals
        )
        compatibility_scores['goals'] = goal_score
        
        # Communication style
        communication_score = self.calculate_communication_compatibility(
            user1.communication_style, user2.communication_style
        )
        compatibility_scores['communication'] = communication_score
        
        # Calculate overall compatibility
        overall_score = self.calculate_weighted_score(compatibility_scores)
        
        return CompatibilityScore(
            overall=overall_score,
            breakdown=compatibility_scores,
            recommendations=self.get_compatibility_recommendations(compatibility_scores)
        )
```

### **2. Optimal Group Formation**
```python
class GroupFormationEngine:
    def __init__(self):
        self.optimal_group_size = 4  # Based on research on group effectiveness
        self.group_balance_factors = [
            'personality_diversity',
            'skill_complementarity',
            'motivation_levels',
            'support_needs'
        ]
    
    def form_optimal_groups(self, users: List[User]) -> List[Group]:
        """
        Forms optimal groups from available users
        """
        # Calculate compatibility matrix
        compatibility_matrix = self.calculate_compatibility_matrix(users)
        
        # Use optimization algorithm to find best group compositions
        optimal_groups = self.optimize_group_formation(
            users, compatibility_matrix
        )
        
        # Validate group stability
        stable_groups = self.validate_group_stability(optimal_groups)
        
        return stable_groups
    
    def optimize_group_formation(
        self, 
        users: List[User], 
        compatibility_matrix: np.ndarray
    ) -> List[Group]:
        """
        Uses optimization to find best group compositions
        """
        # This could use genetic algorithms, simulated annealing, or other optimization techniques
        best_groups = []
        best_score = -1
        
        # Generate candidate group formations
        for group_formation in self.generate_group_formations(users):
            score = self.evaluate_group_formation(group_formation, compatibility_matrix)
            
            if score > best_score:
                best_score = score
                best_groups = group_formation
        
        return best_groups
```

### **3. Group Stability Prediction**
```python
class GroupStabilityPredictor:
    def __init__(self):
        self.stability_factors = [
            'communication_frequency',
            'performance_gaps',
            'personality_conflicts',
            'goal_divergence',
            'support_reciprocity'
        ]
    
    def predict_group_stability(self, group: Group) -> StabilityPrediction:
        """
        Predicts the stability and longevity of a group
        """
        # Analyze communication patterns
        communication_health = self.analyze_communication_patterns(group)
        
        # Check performance gaps
        performance_gaps = self.analyze_performance_gaps(group)
        
        # Assess personality dynamics
        personality_dynamics = self.assess_personality_dynamics(group)
        
        # Evaluate goal alignment
        goal_alignment = self.evaluate_goal_alignment(group)
        
        # Calculate stability score
        stability_score = self.calculate_stability_score(
            communication_health,
            performance_gaps,
            personality_dynamics,
            goal_alignment
        )
        
        return StabilityPrediction(
            stability_score=stability_score,
            risk_factors=self.identify_risk_factors(group),
            recommendations=self.get_stability_recommendations(stability_score)
        )
```

## 📊 **Group Performance Analysis**

### **1. Collective Progress Tracking**
```python
class GroupPerformanceAnalyzer:
    def __init__(self):
        self.performance_metrics = [
            'completion_rate',
            'streak_maintenance',
            'goal_achievement',
            'peer_support',
            'group_cohesion'
        ]
    
    def analyze_group_performance(self, group: Group) -> GroupPerformance:
        """
        Analyzes the overall performance of a group
        """
        # Calculate aggregate metrics
        total_completions = sum(user.total_completions for user in group.members)
        total_attempts = sum(user.total_attempts for user in group.members)
        group_completion_rate = total_completions / total_attempts if total_attempts > 0 else 0
        
        # Analyze individual contributions
        member_performances = []
        for member in group.members:
            performance = self.analyze_member_performance(member, group)
            member_performances.append(performance)
        
        # Identify high and low performers
        high_performers = [p for p in member_performances if p.performance_level == 'high']
        low_performers = [p for p in member_performances if p.performance_level == 'low']
        
        # Analyze peer influence
        peer_influence = self.analyze_peer_influence(group)
        
        return GroupPerformance(
            completion_rate=group_completion_rate,
            member_performances=member_performances,
            high_performers=high_performers,
            low_performers=low_performers,
            peer_influence=peer_influence,
            group_cohesion=self.measure_group_cohesion(group)
        )
```

### **2. Peer Influence Analysis**
```python
def analyze_peer_influence(group: Group) -> PeerInfluenceAnalysis:
    """
    Analyzes how group members influence each other's habit success
    """
    influence_matrix = {}
    
    for influencer in group.members:
        for influenced in group.members:
            if influencer != influenced:
                # Calculate influence strength
                influence_strength = calculate_influence_strength(
                    influencer, influenced, group
                )
                
                influence_matrix[(influencer.id, influenced.id)] = influence_strength
    
    # Identify key influencers
    key_influencers = identify_key_influencers(influence_matrix)
    
    # Analyze influence patterns
    influence_patterns = analyze_influence_patterns(influence_matrix)
    
    return PeerInfluenceAnalysis(
        influence_matrix=influence_matrix,
        key_influencers=key_influencers,
        patterns=influence_patterns,
        recommendations=get_influence_recommendations(key_influencers)
    )
```

## 🎭 **Agent Behavior Patterns**

### **1. Group Formation Mode** 🤝
**Trigger**: When new users need to be matched or groups need reorganization
**Action**: 
- Analyze user compatibility
- Form optimal groups
- Provide group introduction and guidelines

**Prompt Engineering**:
```
You are forming a new accountability group for habit tracking.

Available Users:
{userProfiles}

Group Formation Goals:
- Optimal size: 4 members
- Balanced personalities
- Complementary habits
- Shared motivation levels

Analyze and provide:
1. Recommended group composition with reasoning
2. Expected group dynamics and roles
3. Potential challenges and solutions
4. Group guidelines and expectations
5. Success strategies for this group

Focus on compatibility and long-term group stability.
```

### **2. Performance Monitoring Mode** 📊
**Trigger**: Weekly group performance review
**Action**:
- Analyze group performance
- Identify high/low performers
- Suggest interventions
- Coordinate peer support

**Prompt Engineering**:
```
You are analyzing this week's group performance.

Group Data:
- Members: {groupMembers}
- Individual performance: {individualPerformance}
- Group interactions: {groupInteractions}
- Peer support exchanges: {supportExchanges}

Analyze and provide:
1. Overall group performance assessment
2. High and low performer identification
3. Peer influence patterns
4. Group cohesion indicators
5. Specific recommendations for improvement

Focus on maintaining positive group dynamics and supporting struggling members.
```

### **3. Crisis Intervention Mode** 🚨
**Trigger**: When group shows signs of breakdown or conflict
**Action**:
- Immediate conflict resolution
- Group restructuring if needed
- Support for struggling members
- Rebuild group cohesion

**Prompt Engineering**:
```
URGENT: Group {groupName} is experiencing difficulties and needs intervention.

Crisis Details:
- Performance decline: {performanceDecline}
- Communication issues: {communicationIssues}
- Member conflicts: {conflicts}
- At-risk members: {atRiskMembers}

Provide immediate intervention:
1. Identify root causes of group dysfunction
2. Propose specific conflict resolution strategies
3. Suggest group restructuring if necessary
4. Provide support for struggling members
5. Rebuild group cohesion and motivation

Be practical and focus on group survival and member support.
```

## 🌐 **Social Coordination Features**

### **1. Communication Facilitation**
```python
class CommunicationFacilitator:
    def __init__(self):
        self.communication_goals = [
            'encourage_positive_interactions',
            'facilitate_support_exchanges',
            'prevent_conflicts',
            'maintain_group_energy'
        ]
    
    def facilitate_group_communication(self, group: Group) -> CommunicationAction:
        """
        Facilitates positive group communication
        """
        # Analyze current communication patterns
        communication_analysis = self.analyze_communication_patterns(group)
        
        # Identify communication needs
        needs = self.identify_communication_needs(group)
        
        # Generate communication actions
        actions = []
        
        if needs.encouragement_needed:
            actions.append(self.generate_encouragement_action(group))
        
        if needs.support_coordination_needed:
            actions.append(self.generate_support_coordination_action(group))
        
        if needs.conflict_prevention_needed:
            actions.append(self.generate_conflict_prevention_action(group))
        
        return CommunicationAction(actions=actions)
```

### **2. Peer Support Activation**
```python
class PeerSupportActivator:
    def __init__(self):
        self.support_types = [
            'daily_check_ins',
            'motivational_messages',
            'problem_solving_sessions',
            'celebration_sharing',
            'struggle_support'
        ]
    
    def activate_peer_support(
        self, 
        group: Group, 
        support_needed_user: User
    ) -> PeerSupportAction:
        """
        Activates peer support for a user in need
        """
        # Identify best support providers
        support_providers = self.identify_support_providers(group, support_needed_user)
        
        # Determine appropriate support type
        support_type = self.determine_support_type(support_needed_user)
        
        # Coordinate support activation
        support_action = PeerSupportAction(
            target_user=support_needed_user,
            support_providers=support_providers,
            support_type=support_type,
            coordination_message=self.generate_coordination_message(
                support_needed_user, support_providers, support_type
            )
        )
        
        return support_action
```

## 📊 **Group Analytics & Metrics**

### **1. Group Health Monitoring**
```python
def monitor_group_health(group: Group) -> GroupHealth:
    """
    Monitors overall health and stability of a group
    """
    # Communication health
    communication_health = analyze_communication_health(group)
    
    # Performance health
    performance_health = analyze_performance_health(group)
    
    # Social health
    social_health = analyze_social_health(group)
    
    # Overall health score
    overall_health = calculate_overall_health(
        communication_health, performance_health, social_health
    )
    
    return GroupHealth(
        overall_score=overall_health,
        communication_health=communication_health,
        performance_health=performance_health,
        social_health=social_health,
        risk_indicators=identify_risk_indicators(group),
        recommendations=get_health_recommendations(overall_health)
    )
```

### **2. Group Effectiveness Metrics**
```python
def calculate_group_effectiveness(group: Group) -> GroupEffectiveness:
    """
    Calculates how effective a group is at supporting habit formation
    """
    # Individual improvement rates
    individual_improvements = []
    for member in group.members:
        improvement = calculate_member_improvement_rate(member)
        individual_improvements.append(improvement)
    
    # Group synergy effect
    synergy_effect = calculate_group_synergy(group)
    
    # Peer support effectiveness
    support_effectiveness = calculate_peer_support_effectiveness(group)
    
    # Overall effectiveness
    overall_effectiveness = (
        np.mean(individual_improvements) * 
        synergy_effect * 
        support_effectiveness
    )
    
    return GroupEffectiveness(
        overall_score=overall_effectiveness,
        individual_improvements=individual_improvements,
        synergy_effect=synergy_effect,
        support_effectiveness=support_effectiveness
    )
```

## 🎯 **Integration Points**

### **Discord Integration**
- **Group Channels**: Dedicated channels for each accountability group
- **Public Channels**: General group announcements and celebrations
- **Slash Commands**: `/group-status`, `/request-support`, `/group-feedback`
- **Interactive Elements**: Group polls, peer support requests
- **Scheduled Messages**: Weekly group check-ins and performance updates

### **Notion Integration**
- **Groups Database**: Group compositions, roles, and performance history
- **Group Interactions**: Communication logs and support exchanges
- **Group Analytics**: Performance metrics and effectiveness tracking
- **Group Settings**: Preferences, rules, and intervention protocols

### **Neo4j Integration**
- **Group Relationships**: Social connections and influence patterns
- **Compatibility Networks**: User compatibility and matching data
- **Performance Graphs**: Group performance trends and patterns
- **Social Dynamics**: Communication patterns and group cohesion

## 🧪 **Testing Strategy**

### **Unit Tests**
- Compatibility scoring algorithms
- Group formation optimization
- Performance analysis accuracy
- Social coordination logic

### **Integration Tests**
- Discord group management
- Notion data synchronization
- Neo4j social graph queries
- Cross-agent group coordination

### **User Acceptance Tests**
- Group formation quality
- Group stability and longevity
- Peer support effectiveness
- User satisfaction with group dynamics

## 📈 **Success Metrics**

### **Technical Metrics**
- Group formation success rate: > 90%
- Group stability: > 80% groups remain stable for 3+ months
- Response time: < 2 seconds for group operations
- System uptime: > 99.5%

### **User Experience Metrics**
- Group member satisfaction
- Peer support utilization
- Group retention rate
- Habit success improvement in groups vs. individuals

---

## 🚀 **Implementation Priority**

### **Phase 1: Basic Group Formation** (Week 1-2)
1. User compatibility scoring
2. Simple group formation algorithms
3. Basic group management
4. Discord group channel creation

### **Phase 2: Performance Analysis** (Week 3-4)
1. Group performance tracking
2. High/low performer identification
3. Peer influence analysis
4. Group health monitoring

### **Phase 3: Social Coordination** (Week 5-6)
1. Communication facilitation
2. Peer support activation
3. Conflict resolution systems
4. Group intervention protocols

### **Phase 4: Advanced Group Dynamics** (Week 7-8)
1. Predictive group stability analysis
2. Advanced social coordination
3. Group optimization algorithms
4. Long-term group success tracking

---

*The Group Agent ensures that users benefit from the power of social accountability while maintaining positive group dynamics and preventing common pitfalls that lead to group failure.*
