import { SlashCommandBuilder, CommandInteraction, AttachmentBuilder, ChatInputCommandInteraction, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } from 'discord.js';
import { NotionClient } from '../notion/client';
import { ChannelHandlers } from './channel-handlers';
import { PersonalChannelManager } from './personal-channel-manager';
import { DiscordLogger } from './discord-logger';
import { User, Habit, Proof, UserProfile } from '../types';

export class CommandHandler {
  private notion: NotionClient;
  private channelHandlers: ChannelHandlers;
  private personalChannelManager: PersonalChannelManager;
  private logger: DiscordLogger;

  constructor(notion: NotionClient, channelHandlers: ChannelHandlers, personalChannelManager: PersonalChannelManager, logger: DiscordLogger) {
    this.notion = notion;
    this.channelHandlers = channelHandlers;
    this.personalChannelManager = personalChannelManager;
    this.logger = logger;
  }

  async handleJoin(interaction: CommandInteraction) {
    const discordId = interaction.user.id;
    
    try {
      // Defer the reply to prevent timeout
      await interaction.deferReply({ ephemeral: false });
      
      console.log('🔍 Starting join process for user:', discordId);
      
      // Enhanced user lookup with detailed logging
      console.log('🔍 Checking if user already exists in database...');
      const existingUser = await this.notion.getUserByDiscordId(discordId);
      
      if (existingUser) {
        console.log('✅ User already exists in database:', existingUser.name);
        
        // User exists, provide helpful message
        await interaction.editReply({
          content: `🎉 **Welcome back, ${existingUser.name}!**\n\n` +
                   `✅ **Status:** You're already registered in the system\n` +
                   `🏠 **Personal Channel:** ${existingUser.personalChannelId ? 'Available' : 'Creating...'}\n` +
                   `📊 **Profile:** Ready for your habits!\n\n` +
                   `💡 **Tip:** Use \`/summary\` to see your progress or \`/habit add\` to add new habits.`
        });
        
        await this.logger.success(
          'COMMANDS',
          'User Already Exists',
          `Existing user ${existingUser.name} accessed join command`,
          {
            userId: existingUser.id,
            discordId: discordId,
            hasPersonalChannel: !!existingUser.personalChannelId
          }
        );
        
        return;
      }
      
      console.log('🆕 User not found, proceeding with registration...');
      
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
      
      // Create new user (we already checked above that user doesn't exist)
      console.log('👤 Creating new user in Notion');
      
      // Create personal channel first
      const guild = interaction.guild;
      if (!guild) {
        await interaction.editReply({
          content: '❌ This command can only be used in a server.'
        });
        return;
      }

      const personalChannelId = await this.personalChannelManager.createPersonalChannel(
        discordId,
        interaction.user.username,
        guild
      );

      if (!personalChannelId) {
        await interaction.editReply({
          content: '❌ Failed to create your personal channel. Please try again.'
        });
        return;
      }

      // Create new user with personal channel ID
      const user = await this.notion.createUser({
        discordId,
        name: interaction.user.username,
        timezone: 'Europe/Berlin', // Default, can be updated later
        bestTime: '09:00', // Default
        trustCount: 0,
        personalChannelId
      });
      console.log('✅ User created successfully:', user.id);

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
      console.error('Error in join command:', error);
      if (interaction.deferred) {
        await interaction.editReply({
          content: 'Sorry, there was an error joining the system. Please try again.'
        });
      } else {
        await interaction.reply({
          content: 'Sorry, there was an error joining the system. Please try again.',
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

      // Get user's first habit as default (in a real implementation, you'd let them choose)
      const habits = await this.notion.getHabitsByUserId(user.id);
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

  async handleKeystoneHabit(interaction: ChatInputCommandInteraction) {
    const discordId = interaction.user.id;
    
    try {
      console.log('🎯 Starting keystone habit creation for user:', discordId);
      
      // Check if user exists
      const user = await this.notion.getUserByDiscordId(discordId);
      if (!user) {
        await interaction.reply({
          content: `❌ **You need to join the system first!**
          
Use \`/join\` to register in the habit tracking system before creating habits.`,
          ephemeral: true
        });
        return;
      }

      // Get all the options
      const name = interaction.options.get('name')?.value as string;
      const domains = (interaction.options.get('domains')?.value as string).split(',').map(d => d.trim());
      const frequency = interaction.options.get('frequency')?.value as number;
      const context = interaction.options.get('context')?.value as string;
      const difficulty = interaction.options.get('difficulty')?.value as string;
      const smartGoal = interaction.options.get('smart_goal')?.value as string;
      const why = interaction.options.get('why')?.value as string;
      const minimalDose = interaction.options.get('minimal_dose')?.value as string;
      const habitLoop = interaction.options.get('habit_loop')?.value as string;
      const implementationIntentions = interaction.options.get('implementation_intentions')?.value as string;
      const hurdles = interaction.options.get('hurdles')?.value as string;
      const reminderType = interaction.options.get('reminder_type')?.value as string;

      // Create the habit in Notion
      const habit = await this.notion.createHabit({
        userId: user.id,
        name,
        domains,
        frequency,
        context,
        difficulty,
        smartGoal,
        why,
        minimalDose,
        habitLoop,
        implementationIntentions,
        hurdles,
        reminderType
      });

      console.log('✅ Keystone habit created successfully:', habit.id);

      // Log successful keystone habit creation
      await this.logger.success(
        'COMMAND',
        'Keystone Habit Created',
        `User ${interaction.user.username} created keystone habit`,
        {
          habitId: habit.id,
          userId: user.id,
          habitName: name,
          frequency: frequency,
          difficulty: difficulty,
          savedToNotion: true
        },
        {
          channelId: interaction.channelId,
          userId: interaction.user.id,
          guildId: interaction.guild?.id
        }
      );

      // Create a beautiful response
      await interaction.reply({
        content: `🎯 **Keystone Habit Created!**

🏆 **${name}** has been added to your habit system!

📊 **Details:**
• **Frequency:** ${frequency} days per week
• **Difficulty:** ${difficulty}
• **Context:** ${context}
• **Goal:** ${smartGoal}

💡 **Why it matters:** ${why}

🛡️ **Minimal dose:** ${minimalDose}

🔄 **Habit Loop:** ${habitLoop}

🎯 **Implementation Intentions:** ${implementationIntentions}

⚠️ **Potential hurdles:** ${hurdles}

🔔 **Reminder:** ${reminderType}

---
🚀 **Next Steps:**
• Use \`/proof\` to submit daily evidence
• Use \`/summary\` to track your progress
• Use \`/learning\` to share insights with the community

💪 Your keystone habit is the foundation of your daily routine. Start small, stay consistent!`,
        ephemeral: false
      });

    } catch (error) {
      console.error('Error creating keystone habit:', error);
      await interaction.reply({
        content: `❌ **Failed to create keystone habit**
        
Sorry, there was an error creating your habit. Please try again or contact support if the issue persists.`,
        ephemeral: true
      });
    }
  }

  async handleOnboard(interaction: ChatInputCommandInteraction) {
    const discordId = interaction.user.id;
    
    // Check if interaction has already been acknowledged
    if (interaction.replied || interaction.deferred) {
      console.log('⚠️ Interaction already acknowledged, skipping');
      return;
    }
    
    try {
      console.log('🎯 Starting onboarding for user:', discordId);
      
      // Check if user exists in main Users DB
      const user = await this.notion.getUserByDiscordId(discordId);
      if (!user) {
        await interaction.reply({
          content: `❌ **Du musst zuerst dem System beitreten!**
          
Verwende \`/join\` um dich im Habit-Tracking System zu registrieren, bevor du dein Profil erstellst.`,
          ephemeral: true
        });
        return;
      }

      // Check if profile already exists
      const existingProfile = await this.notion.getUserProfileByDiscordId(discordId);
      if (existingProfile) {
        await interaction.reply({
          content: `✅ **Du hast bereits ein Profil erstellt!**
          
Du kannst dein Profil jederzeit mit \`/profile\` anzeigen oder mit \`/profile-edit\` bearbeiten.`,
          ephemeral: true
        });
        return;
      }

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
        // First modal - show second modal for additional details
        await this.handleSecondOnboardModal(interaction);
        return;
      } else if (interaction.customId === 'onboard_modal_2') {
        // Second modal - create profile with all data
        await this.handleFinalOnboardSubmission(interaction);
        return;
      }

      // Extract values from first modal
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

  async handleSecondOnboardModal(interaction: any) {
    const discordId = interaction.user.id;
    
    try {
      console.log('🎯 Showing second onboarding modal for user:', discordId);

      // Create second modal for additional details
      const modal = new ModalBuilder()
        .setCustomId('onboard_modal_2')
        .setTitle('🎯 Persönlichkeits-Profil - Zusätzliche Details');

      // Life Domains
      const lifeDomainsInput = new TextInputBuilder()
        .setCustomId('life_domains')
        .setLabel('Lebensbereiche (z.B. Gesundheit, Karriere, Beziehungen)')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('Gesundheit, Karriere, Beziehungen, etc.')
        .setRequired(false);

      // Life Phase
      const lifePhaseInput = new TextInputBuilder()
        .setCustomId('life_phase')
        .setLabel('Lebensphase (z.B. Student, Early Career, Mid Career)')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('Student, Early Career, Mid Career, etc.')
        .setRequired(false);

      // Desired Identity
      const desiredIdentityInput = new TextInputBuilder()
        .setCustomId('desired_identity')
        .setLabel('Gewünschte Identität (Wer willst du werden?)')
        .setStyle(TextInputStyle.Paragraph)
        .setPlaceholder('Beschreibe, wer du in Zukunft sein möchtest...')
        .setRequired(false);

      // Open Space
      const openSpaceInput = new TextInputBuilder()
        .setCustomId('open_space')
        .setLabel('Offener Bereich (Notizen, Gedanken, etc.)')
        .setStyle(TextInputStyle.Paragraph)
        .setPlaceholder('Zusätzliche Notizen, Gedanken, oder was auch immer...')
        .setRequired(false);

      // Add all inputs to modal
      const firstRow = new ActionRowBuilder<TextInputBuilder>().addComponents(lifeDomainsInput);
      const secondRow = new ActionRowBuilder<TextInputBuilder>().addComponents(lifePhaseInput);
      const thirdRow = new ActionRowBuilder<TextInputBuilder>().addComponents(desiredIdentityInput);
      const fourthRow = new ActionRowBuilder<TextInputBuilder>().addComponents(openSpaceInput);

      modal.addComponents(firstRow, secondRow, thirdRow, fourthRow);

      await interaction.showModal(modal);
      console.log('✅ Second onboarding modal shown to user:', discordId);

    } catch (error) {
      console.error('❌ Error showing second modal:', error);
      await interaction.reply({
        content: '❌ Fehler beim Anzeigen des zweiten Formulars. Bitte versuche es erneut.',
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

      // Get user from main DB
      const user = await this.notion.getUserByDiscordId(discordId);
      if (!user) {
        await interaction.reply({
          content: '❌ Benutzer nicht gefunden. Bitte verwende zuerst `/join`.',
          ephemeral: true
        });
        return;
      }

      // Create user profile with all data
      let profile;
      try {
        profile = await this.notion.createUserProfile({
          discordId,
          user,
          joinDate: new Date().toISOString().split('T')[0],
          personalityType: undefined, // Will be filled from first modal data
          coreValues: [], // Will be filled from first modal data
          lifeVision: '', // Will be filled from first modal data
          mainGoals: [], // Will be filled from first modal data
          bigFiveTraits: undefined, // Will be filled from first modal data
          lifeDomains,
          lifePhase,
          desiredIdentity,
          openSpace
        });
      } catch (dbError) {
        console.error('❌ Database error during profile creation:', dbError);
        
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
        content: `🎉 **Willkommen im System!**

✅ Dein vollständiges Persönlichkeits-Profil wurde erfolgreich erstellt!

**Erfasste Daten:**
• **Lebensbereiche:** ${lifeDomains.length > 0 ? lifeDomains.join(', ') : 'Nicht angegeben'}
• **Lebensphase:** ${lifePhase || 'Nicht angegeben'}
• **Gewünschte Identität:** ${desiredIdentity ? desiredIdentity.substring(0, 100) + (desiredIdentity.length > 100 ? '...' : '') : 'Nicht angegeben'}
• **Zusätzliche Notizen:** ${openSpace ? 'Erfasst' : 'Keine'}

Du kannst jetzt:
• \`/habit add\` - Gewohnheiten hinzufügen
• \`/profile\` - Dein vollständiges Profil anzeigen
• \`/profile-edit\` - Profil bearbeiten

Viel Erfolg auf deinem Habit-Tracking Journey! 🚀`,
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
}