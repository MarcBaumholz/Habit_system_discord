# Personal AI Assistant Optimization - Implementation Plan

## 🎯 Goal
Optimize the Personal AI Assistant to use current week data (Monday-Sunday) instead of last 7 days, ensure user-specific data only, and fix performance issues.

## 📋 Changes to Implement

### 1. **Fix Date Range: Last 7 Days → Current Week**
   - **Problem**: Currently uses rolling 7-day window
   - **Solution**: Calculate Monday-Sunday of current week
   - **File**: `src/bot/personal-assistant.ts`
   - **Method**: `getRecentProofs()` → rename to `getCurrentWeekProofs()`

### 2. **Fix Inefficient Habit Enrichment**
   - **Problem**: Fetches all habits for EVERY proof (N+1 query issue)
   - **Solution**: Fetch habits once, create lookup map
   - **File**: `src/bot/personal-assistant.ts`
   - **Method**: `getRecentProofs()` → optimize enrichment logic

### 3. **Update Context Formatting**
   - **Problem**: Still says "Last 7 days" in context
   - **Solution**: Update to "This Week (Monday-Sunday)"
   - **File**: `src/ai/perplexity-client.ts`
   - **Method**: `buildUserContext()`

### 4. **Add Data Validation**
   - Verify proofs have valid habitIds
   - Validate date ranges
   - Log warnings for missing data

### 5. **Improve Date Formatting**
   - Format dates in more readable way for AI
   - Include day names (Monday, Tuesday, etc.)

## ✅ Verification Checklist
- [x] Only retrieves data for specific user (userId parameter)
- [x] Uses current week (Monday-Sunday) instead of last 7 days
- [x] Efficient habit enrichment (single query)
- [x] Better context formatting
- [x] Docker container builds and runs

## 🚀 Deployment Steps
1. ✅ Implement code changes
2. ✅ Build Docker container
3. ✅ Restart container
4. ✅ Bot is live and connected to Discord

## ✅ Implementation Complete

### Changes Implemented:

1. **Fixed Date Range: Current Week (Monday-Sunday)**
   - Changed from "last 7 days" to current week calculation
   - Calculates Monday and Sunday of current week dynamically
   - Works correctly regardless of which day of the week it is

2. **Fixed Inefficient Habit Enrichment**
   - **Before**: Fetched all habits for EVERY proof (N+1 query problem)
   - **After**: Fetches habits once, creates lookup Map for O(1) access
   - **Performance**: Reduced from O(N*M) to O(N+M) where N=proofs, M=habits

3. **Improved Context Formatting**
   - Changed "Recent Activity (Last 7 days)" → "This Week's Activity (Monday-Sunday)"
   - Groups proofs by habit for better organization
   - Shows formatted dates (e.g., "Monday, November 1")
   - Includes minimal dose and cheat day indicators

4. **Added Data Validation**
   - Logs warnings when proofs have unknown habit IDs
   - Validates date ranges before querying
   - Better error handling with specific error messages

5. **User-Specific Data Only**
   - Verified: All queries use `userId` parameter
   - `getProofsByUserId(userId, startDate, endDate)` - user-specific
   - `getHabitsByUserId(userId)` - user-specific
   - No cross-user data leakage

### Files Modified:
- `src/bot/personal-assistant.ts`
  - Replaced `getRecentProofs()` with `getCurrentWeekProofs()`
  - Optimized habit enrichment with lookup map
  - Added date formatting and validation
  
- `src/ai/perplexity-client.ts`
  - Updated context formatting for "This Week"
  - Grouped proofs by habit
  - Improved date display format

### Docker Container:
- ✅ Built successfully
- ✅ Running and connected to Discord
- ✅ Bot logged in as: Habit System#5492

## 🧪 Testing Instructions

1. Go to your personal Discord channel
2. Ask a question like: "What are my habits and how often did I do them this week?"
3. The AI should now:
   - Show only your current week's data (Monday-Sunday)
   - Group proofs by habit
   - Use formatted dates
   - Provide accurate counts for the current week

## 📊 Performance Improvements

- **Query Efficiency**: Reduced habit queries from N (per proof) to 1 (total)
- **Data Accuracy**: Uses proper week boundaries instead of rolling 7-day window
- **User Experience**: Better formatted, organized context for AI responses

