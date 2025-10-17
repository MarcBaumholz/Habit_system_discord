### Goal
Ensure the `/hurdles` command reliably acknowledges the interaction and avoids Discord "Unknown interaction" errors while posting to the hurdles feed and saving to Notion.

### User Story
- As a user, I can document a hurdle via `/hurdles` so it is saved in Notion and posted to the community feed without errors.

### Current Flow (before fix)
1. User triggers `/hurdles` with options: `name`, `type`, `description`.
2. Handler immediately performs several async operations (Notion reads/writes, channel post) and only then calls `interaction.reply(...)`.
3. If these operations exceed Discord's interaction acknowledgement window or a race condition occurs, Discord returns `DiscordAPIError[10062]: Unknown interaction` when replying.

### Root Cause
- The command did not acknowledge the interaction early. Discord requires an interaction to be acknowledged within a few seconds using `reply`, `deferReply`, or `showModal`. Long-running work (DB calls, channel posts) before acknowledgement risks the interaction becoming invalid, causing `Unknown interaction`.

### Fix
- Acknowledge immediately with `interaction.deferReply({ ephemeral: false })`.
- Replace terminal `interaction.reply(...)` with `interaction.editReply(...)` after work completes.
- Guard error paths: if already deferred/replied, use `editReply` or `followUp` accordingly.

### Minimal Changes
- Only modify `handleHurdles` to use `deferReply` and `editReply`, keeping existing logic intact.

### Test Plan
- Trigger `/hurdles name:"test" type:"Time Management" description:"test"`.
- Expect: no red "App not responding"; one confirmation message; post appears in `#learnings-and-hurdles-feed`.
- Force slower Notion by adding latency (optional) and verify still no `Unknown interaction` because of `deferReply`.

### Notes
- Other commands already use defer/edit patterns in places (`/summary`, mentor, etc.). This change aligns `/hurdles` with that pattern.


