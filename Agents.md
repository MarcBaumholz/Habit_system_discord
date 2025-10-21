# 🤖 Habit System - Agent Overview

> **📖 For complete documentation, see [AGENTS_SYSTEM_ARCHITECTURE.md](./AGENTS_SYSTEM_ARCHITECTURE.md)**

## 🎯 System Purpose

**Create real behavior change through intelligent AI agents that understand users deeply and coordinate to maximize habit formation success.**

---

## 🏗️ Architecture

```
                    ORCHESTRATOR
                         │
        ┌────────────────┼────────────────┐
        │                │                │
    MENTOR         IDENTITY        ACCOUNTABILITY
    AGENT           AGENT              AGENT
        │                │                │
        └────────────────┴────────────────┘
                         │
                    ┌────┴────┐
                 GROUP      LEARNING
                 AGENT       AGENT
```

---

## 🤖 Core Agents

### 1. 🧘‍♂️ Mentor Agent
**Role:** Personalized habit coach

**What it does:**
- Analyzes habit patterns (success/failure)
- Identifies what worked in the past
- Provides personalized coaching advice
- Delivers weekly comprehensive analysis
- Gives feedback based on historical data

**Triggered:** Wed 9 AM (auto) + `/mentor` command

**Databases:** Users, Habits, Proofs, Learnings, Weeks, Personality

---

### 2. 🆔 Identity Agent
**Role:** Digital twin for personality-habit alignment

**What it does:**
- Checks if habits align with personality (MBTI, Big Five)
- Recommends identity-based habits ("I am" vs. "I want to")
- Scans all habits to find personality matches
- Tracks identity evolution over time
- Ensures habits reflect core values

**Triggered:** `/identity` command

**Databases:** Personality, Users, Habits, Proofs

---

### 3. 📊 Accountability Agent
**Role:** Adaptive motivation engine

**What it does:**
- Sends adaptive reminders (smart timing)
- Provides AI-powered incentives
- Detects when intervention needed
- Monitors progress daily
- Celebrates milestones
- Gentle nudges when falling behind

**Triggered:** User's best time (auto) + `/accountability` command

**Databases:** Users, Habits, Proofs, Weeks

---

### 4. 👥 Group Agent
**Role:** Social dynamics optimizer

**What it does:**
- Forms optimal groups (personality + interests)
- Monitors group motivation via proofs
- Clusters people by performance (high/low)
- Ensures high performers support low performers
- Detects group breakdown risk early
- Sends reminders when members fall behind
- Manages group dynamics and mood

**Triggered:** Wed 9 AM (auto) + `/group` command

**Databases:** Groups, Users, Habits, Proofs, Personality

---

### 5. 📚 Learning & Hurdles Agent
**Role:** Pattern recognition and knowledge synthesis

**What it does:**
- Analyzes user learnings to find patterns
- Identifies which habits work best (based on user entries)
- Learns from successful habit builders
- Focuses on hurdles users face
- Generates solutions for common obstacles
- Extracts actionable insights
- Shares strategies across users (future)

**Triggered:** Weekly + new hurdle logged + `/learning` command

**Databases:** Learnings, Hurdles, Users, Habits, Proofs

---

## 🎭 Orchestrator

**Role:** Central coordinator

**What it does:**
- Routes requests to appropriate agent(s)
- Combines responses from multiple agents
- Manages agent coordination
- Ensures coherent user experience
- Monitors system health

**How it works:**
1. Receives user message
2. Determines which agent(s) should respond
3. Executes primary + supporting agents
4. Aggregates responses
5. Returns comprehensive answer

---

## ⚡ Trigger System

### Automatic (Scheduled)
- **Wed 9 AM**: All 5 agents run weekly analysis
- **Daily at user's best time**: Accountability reminders
- **Daily 6 AM**: Habit count messages

### Manual (Commands)
- `/agent <query>` - Orchestrator routes to best agent
- `/mentor` - Mentor agent
- `/identity` - Identity agent
- `/accountability` - Accountability agent
- `/group` - Group agent
- `/learning` - Learning agent

### Event-Based
- Completion rate < 50% → Accountability intervention
- 7-day streak → Celebration
- New hurdle logged → Learning agent generates solution
- Group member inactive 3+ days → Peer support nudge

---

## 🎯 Behavior Change Focus

All agents work together to create lasting change through:

1. **Data-Driven Personalization** - Based on real user data
2. **Identity-Based Formation** - "I am" habits stick better
3. **Timely Interventions** - Catch issues early
4. **Social Accountability** - Peer pressure works
5. **Pattern Recognition** - Learn from successes/failures
6. **Adaptive Support** - Right help at right time
7. **Knowledge Synthesis** - Build personal wisdom

---

## 📊 Key Metrics

- **Response Time:** < 3 seconds
- **Confidence Score:** > 0.75
- **Success Rate:** > 95%
- **Habit Adherence:** > 70%
- **Average Streak:** > 14 days

---

## 🚀 Status

**Production:** 5 agents active  
**Orchestrator:** Fully operational  
**Weekly Scheduler:** Running (Wed 9 AM)  
**Commands:** All working  

---

## 📖 Full Documentation

**See [AGENTS_SYSTEM_ARCHITECTURE.md](./AGENTS_SYSTEM_ARCHITECTURE.md) for:**
- Detailed agent capabilities
- Complete database interaction maps
- Implementation with Claude SDK
- Sub-functions and workflows
- AI prompt structures
- Coordination patterns
- Future enhancements

---

**Version:** 2.0  
**Last Updated:** October 20, 2025