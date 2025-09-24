# Notion Integration

## Databases
- Users: discord_id, name, timezone, best_time, trust_count
- Habits: user_id, name, domains[], frequency, context, difficulty, smart_goal, why, minimal_dose, habit_loop, impl_intentions, hurdles, reminder_type
- Proofs: user_id, habit_id, date, unit, note, attachment_url, is_minimal_dose, cheatday
- Learnings: user_id, habit_id, text, created_at
- Weeks: user_id, week_num, start_date, summary, score
- Groups: name, channel_id, donation_pool

## Sync
- One-way from Discord to Notion for events
- Periodic pull for templates (weekly, forms)

## Forms Mapping
- Map each Notion form field to Habit properties

## Security
- Use Notion integration token via environment; no tokens in repo
