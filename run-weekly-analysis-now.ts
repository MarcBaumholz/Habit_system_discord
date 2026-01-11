/**
 * Run Weekly Analysis Now
 * Manually trigger the weekly AI incentive analysis for all active users in current batch
 */

import { Client, GatewayIntentBits } from 'discord.js';
import { NotionClient } from './src/notion/client';
import { AIIncentiveManager } from './src/bot/ai-incentive-manager';
import { DiscordLogger } from './src/bot/discord-logger';
import * as dotenv from 'dotenv';

dotenv.config();

async function runWeeklyAnalysisNow() {
  console.log('🚀 Running Weekly Analysis for All Active Users\n');
  console.log('='.repeat(60));

  try {
    // Initialize Discord client
    const client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
      ]
    });

    await client.login(process.env.DISCORD_BOT_TOKEN!);
    console.log('✅ Discord client logged in\n');

    // Initialize Notion client
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

    console.log('📊 Starting weekly analysis...\n');
    console.log('='.repeat(60));

    // Run weekly analysis for all active users
    await aiManager.runWeeklyAIIncentiveAnalysis();

    console.log('\n' + '='.repeat(60));
    console.log('✅ Weekly analysis completed for all users!');
    console.log('='.repeat(60));
    console.log('\n📋 Each user received:');
    console.log('   1. 🗺️ Personalized mindmap (PNG)');
    console.log('   2. 📊 Weekly analysis header');
    console.log('   3. 🎯 Overview');
    console.log('   4. 📈 Habit sections with AI feedback');
    console.log('   5. 👥 Buddy check-in');
    console.log('   6. 🚀 Next steps');
    console.log('\n💡 Check user channels to see the complete reports!\n');

    client.destroy();
    console.log('✅ Done\n');

  } catch (error) {
    console.error('\n❌ Error running weekly analysis:', error);
    console.error((error as Error).stack);
    process.exit(1);
  }
}

runWeeklyAnalysisNow()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Error:', error);
    process.exit(1);
  });
