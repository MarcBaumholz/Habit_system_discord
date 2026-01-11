# Archive of Old/Unused Code

**Archived Date:** 2025-12-29
**Archived By:** Code cleanup and organization
**Reason:** These files are not used in the production Docker container

---

## What's in This Archive

### tests/ Folder
Contains 41+ old test and debug scripts that were used during development but are not part of the production system.

**Test Scripts:**
- Agent testing: `test-agent-system.js`, `test_agents*.js`, `test-ai-*.js`
- Buddy system tests: `test-buddy-*.ts/js`
- Challenge tests: `test-challenge-*.js/ts`
- Feature tests: `test-join-command.js`, `test-automatic-proofing.js`, etc.
- Database tests: `check-notion-*.js/ts`
- Debug scripts: `debug-bot*.js`
- Utility scripts: `send-startup-message.js`, `get-channel-id.js`

**Why Archived:**
- These were one-time testing scripts
- Functionality is now covered by the production system
- Not included in Docker container (excluded by .dockerignore)

### old_agents/ Folder

**money_agent/**
- Old Python-based money/accountability agent
- **Replaced by:** `src/agents/accountability/accountability_money_agent.ts`
- **Status:** Fully superseded by TypeScript implementation
- **Why Archived:** TypeScript version has all features + better integration

### mock_data/ Folder
- Mock data files used for testing
- Not used in production
- Not deployed to Docker container

---

## Important Notes

### These Files Are Safe to Delete
All archived files are:
1. Not used in production
2. Not imported by any active code
3. Not deployed to Docker container
4. Superseded by newer implementations

### How to Restore
If you need to restore any file:
```bash
# From the _ARCHIVE_OLD_CODE folder, copy back to root
cp _ARCHIVE_OLD_CODE/tests/test-buddy-system.ts ./
```

### Production Code Location
All active production code is in:
- `src/` - TypeScript source code (compiled to `dist/`)
- `python-agents/` - Active Python CrewAI agents
- See `_CODE_ANALYSIS.md` for complete breakdown

---

## Archive Contents

### Tests (41 files)
```
test-agent-system.js
test_agents.js
test_agents_simple.js
test_agents_mock.js
test-ai-analysis.js
test-ai-fixed.js
test-ai-incentive-system.js
test-marc-buddy-discord.ts
test-marc-full-analysis.ts
test-marc-discord-simple.ts
test-buddy-summary.ts
test-buddy-message.ts
test-buddy-message.js
test-buddy-system.ts
test-buddy-system-complete.ts
test-buddy-nickname-matching.ts
test-challenge-system.js
test-challenge-flow.ts
test-poll-reactions.ts
test-join-command.js
test-automatic-proofing.js
test-proof-matching.js
test-minimal-dose-logic.js
test-learning.js
test-learning-simple.js
test-hurdles.js
test-profile-edit.ts
test-personality-db-save.ts
test-weekly-agents.ts
test-bot-functionality.js
test-bot-status.js
test-messages.js
debug-bot.js
debug-bot-enhanced.js
test-connections.js
test-logging-system.js
test-docker-setup.js
check-notion-databases.js
check-notion-structure.js
check-personality-db-schema.ts
send-startup-message.js
get-channel-id.js
demo-ai-tool-matching.ts
```

### Old Agents
```
money_agent/ - Superseded by TypeScript implementation
```

### Mock Data
```
mock_data/ - Testing data, not used in production
```

---

## Last Update
2025-12-29 - Initial archive creation
