/**
 * Token Usage Analysis Test
 *
 * This test measures actual token consumption for each classification type
 * and validates that a 10k token budget is sufficient for full Notion data.
 *
 * Purpose:
 * - Measure tokens for each of 6 classifications
 * - Test raw Notion data token consumption
 * - Identify optimization opportunities
 * - Validate 10k budget feasibility
 */

import { TestFramework } from '../../src/test/test-framework';
import { NotionClient } from '../../src/notion/client';
import { DynamicContextBuilder } from '../../src/ai/dynamic-context-builder';
import { ProfileStorage } from '../../src/ai/profile-storage';
import { ProfileGenerator } from '../../src/ai/profile-generator';
import { QueryClassifier } from '../../src/ai/query-classifier';
import { ContextCompressor } from '../../src/ai/context-compressor';
import { encode } from 'gpt-tokenizer';
import * as dotenv from 'dotenv';

dotenv.config();

const TEST_CHANNEL_ID = process.env.DISCORD_TESTCHANNEL || '1454881425911316572';

// Use the Discord ID from environment or a test user
// Using actual user from database: 383324294731661312
const TEST_USER_DISCORD_ID = process.env.TEST_USER_DISCORD_ID || '383324294731661312';

interface TokenAnalysis {
  classification: string;
  totalTokens: number;
  contextLength: number;
  components: {
    profile?: number;
    habits?: number;
    proofs?: number;
    learnings?: number;
    hurdles?: number;
    personality?: number;
    compressed?: boolean;
  };
}

interface NotionDataAnalysis {
  habits: {
    count: number;
    totalTokens: number;
    tokensPerItem: number;
  };
  proofs: {
    count: number;
    totalTokens: number;
    tokensPerItem: number;
  };
  learnings: {
    count: number;
    totalTokens: number;
    tokensPerItem: number;
  };
  hurdles: {
    count: number;
    totalTokens: number;
    tokensPerItem: number;
  };
  personality: {
    tokens: number;
  };
  total: number;
}

async function runTokenAnalysisTests() {
  const test = new TestFramework('Token Usage Analysis', TEST_CHANNEL_ID);

  const notion = new NotionClient(process.env.NOTION_TOKEN!, {
    users: process.env.NOTION_DATABASE_USERS!,
    habits: process.env.NOTION_DATABASE_HABITS!,
    proofs: process.env.NOTION_DATABASE_PROOFS!,
    learnings: process.env.NOTION_DATABASE_LEARNINGS!,
    hurdles: process.env.NOTION_DATABASE_HURDLES!,
    weeks: process.env.NOTION_DATABASE_WEEKS!,
    groups: process.env.NOTION_DATABASE_GROUPS!,
    personality: process.env.NOTION_DATABASE_PERSONALITY!,
    pricePool: process.env.NOTION_DATABASE_PRICEPOOL || '',
    challengeProofs: process.env.NOTION_DATABASE_CHALLENGEPROOFS || ''
  });
  const profileGenerator = new ProfileGenerator(notion);
  const profileStorage = new ProfileStorage(profileGenerator);
  const queryClassifier = new QueryClassifier();
  const compressor = new ContextCompressor();
  const contextBuilder = new DynamicContextBuilder(
    notion,
    profileStorage,
    queryClassifier,
    compressor
  );

  // Get user ID from Discord ID
  let userId: string | null = null;
  let testResults: any = {};

  test.test('should resolve test user from Discord ID', async () => {
    const user = await notion.getUserByDiscordId(TEST_USER_DISCORD_ID);
    TestFramework.assert(user !== null, `User with Discord ID ${TEST_USER_DISCORD_ID} should exist`);
    userId = user!.id;
    testResults.testUser = {
      discordId: TEST_USER_DISCORD_ID,
      userId: userId,
      name: user!.name
    };
  });

  test.test('should measure token usage for habit_analysis classification', async () => {
    if (!userId) throw new Error('User ID not resolved');

    const query = "How are my habits performing this month?";
    const context = await contextBuilder.buildContext(TEST_USER_DISCORD_ID, query, userId);

    const tokens = encode(context.context).length;

    const analysis: TokenAnalysis = {
      classification: 'habit_analysis',
      totalTokens: tokens,
      contextLength: context.context.length,
      components: {
        compressed: tokens < context.context.length / 4
      }
    };

    testResults.habit_analysis = analysis;

    TestFramework.assert(tokens > 0, 'Should have non-zero token count');
    TestFramework.assert(tokens < 10000, `Tokens (${tokens}) should be under 10k budget`);

    console.log(`\n📊 habit_analysis: ${tokens} tokens (${context.context.length} chars)`);
  });

  test.test('should measure token usage for progress_check classification', async () => {
    if (!userId) throw new Error('User ID not resolved');

    const query = "How am I doing this week?";
    const context = await contextBuilder.buildContext(TEST_USER_DISCORD_ID, query, userId);

    const tokens = encode(context.context).length;

    const analysis: TokenAnalysis = {
      classification: 'progress_check',
      totalTokens: tokens,
      contextLength: context.context.length,
      components: {}
    };

    testResults.progress_check = analysis;

    TestFramework.assert(tokens > 0, 'Should have non-zero token count');
    TestFramework.assert(tokens < 10000, `Tokens (${tokens}) should be under 10k budget`);

    console.log(`📊 progress_check: ${tokens} tokens (${context.context.length} chars)`);
  });

  test.test('should measure token usage for personality_advice classification', async () => {
    if (!userId) throw new Error('User ID not resolved');

    const query = "Are my habits aligned with my personality?";
    const context = await contextBuilder.buildContext(TEST_USER_DISCORD_ID, query, userId);

    const tokens = encode(context.context).length;

    const analysis: TokenAnalysis = {
      classification: 'personality_advice',
      totalTokens: tokens,
      contextLength: context.context.length,
      components: {}
    };

    testResults.personality_advice = analysis;

    TestFramework.assert(tokens > 0, 'Should have non-zero token count');
    TestFramework.assert(tokens < 10000, `Tokens (${tokens}) should be under 10k budget`);

    console.log(`📊 personality_advice: ${tokens} tokens (${context.context.length} chars)`);
  });

  test.test('should measure token usage for hurdle_help classification', async () => {
    if (!userId) throw new Error('User ID not resolved');

    const query = "I'm struggling with staying consistent, can you help?";
    const context = await contextBuilder.buildContext(TEST_USER_DISCORD_ID, query, userId);

    const tokens = encode(context.context).length;

    const analysis: TokenAnalysis = {
      classification: 'hurdle_help',
      totalTokens: tokens,
      contextLength: context.context.length,
      components: {}
    };

    testResults.hurdle_help = analysis;

    TestFramework.assert(tokens > 0, 'Should have non-zero token count');
    TestFramework.assert(tokens < 10000, `Tokens (${tokens}) should be under 10k budget`);

    console.log(`📊 hurdle_help: ${tokens} tokens (${context.context.length} chars)`);
  });

  test.test('should measure token usage for learning_insight classification', async () => {
    if (!userId) throw new Error('User ID not resolved');

    const query = "What patterns have I learned recently?";
    const context = await contextBuilder.buildContext(TEST_USER_DISCORD_ID, query, userId);

    const tokens = encode(context.context).length;

    const analysis: TokenAnalysis = {
      classification: 'learning_insight',
      totalTokens: tokens,
      contextLength: context.context.length,
      components: {}
    };

    testResults.learning_insight = analysis;

    TestFramework.assert(tokens > 0, 'Should have non-zero token count');
    TestFramework.assert(tokens < 10000, `Tokens (${tokens}) should be under 10k budget`);

    console.log(`📊 learning_insight: ${tokens} tokens (${context.context.length} chars)`);
  });

  test.test('should measure token usage for general classification', async () => {
    if (!userId) throw new Error('User ID not resolved');

    const query = "Thanks for your help!";
    const context = await contextBuilder.buildContext(TEST_USER_DISCORD_ID, query, userId);

    const tokens = encode(context.context).length;

    const analysis: TokenAnalysis = {
      classification: 'general',
      totalTokens: tokens,
      contextLength: context.context.length,
      components: {}
    };

    testResults.general = analysis;

    TestFramework.assert(tokens > 0, 'Should have non-zero token count');
    TestFramework.assert(tokens < 10000, `Tokens (${tokens}) should be under 10k budget`);

    console.log(`📊 general: ${tokens} tokens (${context.context.length} chars)\n`);
  });

  test.test('should measure raw Notion data token consumption', async () => {
    if (!userId) throw new Error('User ID not resolved');

    // Fetch ALL data unfiltered
    const user = await notion.getUserByDiscordId(TEST_USER_DISCORD_ID);
    const habits = await notion.getHabitsByUserId(userId);
    const proofs = await notion.getProofsByUserId(userId);
    const learnings = await notion.getLearningsByUserId(userId);
    const hurdles = await notion.getHurdlesByUserId(userId);
    const personality = await notion.getUserProfileByDiscordId(TEST_USER_DISCORD_ID);

    const notionAnalysis: NotionDataAnalysis = {
      habits: {
        count: habits.length,
        totalTokens: habits.length > 0 ? encode(JSON.stringify(habits)).length : 0,
        tokensPerItem: habits.length > 0 ? encode(JSON.stringify(habits[0])).length : 0
      },
      proofs: {
        count: proofs.length,
        totalTokens: proofs.length > 0 ? encode(JSON.stringify(proofs)).length : 0,
        tokensPerItem: proofs.length > 0 ? encode(JSON.stringify(proofs[0])).length : 0
      },
      learnings: {
        count: learnings.length,
        totalTokens: learnings.length > 0 ? encode(JSON.stringify(learnings)).length : 0,
        tokensPerItem: learnings.length > 0 ? encode(JSON.stringify(learnings[0])).length : 0
      },
      hurdles: {
        count: hurdles.length,
        totalTokens: hurdles.length > 0 ? encode(JSON.stringify(hurdles)).length : 0,
        tokensPerItem: hurdles.length > 0 ? encode(JSON.stringify(hurdles[0])).length : 0
      },
      personality: {
        tokens: personality ? encode(JSON.stringify(personality)).length : 0
      },
      total: 0
    };

    notionAnalysis.total =
      notionAnalysis.habits.totalTokens +
      notionAnalysis.proofs.totalTokens +
      notionAnalysis.learnings.totalTokens +
      notionAnalysis.hurdles.totalTokens +
      notionAnalysis.personality.tokens;

    testResults.rawNotionData = notionAnalysis;

    console.log(`\n📦 Raw Notion Data Analysis:`);
    console.log(`   Habits: ${notionAnalysis.habits.count} items, ${notionAnalysis.habits.totalTokens} tokens (${notionAnalysis.habits.tokensPerItem}/item)`);
    console.log(`   Proofs: ${notionAnalysis.proofs.count} items, ${notionAnalysis.proofs.totalTokens} tokens (${notionAnalysis.proofs.tokensPerItem}/item)`);
    console.log(`   Learnings: ${notionAnalysis.learnings.count} items, ${notionAnalysis.learnings.totalTokens} tokens (${notionAnalysis.learnings.tokensPerItem}/item)`);
    console.log(`   Hurdles: ${notionAnalysis.hurdles.count} items, ${notionAnalysis.hurdles.totalTokens} tokens (${notionAnalysis.hurdles.tokensPerItem}/item)`);
    console.log(`   Personality: ${notionAnalysis.personality.tokens} tokens`);
    console.log(`   TOTAL: ${notionAnalysis.total} tokens\n`);

    TestFramework.assert(
      notionAnalysis.total < 10000,
      `Total raw data tokens (${notionAnalysis.total}) should fit in 10k budget`
    );
  });

  test.test('should calculate maximum token usage across all classifications', async () => {
    const classifications = ['habit_analysis', 'progress_check', 'personality_advice', 'hurdle_help', 'learning_insight', 'general'];

    const maxTokens = Math.max(
      ...classifications.map(c => testResults[c]?.totalTokens || 0)
    );

    const minTokens = Math.min(
      ...classifications.map(c => testResults[c]?.totalTokens || 0)
    );

    const avgTokens = classifications.reduce((sum, c) => sum + (testResults[c]?.totalTokens || 0), 0) / classifications.length;

    testResults.summary = {
      maxTokens,
      minTokens,
      avgTokens: Math.round(avgTokens),
      budget: 10000,
      utilization: Math.round((maxTokens / 10000) * 100)
    };

    console.log(`\n📈 Token Usage Summary:`);
    console.log(`   Maximum: ${maxTokens} tokens`);
    console.log(`   Minimum: ${minTokens} tokens`);
    console.log(`   Average: ${Math.round(avgTokens)} tokens`);
    console.log(`   Budget: 10,000 tokens`);
    console.log(`   Max Utilization: ${Math.round((maxTokens / 10000) * 100)}%`);
    console.log(`   Headroom: ${10000 - maxTokens} tokens\n`);

    TestFramework.assert(maxTokens < 10000, `Maximum tokens (${maxTokens}) should be under 10k budget`);
    TestFramework.assert(avgTokens < 5000, `Average tokens (${avgTokens}) should be under 5k for efficiency`);
  });

  test.test('should identify which classifications benefit from larger budget', async () => {
    const classifications = ['habit_analysis', 'progress_check', 'personality_advice', 'hurdle_help', 'learning_insight', 'general'];

    const currentBudget = 2000; // Current limit
    const newBudget = 10000; // Proposed limit

    const benefitingClassifications = classifications.filter(c => {
      const tokens = testResults[c]?.totalTokens || 0;
      return tokens > currentBudget;
    });

    testResults.budgetAnalysis = {
      currentBudget,
      newBudget,
      benefitingClassifications,
      percentageBenefit: Math.round((benefitingClassifications.length / classifications.length) * 100)
    };

    console.log(`\n💡 Budget Expansion Analysis:`);
    console.log(`   Current budget: ${currentBudget} tokens`);
    console.log(`   Proposed budget: ${newBudget} tokens`);
    console.log(`   Classifications exceeding current budget: ${benefitingClassifications.join(', ') || 'None'}`);
    console.log(`   Benefit percentage: ${Math.round((benefitingClassifications.length / classifications.length) * 100)}%\n`);

    // This is informational, no assertion needed
    TestFramework.assert(true, 'Budget analysis completed');
  });

  // Run all tests
  const results = await test.run();

  // Print comprehensive results
  console.log(`\n═══════════════════════════════════════════════════════════════`);
  console.log(`✅ Token Usage Analysis Completed`);
  console.log(`═══════════════════════════════════════════════════════════════`);
  console.log(`   Total Tests: ${results.total}`);
  console.log(`   Passed: ${results.passed}`);
  console.log(`   Failed: ${results.failed}`);
  console.log(`   Duration: ${results.duration}ms`);
  console.log(`\n📊 Full Results:`);
  console.log(JSON.stringify(testResults, null, 2));
  console.log(`\n📤 Results sent to Discord test channel: ${TEST_CHANNEL_ID}`);
  console.log(`═══════════════════════════════════════════════════════════════\n`);

  return results;
}

// Run if executed directly
if (require.main === module) {
  runTokenAnalysisTests().catch(console.error);
}

export { runTokenAnalysisTests };
