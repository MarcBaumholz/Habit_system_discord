# Join, Pause, and Activate Commands - Fix and Testing Plan

## 🎯 Goal
1. Ensure `/join` command sets user status to 'active' in the database (for both new and existing users)
2. Test and verify that `/pause` and `/activate` commands work properly

## 📋 Current State Analysis

### Current Behavior:
- **New users joining**: ✅ Status defaults to 'active' in `createUser()` method (line 38 in `src/notion/client.ts`)
- **Existing users joining**: ❌ Status is NOT updated when they run `/join` again (lines 71-98 in `src/bot/commands.ts` only show welcome message)
- **Pause command**: ✅ Updates status to 'pause' (line 1364 in `src/bot/commands.ts`)
- **Activate command**: ✅ Updates status to 'active' (line 1454 in `src/bot/commands.ts`)

### Issues Identified:
1. **Primary Issue**: When an existing user (who might be paused) runs `/join`, their status is not updated to 'active'
2. **Testing Gap**: Need comprehensive tests for all three commands to verify status updates

---

## 🔧 Implementation Plan

### Step 1: Fix Join Command for Existing Users
**File**: `src/bot/commands.ts`
**Location**: `handleJoin` method, existing user path (lines 71-98)

**Action**: 
- After detecting existing user, check if status is 'pause'
- If paused, update status to 'active' using `this.notion.updateUser()`
- Update welcome message to inform user if status was changed

**Code Changes**:
```typescript
// In handleJoin, when existingUser is found:
if (existingUser) {
  let statusChanged = false;
  
  // If user is paused, activate them
  if (existingUser.status === 'pause') {
    await this.notion.updateUser(existingUser.id, {
      status: 'active'
    });
    statusChanged = true;
    console.log('✅ User status updated from pause to active');
  }
  
  // Update welcome message to reflect status change
  const statusMessage = statusChanged 
    ? `🔄 **Status Updated:** Your account has been reactivated!\n\n`
    : `✅ **Status:** ${existingUser.status || 'active'}\n`;
  
  await interaction.editReply({
    content: `🎉 **Welcome back, ${existingUser.name}!**\n\n` +
             statusMessage +
             // ... rest of message
  });
}
```

### Step 2: Ensure New Users Are Set to Active
**File**: `src/bot/commands.ts` (already working)
**Verification**: Ensure `createUser` explicitly sets status to 'active'

**Action**:
- Verify line 177-184 in `handleJoin` - should pass status: 'active' explicitly
- Or verify default behavior in `createUser` (already defaults to 'active')

### Step 3: Create Comprehensive Tests
**File**: Create or update test file for commands

**Tests Needed**:
1. **Join Command Tests**:
   - New user join sets status to 'active'
   - Existing active user join keeps status 'active'
   - Existing paused user join changes status to 'active' ✅ NEW

2. **Pause Command Tests**:
   - Pause command sets status to 'pause'
   - Pause command requires reason
   - Pause command only works in personal channel
   - Pause command updates Notion database

3. **Activate Command Tests**:
   - Activate command sets status to 'active'
   - Activate command only works in personal channel
   - Activate command updates Notion database

---

## 🧪 Testing Strategy

### Unit Tests
- Mock NotionClient methods
- Test status updates for each command
- Test validation (personal channel, required fields)
- Test error handling

### Integration Tests (Manual)
- Test in Discord with real bot
- Verify status changes in Notion database
- Test edge cases (user doesn't exist, wrong channel, etc.)

---

## 📝 Implementation Steps

1. ✅ Create plan document (this file)
2. ⏳ Update `handleJoin` to activate existing paused users
3. ⏳ Verify new user creation explicitly sets status to 'active'
4. ⏳ Create/update test file for join, pause, activate commands
5. ⏳ Run tests to verify functionality
6. ⏳ Test manually in Discord if possible
7. ⏳ Document changes and test results

---

## 🔍 Files to Modify

1. `src/bot/commands.ts` - Update `handleJoin` method
2. `tests/bot.test.ts` or create `tests/status-commands.test.ts` - Add comprehensive tests

---

## ✅ Success Criteria

- [ ] New users joining get status 'active' in database
- [ ] Existing paused users joining get status updated to 'active'
- [ ] Existing active users joining remain 'active'
- [ ] Pause command correctly sets status to 'pause'
- [ ] Activate command correctly sets status to 'active'
- [ ] All tests pass
- [ ] No regression in existing functionality

---

## 📅 Notes

- Keep changes minimal and focused
- Follow TDD principles - write tests first if possible
- Ensure proper error handling
- Log status changes for debugging
- Verify Notion database schema supports Status field updates

