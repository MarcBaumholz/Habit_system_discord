/**
 * Test Script - Compare Old vs Improved Mentor Agent
 * Shows before/after outputs side by side
 */

import { MentorAgent } from './src/agents/mentor/mentor_agent';
import { ImprovedMentorAgent } from './src/agents/mentor/mentor_agent_improved';
import { NotionClient } from './src/notion/client';
import { PerplexityClient } from './src/ai/perplexity-client';
import { UserContext } from './src/agents/base/types';
import dotenv from 'dotenv';

dotenv.config();

async function testMentorComparison() {
  console.log('🧪 Testing Mentor Agent: Old vs Improved\n');
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

  // Initialize agents
  const oldAgent = new MentorAgent(perplexity, notion);
  const newAgent = new ImprovedMentorAgent(perplexity, notion);

  await oldAgent.initialize();
  await newAgent.initialize();

  // Prepare user context
  const discordId = '383324294731661312'; // Marc's Discord ID
  const user = await notion.getUserByDiscordId(discordId);

  if (!user) {
    console.error('❌ User not found!');
    return;
  }

  const habits = await notion.getHabitsByUserId(user.id);
  const proofs = await notion.getProofsByUserId(user.id);

  const userContext: UserContext = {
    user: {
      id: user.id,
      name: user.name,
      discordId: user.discordId,
      created_at: user.createdAt || new Date(),
      personality_type: '',
      communication_style: 'direct'
    },
    discordId: user.discordId,
    current_habits: habits,
    recent_proofs: proofs,
    weekly_summary: {
      completion_rate: 0,
      current_streak: 0,
      habits_completed: 0,
      habits_total: habits.length
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
      notification_style: 'standard',
      reminder_frequency: 'daily',
      coach_tone: 'supportive'
    }
  };

  console.log(`\n📌 Testing with user: ${user.name} (${discordId})`);
  console.log(`   Habits: ${habits.length}`);
  console.log(`   Proofs (all time): ${proofs.length}\n`);

  // Test OLD AGENT
  console.log('═'.repeat(80));
  console.log('📊 OLD MENTOR AGENT (Current Implementation)');
  console.log('═'.repeat(80));
  console.log('Running old agent analysis...\n');

  const oldStartTime = Date.now();
  let oldResponse: any;
  let oldError: string | null = null;

  try {
    oldResponse = await oldAgent.processRequest(userContext, 'weekly_analysis');
    const oldTime = Date.now() - oldStartTime;

    console.log(`✅ Old agent completed in ${oldTime}ms\n`);
    console.log('📝 OLD AGENT OUTPUT:\n');
    console.log('-'.repeat(80));
    console.log(oldResponse.message);
    console.log('-'.repeat(80));
    console.log(`\n📊 Old Agent Stats:`);
    console.log(`   Response time: ${oldTime}ms`);
    console.log(`   Message length: ${oldResponse.message.length} chars`);
    console.log(`   Estimated tokens: ${Math.ceil(oldResponse.message.length / 4)}`);
    console.log(`   Confidence: ${oldResponse.confidence}`);
  } catch (error) {
    oldError = error instanceof Error ? error.message : String(error);
    console.error(`❌ Old agent failed: ${oldError}`);
  }

  // Test NEW AGENT
  console.log('\n\n' + '═'.repeat(80));
  console.log('✨ IMPROVED MENTOR AGENT (New Implementation)');
  console.log('═'.repeat(80));
  console.log('Running improved agent analysis...\n');

  const newStartTime = Date.now();
  let newResponse: any;
  let newError: string | null = null;

  try {
    newResponse = await newAgent.processRequest(userContext, 'weekly_analysis');
    const newTime = Date.now() - newStartTime;

    console.log(`✅ Improved agent completed in ${newTime}ms\n`);
    console.log('📝 IMPROVED AGENT OUTPUT:\n');
    console.log('-'.repeat(80));
    console.log(newResponse.message);
    console.log('-'.repeat(80));
    console.log(`\n📊 Improved Agent Stats:`);
    console.log(`   Response time: ${newTime}ms`);
    console.log(`   Message length: ${newResponse.message.length} chars`);
    console.log(`   Estimated tokens: ${Math.ceil(newResponse.message.length / 4)}`);
    console.log(`   Confidence: ${newResponse.confidence}`);
    console.log(`   Data retrieval: ${newResponse.metadata.data_retrieval_method}`);
    console.log(`   Prompt type: ${newResponse.metadata.prompt_type}`);
    console.log(`   Output format: ${newResponse.metadata.output_format}`);
  } catch (error) {
    newError = error instanceof Error ? error.message : String(error);
    console.error(`❌ Improved agent failed: ${newError}`);
  }

  // COMPARISON
  console.log('\n\n' + '═'.repeat(80));
  console.log('📊 COMPARISON SUMMARY');
  console.log('═'.repeat(80));

  if (!oldError && !newError && oldResponse && newResponse) {
    const oldTokens = Math.ceil(oldResponse.message.length / 4);
    const newTokens = Math.ceil(newResponse.message.length / 4);
    const tokenReduction = Math.round(((oldTokens - newTokens) / oldTokens) * 100);

    const oldTime = Date.now() - oldStartTime;
    const newTime = Date.now() - newStartTime;
    const timeImprovement = oldTime > 0 ? Math.round(((oldTime - newTime) / oldTime) * 100) : 0;

    console.log('\n📈 Metrics Comparison:\n');
    console.log('| Metric              | Old      | Improved | Change    |');
    console.log('|---------------------|----------|----------|-----------|');
    console.log(`| Response length     | ${oldResponse.message.length.toString().padEnd(8)} | ${newResponse.message.length.toString().padEnd(8)} | ${tokenReduction >= 0 ? '-' : '+'}${Math.abs(tokenReduction)}%${' '.repeat(Math.max(0, 6 - Math.abs(tokenReduction).toString().length))}|`);
    console.log(`| Estimated tokens    | ${oldTokens.toString().padEnd(8)} | ${newTokens.toString().padEnd(8)} | ${tokenReduction >= 0 ? '-' : '+'}${Math.abs(tokenReduction)}%${' '.repeat(Math.max(0, 6 - Math.abs(tokenReduction).toString().length))}|`);
    console.log(`| Confidence          | ${oldResponse.confidence.toFixed(2).padEnd(8)} | ${newResponse.confidence.toFixed(2).padEnd(8)} | ${(newResponse.confidence > oldResponse.confidence ? '+' : '-') + Math.abs(Math.round((newResponse.confidence - oldResponse.confidence) * 100))}%${' '.repeat(4)}|`);

    console.log('\n✅ Key Improvements:\n');
    if (tokenReduction > 0) {
      console.log(`   ✓ ${tokenReduction}% token reduction (more concise)`);
    }
    console.log('   ✓ Structured JSON output (validated)');
    console.log('   ✓ Notion markdown formatting (bullet points)');
    console.log('   ✓ Data validation and caching (faster future queries)');
    console.log('   ✓ Explicit state management (better debugging)');

    console.log('\n📋 Output Style Comparison:\n');
    console.log('Old Agent:');
    console.log('   - Verbose paragraphs');
    console.log('   - Free-form text');
    console.log('   - No strict length limits');
    console.log('   - Unvalidated output');

    console.log('\nImproved Agent:');
    console.log('   - Notion-style bullets');
    console.log('   - One sentence max per bullet');
    console.log('   - 100-150 char limits enforced');
    console.log('   - Zod schema validation');
    console.log('   - Numbers required for all metrics');
  } else {
    if (oldError) console.log(`\n❌ Old agent error: ${oldError}`);
    if (newError) console.log(`\n❌ Improved agent error: ${newError}`);
  }

  console.log('\n\n' + '═'.repeat(80));
  console.log('🎉 Test Complete!');
  console.log('═'.repeat(80));

  if (!newError) {
    console.log('\n✅ Improved agent is working! You can now:');
    console.log('   1. Review the output differences above');
    console.log('   2. Update weekly scheduler to use ImprovedMentorAgent');
    console.log('   3. Deploy to production when ready\n');
  }
}

// Run test
testMentorComparison()
  .then(() => {
    console.log('\n✅ Test suite complete!\n');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Test failed:');
    console.error(error);
    process.exit(1);
  });
