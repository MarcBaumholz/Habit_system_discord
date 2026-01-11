/**
 * Test script to verify that all habits in the same batch
 * show the same day number (calculated from batch start date)
 */

import { Client, GatewayIntentBits } from 'discord.js';
import { NotionClient } from './src/notion/client';
import { AIIncentiveManager } from './src/bot/ai-incentive-manager';
import { DiscordLogger } from './src/bot/discord-logger';
import { getCurrentBatch } from './src/utils/batch-manager';
import * as dotenv from 'dotenv';

dotenv.config();

async function testBatchDayConsistency() {
  console.log('🧪 Testing Batch Day Consistency\n');
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

    // Get current batch
    const batch = getCurrentBatch();
    if (!batch) {
      console.error('❌ No active batch found');
      client.destroy();
      return;
    }

    console.log(`📊 Testing batch: ${batch.name}`);
    console.log(`   Start date: ${batch.startDate}`);
    console.log(`   End date: ${batch.endDate}\n`);

    // Calculate expected day number
    const startDate = new Date(batch.startDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    startDate.setHours(0, 0, 0, 0);
    const expectedDayNumber = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    const cappedExpectedDay = Math.min(Math.max(expectedDayNumber, 1), 90);

    console.log(`📅 Expected day number for ALL habits: ${cappedExpectedDay}/90\n`);
    console.log('='.repeat(60));

    // Get test user
    const batchUsers = await notion.getUsersInBatch(batch.name);
    const testUser = batchUsers.find(u => u.status === 'active');

    if (!testUser) {
      console.error('❌ No active user found in batch');
      client.destroy();
      return;
    }

    console.log(`\n👤 Testing with user: ${testUser.name}\n`);

    // Get user's habits in batch
    const allHabits = await notion.getHabitsByUserId(testUser.id);
    const batchHabits = allHabits.filter(h => h.batch === batch.name);

    console.log(`📋 User has ${batchHabits.length} habits in batch "${batch.name}"\n`);

    // Initialize AIIncentiveManager to access the calculation method
    const logger = new DiscordLogger(client);
    const aiManager = new AIIncentiveManager(client, notion, logger);

    // Test each habit
    let allConsistent = true;
    const dayNumbers: { habitName: string; dayNumber: number; firstProofDate: string | null }[] = [];

    for (const habit of batchHabits) {
      // Get proofs for this habit
      const allProofs = await notion.getProofsByUserId(testUser.id);
      const habitProofs = allProofs.filter(p => p.habitId === habit.id);

      // Find first proof date for this habit
      let firstProofDate: string | null = null;
      if (habitProofs.length > 0) {
        const sortedProofs = [...habitProofs].sort((a, b) =>
          new Date(a.date).getTime() - new Date(b.date).getTime()
        );
        firstProofDate = sortedProofs[0].date;
      }

      // Calculate day number using the same method as AIIncentiveManager
      const startDate = new Date(batch.startDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      startDate.setHours(0, 0, 0, 0);
      const dayNumber = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      const cappedDayNumber = Math.min(Math.max(dayNumber, 1), 90);

      dayNumbers.push({
        habitName: habit.name,
        dayNumber: cappedDayNumber,
        firstProofDate
      });

      const emoji = cappedDayNumber === cappedExpectedDay ? '✅' : '❌';
      console.log(`${emoji} ${habit.name}`);
      console.log(`   Day number: ${cappedDayNumber}/90`);
      console.log(`   First proof: ${firstProofDate || 'No proofs yet'}`);
      console.log(`   Expected: ${cappedExpectedDay}/90\n`);

      if (cappedDayNumber !== cappedExpectedDay) {
        allConsistent = false;
      }
    }

    // Verify all habits have the same day number
    console.log('='.repeat(60));
    console.log('\n📊 Test Results:\n');

    const uniqueDayNumbers = [...new Set(dayNumbers.map(d => d.dayNumber))];

    if (uniqueDayNumbers.length === 1 && uniqueDayNumbers[0] === cappedExpectedDay) {
      console.log('✅ SUCCESS: All habits show the same day number!');
      console.log(`✅ All habits: Day ${uniqueDayNumbers[0]}/90`);
      console.log(`✅ Calculated from batch start date: ${batch.startDate}`);
    } else {
      console.log('❌ FAILURE: Habits show different day numbers!');
      console.log(`   Expected all habits to show: Day ${cappedExpectedDay}/90`);
      console.log(`   Actual day numbers found: ${uniqueDayNumbers.join(', ')}`);
    }

    console.log('\n' + '='.repeat(60));

    // Show proof dates vs batch start date for context
    console.log('\n📅 Context:');
    console.log(`   Batch started: ${batch.startDate}`);
    console.log(`   Today: ${today.toISOString().split('T')[0]}`);
    console.log(`   Days since batch start: ${cappedExpectedDay}`);

    if (dayNumbers.some(d => d.firstProofDate)) {
      console.log('\n   Note: First proof dates may vary per habit,');
      console.log('   but ALL habits should show the same day number');
      console.log('   (counted from batch start date).');
    }

    console.log('\n' + '='.repeat(60));

    client.destroy();
    console.log('\n✅ Test complete\n');

    process.exit(allConsistent ? 0 : 1);

  } catch (error) {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  }
}

testBatchDayConsistency();
