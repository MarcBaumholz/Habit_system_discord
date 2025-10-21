# 📚 Notion Databases - Complete Reference Guide

## 🎯 Overview

This document provides a complete reference for all 8 Notion databases used in the Habit System Discord Bot. Each database has a unique ID, specific properties, and defined relationships with other databases.

---

## 📋 Table of Contents

1. [Database IDs](#database-ids)
2. [Database Relationships](#database-relationships)
3. [Database Schemas](#database-schemas)
   - [1. Users Database](#1-users-database)
   - [2. Habits Database](#2-habits-database)
   - [3. Proofs Database](#3-proofs-database)
   - [4. Learnings Database](#4-learnings-database)
   - [5. Weeks Database](#5-weeks-database)
   - [6. Groups Database](#6-groups-database)
   - [7. Hurdles Database](#7-hurdles-database)
   - [8. Personality Database](#8-personality-database)
4. [Accessing Databases in Code](#accessing-databases-in-code)
5. [Common Operations](#common-operations)
6. [Setup Instructions](#setup-instructions)

---

## 🔑 Database IDs

These are your configured Notion database IDs:

```env
NOTION_DATABASE_USERS=278d42a1faf580cea57ff646855a4130
NOTION_DATABASE_HABITS=278d42a1faf581929c22e764556d7dd5
NOTION_DATABASE_PROOFS=278d42a1faf5810a9564c919c212a9e9
NOTION_DATABASE_LEARNINGS=278d42a1faf5812ea4d6d6010bb32e05
NOTION_DATABASE_WEEKS=278d42a1faf58105a480e66aeb852e91
NOTION_DATABASE_GROUPS=278d42a1faf581088b3bfa73450f34b4
NOTION_DATABASE_HURDLES=278d42a1faf581ef9ec6d14f07c816e2
NOTION_DATABASE_PERSONALITY=289d42a1faf58153b0b0fcdcab4451bd
```

**Direct URLs:**
- Users: `https://www.notion.so/marcbaumholz/278d42a1faf580cea57ff646855a4130`
- Habits: `https://www.notion.so/marcbaumholz/278d42a1faf581929c22e764556d7dd5`
- Proofs: `https://www.notion.so/marcbaumholz/278d42a1faf5810a9564c919c212a9e9`
- Learnings: `https://www.notion.so/marcbaumholz/278d42a1faf5812ea4d6d6010bb32e05`
- Weeks: `https://www.notion.so/marcbaumholz/278d42a1faf58105a480e66aeb852e91`
- Groups: `https://www.notion.so/marcbaumholz/278d42a1faf581088b3bfa73450f34b4`
- Hurdles: `https://www.notion.so/marcbaumholz/278d42a1faf581ef9ec6d14f07c816e2`
- Personality: `https://www.notion.so/marcbaumholz/289d42a1faf58153b0b0fcdcab4451bd`

---

## 🔗 Database Relationships

```
┌─────────────────────────────────────────────────────────────────┐
│                      Database Relationships                      │
└─────────────────────────────────────────────────────────────────┘

                          ┌──────────────┐
                          │    Users     │ (Core entity)
                          └──────┬───────┘
                                 │
              ┌──────────────────┼──────────────────┐
              │                  │                  │
              ▼                  ▼                  ▼
      ┌────────────┐      ┌────────────┐    ┌──────────────┐
      │   Habits   │      │   Weeks    │    │ Personality  │
      └─────┬──────┘      └────────────┘    └──────────────┘
            │
      ┌─────┴─────────────────────┐
      │                           │
      ▼                           ▼
┌──────────┐              ┌────────────┐
│  Proofs  │              │  Hurdles   │
└──────────┘              └────────────┘
      │                           │
      └───────────┬───────────────┘
                  ▼
          ┌──────────────┐
          │   Learnings  │
          └──────────────┘

            ┌──────────┐
            │  Groups  │ (Independent)
            └──────────┘

Relationships:
• User → 1:N → Habits, Weeks, Personality, Hurdles, Learnings, Proofs
• Habit → 1:N → Proofs, Hurdles, Learnings
• Groups → Independent (contains channel information)
```

---

## 📊 Database Schemas

### 1. Users Database

**Purpose:** Store Discord user information and tracking data.

**Database ID:** `278d42a1faf580cea57ff646855a4130`

#### Properties

| Property Name | Type | Description | Required | Notes |
|---------------|------|-------------|----------|-------|
| **Discord ID** | Title | Discord user ID | ✅ | Primary identifier |
| **Name** | Rich Text | User's display name | ✅ | - |
| **Timezone** | Rich Text | User's timezone | ✅ | Format: `Europe/Berlin` |
| **Best Time** | Rich Text | Preferred reminder time | ✅ | Format: `HH:MM` |
| **Trust Count** | Number | Trust/accountability score | ✅ | Default: 0 |
| **Personal Channel ID** | Rich Text | Private Discord channel ID | ❌ | Optional |

#### Code Access Example

```typescript
// Create a new user
const newUser = await notionClient.createUser({
  discordId: '123456789012345678',
  name: 'John Doe',
  timezone: 'Europe/Berlin',
  bestTime: '09:00',
  trustCount: 0,
  personalChannelId: '987654321098765432'
});

// Get user by Discord ID
const user = await notionClient.getUserByDiscordId('123456789012345678');

// Update user
await notionClient.updateUser(user.id, {
  trustCount: 5,
  personalChannelId: '111222333444555666'
});
```

#### Notion API Structure

```javascript
{
  parent: { database_id: 'NOTION_DATABASE_USERS' },
  properties: {
    'DiscordID': { title: [{ text: { content: 'discordId' } }] },
    'Name': { rich_text: [{ text: { content: 'name' } }] },
    'Timezone': { rich_text: [{ text: { content: 'timezone' } }] },
    'Best Time': { rich_text: [{ text: { content: 'bestTime' } }] },
    'Trust Count': { number: trustCount },
    'Personal Channel ID': { rich_text: [{ text: { content: 'channelId' } }] }
  }
}
```

---

### 2. Habits Database

**Purpose:** Store user habits with detailed configuration and tracking parameters.

**Database ID:** `278d42a1faf581929c22e764556d7dd5`

#### Properties

| Property Name | Type | Description | Required | Notes |
|---------------|------|-------------|----------|-------|
| **Name** | Title | Habit name | ✅ | Primary identifier |
| **User** | Relation | Link to Users DB | ✅ | Foreign key |
| **Domains** | Multi-select | Life domains | ✅ | See options below |
| **Frequency** | Number | Weekly target frequency | ✅ | Times per week |
| **Context** | Rich Text | When/where habit occurs | ✅ | - |
| **Difficulty** | Rich Text | Difficulty level | ✅ | Easy/Medium/Hard |
| **SMART Goal** | Rich Text | Specific, measurable goal | ✅ | - |
| **Why** | Rich Text | Motivation/reason | ✅ | - |
| **Minimal Dose** | Rich Text | Minimum acceptable action | ✅ | - |
| **Habit Loop** | Rich Text | Cue-Routine-Reward | ✅ | - |
| **Implementation Intentions** | Rich Text | If-then planning | ✅ | - |
| **Hurdles** | Rich Text | Expected obstacles | ✅ | - |
| **Reminder Type** | Rich Text | How to be reminded | ✅ | - |

#### Domain Options

- Health
- Spirituality
- Intellectual
- Finance
- Career
- Adventure
- Relationships
- Emotions

#### Code Access Example

```typescript
// Create a new habit
const newHabit = await notionClient.createHabit({
  userId: 'user-notion-page-id',
  name: 'Morning Exercise',
  domains: ['Health', 'Emotions'],
  frequency: 5,
  context: 'Every morning at 6 AM in my home gym',
  difficulty: 'Medium',
  smartGoal: 'Exercise for 30 minutes, 5 times per week',
  why: 'To improve my health and energy levels',
  minimalDose: '5 push-ups and 5 squats',
  habitLoop: 'Cue: Alarm at 6 AM | Routine: Exercise | Reward: Protein shake',
  implementationIntentions: 'If I wake up, then I immediately put on workout clothes',
  hurdles: 'Feeling tired, bad weather',
  reminderType: 'Discord message + phone notification'
});

// Get all habits for a user
const habits = await notionClient.getHabitsByUserId('user-notion-page-id');
```

#### Notion API Structure

```javascript
{
  parent: { database_id: 'NOTION_DATABASE_HABITS' },
  properties: {
    'Name': { title: [{ text: { content: 'habit name' } }] },
    'User': { relation: [{ id: 'user-page-id' }] },
    'Domains': { multi_select: [{ name: 'Health' }, { name: 'Emotions' }] },
    'Frequency': { number: 5 },
    'Context': { rich_text: [{ text: { content: 'context' } }] },
    'Difficulty': { rich_text: [{ text: { content: 'difficulty' } }] },
    'SMART Goal ': { rich_text: [{ text: { content: 'smart goal' } }] },
    'Why': { rich_text: [{ text: { content: 'motivation' } }] },
    'Minimal Dose': { rich_text: [{ text: { content: 'minimal dose' } }] },
    'Habit Loop': { rich_text: [{ text: { content: 'cue-routine-reward' } }] },
    'Implementation Intentions': { rich_text: [{ text: { content: 'if-then' } }] },
    'Hurdles': { rich_text: [{ text: { content: 'obstacles' } }] },
    'Reminder Type': { rich_text: [{ text: { content: 'reminder' } }] }
  }
}
```

---

### 3. Proofs Database

**Purpose:** Track habit completions with evidence and metadata.

**Database ID:** `278d42a1faf5810a9564c919c212a9e9`

#### Properties

| Property Name | Type | Description | Required | Notes |
|---------------|------|-------------|----------|-------|
| **Title** | Title | Proof identifier | ✅ | Auto-generated |
| **User** | Relation | Link to Users DB | ✅ | Foreign key |
| **Habit** | Relation | Link to Habits DB | ✅ | Foreign key |
| **Date** | Date | When habit was completed | ✅ | ISO format |
| **Unit** | Rich Text | Measurement unit | ✅ | e.g., "30 minutes" |
| **Note** | Rich Text | Additional notes | ❌ | Optional |
| **Attachment URL** | URL | Link to proof file | ❌ | Discord attachment |
| **Proof** | Files & Media | Attached files | ❌ | Images, videos |
| **Is Minimal Dose** | Checkbox | Was this minimal effort? | ✅ | Boolean |
| **Is Cheat Day** | Checkbox | Was this a cheat day? | ✅ | Boolean |

#### Code Access Example

```typescript
// Create a proof
const proof = await notionClient.createProof({
  userId: 'user-notion-page-id',
  habitId: 'habit-notion-page-id',
  date: '2025-10-20',
  unit: '45 minutes',
  note: 'Great workout session!',
  isMinimalDose: false,
  isCheatDay: false
}, 'https://cdn.discordapp.com/attachments/.../proof.jpg');

// Get proofs for a user
const proofs = await notionClient.getProofsByUserId('user-notion-page-id');

// Get proofs for a date range
const weekProofs = await notionClient.getProofsByUserId(
  'user-notion-page-id',
  '2025-10-14',
  '2025-10-20'
);
```

#### Notion API Structure

```javascript
{
  parent: { database_id: 'NOTION_DATABASE_PROOFS' },
  properties: {
    'Title': { title: [{ text: { content: 'Proof - 2025-10-20' } }] },
    'User': { relation: [{ id: 'user-page-id' }] },
    'Habit': { relation: [{ id: 'habit-page-id' }] },
    'Date': { date: { start: '2025-10-20' } },
    'Unit': { rich_text: [{ text: { content: '45 minutes' } }] },
    'Note': { rich_text: [{ text: { content: 'note text' } }] },
    'Proof': { 
      files: [{ 
        name: 'Proof Attachment',
        external: { url: 'https://...' }
      }]
    },
    'Is Minimal Dose ': { checkbox: false },
    'Is Cheat Day': { checkbox: false }
  }
}
```

---

### 4. Learnings Database

**Purpose:** Store insights and reflections from habit-building journey.

**Database ID:** `278d42a1faf5812ea4d6d6010bb32e05`

#### Properties

| Property Name | Type | Description | Required | Notes |
|---------------|------|-------------|----------|-------|
| **Discord ID** | Title | Discord user ID | ✅ | Primary identifier |
| **User** | Relation | Link to Users DB | ✅ | Foreign key |
| **Habit** | Relation | Link to Habits DB | ❌ | Optional |
| **Text** | Rich Text | Learning content | ✅ | Main content |
| **Created At** | Date | When learning was recorded | ✅ | Timestamp |

#### Code Access Example

```typescript
// Create a learning
const learning = await notionClient.createLearning({
  userId: 'user-notion-page-id',
  habitId: 'habit-notion-page-id',
  discordId: '123456789012345678',
  text: 'I learned that doing exercise in the morning gives me more energy throughout the day.',
  createdAt: '2025-10-20T08:30:00Z'
});

// Get learnings for a user
const learnings = await notionClient.getLearningsByUserId('user-notion-page-id', 10);

// Get learnings by Discord ID
const userLearnings = await notionClient.getLearningsByDiscordId('123456789012345678');
```

#### Notion API Structure

```javascript
{
  parent: { database_id: 'NOTION_DATABASE_LEARNINGS' },
  properties: {
    'DiscordID': { title: [{ text: { content: 'discordId' } }] },
    'User': { relation: [{ id: 'user-page-id' }] },
    'Habit': { relation: [{ id: 'habit-page-id' }] },
    'Text': { rich_text: [{ text: { content: 'learning text' } }] },
    'Created At': { date: { start: '2025-10-20T08:30:00Z' } }
  }
}
```

---

### 5. Weeks Database

**Purpose:** Track weekly summaries, progress, and scores.

**Database ID:** `278d42a1faf58105a480e66aeb852e91`

#### Properties

| Property Name | Type | Description | Required | Notes |
|---------------|------|-------------|----------|-------|
| **Discord ID** | Title | Discord user ID | ✅ | Primary identifier |
| **User** | Relation | Link to Users DB | ✅ | Foreign key |
| **Week Num** | Number | ISO week number | ✅ | 1-52 |
| **Start Date** | Date | Monday of the week | ✅ | ISO format |
| **Summary** | Rich Text | Weekly reflection | ❌ | Optional |
| **Score** | Number | Weekly performance score | ✅ | 0-100 |

#### Code Access Example

```typescript
// Create a weekly summary
const week = await notionClient.createWeek({
  userId: 'user-notion-page-id',
  discordId: '123456789012345678',
  weekNum: 42,
  startDate: '2025-10-13',
  summary: 'Great week! Completed all my habits and learned a lot.',
  score: 85
});

// Get current week info
const { weekStart, weekEnd, weekNumber } = notionClient.getCurrentWeekInfo();
```

#### Notion API Structure

```javascript
{
  parent: { database_id: 'NOTION_DATABASE_WEEKS' },
  properties: {
    'DiscordID': { title: [{ text: { content: 'discordId' } }] },
    'User': { relation: [{ id: 'user-page-id' }] },
    'Week Num': { number: 42 },
    'Start Date': { date: { start: '2025-10-13' } },
    'Summary': { rich_text: [{ text: { content: 'summary text' } }] },
    'Score': { number: 85 }
  }
}
```

---

### 6. Groups Database

**Purpose:** Manage accountability groups and donation pools.

**Database ID:** `278d42a1faf581088b3bfa73450f34b4`

#### Properties

| Property Name | Type | Description | Required | Notes |
|---------------|------|-------------|----------|-------|
| **Name** | Title | Group name | ✅ | Primary identifier |
| **Channel ID** | Rich Text | Discord channel ID | ✅ | Unique per group |
| **Donation Pool** | Number | Current donation amount | ✅ | In currency units |

#### Code Access Example

```typescript
// Create a group
const group = await notionClient.createGroup({
  name: 'Accountability Group 1',
  channelId: '1420295931689173002',
  donationPool: 50
});

// Get all groups
const groups = await notionClient.getAllGroups();
```

#### Notion API Structure

```javascript
{
  parent: { database_id: 'NOTION_DATABASE_GROUPS' },
  properties: {
    'Name': { title: [{ text: { content: 'group name' } }] },
    'Channel ID': { rich_text: [{ text: { content: 'channel id' } }] },
    'Donation Pool': { number: 50 }
  }
}
```

---

### 7. Hurdles Database

**Purpose:** Track obstacles and challenges users face with their habits.

**Database ID:** `278d42a1faf581ef9ec6d14f07c816e2`

#### Properties

| Property Name | Type | Description | Required | Notes |
|---------------|------|-------------|----------|-------|
| **Name** | Title | Hurdle description | ✅ | Primary identifier |
| **User** | Relation | Link to Users DB | ✅ | Foreign key |
| **Habit** | Relation | Link to Habits DB | ❌ | Optional |
| **Hurdle Type** | Select | Category of hurdle | ✅ | See options below |
| **Description** | Rich Text | Detailed description | ✅ | Main content |
| **Date** | Date | When hurdle was encountered | ✅ | ISO format |

#### Hurdle Type Options

- **Time Management** - Scheduling conflicts, lack of time
- **Motivation** - Low energy, lack of drive
- **Environment** - Physical space, distractions
- **Social** - Peer pressure, lack of support
- **Health** - Physical/mental health issues
- **Resources** - Lack of tools, money, access
- **Knowledge** - Not knowing how to do something
- **Habit Stacking** - Conflicts with existing habits
- **Perfectionism** - All-or-nothing thinking
- **Other** - Custom hurdle type

#### Code Access Example

```typescript
// Create a hurdle
const hurdle = await notionClient.createHurdle({
  userId: 'user-notion-page-id',
  habitId: 'habit-notion-page-id',
  name: 'Too tired after work',
  hurdleType: 'Motivation',
  description: 'I feel exhausted when I get home from work and struggle to find energy to exercise.',
  date: '2025-10-20'
});

// Get hurdles for a user
const hurdles = await notionClient.getHurdlesByUserId('user-notion-page-id', 5);

// Get hurdles by Discord ID
const userHurdles = await notionClient.getHurdlesByDiscordId('123456789012345678');
```

#### Notion API Structure

```javascript
{
  parent: { database_id: 'NOTION_DATABASE_HURDLES' },
  properties: {
    'Name': { title: [{ text: { content: 'hurdle name' } }] },
    'User': { relation: [{ id: 'user-page-id' }] },
    'Habit': { relation: [{ id: 'habit-page-id' }] },
    'Hurdle Type': { select: { name: 'Motivation' } },
    'Description': { rich_text: [{ text: { content: 'description' } }] },
    'Date': { date: { start: '2025-10-20' } }
  }
}
```

---

### 8. Personality Database

**Purpose:** Store detailed user personality profiles and life planning information.

**Database ID:** `289d42a1faf58153b0b0fcdcab4451bd`

#### Properties

| Property Name | Type | Description | Required | Notes |
|---------------|------|-------------|----------|-------|
| **Discord ID** | Title | Discord user ID | ✅ | Primary identifier |
| **User** | Relation | Link to Users DB | ✅ | Foreign key |
| **Join Date** | Date | When user joined system | ❌ | ISO format |
| **Personality T...** | Select | MBTI personality type | ❌ | 16 options |
| **Core Values** | Multi-select | User's core values | ❌ | Multiple |
| **Life Vision** | Rich Text | Long-term life vision | ❌ | Main content |
| **Main Goals** | Rich Text | Primary life goals | ❌ | Line-separated |
| **Big five traits** | Rich Text | Big Five assessment | ❌ | OCEAN model |
| **Life domains** | Multi-select | Focus areas | ❌ | Multiple |
| **Life Phase** | Select | Current life stage | ❌ | See options |
| **Desired Identity** | Rich Text | Who they want to become | ❌ | Aspirational |
| **Open Space** | Rich Text | Additional notes | ❌ | Free form |

#### Select Options

**Personality Types:**
- INTJ, INTP, ENTJ, ENTP
- INFJ, INFP, ENFJ, ENFP
- ISTJ, ISFJ, ESTJ, ESFJ
- ISTP, ISFP, ESTP, ESFP

**Life Phases:**
- Student
- Early Career
- Mid Career
- Late Career
- Retirement
- Transition
- Other

#### Code Access Example

```typescript
// Create a user profile
const profile = await notionClient.createUserProfile({
  discordId: '123456789012345678',
  user: { id: 'user-notion-page-id' },
  joinDate: '2025-10-20',
  personalityType: 'INTJ',
  coreValues: ['Growth', 'Health', 'Family'],
  lifeVision: 'Build a healthy, successful life while helping others achieve their goals',
  mainGoals: ['Start a successful business', 'Achieve peak physical fitness', 'Build meaningful relationships'],
  bigFiveTraits: 'Openness: High, Conscientiousness: High, Extraversion: Medium, Agreeableness: High, Neuroticism: Low',
  lifeDomains: ['Career', 'Health', 'Relationships'],
  lifePhase: 'Early Career',
  desiredIdentity: 'A successful entrepreneur who inspires others',
  openSpace: 'Additional notes about my journey...'
});

// Get profile by Discord ID
const profile = await notionClient.getUserProfileByDiscordId('123456789012345678');

// Update profile
await notionClient.updateUserProfile('123456789012345678', {
  lifeVision: 'Updated life vision...',
  mainGoals: ['New goal 1', 'New goal 2']
});
```

#### Notion API Structure

```javascript
{
  parent: { database_id: 'NOTION_DATABASE_PERSONALITY' },
  properties: {
    'Discord ID': { title: [{ text: { content: 'discordId' } }] },
    'User': { relation: [{ id: 'user-page-id' }] },
    'Join Date': { date: { start: '2025-10-20' } },
    'Personality T...': { select: { name: 'INTJ' } },
    'Core Values': { multi_select: [{ name: 'Growth' }, { name: 'Health' }] },
    'Life Vision': { rich_text: [{ text: { content: 'life vision text' } }] },
    'Main Goals': { rich_text: [{ text: { content: 'goal1\ngoal2\ngoal3' } }] },
    'Big five traits': { rich_text: [{ text: { content: 'traits text' } }] },
    'Life domains': { multi_select: [{ name: 'Career' }, { name: 'Health' }] },
    'Life Phase': { select: { name: 'Early Career' } },
    'Desired Identity': { rich_text: [{ text: { content: 'identity text' } }] },
    'Open Space': { rich_text: [{ text: { content: 'notes text' } }] }
  }
}
```

---

## 💻 Accessing Databases in Code

### Initialization

```typescript
import { NotionClient } from './src/notion/client';

const notionClient = new NotionClient(
  process.env.NOTION_TOKEN!,
  {
    users: process.env.NOTION_DATABASE_USERS!,
    habits: process.env.NOTION_DATABASE_HABITS!,
    proofs: process.env.NOTION_DATABASE_PROOFS!,
    learnings: process.env.NOTION_DATABASE_LEARNINGS!,
    weeks: process.env.NOTION_DATABASE_WEEKS!,
    groups: process.env.NOTION_DATABASE_GROUPS!,
    hurdles: process.env.NOTION_DATABASE_HURDLES!,
    personality: process.env.NOTION_DATABASE_PERSONALITY!
  }
);
```

### Using the Notion API Directly

```javascript
const { Client } = require('@notionhq/client');

const notion = new Client({ auth: process.env.NOTION_TOKEN });

// Query a database
const response = await notion.databases.query({
  database_id: process.env.NOTION_DATABASE_USERS,
  filter: {
    property: 'DiscordID',
    rich_text: { equals: '123456789012345678' }
  }
});

// Create a page
await notion.pages.create({
  parent: { database_id: process.env.NOTION_DATABASE_USERS },
  properties: {
    'DiscordID': { title: [{ text: { content: 'user123' } }] },
    'Name': { rich_text: [{ text: { content: 'John Doe' } }] }
  }
});

// Update a page
await notion.pages.update({
  page_id: 'page-id-here',
  properties: {
    'Trust Count': { number: 10 }
  }
});
```

---

## 🔧 Common Operations

### 1. Get User Summary

```typescript
const summary = await notionClient.getUserSummary('user-notion-page-id');

console.log(`
  Total Proofs: ${summary.totalProofs}
  Completion Rate: ${summary.completionRate}%
  Current Streak: ${summary.currentStreak} days
  Best Streak: ${summary.bestStreak} days
  Week Proofs: ${summary.weekProofs}/${summary.weekDays}
`);

// Habit-specific progress
summary.habitProgress.forEach(habit => {
  console.log(`${habit.habitName}: ${habit.actualFrequency}/${habit.targetFrequency} (${habit.completionRate}%)`);
});
```

### 2. Get All Users

```typescript
const allUsers = await notionClient.getAllUsers();

for (const user of allUsers) {
  console.log(`${user.name} (${user.discordId}) - Trust: ${user.trustCount}`);
}
```

### 3. Check Weekly Frequency

```typescript
const frequency = await notionClient.getWeeklyFrequencyCount(
  'user-notion-page-id',
  'habit-notion-page-id'
);

console.log(`Progress: ${frequency.current}/${frequency.target}`);
```

### 4. Retrieve Database Structure

```javascript
#!/usr/bin/env node
const { Client } = require('@notionhq/client');
const notion = new Client({ auth: process.env.NOTION_TOKEN });

async function checkDatabase(databaseId) {
  const database = await notion.databases.retrieve({
    database_id: databaseId
  });
  
  console.log('Properties:');
  Object.entries(database.properties).forEach(([name, prop]) => {
    console.log(`  - ${name} (${prop.type})`);
  });
}

checkDatabase(process.env.NOTION_DATABASE_USERS);
```

---

## 🛠️ Setup Instructions

### Step 1: Create Notion Integration

1. Go to https://www.notion.so/my-integrations
2. Click "New integration"
3. Name: "Discord Habit System"
4. Select your workspace
5. Copy the "Internal Integration Token"

### Step 2: Share Databases with Integration

For each database:
1. Open the database in Notion
2. Click "Share" in top right
3. Click "Add people, emails, groups, or integrations"
4. Search for "Discord Habit System"
5. Give it "Can edit" permissions
6. Click "Invite"

### Step 3: Configure Environment

Add to your `.env` file:

```env
NOTION_TOKEN=your_integration_token_here
NOTION_DATABASE_USERS=278d42a1faf580cea57ff646855a4130
NOTION_DATABASE_HABITS=278d42a1faf581929c22e764556d7dd5
NOTION_DATABASE_PROOFS=278d42a1faf5810a9564c919c212a9e9
NOTION_DATABASE_LEARNINGS=278d42a1faf5812ea4d6d6010bb32e05
NOTION_DATABASE_WEEKS=278d42a1faf58105a480e66aeb852e91
NOTION_DATABASE_GROUPS=278d42a1faf581088b3bfa73450f34b4
NOTION_DATABASE_HURDLES=278d42a1faf581ef9ec6d14f07c816e2
NOTION_DATABASE_PERSONALITY=289d42a1faf58153b0b0fcdcab4451bd
```

### Step 4: Verify Setup

Run the database checker:

```bash
node check-notion-databases.js
```

---

## 📖 Additional Resources

- **Notion API Documentation:** https://developers.notion.com/
- **@notionhq/client NPM:** https://www.npmjs.com/package/@notionhq/client
- **Project Setup Guide:** `SETUP.md`
- **Database Schemas:** `docs/notion_database_schemas.md`
- **Hurdles Guide:** `docs/hurdles_database_schema.md`
- **Personality DB Guide:** `CREATE_PERSONALITY_DATABASE_GUIDE.md`

---

## ⚠️ Important Notes

### Property Name Variations

Some properties have trailing spaces or slight variations:
- `SMART Goal ` (with trailing space)
- `Is Minimal Dose ` (with trailing space)
- `Personality T...` (truncated)
- `Discord ID` vs `DiscordID` (varies by database)

Always check the actual property names in Notion before making API calls.

### Type Handling

- **Title fields:** `{ title: [{ text: { content: 'value' } }] }`
- **Rich text fields:** `{ rich_text: [{ text: { content: 'value' } }] }`
- **Number fields:** `{ number: value }`
- **Checkbox fields:** `{ checkbox: true/false }`
- **Select fields:** `{ select: { name: 'option' } }`
- **Multi-select fields:** `{ multi_select: [{ name: 'option1' }, { name: 'option2' }] }`
- **Relation fields:** `{ relation: [{ id: 'page-id' }] }`
- **Date fields:** `{ date: { start: '2025-10-20' } }`
- **URL fields:** `{ url: 'https://...' }`
- **Files fields:** `{ files: [{ external: { url: 'https://...' } }] }`

### Common Errors

1. **"is a page, not a database"** - You've provided a page ID instead of a database ID
2. **"Could not find database"** - Database not shared with integration
3. **"Property not found"** - Property name doesn't match (check for spaces)
4. **"Invalid parent"** - Database ID is incorrect or malformed

---

## 📅 Last Updated

**Date:** October 20, 2025  
**Version:** 1.0  
**Author:** Habit System Discord Bot Team

---

*This documentation is maintained alongside the codebase. If you notice any discrepancies, please update both this file and the code accordingly.*

