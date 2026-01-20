/**
 * Test Script für Reflection Save Funktionalität
 * 
 * Simuliert den kompletten Reflection-Flow und prüft ob Daten korrekt in Notion gespeichert werden.
 * 
 * Usage:
 *   npx ts-node scripts/test-reflection-save.ts [discordId]
 * 
 * Wenn keine discordId angegeben wird, wird der erste User verwendet.
 */

import * as dotenv from 'dotenv';
import { NotionClient } from '../src/notion/client';
import { formatLocalDate } from '../src/utils/date-utils';

// Load environment variables
dotenv.config();

// Helper function to calculate ISO week number (copied from reflection-flow.ts)
function getISOWeekNumber(date: Date): number {
  const target = new Date(date.valueOf());
  const dayNr = (date.getDay() + 6) % 7;
  target.setDate(target.getDate() - dayNr + 3);
  const firstThursday = target.valueOf();
  target.setMonth(0, 1);
  if (target.getDay() !== 4) {
    target.setMonth(0, 1 + ((4 - target.getDay()) + 7) % 7);
  }
  return 1 + Math.ceil((firstThursday - target.valueOf()) / 604800000);
}

// Helper function to build reflection responses (copied from reflection-flow.ts)
function buildReflectionResponses(data: {
  wins: string;
  challenge: string;
  learning: string;
  nextWeek: string;
}): string {
  return [
    `Win: ${data.wins}`,
    `Obstacle: ${data.challenge}`,
    `Pattern: ${data.learning}`,
    `Next change: ${data.nextWeek}`
  ].join('\n');
}

async function testReflectionSave() {
  console.log('🧪 Reflection Save Test Script\n');
  console.log('='.repeat(60) + '\n');

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
    // Get user (from command line or first user)
    const discordIdArg = process.argv[2];
    let user;

    if (discordIdArg) {
      console.log(`🔍 Looking for user with Discord ID: ${discordIdArg}`);
      user = await notion.getUserByDiscordId(discordIdArg);
      if (!user) {
        console.error(`❌ User with Discord ID ${discordIdArg} not found!`);
        process.exit(1);
      }
    } else {
      console.log('🔍 Getting first user from database...');
      const users = await notion.getAllUsers();
      if (users.length === 0) {
        console.error('❌ No users found in database!');
        process.exit(1);
      }
      user = users[0];
      console.log(`✅ Using user: ${user.discordId || user.id} (${user.name})`);
    }

    console.log(`\n👤 User Info:`);
    console.log(`   ID: ${user.id}`);
    console.log(`   Discord ID: ${user.discordId || 'N/A'}`);
    console.log(`   Name: ${user.name}\n`);

    // Get current week info
    const weekInfo = notion.getCurrentWeekInfo();
    const weekStartDate = formatLocalDate(weekInfo.weekStart);
    const reflectionDate = formatLocalDate(new Date());

    console.log('📅 Week Info:');
    console.log(`   Start Date: ${weekStartDate}`);
    console.log(`   Week Number: ${weekInfo.weekNumber}`);
    console.log(`   Reflection Date: ${reflectionDate}\n`);

    // Parse date explicitly to avoid timezone issues (same as reflection-flow.ts)
    const [year, month, day] = weekStartDate.split('-').map(Number);
    const weekStartDateObj = new Date(year, month - 1, day);
    const weekNumber = getISOWeekNumber(weekStartDateObj);

    // Simulate reflection data (like from modal)
    const testReflectionData = {
      wins: 'Test Win: Successfully completed daily habit streak',
      challenge: 'Test Challenge: Time management was difficult this week',
      learning: 'Test Learning: Morning routine works best for me',
      nextWeek: 'Test Next Week: I will wake up 30 minutes earlier'
    };

    console.log('📝 Test Reflection Data:');
    console.log(`   Wins: ${testReflectionData.wins}`);
    console.log(`   Challenge: ${testReflectionData.challenge}`);
    console.log(`   Learning: ${testReflectionData.learning}`);
    console.log(`   Next Week: ${testReflectionData.nextWeek}\n`);

    const reflectionResponses = buildReflectionResponses(testReflectionData);

    console.log('📦 Formatted Reflection Responses:');
    console.log(reflectionResponses.split('\n').map(line => `   ${line}`).join('\n'));
    console.log('');

    // Check if week already exists
    console.log('🔍 Checking for existing week...');
    const existingWeek = await notion.getWeekByUserAndStartDate(user.id, weekStartDate);

    if (existingWeek) {
      console.log(`✅ Found existing week: ${existingWeek.id}`);
      console.log(`   Current Reflection Completed: ${existingWeek.reflectionCompleted || false}`);
      console.log(`   Current Reflection Date: ${existingWeek.reflectionDate || 'N/A'}\n`);

      console.log('💾 Updating existing week reflection...');
      await notion.updateWeekReflection(existingWeek.id, {
        reflectionResponses,
        reflectionCompleted: true,
        reflectionDate
      });
      console.log('✅ Update call completed\n');
    } else {
      console.log('❌ No existing week found, creating new week...\n');

      console.log('💾 Creating new week with reflection...');
      const newWeek = await notion.createWeek({
        userId: user.id,
        discordId: user.discordId,
        weekNum: weekNumber,
        startDate: weekStartDate,
        summary: '',
        score: 0,
        reflectionResponses,
        reflectionCompleted: true,
        reflectionDate
      });
      console.log(`✅ Create call completed, Week ID: ${newWeek.id}\n`);
    }

    // Wait a moment for Notion to process
    console.log('⏳ Waiting 2 seconds for Notion to process...\n');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Verify the data was saved
    console.log('🔍 Verifying saved data...\n');
    const savedWeek = await notion.getWeekByUserAndStartDate(user.id, weekStartDate);

    if (!savedWeek) {
      console.error('❌ ERROR: Week not found after save!');
      console.error('   This means the save operation failed silently.');
      process.exit(1);
    }

    console.log('✅ Week found after save!');
    console.log(`   Week ID: ${savedWeek.id}`);
    console.log(`   Reflection Completed: ${savedWeek.reflectionCompleted ? '✅' : '❌'}`);
    console.log(`   Reflection Date: ${savedWeek.reflectionDate || '❌ NOT SET'}`);

    // Check reflection responses
    if (!savedWeek.reflectionResponses) {
      console.error('\n❌ ERROR: Reflection Responses not saved!');
      console.error('   The property might be empty or not set.');
      process.exit(1);
    }

    console.log('\n📝 Saved Reflection Responses:');
    const savedResponses = savedWeek.reflectionResponses.split('\n');
    savedResponses.forEach(line => console.log(`   ${line}`));

    // Compare saved vs expected
    console.log('\n🔍 Comparing saved vs expected data...');
    const expectedResponses = reflectionResponses.split('\n');
    const matches = savedResponses.length === expectedResponses.length &&
      savedResponses.every((line, i) => line === expectedResponses[i]);

    if (!matches) {
      console.error('❌ ERROR: Saved responses do not match expected!');
      console.error('\n   Expected:');
      expectedResponses.forEach(line => console.error(`     ${line}`));
      console.error('\n   Saved:');
      savedResponses.forEach(line => console.error(`     ${line}`));
      process.exit(1);
    }

    // Final checks
    console.log('\n✅ All checks passed!');
    console.log(`   ✓ Reflection Completed = ${savedWeek.reflectionCompleted}`);
    console.log(`   ✓ Reflection Date = ${savedWeek.reflectionDate}`);
    console.log(`   ✓ Reflection Responses match expected`);
    console.log(`   ✓ All data saved correctly to Notion`);

    console.log('\n' + '='.repeat(60));
    console.log('✅ TEST PASSED: Reflection save functionality works correctly!');
    console.log('='.repeat(60) + '\n');

  } catch (error) {
    console.error('\n❌ TEST FAILED: Error during test');
    console.error('='.repeat(60));
    if (error instanceof Error) {
      console.error(`Error: ${error.name}`);
      console.error(`Message: ${error.message}`);
      if (error.stack) {
        console.error('\nStack trace:');
        console.error(error.stack);
      }
    } else {
      console.error('Unknown error:', error);
    }
    console.error('='.repeat(60) + '\n');
    process.exit(1);
  }
}

// Run test
testReflectionSave()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
