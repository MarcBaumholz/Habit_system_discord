/**
 * Verify the format of a generated weekly AI report message
 * This script fetches the last message from a user's personal channel
 */

import { Client, GatewayIntentBits, TextChannel } from 'discord.js';
import * as dotenv from 'dotenv';

dotenv.config();

async function verifyMessageFormat() {
  console.log('🔍 Verifying Weekly AI Report Message Format\n');

  try {
    // Initialize Discord client
    const client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
      ]
    });

    await client.login(process.env.DISCORD_BOT_TOKEN!);
    console.log('✅ Discord client logged in\n');

    // Test user's personal channel ID (Marc's channel from the test)
    const testChannelId = '1319684506988556339'; // Marc's personal channel

    const channel = client.channels.cache.get(testChannelId) as TextChannel;
    if (!channel) {
      console.error('❌ Channel not found');
      client.destroy();
      return;
    }

    console.log(`📋 Fetching messages from channel: ${channel.name}\n`);

    // Fetch last 5 messages
    const messages = await channel.messages.fetch({ limit: 5 });

    console.log(`Found ${messages.size} messages\n`);
    console.log('='.repeat(80));
    console.log('LATEST MESSAGE (Weekly AI Report):');
    console.log('='.repeat(80));

    const latestMessage = messages.first();
    if (latestMessage) {
      console.log(`\nSent at: ${latestMessage.createdAt.toLocaleString()}`);
      console.log(`Author: ${latestMessage.author.tag}`);
      console.log(`\nContent:\n`);
      console.log(latestMessage.content);
      console.log('\n' + '='.repeat(80));

      // Check message format
      console.log('\n📊 Format Verification:');
      const hasHeader = latestMessage.content.includes('📊 Wöchentliche Analyse');
      const hasOverview = latestMessage.content.includes('🎯 Übersicht');
      const has90DayProgress = latestMessage.content.includes('/90');
      const hasBuddySection = latestMessage.content.includes('Buddy Check-In');
      const hasNextSteps = latestMessage.content.includes('🚀 Nächste Schritte');
      const hasAIFeedback = latestMessage.content.includes('💡 **AI Feedback:**');

      console.log(`✅ Header present: ${hasHeader ? 'YES' : 'NO'}`);
      console.log(`✅ Overview section: ${hasOverview ? 'YES' : 'NO'}`);
      console.log(`✅ 90-day progress format: ${has90DayProgress ? 'YES (/90 format)' : 'NO'}`);
      console.log(`✅ Buddy Check-In section: ${hasBuddySection ? 'YES' : 'NO'}`);
      console.log(`✅ Next Steps section: ${hasNextSteps ? 'YES' : 'NO'}`);
      console.log(`✅ AI Feedback present: ${hasAIFeedback ? 'YES' : 'NO'}`);

      if (hasHeader && hasOverview && has90DayProgress && hasNextSteps && hasAIFeedback) {
        console.log('\n🎉 Message format is CORRECT!');
      } else {
        console.log('\n⚠️ Some format elements are missing');
      }
    } else {
      console.log('No messages found in channel');
    }

    client.destroy();
    console.log('\n✅ Verification complete');

  } catch (error) {
    console.error('\n❌ Error:', error);
    process.exit(1);
  }
}

verifyMessageFormat()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Error:', error);
    process.exit(1);
  });
