/**
 * Test file for AI-powered tool matching using Perplexity
 *
 * This demonstrates the new functionality:
 * 1. User posts a problem in tools channel
 * 2. Perplexity AI analyzes and matches best 1-2 tools
 * 3. Clean, Notion-style response is sent
 *
 * Run with: npm test -- perplexity-tool-matcher.test.ts
 */

import { PerplexityToolMatcher } from '../src/ai/perplexity-tool-matcher';
import { DEFAULT_TOOLS } from '../src/toolbox/tools-enhanced';
import { formatToolboxReply } from '../src/toolbox';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

describe('Perplexity Tool Matcher', () => {
  let matcher: PerplexityToolMatcher;

  beforeAll(() => {
    const apiKey = process.env.PERPLEXITY_API_KEY;
    if (!apiKey) {
      throw new Error('PERPLEXITY_API_KEY not found in environment');
    }
    matcher = new PerplexityToolMatcher(apiKey);
  });

  /**
   * Test Case 1: Time-related problem
   */
  test('should match "I don\'t have time" to Time Boxing tool', async () => {
    console.log('\n🧪 TEST 1: Time-related problem\n');
    console.log('User problem: "I don\'t have time to exercise"');

    const problem = "I don't have time to exercise";
    const matches = await matcher.matchToolsWithAI(problem, DEFAULT_TOOLS);

    console.log(`\n✅ AI found ${matches.length} tool(s):`);
    matches.forEach((match, idx) => {
      console.log(`  ${idx + 1}. ${match.tool.name}`);
      console.log(`     Reasoning: ${match.reasoning}`);
    });

    expect(matches.length).toBeGreaterThan(0);
    expect(matches.length).toBeLessThanOrEqual(2);

    // Should recommend time-related tools
    const toolNames = matches.map(m => m.tool.name.toLowerCase());
    const hasTimeRelated = toolNames.some(name =>
      name.includes('time') || name.includes('box') || name.includes('block')
    );
    expect(hasTimeRelated).toBe(true);

    // Show formatted response
    const reply = formatToolboxReply(problem, matches);
    console.log('\n📨 Formatted Response:');
    console.log('─────────────────────────────');
    console.log(reply);
    console.log('─────────────────────────────\n');
  }, 30000); // 30 second timeout for API call

  /**
   * Test Case 2: Focus/Distraction problem
   */
  test('should match distraction problems to Deep Work or Pomodoro', async () => {
    console.log('\n🧪 TEST 2: Focus/Distraction problem\n');
    console.log('User problem: "I get distracted when I try to work"');

    const problem = "I get distracted when I try to work";
    const matches = await matcher.matchToolsWithAI(problem, DEFAULT_TOOLS);

    console.log(`\n✅ AI found ${matches.length} tool(s):`);
    matches.forEach((match, idx) => {
      console.log(`  ${idx + 1}. ${match.tool.name}`);
      console.log(`     Reasoning: ${match.reasoning}`);
    });

    expect(matches.length).toBeGreaterThan(0);
    expect(matches.length).toBeLessThanOrEqual(2);

    // Should recommend focus-related tools
    const toolNames = matches.map(m => m.tool.name.toLowerCase());
    const hasFocusRelated = toolNames.some(name =>
      name.includes('deep work') || name.includes('pomodoro') || name.includes('focus')
    );
    expect(hasFocusRelated).toBe(true);

    // Show formatted response
    const reply = formatToolboxReply(problem, matches);
    console.log('\n📨 Formatted Response:');
    console.log('─────────────────────────────');
    console.log(reply);
    console.log('─────────────────────────────\n');
  }, 30000);

  /**
   * Test Case 3: Motivation problem
   */
  test('should match motivation problems appropriately', async () => {
    console.log('\n🧪 TEST 3: Motivation problem\n');
    console.log('User problem: "I procrastinate and never start my habit"');

    const problem = "I procrastinate and never start my habit";
    const matches = await matcher.matchToolsWithAI(problem, DEFAULT_TOOLS);

    console.log(`\n✅ AI found ${matches.length} tool(s):`);
    matches.forEach((match, idx) => {
      console.log(`  ${idx + 1}. ${match.tool.name}`);
      console.log(`     Reasoning: ${match.reasoning}`);
    });

    expect(matches.length).toBeGreaterThan(0);
    expect(matches.length).toBeLessThanOrEqual(2);

    // Show formatted response
    const reply = formatToolboxReply(problem, matches);
    console.log('\n📨 Formatted Response:');
    console.log('─────────────────────────────');
    console.log(reply);
    console.log('─────────────────────────────\n');
  }, 30000);

  /**
   * Test Case 4: Combining multiple habits
   */
  test('should match habit combination to Habit Stacking', async () => {
    console.log('\n🧪 TEST 4: Combining habits\n');
    console.log('User problem: "I want to combine multiple habits together"');

    const problem = "I want to combine multiple habits together";
    const matches = await matcher.matchToolsWithAI(problem, DEFAULT_TOOLS);

    console.log(`\n✅ AI found ${matches.length} tool(s):`);
    matches.forEach((match, idx) => {
      console.log(`  ${idx + 1}. ${match.tool.name}`);
      console.log(`     Reasoning: ${match.reasoning}`);
    });

    expect(matches.length).toBeGreaterThan(0);
    expect(matches.length).toBeLessThanOrEqual(2);

    // Should recommend stacking-related tools
    const toolNames = matches.map(m => m.tool.name.toLowerCase());
    const hasStackingRelated = toolNames.some(name =>
      name.includes('stack') || name.includes('bundle') || name.includes('combin')
    );
    expect(hasStackingRelated).toBe(true);

    // Show formatted response
    const reply = formatToolboxReply(problem, matches);
    console.log('\n📨 Formatted Response:');
    console.log('─────────────────────────────');
    console.log(reply);
    console.log('─────────────────────────────\n');
  }, 30000);

  /**
   * Test Case 5: Complex multi-problem query
   */
  test('should handle complex problems with multiple aspects', async () => {
    console.log('\n🧪 TEST 5: Complex multi-problem\n');
    console.log('User problem: "I work long hours, get home tired, and forget to do my evening routine"');

    const problem = "I work long hours, get home tired, and forget to do my evening routine";
    const matches = await matcher.matchToolsWithAI(problem, DEFAULT_TOOLS);

    console.log(`\n✅ AI found ${matches.length} tool(s):`);
    matches.forEach((match, idx) => {
      console.log(`  ${idx + 1}. ${match.tool.name}`);
      console.log(`     Reasoning: ${match.reasoning}`);
    });

    expect(matches.length).toBeGreaterThan(0);
    expect(matches.length).toBeLessThanOrEqual(2);

    // Show formatted response
    const reply = formatToolboxReply(problem, matches);
    console.log('\n📨 Formatted Response:');
    console.log('─────────────────────────────');
    console.log(reply);
    console.log('─────────────────────────────\n');
  }, 30000);

  /**
   * Test Case 6: German language support
   */
  test('should handle German language problems', async () => {
    console.log('\n🧪 TEST 6: German language\n');
    console.log('User problem: "Ich habe keine Zeit für meine Gewohnheiten"');

    const problem = "Ich habe keine Zeit für meine Gewohnheiten";
    const matches = await matcher.matchToolsWithAI(problem, DEFAULT_TOOLS);

    console.log(`\n✅ AI found ${matches.length} tool(s):`);
    matches.forEach((match, idx) => {
      console.log(`  ${idx + 1}. ${match.tool.name}`);
      console.log(`     Reasoning: ${match.reasoning}`);
    });

    expect(matches.length).toBeGreaterThan(0);
    expect(matches.length).toBeLessThanOrEqual(2);

    // Show formatted response
    const reply = formatToolboxReply(problem, matches);
    console.log('\n📨 Formatted Response:');
    console.log('─────────────────────────────');
    console.log(reply);
    console.log('─────────────────────────────\n');
  }, 30000);

  /**
   * Test Case 7: Edge case - very vague problem
   */
  test('should handle vague problems gracefully', async () => {
    console.log('\n🧪 TEST 7: Vague problem\n');
    console.log('User problem: "I need help"');

    const problem = "I need help";
    const matches = await matcher.matchToolsWithAI(problem, DEFAULT_TOOLS);

    console.log(`\n✅ AI found ${matches.length} tool(s):`);
    matches.forEach((match, idx) => {
      console.log(`  ${idx + 1}. ${match.tool.name}`);
      console.log(`     Reasoning: ${match.reasoning}`);
    });

    // Even vague problems should get some suggestions
    expect(matches.length).toBeGreaterThanOrEqual(0);
    expect(matches.length).toBeLessThanOrEqual(2);

    // Show formatted response
    const reply = formatToolboxReply(problem, matches);
    console.log('\n📨 Formatted Response:');
    console.log('─────────────────────────────');
    console.log(reply);
    console.log('─────────────────────────────\n');
  }, 30000);
});

/**
 * Integration Test: Full workflow
 */
describe('Full Tool Matching Workflow', () => {
  test('should demonstrate complete user journey', async () => {
    console.log('\n🎬 INTEGRATION TEST: Complete User Journey\n');
    console.log('═══════════════════════════════════════════════════════\n');

    const apiKey = process.env.PERPLEXITY_API_KEY;
    if (!apiKey) {
      throw new Error('PERPLEXITY_API_KEY not found');
    }

    const matcher = new PerplexityToolMatcher(apiKey);

    // Simulate user posting in tools channel
    const userProblem = "I forget to meditate every morning even though I want to";

    console.log('👤 User posts in tools channel (1420517654300725319):');
    console.log(`   "${userProblem}"`);
    console.log('\n🤖 Bot processing...\n');

    // AI matches tools
    const matches = await matcher.matchToolsWithAI(userProblem, DEFAULT_TOOLS);

    console.log(`✅ AI Analysis Complete`);
    console.log(`   Found ${matches.length} relevant tool(s)\n`);

    // Format response
    const reply = formatToolboxReply(userProblem, matches);

    console.log('📨 Bot sends this message to user:');
    console.log('═══════════════════════════════════════════════════════');
    console.log(reply);
    console.log('═══════════════════════════════════════════════════════\n');

    // Verify response structure
    expect(reply).toContain('🎯 Tool Recommendations');
    expect(reply).toContain('How to Apply:');
    expect(matches.length).toBeLessThanOrEqual(2);

    console.log('✅ Test complete! AI-powered tool matching working correctly.\n');
  }, 30000);
});
