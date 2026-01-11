#!/usr/bin/env node

/**
 * Test script for the comprehensive Discord logging system
 * This script tests the logging functionality without requiring a full bot setup
 */

const { Client, GatewayIntentBits } = require('discord.js');
require('dotenv').config();

// Import the DiscordLogger class
const { DiscordLogger } = require('./dist/bot/discord-logger');

async function testLoggingSystem() {
  console.log('🧪 Testing Discord Logging System...\n');

  // Create a test Discord client
  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent
    ]
  });

  // Initialize the logger
  const logger = new DiscordLogger(client);

  // Login to Discord to enable channel access
  console.log('🔐 Logging into Discord...');
  try {
    await client.login(process.env.DISCORD_BOT_TOKEN);
    console.log('✅ Successfully logged into Discord');
  } catch (error) {
    console.error('❌ Failed to login to Discord:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Check that DISCORD_BOT_TOKEN is correct in .env');
    console.log('2. Verify the bot token is valid');
    console.log('3. Ensure the bot has access to the log channel');
    return;
  }

  console.log('✅ DiscordLogger initialized');
  console.log(`📝 Log channel ID: ${process.env.DISCORD_LOG_CHANNEL || 'Not configured'}\n`);

  // Test different types of logs
  console.log('📊 Testing different log types...\n');

  try {
    // Test info log
    console.log('1. Testing INFO log...');
    await logger.info(
      'TEST',
      'Test Info Log',
      'This is a test info message to verify logging functionality',
      {
        testType: 'info',
        timestamp: new Date().toISOString(),
        testData: { key1: 'value1', key2: 'value2' }
      }
    );

    // Test success log
    console.log('2. Testing SUCCESS log...');
    await logger.success(
      'TEST',
      'Test Success Log',
      'This is a test success message',
      {
        testType: 'success',
        operation: 'test_operation',
        result: 'completed'
      }
    );

    // Test warning log
    console.log('3. Testing WARNING log...');
    await logger.warning(
      'TEST',
      'Test Warning Log',
      'This is a test warning message',
      {
        testType: 'warning',
        severity: 'medium',
        action: 'requires_attention'
      }
    );

    // Test error log
    console.log('4. Testing ERROR log...');
    await logger.error(
      'TEST',
      'Test Error Log',
      'This is a test error message',
      {
        testType: 'error',
        errorCode: 'TEST_ERROR_001',
        stack: 'Test stack trace'
      }
    );

    // Test debug log
    console.log('5. Testing DEBUG log...');
    await logger.debug(
      'TEST',
      'Test Debug Log',
      'This is a test debug message',
      {
        testType: 'debug',
        debugInfo: 'Detailed debugging information',
        variables: { var1: 'value1', var2: 'value2' }
      }
    );

    // Test system event log
    console.log('6. Testing SYSTEM event log...');
    await logger.logSystemEvent(
      'Test System Event',
      {
        eventType: 'test_event',
        systemComponent: 'logging_test',
        status: 'completed'
      }
    );

    // Test error logging with Error object
    console.log('7. Testing error logging with Error object...');
    const testError = new Error('This is a test error for logging');
    testError.stack = 'Test stack trace\n  at testFunction (test.js:1:1)\n  at main (test.js:5:1)';
    
    await logger.logError(
      testError,
      'Test Error Context',
      {
        contextData: 'additional context information',
        userId: 'test_user_123',
        operation: 'test_operation'
      }
    );

    console.log('\n✅ All logging tests completed!');
    console.log('\n📋 Test Summary:');
    console.log('- ✅ INFO log test');
    console.log('- ✅ SUCCESS log test');
    console.log('- ✅ WARNING log test');
    console.log('- ✅ ERROR log test');
    console.log('- ✅ DEBUG log test');
    console.log('- ✅ SYSTEM event log test');
    console.log('- ✅ Error object logging test');

    console.log('\n🎯 Next Steps:');
    console.log('1. Check your Discord log channel to see all the test messages');
    console.log('2. Start the bot with: npm run dev');
    console.log('3. Interact with the bot to see real-time logging');
    console.log('4. Monitor the log channel for all Discord activities');

  } catch (error) {
    console.error('❌ Error during logging tests:', error);
    console.error('\n🔧 Troubleshooting:');
    console.error('1. Make sure DISCORD_LOG_CHANNEL is set in your .env file');
    console.error('2. Verify the bot has access to the log channel');
    console.error('3. Check that the Discord bot token is valid');
    console.error('4. Ensure the log channel ID is correct');
  } finally {
    // Clean up the client
    if (client) {
      client.destroy();
    }
  }
}

// Run the test
testLoggingSystem().catch(console.error);
