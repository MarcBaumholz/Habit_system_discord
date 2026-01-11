#!/usr/bin/env node
/**
 * Notion Database Structure Checker
 * Checks the actual property names in your Notion databases
 */

require('dotenv').config();
const { Client } = require('@notionhq/client');

const notion = new Client({ auth: process.env.NOTION_TOKEN });

async function checkDatabase(databaseId, databaseName) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`📊 Checking ${databaseName} Database`);
  console.log(`${'='.repeat(60)}`);
  
  try {
    const database = await notion.databases.retrieve({
      database_id: databaseId
    });
    
    console.log(`\n✅ Database found: ${database.title[0]?.plain_text || 'Untitled'}`);
    console.log(`\n📋 Properties:`);
    
    Object.entries(database.properties).forEach(([name, prop]) => {
      console.log(`   - "${name}" (${prop.type})`);
    });
    
    // Try to get one page to see actual data structure
    const pages = await notion.databases.query({
      database_id: databaseId,
      page_size: 1
    });
    
    if (pages.results.length > 0) {
      console.log(`\n📄 Sample page properties:`);
      const page = pages.results[0];
      Object.entries(page.properties).forEach(([name, prop]) => {
        console.log(`   - "${name}" (${prop.type})`);
      });
    } else {
      console.log(`\n⚠️  No pages found in this database`);
    }
    
  } catch (error) {
    console.error(`\n❌ Error accessing ${databaseName}:`, error.message);
  }
}

async function main() {
  console.log('🔍 Notion Database Structure Checker\n');
  
  const databases = {
    'Users': process.env.NOTION_DATABASE_USERS,
    'Learnings': process.env.NOTION_DATABASE_LEARNINGS,
    'Hurdles': process.env.NOTION_DATABASE_HURDLES,
  };
  
  for (const [name, id] of Object.entries(databases)) {
    if (id) {
      await checkDatabase(id, name);
    } else {
      console.log(`\n⚠️  ${name} database ID not found in .env`);
    }
  }
  
  console.log(`\n${'='.repeat(60)}`);
  console.log('✅ Check complete!');
  console.log(`${'='.repeat(60)}\n`);
}

main().catch(console.error);

