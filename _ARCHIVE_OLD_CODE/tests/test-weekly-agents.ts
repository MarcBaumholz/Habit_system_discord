/**
 * Test Script for Weekly Agent Scheduler
 * 
 * This script allows you to test individual agents and the complete weekly analysis
 * without waiting for the Wednesday 9am cron schedule.
 * 
 * Usage:
 *   npx ts-node test-weekly-agents.ts [agent-name]
 * 
 * Examples:
 *   npx ts-node test-weekly-agents.ts          # Test all agents
 *   npx ts-node test-weekly-agents.ts mentor   # Test only Mentor Agent
 *   npx ts-node test-weekly-agents.ts identity # Test only Identity Agent
 */

import dotenv from 'dotenv';
import { Client, GatewayIntentBits } from 'discord.js';
import { NotionClient } from './src/notion/client';
import { DiscordLogger } from './src/bot/discord-logger';
import { WeeklyAgentScheduler } from './src/bot/weekly-agent-scheduler';

// Load environment variables
dotenv.config();

async function main() {
  console.log('🧪 Starting Weekly Agent Test...\n');

  // Get agent name from command line args
  const agentName = process.argv[2]?.toLowerCase();

  // Validate required environment variables
  const requiredEnvVars = [
    'DISCORD_BOT_TOKEN',
    'NOTION_TOKEN',
    'PERPLEXITY_API_KEY',
    'MARC_DISCORD_CHANNEL',
    'MARC_DISCORD_USER_ID'
  ];

  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      console.error(`❌ Missing required environment variable: ${envVar}`);
      process.exit(1);
    }
  }

  // Initialize Discord client
  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
    ],
  });

  // Initialize Notion client
  const notion = new NotionClient(process.env.NOTION_TOKEN!, {
    users: process.env.NOTION_DATABASE_USERS!,
    habits: process.env.NOTION_DATABASE_HABITS!,
    proofs: process.env.NOTION_DATABASE_PROOFS!,
    learnings: process.env.NOTION_DATABASE_LEARNINGS!,
    hurdles: process.env.NOTION_DATABASE_HURDLES!,
    weeks: process.env.NOTION_DATABASE_WEEKS!,
    groups: process.env.NOTION_DATABASE_GROUPS!
  });

  // Initialize Discord logger
  const logger = new DiscordLogger(client);

  // Initialize weekly agent scheduler
  const scheduler = new WeeklyAgentScheduler(client, notion, logger);

  // Wait for Discord client to be ready
  client.once('ready', async () => {
    console.log('✅ Discord client ready\n');
    console.log(`📊 Target Channel: ${process.env.MARC_DISCORD_CHANNEL}`);
    console.log(`👤 Target User: ${process.env.MARC_DISCORD_USER_ID}\n`);

    try {
      // Initialize all agents
      console.log('🤖 Initializing agents...');
      await scheduler.initialize();
      console.log('✅ All agents initialized successfully\n');

      // Check if specific agent requested
      if (agentName) {
        console.log(`🎯 Testing specific agent: ${agentName}\n`);
        console.log('⚠️  Note: Individual agent testing coming soon');
        console.log('📋 For now, running full weekly analysis...\n');
      } else {
        console.log('🎯 Running full weekly analysis with all 5 agents\n');
      }

      // Display scheduler status
      const status = scheduler.getSchedulerStatus();
      console.log('📅 Scheduler Configuration:');
      console.log(`   Cron: ${status.cronExpression} (${status.description})`);
      console.log(`   Timezone: ${status.timezone}`);
      console.log(`   Target Channel: ${status.targetChannel}\n`);

      console.log('🤖 Active Agents:');
      status.agents.forEach((agent: any) => {
        console.log(`   ${agent.emoji} ${agent.name} - ${agent.status}`);
      });
      console.log('');

      // Run the weekly analysis
      console.log('🚀 Starting weekly analysis...\n');
      console.log('⏳ This may take 1-2 minutes...\n');
      
      await scheduler.triggerWeeklyAnalysis();
      
      console.log('\n✅ Weekly analysis complete!');
      console.log('📨 Check Marc\'s Discord channel for the full report\n');

      // Disconnect
      console.log('👋 Disconnecting...');
      client.destroy();
      process.exit(0);

    } catch (error) {
      console.error('\n❌ Test failed:', error);
      console.error('\nStack trace:', (error as Error).stack);
      client.destroy();
      process.exit(1);
    }
  });

  // Login to Discord
  console.log('🔐 Logging into Discord...');
  await client.login(process.env.DISCORD_BOT_TOKEN!);
}

// Handle errors
process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled promise rejection:', error);
  process.exit(1);
});

process.on('SIGINT', () => {
  console.log('\n\n👋 Test interrupted by user');
  process.exit(0);
});

// Run the test
main().catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});

