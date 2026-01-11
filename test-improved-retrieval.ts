/**
 * Test Script - Improved Notion Retrieval
 * Run: npx ts-node test-improved-retrieval.ts
 */

import { ImprovedNotionRetrieval } from './src/agents/improved/notion-retrieval';
import { NotionClient } from './src/notion/client';
import dotenv from 'dotenv';

dotenv.config();

async function testImprovedRetrieval() {
  console.log('🧪 Testing Improved Notion Retrieval\n');
  console.log('='.repeat(60));

  // Initialize Notion client
  const notion = new NotionClient(process.env.NOTION_TOKEN!, {
    users: process.env.NOTION_DATABASE_USERS!,
    habits: process.env.NOTION_DATABASE_HABITS!,
    proofs: process.env.NOTION_DATABASE_PROOFS!,
    learnings: process.env.NOTION_DATABASE_LEARNINGS!,
    hurdles: process.env.NOTION_DATABASE_HURDLES!,
    weeks: process.env.NOTION_DATABASE_WEEKS!,
    groups: process.env.NOTION_DATABASE_GROUPS!,
    personality: process.env.NOTION_DATABASE_PERSONALITY!,
    pricePool: process.env.NOTION_DATABASE_PRICE_POOL!,
    challengeProofs: process.env.NOTION_DATABASE_CHALLENGE_PROOFS!,
  });

  // Initialize improved retrieval
  const retrieval = new ImprovedNotionRetrieval(notion);

  // Test with your Discord ID
  const discordId = '383324294731661312'; // Marc's Discord ID

  console.log(`\n📌 Testing with Discord ID: ${discordId}\n`);

  // Test 1: Get comprehensive user context
  console.log('TEST 1: Comprehensive User Context');
  console.log('-'.repeat(60));

  const context = await retrieval.getComprehensiveUserContext(discordId, 7);

  if (!context.user) {
    console.error('❌ User not found!');
    return;
  }

  console.log('✅ User:', context.user.name);
  console.log('   Discord ID:', context.user.discordId);
  console.log('   Status:', context.user.status);
  console.log('   Trust Count:', context.user.trustCount);
  console.log('   Personal Channel:', context.user.personalChannelId ? 'Yes' : 'No');
  console.log('');

  console.log('📊 Data Retrieved:');
  console.log('   Habits:', context.habits.length);
  console.log('   Proofs (7 days):', context.proofs.length);
  console.log('   Learnings:', context.learnings.length);
  console.log('   Hurdles:', context.hurdles.length);

  // Test 2: Habit Analysis
  console.log('\n\nTEST 2: Habit Analysis (7 days)');
  console.log('-'.repeat(60));

  let analysis: any[] = [];

  if (context.habits.length === 0) {
    console.log('⚠️  No habits found for this user');
  } else {
    analysis = await retrieval.getHabitAnalysis(context.user.id, 7);

    console.log(`Found ${analysis.length} habits:\n`);

    analysis.forEach((h, idx) => {
      const emoji = h.completionRate >= 80 ? '✅' : h.completionRate >= 50 ? '⚠️' : '❌';
      console.log(`${idx + 1}. ${emoji} ${h.habitName}`);
      console.log(`   Target: ${h.targetFrequency}x/week`);
      console.log(`   Actual: ${h.actualProofs} proofs`);
      console.log(`   Completion: ${h.completionRate.toFixed(0)}%`);
      console.log(`   Streak: ${h.streak} days`);
      console.log(`   Last Proof: ${h.lastProof ? h.lastProof.toLocaleDateString() : 'Never'}`);
      console.log('');
    });
  }

  // Test 3: Buddy Progress
  console.log('\nTEST 3: Buddy Progress');
  console.log('-'.repeat(60));

  const buddyProgress = await retrieval.getBuddyProgress(context.user.id);

  if (!buddyProgress) {
    console.log('⚠️  No buddy assigned or buddy not found');
  } else {
    console.log(`👥 Buddy: ${buddyProgress.nickname}`);
    console.log(`   Completion Rate: ${buddyProgress.completionRate.toFixed(0)}%`);
    console.log(`   Current Streak: ${buddyProgress.currentStreak} days`);
    console.log(`   Habits: ${buddyProgress.habits.length}`);
    console.log(`   Proofs (7d): ${buddyProgress.proofs.length}`);
  }

  // Test 4: Cache Performance
  console.log('\n\nTEST 4: Cache Performance');
  console.log('-'.repeat(60));

  const startTime1 = Date.now();
  await retrieval.getActiveHabitsByUserId(context.user.id);
  const time1 = Date.now() - startTime1;
  console.log(`First call (no cache): ${time1}ms`);

  const startTime2 = Date.now();
  await retrieval.getActiveHabitsByUserId(context.user.id);
  const time2 = Date.now() - startTime2;
  console.log(`Second call (cached): ${time2}ms`);

  if (time2 < time1 / 2) {
    console.log(`✅ Cache working! ${Math.round((1 - time2 / time1) * 100)}% faster`);
  } else {
    console.log('⚠️  Cache might not be working optimally');
  }

  // Test 5: Data Validation
  console.log('\n\nTEST 5: Data Validation');
  console.log('-'.repeat(60));

  let validHabits = 0;
  let invalidHabits = 0;

  context.habits.forEach(habit => {
    if (
      habit.id &&
      habit.name &&
      habit.userId &&
      habit.frequency !== undefined &&
      habit.frequency !== null
    ) {
      validHabits++;
    } else {
      invalidHabits++;
      console.log('⚠️  Invalid habit found:', {
        id: habit.id,
        name: habit.name,
        hasUserId: !!habit.userId,
        hasFrequency: habit.frequency !== undefined,
      });
    }
  });

  console.log(`✅ Valid habits: ${validHabits}`);
  console.log(`❌ Invalid habits: ${invalidHabits}`);

  if (invalidHabits === 0) {
    console.log('✅ All habits passed validation!');
  }

  // Summary
  console.log('\n\n' + '='.repeat(60));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(60));

  const summary = {
    'User Found': context.user ? '✅' : '❌',
    'Habits Retrieved': context.habits.length > 0 ? '✅' : '⚠️',
    'Proofs Retrieved': context.proofs.length > 0 ? '✅' : '⚠️',
    'Habit Analysis': analysis ? '✅' : '❌',
    'Buddy Progress': buddyProgress ? '✅' : '⚠️',
    'Cache Working': time2 < time1 / 2 ? '✅' : '⚠️',
    'Data Validation': invalidHabits === 0 ? '✅' : '❌',
  };

  Object.entries(summary).forEach(([test, result]) => {
    console.log(`${result} ${test}`);
  });

  const passCount = Object.values(summary).filter(v => v === '✅').length;
  const totalTests = Object.keys(summary).length;

  console.log(`\nTests Passed: ${passCount}/${totalTests} (${Math.round((passCount / totalTests) * 100)}%)`);

  if (passCount === totalTests) {
    console.log('\n🎉 All tests passed! Improved retrieval is working perfectly.');
  } else if (passCount >= totalTests * 0.7) {
    console.log('\n✅ Most tests passed. System is working well.');
  } else {
    console.log('\n⚠️  Some tests failed. Check the output above for details.');
  }

  console.log('\n' + '='.repeat(60));
}

// Run tests
testImprovedRetrieval()
  .then(() => {
    console.log('\n✅ Test complete!\n');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Test failed:');
    console.error(error);
    process.exit(1);
  });
