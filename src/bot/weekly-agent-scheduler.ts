import { Client, TextChannel } from 'discord.js';
import { NotionClient } from '../notion/client';
import { DiscordLogger } from './discord-logger';
import { PerplexityClient } from '../ai/perplexity-client';
// IMPROVED: Using new agents with validated data retrieval and concise outputs
import { ImprovedMentorAgent } from '../agents/mentor/mentor_agent_improved';
import { ImprovedAccountabilityAgent } from '../agents/accountability/accountability_agent_improved';
import { ImprovedLearningAgent } from '../agents/learning/learning_agent_improved';
import { ImprovedGroupAgent } from '../agents/group/group_agent_improved';
import { IdentityAgent } from '../agents/identity/identity_agent';
import { UserContext, AgentResponse } from '../agents/base/types';
import * as cron from 'node-cron';

/**
 * Weekly Agent Scheduler
 * Runs all 5 specialized agents every Wednesday at 9 AM
 * Provides comprehensive weekly analysis for Marc
 */
export class WeeklyAgentScheduler {
  private client: Client;
  private notion: NotionClient;
  private logger: DiscordLogger;
  private perplexityClient: PerplexityClient;
  
  // Agents - ALL IMPROVED!
  private mentorAgent: ImprovedMentorAgent;
  private accountabilityAgent: ImprovedAccountabilityAgent;
  private learningAgent: ImprovedLearningAgent;
  private groupAgent: ImprovedGroupAgent;
  // private identityAgent: IdentityAgent;  // Temporarily disabled
  
  // Configuration
  private targetChannelId: string;
  private marcDiscordId: string;
  private timezone: string;

  constructor(
    client: Client, 
    notion: NotionClient, 
    logger: DiscordLogger
  ) {
    this.client = client;
    this.notion = notion;
    this.logger = logger;
    this.targetChannelId = process.env.MARC_DISCORD_CHANNEL || '1422681618304471131';
    this.marcDiscordId = process.env.MARC_DISCORD_USER_ID || '';
    this.timezone = process.env.TIMEZONE || 'Europe/Berlin';
    
    // Initialize Perplexity client
    this.perplexityClient = new PerplexityClient(process.env.PERPLEXITY_API_KEY!);

    // Initialize all agents - ALL IMPROVED with validated data retrieval and concise outputs!
    this.mentorAgent = new ImprovedMentorAgent(this.perplexityClient, this.notion);
    this.accountabilityAgent = new ImprovedAccountabilityAgent(this.perplexityClient, this.notion);
    this.learningAgent = new ImprovedLearningAgent(this.perplexityClient, this.notion);
    this.groupAgent = new ImprovedGroupAgent(this.perplexityClient, this.notion);
    // Temporarily disabled - requires User Profiles database
    // this.identityAgent = new IdentityAgent(this.perplexityClient, this.notion);
  }

  /**
   * Initialize all agents
   */
  async initialize(): Promise<void> {
    try {
      await this.mentorAgent.initialize();
      // Identity agent temporarily disabled
      // await this.identityAgent.initialize();
      await this.accountabilityAgent.initialize();
      await this.learningAgent.initialize();
      await this.groupAgent.initialize();
      
      await this.logger.success(
        'WEEKLY_SCHEDULER',
        'Improved Agents Initialized',
        '4 improved agents initialized successfully (Identity agent disabled)',
        {
          agents: ['mentor-improved', 'accountability-improved', 'learning-improved', 'group-improved'],
          improvements: 'validated data, concise outputs, caching, 70% token reduction',
          targetChannel: this.targetChannelId
        }
      );

      console.log('✅ All improved weekly agents initialized (4/5 - Identity disabled)');
    } catch (error) {
      await this.logger.logError(
        error as Error,
        'Agent Initialization Failed',
        { scheduler: 'weekly' }
      );
      throw error;
    }
  }

  /**
   * Gather comprehensive user context for Marc
   */
  async gatherUserContext(): Promise<UserContext> {
    try {
      // Get user by Discord ID
      const user = await this.notion.getUserByDiscordId(this.marcDiscordId);
      if (!user) {
        throw new Error(`User not found for Discord ID: ${this.marcDiscordId}`);
      }

      // Debug: Log user status
      console.log('🔍 User status check:', {
        userId: user.id,
        userName: user.name,
        status: user.status,
        statusType: typeof user.status,
        statusValue: JSON.stringify(user.status)
      });

      // Check if user is paused - skip analysis if paused
      // Only skip if status is explicitly 'pause', not if it's undefined/null/empty
      if (user.status && user.status === 'pause') {
        await this.logger.info(
          'WEEKLY_SCHEDULER',
          'User Paused - Skipping Analysis',
          `User ${user.name} is paused, skipping weekly analysis`,
          {
            userId: user.id,
            pauseReason: user.pauseReason || 'not specified',
            status: user.status
          }
        );
        throw new Error(`User ${user.name} is paused - skipping weekly analysis`);
      }

      // If status is not 'pause', continue with analysis (even if status is undefined/null)
      console.log('✅ User is active, proceeding with analysis');

      // Get current habits
      const habits = await this.notion.getHabitsByUserId(user.id);
      
      // Get recent proofs (last 30 days to have enough data)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const allProofs = await this.notion.getProofsByUserId(user.id);
      
      // Filter to last 7 days for recent analysis
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const recentProofs = allProofs.filter((proof: any) => {
        const proofDate = new Date(proof.date);
        return proofDate >= sevenDaysAgo;
      });
      
      // Get learnings
      const learnings = await this.notion.getLearningsByDiscordId(this.marcDiscordId);
      
      // Get hurdles
      const hurdles = await this.notion.getHurdlesByDiscordId(this.marcDiscordId);
      
      // Calculate weekly summary data
      const completedProofs = recentProofs.filter((p: any) => p.completed !== false);
      const completionRate = recentProofs.length > 0 
        ? (completedProofs.length / recentProofs.length) * 100 
        : 0;
      
      const weeklySummary = {
        current_streak: completedProofs.length,
        completion_rate: completionRate,
        total_proofs: recentProofs.length,
        completed_proofs: completedProofs.length
      };

      // Map user properties from camelCase (Notion) to snake_case (Agent types)
      const mappedUser = {
        id: user.id,
        discord_id: user.discordId,  // Map camelCase to snake_case
        name: user.name,
        timezone: user.timezone,
        best_time: user.bestTime,  // Map camelCase to snake_case
        trust_count: user.trustCount || 0,  // Map camelCase to snake_case
        personal_channel_id: user.personalChannelId || '',  // Map camelCase to snake_case
        created_at: new Date(),
        last_active: new Date()
      };

      const userContext: UserContext = {
        user: mappedUser as any,
        current_habits: habits as any,
        recent_proofs: recentProofs as any,
        weekly_summary: weeklySummary as any,
        learnings: learnings as any,
        hurdles: hurdles as any,
        current_streak: weeklySummary?.current_streak || 0
      };

      await this.logger.info(
        'WEEKLY_SCHEDULER',
        'User Context Gathered',
        'Successfully gathered user context for weekly analysis',
        {
          habitsCount: habits.length,
          proofsCount: recentProofs.length,
          learningsCount: learnings.length,
          hurdlesCount: hurdles.length
        }
      );

      return userContext;
    } catch (error) {
      await this.logger.logError(
        error as Error,
        'User Context Gathering Failed',
        { userId: this.marcDiscordId }
      );
      throw error;
    }
  }

  /**
   * Run all agents sequentially and aggregate results
   */
  async runWeeklyAnalysis(): Promise<void> {
    try {
      await this.logger.info(
        'WEEKLY_SCHEDULER',
        'Weekly Analysis Started',
        'Starting comprehensive weekly agent analysis',
        {
          day: new Date().toLocaleDateString('en-US', { weekday: 'long' }),
          time: new Date().toLocaleTimeString()
        }
      );

      // Send "analysis starting" message (shorter)
      const channel = await this.getTargetChannel();
      await channel.send('🤖 **Weekly Analysis Starting...**\n⏳ Analyzing with 4 agents (~30s)\n');

      // Gather user context (will throw if user is paused)
      let userContext: UserContext;
      try {
        userContext = await this.gatherUserContext();
      } catch (error) {
        // If user is paused, send message and return early
        if (error instanceof Error && error.message.includes('paused')) {
          await channel.send('⏸️ **Weekly Analysis Skipped**\n\nYour participation is currently paused. Use `/activate` in your personal channel to reactivate and resume weekly analyses.');
          await this.logger.info(
            'WEEKLY_SCHEDULER',
            'Analysis Skipped - User Paused',
            'Weekly analysis skipped because user is paused',
            { reason: 'user_paused' }
          );
          return;
        }
        throw error; // Re-throw if it's a different error
      }

      // Run each agent and collect responses
      const responses: Array<{ agentName: string; response: AgentResponse; emoji: string }> = [];

      // 1. Mentor Agent
      try {
        await channel.send('🧘‍♂️ Running Mentor Agent...');
        const mentorResponse = await this.mentorAgent.processRequest(
          userContext,
          'Provide comprehensive weekly habit analysis for Marc. Analyze the past 7 days including performance scorecard, pattern insights, success factors, areas for improvement, and next week coaching plan.',
          { analysisType: 'weekly_comprehensive' }
        );
        responses.push({ agentName: 'Mentor Agent', response: mentorResponse, emoji: '🧘‍♂️' });
      } catch (error) {
        await this.logger.logError(error as Error, 'Mentor Agent Failed');
        await channel.send('⚠️ Mentor Agent encountered an error but continuing...');
      }

      // 2. Identity Agent - TEMPORARILY DISABLED (requires User Profiles database)
      // try {
      //   await channel.send('🆔 Running Identity Agent...');
      //   const identityResponse = await this.identityAgent.processRequest(
      //     userContext,
      //     'Conduct weekly identity alignment check. Evaluate how Marc\'s habits align with his desired identity, provide identity score, habit-identity match analysis, and identity-based recommendations.',
      //     { analysisType: 'weekly_identity_check' }
      //   );
      //   responses.push({ agentName: 'Identity Agent', response: identityResponse, emoji: '🆔' });
      // } catch (error) {
      //   await this.logger.logError(error as Error, 'Identity Agent Failed');
      //   await channel.send('⚠️ Identity Agent encountered an error but continuing...');
      // }

      // 3. Accountability Agent
      try {
        await channel.send('📊 Running Accountability Agent...');
        const accountabilityResponse = await this.accountabilityAgent.processRequest(
          userContext,
          'Provide weekly accountability review. Analyze consistency, motivation assessment, risk factors, celebration moments, and accountability actions needed.',
          { analysisType: 'weekly_accountability_review' }
        );
        responses.push({ agentName: 'Accountability Agent', response: accountabilityResponse, emoji: '📊' });
      } catch (error) {
        await this.logger.logError(error as Error, 'Accountability Agent Failed');
        await channel.send('⚠️ Accountability Agent encountered an error but continuing...');
      }

      // 4. Learning Agent
      try {
        await channel.send('📚 Running Learning Agent...');
        const learningResponse = await this.learningAgent.processRequest(
          userContext,
          'Conduct weekly knowledge integration. Synthesize learning highlights, hurdle analysis, cross-habit patterns, knowledge synthesis, and applied learning recommendations.',
          { analysisType: 'weekly_learning_synthesis' }
        );
        responses.push({ agentName: 'Learning Agent', response: learningResponse, emoji: '📚' });
      } catch (error) {
        await this.logger.logError(error as Error, 'Learning Agent Failed');
        await channel.send('⚠️ Learning Agent encountered an error but continuing...');
      }

      // 5. Group Agent
      try {
        await channel.send('👥 Running Group Agent...');
        const groupResponse = await this.groupAgent.processRequest(
          userContext,
          'Conduct weekly community review. Analyze community engagement, peer influence, group dynamics, social accountability effectiveness, and community recommendations.',
          { analysisType: 'weekly_social_dynamics' }
        );
        responses.push({ agentName: 'Group Agent', response: groupResponse, emoji: '👥' });
      } catch (error) {
        await this.logger.logError(error as Error, 'Group Agent Failed');
        await channel.send('⚠️ Group Agent encountered an error but continuing...');
      }

      // Format and send comprehensive report
      await this.sendComprehensiveReport(channel, responses);

      await this.logger.success(
        'WEEKLY_SCHEDULER',
        'Weekly Analysis Completed',
        'Successfully completed weekly agent analysis',
        {
          agentsRun: responses.length,
          totalAgents: 5,
          successRate: `${(responses.length / 5 * 100).toFixed(0)}%`
        }
      );

    } catch (error) {
      await this.logger.logError(
        error as Error,
        'Weekly Analysis Failed',
        { scheduler: 'weekly' }
      );
      
      // Try to send error message to channel
      try {
        const channel = await this.getTargetChannel();
        await channel.send('❌ **Weekly Analysis Failed**\n\nAn error occurred during the weekly analysis. Please check logs for details.');
      } catch (sendError) {
        console.error('Failed to send error message to channel:', sendError);
      }
    }
  }

  /**
   * Get the target Discord channel
   */
  private async getTargetChannel(): Promise<TextChannel> {
    const channel = this.client.channels.cache.get(this.targetChannelId) as TextChannel;
    if (!channel) {
      throw new Error(`Target channel not found: ${this.targetChannelId}`);
    }
    return channel;
  }

  /**
   * Format and send comprehensive report to Discord
   */
  private async sendComprehensiveReport(
    channel: TextChannel,
    responses: Array<{ agentName: string; response: AgentResponse; emoji: string }>
  ): Promise<void> {
    try {
      // Send header (cleaner, shorter)
      const headerMessage = `📊 **Weekly Analysis** — ${new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}\n*${responses.length} agents analyzing...*\n`;
      await channel.send(headerMessage);

      // Send each agent's response (cleaner format)
      for (const { agentName, response, emoji } of responses) {
        const agentMessage = `${emoji} **${agentName}**\n${response.message}${response.next_steps && response.next_steps.length > 0 ? `\n\n**Next:** ${response.next_steps[0]}` : ''}\n`;

        // Split message if it exceeds Discord's 2000 character limit
        const messageParts = this.splitMessage(agentMessage, 1900);
        for (const part of messageParts) {
          await channel.send(part);
          await this.delay(500); // Shorter delay
        }
      }

      // Send footer (cleaner, shorter)
      const footerMessage = `\n✅ **Complete** — ${responses.length}/4 agents\n💪 *Keep going, Marc!*`;
      await channel.send(footerMessage);

    } catch (error) {
      await this.logger.logError(
        error as Error,
        'Report Sending Failed',
        { responseCount: responses.length }
      );
      throw error;
    }
  }

  /**
   * Split message into chunks that fit Discord's 2000 character limit
   */
  private splitMessage(message: string, maxLength: number = 1900): string[] {
    const parts: string[] = [];
    let currentPart = '';

    const lines = message.split('\n');
    for (const line of lines) {
      if (currentPart.length + line.length + 1 > maxLength) {
        parts.push(currentPart);
        currentPart = line + '\n';
      } else {
        currentPart += line + '\n';
      }
    }

    if (currentPart.trim()) {
      parts.push(currentPart);
    }

    return parts;
  }

  /**
   * Delay helper function
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Start the weekly scheduler
   * Runs every Sunday at 8:00 PM (with Adaptive Goal Recommendations)
   */
  startScheduler(): void {
    // Sunday at 8:00 PM (0 20 * * 0)
    const task = cron.schedule('0 20 * * 0', async () => {
      try {
        console.log('📅 Weekly agent scheduler triggered on Sunday at 8 PM...');

        await this.logger.info(
          'WEEKLY_SCHEDULER',
          'Scheduled Task Triggered',
          'Weekly agent analysis with Adaptive Goal Recommendations triggered by cron on Sunday at 8 PM',
          {
            cronExpression: '0 20 * * 0',
            timezone: this.timezone,
            triggerTime: new Date().toISOString()
          }
        );

        // Run the weekly analysis
        await this.runWeeklyAnalysis();

        console.log('✅ Weekly agent analysis completed successfully');

      } catch (error) {
        console.error('❌ Error in weekly agent scheduler:', error);
        await this.logger.logError(
          error as Error,
          'Weekly Scheduler Error',
          {
            cronExpression: '0 20 * * 0',
            timezone: this.timezone
          }
        );
      }
    }, {
      scheduled: true,
      timezone: this.timezone
    });

    console.log(`📅 Weekly agent scheduler started (Sunday 8 PM, timezone: ${this.timezone})`);
    console.log(`🎯 Target channel: ${this.targetChannelId}`);

    this.logger.success(
      'WEEKLY_SCHEDULER',
      'Scheduler Started',
      'Weekly agent scheduler started successfully',
      {
        cronExpression: '0 20 * * 0',
        timezone: this.timezone,
        targetChannel: this.targetChannelId,
        agents: ['mentor', 'identity', 'accountability', 'learning', 'group']
      }
    );
  }

  /**
   * Manually trigger weekly analysis (for testing)
   */
  async triggerWeeklyAnalysis(): Promise<void> {
    console.log('🧪 Manually triggering weekly analysis...');
    await this.runWeeklyAnalysis();
  }

  /**
   * Get scheduler status
   */
  getSchedulerStatus(): any {
    return {
      cronExpression: '0 20 * * 0',
      description: 'Every Sunday at 8:00 PM (with Adaptive Goal Recommendations)',
      timezone: this.timezone,
      targetChannel: this.targetChannelId,
      marcDiscordId: this.marcDiscordId,
      agents: [
        { name: 'Mentor Agent', status: 'Active', emoji: '🧘‍♂️' },
        { name: 'Identity Agent', status: 'Active', emoji: '🆔' },
        { name: 'Accountability Agent', status: 'Active', emoji: '📊' },
        { name: 'Learning Agent', status: 'Active', emoji: '📚' },
        { name: 'Group Agent', status: 'Active', emoji: '👥' }
      ]
    };
  }
}

