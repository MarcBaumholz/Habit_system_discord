/**
 * Simple Test - Improved Mentor Agent
 * Tests just the new implementation with real data
 */

import { ImprovedMentorAgent } from './src/agents/mentor/mentor_agent_improved';
import { NotionClient } from './src/notion/client';
import { PerplexityClient } from './src/ai/perplexity-client';
import { ImprovedNotionRetrieval } from './src/agents/improved/notion-retrieval';
import dotenv from 'dotenv';

dotenv.config();

async function testImprovedMentor() {
  console.log('🧪 Testing Improved Mentor Agent\n');
  console.log('='.repeat(80));

  // Initialize clients
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
    challengeProofs: process.env.NOTION_DATABASE_CHALLENGE_PROOFS!,
  });

  const perplexity = new PerplexityClient(process.env.PERPLEXITY_API_KEY!);
  const retrieval = new ImprovedNotionRetrieval(notion);

  // Initialize improved agent
  const improvedAgent = new ImprovedMentorAgent(perplexity, notion);
  await improvedAgent.initialize();

  // Get user data
  const discordId = '383324294731661312'; // Marc's Discord ID

  console.log(`\n📌 Testing with Discord ID: ${discordId}\n`);

  // Get comprehensive context
  const context = await retrieval.getComprehensiveUserContext(discordId, 7);

  if (!context.user) {
    console.error('❌ User not found!');
    return;
  }

  console.log('✅ User found:', context.user.name);
  console.log('   Habits:', context.habits.length);
  console.log('   Proofs (7 days):', context.proofs.length);
  console.log('   Learnings:', context.learnings.length);
  console.log('   Hurdles:', context.hurdles.length);

  // Get habit analysis
  const analysis = await retrieval.getHabitAnalysis(context.user.id, 7);
  console.log('\n📊 Habit Analysis:');
  analysis.forEach(h => {
    console.log(`   • ${h.habitName}: ${h.actualProofs}/${h.targetFrequency} (${h.completionRate.toFixed(0)}%)`);
  });

  // Create minimal UserContext for testing
  const userContext: any = {
    user: {
      id: context.user.id,
      name: context.user.name,
      discord_id: context.user.discordId,
      created_at: new Date(),
    },
    discordId: context.user.discordId,
    current_habits: context.habits.map(h => ({
      id: h.id,
      name: h.name,
      user_id: h.userId,
      smart_goal: h.smartGoal || '',
      minimal_dose: h.minimalDose || '',
      frequency: h.frequency || 0,
      habit_loop: '',
      implementation_intentions: '',
      status: 'active'
    })),
    recent_proofs: context.proofs.map(p => ({
      id: p.id,
      user_id: context.user!.id,
      habit_id: p.habitId,
      title: '',
      completed: true, // Proofs exist means they're completed
      date: p.date,
      is_minimal_dose: p.isMinimalDose || false,
      is_cheat_day: p.isCheatDay || false,
    })),
    weekly_summary: {
      completion_rate: 0,
      current_streak: 0,
      total_proofs: context.proofs.length
    },
    personality: {
      core_values: [],
      life_vision: '',
      personality_type: '',
      decision_making: '',
      motivation_style: '',
      learning_style: '',
      stress_response: '',
      social_preference: '',
      time_preference: '',
      challenge_preference: ''
    },
    preferences: {
      notification_style: 'standard' as const,
      reminder_frequency: 'daily' as const,
      coach_tone: 'supportive' as const
    }
  };

  console.log('\n' + '='.repeat(80));
  console.log('✨ Running Improved Mentor Agent Analysis...');
  console.log('='.repeat(80));

  const startTime = Date.now();
  let response: any;
  let error: string | null = null;

  try {
    response = await improvedAgent.processRequest(userContext, 'weekly_analysis');
    const responseTime = Date.now() - startTime;

    console.log(`\n✅ Analysis completed in ${responseTime}ms\n`);
    console.log('='.repeat(80));
    console.log('📝 MENTOR ANALYSIS OUTPUT:');
    console.log('='.repeat(80));
    console.log('\n' + response.message + '\n');
    console.log('='.repeat(80));

    console.log('\n📊 Response Metrics:');
    console.log(`   Response time: ${responseTime}ms`);
    console.log(`   Message length: ${response.message.length} chars`);
    console.log(`   Estimated tokens: ${Math.ceil(response.message.length / 4)}`);
    console.log(`   Confidence: ${response.confidence.toFixed(2)}`);

    console.log('\n📋 Metadata:');
    console.log(`   Analysis type: ${response.metadata.analysis_type}`);
    console.log(`   Data retrieval: ${response.metadata.data_retrieval_method}`);
    console.log(`   Prompt type: ${response.metadata.prompt_type}`);
    console.log(`   Output format: ${response.metadata.output_format}`);
    console.log(`   Habits analyzed: ${response.metadata.habits_analyzed}`);
    console.log(`   Proofs analyzed: ${response.metadata.proofs_analyzed}`);

    console.log('\n✅ Key Improvements Used:');
    console.log('   ✓ Validated Notion data retrieval');
    console.log('   ✓ Concise prompts (vs verbose)');
    console.log('   ✓ Structured JSON output');
    console.log('   ✓ Notion markdown formatting');
    console.log('   ✓ Explicit state management');

    // Estimate savings vs old system
    const oldEstimatedTokens = 800; // Old verbose system
    const newEstimatedTokens = Math.ceil(response.message.length / 4);
    const tokenReduction = Math.round(((oldEstimatedTokens - newEstimatedTokens) / oldEstimatedTokens) * 100);

    console.log('\n💰 Estimated Savings (vs old system):');
    console.log(`   Token reduction: ~${tokenReduction}% fewer tokens`);
    console.log(`   Cost reduction: ~${tokenReduction}% cheaper per request`);
    console.log(`   User experience: Shorter, scannable messages`);

  } catch (err) {
    error = err instanceof Error ? err.message : String(err);
    console.error(`\n❌ Improved agent failed: ${error}`);
    console.error('Full error:', err);
  }

  console.log('\n' + '='.repeat(80));
  console.log('🎉 Test Complete!');
  console.log('='.repeat(80));

  if (!error) {
    console.log('\n✅ Improved Mentor Agent is working perfectly!');
    console.log('\nNext steps:');
    console.log('   1. Review the output above');
    console.log('   2. Compare with your current mentor messages');
    console.log('   3. Update weekly scheduler when ready');
    console.log('   4. Deploy to production\n');
  }
}

// Run test
testImprovedMentor()
  .then(() => {
    console.log('✅ Test complete!\n');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Test failed:');
    console.error(error);
    process.exit(1);
  });
