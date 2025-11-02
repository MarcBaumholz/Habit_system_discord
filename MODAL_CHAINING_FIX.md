# Modal Chaining Error Fix

## Problem
The bot was experiencing an error `interaction.showModal is not a function` when trying to show the second onboarding modal after the first modal submission.

## Root Cause
Discord.js does not allow showing modals directly from a `ModalSubmitInteraction`. Only `ChatInputCommandInteraction` and `MessageComponentInteraction` (e.g., `ButtonInteraction`) can show modals.

## Solution
Implemented a button-based modal chaining pattern (similar to the existing `habit-flow.ts` implementation):

1. **First Modal Submission** → Stores data and replies with a button
2. **Button Click** → Shows the second modal
3. **Second Modal Submission** → Creates the complete profile

## Changes Made

### 1. Updated Imports (`src/bot/commands.ts`)
- Added `ButtonBuilder`, `ButtonStyle`, and `ButtonInteraction` to imports

### 2. Modified `handleOnboardModalSubmit` (`src/bot/commands.ts`)
- After storing first modal data, replies with a button instead of directly showing the second modal
- Button customId: `onboard_modal_2_trigger`
- Button label: "📝 Continue to Additional Details"

### 3. Updated `handleSecondOnboardModal` (`src/bot/commands.ts`)
- Changed parameter type from `any` to `ButtonInteraction`
- Method now expects a button interaction (which has `showModal()` method)

### 4. Added Button Handler (`src/bot/bot.ts`)
- Added route for `onboard_modal_2_trigger` button clicks
- Routes to `commandHandler.handleSecondOnboardModal(interaction)`

### 5. Added Validation (`src/bot/commands.ts`)
- Added user existence check in `handleOnboard`
- Added profile existence check in `handleOnboard`
- Provides appropriate error messages before showing modal

### 6. Updated Tests (`tests/join-onboard.test.ts`)
- Added `ButtonBuilder` and `ButtonStyle` to Discord.js mocks
- Updated test to verify button reply instead of direct modal showing
- Added test for button click → second modal flow
- Fixed `ModalBuilder` mock to include `data` property
- Added `type` property to button interaction mocks

## Technical Details

### Flow Before Fix:
```
/onboard command → Modal 1 → Submit Modal 1 → ❌ Show Modal 2 (FAILS)
```

### Flow After Fix:
```
/onboard command → Modal 1 → Submit Modal 1 → Button Reply → Click Button → ✅ Show Modal 2 → Submit Modal 2 → Create Profile
```

## Testing
All tests passing:
- ✅ User validation tests
- ✅ Profile existence check tests
- ✅ First modal submission → button reply test
- ✅ Button click → second modal test
- ✅ Complete profile creation test

## Files Modified
1. `src/bot/commands.ts` - Main logic changes
2. `src/bot/bot.ts` - Button interaction routing
3. `tests/join-onboard.test.ts` - Test updates and mocks

## Impact
- Fixes the `interaction.showModal is not a function` error
- Maintains all existing functionality
- Follows existing patterns in codebase (habit-flow.ts)
- Improves user experience with clear button-based flow

