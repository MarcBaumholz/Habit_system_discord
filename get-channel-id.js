const { Client, GatewayIntentBits } = require('discord.js');
require('dotenv').config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

client.once('ready', () => {
  console.log('✅ Bot connected!');
  console.log('📋 Available channels:');
  
  const guild = client.guilds.cache.get(process.env.DISCORD_GUILD_ID);
  if (guild) {
    guild.channels.cache.forEach(channel => {
      if (channel.type === 0) { // Text channels
        console.log(`• ${channel.name} (ID: ${channel.id})`);
      }
    });
  }
  
  console.log('\n🎯 Looking for accountability group channel...');
  const accountabilityChannel = guild?.channels.cache.find(ch => 
    ch.name.includes('accountability') || ch.name.includes('group')
  );
  
  if (accountabilityChannel) {
    console.log(`✅ Found: ${accountabilityChannel.name} (ID: ${accountabilityChannel.id})`);
    console.log(`\n📝 Add this to your .env file:`);
    console.log(`DISCORD_ACCOUNTABILITY_GROUP=${accountabilityChannel.id}`);
  } else {
    console.log('❌ No accountability group channel found');
  }
  
  process.exit(0);
});

client.login(process.env.DISCORD_BOT_TOKEN);
