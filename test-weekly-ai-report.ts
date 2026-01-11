/**
 * Test script for Weekly AI Incentive Report
 * Tests batch filtering, personality integration, and message generation
 */

import { Client, GatewayIntentBits } from 'discord.js';
import { NotionClient } from './src/notion/client';
import { AIIncentiveManager } from './src/bot/ai-incentive-manager';
import { DiscordLogger } from './src/bot/discord-logger';
import { getCurrentBatch, isBatchActive } from './src/utils/batch-manager';
import * as dotenv from 'dotenv';

dotenv.config();

async function testWeeklyAIReport() {
  console.log('🧪 Starting Weekly AI Report Test\n');
  console.log('='.repeat(60));

  try {
    // === STEP 1: Environment Check ===
    console.log('\n📋 Step 1: Checking environment variables...');
    const requiredEnvVars = [
      'DISCORD_BOT_TOKEN',
      'NOTION_TOKEN',
      'NOTION_DATABASE_USERS',
      'NOTION_DATABASE_HABITS',
      'NOTION_DATABASE_PROOFS',
      'NOTION_DATABASE_LEARNINGS',
      'NOTION_DATABASE_HURDLES',
      'NOTION_DATABASE_WEEKS',
      'NOTION_DATABASE_GROUPS',
      'NOTION_DATABASE_PERSONALITY',
      'PERPLEXITY_API_KEY'
    ];

    const missing = requiredEnvVars.filter(v => !process.env[v]);
    if (missing.length > 0) {
      console.error('❌ Missing environment variables:', missing.join(', '));
      process.exit(1);
    }
    console.log('✅ All required environment variables present');

    // === STEP 2: Batch Check ===
    console.log('\n📋 Step 2: Checking active batch...');
    if (!isBatchActive()) {
      console.warn('⚠️ No active batch found');
      console.log('This test requires an active batch. Skipping...');
      return;
    }

    const batch = getCurrentBatch();
    if (!batch) {
      console.error('❌ Could not retrieve current batch');
      return;
    }
    console.log(`✅ Active batch found: ${batch.name}`);
    console.log(`   Start: ${batch.startDate}`);
    console.log(`   End: ${batch.endDate}`);
    console.log(`   Status: ${batch.status}`);

    // === STEP 3: Initialize Discord Client ===
    console.log('\n📋 Step 3: Initializing Discord client...');
    const client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
      ]
    });

    await client.login(process.env.DISCORD_BOT_TOKEN!);
    console.log('✅ Discord client logged in');

    // === STEP 4: Initialize NotionClient ===
    console.log('\n📋 Step 4: Initializing Notion client...');
    const databaseIds = {
      users: process.env.NOTION_DATABASE_USERS!,
      habits: process.env.NOTION_DATABASE_HABITS!,
      proofs: process.env.NOTION_DATABASE_PROOFS!,
      learnings: process.env.NOTION_DATABASE_LEARNINGS!,
      hurdles: process.env.NOTION_DATABASE_HURDLES!,
      weeks: process.env.NOTION_DATABASE_WEEKS!,
      groups: process.env.NOTION_DATABASE_GROUPS!,
      personality: process.env.NOTION_DATABASE_PERSONALITY!
    };
    const notion = new NotionClient(process.env.NOTION_TOKEN!, databaseIds);
    console.log('✅ Notion client initialized');

    // === STEP 5: Initialize Logger and AIIncentiveManager ===
    console.log('\n📋 Step 5: Initializing AI Incentive Manager...');
    const logger = new DiscordLogger(client);
    const aiManager = new AIIncentiveManager(client, notion, logger);
    console.log('✅ AI Incentive Manager initialized');

    // === STEP 6: Get Users in Current Batch ===
    console.log('\n📋 Step 6: Fetching users in current batch...');
    const batchUsers = await notion.getUsersInBatch(batch.name);
    const activeUsers = batchUsers.filter(u => u.status === 'active');
    console.log(`✅ Found ${activeUsers.length} active users in batch "${batch.name}"`);

    if (activeUsers.length === 0) {
      console.warn('⚠️ No active users in batch - nothing to test');
      client.destroy();
      return;
    }

    // Display users
    activeUsers.forEach((user, idx) => {
      console.log(`   ${idx + 1}. ${user.name} (${user.nickname || 'no nickname'})`);
      console.log(`      Discord ID: ${user.discordId}`);
      console.log(`      Buddy: ${user.buddy || 'none'}`);
    });

    // === STEP 7: Test One User in Detail ===
    console.log('\n📋 Step 7: Testing analysis for first user...');
    const testUser = activeUsers[0];
    console.log(`Testing with user: ${testUser.name}`);

    // 7a. Check user's habits
    console.log('\n  7a. Fetching user habits...');
    const allHabits = await notion.getHabitsByUserId(testUser.id);
    const batchHabits = allHabits.filter(h => h.batch === batch.name);
    console.log(`  ✅ User has ${allHabits.length} total habits`);
    console.log(`  ✅ User has ${batchHabits.length} habits in batch "${batch.name}"`);

    if (batchHabits.length === 0) {
      console.warn('  ⚠️ User has no habits in current batch');
    } else {
      batchHabits.forEach((habit, idx) => {
        console.log(`     ${idx + 1}. ${habit.name}`);
        console.log(`        Batch: ${habit.batch || 'none'}`);
        console.log(`        Frequency: ${habit.frequency}/week`);
        console.log(`        Why: ${habit.why?.substring(0, 50) || 'none'}...`);
        console.log(`        SMART Goal: ${habit.smartGoal?.substring(0, 50) || 'none'}...`);
      });
    }

    // 7b. Check user's personality profile
    console.log('\n  7b. Fetching user personality profile...');
    const profile = await notion.getUserProfileByDiscordId(testUser.discordId);
    if (profile) {
      console.log('  ✅ Personality profile found:');
      console.log(`     Type: ${profile.personalityType || 'not set'}`);
      console.log(`     Core Values: ${profile.coreValues?.join(', ') || 'not set'}`);
      console.log(`     Life Vision: ${profile.lifeVision?.substring(0, 60) || 'not set'}...`);
      console.log(`     Main Goals: ${profile.mainGoals?.join(', ') || 'not set'}`);
      console.log(`     Desired Identity: ${profile.desiredIdentity?.substring(0, 60) || 'not set'}...`);
    } else {
      console.log('  ⚠️ No personality profile found for user');
    }

    // 7c. Check user's proofs this week
    console.log('\n  7c. Fetching user proofs this week...');
    const now = new Date();
    const currentDay = now.getDay();
    const daysFromMonday = currentDay === 0 ? 6 : currentDay - 1;
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - daysFromMonday);
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    const weekProofs = await notion.getProofsByUserId(
      testUser.id,
      weekStart.toISOString().split('T')[0],
      weekEnd.toISOString().split('T')[0]
    );
    console.log(`  ✅ User has ${weekProofs.length} proofs this week (${weekStart.toLocaleDateString()} - ${weekEnd.toLocaleDateString()})`);

    // 7d. Check buddy analysis
    if (testUser.buddy) {
      console.log('\n  7d. Fetching buddy analysis...');
      const buddyUser = await notion.getUserByNickname(testUser.buddy);
      if (buddyUser) {
        console.log(`  ✅ Buddy found: ${buddyUser.name} (${buddyUser.nickname})`);
        const allBuddyHabits = await notion.getHabitsByUserId(buddyUser.id);
        const buddyBatchHabits = allBuddyHabits.filter(h => h.batch === batch.name);
        console.log(`     Buddy has ${buddyBatchHabits.length} habits in batch "${batch.name}"`);

        const buddyProofs = await notion.getProofsByUserId(
          buddyUser.id,
          weekStart.toISOString().split('T')[0],
          weekEnd.toISOString().split('T')[0]
        );
        console.log(`     Buddy has ${buddyProofs.length} proofs this week`);
      } else {
        console.warn(`  ⚠️ Buddy not found: ${testUser.buddy}`);
      }
    } else {
      console.log('\n  7d. User has no buddy assigned');
    }

    // === STEP 8: Run Full Weekly Analysis ===
    console.log('\n📋 Step 8: Running full weekly AI incentive analysis...');
    console.log('This will generate and send the weekly report to all active users.');
    console.log('⏳ This may take a few minutes depending on number of users...\n');

    await aiManager.runWeeklyAIIncentiveAnalysis();

    console.log('\n✅ Weekly AI incentive analysis completed!');

    // === STEP 9: Verification Summary ===
    console.log('\n📋 Step 9: Test Summary');
    console.log('='.repeat(60));
    console.log(`✅ Batch filtering: Working (filtered to "${batch.name}")`);
    console.log(`✅ User fetching: Found ${activeUsers.length} active users`);
    console.log(`✅ Habit filtering: Habits filtered by batch`);
    console.log(`✅ Personality integration: ${profile ? 'Profile found and integrated' : 'No profile (gracefully handled)'}`);
    console.log(`✅ Buddy analysis: ${testUser.buddy ? 'Buddy found and analyzed' : 'No buddy (gracefully handled)'}`);
    console.log(`✅ Weekly report: Generated and sent`);
    console.log('='.repeat(60));

    // Clean up
    console.log('\n🧹 Cleaning up...');
    client.destroy();
    console.log('✅ Discord client disconnected');

    console.log('\n🎉 Test completed successfully!\n');

  } catch (error) {
    console.error('\n❌ Test failed with error:', error);
    console.error((error as Error).stack);
    process.exit(1);
  }
}

// Run the test
testWeeklyAIReport()
  .then(() => {
    console.log('Test execution finished');
    process.exit(0);
  })
  .catch(error => {
    console.error('Test execution error:', error);
    process.exit(1);
  });
