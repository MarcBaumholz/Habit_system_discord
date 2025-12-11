# Agent OS for Discord Habit System

This folder contains the Agent OS configuration and context files that guide AI coding agents (Cursor, Cloud, Claude Code, etc.) to build and maintain the Discord Habit System according to your standards, architecture, and best practices.

## Structure

```
.agent-os/
├── config.yml              # Agent OS configuration
├── standards/              # Layer 1: How you build
│   ├── backend/           # Backend/Node.js standards
│   ├── frontend/          # Frontend standards (if applicable)
│   ├── global/           # Global coding standards
│   └── testing/          # Testing standards
├── product/               # Layer 2: What you're building and why
│   ├── mission.md        # Product vision and mission
│   ├── roadmap.md        # Feature roadmap
│   └── tech-stack.md     # Technology choices and rationale
└── specs/                 # Layer 3: What to build next
    └── README.md         # Specs documentation
```

## 3-Layer Context System

### Layer 1: Standards
**How you build** - Coding conventions, patterns, and best practices that ensure consistency across the codebase.

### Layer 2: Product
**What you're building and why** - Mission, vision, target users, and roadmap that inform strategic decisions.

### Layer 3: Specs
**What to build next** - Detailed feature specifications with implementation details, task breakdowns, and verification criteria.

## ⚠️ IMPORTANT: Always Verify First!

**Before starting any coding task, verify that AI is using Agent OS:**

### Quick Verification Test

Copy this prompt into Cursor or Claude:

```
"Please read .agent-os/standards/global/best-practices.md and tell me:
1. What are the core principles?
2. What is the rule about mock data?
3. How should errors be handled?
```

**Expected:** AI should mention KISS, TDD, Single Responsibility, and "No Mock Data"

### Full Verification Guide

See **`START_HERE.md`** for complete verification workflow and **`VERIFICATION.md`** for detailed testing.

### Standard Workflow

When working with AI coding agents (Cursor, Cloud, Claude Code):

1. **Verify** AI has read Agent OS files (use test prompts)
2. **Standards** are applied based on the task context
3. **Product** context informs architectural and design decisions
4. **Specs** provide detailed implementation guidance for new features

**Remember:** AI won't automatically use Agent OS - you must reference the files explicitly!

## Updating

- **Standards**: Update files in `standards/` folders as your coding practices evolve
- **Product**: Update `product/` files when vision or roadmap changes
- **Specs**: Create new spec files in `specs/` for each new feature

## Compatibility

This Agent OS setup works with:
- ✅ Cursor
- ✅ Claude Code / Cloud
- ✅ Any AI coding tool that can read markdown files

The agents will automatically reference these files when making coding decisions, ensuring consistency with your architecture and standards.

