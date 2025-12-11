# Agent OS Test Prompts

Use these prompts to verify that Cursor and Claude are using your Agent OS files.

## Quick Verification Prompts

### 1. Standards Check
```
Can you read .agent-os/standards/global/best-practices.md and tell me 
what the core principles are for this project?
```

**Expected:** Should mention KISS, Single Responsibility, TDD, No Mock Data

### 2. Tech Stack Check
```
What technology stack does this project use? Check 
.agent-os/product/tech-stack.md
```

**Expected:** Should mention Node.js, TypeScript, discord.js v14, Notion API, Perplexity

### 3. Naming Convention Check
```
What are the naming conventions for variables? See 
.agent-os/standards/global/naming.md
```

**Expected:** Should mention camelCase, descriptive names, boolean prefixes

### 4. Error Handling Check
```
How should errors be handled in this project? Check 
.agent-os/standards/global/best-practices.md
```

**Expected:** Should mention explicit error handling, meaningful messages, no mocks

## Pre-Task Verification Prompt

**Use this BEFORE starting any coding task:**

```
Before we start, please confirm you've read these Agent OS files:

1. .agent-os/product/tech-stack.md - Technology stack
2. .agent-os/product/mission.md - Product vision
3. .agent-os/standards/global/best-practices.md - Core principles
4. .agent-os/standards/global/naming.md - Naming conventions
5. .agent-os/standards/backend/typescript.md - TypeScript patterns
6. .agent-os/standards/backend/discord.md - Discord.js patterns
7. .agent-os/standards/backend/notion.md - Notion API patterns

Please summarize:
- What is the tech stack?
- What are the core coding principles?
- What naming conventions should be used?
- How should errors be handled?

Once confirmed, help me [YOUR TASK HERE]
```

## Task-Specific Verification

### For Discord Commands
```
I need to create a new Discord slash command. Please:
1. Review .agent-os/standards/backend/discord.md
2. Review .agent-os/standards/global/naming.md
3. Follow the patterns shown in those files

Create a /test command that follows these standards.
```

### For Notion Integration
```
I need to add a new Notion integration. Please:
1. Review .agent-os/standards/backend/notion.md
2. Review .agent-os/standards/backend/typescript.md
3. Follow error handling from .agent-os/standards/global/best-practices.md

Create a function to query the Users database following these standards.
```

### For New Agent
```
I need to create a new agent. Please:
1. Review .agent-os/standards/backend/agents.md
2. Review .agent-os/product/tech-stack.md (for AI client patterns)
3. Follow the multi-agent architecture patterns

Create a new agent following these standards.
```

## Verification Checklist

After AI responds, check:

- [ ] AI mentions reading the Agent OS files
- [ ] AI references specific standards
- [ ] Code follows naming conventions
- [ ] Error handling matches standards
- [ ] Code structure matches documented patterns
- [ ] AI mentions core principles (KISS, TDD, No Mock Data)

## Red Flags (AI NOT using Agent OS)

If you see:
- ❌ Generic code without project-specific patterns
- ❌ Mock data or fallback values
- ❌ Inconsistent naming
- ❌ No error handling or poor error handling
- ❌ Doesn't mention reading standards files

Then explicitly ask:
```
"Did you read the Agent OS standards files? Please reference 
.agent-os/standards/global/best-practices.md before continuing."
```

## Success Indicators

You'll know Agent OS is working when:
- ✅ AI says "Based on the standards in..."
- ✅ AI references specific files
- ✅ Code matches documented patterns
- ✅ AI mentions core principles
- ✅ Error handling is explicit and proper
- ✅ Naming follows conventions

