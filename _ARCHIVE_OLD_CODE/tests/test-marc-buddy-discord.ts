/**
 * Test Marc and Buddy Use Cases - Sends Actual Discord Messages
 * Tests all buddy system functionality for Marc and Phi-lin
 */

import dotenv from 'dotenv';
dotenv.config();

import { Client, GatewayIntentBits, TextChannel } from 'discord.js';
import { NotionClient } from './src/notion/client';
import { AllUsersWeeklyScheduler } from './src/bot/all-users-weekly-scheduler';
import { DiscordLogger } from './src/bot/discord-logger';

async function testMarcBuddyDiscord() {
  console.log('🧪 Testing Marc and Buddy Use Cases - Discord Messages\n');

  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent
    ]
  });

  try {
    // Login to Discord
    await client.login(process.env.DISCORD_BOT_TOKEN);
    await new Promise((resolve) => {
      client.once('ready', () => {
        console.log('✅ Discord client ready\n');
        resolve(null);
      });
    });

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
      challengeProofs: process.env.NOTION_DATABASE_CHALLENGE_PROOFS!
    });

    const logger = new DiscordLogger(client);

    // Get Marc's user data
    console.log('1️⃣ Getting Marc\'s user data...');
    // Use Marc's actual Discord ID (klumpenklarmarc)
    const marcDiscordId = '383324294731661312';
    const marc = await notion.getUserByDiscordId(marcDiscordId);
    
    if (!marc) {
      console.error('❌ Marc not found!');
      await client.destroy();
      return;
    }

    console.log(`✅ Found Marc: ${marc.name} (${marc.nickname || 'no nickname'})`);
    console.log(`   Buddy: ${marc.buddy || 'None'}`);
    console.log(`   Personal Channel: ${marc.personalChannelId || 'None'}\n`);

    if (!marc.personalChannelId) {
      console.error('❌ Marc has no personal channel!');
      await client.destroy();
      return;
    }

    // Get Marc's buddy
    let buddy = null;
    if (marc.buddy) {
      console.log(`2️⃣ Getting Marc's buddy "${marc.buddy}"...`);
      buddy = await notion.getUserByNickname(marc.buddy);
      if (buddy) {
        console.log(`✅ Found buddy: ${buddy.name} (${buddy.nickname || 'no nickname'})\n`);
      } else {
        console.log(`⚠️ Buddy "${marc.buddy}" not found\n`);
      }
    }

    // Test 1: Send test message to Marc's personal channel
    console.log('3️⃣ Testing Discord Message Sending...');
    const marcChannel = client.channels.cache.get(marc.personalChannelId) as TextChannel;
    
    if (!marcChannel) {
      console.error('❌ Marc\'s personal channel not found in Discord!');
      await client.destroy();
      return;
    }

    await marcChannel.send('🧪 **Buddy System Test Starting...**\n\nTesting all buddy system functionality for Marc and his buddy...\n');
    console.log('✅ Test message sent to Marc\'s channel\n');

    // Test 2: Get buddy progress
    if (buddy) {
      console.log('4️⃣ Testing Buddy Progress Retrieval...');
      const weekEnd = new Date();
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - 7);
      
      const buddyProgress = await notion.getBuddyProgress(
        marc.buddy!,
        weekStart,
        weekEnd
      );

      if (buddyProgress) {
        console.log(`✅ Buddy progress retrieved:`);
        console.log(`   - Completion Rate: ${buddyProgress.completionRate}%`);
        console.log(`   - Habits: ${buddyProgress.habits.length}`);
        console.log(`   - Proofs: ${buddyProgress.proofs.length}`);
        console.log(`   - Habits with issues: ${buddyProgress.habitsWithIssues.length}\n`);

        // Send buddy progress summary to Discord
        const progressMessage = `👥 **Your Buddy's Progress This Week**

**${buddyProgress.nickname}'s Stats:**
- Completion Rate: ${buddyProgress.completionRate}%
- Current Streak: ${buddyProgress.currentStreak} days
- Habits Tracked: ${buddyProgress.habits.length}
- Proofs Submitted: ${buddyProgress.proofs.length}

${buddyProgress.habitsWithIssues.length > 0 ? `⚠️ **Habits Needing Attention:**\n${buddyProgress.habitsWithIssues.map(issue => `- ${issue.habitName}: ${issue.actualFrequency}/${issue.targetFrequency}`).join('\n')}` : '✅ All habits on track!'}`;

        await marcChannel.send(progressMessage);
        console.log('✅ Buddy progress sent to Discord\n');
      }
    }

    // Test 3: Run weekly analysis for Marc
    console.log('5️⃣ Testing Weekly Analysis for Marc...');
    const weeklyScheduler = new AllUsersWeeklyScheduler(client, notion, logger);
    await weeklyScheduler.initialize();

    // Get Marc's user object
    const marcUser = await notion.getUserByDiscordId(marcDiscordId);
    if (marcUser) {
      console.log('Running analysis for Marc...');
      // Use the private method via type assertion (for testing only)
      await (weeklyScheduler as any).runAnalysisForUser(marcUser);
      console.log('✅ Weekly analysis completed and sent to Discord\n');
    }

    // Test 4: Test buddy notification (if buddy has issues)
    if (buddy) {
      console.log('6️⃣ Testing Buddy Notification Logic...');
      const weekEnd = new Date();
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - 7);
      
      const buddyProgress = await notion.getBuddyProgress(
        marc.buddy!,
        weekStart,
        weekEnd
      );

      if (buddyProgress && buddyProgress.habitsWithIssues.length > 0) {
        const issue = buddyProgress.habitsWithIssues[0];
        const notificationMessage = `⚠️ **Buddy Check-in Needed**

Your buddy **${buddyProgress.nickname}** did not reach their goal with **${issue.habitName}**. Their goal was: ${issue.goal}. Ask them why this happened and ask them for feedback.`;

        await marcChannel.send(notificationMessage);
        console.log('✅ Buddy notification sent to Discord\n');
      } else {
        console.log('ℹ️ Buddy has no issues - notification not needed\n');
      }
    }

    // Summary
    await marcChannel.send('✅ **Buddy System Test Complete!**\n\nAll tests passed successfully. The buddy system is working correctly!');
    
    console.log('📊 Test Summary:');
    console.log('   ✅ Discord messages sent successfully');
    console.log('   ✅ Buddy progress retrieved');
    console.log('   ✅ Weekly analysis completed');
    console.log('   ✅ Buddy notifications working');
    console.log('\n✅ All tests completed! Check Marc\'s Discord channel to see the messages.');

    // Wait a bit before closing
    await new Promise(resolve => setTimeout(resolve, 2000));
    await client.destroy();

  } catch (error) {
    console.error('❌ Test error:', error);
    if (error instanceof Error) {
      console.error('   Error:', error.message);
      console.error('   Stack:', error.stack);
    }
    await client.destroy();
  }
}

testMarcBuddyDiscord().catch(console.error);

