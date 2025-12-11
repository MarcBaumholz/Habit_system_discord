# ✅ How to Verify Agent OS is Being Used

## The Problem

**AI assistants (Cursor/Claude) won't automatically use Agent OS files.** You must explicitly reference them and verify they're being used.

## Solution: Always Verify First

### Step 1: Quick Test (30 seconds)

**Copy this prompt into Cursor or Claude:**

```
Please read .agent-os/standards/global/best-practices.md and tell me:
1. What are the core principles?
2. What is the "No Mock Data" rule?
3. How should errors be handled?

Confirm you've read the file.
```

**✅ Good Response:**
- Mentions KISS, Single Responsibility, TDD
- Emphasizes "No Mock Data"
- References explicit error handling
- Confirms reading the file

**❌ Bad Response:**
- Generic answers
- Doesn't mention specific principles
- Doesn't confirm reading the file

### Step 2: If Test Fails

**Force AI to read files:**

```
Before helping me code, you MUST read these files:

1. .agent-os/product/tech-stack.md
2. .agent-os/standards/global/best-practices.md
3. .agent-os/standards/global/naming.md

Tell me what you learned from each file, then we'll proceed.
```

## Before Every Coding Session

### Standard Pre-Coding Prompt

**Copy this and customize:**

```
I'm working on the Discord Habit System. Before we start, please:

1. Read .agent-os/product/tech-stack.md
2. Read .agent-os/standards/global/best-practices.md
3. Read .agent-os/standards/global/naming.md
4. Read .agent-os/standards/backend/typescript.md

Please confirm you've read these files and summarize:
- Tech stack
- Core principles
- Naming conventions
- TypeScript patterns

Once confirmed, help me [YOUR TASK HERE]
```

## Verification Checklist

After AI responds, check:

- [ ] AI mentions reading specific files
- [ ] AI references standards by name
- [ ] AI confirms understanding
- [ ] AI summarizes key points
- [ ] AI mentions core principles (KISS, TDD, No Mock Data)

## During Coding

### Reference Standards Explicitly

```
"Follow .agent-os/standards/backend/discord.md for this command"
```

```
"Use naming conventions from .agent-os/standards/global/naming.md"
```

```
"Error handling should follow .agent-os/standards/global/best-practices.md"
```

### Check AI is Following Standards

```
"Does this code follow .agent-os/standards/backend/typescript.md?"
```

```
"Verify this matches .agent-os/standards/global/naming.md"
```

## Signs Agent OS is Working ✅

- AI says "Based on the standards in..."
- AI references specific files
- Code follows naming conventions
- Error handling is explicit (no mocks)
- Code structure matches patterns
- AI mentions core principles

## Signs Agent OS is NOT Working ❌

- Generic code without project patterns
- Mock data or fallback values
- Inconsistent naming
- Poor error handling
- Doesn't mention reading files

## Cursor-Specific Tips

1. **Open Agent OS files** in editor tabs
2. **Use @ mentions:**
   ```
   "@.agent-os/standards/backend/typescript.md create..."
   ```
3. **Reference in prompts:**
   ```
   "Read .agent-os/standards/backend/discord.md first"
   ```

## Claude-Specific Tips

1. **Copy-paste standards** into conversation
2. **Reference files explicitly**
3. **Start with context:**
   ```
   "Here are my standards: [paste content]"
   ```

## Quick Reference Files

**Most Important:**
- `.agent-os/standards/global/best-practices.md` - Core principles
- `.agent-os/product/tech-stack.md` - Tech stack
- `.agent-os/standards/global/naming.md` - Naming

**For Specific Tasks:**
- Discord: `.agent-os/standards/backend/discord.md`
- Notion: `.agent-os/standards/backend/notion.md`
- Agents: `.agent-os/standards/backend/agents.md`
- Testing: `.agent-os/standards/testing/testing.md`

## Remember

**Agent OS only works if you:**
1. ✅ Explicitly reference files
2. ✅ Verify AI read them
3. ✅ Check code matches standards
4. ✅ Correct AI when it doesn't follow standards

**Don't assume - always verify!**

## Quick Test Prompts

### Test 1: Standards
```
"Read .agent-os/standards/global/best-practices.md - what are the core principles?"
```

### Test 2: Tech Stack
```
"Check .agent-os/product/tech-stack.md - what LLM does this project use?"
```

### Test 3: Naming
```
"See .agent-os/standards/global/naming.md - how should booleans be named?"
```

**Expected answers:**
1. KISS, Single Responsibility, TDD, No Mock Data
2. Perplexity Sonar
3. Prefix with `is`, `has`, `should`, `can`, `will`

---

**Start every coding session with verification!**

