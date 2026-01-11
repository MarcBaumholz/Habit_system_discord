/**
 * Test Script: Manual Weekly Accountability Report Trigger
 * 
 * This script allows you to manually trigger the weekly accountability report
 * without waiting for the scheduled Sunday 8 PM run.
 * 
 * Usage:
 *   npm run build
 *   node dist/test-weekly-report.js
 * 
 * Or with ts-node:
 *   npx ts-node test-weekly-report.ts
 */

import dotenv from 'dotenv';
import { Client, GatewayIntentBits } from 'discord.js';
import { NotionClient } from './src/notion/client';
import { AccountabilityScheduler } from './src/bot/accountability-scheduler';
import { DiscordLogger } from './src/bot/discord-logger';

// Load environment variables
dotenv.config();

async function main() {
  console.log('🧪 WEEKLY ACCOUNTABILITY REPORT TEST');
  console.log('='.repeat(60));
  console.log('');

  // Validate required environment variables
  const requiredEnvVars = [
    'DISCORD_BOT_TOKEN',
    'NOTION_TOKEN',
    'NOTION_DATABASE_USERS',
    'NOTION_DATABASE_HABITS',
    'NOTION_DATABASE_PROOFS',
    'NOTION_DATABASE_PRICE_POOL',
    'DISCORD_ACCOUNTABILITY_GROUP',
    'PERPLEXITY_API_KEY'
  ];

  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      console.error(`❌ Missing required environment variable: ${envVar}`);
      process.exit(1);
    }
  }

  // Initialize Discord client
  console.log('🔌 Connecting to Discord...');
  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent
    ]
  });

  // Initialize Notion client
  console.log('📚 Initializing Notion client...');
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

  // Initialize logger
  const logger = new DiscordLogger(client);

  // Wait for Discord client to be ready
  await new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('Discord client connection timeout'));
    }, 30000);

    client.once('ready', () => {
      clearTimeout(timeout);
      console.log(`✅ Connected to Discord as ${client.user?.tag}`);
      resolve();
    });

    client.once('error', (error) => {
      clearTimeout(timeout);
      reject(error);
    });

    client.login(process.env.DISCORD_BOT_TOKEN!);
  });

  // Wait a moment for Discord to be fully ready
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Initialize accountability scheduler
  console.log('💰 Initializing Accountability Scheduler...');
  const scheduler = new AccountabilityScheduler(client, notion, logger);

  try {
    await scheduler.initialize();
    console.log('✅ Accountability Scheduler initialized\n');
  } catch (error) {
    console.error('❌ Failed to initialize scheduler:', error);
    await client.destroy();
    process.exit(1);
  }

  // Display scheduler status
  const status = scheduler.getSchedulerStatus();
  console.log('📅 Scheduler Configuration:');
  console.log(`   Cron: ${status.cronExpression} (${status.description})`);
  console.log(`   Timezone: ${status.timezone}`);
  console.log(`   Target Channel: ${status.targetChannel}`);
  console.log('');

  // Trigger the weekly report
  console.log('🚀 Triggering Weekly Accountability Report...');
  console.log('⏳ This will take about 30-60 seconds...\n');

  try {
    await scheduler.triggerAccountabilityCheck();
    console.log('\n✅ Weekly Accountability Report completed successfully!');
    console.log(`📨 Check the accountability channel (${status.targetChannel}) to see the report\n`);
  } catch (error) {
    console.error('\n❌ Weekly Report Test Failed:', error);
    if (error instanceof Error && error.stack) {
      console.error('Stack trace:', error.stack);
    }
    await client.destroy();
    process.exit(1);
  }

  // Cleanup
  await client.destroy();
  console.log('👋 Test completed. Discord client disconnected.');
}

// Run the test
main().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
