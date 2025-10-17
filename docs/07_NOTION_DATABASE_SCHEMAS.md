# 🗄️ Notion Database Schemas - Multi-Agent System

## 🎯 **Overview**
This document defines the Notion database schemas required for the multi-agent habit mentor system. Each database is designed to support specific agents while maintaining data consistency and enabling cross-agent collaboration.

## 📊 **Database Architecture**

### **Core Databases (Existing)**
1. **Users** - Basic user information
2. **Habits** - Habit definitions and settings
3. **Proofs** - Daily habit completions
4. **Learnings** - User insights and discoveries
5. **Hurdles** - Obstacles and challenges
6. **Weeks** - Weekly summaries and progress
7. **Groups** - Accountability groups

### **New Agent-Specific Databases**
8. **Personal Profiles** - Extended personality and identity data
9. **Agent Interactions** - Agent communication logs
10. **Recommendations** - Generated recommendations and responses
11. **Knowledge Base** - System-wide insights and patterns
12. **Analytics** - Performance metrics and analytics

---

## 👤 **1. Users Database (Enhanced)**

### **Purpose**
Store basic user information with enhanced fields for agent personalization.

### **Properties**
```typescript
interface UserDatabase {
  // Core Fields
  "Discord ID": { type: "title", description: "Primary key - Discord user ID" }
  "Name": { type: "rich_text", description: "Display name" }
  "Timezone": { type: "rich_text", description: "User's timezone for scheduling" }
  "Best Time": { type: "rich_text", description: "Optimal time for interactions" }
  "Trust Count": { type: "number", description: "Social trust score" }
  "Personal Channel ID": { type: "rich_text", description: "Discord channel ID" }
  
  // Agent Enhancement Fields
  "Personality Type": { type: "select", options: ["INTJ", "ENTP", "ISFJ", "ESFP", "etc..."] }
  "Communication Style": { type: "select", options: ["Direct", "Supportive", "Analytical", "Encouraging"] }
  "Motivation Style": { type: "select", options: ["Intrinsic", "Extrinsic", "Social", "Achievement"] }
  "Learning Style": { type: "select", options: ["Visual", "Auditory", "Kinesthetic", "Reading"] }
  "Accountability Level": { type: "select", options: ["Low", "Medium", "High", "Critical"] }
  
  // Agent Access Control
  "Mentor Agent Access": { type: "checkbox", description: "Can Mentor Agent access this user?" }
  "Identity Agent Access": { type: "checkbox" }
  "Accountability Agent Access": { type: "checkbox" }
  "Group Agent Access": { type: "checkbox" }
  "Learning Agent Access": { type: "checkbox" }
  
  // Metadata
  "Created At": { type: "date" }
  "Last Agent Interaction": { type: "date" }
  "Agent Interaction Count": { type: "number" }
}
```

### **Agent Access Patterns**
- **Mentor Agent**: Reads all fields, updates interaction metadata
- **Identity Agent**: Focuses on personality and communication style
- **Accountability Agent**: Uses timezone, best time, accountability level
- **Group Agent**: Uses trust count, personality type for matching
- **Learning Agent**: Tracks interaction count and learning patterns

---

## 🎯 **2. Habits Database (Enhanced)**

### **Purpose**
Store habit definitions with enhanced fields for agent analysis and recommendations.

### **Properties**
```typescript
interface HabitsDatabase {
  // Core Fields
  "Name": { type: "title", description: "Habit name" }
  "User": { type: "relation", target: "Users", description: "Owner of habit" }
  "Domains": { type: "multi_select", options: ["Health", "Productivity", "Learning", "Social", "Financial"] }
  "Frequency": { type: "number", description: "Times per week" }
  "Context": { type: "rich_text", description: "When and where" }
  "Difficulty": { type: "select", options: ["Easy", "Medium", "Hard", "Expert"] }
  "SMART Goal": { type: "rich_text", description: "Specific goal" }
  "Why": { type: "rich_text", description: "Motivation" }
  "Minimal Dose": { type: "rich_text", description: "Minimum viable action" }
  "Habit Loop": { type: "rich_text", description: "Cue-Routine-Reward" }
  "Implementation Intentions": { type: "rich_text", description: "If-then plans" }
  "Hurdles": { type: "rich_text", description: "Known obstacles" }
  "Reminder Type": { type: "select", options: ["Gentle", "Supportive", "Firm", "Urgent"] }
  
  // Agent Enhancement Fields
  "Success Pattern": { type: "rich_text", description: "What works for this habit" }
  "Failure Pattern": { type: "rich_text", description: "Common failure points" }
  "Optimal Timing": { type: "rich_text", description: "Best times for this habit" }
  "Environmental Factors": { type: "multi_select", options: ["Home", "Office", "Gym", "Outdoors", "Social"] }
  "Identity Alignment": { type: "select", options: ["Low", "Medium", "High"] }
  "Personality Compatibility": { type: "number", description: "0-1 compatibility score" }
  "Group Compatibility": { type: "select", options: ["Individual", "Partner", "Small Group", "Large Group"] }
  
  // Analytics Fields
  "Success Rate": { type: "number", description: "Current success rate" }
  "Best Streak": { type: "number", description: "Longest streak achieved" }
  "Average Completion Time": { type: "number", description: "Minutes to complete" }
  "Motivation Level": { type: "select", options: ["Low", "Medium", "High"] }
  "Difficulty Adjustment": { type: "select", options: ["Too Easy", "Just Right", "Too Hard"] }
  
  // Agent Metadata
  "Last Agent Analysis": { type: "date" }
  "Agent Recommendations Count": { type: "number" }
  "Pattern Analysis Status": { type: "select", options: ["Pending", "In Progress", "Complete"] }
}
```

### **Agent Access Patterns**
- **Mentor Agent**: Analyzes success/failure patterns, provides recommendations
- **Identity Agent**: Evaluates identity alignment and personality compatibility
- **Accountability Agent**: Uses reminder type, optimal timing for reminders
- **Group Agent**: Considers group compatibility for matching
- **Learning Agent**: Extracts patterns and updates analytics fields

---

## 📝 **3. Proofs Database (Enhanced)**

### **Purpose**
Track habit completions with enhanced context for agent analysis.

### **Properties**
```typescript
interface ProofsDatabase {
  // Core Fields
  "Title": { type: "title", description: "Proof description" }
  "User": { type: "relation", target: "Users" }
  "Habit": { type: "relation", target: "Habits" }
  "Date": { type: "date" }
  "Unit": { type: "rich_text", description: "Quantity/measurement" }
  "Note": { type: "rich_text", description: "User notes" }
  "Proof": { type: "files", description: "Evidence files" }
  "Is Minimal Dose": { type: "checkbox" }
  "Is Cheat Day": { type: "checkbox" }
  
  // Agent Enhancement Fields
  "Completion Time": { type: "number", description: "Time of day (24h format)" }
  "Completion Duration": { type: "number", description: "Minutes spent" }
  "Energy Level": { type: "select", options: ["Low", "Medium", "High"] }
  "Mood": { type: "select", options: ["Poor", "Okay", "Good", "Great"] }
  "Difficulty Felt": { type: "select", options: ["Easy", "Medium", "Hard", "Very Hard"] }
  "Environmental Context": { type: "multi_select", options: ["Home", "Office", "Gym", "Outdoors", "Social"] }
  "Social Context": { type: "select", options: ["Alone", "With Partner", "In Group", "Public"] }
  "Weather": { type: "select", options: ["Sunny", "Cloudy", "Rainy", "Stormy"] }
  "External Factors": { type: "rich_text", description: "External influences" }
  
  // Agent Analysis Fields
  "Agent Analysis": { type: "rich_text", description: "Agent insights about this completion" }
  "Pattern Relevance": { type: "select", options: ["Low", "Medium", "High"] }
  "Learning Extracted": { type: "checkbox", description: "Was learning extracted?" }
  "Hurdle Identified": { type: "checkbox", description: "Was hurdle identified?" }
  
  // Metadata
  "Created At": { type: "date" }
  "Agent Processed": { type: "checkbox" }
}
```

### **Agent Access Patterns**
- **Mentor Agent**: Analyzes completion patterns, extracts insights
- **Identity Agent**: Considers environmental and social context
- **Accountability Agent**: Tracks timing and difficulty for reminder optimization
- **Group Agent**: Monitors social context for group dynamics
- **Learning Agent**: Extracts learnings and identifies hurdles

---

## 🧠 **4. Personal Profiles Database (New)**

### **Purpose**
Store extended personality and identity information for agent personalization.

### **Properties**
```typescript
interface PersonalProfilesDatabase {
  // Identity
  "User": { type: "relation", target: "Users" }
  "Identity Goals": { type: "rich_text", description: "Who they want to become" }
  "Core Values": { type: "multi_select", options: ["Health", "Growth", "Relationships", "Achievement", "Creativity", "Service"] }
  "Life Vision": { type: "rich_text", description: "Long-term vision" }
  "Identity Strengths": { type: "rich_text", description: "Current identity strengths" }
  "Identity Growth Areas": { type: "rich_text", description: "Areas for identity development" }
  
  // Personality (Big Five)
  "Openness": { type: "number", description: "0-1 scale" }
  "Conscientiousness": { type: "number", description: "0-1 scale" }
  "Extraversion": { type: "number", description: "0-1 scale" }
  "Agreeableness": { type: "number", description: "0-1 scale" }
  "Neuroticism": { type: "number", description: "0-1 scale" }
  
  // Behavioral Patterns
  "Decision Making Style": { type: "select", options: ["Analytical", "Intuitive", "Collaborative", "Quick"] }
  "Risk Tolerance": { type: "select", options: ["Low", "Medium", "High"] }
  "Change Adaptation": { type: "select", options: ["Slow", "Medium", "Fast"] }
  "Social Energy": { type: "select", options: ["Introverted", "Ambivert", "Extroverted"] }
  "Stress Response": { type: "select", options: ["Withdraw", "Confront", "Seek Support", "Problem Solve"] }
  
  // Preferences
  "Learning Preferences": { type: "multi_select", options: ["Visual", "Auditory", "Reading", "Hands-on"] }
  "Communication Preferences": { type: "multi_select", options: ["Direct", "Supportive", "Detailed", "Brief"] }
  "Motivation Triggers": { type: "multi_select", options: ["Achievement", "Recognition", "Growth", "Impact", "Security"] }
  "Work Style": { type: "select", options: ["Morning Person", "Night Owl", "Flexible", "Structured"] }
  
  // Life Context
  "Life Stage": { type: "select", options: ["Student", "Early Career", "Mid Career", "Senior", "Retired"] }
  "Family Situation": { type: "select", options: ["Single", "Dating", "Married", "Parent", "Empty Nester"] }
  "Work Situation": { type: "select", options: ["Full-time", "Part-time", "Freelance", "Student", "Retired"] }
  "Health Status": { type: "select", options: ["Excellent", "Good", "Fair", "Challenging"] }
  
  // Agent Metadata
  "Profile Completeness": { type: "number", description: "0-1 scale" }
  "Last Updated": { type: "date" }
  "Agent Analysis Status": { type: "select", options: ["Pending", "In Progress", "Complete"] }
}
```

### **Agent Access Patterns**
- **Identity Agent**: Primary consumer, uses all fields for personality analysis
- **Mentor Agent**: Uses personality traits for coaching style
- **Group Agent**: Uses social energy, work style for matching
- **Accountability Agent**: Uses stress response, motivation triggers
- **Learning Agent**: Uses learning preferences for knowledge delivery

---

## 🤖 **5. Agent Interactions Database (New)**

### **Purpose**
Log all agent interactions for analysis and improvement.

### **Properties**
```typescript
interface AgentInteractionsDatabase {
  // Core Fields
  "Interaction ID": { type: "title", description: "Unique interaction identifier" }
  "User": { type: "relation", target: "Users" }
  "Agent": { type: "select", options: ["Mentor", "Identity", "Accountability", "Group", "Learning"] }
  "Interaction Type": { type: "select", options: ["Analysis", "Recommendation", "Reminder", "Intervention", "Celebration"] }
  "Timestamp": { type: "date" }
  
  // Content
  "User Input": { type: "rich_text", description: "What user said/did" }
  "Agent Response": { type: "rich_text", description: "Agent's response" }
  "Context Data": { type: "rich_text", description: "Data used for response" }
  "Confidence Score": { type: "number", description: "Agent's confidence in response" }
  
  // Outcome
  "User Feedback": { type: "select", options: ["Positive", "Neutral", "Negative"] }
  "Action Taken": { type: "checkbox", description: "Did user act on recommendation?" }
  "Effectiveness": { type: "number", description: "0-1 effectiveness score" }
  "Follow-up Required": { type: "checkbox" }
  
  // Metadata
  "Processing Time": { type: "number", description: "Seconds to process" }
  "Data Sources Used": { type: "multi_select", options: ["Notion", "Neo4j", "User Input", "Historical Data"] }
  "Error Occurred": { type: "checkbox" }
  "Error Message": { type: "rich_text" }
}
```

### **Agent Access Patterns**
- **All Agents**: Log interactions for analysis
- **Orchestrator**: Monitors overall system performance
- **Learning Agent**: Analyzes patterns across interactions

---

## 💡 **6. Recommendations Database (New)**

### **Purpose**
Store agent-generated recommendations and track their effectiveness.

### **Properties**
```typescript
interface RecommendationsDatabase {
  // Core Fields
  "Recommendation ID": { type: "title" }
  "User": { type: "relation", target: "Users" }
  "Agent": { type: "select", options: ["Mentor", "Identity", "Accountability", "Group", "Learning"] }
  "Type": { type: "select", options: ["Habit", "Timing", "Environment", "Strategy", "Group", "Identity"] }
  "Priority": { type: "select", options: ["Low", "Medium", "High", "Critical"] }
  
  // Content
  "Title": { type: "rich_text", description: "Recommendation title" }
  "Description": { type: "rich_text", description: "Detailed recommendation" }
  "Rationale": { type: "rich_text", description: "Why this recommendation" }
  "Action Steps": { type: "rich_text", description: "Specific steps to take" }
  "Expected Outcome": { type: "rich_text", description: "Expected results" }
  
  // Context
  "Trigger Event": { type: "rich_text", description: "What triggered this recommendation" }
  "User Context": { type: "rich_text", description: "User's current situation" }
  "Supporting Data": { type: "rich_text", description: "Data supporting recommendation" }
  
  // Tracking
  "Status": { type: "select", options: ["Pending", "Accepted", "Rejected", "In Progress", "Completed"] }
  "User Response": { type: "rich_text", description: "User's response" }
  "Implementation Date": { type: "date" }
  "Completion Date": { type: "date" }
  "Effectiveness Score": { type: "number", description: "0-1 effectiveness" }
  
  // Metadata
  "Created At": { type: "date" }
  "Last Updated": { type: "date" }
  "Follow-up Scheduled": { type: "date" }
}
```

### **Agent Access Patterns**
- **All Agents**: Create and update recommendations
- **Mentor Agent**: Focuses on habit and strategy recommendations
- **Identity Agent**: Provides identity-aligned recommendations
- **Accountability Agent**: Creates timing and reminder recommendations
- **Group Agent**: Generates social and group recommendations
- **Learning Agent**: Tracks effectiveness and learns from outcomes

---

## 📚 **7. Knowledge Base Database (New)**

### **Purpose**
Store system-wide insights and patterns learned from all users.

### **Properties**
```typescript
interface KnowledgeBaseDatabase {
  // Core Fields
  "Knowledge ID": { type: "title" }
  "Category": { type: "select", options: ["Habit Formation", "Motivation", "Environment", "Social", "Identity", "Timing"] }
  "Type": { type: "select", options: ["Pattern", "Strategy", "Insight", "Solution", "Principle"] }
  "Title": { type: "rich_text", description: "Knowledge title" }
  "Description": { type: "rich_text", description: "Detailed knowledge" }
  
  // Content
  "Key Insight": { type: "rich_text", description: "Main insight" }
  "Evidence": { type: "rich_text", description: "Supporting evidence" }
  "Application": { type: "rich_text", description: "How to apply" }
  "Conditions": { type: "rich_text", description: "When this applies" }
  "Exceptions": { type: "rich_text", description: "When this doesn't apply" }
  
  // Analytics
  "Confidence Level": { type: "number", description: "0-1 confidence" }
  "Usage Count": { type: "number", description: "How often used" }
  "Success Rate": { type: "number", description: "0-1 success rate" }
  "User Feedback": { type: "number", description: "Average user rating" }
  
  // Sources
  "Source Users": { type: "relation", target: "Users", description: "Users who contributed" }
  "Source Learnings": { type: "relation", target: "Learnings" }
  "Source Hurdles": { type: "relation", target: "Hurdles" }
  "Last Validated": { type: "date" }
  
  // Metadata
  "Created At": { type: "date" }
  "Last Updated": { type: "date" }
  "Status": { type: "select", options: ["Draft", "Validated", "Deprecated"] }
}
```

### **Agent Access Patterns**
- **Learning Agent**: Primary creator and maintainer
- **All Agents**: Read knowledge for recommendations
- **Mentor Agent**: Uses strategies and insights
- **Identity Agent**: Uses identity-related knowledge
- **Accountability Agent**: Uses motivation and timing knowledge

---

## 📊 **8. Analytics Database (New)**

### **Purpose**
Store performance metrics and analytics for system optimization.

### **Properties**
```typescript
interface AnalyticsDatabase {
  // Core Fields
  "Metric ID": { type: "title" }
  "Metric Type": { type: "select", options: ["User", "Habit", "Agent", "System", "Group"] }
  "Metric Name": { type: "rich_text", description: "Name of metric" }
  "Value": { type: "number", description: "Metric value" }
  "Unit": { type: "rich_text", description: "Unit of measurement" }
  "Date": { type: "date" }
  
  // Context
  "User": { type: "relation", target: "Users", description: "If user-specific" }
  "Habit": { type: "relation", target: "Habits", description: "If habit-specific" }
  "Agent": { type: "select", options: ["Mentor", "Identity", "Accountability", "Group", "Learning", "System"] }
  "Timeframe": { type: "select", options: ["Daily", "Weekly", "Monthly", "Quarterly"] }
  
  // Analysis
  "Trend": { type: "select", options: ["Improving", "Stable", "Declining"] }
  "Comparison": { type: "rich_text", description: "Compared to previous period" }
  "Significance": { type: "select", options: ["Low", "Medium", "High", "Critical"] }
  "Action Required": { type: "checkbox" }
  
  // Metadata
  "Calculated At": { type: "date" }
  "Data Sources": { type: "multi_select", options: ["Notion", "Neo4j", "Discord", "External"] }
  "Confidence": { type: "number", description: "0-1 confidence in metric" }
}
```

### **Agent Access Patterns**
- **All Agents**: Generate metrics relevant to their domain
- **Orchestrator**: Monitors system-wide metrics
- **Learning Agent**: Analyzes patterns across metrics

---

## 🔗 **Database Relationships**

### **Primary Relationships**
```
Users (1) ←→ (Many) Personal Profiles
Users (1) ←→ (Many) Habits
Users (1) ←→ (Many) Proofs
Users (1) ←→ (Many) Learnings
Users (1) ←→ (Many) Hurdles
Users (1) ←→ (Many) Weeks
Users (Many) ←→ (Many) Groups

Habits (1) ←→ (Many) Proofs
Habits (Many) ←→ (Many) Recommendations
Habits (Many) ←→ (Many) Knowledge Base

Users (1) ←→ (Many) Agent Interactions
Users (1) ←→ (Many) Recommendations
Users (1) ←→ (Many) Analytics
```

### **Cross-Database Queries**
- **User Profile + Habits**: Get personality-aligned habits
- **Proofs + Analytics**: Calculate success rates and patterns
- **Learnings + Knowledge Base**: Extract system-wide insights
- **Agent Interactions + Analytics**: Measure agent effectiveness

---

## 🔐 **Access Control Strategy**

### **Agent Permissions**
```typescript
interface AgentPermissions {
  "Mentor Agent": {
    read: ["Users", "Habits", "Proofs", "Learnings", "Personal Profiles", "Knowledge Base"],
    write: ["Agent Interactions", "Recommendations", "Analytics"],
    update: ["Habits.Success Pattern", "Habits.Failure Pattern"]
  },
  
  "Identity Agent": {
    read: ["Users", "Personal Profiles", "Habits", "Knowledge Base"],
    write: ["Agent Interactions", "Recommendations", "Analytics"],
    update: ["Habits.Identity Alignment", "Habits.Personality Compatibility"]
  },
  
  "Accountability Agent": {
    read: ["Users", "Habits", "Proofs", "Personal Profiles"],
    write: ["Agent Interactions", "Recommendations", "Analytics"],
    update: ["Habits.Optimal Timing", "Habits.Reminder Type"]
  },
  
  "Group Agent": {
    read: ["Users", "Groups", "Personal Profiles", "Habits", "Proofs"],
    write: ["Agent Interactions", "Recommendations", "Analytics"],
    update: ["Groups.Performance", "Groups.Dynamics"]
  },
  
  "Learning Agent": {
    read: ["All Databases"],
    write: ["Knowledge Base", "Agent Interactions", "Recommendations", "Analytics"],
    update: ["All Agent Enhancement Fields"]
  }
}
```

---

## 🚀 **Implementation Strategy**

### **Phase 1: Core Enhancement** (Week 1)
1. Add agent enhancement fields to existing databases
2. Create Personal Profiles database
3. Set up basic access controls
4. Test data flow with existing system

### **Phase 2: Agent Databases** (Week 2)
1. Create Agent Interactions database
2. Create Recommendations database
3. Implement logging and tracking
4. Test agent data access

### **Phase 3: Intelligence Databases** (Week 3)
1. Create Knowledge Base database
2. Create Analytics database
3. Implement cross-database queries
4. Set up automated metric calculation

### **Phase 4: Optimization** (Week 4)
1. Optimize database performance
2. Implement advanced access controls
3. Set up data validation
4. Create monitoring and alerting

---

*This database schema provides a comprehensive foundation for the multi-agent system while maintaining compatibility with the existing habit tracking system.*
