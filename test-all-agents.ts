/**
 * Comprehensive Test Script for All Agents
 * 
 * Tests:
 * 1. Weekly Agent Scheduler (runs all 5 specialized agents)
 * 2. Mid-Week Agent Scheduler (CrewAI-based team dynamics analysis)
 * 3. Personal Channel Assistant (AI-powered responses in personal channels)
 * 
 * Usage:
 *   npx ts-node test-all-agents.ts [agent-type]
 * 
 * Examples:
 *   npx ts-node test-all-agents.ts          # Test all agents
 *   npx ts-node test-all-agents.ts weekly   # Test only Weekly Agent
 *   npx ts-node test-all-agents.ts midweek  # Test only Mid-Week Agent
 *   npx ts-node test-all-agents.ts personal # Test only Personal Assistant
 */

import dotenv from 'dotenv';
import { Client, GatewayIntentBits, Message, TextChannel } from 'discord.js';
import { NotionClient } from './src/notion/client';
import { DiscordLogger } from './src/bot/discord-logger';
import { WeeklyAgentScheduler } from './src/bot/weekly-agent-scheduler';
import { MidWeekScheduler } from './src/bot/midweek-scheduler';
import { PersonalAssistant } from './src/bot/personal-assistant';

// Load environment variables
dotenv.config();

interface TestResult {
  name: string;
  success: boolean;
  error?: string;
  details?: string;
}

async function testWeeklyAgent(
  client: Client,
  notion: NotionClient,
  logger: DiscordLogger
): Promise<TestResult> {
  console.log('\n' + '='.repeat(60));
  console.log('🧪 TESTING WEEKLY AGENT SCHEDULER');
  console.log('='.repeat(60) + '\n');

  try {
    // Initialize weekly agent scheduler
    const scheduler = new WeeklyAgentScheduler(client, notion, logger);
    
    console.log('📋 Initializing agents...');
    await scheduler.initialize();
    console.log('✅ Agents initialized successfully\n');

    // Display scheduler status
    const status = scheduler.getSchedulerStatus();
    console.log('📅 Scheduler Configuration:');
    console.log(`   Cron: ${status.cronExpression} (${status.description})`);
    console.log(`   Timezone: ${status.timezone}`);
    console.log(`   Target Channel: ${status.targetChannel}`);
    console.log(`   Marc Discord ID: ${status.marcDiscordId}\n`);

    console.log('🤖 Active Agents:');
    status.agents.forEach((agent: any) => {
      console.log(`   ${agent.emoji} ${agent.name} - ${agent.status}`);
    });
    console.log('');

    // Run the weekly analysis
    console.log('🚀 Triggering weekly analysis...');
    console.log('⏳ This may take 1-2 minutes...\n');
    
    await scheduler.triggerWeeklyAnalysis();
    
    console.log('\n✅ Weekly analysis completed successfully!');
    console.log('📨 Check Marc\'s Discord channel for the full report\n');

    return {
      name: 'Weekly Agent Scheduler',
      success: true,
      details: 'Weekly analysis completed and sent to Discord channel'
    };

  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error('\n❌ Weekly Agent Test Failed:', errorMsg);
    if (error instanceof Error && error.stack) {
      console.error('Stack trace:', error.stack);
    }

    return {
      name: 'Weekly Agent Scheduler',
      success: false,
      error: errorMsg
    };
  }
}

async function testMidWeekAgent(
  client: Client,
  logger: DiscordLogger
): Promise<TestResult> {
  console.log('\n' + '='.repeat(60));
  console.log('🧪 TESTING MID-WEEK AGENT SCHEDULER');
  console.log('='.repeat(60) + '\n');

  try {
    // Get accountability channel
    const accountabilityChannelId = process.env.DISCORD_ACCOUNTABILITY_GROUP;
    if (!accountabilityChannelId) {
      return {
        name: 'Mid-Week Agent Scheduler',
        success: false,
        error: 'DISCORD_ACCOUNTABILITY_GROUP environment variable not set'
      };
    }

    console.log(`📊 Accountability Channel ID: ${accountabilityChannelId}`);

    // Fetch the channel
    const accountabilityChannel = await client.channels.fetch(accountabilityChannelId);
    if (!accountabilityChannel?.isTextBased()) {
      return {
        name: 'Mid-Week Agent Scheduler',
        success: false,
        error: `Channel ${accountabilityChannelId} not found or is not a text channel`
      };
    }

    // Initialize mid-week scheduler
    const scheduler = new MidWeekScheduler(accountabilityChannel as TextChannel, logger);
    
    // Display scheduler status
    const status = scheduler.getStatus();
    console.log('📅 Scheduler Status:');
    console.log(`   Is Running: ${status.isRunning}`);
    console.log(`   Next Run: ${status.nextRun ? status.nextRun.toLocaleString() : 'N/A'}\n`);

    // Check if CrewAI service is available
    const { crewAIClient } = await import('./src/agents/crewai-client');
    console.log('🔍 Checking CrewAI service availability...');
    const isAvailable = await crewAIClient.isAvailable();
    
    if (!isAvailable) {
      console.log('⚠️  CrewAI service is not available');
      console.log('   Make sure the Python API server is running:');
      console.log('   cd python-agents && python api.py\n');
      
      return {
        name: 'Mid-Week Agent Scheduler',
        success: false,
        error: 'CrewAI service is not available. Start the Python API server first.',
        details: 'Run: cd python-agents && python api.py'
      };
    }

    console.log('✅ CrewAI service is available\n');

    // Run the mid-week analysis
    console.log('🚀 Triggering mid-week analysis...');
    console.log('⏳ This may take 2-5 minutes...\n');
    
    await scheduler.triggerManually();
    
    console.log('\n✅ Mid-week analysis completed successfully!');
    console.log('📨 Check the accountability channel for the analysis report\n');

    return {
      name: 'Mid-Week Agent Scheduler',
      success: true,
      details: 'Mid-week analysis completed and sent to accountability channel'
    };

  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error('\n❌ Mid-Week Agent Test Failed:', errorMsg);
    if (error instanceof Error && error.stack) {
      console.error('Stack trace:', error.stack);
    }

    return {
      name: 'Mid-Week Agent Scheduler',
      success: false,
      error: errorMsg
    };
  }
}

async function testPersonalAssistant(
  client: Client,
  notion: NotionClient,
  logger: DiscordLogger
): Promise<TestResult> {
  console.log('\n' + '='.repeat(60));
  console.log('🧪 TESTING PERSONAL CHANNEL ASSISTANT');
  console.log('='.repeat(60) + '\n');

  try {
    // Initialize personal assistant
    const assistant = new PersonalAssistant(client, notion, logger);
    console.log('✅ Personal Assistant initialized\n');

    // Get Marc's Discord ID and personal channel
    const marcDiscordId = process.env.MARC_DISCORD_USER_ID;
    if (!marcDiscordId) {
      return {
        name: 'Personal Channel Assistant',
        success: false,
        error: 'MARC_DISCORD_USER_ID environment variable not set'
      };
    }

    console.log(`👤 Testing with Marc's Discord ID: ${marcDiscordId}`);

    // Get user from Notion to find personal channel
    const user = await notion.getUserByDiscordId(marcDiscordId);
    if (!user) {
      return {
        name: 'Personal Channel Assistant',
        success: false,
        error: `User not found in Notion for Discord ID: ${marcDiscordId}`
      };
    }

    if (!user.personalChannelId) {
      return {
        name: 'Personal Channel Assistant',
        success: false,
        error: `User ${user.name} does not have a personal channel ID`
      };
    }

    console.log(`📨 Personal Channel ID: ${user.personalChannelId}`);

    // Fetch the personal channel
    const personalChannel = await client.channels.fetch(user.personalChannelId);
    if (!personalChannel?.isTextBased()) {
      return {
        name: 'Personal Channel Assistant',
        success: false,
        error: `Personal channel ${user.personalChannelId} not found or is not a text channel`
      };
    }

    console.log(`✅ Personal channel found: ${(personalChannel as TextChannel).name}\n`);

    // Create a mock message to test the assistant
    const testMessage = {
      author: {
        id: marcDiscordId,
        username: user.name,
        bot: false
      },
      channel: personalChannel,
      channelId: user.personalChannelId,
      content: 'How is my progress this week?',
      guild: personalChannel.isDMBased() ? null : (personalChannel as TextChannel).guild
    } as Message;

    console.log('📝 Test Message: "How is my progress this week?"');
    console.log('🚀 Testing personal assistant response...\n');

    // Test the assistant
    const handled = await assistant.handlePersonalChannelMessage(testMessage);

    if (handled) {
      console.log('✅ Personal Assistant handled the message successfully!');
      console.log('📨 Check the personal channel for the AI response\n');

      return {
        name: 'Personal Channel Assistant',
        success: true,
        details: 'Personal assistant responded to test message in personal channel'
      };
    } else {
      return {
        name: 'Personal Channel Assistant',
        success: false,
        error: 'Personal assistant did not handle the message (returned false)'
      };
    }

  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error('\n❌ Personal Assistant Test Failed:', errorMsg);
    if (error instanceof Error && error.stack) {
      console.error('Stack trace:', error.stack);
    }

    return {
      name: 'Personal Channel Assistant',
      success: false,
      error: errorMsg
    };
  }
}

async function main() {
  console.log('\n' + '='.repeat(60));
  console.log('🧪 COMPREHENSIVE AGENT TEST SUITE');
  console.log('='.repeat(60));
  console.log('\nThis script tests all three agent systems:');
  console.log('  1. Weekly Agent Scheduler (5 specialized agents)');
  console.log('  2. Mid-Week Agent Scheduler (CrewAI team dynamics)');
  console.log('  3. Personal Channel Assistant (AI-powered responses)\n');

  // Get agent type from command line args
  const agentType = process.argv[2]?.toLowerCase();

  // Validate required environment variables
  const requiredEnvVars = [
    'DISCORD_BOT_TOKEN',
    'NOTION_TOKEN',
    'PERPLEXITY_API_KEY',
    'MARC_DISCORD_CHANNEL',
    'MARC_DISCORD_USER_ID'
  ];

  const missingVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
  if (missingVars.length > 0) {
    console.error('❌ Missing required environment variables:');
    missingVars.forEach(envVar => console.error(`   - ${envVar}`));
    process.exit(1);
  }

  // Initialize Discord client
  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
    ],
  });

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

  // Initialize Discord logger
  const logger = new DiscordLogger(client);

  // Wait for Discord client to be ready
  client.once('ready', async () => {
    console.log('✅ Discord client ready\n');

    const results: TestResult[] = [];

    try {
      // Test based on agent type
      if (!agentType || agentType === 'weekly') {
        const result = await testWeeklyAgent(client, notion, logger);
        results.push(result);
      }

      if (!agentType || agentType === 'midweek') {
        const result = await testMidWeekAgent(client, logger);
        results.push(result);
      }

      if (!agentType || agentType === 'personal') {
        const result = await testPersonalAssistant(client, notion, logger);
        results.push(result);
      }

      // Print summary
      console.log('\n' + '='.repeat(60));
      console.log('📊 TEST SUMMARY');
      console.log('='.repeat(60) + '\n');

      results.forEach(result => {
        const status = result.success ? '✅' : '❌';
        console.log(`${status} ${result.name}`);
        if (result.success && result.details) {
          console.log(`   ${result.details}`);
        }
        if (!result.success && result.error) {
          console.log(`   Error: ${result.error}`);
        }
        console.log('');
      });

      const successCount = results.filter(r => r.success).length;
      const totalCount = results.length;
      const allPassed = successCount === totalCount;

      console.log(`\n${allPassed ? '✅' : '⚠️'} Tests: ${successCount}/${totalCount} passed\n`);

      // Disconnect
      console.log('👋 Disconnecting...');
      await new Promise(resolve => setTimeout(resolve, 2000));
      client.destroy();
      process.exit(allPassed ? 0 : 1);

    } catch (error) {
      console.error('\n❌ Test suite failed:', error);
      if (error instanceof Error && error.stack) {
        console.error('Stack trace:', error.stack);
      }
      client.destroy();
      process.exit(1);
    }
  });

  // Login to Discord
  console.log('🔐 Logging into Discord...');
  await client.login(process.env.DISCORD_BOT_TOKEN!);
}

// Handle errors
process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled promise rejection:', error);
  process.exit(1);
});

process.on('SIGINT', () => {
  console.log('\n\n👋 Test interrupted by user');
  process.exit(0);
});

// Run the test
main().catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
