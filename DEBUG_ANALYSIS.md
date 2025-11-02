# 🐛 Debug Analysis - Proof Detection Issues

## 📊 **Issues Identified**

### **Issue 1: Jonas's "reading" habit not detected**
- **Problem**: Jonas's message "Proof lesen 15 Minuten (Reading)" with image is not being detected as proof
- **Error Message**: "I could not match this proof to one of your habits"
- **Root Cause**: The system is incorrectly classifying Jonas's messages as webhook messages instead of regular proof messages

### **Issue 2: Automatic "minimal dose" assignment**
- **Problem**: System assigns "minimal dose" type even when users don't specify it
- **Example**: Marc's message shows "Type: Minimal Dose" without Marc writing "minimal dose"
- **Root Cause**: The minimal dose detection logic is too broad

## 🔍 **Analysis of Current Code**

### **Webhook Detection Logic (Problem)**
In `src/bot/bot.ts` lines 418-421:
```typescript
const isWebhookByUsername = message.author.bot && (
  message.author.username.toLowerCase().includes('webhook') ||
  message.author.username.toLowerCase().includes('marc')
);
```

**Issue**: This logic incorrectly identifies Jonas's messages as webhook messages because:
1. It checks if the author is a bot AND username contains "webhook" OR "marc"
2. Jonas's username might contain "marc" or similar patterns
3. This causes his messages to be processed as webhooks instead of regular proofs

### **Minimal Dose Detection Logic (Problem)**
In `src/bot/proof-processor.ts` and `src/bot/message-analyzer.ts`:
```typescript
const minimalDoseIndicators = ['minimal', 'small', 'quick', 'brief', 'just', 'only'];
const isMinimalDose = minimalDoseIndicators.some(indicator => 
  lowerContent.includes(indicator)
);
```

**Issue**: The logic is too broad and doesn't require explicit user intent for minimal dose assignment.

## 🎯 **Solution Plan**

### **Fix 1: Correct Webhook Detection**
- Remove the overly broad username matching that includes "marc"
- Only detect webhooks based on actual webhook indicators
- Ensure regular users like Jonas are processed as normal proof messages

### **Fix 2: Fix Minimal Dose Assignment**
- Make minimal dose assignment more restrictive
- Only assign minimal dose when users explicitly indicate it
- Add better context awareness for minimal dose detection

### **Fix 3: Improve Habit Matching**
- Ensure the flexible habit matching works correctly for "reading" habits
- Test the AI semantic matching for reading-related activities

## 📝 **Implementation Steps**

1. Fix webhook detection logic in `src/bot/bot.ts`
2. Fix minimal dose assignment logic in proof processors
3. Test the fixes with Jonas's reading habit
4. Verify minimal dose assignment only happens when intended
5. Document the changes and test results
