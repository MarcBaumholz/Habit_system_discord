# Challenge Proofs Notion Database Schema

This document describes the Notion database schema for the Weekly Challenge system.

## Database: Challenge Proofs

**Purpose:** Tracks all proof submissions for weekly challenges. This single database handles everything - participant tracking, proof logging, and completion calculations are all done by querying this database.

### Properties

| Property Name | Type | Description | Example Value |
|--------------|------|-------------|---------------|
| **Title** | title | Auto-generated identifier | "Challenge 5 - Proof - 2025-01-15" |
| **Challenge Number** | number | Which of the 20 challenges (1-20) | 5 |
| **Challenge Name** | rich_text | Name of the challenge | "Intermittent Fasting (16:8)" |
| **User** | relation | Link to Users database | Relation to User ID |
| **Date** | date | Date of proof submission | 2025-01-15 |
| **Unit** | rich_text | Measurement/achievement | "16 hours fasting" |
| **Note** | rich_text | Optional proof details | "Fasted 8pm-12pm, felt great!" |
| **Is Minimal Dose** | checkbox | Whether proof meets minimal requirement | true/false |
| **Week Start** | date | Sunday when challenge started | 2025-01-12 (Sunday) |
| **Week End** | date | Following Sunday (end of challenge) | 2025-01-19 (Sunday) |

### Property Details

#### Title (title)
- **Format:** `"Challenge {number} - Proof - {date}"`
- **Example:** `"Challenge 5 - Proof - 2025-01-15"`
- **Purpose:** Human-readable identifier for each proof entry

#### Challenge Number (number)
- **Range:** 1-20
- **Purpose:** Identifies which of the 20 challenges this proof belongs to
- **Usage:** Used for filtering proofs by challenge type

#### Challenge Name (rich_text)
- **Purpose:** Denormalized challenge name for easy reference
- **Example:** "Deep Work Sessions", "Cold Exposure Therapy"
- **Note:** Copied from the challenges MD file when proof is created

#### User (relation)
- **Links to:** Users database
- **Purpose:** Associates proof with the user who submitted it
- **Usage:** Essential for tracking which users joined and their proof counts

#### Date (date)
- **Format:** YYYY-MM-DD
- **Purpose:** When the proof was submitted (not when created in Notion)
- **Usage:** Ensures only 1 proof per user per day
- **Validation:** Must be within the Week Start - Week End range

#### Unit (rich_text)
- **Purpose:** Quantifiable measure of what was achieved
- **Examples:**
  - "90 minutes" (Deep Work)
  - "3 pages" (Morning Journaling)
  - "16 hours" (Intermittent Fasting)
  - "5:00 AM wake up" (5 AM Club)

#### Note (rich_text)
- **Purpose:** Optional details about the proof
- **Examples:**
  - "Worked on TypeScript refactoring, zero distractions"
  - "Cold shower after workout, 3 min total"
  - "Read Atomic Habits chapter 4-6"
- **Optional:** Can be empty

#### Is Minimal Dose (checkbox)
- **Purpose:** Indicates if proof meets the full requirement or just minimal dose
- **Logic:**
  - `false` = Full requirement met
  - `true` = Only minimal dose met
- **Usage:** Both count toward completion, but tracked separately for analytics
- **Example:** Challenge requires 90 min deep work, user does 60 min (minimal dose) → `true`

#### Week Start (date)
- **Format:** YYYY-MM-DD (always a Sunday)
- **Purpose:** Marks the beginning of the challenge week
- **Example:** 2025-01-12 (Sunday at 3 PM when challenge was posted)
- **Usage:** Groups all proofs for a specific challenge instance

#### Week End (date)
- **Format:** YYYY-MM-DD (always a Sunday)
- **Purpose:** Marks the end of the challenge week
- **Example:** 2025-01-19 (Sunday at 9 AM when evaluation runs)
- **Usage:** Defines the boundary for proof submissions

---

## How Code Uses This Database

### 1. Track Challenge Participants
**Query:** Get all unique users who have submitted at least one proof for the current challenge
```
Filter: Week Start = current_week_start AND Challenge Number = current_challenge_number
Group By: User
```

### 2. Count User's Proofs
**Query:** Get proof count for a specific user in the current challenge
```
Filter:
  - Week Start = current_week_start
  - Challenge Number = current_challenge_number
  - User = specific_user_id
Count: Results
```

### 3. Validate One Proof Per Day
**Query:** Check if user already submitted proof today
```
Filter:
  - Week Start = current_week_start
  - Challenge Number = current_challenge_number
  - User = specific_user_id
  - Date = today
Count: Should be 0 for submission to be allowed
```

### 4. Weekly Evaluation (Sunday 9 AM)
**Query:** Get all participants and their proof counts for last week
```
Filter:
  - Week Start = last_week_start
  - Challenge Number = last_week_challenge_number
Group By: User
Count Proofs Per User
Determine Winners: proof_count >= days_required
```

### 5. Mid-Week Progress Check (Wednesday)
**Query:** Get current week's progress for all participants
```
Filter:
  - Week Start = current_week_start
  - Challenge Number = current_challenge_number
Group By: User
Count Proofs Per User
```

---

## Setup Instructions

1. **Create Database in Notion:**
   - Go to your Notion workspace
   - Create a new database (table view recommended)
   - Name it: "Challenge Proofs"

2. **Add Properties:**
   - Add each property listed above with the exact names and types
   - Pay attention to trailing spaces (none in this schema)
   - Set up the relation to your existing Users database

3. **Get Database ID:**
   - Click "..." on the database
   - Select "Copy link to view"
   - Extract the database ID from the URL
   - Format: `https://notion.so/{workspace}/{DATABASE_ID}?v=...`

4. **Add to .env:**
   ```
   NOTION_DATABASE_CHALLENGE_PROOFS=your_database_id_here
   ```

5. **Update src/index.ts:**
   - Add validation for the new environment variable
   ```typescript
   if (!process.env.NOTION_DATABASE_CHALLENGE_PROOFS) {
     throw new Error('NOTION_DATABASE_CHALLENGE_PROOFS is required');
   }
   ```

---

## Example Data

### Example 1: Full Proof
```
Title: "Challenge 1 - Proof - 2025-01-15"
Challenge Number: 1
Challenge Name: "Deep Work Sessions"
User: → John Doe (relation)
Date: 2025-01-15
Unit: "90 minutes"
Note: "Worked on refactoring auth system, complete focus"
Is Minimal Dose: false (met full 90 min requirement)
Week Start: 2025-01-12
Week End: 2025-01-19
```

### Example 2: Minimal Dose Proof
```
Title: "Challenge 3 - Proof - 2025-01-16"
Challenge Number: 3
Challenge Name: "Cold Exposure Therapy"
User: → Jane Smith (relation)
Date: 2025-01-16
Unit: "2 minutes"
Note: "Cold shower after morning workout"
Is Minimal Dose: true (only met 2 min minimal, not full 3 min)
Week Start: 2025-01-12
Week End: 2025-01-19
```

### Example 3: Challenge Completion Check
**Scenario:** Challenge 5 (Intermittent Fasting) requires 6 days completion

**Query Results for User "Alex":**
- Mon 1/13: ✅ Proof submitted (16 hours)
- Tue 1/14: ✅ Proof submitted (14 hours minimal)
- Wed 1/15: ❌ No proof
- Thu 1/16: ✅ Proof submitted (16 hours)
- Fri 1/17: ✅ Proof submitted (16 hours)
- Sat 1/18: ✅ Proof submitted (15 hours minimal)
- Sun 1/19: ✅ Proof submitted (16 hours)

**Total:** 6 proofs (meets 6-day requirement) → **Winner, earns €1**

---

## Notes

- **No separate participant tracking table needed** - participants are implicitly anyone with ≥1 proof for the week
- **No separate challenge instance table needed** - Week Start + Challenge Number uniquely identify each challenge run
- **Price Pool integration** - Use existing Price Pool database with negative entries for rewards
- **Minimal schema = easier maintenance** - All logic in code, database is just proof storage
