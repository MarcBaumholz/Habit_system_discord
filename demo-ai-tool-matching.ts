/**
 * DEMONSTRATION: AI-Powered Tool Matching
 *
 * This script demonstrates the new Perplexity-powered tool matching functionality
 * Run with: npx ts-node demo-ai-tool-matching.ts
 */

import { PerplexityToolMatcher } from './src/ai/perplexity-tool-matcher';
import { DEFAULT_TOOLS } from './src/toolbox/tools-enhanced';
import { formatToolboxReply } from './src/toolbox';
import * as dotenv from 'dotenv';

dotenv.config();

async function demonstrateToolMatching() {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║   AI-POWERED TOOL MATCHING DEMONSTRATION                   ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  const apiKey = process.env.PERPLEXITY_API_KEY;
  if (!apiKey) {
    console.error('❌ PERPLEXITY_API_KEY not found in .env file');
    process.exit(1);
  }

  const matcher = new PerplexityToolMatcher(apiKey);

  // Example 1: Time constraint problem
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('📝 Example 1: User Problem');
  console.log('   "I don\'t have time to work out"\n');
  console.log('🤖 AI Processing...\n');

  try {
    const matches1 = await matcher.matchToolsWithAI("I don't have time to work out", DEFAULT_TOOLS);
    const reply1 = formatToolboxReply("I don't have time to work out", matches1);

    console.log('✅ AI Response:\n');
    console.log(reply1);
    console.log('\n');
  } catch (error) {
    console.error('❌ Error:', error);
  }

  // Example 2: Distraction problem
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('📝 Example 2: User Problem');
  console.log('   "I get distracted every time I try to focus"\n');
  console.log('🤖 AI Processing...\n');

  try {
    const matches2 = await matcher.matchToolsWithAI("I get distracted every time I try to focus", DEFAULT_TOOLS);
    const reply2 = formatToolboxReply("I get distracted every time I try to focus", matches2);

    console.log('✅ AI Response:\n');
    console.log(reply2);
    console.log('\n');
  } catch (error) {
    console.error('❌ Error:', error);
  }

  // Example 3: Forgetting habits
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('📝 Example 3: User Problem');
  console.log('   "I forget to do my evening routine"\n');
  console.log('🤖 AI Processing...\n');

  try {
    const matches3 = await matcher.matchToolsWithAI("I forget to do my evening routine", DEFAULT_TOOLS);
    const reply3 = formatToolboxReply("I forget to do my evening routine", matches3);

    console.log('✅ AI Response:\n');
    console.log(reply3);
    console.log('\n');
  } catch (error) {
    console.error('❌ Error:', error);
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('✅ Demonstration complete!\n');
  console.log('Key Features:');
  console.log('  • AI understands user problems semantically (not just keywords)');
  console.log('  • Returns maximum 2 most relevant tools');
  console.log('  • Provides AI-generated reasoning for why each tool fits');
  console.log('  • Clean, Notion-style formatting');
  console.log('  • Automatic fallback to rule-based matching if AI fails');
  console.log('\n');
}

demonstrateToolMatching().catch(console.error);
