# Identity Analysis Database (Mock Data)

## Table: Identity Analysis

| ID | User ID | Discord ID | Personality Score | Habit Alignment Score | Identity Evolution Stage | Recommended Habits | Identity Insights | Created At |
|----|---------|------------|-------------------|----------------------|------------------------|-------------------|------------------|------------|
| identity_001 | user_001 | 1422681618304471131 | 8.5 | 7.2 | Developing | Morning meditation, Journaling, Reading | High conscientiousness aligns well with structured habits. Consider identity-based habit formation focusing on "I am a person who..." | 2025-10-13T10:00:00Z |
| identity_002 | user_001 | 1422681618304471131 | 8.5 | 8.1 | Evolving | Exercise, Learning, Creative projects | Strong growth mindset detected. Identity evolution shows progression from external motivation to internal values. | 2025-10-12T15:30:00Z |
| identity_003 | user_001 | 1422681618304471131 | 8.5 | 9.2 | Mature | Advanced habit stacking, Leadership habits | Identity fully aligned with habits. Ready for complex habit systems and leadership roles. | 2025-10-11T09:15:00Z |

## Sample Analysis Results

### Identity Analysis #1
- **Personality Type**: INTJ (Architect)
- **Core Values**: Growth, Knowledge, Independence
- **Life Vision**: Become a thought leader in habit formation
- **Desired Identity**: "I am a disciplined, growth-oriented person"
- **Habit Alignment**: 7.2/10
- **Recommendations**:
  1. Morning meditation (aligns with introspective nature)
  2. Journaling (leverages analytical thinking)
  3. Reading (feeds knowledge-seeking trait)
  4. Strategic planning (uses natural INTJ strengths)

### Identity Analysis #2
- **Evolution Stage**: Evolving
- **Key Insights**: 
  - Strong internal motivation developing
  - Values-based decision making emerging
  - Identity becoming more stable
- **Next Steps**: Focus on identity-based habit formation

### Identity Analysis #3
- **Evolution Stage**: Mature
- **Advanced Capabilities**:
  - Complex habit stacking
  - Leadership habit development
  - Mentoring others
- **Identity Statement**: "I am a person who consistently grows and helps others grow"

## Database Schema

```sql
CREATE TABLE identity_analysis (
    id VARCHAR(50) PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL,
    discord_id VARCHAR(50) NOT NULL,
    personality_score DECIMAL(3,1) NOT NULL,
    habit_alignment_score DECIMAL(3,1) NOT NULL,
    identity_evolution_stage VARCHAR(50) NOT NULL,
    recommended_habits TEXT NOT NULL,
    identity_insights TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL
);
```

## Notion Database Properties

- **ID**: Title (Primary Key)
- **User**: Relation to Users database
- **Discord ID**: Text
- **Personality Score**: Number (1-10)
- **Habit Alignment Score**: Number (1-10)
- **Identity Evolution Stage**: Select (Developing, Evolving, Mature)
- **Recommended Habits**: Multi-line Text
- **Identity Insights**: Rich Text
- **Created At**: Date
