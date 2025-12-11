# 🚀 Start Here - Agent OS Usage Guide

**Before you start coding, read this!**

## Quick Start: Verify Agent OS is Active

### Step 1: Test Prompt (Copy & Paste)

**For Cursor or Claude:**

```
Please read .agent-os/standards/global/best-practices.md and tell me:
1. What are the core principles?
2. How should errors be handled?
3. What is the "No Mock Data" rule?
```

**Expected Response:**
- Should mention: KISS, Single Responsibility, TDD
- Should emphasize: Explicit error handling, no mock fallbacks
- Should reference the file you asked about

### Step 2: If AI Doesn't Reference Files

**Explicitly tell AI to read files:**

```
Before helping me code, please read these Agent OS files:

1. .agent-os/product/tech-stack.md
2. .agent-os/standards/global/best-practices.md
3. .agent-os/standards/global/naming.md
4. .agent-os/standards/backend/typescript.md

Confirm you've read them, then help me [YOUR TASK].
```

## Standard Workflow

### Before Every Coding Session

1. **Start with verification prompt** (see above)
2. **Wait for AI confirmation** it read the files
3. **Ask AI to summarize** key standards
4. **Then proceed** with your task

### During Coding

- **Reference standards explicitly:**
  ```
  "Follow .agent-os/standards/backend/discord.md for this command"
  ```

- **Check AI is following standards:**
  ```
  "Does this code follow .agent-os/standards/global/naming.md?"
  ```

### After Coding

- **Verify code matches standards**
- **Check error handling** (no mocks!)
- **Verify naming conventions**
- **Confirm architecture matches tech-stack.md**

## Cursor-Specific Tips

1. **Open Agent OS files** in editor tabs before coding
2. **Use @ mentions:**
   ```
   "@.agent-os/standards/backend/typescript.md create a function..."
   ```
3. **Reference files in prompts:**
   ```
   "Read .agent-os/standards/backend/discord.md first"
   ```

## Claude-Specific Tips

1. **Copy-paste standards** into conversation at start
2. **Reference files explicitly** in prompts
3. **Start conversation with context:**
   ```
   "Here are my coding standards: [paste from standards file]"
   ```

## Quick Reference

### Most Important Files

1. **`.agent-os/standards/global/best-practices.md`** - Core principles
2. **`.agent-os/product/tech-stack.md`** - Technology choices
3. **`.agent-os/standards/global/naming.md`** - Naming conventions
4. **`.agent-os/standards/backend/typescript.md`** - TypeScript patterns

### Key Principles to Remember

- ✅ **KISS** - Keep It Simple
- ✅ **Single Responsibility** - One purpose per function/class
- ✅ **TDD** - Test-Driven Development
- ✅ **No Mock Data** - Always handle errors properly
- ✅ **Type Safety** - Use TypeScript strictly

## Troubleshooting

### AI Not Using Standards?

**Force it:**
```
"Please read .agent-os/standards/global/best-practices.md 
RIGHT NOW before continuing. I need you to follow these standards."
```

### AI Using Mock Data?

**Stop and correct:**
```
"Stop! The standards in .agent-os/standards/global/best-practices.md 
say NO MOCK DATA. Please handle errors properly instead."
```

### AI Not Following Naming?

**Reference explicitly:**
```
"This doesn't follow .agent-os/standards/global/naming.md. 
Please use camelCase and descriptive names."
```

## Success Checklist

Before accepting AI-generated code, verify:

- [ ] AI mentioned reading standards files
- [ ] Code follows naming conventions
- [ ] Error handling is explicit (no mocks)
- [ ] Code structure matches documented patterns
- [ ] TypeScript types are used properly
- [ ] Core principles are followed (KISS, TDD, etc.)

## Remember

**Agent OS only works if you:**
1. ✅ Reference the files explicitly
2. ✅ Verify AI read them
3. ✅ Check code matches standards
4. ✅ Correct AI when it doesn't follow standards

**Don't assume AI will automatically use Agent OS!**
**Always verify first, then proceed.**

---

**Next Steps:**
1. Run the test prompt above
2. Verify AI response
3. Start coding with confidence!

