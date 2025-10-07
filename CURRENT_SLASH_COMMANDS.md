# Current Discord Slash Commands Overview

## Status: ✅ Active Commands (8 total)

Your Discord habit system bot currently has **8 slash commands** registered and available for users:

---

## 1. `/join`
**Description:** Join the habit tracking system  
**Purpose:** Initial onboarding command to register users in the system  
**Parameters:** None  
**Usage:** `/join`

---

## 2. `/proof`
**Description:** Submit daily proof  
**Purpose:** Log your daily habit completion with evidence  
**Parameters:**
- `unit` (required) - Measurement unit (e.g., 30 min, 1 km)
- `note` (optional) - Optional note about your proof
- `minimal_dose` (optional) - Is this a minimal dose? (true/false)
- `cheat_day` (optional) - Is this a cheat day? (true/false)
- `attachment` (optional) - Photo/video/audio proof

**Usage:** `/proof unit:"30 minutes" note:"Great workout today!" attachment:[upload photo]`

---

## 3. `/summary`
**Description:** Get your weekly summary  
**Purpose:** View your progress and statistics  
**Parameters:**
- `week` (optional) - Week number

**Usage:** `/summary` or `/summary week:5`

---

## 4. `/learning`
**Description:** Share a learning with the community  
**Purpose:** Post insights and learnings to the community feed  
**Parameters:**
- `text` (required) - Your learning or insight

**Usage:** `/learning text:"I discovered that exercising in the morning gives me more energy throughout the day"`

---

## 5. `/hurdles`
**Description:** Document a hurdle or obstacle  
**Purpose:** Track challenges and obstacles you face  
**Parameters:**
- `name` (required) - Short title for the hurdle
- `type` (required) - Type of hurdle (dropdown with predefined options)
- `description` (required) - Detailed description of the hurdle

**Available hurdle types:**
- Time Management
- Motivation
- Environment
- Social
- Health
- Resources
- Knowledge
- Habit Stacking
- Perfectionism
- Other

**Usage:** `/hurdles name:"Lack of Time" type:"Time Management" description:"I struggle to find time in the morning because I oversleep"`

---

## 6. `/tools`
**Description:** Get link to the habit tools website with 19+ proven strategies  
**Purpose:** Access habit-building resources and tools  
**Parameters:**
- `search` (optional) - Search for a specific tool

**Usage:** `/tools` or `/tools search:"time management"`

---

## 7. `/keystonehabit`
**Description:** Create a keystone habit - the foundation of your daily routine  
**Purpose:** Set up your primary habit that influences other positive behaviors  
**Parameters:**
- `name` (required) - Name of your keystone habit
- `domains` (required) - Life categories this habit affects (comma-separated: health, fitness, work, relationships)
- `frequency` (required) - How many days per week? (1-7)
- `context` (required) - When and where will you do this habit?
- `difficulty` (required) - How challenging is this habit?
  - Easy - Takes minimal effort
  - Medium - Requires some discipline
  - Hard - Needs strong commitment
- `smart_goal` (required) - Your specific, measurable goal for this habit
- `why` (required) - Why is this habit important to you?
- `minimal_dose` (required) - What's the smallest version you can do on tough days?
- `habit_loop` (required) - Describe your habit loop: Cue → Craving → Routine → Reward
- `implementation_intentions` (required) - If-then plans for obstacles (e.g., "If I feel tired, then I will do 5 minutes")
- `hurdles` (required) - What challenges might you face?
- `reminder_type` (required) - How will you remember to do this habit?
  - Phone Alarm
  - Calendar Event
  - Habit Stacking
  - Visual Reminder
  - Accountability Partner

**Usage:** `/keystonehabit name:"Morning Exercise" domains:"health,fitness" frequency:5 context:"In my home gym at 7 AM" difficulty:"medium" smart_goal:"Exercise for 30 minutes daily" why:"To have more energy and feel stronger" minimal_dose:"5 minutes of stretching" habit_loop:"Alarm rings → Feel energized → Do exercise → Feel accomplished" implementation_intentions:"If I feel tired, then I will do 5 minutes of stretching" hurdles:"Time constraints and motivation" reminder_type:"phone_alarm"`

---

## Command Registration Status
- ✅ All 8 commands are properly registered with Discord
- ✅ Commands are registered for guild-specific use
- ✅ Command handlers are implemented in `src/bot/commands.ts`
- ✅ Command definitions are in `src/bot/bot.ts` in the `setupCommands()` method

## Next Steps
All commands are currently active and ready for use. Users can start with `/join` to register and then use any of the other commands to track their habits, submit proofs, and manage their habit-building journey.

---
*Last updated: $(date)*
*Total commands: 8*
