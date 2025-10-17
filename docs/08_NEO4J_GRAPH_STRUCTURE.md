# 🕸️ Neo4j Graph Structure - Multi-Agent System

## 🎯 **Overview**
This document defines the Neo4j graph database structure for the multi-agent habit mentor system. The graph enables complex relationship analysis, pattern recognition, and intelligent recommendations across users, habits, and behaviors.

## 🏗️ **Graph Architecture**

### **Core Concept**
The graph represents the interconnected nature of habit formation, where users, habits, environments, and social dynamics create a complex web of relationships that influence success and failure patterns.

### **Graph Benefits**
- **Relationship Analysis**: Understand how habits influence each other
- **Pattern Recognition**: Identify success patterns across users
- **Social Dynamics**: Map influence and support networks
- **Predictive Analytics**: Forecast habit success based on relationships
- **Recommendation Engine**: Find similar users and successful strategies

---

## 🏷️ **Node Types**

### **1. User Nodes**
```cypher
CREATE (u:User {
  id: "user_123",
  discord_id: "1422681618304471131",
  name: "Klumpenklarmarc",
  timezone: "Europe/Berlin",
  personality_type: "INTJ",
  communication_style: "Analytical",
  motivation_style: "Intrinsic",
  trust_count: 15,
  created_at: datetime(),
  last_active: datetime()
})
```

**Properties:**
- `id`: Unique user identifier
- `discord_id`: Discord user ID
- `name`: Display name
- `timezone`: User's timezone
- `personality_type`: Big Five or MBTI type
- `communication_style`: How they prefer to communicate
- `motivation_style`: What motivates them
- `trust_count`: Social trust score
- `created_at`: Account creation date
- `last_active`: Last activity timestamp

### **2. Habit Nodes**
```cypher
CREATE (h:Habit {
  id: "habit_456",
  name: "Morning Journaling",
  domain: "Personal Development",
  difficulty: "Medium",
  frequency: 5,
  success_rate: 0.75,
  best_streak: 21,
  created_at: datetime(),
  last_updated: datetime()
})
```

**Properties:**
- `id`: Unique habit identifier
- `name`: Habit name
- `domain`: Category (Health, Productivity, etc.)
- `difficulty`: Difficulty level
- `frequency`: Times per week
- `success_rate`: Historical success rate
- `best_streak`: Longest streak achieved
- `created_at`: Creation date
- `last_updated`: Last modification date

### **3. Proof Nodes**
```cypher
CREATE (p:Proof {
  id: "proof_789",
  date: date("2024-01-15"),
  time: time("08:30"),
  duration: 15,
  energy_level: "High",
  mood: "Good",
  difficulty_felt: "Medium",
  completed: true,
  note: "Felt focused and clear"
})
```

**Properties:**
- `id`: Unique proof identifier
- `date`: Date of completion
- `time`: Time of day
- `duration`: Minutes spent
- `energy_level`: User's energy level
- `mood`: User's mood
- `difficulty_felt`: Perceived difficulty
- `completed`: Whether habit was completed
- `note`: User's notes

### **4. Learning Nodes**
```cypher
CREATE (l:Learning {
  id: "learning_101",
  content: "I work best when I journal before checking my phone",
  category: "Timing",
  confidence: 0.8,
  created_at: datetime(),
  extracted_insights: ["Timing optimization", "Phone avoidance"]
})
```

**Properties:**
- `id`: Unique learning identifier
- `content`: Learning text
- `category`: Type of learning
- `confidence`: Confidence in learning validity
- `created_at`: Creation timestamp
- `extracted_insights`: Key insights extracted

### **5. Hurdle Nodes**
```cypher
CREATE (h:Hurdle {
  id: "hurdle_202",
  type: "Motivational",
  description: "Lack of motivation on weekends",
  severity: "Medium",
  frequency: 3,
  created_at: datetime()
})
```

**Properties:**
- `id`: Unique hurdle identifier
- `type`: Hurdle category
- `description`: Detailed description
- `severity`: Impact level
- `frequency`: How often it occurs
- `created_at`: Creation timestamp

### **6. Group Nodes**
```cypher
CREATE (g:Group {
  id: "group_303",
  name: "Morning Routines Group",
  size: 4,
  cohesion_score: 0.85,
  performance_score: 0.78,
  created_at: datetime()
})
```

**Properties:**
- `id`: Unique group identifier
- `name`: Group name
- `size`: Number of members
- `cohesion_score`: Group unity measure
- `performance_score`: Overall group performance
- `created_at`: Creation timestamp

### **7. Personality Nodes**
```cypher
CREATE (p:Personality {
  id: "personality_404",
  trait: "Conscientiousness",
  value: 0.8,
  category: "Big Five"
})
```

**Properties:**
- `id`: Unique personality identifier
- `trait`: Personality trait name
- `value`: Trait strength (0-1)
- `category`: Personality framework

### **8. Environment Nodes**
```cypher
CREATE (e:Environment {
  id: "env_505",
  type: "Home Office",
  characteristics: ["Quiet", "Organized", "Good Lighting"],
  success_rate: 0.9
})
```

**Properties:**
- `id`: Unique environment identifier
- `type`: Environment type
- `characteristics`: Key features
- `success_rate`: Success rate in this environment

---

## 🔗 **Relationship Types**

### **1. User Relationships**
```cypher
// User has habits
(u:User)-[:HAS_HABIT {created_at: datetime(), active: true}]->(h:Habit)

// User provides proof
(u:User)-[:PROVIDES_PROOF {timestamp: datetime()}]->(p:Proof)

// User learned something
(u:User)-[:LEARNED {confidence: 0.8, date: date()}]->(l:Learning)

// User faces hurdles
(u:User)-[:FACES {frequency: 2, impact: "Medium"}]->(h:Hurdle)

// User belongs to group
(u:User)-[:BELONGS_TO {joined_at: datetime(), role: "Member"}]->(g:Group)

// User has personality traits
(u:User)-[:HAS_PERSONALITY {strength: 0.8}]->(p:Personality)

// User compatibility
(u1:User)-[:COMPATIBLE_WITH {score: 0.85, factors: ["personality", "goals"]}]->(u2:User)

// User influence
(u1:User)-[:INFLUENCES {strength: 0.7, type: "Positive"}]->(u2:User)
```

### **2. Habit Relationships**
```cypher
// Proof of habit completion
(p:Proof)-[:PROOF_OF {success: true, effort: "Medium"}]->(h:Habit)

// Habit similarity
(h1:Habit)-[:SIMILAR_TO {similarity: 0.8, factors: ["domain", "difficulty"]}]->(h2:Habit)

// Habit dependency
(h1:Habit)-[:DEPENDS_ON {strength: 0.6, type: "Sequential"}]->(h2:Habit)

// Habit conflict
(h1:Habit)-[:CONFLICTS_WITH {severity: 0.4, reason: "Time overlap"}]->(h2:Habit)

// Habit supports identity
(h:Habit)-[:SUPPORTS_IDENTITY {alignment: 0.9, identity_aspect: "Productivity"]}->(i:Identity)

// Habit optimal in environment
(h:Habit)-[:OPTIMAL_IN {success_rate: 0.9}]->(e:Environment)

// Habit requires personality trait
(h:Habit)-[:REQUIRES_TRAIT {minimum_level: 0.7}]->(p:Personality)
```

### **3. Learning Relationships**
```cypher
// Learning about habit
(l:Learning)-[:ABOUT {relevance: 0.8}]->(h:Habit)

// Learning extracted from proof
(l:Learning)-[:EXTRACTED_FROM]->(p:Proof)

// Learning pattern across users
(l1:Learning)-[:SIMILAR_TO {similarity: 0.9}]->(l2:Learning)

// Learning applies to personality type
(l:Learning)-[:APPLIES_TO {applicability: 0.8}]->(p:Personality)
```

### **4. Group Relationships**
```cypher
// Group supports habits
(g:Group)-[:SUPPORTS_HABIT {effectiveness: 0.8}]->(h:Habit)

// Group member interactions
(u1:User)-[:INTERACTS_WITH {frequency: 5, type: "Support"}]->(u2:User)

// Group performance correlation
(g:Group)-[:PERFORMS_BETTER_WITH {correlation: 0.7}]->(h:Habit)
```

### **5. Pattern Relationships**
```cypher
// Success pattern
(sp:SuccessPattern)-[:IDENTIFIED_IN {confidence: 0.9}]->(h:Habit)

// Failure pattern
(fp:FailurePattern)-[:OCCURS_IN {frequency: 0.6}]->(h:Habit)

// Solution pattern
(sol:SolutionPattern)-[:SOLVES {effectiveness: 0.8}]->(h:Hurdle)
```

---

## 🔍 **Key Graph Queries**

### **1. User Analysis Queries**

#### **Find User's Successful Habit Patterns**
```cypher
MATCH (u:User {id: "user_123"})-[:HAS_HABIT]->(h:Habit)
MATCH (h)<-[:PROOF_OF]-(p:Proof)
WHERE p.completed = true
WITH u, h, collect(p) as successful_proofs
WHERE size(successful_proofs) >= 3
RETURN h.name, h.success_rate, 
       avg(p.energy_level) as avg_energy,
       avg(p.duration) as avg_duration
ORDER BY h.success_rate DESC
```

#### **Find Compatible Users for Group Formation**
```cypher
MATCH (u1:User {id: "user_123"})-[:HAS_PERSONALITY]->(p1:Personality)
MATCH (u2:User)-[:HAS_PERSONALITY]->(p2:Personality)
WHERE u1 <> u2 AND p1.trait = p2.trait
WITH u1, u2, collect(abs(p1.value - p2.value)) as trait_differences
WITH u1, u2, avg(trait_differences) as avg_difference
WHERE avg_difference < 0.3
MATCH (u2)-[:HAS_HABIT]->(h:Habit)
WHERE h.domain IN ["Health", "Productivity"]
RETURN u2.name, u2.personality_type, collect(h.name) as shared_habits
ORDER BY size(shared_habits) DESC
```

### **2. Habit Analysis Queries**

#### **Find Habit Correlations and Dependencies**
```cypher
MATCH (h1:Habit)-[:SIMILAR_TO]->(h2:Habit)
MATCH (h1)-[:DEPENDS_ON*1..2]->(h3:Habit)
WITH h1, collect(DISTINCT h2.name) as similar_habits, 
     collect(DISTINCT h3.name) as dependencies
RETURN h1.name, similar_habits, dependencies
ORDER BY size(similar_habits) + size(dependencies) DESC
```

#### **Analyze Optimal Timing Patterns**
```cypher
MATCH (h:Habit {name: "Morning Journaling"})<-[:PROOF_OF]-(p:Proof)
WHERE p.completed = true
WITH h, p.time as completion_time, count(p) as success_count
ORDER BY completion_time
RETURN completion_time, success_count
```

### **3. Learning and Pattern Queries**

#### **Extract Cross-User Learning Patterns**
```cypher
MATCH (u:User)-[:LEARNED]->(l:Learning)
WITH l, collect(u) as users, count(u) as user_count
WHERE user_count >= 3
MATCH (l)-[:ABOUT]->(h:Habit)
RETURN l.content, h.domain, user_count, collect(u.name) as users
ORDER BY user_count DESC
```

#### **Find Effective Solutions for Common Hurdles**
```cypher
MATCH (h:Hurdle {type: "Motivational"})<-[:FACES]-(u:User)
MATCH (u)-[:LEARNED]->(l:Learning)
WHERE l.category = "Solution"
WITH h, l, count(u) as solution_users
ORDER BY solution_users DESC
RETURN h.description, l.content, solution_users
LIMIT 10
```

### **4. Group Dynamics Queries**

#### **Analyze Group Performance and Cohesion**
```cypher
MATCH (g:Group)-[:CONTAINS]->(u:User)
MATCH (u)-[:PROVIDES_PROOF]->(p:Proof)
WHERE p.completed = true AND p.date >= date() - duration('P7D')
WITH g, u, count(p) as weekly_completions
WITH g, collect(weekly_completions) as member_performances
RETURN g.name, 
       avg(member_performances) as avg_performance,
       stdev(member_performances) as performance_variance,
       g.cohesion_score
ORDER BY avg_performance DESC
```

#### **Identify Key Influencers in Groups**
```cypher
MATCH (g:Group {id: "group_303"})-[:CONTAINS]->(u1:User)
MATCH (u1)-[inf:INFLUENCES]->(u2:User)
WHERE (u2)-[:BELONGS_TO]->(g)
RETURN u1.name, u2.name, inf.strength, inf.type
ORDER BY inf.strength DESC
```

### **5. Predictive Analytics Queries**

#### **Predict Habit Success Based on User Profile**
```cypher
MATCH (target_user:User {id: "user_123"})-[:HAS_PERSONALITY]->(tp:Personality)
MATCH (similar_user:User)-[:HAS_PERSONALITY]->(sp:Personality)
WHERE tp.trait = sp.trait AND abs(tp.value - sp.value) < 0.2
MATCH (similar_user)-[:HAS_HABIT]->(h:Habit)
WHERE h.success_rate > 0.8
WITH target_user, h, count(similar_user) as similar_users
ORDER BY similar_users DESC
RETURN h.name, h.domain, h.difficulty, h.success_rate, similar_users
```

#### **Identify Users at Risk of Habit Failure**
```cypher
MATCH (u:User)-[:HAS_HABIT]->(h:Habit)
MATCH (h)<-[:PROOF_OF]-(p:Proof)
WHERE p.date >= date() - duration('P7D')
WITH u, h, count(p) as recent_completions, h.frequency as target_frequency
WHERE recent_completions < target_frequency * 0.5
MATCH (u)-[:FACES]->(hurdle:Hurdle)
RETURN u.name, h.name, recent_completions, target_frequency, 
       collect(hurdle.type) as current_hurdles
```

---

## 📊 **Graph Analytics Functions**

### **1. PageRank for Habit Importance**
```cypher
// Calculate which habits are most central to success
CALL gds.graph.project('habit_network', 'Habit', {
  SIMILAR_TO: {orientation: 'UNDIRECTED'},
  DEPENDS_ON: {orientation: 'NATURAL'}
})

CALL gds.pageRank.stream('habit_network')
YIELD nodeId, score
RETURN gds.util.asNode(nodeId).name as habit, score
ORDER BY score DESC
```

### **2. Community Detection for User Clustering**
```cypher
// Find user communities based on habit similarity
CALL gds.graph.project('user_network', 'User', {
  COMPATIBLE_WITH: {orientation: 'UNDIRECTED'}
})

CALL gds.louvain.stream('user_network')
YIELD nodeId, communityId
RETURN gds.util.asNode(nodeId).name as user, communityId
ORDER BY communityId, user
```

### **3. Shortest Path for Habit Dependencies**
```cypher
// Find optimal habit sequences
MATCH (start_habit:Habit {name: "Morning Journaling"})
MATCH (end_habit:Habit {name: "Deep Work"})
CALL gds.shortestPath.dijkstra.stream('habit_network', {
  sourceNode: start_habit,
  targetNode: end_habit,
  relationshipWeightProperty: 'strength'
})
YIELD path, totalCost
RETURN [node in nodes(path) | node.name] as habit_sequence, totalCost
```

---

## 🎯 **Agent-Specific Graph Usage**

### **Mentor Agent Queries**
- **Pattern Analysis**: Find successful habit combinations
- **Failure Prediction**: Identify users at risk
- **Recommendation Engine**: Suggest habits based on success patterns

### **Identity Agent Queries**
- **Personality-Habit Matching**: Find habits aligned with personality
- **Identity Evolution**: Track how habits shape identity
- **Compatibility Analysis**: Match users with similar identity goals

### **Accountability Agent Queries**
- **Optimal Timing**: Find best times for reminders
- **Escalation Triggers**: Identify when intervention is needed
- **Motivation Patterns**: Understand what motivates each user

### **Group Agent Queries**
- **Group Formation**: Find compatible users for groups
- **Social Influence**: Map peer influence networks
- **Group Dynamics**: Analyze group cohesion and performance

### **Learning Agent Queries**
- **Pattern Mining**: Extract insights across all users
- **Solution Effectiveness**: Track which solutions work
- **Knowledge Synthesis**: Build system-wide knowledge base

---

## 🚀 **Implementation Strategy**

### **Phase 1: Core Graph Structure** (Week 1)
1. Set up Neo4j Aura Free Tier
2. Create basic node types and relationships
3. Migrate existing data to graph format
4. Test basic queries

### **Phase 2: Advanced Relationships** (Week 2)
1. Add personality and environment nodes
2. Implement complex relationship types
3. Create pattern recognition queries
4. Test graph analytics functions

### **Phase 3: Agent Integration** (Week 3)
1. Implement agent-specific queries
2. Add real-time graph updates
3. Create predictive analytics
4. Optimize query performance

### **Phase 4: Advanced Analytics** (Week 4)
1. Implement graph algorithms
2. Add machine learning features
3. Create automated insights
4. Set up monitoring and alerting

---

## 📈 **Performance Optimization**

### **Indexing Strategy**
```cypher
// Create indexes for frequently queried properties
CREATE INDEX user_discord_id FOR (u:User) ON (u.discord_id)
CREATE INDEX habit_domain FOR (h:Habit) ON (h.domain)
CREATE INDEX proof_date FOR (p:Proof) ON (p.date)
CREATE INDEX learning_category FOR (l:Learning) ON (l.category)
```

### **Query Optimization**
- Use `EXPLAIN` and `PROFILE` to optimize queries
- Implement query result caching
- Use appropriate relationship directions
- Limit result sets with `LIMIT`

### **Data Management**
- Implement data archiving for old proofs
- Use constraints to ensure data integrity
- Regular graph maintenance and optimization
- Monitor graph size and performance

---

*This Neo4j graph structure provides a powerful foundation for complex relationship analysis and intelligent recommendations in the multi-agent habit mentor system.*
