# Notion API Standards

## Client Initialization

- Initialize client once and reuse
- Pass configuration through constructor
- Validate database IDs at startup
- Handle authentication errors

```typescript
// ✅ Good
import { Client } from '@notionhq/client';

interface NotionConfig {
  token: string;
  databases: {
    users: string;
    habits: string;
    proofs: string;
  };
}

class NotionClient {
  private client: Client;
  private databases: NotionConfig['databases'];
  
  constructor(config: NotionConfig) {
    if (!config.token) {
      throw new Error('Notion token is required');
    }
    
    this.client = new Client({ auth: config.token });
    this.databases = config.databases;
  }
}

// ❌ Bad
class NotionClient {
  private client = new Client({ auth: process.env.NOTION_TOKEN || '' });
}
```

## Database Queries

- Use proper query filters
- Handle pagination for large results
- Validate query results
- Use type-safe result handling

```typescript
// ✅ Good
async function getUserByDiscordId(discordId: string): Promise<User | null> {
  try {
    const response = await notion.databases.query({
      database_id: this.databases.users,
      filter: {
        property: 'Discord ID',
        rich_text: {
          equals: discordId,
        },
      },
    });
    
    if (response.results.length === 0) {
      return null;
    }
    
    return this.mapNotionPageToUser(response.results[0]);
  } catch (error) {
    console.error(`Failed to get user by Discord ID ${discordId}:`, error);
    throw new Error(`Notion query failed: ${error.message}`);
  }
}

// ❌ Bad
async function getUserByDiscordId(discordId: string) {
  const response = await notion.databases.query({
    database_id: this.databases.users,
  });
  return response.results.find(r => r.properties['Discord ID'] === discordId);
}
```

## Data Mapping

- Create mapping functions for Notion pages
- Handle different property types
- Validate required properties
- Use type-safe mappings

```typescript
// ✅ Good
interface User {
  id: string;
  discordId: string;
  name: string;
  trustCount: number;
}

function mapNotionPageToUser(page: Page): User {
  const properties = page.properties;
  
  if (!properties['Discord ID'] || !properties['Name']) {
    throw new Error('Invalid user page: missing required properties');
  }
  
  return {
    id: page.id,
    discordId: this.getRichTextProperty(properties['Discord ID']),
    name: this.getRichTextProperty(properties['Name']),
    trustCount: this.getNumberProperty(properties['Trust Count']) || 0,
  };
}

private getRichTextProperty(property: any): string {
  if (property.type !== 'rich_text') {
    throw new Error(`Expected rich_text property, got ${property.type}`);
  }
  return property.rich_text.map((text: any) => text.plain_text).join('');
}

// ❌ Bad
function mapNotionPageToUser(page: Page): User {
  return {
    id: page.id,
    discordId: page.properties['Discord ID'],
    name: page.properties['Name'],
    trustCount: page.properties['Trust Count'],
  };
}
```

## Creating Pages

- Validate input data before creating
- Use proper property types
- Handle creation errors
- Return created entity

```typescript
// ✅ Good
async function createUser(userData: {
  discordId: string;
  name: string;
  timezone?: string;
}): Promise<User> {
  if (!userData.discordId || !userData.name) {
    throw new Error('Discord ID and name are required');
  }
  
  try {
    const response = await this.client.pages.create({
      parent: { database_id: this.databases.users },
      properties: {
        'Discord ID': {
          rich_text: [{ text: { content: userData.discordId } }],
        },
        'Name': {
          rich_text: [{ text: { content: userData.name } }],
        },
        'Trust Count': {
          number: 0,
        },
        ...(userData.timezone && {
          'Timezone': {
            rich_text: [{ text: { content: userData.timezone } }],
          },
        }),
      },
    });
    
    return this.mapNotionPageToUser(response);
  } catch (error) {
    console.error('Failed to create user:', error);
    throw new Error(`Failed to create user in Notion: ${error.message}`);
  }
}

// ❌ Bad
async function createUser(userData: any) {
  return await this.client.pages.create({
    parent: { database_id: this.databases.users },
    properties: userData,
  });
}
```

## Updating Pages

- Validate update data
- Use partial updates when possible
- Handle update errors
- Return updated entity

```typescript
// ✅ Good
async function updateUserTrustCount(userId: string, trustCount: number): Promise<User> {
  if (trustCount < 0) {
    throw new Error('Trust count cannot be negative');
  }
  
  try {
    const response = await this.client.pages.update({
      page_id: userId,
      properties: {
        'Trust Count': {
          number: trustCount,
        },
      },
    });
    
    return this.mapNotionPageToUser(response);
  } catch (error) {
    console.error(`Failed to update trust count for user ${userId}:`, error);
    throw new Error(`Failed to update user: ${error.message}`);
  }
}

// ❌ Bad
async function updateUserTrustCount(userId: string, trustCount: number) {
  await this.client.pages.update({
    page_id: userId,
    properties: { 'Trust Count': trustCount },
  });
}
```

## Error Handling

- Handle Notion API errors specifically
- Provide meaningful error messages
- Log errors with context
- Never use mock data as fallback

```typescript
// ✅ Good
try {
  const user = await notion.getUserById(userId);
  if (!user) {
    throw new Error(`User ${userId} not found`);
  }
  return user;
} catch (error) {
  if (error.code === 'object_not_found') {
    throw new Error(`Notion database not found`);
  }
  if (error.code === 'unauthorized') {
    throw new Error('Notion authentication failed');
  }
  console.error('Notion API error:', error);
  throw new Error(`Failed to get user: ${error.message}`);
}

// ❌ Bad
try {
  return await notion.getUserById(userId);
} catch (error) {
  return { id: userId, name: 'Unknown User' };
}
```

