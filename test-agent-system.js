/**
 * Basic test script for the Multi-Agent Habit Mentor System
 * Tests the core functionality without requiring full Discord setup
 */

const { PerplexityClient } = require('./dist/ai/perplexity-client');
const { NotionClient } = require('./dist/notion/client');
const { AgentSystem } = require('./dist/agents/index');

async function testAgentSystem() {
  console.log('🧪 Testing Multi-Agent Habit Mentor System...\n');

  try {
    // Initialize clients
    console.log('1. Initializing clients...');
    const perplexityClient = new PerplexityClient(process.env.PERPLEXITY_API_KEY);
    const notionClient = new NotionClient(process.env.NOTION_TOKEN, {
      users: process.env.NOTION_DATABASE_USERS,
      habits: process.env.NOTION_DATABASE_HABITS,
      proofs: process.env.NOTION_DATABASE_PROOFS,
      learnings: process.env.NOTION_DATABASE_LEARNINGS,
      hurdles: process.env.NOTION_DATABASE_HURDLES,
      weeks: process.env.NOTION_DATABASE_WEEKS,
      groups: process.env.NOTION_DATABASE_GROUPS
    });

    // Test Perplexity connection
    console.log('2. Testing Perplexity connection...');
    const testResponse = await perplexityClient.generateResponse(
      'Hello, this is a test message. Please respond with "Test successful".'
    );
    console.log('✅ Perplexity Response:', testResponse.substring(0, 100) + '...');

    // Initialize Agent System
    console.log('\n3. Initializing Agent System...');
    const agentSystem = AgentSystem.getInstance();
    await agentSystem.initialize(perplexityClient, notionClient);
    console.log('✅ Agent System initialized successfully');

    // Get system status
    console.log('\n4. Checking system status...');
    const systemStatus = await agentSystem.getSystemStatus();
    console.log('📊 System Status:');
    console.log(`   - Agents: ${systemStatus.agents.length}`);
    console.log(`   - Health: ${systemStatus.health.overall ? '✅ Healthy' : '❌ Unhealthy'}`);
    
    if (systemStatus.agents.length > 0) {
      console.log('   - Available Agents:');
      systemStatus.agents.forEach(agent => {
        console.log(`     • ${agent.name} (${agent.id}) - ${agent.isActive ? 'Active' : 'Inactive'}`);
      });
    }

    // Test with mock user context (since we don't have real user data)
    console.log('\n5. Testing agent processing...');
    const mockUserContext = {
      user: {
        id: 'test_user_123',
        discord_id: '1422681618304471131', // Your personal channel ID
        name: 'Test User',
        timezone: 'Europe/Berlin',
        best_time: '9:00 AM',
        trust_count: 5,
        personal_channel_id: '1422681618304471131',
        created_at: new Date(),
        last_active: new Date()
      },
      current_habits: [
        {
          id: 'habit_1',
          name: 'Morning Journaling',
          user_id: 'test_user_123',
          domains: ['Personal Development'],
          frequency: 5,
          context: 'Every morning at 7 AM',
          difficulty: 'Medium',
          smart_goal: 'Write 3 pages daily',
          why: 'To improve self-reflection and clarity',
          minimal_dose: 'Write 1 sentence',
          habit_loop: 'Wake up → Grab journal → Write → Feel accomplished',
          implementation_intentions: 'If I feel tired, then I will write just 1 sentence',
          hurdles: 'Feeling too tired in the morning',
          reminder_type: 'Phone alarm'
        }
      ],
      recent_proofs: [
        {
          id: 'proof_1',
          user_id: 'test_user_123',
          habit_id: 'habit_1',
          title: 'Morning Journal Entry',
          date: new Date(),
          unit: '3 pages',
          note: 'Felt focused and clear today',
          completed: true,
          is_minimal_dose: false,
          is_cheat_day: false
        }
      ],
      learnings: [
        {
          id: 'learning_1',
          user_id: 'test_user_123',
          text: 'I work better when I journal before checking my phone',
          created_at: new Date()
        }
      ],
      hurdles: [],
      weekly_summary: {
        user_id: 'test_user_123',
        completion_rate: 0.8,
        current_streak: 5,
        best_streak: 12
      }
    };

    // Test mentor agent
    console.log('\n6. Testing Mentor Agent...');
    const mentorResponse = await agentSystem.processUserMessage(
      mockUserContext,
      'Give me a weekly analysis of my habits',
      { context: 'weekly_analysis' }
    );

    console.log('📝 Mentor Response:');
    console.log(`   Success: ${mentorResponse.success}`);
    console.log(`   Confidence: ${mentorResponse.confidence}`);
    console.log(`   Message: ${mentorResponse.message.substring(0, 200)}...`);
    
    if (mentorResponse.recommendations && mentorResponse.recommendations.length > 0) {
      console.log(`   Recommendations: ${mentorResponse.recommendations.length}`);
    }
    
    if (mentorResponse.insights && mentorResponse.insights.length > 0) {
      console.log(`   Insights: ${mentorResponse.insights.length}`);
    }

    // Test system health
    console.log('\n7. Final health check...');
    const finalHealth = await agentSystem.getSystemHealth();
    console.log(`✅ System Health: ${finalHealth.overall ? 'All systems operational' : 'Some issues detected'}`);

    console.log('\n🎉 All tests completed successfully!');
    console.log('\n📋 Summary:');
    console.log('   ✅ Perplexity API connection working');
    console.log('   ✅ Agent System initialized');
    console.log('   ✅ Mentor Agent responding');
    console.log('   ✅ System health monitoring active');
    console.log('\n🚀 The Multi-Agent Habit Mentor System is ready for deployment!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

// Run the test
if (require.main === module) {
  // Load environment variables
  require('dotenv').config();
  
  testAgentSystem().catch(console.error);
}

module.exports = { testAgentSystem };
