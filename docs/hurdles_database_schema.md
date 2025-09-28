# Hurdles Database Schema

## Database: Hurdles

### Purpose
Track obstacles, challenges, and barriers that users encounter while building their habits. This helps identify patterns and develop strategies for overcoming common hurdles.

### Properties

| Property Name | Type | Description | Required |
|---------------|------|-------------|----------|
| **Name** | Title | Short title/description of the hurdle | ✅ |
| **User** | Relation | Link to Users database | ✅ |
| **Habit** | Relation | Link to specific habit (optional) | ❌ |
| **Hurdle Type** | Select | Category of hurdle | ✅ |
| **Description** | Rich Text | Detailed description of the hurdle | ✅ |
| **Date** | Date | When this hurdle was documented | ✅ |

### Select Options

#### Hurdle Type
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

#### Impact Level
- **Low** - Minor inconvenience
- **Medium** - Noticeable impact on progress
- **High** - Significant barrier to success
- **Critical** - Complete blocker

#### Frequency
- **One-time** - Happened once
- **Occasional** - Happens sometimes
- **Regular** - Happens often
- **Constant** - Always present

#### Status
- **Active** - Currently experiencing
- **Resolved** - Successfully overcome
- **Mitigated** - Reduced impact but still present
- **Accepted** - Learning to live with it

### Example Hurdle Entry

```
Name: "Too tired after work"
Hurdle Type: Energy/Motivation
Description: "I'm exhausted when I get home from work and can't find energy to exercise"
Impact Level: High
Frequency: Regular
Context: "Happens every weekday around 6-7 PM"
Strategies: "Tried morning workouts but couldn't stick to it"
Status: Active
Date Encountered: 2024-01-15
```

### Integration Points

1. **Users Database**: Each hurdle is linked to a specific user
2. **Habits Database**: Hurdles can be linked to specific habits
3. **Proofs Database**: Hurdles might affect proof submissions
4. **Learnings Database**: Solutions to hurdles become learnings

### Analytics & Insights

- **Most Common Hurdles**: Track which hurdles affect most users
- **Resolution Rate**: How often hurdles get resolved
- **Habit-Specific Patterns**: Which habits have the most hurdles
- **Seasonal Patterns**: Time-based hurdle trends
- **Success Strategies**: What works for overcoming specific hurdles

### Discord Integration

- **Channel**: `#learnings-and-hurdles-feed`
- **Command**: `/hurdles` - Document a new hurdle
- **Feed**: Share hurdles and solutions with community
- **Support**: Community can help with hurdle strategies
