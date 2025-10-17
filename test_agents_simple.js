/**
 * Simple test script to test agents in Discord
 * This will send commands to your personal channel
 */

const { Client, GatewayIntentBits } = require('discord.js');

// Create a simple Discord client to send test messages
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

async function testAgents() {
  console.log('🤖 Testing Multi-Agent System in Discord...\n');

  try {
    // Login to Discord
    await client.login(process.env.DISCORD_TOKEN);
    
    // Wait for client to be ready
    await new Promise((resolve) => {
      client.once('ready', () => {
        console.log('✅ Discord client ready');
        resolve();
      });
    });

    // Your personal channel ID
    const personalChannelId = '1422681618304471131';
    const channel = client.channels.cache.get(personalChannelId);

    if (!channel) {
      console.log('❌ Personal channel not found');
      return;
    }

    console.log('📊 Testing Identity Agent...');
    await channel.send('/identity query:"identity analysis"');
    await new Promise(resolve => setTimeout(resolve, 2000));

    console.log('📊 Testing Accountability Agent...');
    await channel.send('/accountability query:"check in"');
    await new Promise(resolve => setTimeout(resolve, 2000));

    console.log('📊 Testing Group Agent...');
    await channel.send('/group query:"group analysis"');
    await new Promise(resolve => setTimeout(resolve, 2000));

    console.log('📊 Testing Learning Agent...');
    await channel.send('/learning query:"pattern analysis"');
    await new Promise(resolve => setTimeout(resolve, 2000));

    console.log('🎉 All agent commands sent to your personal channel!');
    console.log('Check your Discord channel to see the responses.');

  } catch (error) {
    console.error('❌ Error testing agents:', error);
  } finally {
    await client.destroy();
  }
}

// Run the test
testAgents();
