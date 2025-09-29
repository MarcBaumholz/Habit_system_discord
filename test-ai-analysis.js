const { Client, GatewayIntentBits } = require('discord.js');
require('dotenv').config();

// Test the AI message analysis functionality
async function testAIAnalysis() {
  console.log('🧪 Testing AI Message Analysis System...\n');

  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent
    ]
  });

  client.once('ready', () => {
    console.log('✅ Bot connected successfully!');
    console.log('📊 AI Message Analysis Features:');
    console.log('• Every message in accountability group will be analyzed');
    console.log('• Automatic proof detection based on content');
    console.log('• User and habit validation before processing');
    console.log('• Smart emoji reactions (⭐ for minimal dose, 🎯 for cheat day, ✅ for full proof)');
    console.log('• Automatic Notion integration for detected proofs');
    console.log('\n🎯 Test by sending messages in the accountability group!');
    console.log('Try messages like:');
    console.log('• "Did 30 minutes of meditation"');
    console.log('• "Completed 5 reps of push-ups"');
    console.log('• "Just did a quick 10 minute walk (minimal dose)"');
    console.log('• "Rest day today (cheat day)"');
    console.log('\nThe bot will automatically detect and process these as proofs!');
  });

  client.on('messageCreate', async (message) => {
    if (message.channelId === process.env.DISCORD_ACCOUNTABILITY_GROUP) {
      console.log(`📨 Message detected in accountability group: "${message.content}"`);
      console.log(`👤 From: ${message.author.username}`);
      console.log('🔍 AI analysis would be triggered here...\n');
    }
  });

  try {
    await client.login(process.env.DISCORD_BOT_TOKEN);
  } catch (error) {
    console.error('❌ Error connecting to Discord:', error.message);
  }
}

testAIAnalysis();
