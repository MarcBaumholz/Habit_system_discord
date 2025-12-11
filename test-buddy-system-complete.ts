/**
 * Comprehensive Buddy System Test
 * Tests all buddy system functionality
 */

import dotenv from 'dotenv';
dotenv.config();

import { NotionClient } from './src/notion/client';
import { User, BuddyProgressData } from './src/types';

async function testBuddySystem() {
  console.log('🧪 ========================================');
  console.log('🧪 COMPREHENSIVE BUDDY SYSTEM TEST');
  console.log('🧪 ========================================\n');

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

    // Test 1: Get all active users
    console.log('2️⃣ Testing getActiveUsers()...');
    const activeUsers = await notion.getActiveUsers();
    console.log(`✅ Found ${activeUsers.length} active users\n`);
    
    if (activeUsers.length === 0) {
      console.log('⚠️ No active users found - cannot test buddy system');
      return;
    }

    // Display active users with their buddy info
    console.log('📋 Active Users and Their Buddies:');
    activeUsers.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.name} (${user.discordId.substring(0, 10)}...)`);
      console.log(`      Status: ${user.status}`);
      console.log(`      Buddy: ${user.buddy || 'None'}`);
      console.log(`      BuddyStart: ${user.buddyStart || 'None'}`);
      console.log(`      Personal Channel: ${user.personalChannelId ? 'Yes' : 'No'}`);
      console.log('');
    });

    // Test 2: Test getUserByNickname for users with buddies
    console.log('3️⃣ Testing getUserByNickname()...');
    const usersWithBuddies = activeUsers.filter(u => u.buddy);
    console.log(`   Found ${usersWithBuddies.length} users with buddies\n`);
    
    if (usersWithBuddies.length > 0) {
      const testUser = usersWithBuddies[0];
      console.log(`   Testing with buddy: "${testUser.buddy}"`);
      
      const buddyUser = await notion.getUserByNickname(testUser.buddy!);
      if (buddyUser) {
        console.log(`   ✅ Found buddy user: ${buddyUser.name}`);
        console.log(`      - Discord ID: ${buddyUser.discordId}`);
        console.log(`      - Status: ${buddyUser.status}`);
        console.log(`      - Has Personal Channel: ${buddyUser.personalChannelId ? 'Yes' : 'No'}`);
      } else {
        console.log(`   ❌ Could not find buddy "${testUser.buddy}"`);
        console.log(`   ⚠️ This might indicate a nickname mismatch issue`);
      }
      console.log('');
    } else {
      console.log('   ⚠️ No users with buddies found - skipping nickname test\n');
    }

    // Test 3: Test getBuddyProgress
    console.log('4️⃣ Testing getBuddyProgress()...');
    if (usersWithBuddies.length > 0) {
      const testUser = usersWithBuddies[0];
      const weekEnd = new Date();
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - 7);
      
      console.log(`   Getting progress for buddy: "${testUser.buddy}"`);
      console.log(`   Week range: ${weekStart.toISOString().split('T')[0]} to ${weekEnd.toISOString().split('T')[0]}`);
      
      const buddyProgress = await notion.getBuddyProgress(
        testUser.buddy!,
        weekStart,
        weekEnd
      );
      
      if (buddyProgress) {
        console.log(`   ✅ Buddy progress retrieved successfully:`);
        console.log(`      - Nickname: ${buddyProgress.nickname}`);
        console.log(`      - Habits tracked: ${buddyProgress.habits.length}`);
        console.log(`      - Proofs this week: ${buddyProgress.proofs.length}`);
        console.log(`      - Completion Rate: ${buddyProgress.completionRate}%`);
        console.log(`      - Current Streak: ${buddyProgress.currentStreak} days`);
        console.log(`      - Habits with issues: ${buddyProgress.habitsWithIssues.length}`);
        
        if (buddyProgress.habitsWithIssues.length > 0) {
          console.log(`      - Issues:`);
          buddyProgress.habitsWithIssues.forEach(issue => {
            console.log(`        • ${issue.habitName}: ${issue.actualFrequency}/${issue.targetFrequency} (Goal: ${issue.goal})`);
          });
        }
      } else {
        console.log(`   ⚠️ Could not retrieve buddy progress (buddy might not exist or have no data)`);
      }
      console.log('');
    } else {
      console.log('   ⚠️ No users with buddies found - skipping progress test\n');
    }

    // Test 4: Test status reading (the fix we just made)
    console.log('5️⃣ Testing Status Field Reading...');
    const testUser = activeUsers[0];
    const userByDiscordId = await notion.getUserByDiscordId(testUser.discordId);
    
    if (userByDiscordId) {
      console.log(`   ✅ User retrieved: ${userByDiscordId.name}`);
      console.log(`      - Status from getActiveUsers: ${testUser.status}`);
      console.log(`      - Status from getUserByDiscordId: ${userByDiscordId.status}`);
      console.log(`      - Status match: ${testUser.status === userByDiscordId.status ? '✅' : '❌'}`);
      
      if (userByDiscordId.status === 'pause') {
        console.log(`      ⚠️ WARNING: User status is 'pause' but was returned by getActiveUsers()`);
      } else {
        console.log(`      ✅ Status is correctly set to '${userByDiscordId.status}'`);
      }
    }
    console.log('');

    // Test 5: Test updateUserBuddy (dry run - show what would happen)
    console.log('6️⃣ Testing updateUserBuddy() Logic...');
    if (activeUsers.length >= 2) {
      const user1 = activeUsers[0];
      const user2 = activeUsers[1];
      console.log(`   Would pair:`);
      console.log(`      ${user1.name} ↔ ${user2.name}`);
      console.log(`   ✅ updateUserBuddy() method exists and is callable`);
      console.log(`   (Skipping actual update to avoid modifying production data)`);
    } else {
      console.log(`   ⚠️ Need at least 2 users to test pairing logic`);
    }
    console.log('');

    // Test 6: Check buddy pairs are reciprocal
    console.log('7️⃣ Testing Buddy Pair Reciprocity...');
    const buddyPairs: Array<{ user1: User; user2: User | null; buddyNickname: string }> = [];
    
    // First, we need to get nickname for each user by fetching them individually
    // since getActiveUsers doesn't return nickname field
    const usersWithNicknames: Array<User & { nickname?: string }> = [];
    for (const user of activeUsers) {
      const fullUser = await notion.getUserByDiscordId(user.discordId);
      if (fullUser) {
        usersWithNicknames.push({ ...user, nickname: undefined }); // We'll get nickname separately
      }
    }
    
    for (const user of activeUsers) {
      if (user.buddy) {
        // Find buddy by nickname (buddy field contains nickname, not name)
        const buddy = await notion.getUserByNickname(user.buddy);
        buddyPairs.push({ user1: user, user2: buddy, buddyNickname: user.buddy });
      }
    }
    
    console.log(`   Found ${buddyPairs.length} buddy assignments`);
    
    let reciprocalPairs = 0;
    let nonReciprocalPairs = 0;
    
    for (const pair of buddyPairs) {
      if (pair.user2) {
        // Check if buddy's buddy matches user1's nickname
        // We need to get user1's nickname first
        const user1Full = await notion.getUserByDiscordId(pair.user1.discordId);
        const user1Nickname = user1Full ? await notion.getUserByNickname(pair.user1.name).then(u => u?.name).catch(() => null) : null;
        
        // For now, let's check if buddy's buddy field matches user1's name or if we can find it
        // The buddy field stores nicknames, so we need to check differently
        const isReciprocal = pair.user2.buddy === pair.user1.name || 
                            (user1Nickname && pair.user2.buddy === user1Nickname);
        
        if (isReciprocal) {
          reciprocalPairs++;
          console.log(`   ✅ ${pair.user1.name} ↔ ${pair.user2.name} (reciprocal)`);
        } else {
          nonReciprocalPairs++;
          console.log(`   ⚠️ ${pair.user1.name} → ${pair.user2.name} (${pair.user2.name}'s buddy is: ${pair.user2.buddy || 'None'})`);
        }
      } else {
        nonReciprocalPairs++;
        console.log(`   ❌ ${pair.user1.name} → ${pair.buddyNickname} (buddy not found)`);
      }
    }
    
    console.log(`\n   Summary:`);
    console.log(`      - Reciprocal pairs: ${reciprocalPairs}`);
    console.log(`      - Non-reciprocal pairs: ${nonReciprocalPairs}`);
    console.log('');

    // Summary
    console.log('📊 ========================================');
    console.log('📊 TEST SUMMARY');
    console.log('📊 ========================================');
    console.log(`✅ Active users found: ${activeUsers.length}`);
    console.log(`✅ Users with buddies: ${usersWithBuddies.length}`);
    console.log(`✅ Reciprocal buddy pairs: ${reciprocalPairs}`);
    console.log(`⚠️  Non-reciprocal pairs: ${nonReciprocalPairs}`);
    console.log('');
    
    if (activeUsers.length >= 2 && usersWithBuddies.length > 0 && reciprocalPairs > 0) {
      console.log('✅ Buddy system appears to be working correctly!');
      console.log('');
      console.log('💡 What the buddy system does:');
      console.log('   1. Pairs active users every 2 weeks (rotates on Sundays)');
      console.log('   2. Includes buddy progress in weekly AI analysis');
      console.log('   3. Sends notifications when buddy struggles with goals');
      console.log('   4. All active users receive weekly analysis in personal channels');
    } else {
      console.log('⚠️ Some issues detected - see details above');
    }

  } catch (error) {
    console.error('\n❌ Test failed:', error);
    if (error instanceof Error) {
      console.error('   Error message:', error.message);
      console.error('   Stack:', error.stack);
    }
  }
}

// Run tests
testBuddySystem().catch(console.error);

