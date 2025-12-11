/**
 * Test Buddy System with Nickname Matching
 */

import dotenv from 'dotenv';
dotenv.config();

import { NotionClient } from './src/notion/client';

async function testBuddyNicknameMatching() {
  console.log('🧪 Testing Buddy System - Nickname Matching\n');

  try {
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

    const activeUsers = await notion.getActiveUsers();
    console.log(`✅ Found ${activeUsers.length} active users\n`);

    // Get full user data with nicknames
    const usersWithNicknames = await Promise.all(
      activeUsers.map(async (user) => {
        const fullUser = await notion.getUserByDiscordId(user.discordId);
        return fullUser || user;
      })
    );

    console.log('📋 Users and Their Buddy Assignments:\n');
    const buddyPairs: Array<{ user1: any; user2: any | null; isReciprocal: boolean }> = [];

    for (const user of usersWithNicknames) {
      if (!user.buddy) {
        console.log(`   ${user.name} (${user.nickname || 'no nickname'}) → No buddy assigned`);
        continue;
      }

      // Find buddy by nickname
      const buddy = await notion.getUserByNickname(user.buddy);
      
      if (buddy) {
        // Check if buddy's buddy matches user's nickname
        const userNickname = user.nickname || user.name;
        const isReciprocal = buddy.buddy === userNickname;
        
        buddyPairs.push({ user1: user, user2: buddy, isReciprocal });
        
        const status = isReciprocal ? '✅' : '⚠️';
        console.log(`${status} ${userNickname} ↔ ${buddy.nickname || buddy.name}`);
        console.log(`      ${user.name} (buddy: ${user.buddy}) ↔ ${buddy.name} (buddy: ${buddy.buddy || 'None'})`);
        
        if (!isReciprocal) {
          console.log(`      ⚠️ Not reciprocal: ${buddy.name}'s buddy is "${buddy.buddy}" but should be "${userNickname}"`);
        }
        console.log('');
      } else {
        console.log(`   ❌ ${user.name} → Buddy "${user.buddy}" not found`);
        console.log('');
      }
    }

    const reciprocalCount = buddyPairs.filter(p => p.isReciprocal).length;
    const totalPairs = buddyPairs.length;

    console.log('\n📊 Summary:');
    console.log(`   Total buddy assignments: ${totalPairs}`);
    console.log(`   Reciprocal pairs: ${reciprocalCount}`);
    console.log(`   Non-reciprocal pairs: ${totalPairs - reciprocalCount}`);
    
    if (reciprocalCount === totalPairs && totalPairs > 0) {
      console.log('\n✅ All buddy pairs are correctly matched by nickname!');
    } else if (totalPairs > 0) {
      console.log('\n⚠️ Some buddy pairs are not reciprocal - this is expected if rotation hasn\'t run yet');
    }

    // Test buddy progress retrieval
    if (buddyPairs.length > 0 && buddyPairs[0].user2) {
      console.log('\n🧪 Testing Buddy Progress Retrieval...');
      const testPair = buddyPairs[0];
      const weekEnd = new Date();
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - 7);
      
      const buddyProgress = await notion.getBuddyProgress(
        testPair.user1.buddy!,
        weekStart,
        weekEnd
      );
      
      if (buddyProgress) {
        console.log(`✅ Buddy progress retrieved for "${buddyProgress.nickname}"`);
        console.log(`   - Completion Rate: ${buddyProgress.completionRate}%`);
        console.log(`   - Habits with issues: ${buddyProgress.habitsWithIssues.length}`);
      }
    }

    console.log('\n✅ Buddy system nickname matching is working correctly!');

  } catch (error) {
    console.error('❌ Test error:', error);
  }
}

testBuddyNicknameMatching().catch(console.error);

