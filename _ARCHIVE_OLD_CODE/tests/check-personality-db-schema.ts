/**
 * Script to check the actual Personality DB schema
 */

import dotenv from 'dotenv';
import { Client } from '@notionhq/client';

dotenv.config();

async function checkSchema() {
  if (!process.env.NOTION_TOKEN || !process.env.NOTION_DATABASE_PERSONALITY) {
    console.error('Missing environment variables');
    process.exit(1);
  }

  const client = new Client({ auth: process.env.NOTION_TOKEN });
  const dbId = process.env.NOTION_DATABASE_PERSONALITY;

  try {
    console.log('📋 Checking Personality DB schema...\n');
    console.log(`Database ID: ${dbId}\n`);

    const response = await client.databases.retrieve({ database_id: dbId });
    
    console.log('✅ Database found!\n');
    console.log('📊 Database Properties:\n');
    
    Object.entries(response.properties).forEach(([key, value]: [string, any]) => {
      console.log(`   ${key}:`);
      console.log(`      Type: ${value.type}`);
      if (value.select) {
        console.log(`      Select Options: ${JSON.stringify(value.select.options?.map((o: any) => o.name) || [])}`);
      }
      if (value.multi_select) {
        console.log(`      Multi-select Options: ${JSON.stringify(value.multi_select.options?.map((o: any) => o.name) || [])}`);
      }
      console.log('');
    });

  } catch (error) {
    console.error('❌ Error:', error instanceof Error ? error.message : String(error));
    if (error instanceof Error && error.message.includes('Could not find database')) {
      console.error('\n💡 Database not found or not shared with integration');
    }
    process.exit(1);
  }
}

checkSchema();

