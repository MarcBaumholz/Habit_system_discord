# Notion Setup Visual Guide

## Database 1: Users
```
┌─────────────────────────────────────────────────────────────┐
│ Users                                                       │
├─────────────────────────────────────────────────────────────┤
│ Discord ID (Title) │ Name │ Timezone │ Best Time │ Trust Count │
├─────────────────────────────────────────────────────────────┤
│ 123456789        │ Marc │ Europe/  │ 09:00     │ 0           │
│                  │      │ Berlin   │           │             │
└─────────────────────────────────────────────────────────────┘
```

**Properties to create:**
- Discord ID → Title
- Name → Rich text  
- Timezone → Rich text
- Best Time → Rich text
- Trust Count → Number

## Database 2: Habits
```
┌─────────────────────────────────────────────────────────────┐
│ Habits                                                      │
├─────────────────────────────────────────────────────────────┤
│ Name │ User │ Domains │ Frequency │ Context │ Difficulty │ ... │
├─────────────────────────────────────────────────────────────┤
│ Daily │ Marc │ Health │ Daily     │ Morning │ Easy       │ ... │
│ Med.  │      │        │           │ 6am     │            │     │
└─────────────────────────────────────────────────────────────┘
```

**Properties to create:**
- Name → Title
- User → Relation (to Users)
- Domains → Multi-select (Health, Spirituality, Intellectual, Finance, Career, Adventure, Relationships, Emotions)
- Frequency → Rich text
- Context → Rich text
- Difficulty → Rich text
- SMART Goal → Rich text
- Why → Rich text
- Minimal Dose → Rich text
- Habit Loop → Rich text
- Implementation Intentions → Rich text
- Hurdles → Rich text
- Reminder Type → Rich text

## Database 3: Proofs
```
┌─────────────────────────────────────────────────────────────┐
│ Proofs                                                      │
├─────────────────────────────────────────────────────────────┤
│ User │ Habit │ Date │ Unit │ Note │ Attachment │ Min │ Cheat │
├─────────────────────────────────────────────────────────────┤
│ Marc │ Daily │ 2025-│ 30min│ Good │ https://... │ ✓   │      │
│      │ Med.  │ 01-15│      │ day  │            │     │      │
└─────────────────────────────────────────────────────────────┘
```

**Properties to create:**
- User → Relation (to Users)
- Habit → Relation (to Habits)
- Date → Date
- Unit → Rich text
- Note → Rich text
- Attachment URL → URL
- Is Minimal Dose → Checkbox
- Is Cheat Day → Checkbox

## Database 4: Learnings
```
┌─────────────────────────────────────────────────────────────┐
│ Learnings                                                    │
├─────────────────────────────────────────────────────────────┤
│ User │ Habit │ Text │ Created At │
├─────────────────────────────────────────────────────────────┤
│ Marc │ Daily │ "I   │ 2025-01-15 │
│      │ Med.  │ found│            │
│      │       │ that │            │
└─────────────────────────────────────────────────────────────┘
```

**Properties to create:**
- User → Relation (to Users)
- Habit → Relation (to Habits)
- Text → Rich text
- Created At → Date

## Database 5: Weeks
```
┌─────────────────────────────────────────────────────────────┐
│ Weeks                                                       │
├─────────────────────────────────────────────────────────────┤
│ User │ Week Num │ Start Date │ Summary │ Score │
├─────────────────────────────────────────────────────────────┤
│ Marc │ 1        │ 2025-01-15 │ "Great  │ 85    │
│      │          │            │ week!"  │       │
└─────────────────────────────────────────────────────────────┘
```

**Properties to create:**
- User → Relation (to Users)
- Week Num → Number
- Start Date → Date
- Summary → Rich text
- Score → Number

## Database 6: Groups
```
┌─────────────────────────────────────────────────────────────┐
│ Groups                                                      │
├─────────────────────────────────────────────────────────────┤
│ Name │ Channel ID │ Donation Pool │
├─────────────────────────────────────────────────────────────┤
│ Accountability │ 1420295931689173002 │ 50 │
│ Group 1        │                    │    │
└─────────────────────────────────────────────────────────────┘
```

**Properties to create:**
- Name → Title
- Channel ID → Rich text
- Donation Pool → Number

## Quick Setup Checklist

- [ ] Create 6 databases with exact names
- [ ] Add all properties with exact names and types
- [ ] Connect Relations properly
- [ ] Share each database with your integration
- [ ] Copy database IDs to .env file
- [ ] Test with `/join` command