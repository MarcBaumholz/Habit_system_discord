/**
 * Verify Notion access for all agents
 */

import dotenv from 'dotenv';
import { NotionClient } from './src/notion/client';
import { PerplexityClient } from './src/ai/perplexity-client';

dotenv.config();

async function verifyNotionAccess() {
  console.log('🔍 Verifying Notion Access for All Agents\n');
  console.log('='.repeat(60) + '\n');

  // Initialize Notion client
  const notion = new NotionClient(process.env.NOTION_TOKEN!, {
    users: process.env.NOTION_DATABASE_USERS!,
    habits: process.env.NOTION_DATABASE_HABITS!,
    proofs: process.env.NOTION_DATABASE_PROOFS!,
    learnings: process.env.NOTION_DATABASE_LEARNINGS!,
    hurdles: process.env.NOTION_DATABASE_HURDLES!,
    weeks: process.env.NOTION_DATABASE_WEEKS!,
    groups: process.env.NOTION_DATABASE_GROUPS!
  });

  const marcDiscordId = process.env.MARC_DISCORD_USER_ID!;

  try {
    // 1. Weekly Agent - Check user and habits access
    console.log('1️⃣ Weekly Agent Scheduler:');
    const user = await notion.getUserByDiscordId(marcDiscordId);
    if (user) {
      console.log(`   ✅ User access: Found user "${user.name}" (Status: ${user.status})`);
      const habits = await notion.getHabitsByUserId(user.id);
      console.log(`   ✅ Habits access: ${habits.length} habits found`);
      const proofs = await notion.getProofsByUserId(user.id);
      console.log(`   ✅ Proofs access: ${proofs.length} proofs found`);
      const learnings = await notion.getLearningsByDiscordId(marcDiscordId);
      console.log(`   ✅ Learnings access: ${learnings.length} learnings found`);
      const hurdles = await notion.getHurdlesByDiscordId(marcDiscordId);
      console.log(`   ✅ Hurdles access: ${hurdles.length} hurdles found`);
    } else {
      console.log('   ❌ User not found');
    }
    console.log('');

    // 2. Mid-Week Agent - Check batch and active users access
    console.log('2️⃣ Mid-Week Agent (CrewAI):');
    try {
      const { getCurrentBatch, isBatchActive } = await import('./src/utils/batch-manager');
      const batch = getCurrentBatch();
      if (batch) {
        console.log(`   ✅ Batch access: Current batch "${batch.name}" (Status: ${batch.status})`);
        const activeUsers = await notion.getActiveUsers();
        console.log(`   ✅ Active users access: ${activeUsers.length} active users found`);
      } else {
        console.log('   ⚠️  No active batch found');
      }
    } catch (error) {
      console.log(`   ❌ Error: ${error instanceof Error ? error.message : String(error)}`);
    }
    console.log('');

    // 3. Personal Assistant - Check all data access
    console.log('3️⃣ Personal Channel Assistant:');
    if (user) {
      const userContext = {
        habits: await notion.getHabitsByUserId(user.id),
        proofs: await notion.getProofsByUserId(user.id),
        learnings: await notion.getLearningsByDiscordId(marcDiscordId),
        hurdles: await notion.getHurdlesByDiscordId(marcDiscordId)
      };
      console.log(`   ✅ Full context access: ${userContext.habits.length} habits, ${userContext.proofs.length} proofs`);
      console.log(`   ✅ Personal channel: ${user.personalChannelId || 'not set'}`);
    }
    console.log('');

    // 4. Check Perplexity API (used by all AI agents)
    console.log('4️⃣ Perplexity AI API:');
    if (process.env.PERPLEXITY_API_KEY) {
      console.log('   ✅ PERPLEXITY_API_KEY is set');
      const client = new PerplexityClient(process.env.PERPLEXITY_API_KEY);
      if (PerplexityClient.isAvailable()) {
        console.log('   ✅ PerplexityClient is available');
      } else {
        console.log('   ⚠️  PerplexityClient reports not available');
      }
    } else {
      console.log('   ❌ PERPLEXITY_API_KEY not set');
    }
    console.log('');

    // 5. Check CrewAI API server
    console.log('5️⃣ CrewAI Python API Server:');
    try {
      const axios = await import('axios');
      const response = await axios.default.get('http://localhost:8000/health', { timeout: 2000 });
      if (response.data.status === 'healthy' || response.data.status === 'degraded') {
        console.log(`   ✅ API server is running (Status: ${response.data.status})`);
        if (response.data.environment_check) {
          const missing = response.data.environment_check.missing_variables || [];
          if (missing.length === 0) {
            console.log('   ✅ All environment variables configured');
          } else {
            console.log(`   ⚠️  Missing variables: ${missing.join(', ')}`);
          }
        }
      }
    } catch (error) {
      console.log('   ❌ API server not responding');
      console.log(`   Error: ${error instanceof Error ? error.message : String(error)}`);
    }
    console.log('');

    console.log('='.repeat(60));
    console.log('✅ Notion access verification complete!\n');

  } catch (error) {
    console.error('❌ Error during verification:', error);
    process.exit(1);
  }
}

verifyNotionAccess().catch(console.error);
