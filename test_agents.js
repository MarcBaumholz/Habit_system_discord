/**
 * Test script for Multi-Agent System
 * Tests all agents with existing Notion data
 */

const { NotionClient } = require('./dist/notion/client');
const { PerplexityClient } = require('./dist/ai/perplexity-client');
const { AgentSystem } = require('./dist/agents');

async function testAgents() {
  console.log('🤖 Testing Multi-Agent System...\n');

  try {
    // Initialize clients
    const notionClient = new NotionClient(
      process.env.NOTION_TOKEN,
      {
        users: process.env.NOTION_USERS_DB_ID,
        habits: process.env.NOTION_HABITS_DB_ID,
        proofs: process.env.NOTION_PROOFS_DB_ID,
        learnings: process.env.NOTION_LEARNINGS_DB_ID,
        hurdles: process.env.NOTION_HURDLES_DB_ID,
        weeks: process.env.NOTION_WEEKS_DB_ID,
        groups: process.env.NOTION_GROUPS_DB_ID,
        personality: process.env.NOTION_PERSONALITY_DB_ID
      }
    );

    const perplexityClient = new PerplexityClient(process.env.PERPLEXITY_API_KEY);
    const agentSystem = AgentSystem.getInstance();

    // Initialize agent system
    await agentSystem.initialize(perplexityClient, notionClient);
    console.log('✅ Agent system initialized\n');

    // Test with your Discord ID
    const testDiscordId = '1422681618304471131'; // Your personal channel ID
    const testUserId = 'test-user-id';

    // Create mock user context
    const userContext = {
      user: {
        id: testUserId,
        discord_id: testDiscordId,
        name: 'Marc',
        timezone: 'Europe/Berlin',
        best_time: 'Morning',
        trust_count: 5,
        personal_channel_id: testDiscordId
      },
      current_habits: [
        {
          id: 'habit-1',
          name: 'Morning Exercise',
          domains: ['health', 'fitness'],
          frequency: 5,
          context: 'Home gym at 7 AM',
          difficulty: 'medium',
          smart_goal: 'Exercise 30 min daily',
          why: 'More energy and strength',
          minimal_dose: '5 min stretching',
          habit_loop: 'Alarm → Energy → Exercise → Accomplished',
          implementation_intentions: 'If tired, do 5 min',
          hurdles: 'Time, motivation',
          reminder_type: 'phone_alarm'
        }
      ],
      recent_proofs: [
        {
          id: 'proof-1',
          date: '2025-10-13',
          unit: '30 min',
          note: 'Great session!',
          is_minimal_dose: false,
          is_cheat_day: false
        }
      ],
      learnings: [
        {
          id: 'learning-1',
          text: 'Morning exercise gives me more energy than evening workouts',
          created_at: '2025-10-12'
        }
      ],
      hurdles: [
        {
          id: 'hurdle-1',
          name: 'Lack of Time',
          hurdle_type: 'Time Management',
          description: 'I struggle to find time in the morning because I oversleep',
          date: '2025-10-11'
        }
      ],
      current_streak: 15
    };

    console.log('📊 Testing Identity Agent...');
    const identityResponse = await agentSystem.processUserMessage(
      userContext,
      'identity analysis',
      { context: 'identity_command' }
    );
    console.log('Identity Agent Response:', identityResponse.success ? '✅ Success' : '❌ Failed');
    if (identityResponse.success) {
      console.log('Message:', identityResponse.message.substring(0, 200) + '...');
    }

    console.log('\n📊 Testing Accountability Agent...');
    const accountabilityResponse = await agentSystem.processUserMessage(
      userContext,
      'check in',
      { context: 'accountability_command' }
    );
    console.log('Accountability Agent Response:', accountabilityResponse.success ? '✅ Success' : '❌ Failed');
    if (accountabilityResponse.success) {
      console.log('Message:', accountabilityResponse.message.substring(0, 200) + '...');
    }

    console.log('\n📊 Testing Group Agent...');
    const groupResponse = await agentSystem.processUserMessage(
      userContext,
      'group analysis',
      { context: 'group_command' }
    );
    console.log('Group Agent Response:', groupResponse.success ? '✅ Success' : '❌ Failed');
    if (groupResponse.success) {
      console.log('Message:', groupResponse.message.substring(0, 200) + '...');
    }

    console.log('\n📊 Testing Learning Agent...');
    const learningResponse = await agentSystem.processUserMessage(
      userContext,
      'pattern analysis',
      { context: 'learning_command' }
    );
    console.log('Learning Agent Response:', learningResponse.success ? '✅ Success' : '❌ Failed');
    if (learningResponse.success) {
      console.log('Message:', learningResponse.message.substring(0, 200) + '...');
    }

    console.log('\n🎉 Agent testing completed!');

  } catch (error) {
    console.error('❌ Error testing agents:', error);
  }
}

// Run the test
testAgents();
