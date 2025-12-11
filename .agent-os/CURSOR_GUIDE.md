# Agent OS Guide for Cursor

This guide explains how Cursor AI can use the Agent OS files to better understand and code the Discord Habit System.

## How Cursor Uses Agent OS

When you're coding in Cursor, the AI assistant will automatically reference these Agent OS files to:

1. **Understand Architecture**: Read `product/tech-stack.md` and `product/mission.md` to understand the system
2. **Follow Standards**: Apply coding standards from `standards/` folders
3. **Maintain Consistency**: Use patterns defined in standards files
4. **Make Better Decisions**: Reference product context when making architectural choices

## File Structure Reference

```
.agent-os/
├── config.yml                    # Agent OS configuration
├── standards/                    # How to build
│   ├── global/                  # Applies to all code
│   │   ├── naming.md           # Naming conventions
│   │   ├── code-style.md       # Code formatting and style
│   │   ├── best-practices.md   # Core principles
│   │   └── tech-stack.md       # Technology choices
│   ├── backend/                # Backend-specific standards
│   │   ├── typescript.md       # TypeScript patterns
│   │   ├── discord.md          # Discord.js patterns
│   │   ├── notion.md           # Notion API patterns
│   │   └── agents.md           # Multi-agent system patterns
│   └── testing/                # Testing standards
│       └── testing.md          # Test-driven development
├── product/                     # What you're building
│   ├── mission.md              # Product vision
│   ├── roadmap.md              # Feature roadmap
│   └── tech-stack.md           # Technology decisions
└── specs/                       # What to build next
    └── README.md                # Specs documentation
```

## Using Agent OS in Cursor

### When Writing Code

Cursor will automatically reference relevant standards when you:
- Write new functions or classes
- Create new agents
- Integrate with Discord or Notion
- Write tests

### When Making Decisions

Reference these files when:
- Choosing between implementation approaches
- Designing new features
- Refactoring existing code
- Adding new dependencies

### Example Prompts for Cursor

You can explicitly reference Agent OS files:

```
"Create a new agent following the patterns in .agent-os/standards/backend/agents.md"
```

```
"Refactor this function to follow the error handling standards in .agent-os/standards/global/best-practices.md"
```

```
"Add a new Notion integration following .agent-os/standards/backend/notion.md"
```

## Key Standards to Remember

1. **No Mock Data**: Always handle errors properly, never use mock fallbacks
2. **KISS Principle**: Keep it simple, single responsibility
3. **Test-Driven**: Write tests first
4. **Type Safety**: Use TypeScript strictly
5. **Error Handling**: Explicit error handling everywhere

## Updating Agent OS Files

When you update coding practices or architecture:

1. Update the relevant standards file
2. Update product files if vision/roadmap changes
3. Create new specs for planned features
4. Keep files synchronized with actual codebase

## Benefits

Using Agent OS with Cursor ensures:
- ✅ Consistent code style across the project
- ✅ Better architectural decisions
- ✅ Faster development with clear patterns
- ✅ Reduced need for corrections
- ✅ Better understanding of the system

