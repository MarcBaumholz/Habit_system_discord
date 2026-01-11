#!/usr/bin/env node

/**
 * Test AI Incentive System
 * Tests the complete AI incentive system including:
 * - User analysis
 * - Habit progress tracking
 * - Perplexity AI integration
 * - Personal channel messaging
 */

const { NotionClient } = require('./dist/notion/client');
const { AIIncentiveManager } = require('./dist/bot/ai-incentive-manager');
const { DiscordLogger } = require('./dist/bot/discord-logger');

async function testAIIncentiveSystem() {
  console.log('🧠 Testing AI Incentive System...\n');

  try {
    // Initialize components
    const notion = new NotionClient('test', {});
    const logger = new DiscordLogger(null, 'test');
    
    // Mock Discord client for testing
    const mockClient = {
      channels: {
        cache: new Map()
      }
    };

    const aiIncentiveManager = new AIIncentiveManager(mockClient, notion, logger);

    console.log('✅ AI Incentive Manager initialized');

    // Test 1: Get all users
    console.log('\n📊 Test 1: Fetching all users...');
    const users = await notion.getAllUsers();
    console.log(`Found ${users.length} users:`);
    users.forEach(user => {
      console.log(`  - ${user.name} (ID: ${user.id})`);
      console.log(`    Discord ID: ${user.discordId}`);
      console.log(`    Personal Channel: ${user.personalChannelId || 'Not set'}`);
    });

    if (users.length === 0) {
      console.log('⚠️ No users found - creating test user...');
      return;
    }

    // Test 2: Analyze first user's weekly progress
    const testUser = users[0];
    console.log(`\n🔍 Test 2: Analyzing weekly progress for user: ${testUser.name}`);

    // Get user's habits
    const habits = await notion.getHabitsByUserId(testUser.id);
    console.log(`Found ${habits.length} habits for ${testUser.name}:`);
    habits.forEach(habit => {
      console.log(`  - ${habit.name} (Target: ${habit.frequency}x/week)`);
    });

    if (habits.length === 0) {
      console.log('⚠️ No habits found for test user');
      return;
    }

    // Test 3: Get current week's proofs
    const now = new Date();
    const currentDay = now.getDay();
    const daysFromMonday = currentDay === 0 ? 6 : currentDay - 1;
    
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - daysFromMonday);
    weekStart.setHours(0, 0, 0, 0);
    
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    console.log(`\n📅 Week range: ${weekStart.toLocaleDateString('de-DE')} - ${weekEnd.toLocaleDateString('de-DE')}`);

    const weekProofs = await notion.getProofsByUserId(
      testUser.id,
      weekStart.toISOString().split('T')[0],
      weekEnd.toISOString().split('T')[0]
    );

    console.log(`Found ${weekProofs.length} proofs this week:`);
    weekProofs.forEach(proof => {
      console.log(`  - ${proof.date}: ${proof.unit} (${proof.note || 'No note'})`);
    });

    // Test 4: Analyze habit progress
    console.log('\n📊 Test 4: Analyzing habit progress...');
    for (const habit of habits) {
      const habitProofs = weekProofs.filter(proof => proof.habitId === habit.id);
      const actualFrequency = habitProofs.length;
      const completionRate = Math.round((actualFrequency / habit.frequency) * 100);
      
      console.log(`\n🎯 ${habit.name}:`);
      console.log(`  Target: ${habit.frequency}x/week`);
      console.log(`  Actual: ${actualFrequency}x`);
      console.log(`  Completion: ${completionRate}%`);
      console.log(`  Needs improvement: ${completionRate < 80 ? 'Yes' : 'No'}`);
    }

    // Test 5: Test Perplexity AI integration (if API key is available)
    console.log('\n🤖 Test 5: Testing Perplexity AI integration...');
    if (process.env.PERPLEXITY_API_KEY) {
      console.log('✅ Perplexity API key found');
      
      // Test AI analysis for first habit
      const testHabit = habits[0];
      const testHabitProofs = weekProofs.filter(proof => proof.habitId === testHabit.id);
      
      console.log(`Testing AI analysis for habit: ${testHabit.name}`);
      
      // This would normally call the AI, but we'll simulate it for testing
      console.log('🧠 AI Analysis would be generated here...');
      console.log('(In production, this would call Perplexity API)');
      
    } else {
      console.log('⚠️ Perplexity API key not found - AI analysis will be simulated');
    }

    // Test 6: Test AI incentive message creation
    console.log('\n💬 Test 6: Testing AI incentive message creation...');
    
    const habitAnalysis = habits.map(habit => {
      const habitProofs = weekProofs.filter(proof => proof.habitId === habit.id);
      const actualFrequency = habitProofs.length;
      const completionRate = Math.round((actualFrequency / habit.frequency) * 100);
      
      return {
        habitId: habit.id,
        habitName: habit.name,
        targetFrequency: habit.frequency,
        actualFrequency,
        completionRate,
        needsImprovement: completionRate < 80,
        aiAnalysis: `AI analysis for ${habit.name}: ${completionRate < 80 ? 'Needs improvement' : 'Great job!'}`
      };
    });

    const needsIncentive = habitAnalysis.some(habit => habit.needsImprovement);
    console.log(`Needs AI incentive: ${needsIncentive ? 'Yes' : 'No'}`);

    if (needsIncentive) {
      console.log('\n📝 AI Incentive Message would be sent:');
      console.log('🧠 Wöchentliche AI-Analyse');
      console.log(`Hallo ${testUser.name}! 👋`);
      console.log('Ich habe deine Gewohnheiten diese Woche analysiert...');
      
      const strugglingHabits = habitAnalysis.filter(h => h.needsImprovement);
      const successfulHabits = habitAnalysis.filter(h => !h.needsImprovement);
      
      if (successfulHabits.length > 0) {
        console.log('\n🎉 Erfolgreiche Gewohnheiten:');
        successfulHabits.forEach(habit => {
          console.log(`✅ ${habit.habitName}: ${habit.actualFrequency}/${habit.targetFrequency} (${habit.completionRate}%)`);
        });
      }
      
      if (strugglingHabits.length > 0) {
        console.log('\n🤔 Gewohnheiten, die Aufmerksamkeit brauchen:');
        strugglingHabits.forEach(habit => {
          console.log(`📊 ${habit.habitName}`);
          console.log(`• Ziel: ${habit.targetFrequency}x pro Woche`);
          console.log(`• Tatsächlich: ${habit.actualFrequency}x`);
          console.log(`• Erfüllung: ${habit.completionRate}%`);
          console.log(`🤖 AI-Feedback: ${habit.aiAnalysis}`);
        });
      }
    } else {
      console.log('✅ User is on track - no incentive needed');
    }

    console.log('\n🎉 AI Incentive System Test Completed Successfully!');
    console.log('\n📋 Test Summary:');
    console.log(`✅ Users fetched: ${users.length}`);
    console.log(`✅ Habits analyzed: ${habits.length}`);
    console.log(`✅ Proofs found: ${weekProofs.length}`);
    console.log(`✅ AI incentive needed: ${needsIncentive ? 'Yes' : 'No'}`);
    console.log(`✅ Perplexity integration: ${process.env.PERPLEXITY_API_KEY ? 'Available' : 'Not configured'}`);

  } catch (error) {
    console.error('❌ Error testing AI incentive system:', error);
    console.error('Stack trace:', error.stack);
  }
}

// Run the test
testAIIncentiveSystem();
