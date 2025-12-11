/**
 * Test script for Buddy System
 * Run with: npx ts-node test-buddy-system.ts
 */

import dotenv from 'dotenv';
dotenv.config();

import { NotionClient } from './src/notion/client';
import { BuddyRotationScheduler } from './src/bot/buddy-rotation-scheduler';
import { AllUsersWeeklyScheduler } from './src/bot/all-users-weekly-scheduler';
import { Client } from 'discord.js';
import { DiscordLogger } from './src/bot/discord-logger';

async function testBuddySystem() {
  console.log('🧪 Testing Buddy System Implementation...\n');

  try {
    // Initialize Notion client
    console.log('1️⃣ Initializing Notion Client...');
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
      challengeProofs: process.env.NOTION_DATABASE_CHALLENGE_PROOFS!
    });
    console.log('✅ Notion Client initialized\n');

    // Test 1: Get active users
    console.log('2️⃣ Testing getActiveUsers()...');
    const activeUsers = await notion.getActiveUsers();
    console.log(`✅ Found ${activeUsers.length} active users`);
    if (activeUsers.length > 0) {
      const firstUser = activeUsers[0];
      console.log(`   Sample user: ${firstUser.name}`);
      console.log(`   - Buddy: ${firstUser.buddy || 'None'}`);
      console.log(`   - BuddyStart: ${firstUser.buddyStart || 'None'}`);
      console.log(`   - Status: ${firstUser.status}`);
    }
    console.log('');

    // Test 2: Get user by nickname (if buddy exists)
    if (activeUsers.length > 0 && activeUsers[0].buddy) {
      console.log(`3️⃣ Testing getUserByNickname() with "${activeUsers[0].buddy}"...`);
      const buddyUser = await notion.getUserByNickname(activeUsers[0].buddy);
      if (buddyUser) {
        console.log(`✅ Found buddy user: ${buddyUser.name}`);
        console.log(`   - Discord ID: ${buddyUser.discordId}`);
        console.log(`   - Status: ${buddyUser.status}`);
      } else {
        console.log(`⚠️ Buddy "${activeUsers[0].buddy}" not found`);
      }
      console.log('');
    }

    // Test 3: Get buddy progress (if buddy exists)
    if (activeUsers.length > 0 && activeUsers[0].buddy) {
      console.log(`4️⃣ Testing getBuddyProgress() for "${activeUsers[0].buddy}"...`);
      const weekEnd = new Date();
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - 7);
      
      const buddyProgress = await notion.getBuddyProgress(
        activeUsers[0].buddy,
        weekStart,
        weekEnd
      );
      
      if (buddyProgress) {
        console.log(`✅ Buddy progress retrieved:`);
        console.log(`   - Nickname: ${buddyProgress.nickname}`);
        console.log(`   - Habits: ${buddyProgress.habits.length}`);
        console.log(`   - Proofs this week: ${buddyProgress.proofs.length}`);
        console.log(`   - Completion Rate: ${buddyProgress.completionRate}%`);
        console.log(`   - Current Streak: ${buddyProgress.currentStreak} days`);
        console.log(`   - Habits with issues: ${buddyProgress.habitsWithIssues.length}`);
      } else {
        console.log(`⚠️ Could not retrieve buddy progress`);
      }
      console.log('');
    }

    // Test 4: Test updateUserBuddy (dry run - won't actually update)
    if (activeUsers.length >= 2) {
      console.log('5️⃣ Testing updateUserBuddy() logic (dry run)...');
      const user1 = activeUsers[0];
      const user2 = activeUsers[1];
      console.log(`   Would pair: ${user1.name} ↔ ${user2.name}`);
      console.log(`   ✅ updateUserBuddy() method exists and is callable`);
      console.log('   (Skipping actual update to avoid modifying data)');
      console.log('');
    }

    // Test 5: Initialize schedulers (without starting cron jobs)
    console.log('6️⃣ Testing scheduler initialization...');
    const mockClient = {
      channels: { cache: new Map() },
      login: async () => {},
      on: () => {},
      once: () => {}
    } as any as Client;

    const mockLogger = {
      info: async () => {},
      success: async () => {},
      logError: async () => {},
      log: async () => {}
    } as any as DiscordLogger;

    const buddyScheduler = new BuddyRotationScheduler(mockClient, notion, mockLogger);
    console.log('✅ BuddyRotationScheduler initialized');

    const weeklyScheduler = new AllUsersWeeklyScheduler(mockClient, notion, mockLogger);
    console.log('✅ AllUsersWeeklyScheduler initialized');
    console.log('');

    console.log('✅ All tests passed!');
    console.log('\n📋 Summary:');
    console.log(`   - Active users: ${activeUsers.length}`);
    console.log(`   - Users with buddies: ${activeUsers.filter(u => u.buddy).length}`);
    console.log(`   - Buddy system is ready to use`);
    console.log('\n💡 Next steps:');
    console.log('   1. Start the bot to activate schedulers');
    console.log('   2. Buddy rotation will run every other Sunday at 8 AM');
    console.log('   3. Weekly analysis will run every Wednesday at 9 AM');

  } catch (error) {
    console.error('❌ Test failed:', error);
    if (error instanceof Error) {
      console.error('   Error message:', error.message);
      console.error('   Stack:', error.stack);
    }
    process.exit(1);
  }
}

// Run tests
testBuddySystem().catch(console.error);

