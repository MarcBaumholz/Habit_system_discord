import { SlashCommandBuilder, CommandInteraction, AttachmentBuilder, ChatInputCommandInteraction, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, ButtonBuilder, ButtonStyle, ButtonInteraction } from 'discord.js';
import { NotionClient } from '../notion/client';
import { ChannelHandlers } from './channel-handlers';
import { PersonalChannelManager } from './personal-channel-manager';
import { DiscordLogger } from './discord-logger';
import { User, Habit, Proof, UserProfile } from '../types';
import {
  filterHabitsByCurrentBatch,
  getCurrentBatch,
  isBatchInPrePhase,
  isBatchActive,
  getDaysUntilBatchStart
} from '../utils/batch-manager';

interface FirstModalData {
  personalityType?: string;
  coreValues: string[];
  lifeVision: string;
  mainGoals: string[];
  bigFiveTraits?: string;
  timestamp: number;
}

export class CommandHandler {
  private notion: NotionClient;
  private channelHandlers: ChannelHandlers;
  private personalChannelManager: PersonalChannelManager;
  private logger: DiscordLogger;
  private firstModalDataCache: Map<string, FirstModalData> = new Map();
  private personalAssistant?: any; // Optional - will be set if available

  constructor(notion: NotionClient, channelHandlers: ChannelHandlers, personalChannelManager: PersonalChannelManager, logger: DiscordLogger, personalAssistant?: any) {
    this.notion = notion;
    this.channelHandlers = channelHandlers;
    this.personalChannelManager = personalChannelManager;
    this.logger = logger;
    this.personalAssistant = personalAssistant;
    
    // Clean up stale data every 5 minutes
    setInterval(() => {
      this.cleanupStaleModalData();
    }, 5 * 60 * 1000);
  }

  private cleanupStaleModalData(): void {
    const now = Date.now();
    const fiveMinutes = 5 * 60 * 1000;
    
    for (const [discordId, data] of this.firstModalDataCache.entries()) {
      if (now - data.timestamp > fiveMinutes) {
        this.firstModalDataCache.delete(discordId);
        console.log(`🧹 Cleaned up stale modal data for user: ${discordId}`);
      }
    }
  }

  async handleJoin(interaction: CommandInteraction) {
    const discordId = interaction.user.id;
    
    try {
      // Defer the reply to prevent timeout
      await interaction.deferReply({ ephemeral: false });
      
      console.log('🔍 Starting join process for user:', {
        discordId: discordId,
        username: interaction.user.username,
        guildId: interaction.guild?.id,
        channelId: interaction.channelId
      });

      // Validate Notion client is initialized
      if (!this.notion) {
        throw new Error('Notion client is not initialized');
      }

      // Enhanced user lookup with detailed logging
      console.log('🔍 Step 1/4: Checking if user already exists in database...');
      const existingUser = await this.notion.getUserByDiscordId(discordId);
      
      if (existingUser) {
        console.log('✅ User already exists in database:', {
          userId: existingUser.id,
          name: existingUser.name,
          hasPersonalChannel: !!existingUser.personalChannelId,
          currentStatus: existingUser.status || 'active'
        });

        // Check if there's a batch in pre-phase
        const currentBatch = getCurrentBatch();
        let batchEnrolled = false;
        let batchMessage = '';

        if (currentBatch && isBatchInPrePhase()) {
          // Check if user is already in this batch
          const userBatches = existingUser.batch || [];
          if (!userBatches.includes(currentBatch.name)) {
            // Enroll user in the batch
            await this.notion.addUserToBatch(existingUser.id, currentBatch.name);
            batchEnrolled = true;

            const daysUntilStart = getDaysUntilBatchStart() || 0;
            batchMessage = `\n🎯 **Batch Enrollment:** Joined "${currentBatch.name}" (starts in ${daysUntilStart} days)\n`;

            console.log(`✅ Enrolled existing user ${existingUser.name} in batch "${currentBatch.name}"`);
          } else {
            batchMessage = `\n📊 **Batch:** Already enrolled in "${currentBatch.name}"\n`;
          }
        }

        // If user is paused, activate them when they join
        let statusChanged = false;
        if (existingUser.status === 'pause') {
          console.log('🔄 User is paused, activating them...');
          await this.notion.updateUser(existingUser.id, {
            status: 'active'
          });
          statusChanged = true;
          console.log('✅ User status updated from pause to active');
        }

        // Build status message
        const statusMessage = statusChanged
          ? `🔄 **Status Updated:** Your account has been reactivated!\n`
          : `✅ **Status:** ${existingUser.status || 'active'}\n`;

        // User exists, provide helpful message
        await interaction.editReply({
          content: `🎉 **Welcome back, ${existingUser.name}!**\n\n` +
                   statusMessage +
                   batchMessage +
                   `🏠 **Personal Channel:** ${existingUser.personalChannelId ? 'Available' : 'Creating...'}\n` +
                   `📊 **Profile:** Ready for your habits!\n\n` +
                   `💡 **Tip:** Use \`/summary\` to see your progress or \`/habit add\` to add new habits.`
        });

        await this.logger.success(
          'COMMANDS',
          'User Already Exists',
          `Existing user ${existingUser.name} accessed join command${statusChanged ? ' and was reactivated' : ''}${batchEnrolled ? ' and joined batch' : ''}`,
          {
            userId: existingUser.id,
            discordId: discordId,
            hasPersonalChannel: !!existingUser.personalChannelId,
            statusChanged: statusChanged,
            batchEnrolled: batchEnrolled,
            batchName: currentBatch?.name,
            previousStatus: existingUser.status,
            newStatus: statusChanged ? 'active' : existingUser.status
          }
        );

        return;
      }
      
      console.log('🆕 Step 2/4: User not found, proceeding with registration...');
      
      await this.logger.info(
        'COMMAND',
        'Join Command Started',
        `User ${interaction.user.username} initiated join process`,
        {
          discordId: discordId,
          username: interaction.user.username,
          guildId: interaction.guild?.id
        },
        {
          channelId: interaction.channelId,
          userId: interaction.user.id,
          guildId: interaction.guild?.id
        }
      );
      
      // Validate guild exists
      const guild = interaction.guild;
      if (!guild) {
        console.error('❌ Guild not found - command must be used in a server');
        await interaction.editReply({
          content: '❌ This command can only be used in a server.'
        });
        return;
      }

      console.log('🔍 Step 3/4: Creating personal channel...', {
        guildId: guild.id,
        guildName: guild.name,
        username: interaction.user.username
      });

      // Validate PersonalChannelManager is initialized
      if (!this.personalChannelManager) {
        throw new Error('PersonalChannelManager is not initialized');
      }

      const personalChannelId = await this.personalChannelManager.createPersonalChannel(
        discordId,
        interaction.user.username,
        guild
      );

      if (!personalChannelId) {
        console.error('❌ Failed to create personal channel');
        await this.logger.error(
          'COMMAND',
          'Channel Creation Failed',
          `Failed to create personal channel for ${interaction.user.username}`,
          {
            discordId: discordId,
            username: interaction.user.username,
            guildId: guild.id
          },
          {
            channelId: interaction.channelId,
            userId: interaction.user.id,
            guildId: guild.id
          }
        );
        await interaction.editReply({
          content: '❌ Failed to create your personal channel. Please try again.'
        });
        return;
      }

      console.log('✅ Personal channel created successfully:', {
        channelId: personalChannelId,
        username: interaction.user.username
      });

      console.log('🔍 Step 4/4: Creating user in Notion database...');

      // Check if there's a current batch to enroll in
      const currentBatch = getCurrentBatch();
      const userBatches: string[] = [];
      let batchInfo = '';

      if (currentBatch && (isBatchInPrePhase() || isBatchActive())) {
        userBatches.push(currentBatch.name);

        if (isBatchInPrePhase()) {
          const daysUntilStart = getDaysUntilBatchStart() || 0;
          batchInfo = `🎯 **Batch:** Enrolled in "${currentBatch.name}" (starts in ${daysUntilStart} days)\n`;
        } else {
          batchInfo = `🎯 **Batch:** Enrolled in "${currentBatch.name}" (active)\n`;
        }

        console.log(`✅ Enrolling new user in batch "${currentBatch.name}"`);
      }

      // Create new user with personal channel ID, batch, and explicit active status
      const user = await this.notion.createUser({
        discordId,
        name: interaction.user.username,
        timezone: 'Europe/Berlin', // Default, can be updated later
        bestTime: '09:00', // Default
        trustCount: 0,
        personalChannelId,
        status: 'active', // Explicitly set to active for new users
        batch: userBatches.length > 0 ? userBatches : undefined
      });
      
      console.log('✅ User created successfully:', {
        userId: user.id,
        discordId: user.discordId,
        name: user.name,
        personalChannelId: user.personalChannelId
      });

      // Log successful user creation
      await this.logger.success(
        'COMMAND',
        'New User Joined',
        `New user ${interaction.user.username} joined the system`,
        {
          userId: user.id,
          discordId: user.discordId,
          personalChannelId: personalChannelId,
          savedToNotion: true
        },
        {
          channelId: interaction.channelId,
          userId: interaction.user.id,
          guildId: interaction.guild?.id
        }
      );

      // Send info log message to main channel (only for new users)
      await this.channelHandlers.postInfoLog(
        `🎉 **New User Joined!**\n` +
        `👤 **User:** ${user.name}\n` +
        `🏠 **Personal Channel:** \`personal-${user.name.toLowerCase()}\`\n` +
        `📝 **Profile:** Created in Notion\n` +
        `🚀 **Status:** Ready for 66-day challenge!`
      );

      // Create welcome message for new user
      const welcomeMessage = `🎉 **Welcome to the Habit System, ${user.name}!**\n\n` +
                            `✅ **Registration Complete!**\n` +
                            `🏠 **Personal Channel:** Created and ready\n` +
                            `📝 **Profile:** Saved in Notion\n` +
                            (batchInfo ? batchInfo : '') +
                            `🚀 **Next Steps:**\n` +
                            `• Use \`/habit add\` to create your first keystone habit\n` +
                            `• Use \`/proof\` to submit daily evidence\n` +
                            `• Use \`/summary\` to track your progress\n` +
                            `• Use \`/learning\` to share insights with the community\n` +
                            `• Check your personal channel for private habit management!\n\n` +
                            `💪 **Ready for your 66-day habit challenge!**`;

      await interaction.editReply({
        content: welcomeMessage
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;
      
      console.error('❌ Error in join command:', {
        discordId: discordId,
        username: interaction.user.username,
        error: errorMessage,
        stack: errorStack,
        guildId: interaction.guild?.id,
        channelId: interaction.channelId
      });

      // Log to DiscordLogger with full context
      await this.logger.error(
        'COMMAND',
        'Join Command Failed',
        `Join command failed for user ${interaction.user.username}: ${errorMessage}`,
        {
          discordId: discordId,
          username: interaction.user.username,
          error: errorMessage,
          errorType: error instanceof Error ? error.constructor.name : typeof error,
          guildId: interaction.guild?.id,
          stack: errorStack
        },
        {
          channelId: interaction.channelId,
          userId: interaction.user.id,
          guildId: interaction.guild?.id
        }
      );

      // Provide specific error messages based on error type
      let userFacingMessage = 'Sorry, there was an error joining the system. Please try again.';
      
      if (errorMessage.includes('Notion') || errorMessage.includes('database')) {
        userFacingMessage = '❌ **Database Error**\n\nSorry, there was an issue connecting to the database. Please try again in a moment.';
      } else if (errorMessage.includes('channel') || errorMessage.includes('Discord')) {
        userFacingMessage = '❌ **Channel Creation Error**\n\nSorry, there was an issue creating your personal channel. Please check bot permissions and try again.';
      } else if (errorMessage.includes('permission') || errorMessage.includes('access')) {
        userFacingMessage = '❌ **Permission Error**\n\nSorry, the bot doesn\'t have the required permissions. Please contact an administrator.';
      }

      if (interaction.deferred) {
        await interaction.editReply({
          content: userFacingMessage
        });
      } else {
        await interaction.reply({
          content: userFacingMessage,
          ephemeral: true
        });
      }
    }
  }


  async handleProof(interaction: CommandInteraction) {
    if (!interaction.isChatInputCommand()) return;
    
    const unit = interaction.options.getString('unit') || '';
    const note = interaction.options.getString('note') || '';
    const isMinimalDose = interaction.options.getBoolean('minimal_dose') || false;
    const isCheatDay = interaction.options.getBoolean('cheat_day') || false;
    const attachment = interaction.options.getAttachment('attachment');

    try {
      console.log('🔍 Starting proof submission for user:', interaction.user.id);
      
      const user = await this.notion.getUserByDiscordId(interaction.user.id);
      if (!user) {
        console.log('❌ User not found, redirecting to join');
        await interaction.reply({
          content: 'Please use `/join` first to register in the system.',
          ephemeral: true
        });
        return;
      }

      console.log('✅ User found:', user.name);

      // For MVP, we'll create a simple proof without habit relation
      // This avoids the Notion relation requirement for now
      const proofData = {
        userId: user.id,
        habitId: user.id, // Using user ID as placeholder for now
        date: new Date().toISOString().split('T')[0],
        unit,
        note,
        attachmentUrl: attachment?.url,
        isMinimalDose,
        isCheatDay
      };

      console.log('📝 Creating proof with data:', proofData);
      const proof = await this.notion.createProof(proofData, proofData.attachmentUrl);
      console.log('✅ Proof created successfully:', proof.id);

      // Log successful proof creation
      await this.logger.success(
        'COMMAND',
        'Proof Command Completed',
        `User ${interaction.user.username} submitted proof via command`,
        {
          proofId: proof.id,
          userId: user.id,
          unit: unit,
          isMinimalDose: isMinimalDose,
          isCheatDay: isCheatDay,
          savedToNotion: true
        },
        {
          channelId: interaction.channelId,
          userId: interaction.user.id,
          guildId: interaction.guild?.id
        }
      );

      const emoji = isMinimalDose ? '⭐' : isCheatDay ? '🎯' : '✅';
      const typeText = isMinimalDose ? 'Minimal Dose' : isCheatDay ? 'Cheat Day' : 'Full Proof';
      
      await interaction.reply({
        content: `${emoji} **${typeText} Submitted!**

📊 **Proof Details:**
• Unit: ${unit}
• Note: ${note || 'No additional notes'}
• Type: ${typeText}
• Date: ${new Date().toLocaleDateString()}

✅ Saved to Notion database
${isMinimalDose ? '⭐ Every bit counts - minimal dose accepted!' : isCheatDay ? '🎯 Planned rest day - you\'re still on track!' : '💪 Great job staying consistent!'}`,
        ephemeral: false
      });

      // Post to learnings channel if it's a significant proof
      if (note && note.length > 10) {
        await this.channelHandlers.postToLearningsChannel(
          `**Proof Insight**: ${note}`,
          interaction.user.id
        );
      }

    } catch (error) {
      console.error('Error submitting proof:', error);
      await interaction.reply({
        content: 'Sorry, there was an error submitting your proof. Please try again.',
        ephemeral: true
      });
    }
  }

  async handleSummary(interaction: CommandInteraction) {
    if (!interaction.isChatInputCommand()) return;
    
    try {
      console.log('📊 Getting summary for user:', interaction.user.username);
      
      // Defer the reply to prevent timeout
      await interaction.deferReply({ ephemeral: false });
      
      const user = await this.notion.getUserByDiscordId(interaction.user.id);
      if (!user) {
        await interaction.editReply({
          content: 'Please use `/join` first to register in the system.'
        });
        return;
      }

      console.log('✅ User found:', user.name);

      // Get week parameter if provided
      const week = interaction.options.getInteger('week');
      const weekStart = week ? this.getWeekStartDate(week) : undefined;

      // Get real summary data from Notion
      const summary = await this.notion.getUserSummary(user.id, weekStart);
      
      console.log('📊 Summary data:', summary);

      // Format the summary message with enhanced data
      const weekLabel = week ? `Week ${week}` : 'This Week';
      const weekRange = `${summary.weekStartDate} to ${summary.weekEndDate}`;
      
      // Create habit progress section
      const habitProgressText = summary.habitProgress.length > 0 
        ? summary.habitProgress.map(habit => {
            const status = habit.completionRate >= 100 ? '✅' : habit.completionRate >= 50 ? '🟡' : '❌';
            const lastProof = habit.lastProofDate ? ` (Last: ${new Date(habit.lastProofDate).toLocaleDateString()})` : ' (No proofs yet)';
            return `${status} **${habit.habitName}**: ${habit.actualFrequency}/${habit.targetFrequency} (${habit.completionRate}%)${lastProof}`;
          }).join('\n')
        : 'No habits configured yet. Use `/keystonehabit` to create your first habit!';
      
      // Create motivational message based on performance
      let motivationalMessage = '';
      if (summary.completionRate >= 100) {
        motivationalMessage = '🔥 **INCREDIBLE!** You\'re crushing all your targets!';
      } else if (summary.completionRate >= 75) {
        motivationalMessage = '💪 **Great job!** You\'re doing really well!';
      } else if (summary.completionRate >= 50) {
        motivationalMessage = '👍 **Good progress!** Keep building momentum!';
      } else if (summary.completionRate > 0) {
        motivationalMessage = '🚀 **Getting started!** Every step counts!';
      } else {
        motivationalMessage = '🌟 **Ready to begin!** Use `/proof` to start tracking!';
      }
      
      await interaction.editReply({
        content: `📊 **Your Weekly Summary - ${weekLabel}**
📅 **Week:** ${weekRange}

🎯 **Overall Progress:**
• ✅ Total proofs: ${summary.weekProofs} submitted
• ⭐ Minimal doses: ${summary.minimalDoses} days  
• 🎯 Cheat days: ${summary.cheatDays} days
• 📈 Overall completion: ${summary.completionRate}%

💪 **Streak Status:**
• 🔥 Current streak: ${summary.currentStreak} days
• 🏆 Best streak: ${summary.bestStreak} days
• 📊 Total habits: ${summary.totalHabits}

🎯 **Habit Breakdown:**
${habitProgressText}

${motivationalMessage}
Use \`/proof\` daily to maintain your momentum!`
      });

      // Log successful summary command
      await this.logger.success(
        'COMMAND',
        'Summary Command Completed',
        `User ${interaction.user.username} retrieved weekly summary`,
        {
          userId: user.id,
          week: week || 'current',
          weekProofs: summary.weekProofs,
          weekDays: summary.weekDays,
          completionRate: summary.completionRate,
          currentStreak: summary.currentStreak,
          totalHabits: summary.totalHabits
        },
        {
          channelId: interaction.channelId,
          userId: interaction.user.id,
          guildId: interaction.guild?.id
        }
      );
    } catch (error) {
      console.error('Error getting summary:', error);
      
      // Log the error with detailed information
      await this.logger.error(
        'COMMAND',
        'Summary Command Failed',
        `Failed to get summary for user ${interaction.user.username}`,
        {
          error: (error as Error).message,
          stack: (error as Error).stack,
          userId: interaction.user.id,
          week: interaction.options.getInteger('week')
        },
        {
          channelId: interaction.channelId,
          userId: interaction.user.id,
          guildId: interaction.guild?.id
        }
      );
      
        if (interaction.deferred) {
          await interaction.editReply({
            content: 'Sorry, there was an error getting your summary. Please try again.'
          });
        } else {
          await interaction.reply({
            content: 'Sorry, there was an error getting your summary. Please try again.',
            ephemeral: true
          });
        }
    }
  }

  private getWeekStartDate(weekNumber: number): string {
    // Calculate the start date for a specific week number
    const currentYear = new Date().getFullYear();
    const jan1 = new Date(currentYear, 0, 1);
    const weekStart = new Date(jan1.getTime() + (weekNumber - 1) * 7 * 24 * 60 * 60 * 1000);
    return weekStart.toISOString().split('T')[0];
  }

  async handleLearning(interaction: CommandInteraction) {
    if (!interaction.isChatInputCommand()) return;
    
    const learningText = interaction.options.getString('text') || '';

    try {
      console.log('🔍 Starting learning submission for user:', interaction.user.id);
      
      await this.logger.info(
        'COMMAND',
        'Learning Command Started',
        `User ${interaction.user.username} submitted a learning`,
        {
          userId: interaction.user.id,
          username: interaction.user.username,
          learningLength: learningText.length,
          guildId: interaction.guild?.id
        },
        {
          channelId: interaction.channelId,
          userId: interaction.user.id,
          guildId: interaction.guild?.id
        }
      );
      
      const user = await this.notion.getUserByDiscordId(interaction.user.id);
      if (!user) {
        console.log('❌ User not found, redirecting to join');
        await this.logger.warning(
          'COMMAND',
          'Learning Command - User Not Found',
          `User ${interaction.user.username} tried to submit learning but not registered`,
          {
            userId: interaction.user.id,
            username: interaction.user.username
          },
          {
            channelId: interaction.channelId,
            userId: interaction.user.id,
            guildId: interaction.guild?.id
          }
        );
        await interaction.reply({
          content: 'Please use `/join` first to register in the system.',
          ephemeral: true
        });
        return;
      }

      console.log('✅ User found:', user.name);

      // Save learning to Notion
      console.log('📝 Saving learning to Notion...');
      const learning = await this.notion.createLearning({
        userId: user.id,
        habitId: user.id, // Using user ID as placeholder for now
        discordId: interaction.user.id,
        text: learningText,
        createdAt: new Date().toISOString()
      });
      console.log('✅ Learning saved to Notion:', learning.id);

      // Post to learnings channel
      console.log('📢 Posting to learnings channel...');
      await this.channelHandlers.postToLearningsChannel(learningText, interaction.user.id);
      console.log('✅ Posted to Discord channel');

      await this.logger.success(
        'COMMAND',
        'Learning Command Completed',
        `User ${interaction.user.username} successfully shared learning`,
        {
          learningId: learning.id,
          userId: user.id,
          learningLength: learningText.length,
          postedToChannel: true
        },
        {
          channelId: interaction.channelId,
          userId: interaction.user.id,
          guildId: interaction.guild?.id
        }
      );

      await interaction.reply({
        content: `💡 **Learning Shared with Community!**

✅ Your insight has been posted to #learnings-feed
📚 Added to the community knowledge base
🌟 Others can now benefit from your experience

💪 **Keep sharing your learnings!**
Every insight helps the community grow stronger!`,
        ephemeral: false
      });

    } catch (error) {
      console.error('Error sharing learning:', error);
      await interaction.reply({
        content: 'Sorry, there was an error sharing your learning. Please try again.',
        ephemeral: true
      });
    }
  }

  async handleTools(interaction: ChatInputCommandInteraction) {
    const searchQuery = interaction.options.get('search')?.value as string;
    
    try {
      await interaction.deferReply({ ephemeral: false });
      
      // Get the website URL from environment variable or use default
      const websiteUrl = process.env.WEBSITE_URL || 'http://localhost:3000';
      
      let response = `🧰 **Habit Tools Website**\n\n`;
      response += `🌐 **Website:** ${websiteUrl}\n`;
      response += `📊 **Total Tools:** 19 proven strategies\n`;
      response += `🌍 **Languages:** English & German support\n\n`;
      
      if (searchQuery) {
        const searchUrl = `${websiteUrl}/search?q=${encodeURIComponent(searchQuery)}`;
        response += `🔍 **Search for:** "${searchQuery}"\n`;
        response += `🔗 **Direct Link:** ${searchUrl}\n\n`;
      }
      
      response += `**Featured Tools:**\n`;
      response += `• Habit Stacking - Attach new habits to existing routines\n`;
      response += `• Time Boxing - Block specific time slots\n`;
      response += `• Habit Tracker - Visual progress tracking\n`;
      response += `• Pomodoro Technique - Focused work intervals\n`;
      response += `• Advanced Habit Stacking - Complex routine building\n\n`;
      
      response += `💡 **Tip:** Use the search function to find tools for specific challenges like "combining habits" or "no time".\n\n`;
      response += `🚀 **Get Started:** Click the link above to explore all tools with detailed instructions and examples!`;
      
      await interaction.editReply({ content: response });
      
      await this.logger.info(
        'COMMANDS',
        'Tools Command',
        `User ${interaction.user.username} requested habit tools website${searchQuery ? ` with search: "${searchQuery}"` : ''}`,
        {
          searchQuery: searchQuery || null,
          websiteUrl
        },
        {
          channelId: interaction.channelId,
          userId: interaction.user.id,
          guildId: interaction.guild?.id
        }
      );
      
    } catch (error) {
      console.error('Error in handleTools:', error);
      await this.logger.logError(
        error as Error,
        'Tools Command Error',
        {
          searchQuery: searchQuery || null,
          userId: interaction.user.id
        },
        {
          channelId: interaction.channelId,
          userId: interaction.user.id,
          guildId: interaction.guild?.id
        }
      );
      
      if (interaction.replied || interaction.deferred) {
        await interaction.editReply({ content: '❌ There was an error accessing the tools website. Please try again later.' });
      } else {
        await interaction.reply({ content: '❌ There was an error accessing the tools website. Please try again later.', ephemeral: true });
      }
    }
  }

  async handleHurdles(interaction: CommandInteraction) {
    if (!interaction.isChatInputCommand()) return;
    
    try {
      console.log('🚧 Handling hurdles command for user:', interaction.user.username);
      // Acknowledge interaction immediately to avoid Unknown interaction errors
      await interaction.deferReply({ ephemeral: false });
      
      const user = await this.notion.getUserByDiscordId(interaction.user.id);
      if (!user) {
        await interaction.editReply({
          content: 'Please use `/join` first to register in the system.'
        });
        return;
      }

      console.log('✅ User found:', user.name);

      // Get command parameters
      const name = interaction.options.getString('name') || '';
      const type = interaction.options.getString('type') || '';
      const description = interaction.options.getString('description') || '';

      // Get user's habits from current batch (in a real implementation, you'd let them choose)
      const allHabits = await this.notion.getHabitsByUserId(user.id);
      const habits = filterHabitsByCurrentBatch(allHabits);
      const habitId = habits.length > 0 ? habits[0].id : undefined;

      // Create hurdle in Notion
      const hurdle = await this.notion.createHurdle({
        userId: user.id,
        habitId: habitId,
        name,
        hurdleType: type as any,
        description,
        date: new Date().toISOString().split('T')[0]
      });

      console.log('✅ Hurdle created:', hurdle.id);

      // Post to learnings and hurdles channel
      await this.channelHandlers.postToHurdlesChannel(name, description, type, user.name);

      await interaction.editReply({
        content: `🚧 **Hurdle Documented!**

✅ Your hurdle has been posted to #learnings-and-hurdles-feed
📊 **Details:**
• Type: ${type}
• Date: ${new Date().toLocaleDateString()}

💪 **Community Support Available!**
Others can help you find strategies to overcome this hurdle!`,
      });

    } catch (error) {
      console.error('Error documenting hurdle:', error);
      if (interaction.deferred || interaction.replied) {
        try {
          await interaction.editReply({
            content: 'Sorry, there was an error documenting your hurdle. Please try again.'
          });
        } catch (_) {
          await interaction.followUp({ content: 'Sorry, there was an error documenting your hurdle. Please try again.', ephemeral: true });
        }
      } else {
        await interaction.reply({
          content: 'Sorry, there was an error documenting your hurdle. Please try again.',
          ephemeral: true
        });
      }
    }
  }

  async handleOnboard(interaction: ChatInputCommandInteraction) {
    const discordId = interaction.user.id;

    try {
      console.log('🎯 Starting onboarding for user:', discordId);

      // IMPORTANT: Show modal immediately without any async operations
      // This prevents Discord's 3-second interaction timeout
      // Validation will be done in the modal submit handler instead

      // Create modal for onboarding
      const modal = new ModalBuilder()
        .setCustomId('onboard_modal')
        .setTitle('🎯 Persönlichkeits-Profil erstellen');

      // Personality Type
      const personalityInput = new TextInputBuilder()
        .setCustomId('personality_type')
        .setLabel('Persönlichkeitstyp (z.B. INTJ, ENFP)')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('INTJ, ENFP, etc. (optional)')
        .setRequired(false);

      // Core Values
      const coreValuesInput = new TextInputBuilder()
        .setCustomId('core_values')
        .setLabel('Deine 3 wichtigsten Werte')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('z.B. Freiheit, Gesundheit, Familie')
        .setRequired(true);

      // Life Vision
      const lifeVisionInput = new TextInputBuilder()
        .setCustomId('life_vision')
        .setLabel('Deine Lebensvision (5 Jahre)')
        .setStyle(TextInputStyle.Paragraph)
        .setPlaceholder('Was möchtest du in 5 Jahren erreicht haben?')
        .setRequired(true);

      // Main Goals
      const mainGoalsInput = new TextInputBuilder()
        .setCustomId('main_goals')
        .setLabel('Deine 3 Hauptziele (66 Tage)')
        .setStyle(TextInputStyle.Paragraph)
        .setPlaceholder('Ein Ziel pro Zeile')
        .setRequired(true);

      // Big Five Traits
      const bigFiveInput = new TextInputBuilder()
        .setCustomId('big_five')
        .setLabel('Big Five Traits (optional)')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('Offenheit:7, Gewissenhaftigkeit:8, etc.')
        .setRequired(false);

      // Add all inputs to modal (Discord limit: 5 inputs per modal)
      const firstRow = new ActionRowBuilder<TextInputBuilder>().addComponents(personalityInput);
      const secondRow = new ActionRowBuilder<TextInputBuilder>().addComponents(coreValuesInput);
      const thirdRow = new ActionRowBuilder<TextInputBuilder>().addComponents(lifeVisionInput);
      const fourthRow = new ActionRowBuilder<TextInputBuilder>().addComponents(mainGoalsInput);
      const fifthRow = new ActionRowBuilder<TextInputBuilder>().addComponents(bigFiveInput);

      modal.addComponents(firstRow, secondRow, thirdRow, fourthRow, fifthRow);

      await interaction.showModal(modal);

      console.log('✅ First onboarding modal shown to user:', discordId);
      
    } catch (error) {
      console.error('❌ Error in handleOnboard:', error);
      await this.logger.logError(
        error as Error,
        'Onboard Command',
        {
          commandName: 'onboard',
          userId: interaction.user.id,
          guildId: interaction.guild?.id
        },
        {
          channelId: interaction.channelId,
          userId: interaction.user.id,
          guildId: interaction.guild?.id
        }
      );

      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({
          content: '❌ Es gab einen Fehler beim Starten des Onboarding-Prozesses!',
          ephemeral: true
        });
      }
    }
  }

  async handleOnboardModalSubmit(interaction: any) {
    const discordId = interaction.user.id;

    // Check if interaction has already been acknowledged
    if (interaction.replied || interaction.deferred) {
      console.log('⚠️ Modal interaction already acknowledged, skipping');
      return;
    }

    try {
      console.log('🎯 Processing onboarding modal for user:', discordId);

      // Check which modal this is
      if (interaction.customId === 'onboard_modal') {
        // First modal - defer reply to prevent timeout, then validate user

        // Defer the reply early to prevent timeout during database checks
        await interaction.deferReply({ ephemeral: true });

        // Extract values from first modal first
        const personalityType = interaction.fields.getTextInputValue('personality_type') || undefined;
        const coreValues = interaction.fields.getTextInputValue('core_values').split(',').map((v: string) => v.trim()).filter((v: string) => v.length > 0);
        const lifeVision = interaction.fields.getTextInputValue('life_vision');
        const mainGoals = interaction.fields.getTextInputValue('main_goals').split('\n').map((g: string) => g.trim()).filter((g: string) => g.length > 0);
        const bigFiveTraits = interaction.fields.getTextInputValue('big_five') || undefined;

        // Validate user exists in database BEFORE proceeding
        const user = await this.notion.getUserByDiscordId(discordId);
        if (!user) {
          await interaction.editReply({
            content: '❌ **Du musst zuerst dem System beitreten! / You must join the system first!**\n\nVerwende `/join` um dich im Habit-Tracking System zu registrieren.\nUse `/join` to register in the habit tracking system.'
          });
          return;
        }

        // Check if profile already exists
        const existingProfile = await this.notion.getUserProfileByDiscordId(discordId);
        if (existingProfile) {
          await interaction.editReply({
            content: '✅ **Du hast bereits ein Profil erstellt! / You already have a profile!**\n\nDu kannst dein Profil jederzeit mit `/profile-edit` bearbeiten.\nYou can edit your profile anytime with `/profile-edit`.'
          });
          return;
        }

        // Store first modal data temporarily
        this.firstModalDataCache.set(discordId, {
          personalityType,
          coreValues,
          lifeVision,
          mainGoals,
          bigFiveTraits,
          timestamp: Date.now()
        });

        console.log('💾 Stored first modal data for user:', discordId, {
          personalityType,
          coreValuesCount: coreValues.length,
          lifeVisionLength: lifeVision.length,
          mainGoalsCount: mainGoals.length,
          hasBigFive: !!bigFiveTraits
        });

        // Reply with a button to trigger the second modal
        // Cannot show modal directly from modal submission - must use button interaction
        const button = new ButtonBuilder()
          .setCustomId('onboard_modal_2_trigger')
          .setLabel('📝 Continue to Additional Details')
          .setStyle(ButtonStyle.Primary);

        const row = new ActionRowBuilder<ButtonBuilder>().addComponents(button);

        await interaction.editReply({
          content: '✅ **Erste Formular-Daten gespeichert!** Weiter zum nächsten Schritt:',
          components: [row]
        });
        return;
      } else if (interaction.customId === 'onboard_modal_2') {
        // Second modal - create profile with all data
        await this.handleFinalOnboardSubmission(interaction);
        return;
      }

      // Extract values from first modal (legacy code path - should not be reached)
      const personalityType = interaction.fields.getTextInputValue('personality_type') || undefined;
      const coreValues = interaction.fields.getTextInputValue('core_values').split(',').map((v: string) => v.trim()).filter((v: string) => v.length > 0);
      const lifeVision = interaction.fields.getTextInputValue('life_vision');
      const mainGoals = interaction.fields.getTextInputValue('main_goals').split('\n').map((g: string) => g.trim()).filter((g: string) => g.length > 0);
      const bigFiveTraits = interaction.fields.getTextInputValue('big_five') || undefined;

      // Get user from main DB
      const user = await this.notion.getUserByDiscordId(discordId);
      if (!user) {
        await interaction.reply({
          content: '❌ Benutzer nicht gefunden. Bitte verwende zuerst `/join`.',
          ephemeral: true
        });
        return;
      }

      // Create user profile with better error handling
      let profile;
      try {
        profile = await this.notion.createUserProfile({
          discordId,
          user,
          joinDate: new Date().toISOString().split('T')[0],
          personalityType,
          coreValues,
          lifeVision,
          mainGoals,
          bigFiveTraits
        });
      } catch (dbError) {
        console.error('❌ Database error during profile creation:', dbError);
        
        // Check if it's a database not found error
        if (dbError instanceof Error && dbError.message.includes('Could not find database')) {
          await interaction.reply({
            content: `❌ **Personality Database nicht gefunden!**

Das Personality Database wurde noch nicht in Notion erstellt oder ist nicht mit der Integration verbunden.

**Bitte erstelle das Database:**
1. Gehe zu deinem Notion Workspace
2. Erstelle eine neue Database namens "Personality DB"
3. Teile sie mit der "Discord Habit System" Integration
4. Kopiere die Database ID und füge sie zur .env Datei hinzu

**Temporär:** Du kannst trotzdem Gewohnheiten mit \`/habit add\` hinzufügen!`,
            ephemeral: true
          });
          return;
        } else {
          throw dbError; // Re-throw other errors
        }
      }

      console.log('✅ User profile created:', profile.id);

      await interaction.reply({
        content: `🎉 **Willkommen im System!**

✅ Dein Persönlichkeits-Profil wurde erfolgreich erstellt!

**Deine Daten:**
• **Persönlichkeit:** ${personalityType || 'Nicht angegeben'}
• **Werte:** ${coreValues.join(', ')}
• **Vision:** ${lifeVision.substring(0, 100)}${lifeVision.length > 100 ? '...' : ''}
• **Ziele:** ${mainGoals.length} Ziele definiert

Du kannst jetzt:
• \`/habit add\` - Gewohnheiten hinzufügen
• \`/profile\` - Dein Profil anzeigen
• \`/profile-edit\` - Profil bearbeiten

Viel Erfolg auf deinem Habit-Tracking Journey! 🚀`,
        ephemeral: false
      });

      await this.logger.success(
        'PROFILE_CREATED',
        'User Profile Created',
        `User ${interaction.user.username} created their personality profile`,
        {
          userId: discordId,
          profileId: profile.id,
          personalityType,
          coreValuesCount: coreValues.length,
          goalsCount: mainGoals.length
        },
        {
          channelId: interaction.channelId,
          userId: discordId,
          guildId: interaction.guild?.id
        }
      );

    } catch (error) {
      console.error('❌ Error processing onboarding modal:', error);
      await this.logger.logError(
        error as Error,
        'Onboard Modal Submit',
        {
          userId: discordId
        },
        {
          channelId: interaction.channelId,
          userId: discordId,
          guildId: interaction.guild?.id
        }
      );

      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({
          content: '❌ Es gab einen Fehler beim Speichern deines Profils. Bitte versuche es erneut.',
          ephemeral: true
        });
      }
    }
  }

  async handleSecondOnboardModal(interaction: ButtonInteraction) {
    const discordId = interaction.user.id;

    try {
      console.log('🎯 Showing second onboarding modal for user:', discordId);

      // Create second modal for additional details
      const modal = new ModalBuilder()
        .setCustomId('onboard_modal_2')
        .setTitle('🎯 Profil - Weitere Details');

      // Life Domains
      const lifeDomainsInput = new TextInputBuilder()
        .setCustomId('life_domains')
        .setLabel('Lebensbereiche / Life Domains')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('Gesundheit, Karriere, Beziehungen / Health, Career, Relationships')
        .setRequired(false);

      // Life Phase
      const lifePhaseInput = new TextInputBuilder()
        .setCustomId('life_phase')
        .setLabel('Lebensphase / Life Phase')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('Student, Early Career, Mid Career, etc.')
        .setRequired(false);

      // Desired Identity
      const desiredIdentityInput = new TextInputBuilder()
        .setCustomId('desired_identity')
        .setLabel('Gewünschte Identität / Desired Identity')
        .setStyle(TextInputStyle.Paragraph)
        .setPlaceholder('Wer willst du werden? / Who do you want to become?')
        .setRequired(false);

      // Open Space
      const openSpaceInput = new TextInputBuilder()
        .setCustomId('open_space')
        .setLabel('Offener Bereich / Open Space')
        .setStyle(TextInputStyle.Paragraph)
        .setPlaceholder('Zusätzliche Notizen / Additional notes')
        .setRequired(false);

      // Add all inputs to modal
      const firstRow = new ActionRowBuilder<TextInputBuilder>().addComponents(lifeDomainsInput);
      const secondRow = new ActionRowBuilder<TextInputBuilder>().addComponents(lifePhaseInput);
      const thirdRow = new ActionRowBuilder<TextInputBuilder>().addComponents(desiredIdentityInput);
      const fourthRow = new ActionRowBuilder<TextInputBuilder>().addComponents(openSpaceInput);

      modal.addComponents(firstRow, secondRow, thirdRow, fourthRow);

      // Verify modal is constructed properly before showing
      console.log('📋 Second modal constructed with components:', {
        customId: modal.data.custom_id,
        title: modal.data.title,
        componentCount: modal.data.components?.length || 0
      });

      await interaction.showModal(modal);
      console.log('✅ Second onboarding modal shown successfully to user:', discordId);

    } catch (error) {
      console.error('❌ Error showing second modal:', error);

      // Detailed error logging
      await this.logger.logError(
        error as Error,
        'Second Onboard Modal Display Error',
        {
          userId: discordId,
          errorMessage: error instanceof Error ? error.message : String(error),
          errorStack: error instanceof Error ? error.stack : undefined,
          interactionType: interaction.type,
          customId: interaction.customId
        },
        {
          channelId: interaction.channelId,
          userId: discordId,
          guildId: interaction.guild?.id
        }
      );

      // Bilingual error message
      await interaction.reply({
        content: `❌ **Fehler beim Anzeigen des zweiten Formulars / Error displaying second form**

Es gab ein Problem beim Laden des zweiten Formulars. Bitte versuche den Onboarding-Prozess erneut mit \`/onboard\`.

There was a problem loading the second form. Please try the onboarding process again with \`/onboard\`.

**Fehlerdetails / Error details:** ${error instanceof Error ? error.message : 'Unknown error'}`,
        ephemeral: true
      });
    }
  }

  async handleFinalOnboardSubmission(interaction: any) {
    const discordId = interaction.user.id;
    
    try {
      console.log('🎯 Processing final onboarding submission for user:', discordId);

      // Defer reply early to avoid Discord "Unknown interaction" on longer Notion operations
      try {
        if (!interaction.replied && !interaction.deferred) {
          await interaction.deferReply({ ephemeral: false });
        }
      } catch (deferError) {
        console.warn('⚠️ Failed to defer reply for final onboarding submission:', deferError);
      }

      // Extract values from second modal
      const lifeDomains = interaction.fields.getTextInputValue('life_domains')?.split(',').map((v: string) => v.trim()).filter((v: string) => v.length > 0) || [];
      const lifePhase = interaction.fields.getTextInputValue('life_phase') || undefined;
      const desiredIdentity = interaction.fields.getTextInputValue('desired_identity') || undefined;
      const openSpace = interaction.fields.getTextInputValue('open_space') || undefined;

      // Retrieve stored first modal data
      const firstModalData = this.firstModalDataCache.get(discordId);
      if (!firstModalData) {
        console.error('❌ First modal data not found for user:', discordId);
        const errorMessage = {
          content: `❌ **Fehler: Erste Formulardaten nicht gefunden! / Error: First form data not found!**

Bitte starte den Onboarding-Prozess neu mit \`/onboard\`.
Please restart the onboarding process with \`/onboard\`.

Falls das Problem weiterhin besteht, kontaktiere einen Administrator.
If the problem persists, contact an administrator.`,
          ephemeral: true
        };
        
        if (interaction.replied || interaction.deferred) {
          await interaction.followUp(errorMessage);
        } else {
          await interaction.reply(errorMessage);
        }
        return;
      }

      console.log('📥 Retrieved first modal data for user:', discordId, {
        personalityType: firstModalData.personalityType,
        coreValuesCount: firstModalData.coreValues.length,
        lifeVisionLength: firstModalData.lifeVision.length,
        mainGoalsCount: firstModalData.mainGoals.length,
        hasBigFive: !!firstModalData.bigFiveTraits
      });

      // Get user from main DB
      const user = await this.notion.getUserByDiscordId(discordId);
      if (!user) {
        // Clean up cache on error
        this.firstModalDataCache.delete(discordId);

        const errorMessage = {
          content: `❌ **Du musst zuerst dem System beitreten! / You must join the system first!**

Verwende \`/join\` um dich im Habit-Tracking System zu registrieren, bevor du dein Profil erstellst.
Use \`/join\` to register in the habit tracking system before creating your profile.`
        };

        if (interaction.replied || interaction.deferred) {
          await interaction.editReply(errorMessage);
        } else {
          await interaction.reply({ ...errorMessage, ephemeral: true });
        }
        return;
      }

      // Check if profile already exists (prevent duplicates)
      const existingProfile = await this.notion.getUserProfileByDiscordId(discordId);
      if (existingProfile) {
        // Clean up cache since we won't create a new profile
        this.firstModalDataCache.delete(discordId);

        const errorMessage = {
          content: `✅ **Du hast bereits ein Profil erstellt! / You already have a profile!**

Du kannst dein Profil jederzeit mit \`/profile\` anzeigen oder mit \`/profile-edit\` bearbeiten.
You can view your profile with \`/profile\` or edit it with \`/profile-edit\` anytime.`
        };

        if (interaction.replied || interaction.deferred) {
          await interaction.editReply(errorMessage);
        } else {
          await interaction.reply({ ...errorMessage, ephemeral: true });
        }
        return;
      }

      // Create user profile with all data (first modal + second modal)
      let profile;
      try {
        profile = await this.notion.createUserProfile({
          discordId,
          user,
          joinDate: new Date().toISOString().split('T')[0],
          personalityType: firstModalData.personalityType,
          coreValues: firstModalData.coreValues,
          lifeVision: firstModalData.lifeVision,
          mainGoals: firstModalData.mainGoals,
          bigFiveTraits: firstModalData.bigFiveTraits,
          lifeDomains,
          lifePhase,
          desiredIdentity,
          openSpace
        });
        
        // Clear cached data after successful save
        this.firstModalDataCache.delete(discordId);
        console.log('✅ Profile created successfully, cleared cached data for user:', discordId);

        // Regenerate AI profile after personality profile creation
        if (this.personalAssistant) {
          try {
            await this.personalAssistant.regenerateProfile(discordId);
          } catch (error) {
            console.error('⚠️ Error regenerating AI profile after personality creation:', error);
          }
        }
      } catch (dbError) {
        console.error('❌ Database error during profile creation:', dbError);
        
        // Clean up cache on error to prevent stale data
        this.firstModalDataCache.delete(discordId);
        
        if (dbError instanceof Error && dbError.message.includes('Could not find database')) {
          await interaction.reply({
            content: `❌ **Personality Database nicht gefunden!**

Das Personality Database wurde noch nicht in Notion erstellt oder ist nicht mit der Integration verbunden.

**Bitte erstelle das Database:**
1. Gehe zu deinem Notion Workspace
2. Erstelle eine neue Database namens "Personality DB"
3. Teile sie mit der "Discord Habit System" Integration
4. Kopiere die Database ID und füge sie zur .env Datei hinzu

**Temporär:** Du kannst trotzdem Gewohnheiten mit \`/habit add\` hinzufügen!`,
            ephemeral: true
          });
          return;
        } else {
          throw dbError;
        }
      }

      console.log('✅ User profile created with all fields:', profile.id);

      const successMessage = {
        content: `🎉 **Willkommen im System! / Welcome to the System!**

✅ Dein vollständiges Persönlichkeits-Profil wurde erfolgreich erstellt!
✅ Your complete personality profile has been successfully created!

**Erfasste Daten / Captured Data:**
• **Lebensbereiche / Life Domains:** ${lifeDomains.length > 0 ? lifeDomains.join(', ') : 'Nicht angegeben / Not specified'}
• **Lebensphase / Life Phase:** ${lifePhase || 'Nicht angegeben / Not specified'}
• **Gewünschte Identität / Desired Identity:** ${desiredIdentity ? desiredIdentity.substring(0, 100) + (desiredIdentity.length > 100 ? '...' : '') : 'Nicht angegeben / Not specified'}
• **Zusätzliche Notizen / Additional Notes:** ${openSpace ? 'Erfasst / Captured' : 'Keine / None'}

**Du kannst jetzt / You can now:**
• \`/profile\` - Dein vollständiges Profil anzeigen / View your complete profile
• \`/profile-edit\` - Profil bearbeiten / Edit profile

Viel Erfolg auf deinem Habit-Tracking Journey! 🚀
Good luck on your habit-tracking journey! 🚀`,
        ephemeral: false
      };

      if (interaction.replied) {
        await interaction.followUp(successMessage);
      } else if (interaction.deferred) {
        await interaction.editReply(successMessage);
      } else {
        await interaction.reply(successMessage);
      }

      await this.logger.success(
        'PROFILE_CREATED',
        'Complete User Profile Created',
        `User ${interaction.user.username} created their complete personality profile`,
        {
          userId: discordId,
          profileId: profile.id,
          lifeDomainsCount: lifeDomains.length,
          hasLifePhase: !!lifePhase,
          hasDesiredIdentity: !!desiredIdentity,
          hasOpenSpace: !!openSpace
        },
        {
          channelId: interaction.channelId,
          userId: discordId,
          guildId: interaction.guild?.id
        }
      );

    } catch (error) {
      console.error('❌ Error processing final onboarding submission:', error);
      
      // Clean up cache on any error to prevent stale data
      this.firstModalDataCache.delete(discordId);
      
      const errorText = `❌ **Es gab einen Fehler beim Speichern deines Profils. Bitte versuche es erneut.**
          
**Fehlerdetails:** ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`;
      try {
        if (interaction.replied) {
          await interaction.followUp({ content: errorText, ephemeral: true });
        } else if (interaction.deferred) {
          await interaction.editReply({ content: errorText, ephemeral: true });
        } else {
          await interaction.reply({ content: errorText, ephemeral: true });
        }
      } catch (replyError) {
        console.error('❌ Error sending error reply:', replyError);
      }
    }
  }

  private async isPersonalChannel(interaction: ChatInputCommandInteraction, user: User): Promise<boolean> {
    const channel = interaction.channel;
    if (!channel || !('name' in channel)) {
      return false;
    }

    // Check if channel name starts with "personal-"
    const isPersonalChannelName = channel.name?.startsWith('personal-') ?? false;
    
    // Check if channel ID matches user's personal channel ID
    const matchesPersonalChannelId = user.personalChannelId === channel.id;

    return isPersonalChannelName && matchesPersonalChannelId;
  }

  async handlePause(interaction: ChatInputCommandInteraction) {
    try {
      const discordId = interaction.user.id;
      
      // Defer the reply
      await interaction.deferReply({ ephemeral: true });
      
      console.log('🔍 Starting pause process for user:', discordId);
      
      // Get user from Notion
      const user = await this.notion.getUserByDiscordId(discordId);
      if (!user) {
        await interaction.editReply({
          content: '❌ User not found. Please use `/join` first to register in the system.'
        });
        return;
      }

      // Verify command is used in personal channel
      const isPersonal = await this.isPersonalChannel(interaction, user);
      if (!isPersonal) {
        await interaction.editReply({
          content: '❌ This command can only be used in your personal channel.'
        });
        return;
      }

      // Get command parameters
      const reason = interaction.options.getString('reason');
      const duration = interaction.options.getString('duration') || undefined;

      if (!reason) {
        await interaction.editReply({
          content: '❌ Please provide a reason for pausing.'
        });
        return;
      }

      // Update user status to pause (only Status field - Reason/Duration can be added later to DB)
      const updatedUser = await this.notion.updateUser(user.id, {
        status: 'pause'
      });

      console.log('✅ User paused successfully:', updatedUser.name);

      await this.logger.success(
        'COMMANDS',
        'User Paused',
        `User ${user.name} paused their participation`,
        {
          userId: user.id,
          reason: reason,
          duration: duration || 'not specified'
        },
        {
          channelId: interaction.channelId,
          userId: interaction.user.id,
          guildId: interaction.guild?.id
        }
      );

      const durationText = duration ? `\n⏱️ **Expected Duration:** ${duration}` : '';
      await interaction.editReply({
        content: `⏸️ **Pause Activated**\n\n` +
                 `Your participation in the habit system has been paused.\n\n` +
                 `📝 **Reason:** ${reason}${durationText}\n\n` +
                 `**Status:** Changed to "pause" in Notion\n\n` +
                 `You will not receive weekly analyses or reports while paused.\n` +
                 `Use \`/activate\` to reactivate when you're ready.`
      });

    } catch (error) {
      console.error('❌ Error in pause command:', error);
      
      await this.logger.logError(
        error as Error,
        'Pause Command Error',
        {
          userId: interaction.user.id,
          channelId: interaction.channelId
        },
        {
          channelId: interaction.channelId,
          userId: interaction.user.id,
          guildId: interaction.guild?.id
        }
      );

      if (interaction.deferred) {
        await interaction.editReply({
          content: '❌ Sorry, there was an error pausing your participation. Please try again later.'
        });
      } else {
        await interaction.reply({
          content: '❌ Sorry, there was an error pausing your participation. Please try again later.',
          ephemeral: true
        });
      }
    }
  }

  async handleActivate(interaction: ChatInputCommandInteraction) {
    try {
      const discordId = interaction.user.id;
      
      // Defer the reply
      await interaction.deferReply({ ephemeral: true });
      
      console.log('🔍 Starting activate process for user:', discordId);
      
      // Get user from Notion
      const user = await this.notion.getUserByDiscordId(discordId);
      if (!user) {
        await interaction.editReply({
          content: '❌ User not found. Please use `/join` first to register in the system.'
        });
        return;
      }

      // Verify command is used in personal channel
      const isPersonal = await this.isPersonalChannel(interaction, user);
      if (!isPersonal) {
        await interaction.editReply({
          content: '❌ This command can only be used in your personal channel.'
        });
        return;
      }

      // Update user status to active
      const updatedUser = await this.notion.updateUser(user.id, {
        status: 'active'
      });

      console.log('✅ User activated successfully:', updatedUser.name);

      await this.logger.success(
        'COMMANDS',
        'User Activated',
        `User ${user.name} reactivated their participation`,
        {
          userId: user.id
        },
        {
          channelId: interaction.channelId,
          userId: interaction.user.id,
          guildId: interaction.guild?.id
        }
      );

      await interaction.editReply({
        content: `▶️ **Activated**\n\n` +
                 `Welcome back! Your participation in the habit system has been reactivated.\n\n` +
                 `You will now receive weekly analyses and reports again.\n` +
                 `Good luck with your habits! 💪`
      });

    } catch (error) {
      console.error('❌ Error in activate command:', error);
      
      await this.logger.logError(
        error as Error,
        'Activate Command Error',
        {
          userId: interaction.user.id,
          channelId: interaction.channelId
        },
        {
          channelId: interaction.channelId,
          userId: interaction.user.id,
          guildId: interaction.guild?.id
        }
      );

      if (interaction.deferred) {
        await interaction.editReply({
          content: '❌ Sorry, there was an error activating your participation. Please try again later.'
        });
      } else {
        await interaction.reply({
          content: '❌ Sorry, there was an error activating your participation. Please try again later.',
          ephemeral: true
        });
      }
    }
  }

  async handleProfile(interaction: ChatInputCommandInteraction) {
    const discordId = interaction.user.id;

    try {
      console.log('👤 Retrieving profile for user:', discordId);

      // Defer the reply
      await interaction.deferReply({ ephemeral: false });

      // Check if user exists in main Users DB
      const user = await this.notion.getUserByDiscordId(discordId);
      if (!user) {
        await interaction.editReply({
          content: `❌ **Du bist noch nicht registriert / You are not registered yet**

Verwende \`/join\` um dich im Habit-Tracking System zu registrieren.
Use \`/join\` to register in the habit tracking system.`
        });
        return;
      }

      // Get user profile from Personality DB
      const profile = await this.notion.getUserProfileByDiscordId(discordId);
      if (!profile) {
        await interaction.editReply({
          content: `❌ **Kein Profil gefunden / No Profile Found**

Du hast noch kein Persönlichkeitsprofil erstellt.
You haven't created a personality profile yet.

Verwende \`/onboard\` um dein Profil zu erstellen.
Use \`/onboard\` to create your profile.`
        });
        return;
      }

      console.log('✅ Profile found for user:', discordId);

      // Format profile data for display
      const personalityType = profile.personalityType || 'Nicht angegeben / Not specified';
      const coreValues = profile.coreValues && profile.coreValues.length > 0
        ? profile.coreValues.join(', ')
        : 'Nicht angegeben / Not specified';
      const lifeVision = profile.lifeVision || 'Nicht angegeben / Not specified';
      const mainGoals = profile.mainGoals && profile.mainGoals.length > 0
        ? profile.mainGoals.map((goal, index) => `${index + 1}. ${goal}`).join('\n')
        : 'Nicht angegeben / Not specified';
      const bigFiveTraits = profile.bigFiveTraits || 'Nicht angegeben / Not specified';
      const lifeDomains = profile.lifeDomains && profile.lifeDomains.length > 0
        ? profile.lifeDomains.join(', ')
        : 'Nicht angegeben / Not specified';
      const lifePhase = profile.lifePhase || 'Nicht angegeben / Not specified';
      const desiredIdentity = profile.desiredIdentity || 'Nicht angegeben / Not specified';
      const openSpace = profile.openSpace || 'Nicht angegeben / Not specified';

      // Create formatted profile message
      const profileMessage = `👤 **Dein Persönlichkeitsprofil / Your Personality Profile**

**📋 Grundlegende Informationen / Basic Information:**
• **Persönlichkeitstyp / Personality Type:** ${personalityType}
• **Kernwerte / Core Values:** ${coreValues}
• **Lebensphase / Life Phase:** ${lifePhase}
• **Lebensbereiche / Life Domains:** ${lifeDomains}

**🎯 Vision & Ziele / Vision & Goals:**
• **Lebensvision (5 Jahre) / Life Vision (5 years):**
  ${lifeVision.substring(0, 300)}${lifeVision.length > 300 ? '...' : ''}

• **Hauptziele (66 Tage) / Main Goals (66 days):**
${mainGoals}

**🧠 Persönlichkeitsmerkmale / Personality Traits:**
• **Big Five Traits:** ${bigFiveTraits}

**✨ Identität / Identity:**
• **Gewünschte Identität / Desired Identity:**
  ${desiredIdentity.substring(0, 300)}${desiredIdentity.length > 300 ? '...' : ''}

**📝 Notizen / Notes:**
${openSpace.substring(0, 200)}${openSpace.length > 200 ? '...' : ''}`;

      // Create edit button
      const editButton = new ButtonBuilder()
        .setCustomId('profile_edit_button')
        .setLabel('✏️ Profil bearbeiten / Edit Profile')
        .setStyle(ButtonStyle.Primary);

      const buttonRow = new ActionRowBuilder<ButtonBuilder>().addComponents(editButton);

      await interaction.editReply({
        content: profileMessage,
        components: [buttonRow]
      });

      await this.logger.success(
        'PROFILE_VIEW',
        'Profile Viewed',
        `User ${interaction.user.username} viewed their personality profile`,
        {
          userId: discordId,
          hasProfile: true,
          profileId: profile.id
        },
        {
          channelId: interaction.channelId,
          userId: discordId,
          guildId: interaction.guild?.id
        }
      );

    } catch (error) {
      console.error('❌ Error retrieving profile:', error);
      await this.logger.logError(
        error as Error,
        'Profile View Error',
        {
          userId: discordId
        },
        {
          channelId: interaction.channelId,
          userId: discordId,
          guildId: interaction.guild?.id
        }
      );

      if (interaction.deferred) {
        await interaction.editReply({
          content: `❌ **Fehler beim Laden des Profils / Error loading profile**

Es gab einen Fehler beim Laden deines Profils. Bitte versuche es erneut.
There was an error loading your profile. Please try again.`
        });
      } else {
        await interaction.reply({
          content: `❌ **Fehler beim Laden des Profils / Error loading profile**

Es gab einen Fehler beim Laden deines Profils. Bitte versuche es erneut.
There was an error loading your profile. Please try again.`,
          ephemeral: true
        });
      }
    }
  }

  async handleProfileEdit(interaction: ChatInputCommandInteraction | ButtonInteraction) {
    const discordId = interaction.user.id;

    try {
      console.log('✏️ Starting profile edit for user:', discordId);

      // Try to load profile data quickly to pre-fill the modal
      // If it fails or takes too long, show modal empty and handle in submit handler
      let profile: UserProfile | null = null;
      try {
        // Use Promise.race with timeout to prevent Discord timeout (3 seconds)
        const loadProfile = async (): Promise<UserProfile | null> => {
          try {
            return await this.notion.getUserProfileByDiscordId(discordId);
          } catch (error) {
            return null;
          }
        };

        const timeout = new Promise<UserProfile | null>((resolve) => {
          setTimeout(() => resolve(null), 2000); // 2 second timeout
        });

        profile = await Promise.race([loadProfile(), timeout]);
      } catch (error) {
        console.warn('⚠️ Error loading profile for pre-fill (will continue with empty modal):', error);
        profile = null;
      }

      // Helper function to truncate text to Discord's 4000 character limit
      const truncateForModal = (text: string, maxLength: number = 4000): string => {
        if (!text) return '';
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength - 3) + '...';
      };

      // Create modal for editing (all fields in one modal)
      const modal = new ModalBuilder()
        .setCustomId('profile_edit_modal')
        .setTitle('✏️ Profil bearbeiten / Edit Profile');

      // Personality Type
      const personalityInput = new TextInputBuilder()
        .setCustomId('personality_type')
        .setLabel('Persönlichkeitstyp / Personality Type')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('INTJ, ENFP, etc.')
        .setValue(profile ? truncateForModal(profile.personalityType || '', 4000) : '')
        .setRequired(false);

      // Core Values
      const coreValuesInput = new TextInputBuilder()
        .setCustomId('core_values')
        .setLabel('Kernwerte / Core Values')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('Freiheit, Gesundheit, Familie / Freedom, Health, Family')
        .setValue(profile ? truncateForModal(profile.coreValues?.join(', ') || '', 4000) : '')
        .setRequired(true);

      // Life Vision
      const lifeVisionInput = new TextInputBuilder()
        .setCustomId('life_vision')
        .setLabel('Lebensvision (5 Jahre)')
        .setStyle(TextInputStyle.Paragraph)
        .setPlaceholder('Was möchtest du erreichen? / What do you want to achieve?')
        .setValue(profile ? truncateForModal(profile.lifeVision || '', 4000) : '')
        .setRequired(true);

      // Main Goals
      const mainGoalsInput = new TextInputBuilder()
        .setCustomId('main_goals')
        .setLabel('Hauptziele / Main Goals')
        .setStyle(TextInputStyle.Paragraph)
        .setPlaceholder('Ziel 1\nZiel 2\nZiel 3')
        .setValue(profile ? truncateForModal(profile.mainGoals?.join('\n') || '', 4000) : '')
        .setRequired(true);

      // Big Five Traits
      const bigFiveInput = new TextInputBuilder()
        .setCustomId('big_five')
        .setLabel('Big Five Traits')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('Offenheit:7, Gewissenhaftigkeit:8, etc.')
        .setValue(profile ? truncateForModal(profile.bigFiveTraits || '', 4000) : '')
        .setRequired(false);

      // Add all inputs to modal (Discord limit: 5 inputs per modal)
      const firstRow = new ActionRowBuilder<TextInputBuilder>().addComponents(personalityInput);
      const secondRow = new ActionRowBuilder<TextInputBuilder>().addComponents(coreValuesInput);
      const thirdRow = new ActionRowBuilder<TextInputBuilder>().addComponents(lifeVisionInput);
      const fourthRow = new ActionRowBuilder<TextInputBuilder>().addComponents(mainGoalsInput);
      const fifthRow = new ActionRowBuilder<TextInputBuilder>().addComponents(bigFiveInput);

      modal.addComponents(firstRow, secondRow, thirdRow, fourthRow, fifthRow);

      await interaction.showModal(modal);
      console.log('✅ Profile edit modal shown to user:', discordId, profile ? '(pre-filled)' : '(empty - will load in submit)');

    } catch (error: any) {
      // Ignore "already acknowledged" errors - they happen when multiple bot instances process the same interaction
      if (error.code === 40060) {
        console.warn('⚠️ Interaction already acknowledged (likely by another bot instance or duplicate request)');
        return; // Don't try to reply or log, interaction is already handled
      }

      console.error('❌ Error showing profile edit modal:', error);
      await this.logger.logError(
        error as Error,
        'Profile Edit Modal Error',
        {
          userId: discordId
        },
        {
          channelId: interaction.channelId,
          userId: discordId,
          guildId: interaction.guild?.id
        }
      );

      // Only reply if interaction hasn't been acknowledged yet
      // showModal() acknowledges the interaction, so if it succeeded, we can't reply
      try {
        if (!interaction.replied && !interaction.deferred) {
          await interaction.reply({
            content: `❌ **Fehler beim Öffnen des Bearbeitungsformulars / Error opening edit form**

Es gab einen Fehler beim Öffnen des Bearbeitungsformulars. Bitte versuche es erneut.
There was an error opening the edit form. Please try again.`,
            ephemeral: true
          });
        }
      } catch (replyError: any) {
        // Ignore "already acknowledged" errors - they're expected if showModal() partially succeeded
        if (replyError.code !== 40060) {
          console.error('❌ Error sending error reply:', replyError);
        }
      }
    }
  }

  async handleProfileEditModalSubmit(interaction: any) {
    const discordId = interaction.user.id;

    try {
      console.log('💾 Processing profile edit for user:', discordId);

      // Defer reply early to avoid Discord "Unknown interaction"
      // Handle "Unknown interaction" error (code 10062) - interaction expired (>15 min)
      try {
        if (!interaction.replied && !interaction.deferred) {
          await interaction.deferReply({ ephemeral: false });
        }
      } catch (deferError: any) {
        // If interaction expired, we can't respond - log and return
        if (deferError.code === 10062) {
          console.warn('⚠️ Modal interaction expired (>15 minutes) for user:', discordId);
          return;
        }
        // Re-throw other errors
        throw deferError;
      }

      // Validate user exists in main Users DB
      const user = await this.notion.getUserByDiscordId(discordId);
      if (!user) {
        await interaction.editReply({
          content: `❌ **Du bist noch nicht registriert / You are not registered yet**

Verwende \`/join\` um dich im Habit-Tracking System zu registrieren.
Use \`/join\` to register in the habit tracking system.`
        });
        return;
      }

      // Extract values from modal
      const personalityType = interaction.fields.getTextInputValue('personality_type') || undefined;
      const coreValues = interaction.fields.getTextInputValue('core_values')
        .split(',')
        .map((v: string) => v.trim())
        .filter((v: string) => v.length > 0);
      const lifeVision = interaction.fields.getTextInputValue('life_vision');
      const mainGoals = interaction.fields.getTextInputValue('main_goals')
        .split('\n')
        .map((g: string) => g.trim())
        .filter((g: string) => g.length > 0);
      const bigFiveTraits = interaction.fields.getTextInputValue('big_five') || undefined;

      // Validate required fields
      if (coreValues.length === 0) {
        await interaction.editReply({
          content: `❌ **Ungültige Eingabe / Invalid Input**

Bitte gib mindestens einen Kernwert an.
Please provide at least one core value.`
        });
        return;
      }

      if (!lifeVision || lifeVision.trim().length === 0) {
        await interaction.editReply({
          content: `❌ **Ungültige Eingabe / Invalid Input**

Bitte gib deine Lebensvision an.
Please provide your life vision.`
        });
        return;
      }

      if (mainGoals.length === 0) {
        await interaction.editReply({
          content: `❌ **Ungültige Eingabe / Invalid Input**

Bitte gib mindestens ein Hauptziel an.
Please provide at least one main goal.`
        });
        return;
      }

      // Get existing profile
      const existingProfile = await this.notion.getUserProfileByDiscordId(discordId);
      if (!existingProfile) {
        await interaction.editReply({
          content: `❌ **Profil nicht gefunden / Profile not found**

Dein Profil wurde nicht gefunden. Bitte erstelle es mit \`/onboard\`.
Your profile was not found. Please create it with \`/onboard\`.`
        });
        return;
      }

      // Update profile with new data (keeping other fields unchanged)
      let updatedProfile: UserProfile | null = null;
      try {
        updatedProfile = await this.notion.updateUserProfile(discordId, {
          personalityType,
          coreValues,
          lifeVision,
          mainGoals,
          bigFiveTraits,
          // Keep existing values for fields not in this modal
          lifeDomains: existingProfile.lifeDomains,
          lifePhase: existingProfile.lifePhase,
          desiredIdentity: existingProfile.desiredIdentity,
          openSpace: existingProfile.openSpace
        });
      } catch (updateError: any) {
        console.error('❌ Error in updateUserProfile call:', updateError);
        const errorMessage = updateError?.message || 'Unknown error';
        const errorCode = updateError?.code || 'unknown';
        
        await interaction.editReply({
          content: `❌ **Fehler beim Aktualisieren des Profils / Error updating profile**

Das Profil konnte nicht aktualisiert werden. Bitte versuche es erneut.
The profile could not be updated. Please try again.

**Fehlerdetails / Error details:**
Code: ${errorCode}
Message: ${errorMessage}`
        });
        return;
      }

      if (!updatedProfile) {
        await interaction.editReply({
          content: `❌ **Fehler beim Aktualisieren des Profils / Error updating profile**

Das Profil konnte nicht aktualisiert werden. Bitte versuche es erneut.
The profile could not be updated. Please try again.`
        });
        return;
      }

      console.log('✅ Profile updated successfully:', updatedProfile.id);

      // Regenerate AI profile after personality profile update
      if (this.personalAssistant) {
        try {
          await this.personalAssistant.regenerateProfile(discordId);
        } catch (error) {
          console.error('⚠️ Error regenerating AI profile after personality update:', error);
        }
      }

      await interaction.editReply({
        content: `✅ **Profil erfolgreich aktualisiert! / Profile successfully updated!**

**Aktualisierte Felder / Updated Fields:**
• **Persönlichkeitstyp / Personality Type:** ${personalityType || 'Nicht angegeben / Not specified'}
• **Kernwerte / Core Values:** ${coreValues.join(', ')}
• **Hauptziele / Main Goals:** ${mainGoals.length} Ziele / goals

Verwende \`/profile\` um dein vollständiges Profil anzuzeigen.
Use \`/profile\` to view your complete profile.

**Hinweis / Note:** Um andere Felder wie Lebensbereiche, Lebensphase oder gewünschte Identität zu bearbeiten, führe \`/onboard\` erneut aus oder kontaktiere einen Administrator.
To edit other fields like life domains, life phase, or desired identity, run \`/onboard\` again or contact an administrator.`
      });

      await this.logger.success(
        'PROFILE_UPDATED',
        'Profile Updated',
        `User ${interaction.user.username} updated their personality profile`,
        {
          userId: discordId,
          profileId: updatedProfile.id,
          updatedFields: ['personalityType', 'coreValues', 'lifeVision', 'mainGoals', 'bigFiveTraits']
        },
        {
          channelId: interaction.channelId,
          userId: discordId,
          guildId: interaction.guild?.id
        }
      );

    } catch (error) {
      console.error('❌ Error updating profile:', error);
      await this.logger.logError(
        error as Error,
        'Profile Update Error',
        {
          userId: discordId
        },
        {
          channelId: interaction.channelId,
          userId: discordId,
          guildId: interaction.guild?.id
        }
      );

      const errorText = `❌ **Fehler beim Speichern des Profils / Error saving profile**

Es gab einen Fehler beim Speichern deines Profils. Bitte versuche es erneut.
There was an error saving your profile. Please try again.

**Fehlerdetails / Error details:** ${error instanceof Error ? error.message : 'Unknown error'}`;

      try {
        if (interaction.replied) {
          await interaction.followUp({ content: errorText, ephemeral: true });
        } else if (interaction.deferred) {
          await interaction.editReply({ content: errorText });
        } else {
          await interaction.reply({ content: errorText, ephemeral: true });
        }
      } catch (replyError) {
        console.error('❌ Error sending error reply:', replyError);
      }
    }
  }
}