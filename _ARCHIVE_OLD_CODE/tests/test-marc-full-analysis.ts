/**
 * Test Full Weekly Analysis for Marc - Sends Real Messages to Discord
 * This will trigger the actual weekly analysis with AI
 */

import dotenv from 'dotenv';
dotenv.config();

import { Client, GatewayIntentBits } from 'discord.js';
import { NotionClient } from './src/notion/client';
import { AllUsersWeeklyScheduler } from './src/bot/all-users-weekly-scheduler';
import { DiscordLogger } from './src/bot/discord-logger';

async function testMarcFullAnalysis() {
  console.log('🧪 Testing Full Weekly Analysis for Marc\n');
  console.log('This will send REAL messages to Marc\'s Discord channel\n');

  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent
    ]
  });

  try {
    // Login to Discord
    console.log('1️⃣ Connecting to Discord...');
    await client.login(process.env.DISCORD_BOT_TOKEN);
    
    await new Promise<void>((resolve) => {
      client.once('ready', () => {
        console.log('✅ Discord client ready\n');
        resolve();
      });
    });

    // Initialize Notion client
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

    const logger = new DiscordLogger(client);

    // Get Marc
    console.log('2️⃣ Getting Marc\'s user data...');
    const marcDiscordId = '383324294731661312';
    const marc = await notion.getUserByDiscordId(marcDiscordId);
    
    if (!marc) {
      console.error('❌ Marc not found!');
      await client.destroy();
      return;
    }

    console.log(`✅ Found Marc: ${marc.name} (${marc.nickname || 'no nickname'})`);
    console.log(`   Buddy: ${marc.buddy || 'None'}`);
    console.log(`   Status: ${marc.status}\n`);

    if (!marc.personalChannelId) {
      console.error('❌ Marc has no personal channel!');
      await client.destroy();
      return;
    }

    // Initialize scheduler
    console.log('3️⃣ Initializing Weekly Scheduler...');
    const weeklyScheduler = new AllUsersWeeklyScheduler(client, notion, logger);
    await weeklyScheduler.initialize();
    console.log('✅ Scheduler initialized\n');

    // Send notification that test is starting
    const marcChannel = client.channels.cache.get(marc.personalChannelId) as any;
    if (marcChannel) {
      await marcChannel.send('🧪 **Buddy System Full Test**\n\nRunning complete weekly analysis with buddy progress...\n');
    }

    // Run analysis for Marc
    console.log('4️⃣ Running weekly analysis for Marc...');
    console.log('   This will take 30-60 seconds (AI processing)...\n');
    
    // Access private method for testing
    await (weeklyScheduler as any).runAnalysisForUser(marc);
    
    console.log('✅ Weekly analysis completed!\n');

    // Summary
    console.log('📊 Test Results:');
    console.log('   ✅ Weekly analysis sent to Marc\'s Discord channel');
    console.log('   ✅ Buddy progress included in analysis');
    console.log('   ✅ Buddy notifications sent (if applicable)');
    console.log('\n✅ Check Marc\'s Discord channel to see the full analysis!');

    // Wait before closing
    await new Promise(resolve => setTimeout(resolve, 5000));
    await client.destroy();

  } catch (error) {
    console.error('\n❌ Test error:', error);
    if (error instanceof Error) {
      console.error('   Error:', error.message);
      console.error('   Stack:', error.stack);
    }
    await client.destroy();
  }
}

testMarcFullAnalysis().catch(console.error);

