/**
 * Test Buddy Notification Message
 * Sends a test buddy notification message to Marc's personal channel
 * to preview how the monthly buddy assignment message looks
 */

import { Client, GatewayIntentBits, TextChannel } from 'discord.js';
import * as dotenv from 'dotenv';

dotenv.config();

async function sendTestBuddyMessage() {
  console.log('🧪 Testing Buddy Notification Message\n');

  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent
    ]
  });

  try {
    // Login to Discord
    await client.login(process.env.DISCORD_TOKEN);
    
    // Wait for client to be ready
    await new Promise((resolve) => {
      client.once('ready', () => {
        console.log('✅ Discord client ready');
        resolve(null);
      });
    });

    // Marc's personal channel ID
    const marcChannelId = '1422681618304471131';
    const channel = client.channels.cache.get(marcChannelId) as TextChannel;

    if (!channel) {
      console.log('❌ Marc\'s personal channel not found');
      console.log('   Channel ID:', marcChannelId);
      return;
    }

    console.log(`📤 Sending test buddy message to Marc's channel...\n`);

    // Test buddy notification message (same format as in buddy-rotation-scheduler.ts)
    const testBuddyName = 'Test Buddy';
    const message = `👥 **New Buddy Assignment!**

Your new accountability buddy is **${testBuddyName}**!

You'll be paired together for the next month (4 weeks). Support each other, share your progress, and help each other stay accountable!

💪 **Remember:** Check in with your buddy regularly and celebrate each other's wins!

*Buddy rotation happens monthly on the 1st of each month.*`;

    await channel.send(message);

    console.log('✅ Test buddy message sent successfully!');
    console.log('\n📋 Message Preview:');
    console.log('─'.repeat(50));
    console.log(message);
    console.log('─'.repeat(50));
    console.log('\n✅ Check Marc\'s Discord channel to see the message!');

  } catch (error) {
    console.error('❌ Error sending test message:', error);
  } finally {
    await client.destroy();
  }
}

// Run the test
sendTestBuddyMessage().catch(console.error);



