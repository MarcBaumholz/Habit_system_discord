/**
 * Trigger AI Incentive for One User (e.g. klumpenklar channel)
 *
 * Run the weekly AI incentive analysis for a single user by nickname.
 * Use for testing: sends mindmap + weekly report to that user's personal channel.
 *
 * Usage:
 *   npx ts-node trigger-ai-incentive-for-user.ts [nickname]
 *   npx ts-node trigger-ai-incentive-for-user.ts klumpenklarmarc
 *
 * Default nickname: klumpenklarmarc (override via first CLI arg)
 */

import { Client, GatewayIntentBits } from 'discord.js';
import { NotionClient } from './src/notion/client';
import { AIIncentiveManager } from './src/bot/ai-incentive-manager';
import { DiscordLogger } from './src/bot/discord-logger';
import * as dotenv from 'dotenv';

dotenv.config();

const DEFAULT_NICKNAME = 'klumpenklarmarc';

async function main() {
  const nickname = (process.argv[2] || DEFAULT_NICKNAME).trim();
  console.log(`🚀 Trigger AI Incentive for: ${nickname}\n`);
  console.log('='.repeat(60));

  try {
    const client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
      ]
    });

    await client.login(process.env.DISCORD_BOT_TOKEN!);
    await new Promise<void>((res) => client.once('ready', () => res()));
    console.log('✅ Discord client ready\n');

    const databaseIds = {
      users: process.env.NOTION_DATABASE_USERS!,
      habits: process.env.NOTION_DATABASE_HABITS!,
      proofs: process.env.NOTION_DATABASE_PROOFS!,
      learnings: process.env.NOTION_DATABASE_LEARNINGS!,
      hurdles: process.env.NOTION_DATABASE_HURDLES!,
      weeks: process.env.NOTION_DATABASE_WEEKS!,
      groups: process.env.NOTION_DATABASE_GROUPS!,
      personality: process.env.NOTION_DATABASE_PERSONALITY!
    };
    const notion = new NotionClient(process.env.NOTION_TOKEN!, databaseIds);
    const logger = new DiscordLogger(client);
    const aiManager = new AIIncentiveManager(client, notion, logger);

    console.log(`📊 Running AI incentive for @${nickname}...\n`);
    await aiManager.runWeeklyAIIncentiveAnalysisForUser(nickname);

    console.log('\n' + '='.repeat(60));
    console.log(`✅ Done. Check that user's personal channel for the report.\n`);

    client.destroy();
  } catch (error) {
    console.error('\n❌ Error:', error);
    console.error((error as Error).stack);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
