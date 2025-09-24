# Data Model

## Entities
- User
- Habit
- Proof
- Learning
- Week
- Group

## Relationships
- User 1—N Habit
- Habit 1—N Proof
- Habit 1—N Learning
- User 1—N Week
- Group 1—N User (membership)

## Derived Fields
- Streaks (per habit)
- Trust score (sum of acknowledgements)
- Week score (calculated from proofs, misses, minimal doses)
