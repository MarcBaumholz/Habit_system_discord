/**
 * All Users Weekly Scheduler
 * Runs weekly analysis for all active users in their personal channels
 * Includes buddy progress in the analysis
 */

import { Client, TextChannel } from 'discord.js';
import { NotionClient } from '../notion/client';
import { DiscordLogger } from './discord-logger';
import { PerplexityClient } from '../ai/perplexity-client';
import { MentorAgent } from '../agents/mentor/mentor_agent';
import { UserContext, AgentResponse } from '../agents/base/types';
import { User, BuddyProgressData } from '../types';
import * as cron from 'node-cron';

export class AllUsersWeeklyScheduler {
  private client: Client;
  private notion: NotionClient;
  private logger: DiscordLogger;
  private perplexityClient: PerplexityClient;
  private mentorAgent: MentorAgent;
  private timezone: string;

  constructor(
    client: Client,
    notion: NotionClient,
    logger: DiscordLogger
  ) {
    this.client = client;
    this.notion = notion;
    this.logger = logger;
    this.timezone = process.env.TIMEZONE || 'Europe/Berlin';
    
    // Initialize Perplexity client
    this.perplexityClient = new PerplexityClient(process.env.PERPLEXITY_API_KEY!);
    
    // Initialize Mentor Agent
    this.mentorAgent = new MentorAgent(this.perplexityClient, this.notion);
  }

  /**
   * Initialize the agent
   */
  async initialize(): Promise<void> {
    try {
      await this.mentorAgent.initialize();
      
      await this.logger.success(
        'ALL_USERS_WEEKLY_SCHEDULER',
        'Agent Initialized',
        'Mentor Agent initialized successfully for all-users weekly analysis',
        {
          schedule: 'Every Wednesday at 9 AM'
        }
      );
      
      console.log('✅ All-users weekly scheduler initialized');
    } catch (error) {
      await this.logger.logError(
        error as Error,
        'All-Users Weekly Scheduler Initialization Failed',
        { scheduler: 'all_users_weekly' }
      );
      throw error;
    }
  }

  /**
   * Gather user context for a specific user
   */
  private async gatherUserContext(user: User): Promise<UserContext> {
    try {
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
        throw new Error(`User ${user.name} is paused - skipping weekly analysis`);
      }

      // If status is not 'pause', continue with analysis (even if status is undefined/null)
      console.log('✅ User is active, proceeding with analysis');

      // Get current habits
      const habits = await this.notion.getHabitsByUserId(user.id);
      
      // Get recent proofs (last 30 days to have enough data)
      const allProofs = await this.notion.getProofsByUserId(user.id);
      
      // Filter to last 7 days for recent analysis
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const recentProofs = allProofs.filter((proof: any) => {
        const proofDate = new Date(proof.date);
        return proofDate >= sevenDaysAgo;
      });
      
      // Get learnings
      const learnings = await this.notion.getLearningsByDiscordId(user.discordId);
      
      // Get hurdles
      const hurdles = await this.notion.getHurdlesByDiscordId(user.discordId);
      
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
        discord_id: user.discordId,
        name: user.name,
        timezone: user.timezone,
        best_time: user.bestTime,
        trust_count: user.trustCount || 0,
        personal_channel_id: user.personalChannelId || '',
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

      return userContext;
    } catch (error) {
      await this.logger.logError(
        error as Error,
        'User Context Gathering Failed',
        { userId: user.id, userName: user.name }
      );
      throw error;
    }
  }

  /**
   * Get buddy progress data for a user
   */
  private async getBuddyProgressData(user: User): Promise<BuddyProgressData | null> {
    if (!user.buddy) {
      return null;
    }

    try {
      const weekEnd = new Date();
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - 7);

      const buddyProgress = await this.notion.getBuddyProgress(
        user.buddy,
        weekStart,
        weekEnd
      );

      return buddyProgress;
    } catch (error) {
      console.error(`❌ Error getting buddy progress for user ${user.name}:`, error);
      return null;
    }
  }

  /**
   * Check if buddy needs attention and return notification message
   */
  private checkBuddyNeedsAttention(
    buddyProgress: BuddyProgressData | null,
    buddyHabits: any[]
  ): { needsAttention: boolean; message: string } {
    if (!buddyProgress || buddyProgress.habitsWithIssues.length === 0) {
      return { needsAttention: false, message: '' };
    }

    // Check if completion rate is below 80%
    if (buddyProgress.completionRate < 80) {
      const issues = buddyProgress.habitsWithIssues;
      if (issues.length > 0) {
        const firstIssue = issues[0];
        return {
          needsAttention: true,
          message: `Your buddy **${buddyProgress.nickname}** did not reach their goal with **${firstIssue.habitName}**. Their goal was: ${firstIssue.goal}. Ask them why this happened and ask them for feedback.`
        };
      }
    }

    // Check for specific habit issues
    for (const issue of buddyProgress.habitsWithIssues) {
      if (issue.actualFrequency < issue.targetFrequency) {
        return {
          needsAttention: true,
          message: `Your buddy **${buddyProgress.nickname}** did not reach their goal with **${issue.habitName}**. Their goal was: ${issue.goal}. Ask them why this happened and ask them for feedback.`
        };
      }
    }

    return { needsAttention: false, message: '' };
  }

  /**
   * Run weekly analysis for a single user
   */
  private async runAnalysisForUser(user: User): Promise<void> {
    try {
      if (!user.personalChannelId) {
        console.log(`⚠️ No personal channel for user ${user.name}, skipping analysis`);
        return;
      }

      const channel = this.client.channels.cache.get(user.personalChannelId) as TextChannel;
      if (!channel) {
        console.log(`⚠️ Personal channel not found for user ${user.name}`);
        return;
      }

      // Gather user context
      const userContext = await this.gatherUserContext(user);

      // Get buddy progress if user has a buddy
      const buddyProgress = await this.getBuddyProgressData(user);

      // Run Mentor Agent with buddy context
      const mentorResponse = await this.mentorAgent.processRequest(
        userContext,
        `Provide comprehensive weekly habit analysis for ${user.name}. ${buddyProgress ? `Include analysis of your buddy ${buddyProgress.nickname}'s progress.` : ''} Analyze the past 7 days including performance scorecard, pattern insights, success factors, areas for improvement, and next week coaching plan.`,
        { 
          analysisType: 'weekly_comprehensive',
          buddyProgress: buddyProgress || undefined
        }
      );

      // Send analysis to personal channel
      const analysisMessage = `🤖 **Weekly Analysis - ${new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}**

${mentorResponse.message}

**Confidence Score:** ${(mentorResponse.confidence * 100).toFixed(0)}%
${mentorResponse.next_steps && mentorResponse.next_steps.length > 0 ? `\n**Next Steps:**\n${mentorResponse.next_steps.map((step, i) => `${i + 1}. ${step}`).join('\n')}` : ''}`;

      // Split message if too long
      const messageParts = this.splitMessage(analysisMessage, 1900);
      for (const part of messageParts) {
        await channel.send(part);
        await this.delay(1000);
      }

      // Check if buddy needs attention
      if (buddyProgress) {
        const buddyHabits = await this.notion.getHabitsByUserId(userContext.user.id);
        const attentionCheck = this.checkBuddyNeedsAttention(buddyProgress, buddyHabits);
        
        if (attentionCheck.needsAttention) {
          await channel.send(`\n⚠️ **Buddy Check-in Needed**\n\n${attentionCheck.message}`);
        }
      }

      await this.logger.info(
        'ALL_USERS_WEEKLY_SCHEDULER',
        'Analysis Sent',
        `Weekly analysis sent to ${user.name}`,
        {
          userId: user.id,
          hasBuddy: !!buddyProgress,
          buddyNeedsAttention: buddyProgress ? this.checkBuddyNeedsAttention(buddyProgress, []).needsAttention : false
        }
      );

    } catch (error) {
      if (error instanceof Error && error.message.includes('paused')) {
        // User is paused, skip silently
        return;
      }
      
      await this.logger.logError(
        error as Error,
        'User Analysis Failed',
        { userId: user.id, userName: user.name }
      );
      console.error(`❌ Error running analysis for user ${user.name}:`, error);
    }
  }

  /**
   * Run weekly analysis for all active users
   */
  async runWeeklyAnalysisForAllUsers(): Promise<void> {
    try {
      await this.logger.info(
        'ALL_USERS_WEEKLY_SCHEDULER',
        'Weekly Analysis Started',
        'Starting weekly analysis for all active users',
        {
          day: new Date().toLocaleDateString('en-US', { weekday: 'long' }),
          time: new Date().toLocaleTimeString()
        }
      );

      // Get all active users
      const activeUsers = await this.notion.getActiveUsers();
      
      if (activeUsers.length === 0) {
        await this.logger.info(
          'ALL_USERS_WEEKLY_SCHEDULER',
          'No Active Users',
          'No active users found for weekly analysis'
        );
        console.log('⚠️ No active users found');
        return;
      }

      console.log(`📊 Running weekly analysis for ${activeUsers.length} active users`);

      // Run analysis for each user sequentially (to avoid rate limits)
      for (const user of activeUsers) {
        await this.runAnalysisForUser(user);
        // Small delay between users
        await this.delay(2000);
      }

      await this.logger.success(
        'ALL_USERS_WEEKLY_SCHEDULER',
        'Weekly Analysis Completed',
        'Successfully completed weekly analysis for all active users',
        {
          usersProcessed: activeUsers.length
        }
      );

      console.log(`✅ Weekly analysis completed for ${activeUsers.length} users`);

    } catch (error) {
      await this.logger.logError(
        error as Error,
        'Weekly Analysis Failed',
        { scheduler: 'all_users_weekly' }
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
  async startScheduler(): Promise<void> {
    // Wednesday at 9:00 AM (0 9 * * 3)
    const task = cron.schedule('0 9 * * 3', async () => {
      try {
        console.log('📅 All-users weekly scheduler triggered on Wednesday at 9 AM...');
        
        await this.logger.info(
          'ALL_USERS_WEEKLY_SCHEDULER',
          'Scheduled Task Triggered',
          'Weekly analysis triggered by cron on Wednesday at 9 AM',
          {
            cronExpression: '0 9 * * 3',
            timezone: this.timezone,
            triggerTime: new Date().toISOString()
          }
        );
        
        // Run the weekly analysis
        await this.runWeeklyAnalysisForAllUsers();
        
        console.log('✅ All-users weekly analysis completed successfully');
        
      } catch (error) {
        console.error('❌ Error in all-users weekly scheduler:', error);
        await this.logger.logError(
          error as Error,
          'All-Users Weekly Scheduler Error',
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

    console.log(`📅 All-users weekly scheduler started (Wednesday 9 AM, timezone: ${this.timezone})`);
    
    await this.logger.success(
      'ALL_USERS_WEEKLY_SCHEDULER',
      'Scheduler Started',
      'All-users weekly scheduler started successfully',
      {
        cronExpression: '0 9 * * 3',
        timezone: this.timezone,
        description: 'Every Wednesday at 9:00 AM'
      }
    );
  }

  /**
   * Manually trigger weekly analysis (for testing)
   */
  async triggerWeeklyAnalysis(): Promise<void> {
    console.log('🧪 Manually triggering all-users weekly analysis...');
    await this.runWeeklyAnalysisForAllUsers();
  }

  /**
   * Get scheduler status
   */
  getSchedulerStatus(): any {
    return {
      cronExpression: '0 9 * * 3',
      description: 'Every Wednesday at 9:00 AM',
      timezone: this.timezone
    };
  }
}

