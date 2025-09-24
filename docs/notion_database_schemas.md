# Notion Database Schemas - Exact Setup Guide

## 1. Users Database

**Database Name**: `Users`

| Property Name | Property Type | Configuration |
|---------------|---------------|---------------|
| **Discord ID** | Title | - |
| **Name** | Rich text | - |
| **Timezone** | Rich text | - |
| **Best Time** | Rich text | - |
| **Trust Count** | Number | Format: Number |

## 2. Habits Database

**Database Name**: `Habits`

| Property Name | Property Type | Configuration |
|---------------|---------------|---------------|
| **Name** | Title | - |
| **User** | Relation | Related to: Users database |
| **Domains** | Multi-select | Options: Health, Spirituality, Intellectual, Finance, Career, Adventure, Relationships, Emotions |
| **Frequency** | Rich text | - |
| **Context** | Rich text | - |
| **Difficulty** | Rich text | - |
| **SMART Goal** | Rich text | - |
| **Why** | Rich text | - |
| **Minimal Dose** | Rich text | - |
| **Habit Loop** | Rich text | - |
| **Implementation Intentions** | Rich text | - |
| **Hurdles** | Rich text | - |
| **Reminder Type** | Rich text | - |

## 3. Proofs Database

**Database Name**: `Proofs`

| Property Name | Property Type | Configuration |
|---------------|---------------|---------------|
| **User** | Relation | Related to: Users database |
| **Habit** | Relation | Related to: Habits database |
| **Date** | Date | - |
| **Unit** | Rich text | - |
| **Note** | Rich text | - |
| **Attachment URL** | URL | - |
| **Is Minimal Dose** | Checkbox | - |
| **Is Cheat Day** | Checkbox | - |

## 4. Learnings Database

**Database Name**: `Learnings`

| Property Name | Property Type | Configuration |
|---------------|---------------|---------------|
| **User** | Relation | Related to: Users database |
| **Habit** | Relation | Related to: Habits database |
| **Text** | Rich text | - |
| **Created At** | Date | - |

## 5. Weeks Database

**Database Name**: `Weeks`

| Property Name | Property Type | Configuration |
|---------------|---------------|---------------|
| **User** | Relation | Related to: Users database |
| **Week Num** | Number | Format: Number |
| **Start Date** | Date | - |
| **Summary** | Rich text | - |
| **Score** | Number | Format: Number |

## 6. Groups Database

**Database Name**: `Groups`

| Property Name | Property Type | Configuration |
|---------------|---------------|---------------|
| **Name** | Title | - |
| **Channel ID** | Rich text | - |
| **Donation Pool** | Number | Format: Number |

## Step-by-Step Setup Instructions

### Step 1: Create Integration
1. Go to https://www.notion.so/my-integrations
2. Click "New integration"
3. Name: "Discord Habit System"
4. Select your workspace
5. Copy the "Internal Integration Token"

### Step 2: Create Each Database
1. In your Notion workspace, create a new page
2. Type "/database" and select "Table - Inline"
3. Name the database exactly as specified above
4. Add each property with the exact name and type
5. For Relations: Click the property → "Connect to database" → Select the target database
6. For Multi-select: Add the options listed above

### Step 3: Share Databases with Integration
1. Open each database
2. Click "Share" in top right
3. Click "Add people, emails, groups, or integrations"
4. Search for "Discord Habit System" (your integration)
5. Give it "Can edit" permissions
6. Click "Invite"

### Step 4: Get Database IDs
1. Open each database
2. Copy the URL
3. Extract the database ID from the URL
4. Format: `https://notion.so/[workspace]/[database-id]?v=[view-id]`
5. The database ID is the part between the last `/` and `?`

### Step 5: Update .env File
```env
NOTION_TOKEN=your_integration_token_here
NOTION_DATABASE_USERS=database_id_here
NOTION_DATABASE_HABITS=database_id_here
NOTION_DATABASE_PROOFS=database_id_here
NOTION_DATABASE_LEARNINGS=database_id_here
NOTION_DATABASE_WEEKS=database_id_here
NOTION_DATABASE_GROUPS=database_id_here
```

## Important Notes

- **Exact Property Names**: Use the exact property names listed above
- **Property Types**: Must match exactly (Title, Rich text, Number, etc.)
- **Relations**: Must be properly connected between databases
- **Permissions**: Each database must be shared with your integration
- **Database IDs**: Get from the URL, not the page title

## Testing the Setup

Once all databases are created and shared:
1. Run `npm run dev`
2. Try `/join` command in Discord
3. Check if a new user appears in your Users database
4. If successful, the integration is working correctly