# Agent OS Guide for Claude Cloud / Claude Code

This guide explains how Claude Cloud and Claude Code can use the Agent OS files to better understand and code the Discord Habit System.

## How Claude Uses Agent OS

When working with Claude Cloud or Claude Code, you can reference Agent OS files to provide context about:

1. **System Architecture**: Share `product/tech-stack.md` and `product/mission.md`
2. **Coding Standards**: Reference `standards/` files for consistency
3. **Implementation Patterns**: Use backend standards for specific technologies
4. **Product Context**: Understand goals and roadmap from product files

## Using Agent OS with Claude

### Method 1: Direct File References

When chatting with Claude, you can reference specific files:

```
"Please review .agent-os/standards/backend/discord.md and help me implement a new slash command following those patterns"
```

```
"I need to create a new Notion integration. Please follow the standards in .agent-os/standards/backend/notion.md"
```

### Method 2: Context Injection

For Claude Code, you can include Agent OS files in your context:

1. Open relevant standards files
2. Include product context files
3. Reference them in your prompts

### Method 3: Full Context

For complex tasks, provide full Agent OS context:

```
"I'm working on the Discord Habit System. Here's the architecture:
[Include .agent-os/product/tech-stack.md]

And here are the coding standards:
[Include relevant .agent-os/standards/ files]

Please help me implement [feature] following these guidelines."
```

## Key Files to Reference

### For Architecture Decisions
- `.agent-os/product/mission.md` - Understand the product vision
- `.agent-os/product/tech-stack.md` - Technology choices and rationale
- `.agent-os/product/roadmap.md` - Planned features

### For Coding Standards
- `.agent-os/standards/global/best-practices.md` - Core principles
- `.agent-os/standards/global/naming.md` - Naming conventions
- `.agent-os/standards/backend/typescript.md` - TypeScript patterns
- `.agent-os/standards/backend/discord.md` - Discord.js patterns
- `.agent-os/standards/backend/notion.md` - Notion API patterns
- `.agent-os/standards/backend/agents.md` - Multi-agent patterns

### For Testing
- `.agent-os/standards/testing/testing.md` - Test-driven development

## Example Workflows

### Creating a New Feature

1. **Understand Context**: Reference `product/mission.md` and `product/roadmap.md`
2. **Follow Standards**: Apply relevant standards from `standards/`
3. **Implement**: Use patterns from backend standards
4. **Test**: Follow testing standards

### Refactoring Code

1. **Review Standards**: Check `standards/global/best-practices.md`
2. **Apply Patterns**: Use technology-specific standards
3. **Maintain Consistency**: Follow naming and code style standards

### Adding New Agent

1. **Architecture**: Review `standards/backend/agents.md`
2. **Patterns**: Follow orchestrator and agent patterns
3. **Integration**: Use Notion and AI client standards

## Important Reminders

When working with Claude, emphasize:

1. **No Mock Data**: Always handle errors properly
2. **KISS Principle**: Keep solutions simple
3. **Single Responsibility**: Each function/class has one purpose
4. **Test-Driven**: Write tests first
5. **Type Safety**: Use TypeScript strictly
6. **Error Handling**: Explicit error handling everywhere

## Best Practices

- Reference Agent OS files early in conversations
- Include relevant standards when asking for code
- Update Agent OS files when patterns change
- Keep product context current

## Benefits

Using Agent OS with Claude ensures:
- ✅ Consistent code style
- ✅ Better architectural decisions
- ✅ Faster development
- ✅ Reduced corrections needed
- ✅ Clear understanding of system

