import { Client, TextChannel } from 'discord.js';
import { NotionClient } from '../notion/client';
import { DiscordLogger } from './discord-logger';
import { PerplexityClient } from '../ai/perplexity-client';
import { MentorAgent } from '../agents/mentor/mentor_agent';
import { IdentityAgent } from '../agents/identity/identity_agent';
import { AccountabilityAgent } from '../agents/accountability/accountability_agent';
import { LearningAgent } from '../agents/learning/learning_agent';
import { GroupAgent } from '../agents/group/group_agent';
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
  
  // Agents
  private mentorAgent: MentorAgent;
  // private identityAgent: IdentityAgent;  // Temporarily disabled
  private accountabilityAgent: AccountabilityAgent;
  private learningAgent: LearningAgent;
  private groupAgent: GroupAgent;
  
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
    
    // Initialize all agents
    this.mentorAgent = new MentorAgent(this.perplexityClient, this.notion);
    // Temporarily disabled - requires User Profiles database
    // this.identityAgent = new IdentityAgent(this.perplexityClient, this.notion);
    this.accountabilityAgent = new AccountabilityAgent(this.perplexityClient, this.notion);
    this.learningAgent = new LearningAgent(this.perplexityClient, this.notion);
    this.groupAgent = new GroupAgent(this.perplexityClient, this.notion);
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
        'Agents Initialized',
        '4 agents initialized successfully (Identity agent disabled)',
        {
          agents: ['mentor', 'accountability', 'learning', 'group'],
          targetChannel: this.targetChannelId
        }
      );
      
      console.log('✅ All weekly agents initialized (4/5 - Identity disabled)');
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

      // Send "analysis starting" message
      const channel = await this.getTargetChannel();
      await channel.send('🤖 **Weekly Agent Analysis Starting...**\n\n⏳ Running comprehensive analysis with all 5 agents. This will take about 30-60 seconds...\n\n');

      // Gather user context
      const userContext = await this.gatherUserContext();

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
      // Send header
      const headerMessage = `
╔═══════════════════════════════════════════╗
║   📊 WEEKLY HABIT ANALYSIS REPORT 📊      ║
║   ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
╚═══════════════════════════════════════════╝

🤖 **Comprehensive Multi-Agent Analysis**
*Generated by 5 specialized AI agents*
`;
      await channel.send(headerMessage);

      // Send each agent's response
      for (const { agentName, response, emoji } of responses) {
        const agentMessage = `
═══════════════════════════════════════
${emoji} **${agentName.toUpperCase()}**
═══════════════════════════════════════

${response.message}

**Confidence Score:** ${(response.confidence * 100).toFixed(0)}%
${response.next_steps && response.next_steps.length > 0 ? `\n**Next Steps:**\n${response.next_steps.map((step, i) => `${i + 1}. ${step}`).join('\n')}` : ''}
`;

        // Split message if it exceeds Discord's 2000 character limit
        const messageParts = this.splitMessage(agentMessage, 1900);
        for (const part of messageParts) {
          await channel.send(part);
          await this.delay(1000); // 1 second delay between messages
        }
      }

      // Send footer
      const footerMessage = `
╔═══════════════════════════════════════════╗
║          🎯 ANALYSIS COMPLETE 🎯          ║
╚═══════════════════════════════════════════╝

✅ **${responses.length}/5 agents** completed successfully

📌 **Quick Summary:**
- Review each agent's insights above
- Focus on the "Next Steps" from each agent
- Track your progress and adjust as needed
- See you next Wednesday for the next analysis!

💪 **Keep crushing your habits, Marc!**
`;
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
   * Runs every Wednesday at 9:00 AM
   */
  startScheduler(): void {
    // Wednesday at 9:00 AM (0 9 * * 3)
    const task = cron.schedule('0 9 * * 3', async () => {
      try {
        console.log('📅 Weekly agent scheduler triggered on Wednesday at 9 AM...');
        
        await this.logger.info(
          'WEEKLY_SCHEDULER',
          'Scheduled Task Triggered',
          'Weekly agent analysis triggered by cron on Wednesday at 9 AM',
          {
            cronExpression: '0 9 * * 3',
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
            cronExpression: '0 9 * * 3',
            timezone: this.timezone
          }
        );
      }
    }, {
      scheduled: true,
      timezone: this.timezone
    });

    console.log(`📅 Weekly agent scheduler started (Wednesday 9 AM, timezone: ${this.timezone})`);
    console.log(`🎯 Target channel: ${this.targetChannelId}`);
    
    this.logger.success(
      'WEEKLY_SCHEDULER',
      'Scheduler Started',
      'Weekly agent scheduler started successfully',
      {
        cronExpression: '0 9 * * 3',
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
      cronExpression: '0 9 * * 3',
      description: 'Every Wednesday at 9:00 AM',
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

