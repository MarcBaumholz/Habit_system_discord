# Discord Bot Slash Commands Documentation

## Available Slash Commands in Your Habit System Discord Bot

Your Discord bot has **6 main slash commands** available for users to interact with the habit tracking system:

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

## 6. `/keystonehabit`
**Description:** Create a keystone habit - the foundation of your daily routine  
**Purpose:** Set up your most important habit that influences other behaviors  
**Parameters:**
- `name` (required) - Name of your keystone habit
- `domains` (required) - Life categories this habit affects
- `frequency` (required) - How many days per week? (1-7)
- `context` (required) - When and where will you do this habit?
- `difficulty` (required) - How challenging is this habit?
- `smart_goal` (required) - Your specific, measurable goal
- `why` (required) - Why is this habit important to you?
- `minimal_dose` (required) - What's the smallest version for tough days?
- `habit_loop` (required) - Describe your habit loop: Cue → Craving → Routine → Reward
- `implementation_intentions` (required) - If-then plans for obstacles
- `hurdles` (required) - What challenges might you face?
- `reminder_type` (required) - How will you remember to do this habit?

**Available reminder types:**
- Phone Alarm
- Calendar Event
- Habit Stacking
- Visual Reminder
- Accountability Partner

**Available difficulty levels:**
- Easy - Takes minimal effort
- Medium - Requires some discipline
- Hard - Needs strong commitment

**Usage:** `/keystonehabit name:"Morning Meditation" domains:"health,mental" frequency:7 context:"In my bedroom before breakfast" difficulty:"medium" smart_goal:"Meditate for 10 minutes daily" why:"To improve my mental clarity and reduce stress" minimal_dose:"2 minute breathing exercise" habit_loop:"Wake up cue → peace craving → meditation routine → calm reward" implementation_intentions:"If I'm rushed, then I'll do 2 minutes" hurdles:"Forgetting, feeling lazy" reminder_type:"habit_stacking"`

---

## Command Categories

### **Setup Commands:**
- `/join` - Initial registration
- `/keystonehabit` - Create and set foundation habits

### **Daily Tracking:**
- `/proof` - Log daily completion

### **Progress & Insights:**
- `/summary` - View weekly progress
- `/learning` - Share insights
- `/hurdles` - Document challenges

---

## Integration Features

All commands integrate with:
- **Notion Database** - Automatic data synchronization
- **Discord Channels** - Community sharing and accountability
- **AI-Powered Matching** - Smart habit suggestions
- **Progress Analytics** - Detailed tracking and insights

---

## Usage Tips

1. **Start with `/join`** to register in the system
2. **Create your foundation habit** with `/keystonehabit`
3. **Track daily progress** with `/proof`
4. **Share learnings** and **document hurdles** for community support
5. **Check your progress** regularly with `/summary`

---

*This documentation reflects the current implementation as of the latest codebase analysis.*
