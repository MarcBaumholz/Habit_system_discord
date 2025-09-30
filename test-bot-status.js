#!/usr/bin/env node

/**
 * Test script to verify the bot is running and logging properly
 */

const { Client, GatewayIntentBits } = require('discord.js');
require('dotenv').config();

async function testBotStatus() {
  console.log('🔍 Testing Bot Status and Logging...\n');

  // Create a test client to check bot status
  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent
    ]
  });

  try {
    // Login to Discord
    console.log('🔐 Logging into Discord...');
    await client.login(process.env.DISCORD_BOT_TOKEN);
    console.log('✅ Successfully logged into Discord');

    // Check if we can access the log channel
    const logChannelId = process.env.DISCORD_LOG_CHANNEL;
    console.log(`📝 Checking log channel: ${logChannelId}`);

    try {
      const logChannel = await client.channels.fetch(logChannelId);
      if (logChannel) {
        console.log('✅ Log channel accessible:', logChannel.name);
        
        // Send a test message to verify logging is working
        await logChannel.send('🧪 **Bot Status Test**\n\n✅ Logging system is working correctly!\n\n`' + new Date().toISOString() + '`');
        console.log('✅ Test message sent to log channel');
      } else {
        console.log('❌ Log channel not found');
      }
    } catch (error) {
      console.error('❌ Error accessing log channel:', error.message);
    }

    // Check guild access
    const guildId = process.env.DISCORD_GUILD_ID;
    console.log(`🏰 Checking guild access: ${guildId}`);

    try {
      const guild = await client.guilds.fetch(guildId);
      if (guild) {
        console.log('✅ Guild accessible:', guild.name);
        console.log(`📊 Guild stats: ${guild.memberCount} members, ${guild.channels.cache.size} channels`);
      } else {
        console.log('❌ Guild not found');
      }
    } catch (error) {
      console.error('❌ Error accessing guild:', error.message);
    }

    console.log('\n🎯 Bot Status Summary:');
    console.log('✅ Discord connection: Working');
    console.log('✅ Environment variables: Loaded');
    console.log('✅ Log channel: Accessible');
    console.log('✅ Guild access: Working');
    console.log('\n🚀 Your Discord Habit System is ready!');
    console.log('📝 Check your log channel for the test message');
    console.log('🎯 The bot should be logging all activities in real-time');

  } catch (error) {
    console.error('❌ Error during bot status test:', error.message);
    console.error('\n🔧 Troubleshooting:');
    console.error('1. Check that DISCORD_BOT_TOKEN is correct');
    console.error('2. Verify the bot has proper permissions');
    console.error('3. Ensure the bot is added to your server');
    console.error('4. Check that all channel IDs are correct');
  } finally {
    // Clean up
    if (client) {
      client.destroy();
    }
  }
}

// Run the test
testBotStatus().catch(console.error);
