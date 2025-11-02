# Notion Database Requirements for Pause/Activate Feature

## ✅ Currently Working (Minimal Setup)

The pause/activate feature **works now** with just the **Status** field.

### Required Property (Already Exists)

1. **Status** (Select type)
   - Options: `active`, `pause`
   - ✅ This already exists in your database
   - This is sufficient for the pause/activate functionality

## Optional Properties (For Future Enhancement)

If you want to store the pause reason and duration, you can add these fields later:

### Optional Property 1: Pause Reason

- **Property Name:** `Pause Reason`
- **Type:** Rich Text
- **Purpose:** Store why the user is pausing
- **Required:** No (optional)
- **Note:** Currently the reason is only shown in Discord, not stored in Notion

### Optional Property 2: Pause Duration

- **Property Name:** `Pause Duration`
- **Type:** Rich Text
- **Purpose:** Store how long user expects to pause (informational)
- **Required:** No (optional)
- **Note:** Currently the duration is only shown in Discord, not stored in Notion

## How to Add Optional Properties (If Needed Later)

1. Open your Notion Users database
2. Click on a column header (or add a new column)
3. For "Pause Reason":
   - Property type: **Text** (or **Rich Text** if available)
   - Property name: `Pause Reason` (exact match, case-sensitive)
4. For "Pause Duration":
   - Property type: **Text** (or **Rich Text** if available)
   - Property name: `Pause Duration` (exact match, case-sensitive)

## Current Implementation

✅ **Works without additional properties:**
- `/pause` command updates Status to "pause"
- `/activate` command updates Status to "active"
- Paused users are excluded from all analysis
- Reason and duration are shown in Discord message only

## Summary

**For immediate use:** No database changes needed! ✅

**For future enhancement:** Add "Pause Reason" and "Pause Duration" as Rich Text properties (optional)





