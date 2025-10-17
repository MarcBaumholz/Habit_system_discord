# 🤖 Multi-Agent System Usage Guide

## 🎯 **Overview**

Your Discord habit bot now features a sophisticated multi-agent system inspired by Microsoft AutoGen framework principles. This guide explains how to use each agent and what they do.

## 🧠 **AutoGen-Inspired Architecture**

The system uses **AutoGen principles** for intelligent agent coordination:
- **Agent Specialization**: Each agent has specific capabilities
- **Intelligent Routing**: Requests automatically go to the right agent
- **Collaborative Intelligence**: Agents work together for comprehensive support
- **Context Awareness**: Agents understand your full situation

## 🤖 **Available Agents**

### **1. Identity Agent** 🆔
**Command**: `/identity`

**What it does:**
- Analyzes your personality and values
- Recommends habits that align with your identity
- Tracks your identity evolution over time
- Provides identity-based coaching

**When to use:**
- "I want habits that match my personality"
- "What habits align with my values?"
- "How is my identity evolving?"
- "I need identity-based recommendations"

**Example queries:**
```
/identity query:"identity analysis"
/identity query:"personality habits"
/identity query:"identity alignment"
```

**Sample Response:**
```
🆔 Identity Analysis Complete

Your Identity Profile:
• Personality Score: 8.5/10
• Habit Alignment: 7.2/10
• Evolution Stage: Developing

Key Insights:
High conscientiousness aligns well with structured habits. Consider identity-based habit formation focusing on "I am a person who..."

Identity-Aligned Recommendations:
1. Morning meditation (aligns with introspective nature)
2. Journaling (leverages analytical thinking)
3. Reading (feeds knowledge-seeking trait)
```

---

### **2. Accountability Agent** 📊
**Command**: `/accountability`

**What it does:**
- Monitors your progress and motivation
- Sends personalized accountability messages
- Detects when you need intervention
- Celebrates your successes

**When to use:**
- "I need motivation to stay consistent"
- "I'm struggling with my habits"
- "Check in on my progress"
- "I need intervention"

**Example queries:**
```
/accountability query:"check in"
/accountability query:"motivation"
/accountability query:"intervention"
/accountability query:"celebration"
```

**Sample Response:**
```
📊 Accountability Check Complete

Your Progress Analysis:
• Consistency Score: 8/10
• Motivation Level: 7/10
• Risk Factors: None detected

Personalized Message:
Great job maintaining your 15-day streak! Your morning exercise routine is really clicking. Keep up this momentum - you're building real identity as someone who prioritizes health.

Next Action: Consider adding a second habit to your morning routine.
```

---

### **3. Group Agent** 👥
**Command**: `/group`

**What it does:**
- Analyzes group dynamics and compatibility
- Recommends social strategies
- Optimizes peer support
- Facilitates group coordination

**When to use:**
- "How can I leverage group support?"
- "What's my role in the group?"
- "I need social accountability"
- "Group dynamics analysis"

**Example queries:**
```
/group query:"group analysis"
/group query:"social recommendations"
/group query:"peer support"
/group query:"group dynamics"
```

**Sample Response:**
```
👥 Group Dynamics Analysis

Your Social Profile:
• Compatibility Score: 8.5/10
• Influence Level: High
• Group Dynamics: Strong leadership role established

Social Recommendations:
1. Take on mentoring role for new members
2. Organize group challenges and competitions
3. Share advanced strategies and insights
4. Lead group reflection sessions
```

---

### **4. Learning & Hurdles Agent** 📚
**Command**: `/learning`

**What it does:**
- Extracts insights from your learnings
- Analyzes hurdle patterns
- Generates solution recommendations
- Identifies success factors

**When to use:**
- "What patterns do you see in my data?"
- "I need solutions for my hurdles"
- "What insights can you extract?"
- "Help me understand my learning"

**Example queries:**
```
/learning query:"pattern analysis"
/learning query:"hurdle solutions"
/learning query:"learning insights"
/learning query:"success factors"
```

**Sample Response:**
```
📚 Learning & Hurdles Analysis

Key Insights Discovered:

PATTERN INSIGHTS:
• Morning exercise consistently leads to better energy throughout the day (Confidence: 9/10)
• 5-minute rule works best for starting difficult habits (Confidence: 8/10)

HURDLE SOLUTIONS:
1. Use 5-minute rule to overcome procrastination
   Effectiveness: 8/10
   Steps: Set timer → Do minimal version → Stop after 5 minutes → Gradually increase

2. Create morning routine to solve time management
   Effectiveness: 9/10
   Steps: Wake up 30 minutes earlier → Prepare night before → Start small → Build consistency
```

---

### **5. Mentor Agent** 🧘‍♂️
**Command**: `/mentor` (Currently disabled)

**What it does:**
- Provides personalized habit coaching
- Analyzes your progress patterns
- Gives feedback and recommendations
- Offers general habit guidance

**When to use:**
- "I need general habit coaching"
- "Analyze my progress"
- "Give me feedback"
- "Weekly analysis"

---

## 🔄 **How Agents Work Together**

### **Intelligent Routing**
The system automatically routes your requests to the most appropriate agent:

- **Identity questions** → Identity Agent
- **Motivation/accountability** → Accountability Agent  
- **Social/group questions** → Group Agent
- **Learning/insights** → Learning Agent
- **General coaching** → Mentor Agent

### **Collaborative Intelligence**
Agents can work together for comprehensive support:

1. **Identity Agent** identifies your personality traits
2. **Accountability Agent** uses this to personalize motivation
3. **Group Agent** finds compatible accountability partners
4. **Learning Agent** extracts insights from your journey

## 📊 **Data Sources**

### **Existing Databases Used:**
- **Users**: Your profile and preferences
- **Habits**: Your current habits and goals
- **Proofs**: Your daily progress and submissions
- **Learnings**: Your insights and discoveries
- **Hurdles**: Your challenges and obstacles
- **Groups**: Your social connections and dynamics

### **New Databases Created:**
- **Identity Analysis**: Personality-based habit analysis
- **Accountability Sessions**: Motivation and support interactions
- **Group Analysis**: Social dynamics and compatibility
- **Learning Insights**: AI-extracted patterns and insights
- **Hurdle Solutions**: AI-generated solutions for obstacles

## 🎯 **Best Practices**

### **1. Be Specific**
Instead of: "Help me with habits"
Try: "I need identity-aligned habit recommendations"

### **2. Use Context**
Mention your situation: "I'm struggling with morning exercise motivation"

### **3. Ask Follow-up Questions**
After getting recommendations, ask: "How do I implement this?"

### **4. Combine Agents**
Use multiple agents for comprehensive support:
1. Start with Identity Agent for personality analysis
2. Use Accountability Agent for motivation
3. Check Group Agent for social support
4. Use Learning Agent for insights

## 🚀 **Getting Started**

### **Step 1: Complete Your Profile**
Use `/onboard` to create your personality profile (required for Identity Agent)

### **Step 2: Test Each Agent**
Try each command to see what they offer:
```
/identity query:"identity analysis"
/accountability query:"check in"
/group query:"group analysis"
/learning query:"pattern analysis"
```

### **Step 3: Use Regularly**
Integrate agents into your daily habit routine:
- Morning: Check accountability
- Weekly: Review identity alignment
- When stuck: Get hurdle solutions
- Social: Leverage group dynamics

## 🔧 **Technical Details**

### **AI Integration**
- **Perplexity API**: All agents use your existing API key
- **Sonar Model**: Advanced reasoning and analysis
- **Context Awareness**: Full access to your habit data

### **Personal Channel**
- **Channel ID**: `1422681618304471131`
- **All agents work in your personal channel**
- **Private conversations with AI agents**

### **Data Storage**
- **Existing**: Uses your current Notion databases
- **New**: Mock data files created (see `mock_data/` folder)
- **Future**: Will integrate with new Notion tables

## 📈 **Expected Outcomes**

### **Personalized Coaching**
- Habits that match your personality
- Motivation tailored to your needs
- Social strategies that work for you
- Insights specific to your journey

### **Intelligent Support**
- Automatic agent selection
- Context-aware responses
- Collaborative intelligence
- Continuous learning and improvement

### **Comprehensive Coverage**
- Identity alignment
- Motivation and accountability
- Social dynamics
- Learning and growth
- General habit coaching

---

**Ready to start?** Try your first agent command and experience the power of multi-agent habit coaching!

**Need help?** Each agent is designed to be intuitive - just describe what you need and the system will route you to the right agent.
