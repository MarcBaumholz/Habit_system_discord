/**
 * Trigger Weekly Reflection Whiteboard Now
 *
 * Posts the whiteboard embed (Add / View buttons) to the accountability channel
 * immediately, without waiting for the Sunday 20:30 cron. Use for manual testing.
 *
 * Prerequisites: .env with DISCORD_BOT_TOKEN, DISCORD_ACCOUNTABILITY_GROUP,
 * NOTION_TOKEN, and the NOTION_DATABASE_* vars (same as the main bot).
 *
 * Usage:
 *   npx ts-node trigger-whiteboard-now.ts
 *   npm run trigger-whiteboard
 */

import { Client, GatewayIntentBits } from 'discord.js';
import * as dotenv from 'dotenv';
import { NotionClient } from './src/notion/client';
import { WhiteboardScheduler } from './src/bot/whiteboard-scheduler';
import { DiscordLogger } from './src/bot/discord-logger';

dotenv.config();

async function main() {
  console.log('🪞 Trigger Whiteboard Now — posting to accountability channel\n');
  console.log('='.repeat(60));

  const token = process.env.DISCORD_BOT_TOKEN;
  const accountabilityId = process.env.DISCORD_ACCOUNTABILITY_GROUP;

  if (!token) {
    console.error('❌ DISCORD_BOT_TOKEN is required.');
    process.exit(1);
  }
  if (!accountabilityId) {
    console.error('❌ DISCORD_ACCOUNTABILITY_GROUP is required.');
    process.exit(1);
  }
  if (!process.env.NOTION_TOKEN) {
    console.error('❌ NOTION_TOKEN is required.');
    process.exit(1);
  }

  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent
    ]
  });

  await client.login(token);
  await new Promise<void>((resolve) => client.once('ready', () => resolve()));
  console.log('✅ Discord client ready\n');

  const databaseIds = {
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
  };

  const notion = new NotionClient(process.env.NOTION_TOKEN!, databaseIds);
  const logger = new DiscordLogger(client);
  const scheduler = new WhiteboardScheduler(client, notion, logger);

  await scheduler.postWhiteboardNow();

  console.log('\n' + '='.repeat(60));
  console.log('✅ Whiteboard posted. Check the accountability channel.');
  console.log('   Die Buttons funktionieren nur, wenn der Haupt-Bot läuft: npm run start\n');

  client.destroy();
}

main().catch((err) => {
  console.error('\n❌ Error:', err);
  console.error((err as Error).stack);
  process.exit(1);
});
