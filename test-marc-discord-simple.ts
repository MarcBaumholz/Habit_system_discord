/**
 * Simple Test - Send Messages to Marc's Discord Channel
 * Tests buddy system messages without waiting for AI
 */

import dotenv from 'dotenv';
dotenv.config();

import { Client, GatewayIntentBits, TextChannel } from 'discord.js';
import { NotionClient } from './src/notion/client';

async function testMarcDiscordSimple() {
  console.log('🧪 Testing Marc and Buddy - Discord Messages (Simple)\n');

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

    // Get Marc's user data
    console.log('1️⃣ Getting Marc\'s user data...');
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

    // Get Marc's personal channel
    const marcChannel = client.channels.cache.get(marc.personalChannelId) as TextChannel;
    if (!marcChannel) {
      console.error('❌ Marc\'s personal channel not found in Discord!');
      await client.destroy();
      return;
    }

    // Test 1: Send test message
    console.log('2️⃣ Sending test message to Marc\'s channel...');
    await marcChannel.send('🧪 **Buddy System Test Starting...**\n\nTesting all buddy system functionality for Marc and his buddy...\n');
    console.log('✅ Test message sent\n');

    // Get Marc's buddy
    let buddy = null;
    if (marc.buddy) {
      console.log(`3️⃣ Getting Marc's buddy "${marc.buddy}"...`);
      buddy = await notion.getUserByNickname(marc.buddy);
      if (buddy) {
        console.log(`✅ Found buddy: ${buddy.name} (${buddy.nickname || 'no nickname'})\n`);
      }
    }

    // Test 2: Get and display buddy progress
    if (buddy) {
      console.log('4️⃣ Getting buddy progress...');
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

${buddyProgress.habitsWithIssues.length > 0 ? `\n⚠️ **Habits Needing Attention:**\n${buddyProgress.habitsWithIssues.map(issue => `- ${issue.habitName}: ${issue.actualFrequency}/${issue.targetFrequency} (Goal: ${issue.goal})`).join('\n')}` : '\n✅ All habits on track!'}`;

        await marcChannel.send(progressMessage);
        console.log('✅ Buddy progress sent to Discord\n');
      }
    }

    // Test 3: Test buddy notification
    if (buddy) {
      console.log('5️⃣ Testing buddy notification...');
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

    // Test 4: Simulate weekly analysis message format
    console.log('6️⃣ Sending simulated weekly analysis format...');
    const simulatedAnalysis = `🤖 **Weekly Analysis - ${new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}**

## 📊 Weekly Habit Analysis

This is a test of the weekly analysis format. In production, this would include:
- Your personal progress analysis
- Your buddy ${buddy?.nickname || 'buddy'}'s progress
- Adaptive goals recommendations
- Next steps and coaching advice

**Confidence Score:** 85%

**Next Steps:**
1. Review your habit completion rates
2. Check in with your buddy about their progress
3. Plan improvements for next week`;

    await marcChannel.send(simulatedAnalysis);
    console.log('✅ Simulated analysis sent\n');

    // Summary
    await marcChannel.send('✅ **Buddy System Test Complete!**\n\nAll message formats tested successfully. Check the messages above to verify they display correctly in Discord.');
    
    console.log('📊 Test Summary:');
    console.log('   ✅ Test message sent');
    console.log('   ✅ Buddy progress message sent');
    console.log('   ✅ Buddy notification sent (if applicable)');
    console.log('   ✅ Weekly analysis format tested');
    console.log('\n✅ All tests completed! Check Marc\'s Discord channel to see the messages.');

    // Wait before closing
    await new Promise(resolve => setTimeout(resolve, 3000));
    await client.destroy();

  } catch (error) {
    console.error('❌ Test error:', error);
    if (error instanceof Error) {
      console.error('   Error:', error.message);
    }
    await client.destroy();
  }
}

testMarcDiscordSimple().catch(console.error);

