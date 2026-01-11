/**
 * Quick Test - All Improved Agents
 * Verifies all 4 improved agents can initialize
 */

import { ImprovedMentorAgent } from './src/agents/mentor/mentor_agent_improved';
import { ImprovedAccountabilityAgent } from './src/agents/accountability/accountability_agent_improved';
import { ImprovedLearningAgent } from './src/agents/learning/learning_agent_improved';
import { ImprovedGroupAgent } from './src/agents/group/group_agent_improved';
import { NotionClient } from './src/notion/client';
import { PerplexityClient } from './src/ai/perplexity-client';
import dotenv from 'dotenv';

dotenv.config();

async function testAllImprovedAgents() {
  console.log('🧪 Testing All Improved Agents\n');
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

  console.log('\n📊 Initializing All 4 Improved Agents...\n');

  const results: { name: string; status: string; error?: string }[] = [];

  // Test 1: Mentor Agent
  try {
    console.log('1️⃣  ImprovedMentorAgent...');
    const mentor = new ImprovedMentorAgent(perplexity, notion);
    await mentor.initialize();
    results.push({ name: 'Mentor Agent', status: '✅ Success' });
    console.log('   ✅ Initialized successfully\n');
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    results.push({ name: 'Mentor Agent', status: '❌ Failed', error: msg });
    console.log(`   ❌ Failed: ${msg}\n`);
  }

  // Test 2: Accountability Agent
  try {
    console.log('2️⃣  ImprovedAccountabilityAgent...');
    const accountability = new ImprovedAccountabilityAgent(perplexity, notion);
    await accountability.initialize();
    results.push({ name: 'Accountability Agent', status: '✅ Success' });
    console.log('   ✅ Initialized successfully\n');
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    results.push({ name: 'Accountability Agent', status: '❌ Failed', error: msg });
    console.log(`   ❌ Failed: ${msg}\n`);
  }

  // Test 3: Learning Agent
  try {
    console.log('3️⃣  ImprovedLearningAgent...');
    const learning = new ImprovedLearningAgent(perplexity, notion);
    await learning.initialize();
    results.push({ name: 'Learning Agent', status: '✅ Success' });
    console.log('   ✅ Initialized successfully\n');
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    results.push({ name: 'Learning Agent', status: '❌ Failed', error: msg });
    console.log(`   ❌ Failed: ${msg}\n`);
  }

  // Test 4: Group Agent
  try {
    console.log('4️⃣  ImprovedGroupAgent...');
    const group = new ImprovedGroupAgent(perplexity, notion);
    await group.initialize();
    results.push({ name: 'Group Agent', status: '✅ Success' });
    console.log('   ✅ Initialized successfully\n');
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    results.push({ name: 'Group Agent', status: '❌ Failed', error: msg });
    console.log(`   ❌ Failed: ${msg}\n`);
  }

  // Summary
  console.log('='.repeat(80));
  console.log('📊 INITIALIZATION SUMMARY');
  console.log('='.repeat(80));
  console.log('');

  results.forEach(r => {
    console.log(`${r.status} ${r.name}`);
    if (r.error) {
      console.log(`   Error: ${r.error}`);
    }
  });

  const successCount = results.filter(r => r.status.includes('✅')).length;
  const totalCount = results.length;

  console.log('');
  console.log(`✅ Success: ${successCount}/${totalCount} agents`);

  if (successCount === totalCount) {
    console.log('\n🎉 All improved agents initialized successfully!');
    console.log('\n✅ Ready to deploy:');
    console.log('   ./deploy.sh');
  } else {
    console.log('\n⚠️  Some agents failed to initialize. Check errors above.');
  }

  console.log('\n' + '='.repeat(80));
}

// Run test
testAllImprovedAgents()
  .then(() => {
    console.log('\n✅ Test complete!\n');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Test failed:');
    console.error(error);
    process.exit(1);
  });
