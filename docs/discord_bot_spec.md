# Discord Bot Specification

## Permissions
- Minimal required: read/send messages, manage messages in dedicated channels, add reactions, read attachments, scheduled events

## Channels
- `#info_channel` for rules and onboarding
- Private `#personal-<name>` for DMs-like flow if needed
- Group channels (e.g., `#accountability-group-1`)

## Commands (slash)
- `/join` — onboard to a challenge; links Notion record
- `/habit add` — register a keystone habit
- `/proof` — submit daily proof (attachment + unit + optional note + habit)
- `/summary [week]` — show personal or group summary
- `/learnings add` — post a learning item
- `/trust @user` — trust acknowledgement
- `/schedule` — list upcoming calls

## Events
- Daily reminder (per user best-time)
- Weekly summaries (group + personal)
- Reaction added (map to trust/acknowledge)

## Flows
- Proof intake → validate → store → post short confirmation → update streaks → trigger reactions
- Missed day detection → donation reminder
- Learnings feed aggregation → Notion sync
