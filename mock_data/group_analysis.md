# Group Analysis Database (Mock Data)

## Table: Group Analysis

| ID | Group ID | User ID | Discord ID | Compatibility Score | Influence Level | Group Dynamics | Recommendations | Created At |
|----|----------|---------|------------|-------------------|-----------------|----------------|-----------------|------------|
| group_001 | group_001 | user_001 | 1422681618304471131 | 8.5 | high | Strong leadership role, helps motivate others | Take on mentoring role, organize group challenges | 2025-10-13T14:00:00Z |
| group_002 | group_001 | user_001 | 1422681618304471131 | 7.8 | medium | Good contributor, reliable accountability partner | Focus on peer support, share progress regularly | 2025-10-12T10:30:00Z |
| group_003 | group_002 | user_001 | 1422681618304471131 | 6.2 | low | New to group, learning social dynamics | Start with observation, gradually increase participation | 2025-10-11T16:45:00Z |

## Sample Analysis Results

### Group Analysis #1 - Leadership Group
- **Group**: "Morning Warriors" (Exercise Accountability)
- **Compatibility Score**: 8.5/10
- **Influence Level**: High
- **Group Dynamics**: 
  - Strong leadership role established
  - Others look to you for motivation
  - You help set group standards
  - High trust and respect from peers
- **Recommendations**:
  1. Take on mentoring role for new members
  2. Organize group challenges and competitions
  3. Share advanced strategies and insights
  4. Lead group reflection sessions

### Group Analysis #2 - Peer Support Group
- **Group**: "Habit Buddies" (General Accountability)
- **Compatibility Score**: 7.8/10
- **Influence Level**: Medium
- **Group Dynamics**:
  - Good contributor to discussions
  - Reliable accountability partner
  - Balanced give-and-take relationship
  - Respected for consistency
- **Recommendations**:
  1. Focus on peer support and encouragement
  2. Share progress updates regularly
  3. Ask for help when struggling
  4. Celebrate others' successes

### Group Analysis #3 - Learning Group
- **Group**: "Habit Learners" (New to Habit Formation)
- **Compatibility Score**: 6.2/10
- **Influence Level**: Low
- **Group Dynamics**:
  - New to group, still learning
  - Observing social dynamics
  - Building relationships slowly
  - Learning from others' experiences
- **Recommendations**:
  1. Start with observation and learning
  2. Gradually increase participation
  3. Ask questions and seek guidance
  4. Share your learning journey

## Group Dynamics Patterns

### High Compatibility (8.0+)
- **Characteristics**: Strong alignment with group values and goals
- **Role**: Natural leader or key contributor
- **Impact**: Significant positive influence on group
- **Strategy**: Leverage influence for group benefit

### Medium Compatibility (6.0-7.9)
- **Characteristics**: Good fit with some areas for growth
- **Role**: Reliable team member
- **Impact**: Steady positive contribution
- **Strategy**: Focus on consistent participation

### Low Compatibility (Below 6.0)
- **Characteristics**: Mismatch with group dynamics or goals
- **Role**: Observer or learner
- **Impact**: Limited influence, learning phase
- **Strategy**: Focus on learning and gradual integration

## Influence Level Definitions

### High Influence
- **Characteristics**: Others look to you for guidance
- **Responsibilities**: Set examples, help others, lead initiatives
- **Opportunities**: Mentoring, leadership, group organization
- **Impact**: Significant positive effect on group culture

### Medium Influence
- **Characteristics**: Respected contributor
- **Responsibilities**: Regular participation, peer support
- **Opportunities**: Collaboration, mutual support
- **Impact**: Steady positive contribution

### Low Influence
- **Characteristics**: Learning and observing
- **Responsibilities**: Active listening, gradual participation
- **Opportunities**: Learning, relationship building
- **Impact**: Personal growth and group learning

## Database Schema

```sql
CREATE TABLE group_analysis (
    id VARCHAR(50) PRIMARY KEY,
    group_id VARCHAR(50) NOT NULL,
    user_id VARCHAR(50) NOT NULL,
    discord_id VARCHAR(50) NOT NULL,
    compatibility_score DECIMAL(3,1) NOT NULL,
    influence_level ENUM('high', 'medium', 'low') NOT NULL,
    group_dynamics TEXT NOT NULL,
    recommendations TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL
);
```

## Notion Database Properties

- **ID**: Title (Primary Key)
- **Group**: Relation to Groups database
- **User**: Relation to Users database
- **Discord ID**: Text
- **Compatibility Score**: Number (1-10)
- **Influence Level**: Select (high, medium, low)
- **Group Dynamics**: Rich Text
- **Recommendations**: Multi-line Text
- **Created At**: Date
