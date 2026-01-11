/**
 * Test script for Weekly Mindmap Generation
 * Generates a personalized mindmap and saves it as PNG
 */

import { Client, GatewayIntentBits } from 'discord.js';
import { NotionClient } from './src/notion/client';
import { AIIncentiveManager } from './src/bot/ai-incentive-manager';
import { DiscordLogger } from './src/bot/discord-logger';
import { getCurrentBatch } from './src/utils/batch-manager';
import * as dotenv from 'dotenv';
import * as fs from 'fs';

dotenv.config();

async function testMindmapGeneration() {
  console.log('🎨 Testing Weekly Mindmap Generation\n');
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

    // Initialize NotionClient
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

    console.log(`📊 Current batch: ${batch.name}`);
    console.log(`   Start date: ${batch.startDate}\n`);

    // Get test user
    const batchUsers = await notion.getUsersInBatch(batch.name);
    const testUser = batchUsers.find(u => u.status === 'active');

    if (!testUser) {
      console.error('❌ No active user found in batch');
      client.destroy();
      return;
    }

    console.log(`👤 Testing with user: ${testUser.name} (${testUser.nickname})\n`);

    // Get current week info
    const now = new Date();
    const currentDay = now.getDay();
    const daysFromMonday = currentDay === 0 ? 6 : currentDay - 1;
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - daysFromMonday);
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    console.log(`📅 Week: ${weekStart.toLocaleDateString('de-DE')} - ${weekEnd.toLocaleDateString('de-DE')}\n`);

    // Get user's habits in batch
    const allHabits = await notion.getHabitsByUserId(testUser.id);
    const batchHabits = allHabits.filter(h => h.batch === batch.name);
    console.log(`📋 User has ${batchHabits.length} habits in batch "${batch.name}"`);

    // Get proofs
    const currentWeekProofs = await notion.getProofsByUserId(
      testUser.id,
      weekStart.toISOString().split('T')[0],
      weekEnd.toISOString().split('T')[0]
    );
    console.log(`📊 User has ${currentWeekProofs.length} proofs this week\n`);

    // Get last week proofs for trend
    const lastWeekStart = new Date(weekStart);
    lastWeekStart.setDate(weekStart.getDate() - 7);
    const lastWeekEnd = new Date(weekEnd);
    lastWeekEnd.setDate(weekEnd.getDate() - 7);
    const lastWeekProofs = await notion.getProofsByUserId(
      testUser.id,
      lastWeekStart.toISOString().split('T')[0],
      lastWeekEnd.toISOString().split('T')[0]
    );

    // Get all proofs
    const allProofs = await notion.getProofsByUserId(testUser.id);

    // Get personality profile
    const personalityProfile = await notion.getUserProfileByDiscordId(testUser.discordId);

    console.log('🔄 Analyzing habits...\n');

    // Use reflection to access private method (for testing purposes)
    const analyzeMethod = (aiManager as any).analyzeHabitsProgressEnhanced.bind(aiManager);
    const habitAnalysis = await analyzeMethod(
      testUser,
      batchHabits,
      currentWeekProofs,
      lastWeekProofs,
      allProofs,
      personalityProfile,
      batch.startDate
    );

    console.log('📊 Habit Analysis Results:');
    habitAnalysis.forEach((h: any, idx: number) => {
      console.log(`   ${idx + 1}. ${h.habitName}`);
      console.log(`      Completion: ${h.completionRate}%`);
      console.log(`      Trend: ${h.trend.direction} ${h.trend.percentChange > 0 ? '+' : ''}${h.trend.percentChange}%`);
      console.log(`      Streak: ${h.streaks.current} days (best: ${h.streaks.best})`);
    });

    console.log('\n🎨 Generating mindmap...\n');

    // Generate mindmap using reflection to access private method
    const generateMethod = (aiManager as any).generateWeeklyMindmap.bind(aiManager);
    const mindmapBuffer = await generateMethod(testUser, habitAnalysis, { weekStart, weekEnd });

    if (mindmapBuffer) {
      // Save to file
      const filename = `weekly-mindmap-${testUser.name}-${Date.now()}.png`;
      fs.writeFileSync(filename, mindmapBuffer);
      console.log(`✅ Mindmap generated and saved to: ${filename}`);
      console.log(`   File size: ${Math.round(mindmapBuffer.length / 1024)} KB`);
      console.log(`\n📸 Open the file to view the mindmap!\n`);

      // Calculate metrics
      const totalCompletion = habitAnalysis.length > 0
        ? Math.round(habitAnalysis.reduce((sum: number, h: any) => sum + h.completionRate, 0) / habitAnalysis.length)
        : 0;
      const daysCompleted = habitAnalysis.reduce((sum: number, h: any) => sum + h.actualFrequency, 0);
      const totalDays = habitAnalysis.reduce((sum: number, h: any) => sum + h.targetFrequency, 0);

      console.log('='.repeat(60));
      console.log('📊 Mindmap Data Summary:');
      console.log('='.repeat(60));
      console.log(`User: ${testUser.nickname || testUser.name}`);
      console.log(`Overall Score: ${totalCompletion}%`);
      console.log(`Days: ${daysCompleted}/${totalDays}`);

      const sortedByRate = [...habitAnalysis].sort((a: any, b: any) => b.completionRate - a.completionRate);
      if (sortedByRate.length > 0) {
        console.log(`Strongest Habit: ${sortedByRate[0].habitName} (${sortedByRate[0].completionRate}%)`);
        console.log(`Weakest Habit: ${sortedByRate[sortedByRate.length - 1].habitName} (${sortedByRate[sortedByRate.length - 1].completionRate}%)`);
      }

      const avgTrendChange = habitAnalysis.length > 0
        ? habitAnalysis.reduce((sum: number, h: any) => sum + h.trend.percentChange, 0) / habitAnalysis.length
        : 0;
      const trend = avgTrendChange > 5 ? '↑' : avgTrendChange < -5 ? '↓' : '→';
      console.log(`Overall Trend: ${trend} (${avgTrendChange > 0 ? '+' : ''}${Math.round(avgTrendChange)}%)`);
      console.log('='.repeat(60));
    } else {
      console.error('❌ Failed to generate mindmap');
    }

    client.destroy();
    console.log('\n✅ Test complete\n');

  } catch (error) {
    console.error('\n❌ Test failed:', error);
    console.error((error as Error).stack);
    process.exit(1);
  }
}

testMindmapGeneration()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Error:', error);
    process.exit(1);
  });
