// Check Notion database structure
const { Client: NotionClient } = require('@notionhq/client');
require('dotenv').config();

async function checkNotionStructure() {
  console.log('🔍 Checking Notion Database Structure...\n');

  const notion = new NotionClient({ auth: process.env.NOTION_TOKEN });
  
  try {
    // Get Users database structure
    console.log('1. Users Database Structure:');
    const usersDb = await notion.databases.retrieve({
      database_id: process.env.NOTION_DATABASE_USERS
    });
    
    console.log('   Properties:');
    Object.keys(usersDb.properties).forEach(propName => {
      const prop = usersDb.properties[propName];
      console.log(`   - ${propName}: ${prop.type}`);
    });
    
    // Get Habits database structure
    console.log('\n2. Habits Database Structure:');
    const habitsDb = await notion.databases.retrieve({
      database_id: process.env.NOTION_DATABASE_HABITS
    });
    
    console.log('   Properties:');
    Object.keys(habitsDb.properties).forEach(propName => {
      const prop = habitsDb.properties[propName];
      console.log(`   - ${propName}: ${prop.type}`);
    });
    
    // Get Proofs database structure
    console.log('\n3. Proofs Database Structure:');
    const proofsDb = await notion.databases.retrieve({
      database_id: process.env.NOTION_DATABASE_PROOFS
    });
    
    console.log('   Properties:');
    Object.keys(proofsDb.properties).forEach(propName => {
      const prop = proofsDb.properties[propName];
      console.log(`   - ${propName}: ${prop.type}`);
    });
    
  } catch (error) {
    console.log('❌ Error checking Notion structure:');
    console.log(`   ${error.message}`);
  }
}

checkNotionStructure().catch(console.error);