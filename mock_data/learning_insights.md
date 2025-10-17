# Learning Insights Database (Mock Data)

## Table: Learning Insights

| ID | User ID | Discord ID | Insight Type | Content | Confidence | Tags | Source Data | Created At |
|----|---------|------------|--------------|---------|------------|------|-------------|------------|
| insight_001 | user_001 | 1422681618304471131 | pattern | Morning exercise consistently leads to better energy throughout the day | 9 | energy, morning, exercise | {"habits": ["exercise"], "times": ["morning"], "outcomes": ["energy"]} | 2025-10-13T12:00:00Z |
| insight_002 | user_001 | 1422681618304471131 | solution | 5-minute rule works best for starting difficult habits | 8 | motivation, starting, minimal | {"strategy": "5-minute rule", "effectiveness": 0.85} | 2025-10-12T15:30:00Z |
| insight_003 | user_001 | 1422681618304471131 | hurdle | Time management is the biggest obstacle to habit consistency | 7 | time, obstacles, planning | {"hurdle_type": "time_management", "frequency": 0.7} | 2025-10-11T09:15:00Z |
| insight_004 | user_001 | 1422681618304471131 | success | Habit stacking with existing routines increases success rate by 40% | 9 | stacking, routines, success | {"method": "habit_stacking", "improvement": 0.4} | 2025-10-10T18:00:00Z |

## Sample Insights by Type

### Pattern Insights
**Insight**: "Morning exercise consistently leads to better energy throughout the day"
- **Confidence**: 9/10
- **Tags**: energy, morning, exercise
- **Source Data**: Analysis of 15 days of exercise logs
- **Pattern**: 90% of days with morning exercise showed higher energy ratings
- **Application**: Prioritize morning exercise for maximum energy benefit

### Solution Insights
**Insight**: "5-minute rule works best for starting difficult habits"
- **Confidence**: 8/10
- **Tags**: motivation, starting, minimal
- **Source Data**: Testing different starting strategies
- **Effectiveness**: 85% success rate with 5-minute rule
- **Application**: Use 5-minute rule for any habit that feels overwhelming

### Hurdle Insights
**Insight**: "Time management is the biggest obstacle to habit consistency"
- **Confidence**: 7/10
- **Tags**: time, obstacles, planning
- **Source Data**: Analysis of missed habit days
- **Frequency**: 70% of missed days due to time issues
- **Application**: Focus on time management strategies and planning

### Success Insights
**Insight**: "Habit stacking with existing routines increases success rate by 40%"
- **Confidence**: 9/10
- **Tags**: stacking, routines, success
- **Source Data**: Comparison of stacked vs. standalone habits
- **Improvement**: 40% higher success rate with stacking
- **Application**: Always attach new habits to existing routines

## Insight Type Definitions

### Pattern
- **Purpose**: Identify recurring patterns in behavior or outcomes
- **Examples**: Time-of-day effects, environmental factors, emotional triggers
- **Use Case**: Optimize timing and conditions for habits
- **Confidence**: Based on frequency and consistency of pattern

### Solution
- **Purpose**: Identify effective strategies and approaches
- **Examples**: Specific techniques, tools, or methods that work
- **Use Case**: Apply proven solutions to similar problems
- **Confidence**: Based on success rate and effectiveness

### Hurdle
- **Purpose**: Identify obstacles and challenges
- **Examples**: Common barriers, recurring problems, limiting factors
- **Use Case**: Develop targeted solutions for specific obstacles
- **Confidence**: Based on frequency and impact of hurdle

### Success
- **Purpose**: Identify factors that contribute to success
- **Examples**: Key success factors, optimal conditions, winning strategies
- **Use Case**: Replicate success factors in other areas
- **Confidence**: Based on correlation with positive outcomes

## Confidence Scoring

### High Confidence (8-10)
- **Criteria**: Strong evidence, consistent patterns, clear correlation
- **Use**: Apply immediately, high trust in recommendation
- **Examples**: "Morning exercise increases energy" (9/10)

### Medium Confidence (6-7)
- **Criteria**: Some evidence, emerging patterns, moderate correlation
- **Use**: Test carefully, monitor results
- **Examples**: "Time management is biggest obstacle" (7/10)

### Low Confidence (1-5)
- **Criteria**: Limited evidence, unclear patterns, weak correlation
- **Use**: Investigate further, gather more data
- **Examples**: "Weekend habits are harder" (4/10)

## Database Schema

```sql
CREATE TABLE learning_insights (
    id VARCHAR(50) PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL,
    discord_id VARCHAR(50) NOT NULL,
    insight_type ENUM('pattern', 'solution', 'hurdle', 'success') NOT NULL,
    content TEXT NOT NULL,
    confidence TINYINT NOT NULL,
    tags JSON NOT NULL,
    source_data JSON NOT NULL,
    created_at TIMESTAMP NOT NULL
);
```

## Notion Database Properties

- **ID**: Title (Primary Key)
- **User**: Relation to Users database
- **Discord ID**: Text
- **Insight Type**: Select (pattern, solution, hurdle, success)
- **Content**: Rich Text
- **Confidence**: Number (1-10)
- **Tags**: Multi-select
- **Source Data**: Rich Text (JSON)
- **Created At**: Date
