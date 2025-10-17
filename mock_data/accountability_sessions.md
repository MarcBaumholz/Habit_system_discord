# Accountability Sessions Database (Mock Data)

## Table: Accountability Sessions

| ID | User ID | Discord ID | Session Type | Message | Response | Effectiveness | Next Action | Created At |
|----|---------|------------|--------------|---------|----------|---------------|-------------|------------|
| acc_001 | user_001 | 1422681618304471131 | check_in | How are your habits going today? | Great! Did 30 min exercise this morning | 8 | Continue current momentum | 2025-10-13T08:00:00Z |
| acc_002 | user_001 | 1422681618304471131 | intervention | I noticed you missed 2 days. Let's get back on track! | You're right, I'll start fresh today | 9 | Set smaller goals for this week | 2025-10-12T18:00:00Z |
| acc_003 | user_001 | 1422681618304471131 | celebration | Amazing! 15-day streak! You're building real momentum! | Thank you! Feeling proud of this progress | 10 | Plan next habit to add | 2025-10-11T20:00:00Z |
| acc_004 | user_001 | 1422681618304471131 | reminder | Time for your evening reflection. How did today go? | Did my journaling, feeling good about today | 7 | Keep evening routine consistent | 2025-10-10T21:00:00Z |

## Sample Session Details

### Check-in Session #1
- **Type**: Check-in
- **Message**: "How are your habits going today? I see you've been consistent with exercise. What's working well?"
- **User Response**: "Great! Did 30 min exercise this morning. The morning routine is really clicking now."
- **Effectiveness**: 8/10
- **Analysis**: Positive momentum detected, user engaged
- **Next Action**: Continue current momentum, maybe add second habit

### Intervention Session #1
- **Type**: Intervention
- **Message**: "I noticed you missed 2 days this week. That's totally normal! Let's get back on track with a fresh start."
- **User Response**: "You're right, I got discouraged but I'll start fresh today with my morning routine."
- **Effectiveness**: 9/10
- **Analysis**: User accepted support, ready to restart
- **Next Action**: Set smaller, achievable goals for the week

### Celebration Session #1
- **Type**: Celebration
- **Message**: "Amazing! 15-day streak! You're building real momentum and this is becoming part of who you are!"
- **User Response**: "Thank you! I'm feeling really proud of this progress and more confident."
- **Effectiveness**: 10/10
- **Analysis**: High engagement, identity shift happening
- **Next Action**: Plan next habit to add to the stack

### Reminder Session #1
- **Type**: Reminder
- **Message**: "Time for your evening reflection. How did today go? What did you learn?"
- **User Response**: "Did my journaling, feeling good about today. Learned that consistency beats perfection."
- **Effectiveness**: 7/10
- **Analysis**: Good engagement, learning happening
- **Next Action**: Keep evening routine consistent

## Session Type Definitions

### Check-in
- **Purpose**: Regular progress monitoring
- **Frequency**: Daily or weekly
- **Goal**: Maintain awareness and motivation
- **Message Style**: Supportive, curious

### Intervention
- **Purpose**: Address struggles or setbacks
- **Trigger**: Missed days, low motivation, negative patterns
- **Goal**: Get back on track
- **Message Style**: Empathetic, solution-focused

### Celebration
- **Purpose**: Acknowledge successes and milestones
- **Trigger**: Streaks, breakthroughs, consistency
- **Goal**: Reinforce positive behavior
- **Message Style**: Enthusiastic, proud

### Reminder
- **Purpose**: Gentle nudges for specific actions
- **Frequency**: As needed
- **Goal**: Maintain momentum
- **Message Style**: Gentle, encouraging

## Database Schema

```sql
CREATE TABLE accountability_sessions (
    id VARCHAR(50) PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL,
    discord_id VARCHAR(50) NOT NULL,
    session_type ENUM('reminder', 'check_in', 'intervention', 'celebration') NOT NULL,
    message TEXT NOT NULL,
    response TEXT,
    effectiveness TINYINT NOT NULL,
    next_action TEXT,
    created_at TIMESTAMP NOT NULL
);
```

## Notion Database Properties

- **ID**: Title (Primary Key)
- **User**: Relation to Users database
- **Discord ID**: Text
- **Session Type**: Select (reminder, check_in, intervention, celebration)
- **Message**: Rich Text
- **Response**: Rich Text
- **Effectiveness**: Number (1-10)
- **Next Action**: Text
- **Created At**: Date
