# Agent OS Verification Guide

This guide helps you verify that Cursor and Claude are actually using your Agent OS files before starting work.

## Quick Verification Test

### Test 1: Ask About Standards

**Prompt for Cursor/Claude:**
```
"Can you show me the naming conventions for variables in this project? 
Reference .agent-os/standards/global/naming.md"
```

**Expected Response:**
- Should mention camelCase for variables
- Should mention prefixing booleans with `is`, `has`, `should`
- Should reference the naming.md file

### Test 2: Ask About Architecture

**Prompt:**
```
"What is the tech stack for this Discord Habit System? 
Check .agent-os/product/tech-stack.md"
```

**Expected Response:**
- Should mention Node.js, TypeScript, discord.js v14
- Should mention Notion API, Perplexity Sonar
- Should reference the tech-stack.md file

### Test 3: Ask About Best Practices

**Prompt:**
```
"What are the core principles for this project? 
See .agent-os/standards/global/best-practices.md"
```

**Expected Response:**
- Should mention KISS, Single Responsibility, TDD
- Should emphasize "No Mock Data"
- Should reference the best-practices.md file

## Explicit Reference Method

### For Cursor

**Before starting any task, use this prompt:**

```
"I'm working on the Discord Habit System. Please review these Agent OS files 
to understand the architecture and standards:

1. Architecture: .agent-os/product/tech-stack.md
2. Mission: .agent-os/product/mission.md
3. Standards: .agent-os/standards/global/best-practices.md
4. TypeScript: .agent-os/standards/backend/typescript.md
5. Discord: .agent-os/standards/backend/discord.md
6. Notion: .agent-os/standards/backend/notion.md

Now help me [YOUR TASK HERE] following these standards."
```

### For Claude Cloud/Code

**Copy and paste this at the start of your conversation:**

```
I'm working on the Discord Habit System. Here's the system architecture and 
coding standards from Agent OS:

[Include content from .agent-os/product/tech-stack.md]
[Include content from .agent-os/standards/global/best-practices.md]
[Include relevant standards files for your task]

Please use these standards when helping me code.
```

## Verification Checklist

Before starting any coding task, verify:

- [ ] AI mentions reading Agent OS files
- [ ] AI references specific standards (naming, error handling, etc.)
- [ ] AI understands the tech stack (TypeScript, discord.js, Notion)
- [ ] AI mentions core principles (KISS, TDD, No Mock Data)
- [ ] AI follows the patterns from standards files

## How to Force Agent OS Usage

### Method 1: Explicit File References

Always start prompts with:
```
"Reference .agent-os/standards/[relevant-file].md before proceeding"
```

### Method 2: Include File Contents

For Claude Cloud, you can copy-paste relevant standards:
```
"Here are the coding standards I want you to follow:
[Paste content from standards file]"
```

### Method 3: Context Window

In Cursor, open Agent OS files in your editor before asking questions. Cursor will see open files.

## Test Prompts

### Test Prompt 1: Naming Convention
```
"Create a function to get user habits. Follow naming conventions from 
.agent-os/standards/global/naming.md"
```

**Verify:** Function name should be `getUserHabits` (camelCase, descriptive)

### Test Prompt 2: Error Handling
```
"Create a function to create a habit in Notion. Follow error handling 
standards from .agent-os/standards/backend/notion.md"
```

**Verify:** Should have try/catch, meaningful error messages, no mock data

### Test Prompt 3: TypeScript Patterns
```
"Create a new agent class. Follow patterns from 
.agent-os/standards/backend/agents.md"
```

**Verify:** Should extend BaseAgent, use interfaces, proper typing

## Signs Agent OS is Working

✅ AI references specific standards files
✅ Code follows naming conventions
✅ Error handling matches standards
✅ Architecture decisions align with tech-stack.md
✅ AI mentions core principles (KISS, TDD, etc.)
✅ Code structure matches documented patterns

## Signs Agent OS is NOT Working

❌ AI doesn't mention standards files
❌ Code doesn't follow naming conventions
❌ Error handling uses mocks or fallbacks
❌ Architecture decisions don't match tech-stack.md
❌ AI doesn't mention core principles
❌ Code structure doesn't match patterns

## Troubleshooting

### If Cursor isn't using Agent OS:

1. **Explicitly reference files:**
   ```
   "Read .agent-os/standards/global/best-practices.md first"
   ```

2. **Open files in editor** - Cursor sees open files

3. **Use @ mentions:**
   ```
   "@.agent-os/standards/backend/typescript.md create a function..."
   ```

### If Claude isn't using Agent OS:

1. **Copy-paste standards** into the conversation

2. **Reference files explicitly:**
   ```
   "Check .agent-os/product/tech-stack.md for tech stack"
   ```

3. **Start conversation with context:**
   ```
   "I'm working on Discord Habit System. Here are the standards: [paste]"
   ```

## Best Practice: Always Verify First

Before starting any significant task:

1. Ask AI to confirm it read Agent OS files
2. Ask AI to summarize key standards
3. Ask AI to confirm understanding of tech stack
4. Then proceed with your task

This ensures AI has the right context before coding.

