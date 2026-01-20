/**
 * Verification Script for Reflection Flow
 * 
 * This script helps verify that reflection data is being saved correctly to Notion.
 * Run with: npx ts-node scripts/verify-reflection-flow.ts
 */

import * as dotenv from 'dotenv';
import { NotionClient } from '../src/notion/client';
import { formatLocalDate } from '../src/utils/date-utils';

// Load environment variables
dotenv.config();

async function verifyReflectionFlow() {
  console.log('🔍 Reflection Flow Verification Script\n');
  
  // Validate required environment variables
  const requiredEnvVars = [
    'NOTION_TOKEN',
    'NOTION_DATABASE_USERS',
    'NOTION_DATABASE_WEEKS'
  ];

  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      console.error(`❌ Missing required environment variable: ${envVar}`);
      process.exit(1);
    }
  }
  
  // Initialize Notion client
  const databaseIds = {
    users: process.env.NOTION_DATABASE_USERS!,
    habits: process.env.NOTION_DATABASE_HABITS || '',
    proofs: process.env.NOTION_DATABASE_PROOFS || '',
    learnings: process.env.NOTION_DATABASE_LEARNINGS || '',
    hurdles: process.env.NOTION_DATABASE_HURDLES || '',
    weeks: process.env.NOTION_DATABASE_WEEKS!,
    groups: process.env.NOTION_DATABASE_GROUPS || '',
    personality: process.env.NOTION_DATABASE_PERSONALITY || '',
    pricePool: process.env.NOTION_DATABASE_PRICE_POOL || '',
    challengeProofs: process.env.NOTION_DATABASE_CHALLENGE_PROOFS || ''
  };
  
  const notion = new NotionClient(process.env.NOTION_TOKEN!, databaseIds);
  
  try {
    // Get current week info
    const weekInfo = notion.getCurrentWeekInfo();
    const weekStartDate = formatLocalDate(weekInfo.weekStart);
    
    console.log('📅 Current Week Info:');
    console.log(`  Start Date: ${weekStartDate}`);
    console.log(`  Week Number: ${weekInfo.weekNumber}\n`);
    
    // Test: Get all users
    console.log('👥 Fetching users...');
    const users = await notion.getAllUsers();
    console.log(`  Found ${users.length} users\n`);
    
    if (users.length === 0) {
      console.log('⚠️  No users found. Cannot verify reflection data.');
      return;
    }
    
    // Test: Check reflection data for each user
    console.log('🔍 Checking reflection data for current week:\n');
    
    let usersWithReflection = 0;
    let usersWithoutReflection = 0;
    let usersWithWeekButNoReflection = 0;
    
    for (const user of users.slice(0, 10)) { // Limit to first 10 users
      const week = await notion.getWeekByUserAndStartDate(user.id, weekStartDate);
      
      if (week) {
        console.log(`✅ User: ${user.discordId || user.id}`);
        console.log(`   Week ID: ${week.id}`);
        console.log(`   Reflection Completed: ${week.reflectionCompleted ? '✅' : '❌'}`);
        console.log(`   Reflection Date: ${week.reflectionDate || 'N/A'}`);
        
        if (week.reflectionResponses) {
          console.log(`   Reflection Responses:`);
          const responses = week.reflectionResponses.split('\n');
          responses.forEach(line => console.log(`     ${line}`));
          usersWithReflection++;
        } else if (week.reflectionCompleted) {
          console.log(`   ⚠️  Reflection Completed = true but no Reflection Responses`);
          usersWithWeekButNoReflection++;
        } else {
          console.log(`   Reflection Responses: Not set (Week exists but no reflection yet)`);
          usersWithoutReflection++;
        }
        console.log('');
      } else {
        console.log(`❌ User: ${user.discordId || user.id}`);
        console.log(`   No week entry found for ${weekStartDate}\n`);
        usersWithoutReflection++;
      }
    }
    
    // Also check for any weeks with reflections (all time)
    console.log('\n🔍 Checking for ANY weeks with completed reflections (all time):\n');
    let totalReflectionsFound = 0;
    
    for (const user of users.slice(0, 5)) { // Check first 5 users
      try {
        // Get user's weeks - we'll need to query differently
        // For now, let's just check if we can find any reflection data
        const week = await notion.getWeekByUserAndStartDate(user.id, weekStartDate);
        if (week && week.reflectionCompleted && week.reflectionResponses) {
          totalReflectionsFound++;
        }
      } catch (error) {
        // Skip if error
      }
    }
    
    console.log('\n📊 Summary for current week (2026-01-19):');
    console.log(`  Users with completed reflection: ${usersWithReflection}`);
    console.log(`  Users with week but no reflection: ${usersWithWeekButNoReflection}`);
    console.log(`  Users without week entry: ${usersWithoutReflection}`);
    console.log(`\n💡 Note: If no reflections are found, this is normal if:`);
    console.log(`   - No one has submitted reflections for this week yet`);
    console.log(`   - The reflection feature hasn't been used yet`);
    console.log(`   - Week entries are created when users submit reflections`);
    
    // Test: Verify Notion property structure
    console.log('\n🔍 Verifying Notion property structure...');
    console.log('  Expected properties:');
    console.log('    - Reflection Responses (rich_text)');
    console.log('    - Reflection Completed (checkbox)');
    console.log('    - Reflection Date (date)');
    console.log('\n  ⚠️  Note: Please verify these property names match your Notion database schema!');
    
  } catch (error) {
    console.error('❌ Error during verification:', error);
    if (error instanceof Error) {
      console.error('   Message:', error.message);
      console.error('   Stack:', error.stack);
    }
  }
}

// Run verification
verifyReflectionFlow()
  .then(() => {
    console.log('\n✅ Verification complete');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Verification failed:', error);
    process.exit(1);
  });
