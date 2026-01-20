/**
 * Script zum Prüfen der tatsächlichen Property-Namen in der Notion Weeks-Datenbank
 */

import * as dotenv from 'dotenv';
import { Client } from '@notionhq/client';

dotenv.config();

async function checkNotionProperties() {
  console.log('🔍 Checking Notion Weeks Database Properties\n');
  console.log('='.repeat(60) + '\n');

  if (!process.env.NOTION_TOKEN) {
    console.error('❌ NOTION_TOKEN not set');
    process.exit(1);
  }

  if (!process.env.NOTION_DATABASE_WEEKS) {
    console.error('❌ NOTION_DATABASE_WEEKS not set');
    process.exit(1);
  }

  const client = new Client({ auth: process.env.NOTION_TOKEN });

  try {
    // Get database schema
    console.log('📋 Fetching database schema...\n');
    const database = await client.databases.retrieve({
      database_id: process.env.NOTION_DATABASE_WEEKS
    });

    console.log('📊 Database Properties:\n');
    const properties = database.properties;
    
    for (const [propName, propData] of Object.entries(properties)) {
      console.log(`   "${propName}"`);
      console.log(`      Type: ${propData.type}`);
      if (propData.type === 'rich_text' || propData.type === 'title') {
        console.log(`      Format: ${propData.type}`);
      } else if (propData.type === 'checkbox') {
        console.log(`      Format: checkbox`);
      } else if (propData.type === 'date') {
        console.log(`      Format: date`);
      }
      console.log('');
    }

    console.log('\n🔍 Looking for reflection-related properties...\n');
    
    const reflectionKeywords = ['reflection', 'reflexion', 'completed', 'date', 'response'];
    const foundProperties: string[] = [];
    
    for (const propName of Object.keys(properties)) {
      const lowerName = propName.toLowerCase();
      if (reflectionKeywords.some(keyword => lowerName.includes(keyword))) {
        foundProperties.push(propName);
        console.log(`   ✅ Found: "${propName}" (${properties[propName].type})`);
      }
    }

    if (foundProperties.length === 0) {
      console.log('   ⚠️  No reflection-related properties found!');
      console.log('   You may need to create these properties in Notion:');
      console.log('     - Reflection Responses (rich_text)');
      console.log('     - Reflection Completed (checkbox)');
      console.log('     - Reflection Date (date)');
    }

    console.log('\n🔍 Looking for Discord ID property...\n');
    const discordProps = Object.keys(properties).filter(name => 
      name.toLowerCase().includes('discord')
    );
    
    if (discordProps.length > 0) {
      discordProps.forEach(prop => {
        console.log(`   ✅ Found: "${prop}" (${properties[prop].type})`);
      });
    } else {
      console.log('   ⚠️  No Discord ID property found!');
      console.log('   Expected: "Discord ID" (title or rich_text)');
    }

    console.log('\n' + '='.repeat(60));
    console.log('\n💡 TIP: Compare these property names with the code in:');
    console.log('   - src/notion/client.ts (createWeek, updateWeekReflection)');
    console.log('   - src/bot/reflection-flow.ts');
    console.log('\n   Property names must match EXACTLY (case-sensitive)!');

  } catch (error) {
    console.error('\n❌ Error:', error);
    if (error instanceof Error) {
      console.error('   Message:', error.message);
    }
    process.exit(1);
  }
}

checkNotionProperties()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
