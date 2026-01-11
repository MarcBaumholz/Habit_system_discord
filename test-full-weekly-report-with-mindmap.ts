/**
 * Test full weekly report with mindmap
 * This will send the complete weekly report (mindmap + text) to one user
 */

import { Client, GatewayIntentBits, TextChannel } from 'discord.js';
import { NotionClient } from './src/notion/client';
import { AIIncentiveManager } from './src/bot/ai-incentive-manager';
import { DiscordLogger } from './src/bot/discord-logger';
import { getCurrentBatch } from './src/utils/batch-manager';
import * as dotenv from 'dotenv';

dotenv.config();

async function testFullWeeklyReport() {
  console.log('📨 Testing Full Weekly Report with Mindmap\n');
  console.log('='.repeat(60));

  try {
    // Initialize
    const client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
      ]
    });

    await client.login(process.env.DISCORD_BOT_TOKEN!);
    console.log('✅ Discord client logged in\n');

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

    // Get current batch
    const batch = getCurrentBatch();
    if (!batch) {
      console.error('❌ No active batch found');
      client.destroy();
      return;
    }

    console.log(`📊 Current batch: ${batch.name}\n`);

    // Get test user
    const batchUsers = await notion.getUsersInBatch(batch.name);
    const testUser = batchUsers.find(u => u.status === 'active');

    if (!testUser) {
      console.error('❌ No active user found');
      client.destroy();
      return;
    }

    console.log(`👤 Sending full weekly report to: ${testUser.name} (${testUser.nickname})`);

    if (!testUser.personalChannelId) {
      console.error('❌ User has no personal channel');
      client.destroy();
      return;
    }

    const channel = client.channels.cache.get(testUser.personalChannelId) as TextChannel;
    if (!channel) {
      console.error('❌ Personal channel not found');
      client.destroy();
      return;
    }

    console.log(`📢 Channel: ${channel.name}\n`);

    console.log('='.repeat(60));
    console.log('🚀 Running weekly analysis for user...');
    console.log('='.repeat(60));
    console.log('');

    // Use private method via reflection
    const analyzeMethod = (aiManager as any).analyzeUserWeeklyProgress.bind(aiManager);
    await analyzeMethod(testUser);

    console.log('\n' + '='.repeat(60));
    console.log('✅ Full weekly report sent!');
    console.log('='.repeat(60));
    console.log('\n📋 What was sent:');
    console.log('   1. 🗺️ Personalized mindmap image (PNG)');
    console.log('   2. 📊 Wöchentliche Analyse header');
    console.log('   3. 🎯 Übersicht (overview)');
    console.log('   4. 📈 Individual habit sections with AI feedback');
    console.log('   5. 👥 Buddy Check-In (if buddy exists)');
    console.log('   6. 🚀 Nächste Schritte (AI-powered coaching)');
    console.log('\n' + '='.repeat(60));
    console.log('\n💡 Check the Discord channel to see the complete report!\n');

    client.destroy();
    console.log('✅ Test complete\n');

  } catch (error) {
    console.error('\n❌ Test failed:', error);
    console.error((error as Error).stack);
    process.exit(1);
  }
}

testFullWeeklyReport()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Error:', error);
    process.exit(1);
  });
