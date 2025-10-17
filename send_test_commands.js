/**
 * Send test commands to Discord channel
 * This will trigger the agents in your personal channel
 */

const { Client, GatewayIntentBits } = require('discord.js');

// Create Discord client
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

async function sendTestCommands() {
  console.log('🤖 Sending test commands to your Discord channel...\n');

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

    console.log('📊 Sending Identity Agent test...');
    await channel.send('/identity query:"identity analysis"');
    await new Promise(resolve => setTimeout(resolve, 3000));

    console.log('📊 Sending Accountability Agent test...');
    await channel.send('/accountability query:"check in"');
    await new Promise(resolve => setTimeout(resolve, 3000));

    console.log('📊 Sending Group Agent test...');
    await channel.send('/group query:"group analysis"');
    await new Promise(resolve => setTimeout(resolve, 3000));

    console.log('📊 Sending Learning Agent test...');
    await channel.send('/learning query:"pattern analysis"');
    await new Promise(resolve => setTimeout(resolve, 3000));

    console.log('🎉 All test commands sent to your personal channel!');
    console.log('Check your Discord channel to see the agent responses.');

  } catch (error) {
    console.error('❌ Error sending commands:', error);
  } finally {
    await client.destroy();
  }
}

// Run the test
sendTestCommands();
