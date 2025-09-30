import { SlashCommandBuilder, CommandInteraction, AttachmentBuilder, ChatInputCommandInteraction } from 'discord.js';
import { NotionClient } from '../notion/client';
import { ChannelHandlers } from './channel-handlers';
import { PersonalChannelManager } from './personal-channel-manager';
import { DiscordLogger } from './discord-logger';
import { User, Habit, Proof } from '../types';

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
      console.log('🔍 Starting join process for user:', discordId);
      
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
      
      // Check if user already exists
      let user = await this.notion.getUserByDiscordId(discordId);
      let isNewUser = false;
      let channelCreated = false;
      
      if (!user) {
        console.log('👤 Creating new user in Notion');
        isNewUser = true;
        
        // Create personal channel first
        const guild = interaction.guild;
        if (!guild) {
          await interaction.reply({
            content: '❌ This command can only be used in a server.',
            ephemeral: true
          });
          return;
        }

        const personalChannelId = await this.personalChannelManager.createPersonalChannel(
          discordId,
          interaction.user.username,
          guild
        );

        if (!personalChannelId) {
          await interaction.reply({
            content: '❌ Failed to create your personal channel. Please try again.',
            ephemeral: true
          });
          return;
        }

        // Create new user with personal channel ID
        user = await this.notion.createUser({
          discordId,
          name: interaction.user.username,
          timezone: 'Europe/Berlin', // Default, can be updated later
          bestTime: '09:00', // Default
          trustCount: 0,
          personalChannelId
        });
        console.log('✅ User created successfully:', user.id);
        channelCreated = true;

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
      } else {
        console.log('✅ User already exists:', user.name);
        
        // Check if user has a personal channel, if not create one
        if (!user.personalChannelId) {
          console.log('🏠 User exists but no personal channel found, creating one...');
          
          const guild = interaction.guild;
          if (!guild) {
            await interaction.reply({
              content: '❌ This command can only be used in a server.',
              ephemeral: true
            });
            return;
          }

          const personalChannelId = await this.personalChannelManager.createPersonalChannel(
            discordId,
            interaction.user.username,
            guild
          );

          if (personalChannelId) {
            // Update user with personal channel ID
            await this.notion.updateUser(user.id, { personalChannelId });
            console.log('✅ Personal channel created for existing user:', personalChannelId);
            channelCreated = true;

            // Note: No info log message for existing users to avoid spam
          }
        } else {
          console.log('✅ User already has personal channel:', user.personalChannelId);
        }
      }

      // Create appropriate welcome message
      let welcomeMessage = `🎉 **Welcome to the Habit System, ${user.name}!**\n\n`;
      
      if (isNewUser) {
        welcomeMessage += `✅ You're now registered in the system!\n📝 Your profile has been created in Notion\n`;
      } else {
        welcomeMessage += `✅ You're already registered in the system!\n📝 Your profile is ready in Notion\n`;
      }
      
      if (channelCreated) {
        welcomeMessage += `🏠 Your personal channel has been created: \`personal-${user.name.toLowerCase()}\`\n`;
      } else if (user.personalChannelId) {
        welcomeMessage += `🏠 Your personal channel is ready: \`personal-${user.name.toLowerCase()}\`\n`;
      }
      
      welcomeMessage += `\n🚀 **Next Steps:**\n` +
        `• Use \`/habit add\` to create your first keystone habit\n` +
        `• Use \`/proof\` to submit daily evidence\n` +
        `• Use \`/summary\` to track your progress\n` +
        `• Use \`/learning\` to share insights with the community\n` +
        `• Check your personal channel for private habit management!\n\n` +
        `💪 **Ready for your 66-day habit challenge!**`;

      await interaction.reply({
        content: welcomeMessage,
        ephemeral: false
      });
    } catch (error) {
      console.error('Error in join command:', error);
      await interaction.reply({
        content: 'Sorry, there was an error joining the system. Please try again.',
        ephemeral: true
      });
    }
  }

  async handleHabitAdd(interaction: CommandInteraction) {
    if (!interaction.isChatInputCommand()) return;
    
    const name = interaction.options.getString('name') || '';
    const domains = (interaction.options.getString('domains') || '').split(',');
      const frequency = interaction.options.getInteger('frequency') || 1;
    const context = interaction.options.getString('context') || '';
    const difficulty = interaction.options.getString('difficulty') || '';
    const smartGoal = interaction.options.getString('smart_goal') || '';
    const why = interaction.options.getString('why') || '';
    const minimalDose = interaction.options.getString('minimal_dose') || '';
    const habitLoop = interaction.options.getString('habit_loop') || '';
    const implementationIntentions = interaction.options.getString('implementation_intentions') || '';
    const hurdles = interaction.options.getString('hurdles') || '';
    const reminderType = interaction.options.getString('reminder_type') || '';

    try {
      const user = await this.notion.getUserByDiscordId(interaction.user.id);
      if (!user) {
        await interaction.reply({
          content: 'Please use `/join` first to register in the system.',
          ephemeral: true
        });
        return;
      }

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

      await interaction.reply({
        content: `🎯 **Keystone Habit Created: "${habit.name}"**

✅ Habit saved to Notion database
📊 All details recorded for tracking

🚀 **Next Steps:**
• Use \`/proof\` daily to submit evidence
• Share insights with \`/learning\`
• Check progress with \`/summary\`

💪 **Your habit journey starts now!**`,
        ephemeral: false
      });
    } catch (error) {
      console.error('Error creating habit:', error);
      await interaction.reply({
        content: 'Sorry, there was an error creating your habit. Please try again.',
        ephemeral: true
      });
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
      
      const user = await this.notion.getUserByDiscordId(interaction.user.id);
      if (!user) {
        await interaction.reply({
          content: 'Please use `/join` first to register in the system.',
          ephemeral: true
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

      // Format the summary message
      const weekLabel = week ? `Week ${week}` : 'This Week';
      
      await interaction.reply({
        content: `📊 **Your Weekly Summary - ${weekLabel}**

🎯 **This Week's Progress:**
• ✅ Proofs submitted: ${summary.weekProofs}/${summary.weekDays} days
• ⭐ Minimal doses: ${summary.minimalDoses} days  
• 🎯 Cheat days: ${summary.cheatDays} days
• 📈 Completion rate: ${summary.completionRate}%

💪 **Streak Status:**
• Current streak: ${summary.currentStreak} days
• Best streak: ${summary.bestStreak} days
• Total habits tracked: ${summary.totalHabits}

🌟 **Keep up the great work!**
Use \`/proof\` daily to maintain your momentum!`,
        ephemeral: false
      });
    } catch (error) {
      console.error('Error getting summary:', error);
      await interaction.reply({
        content: 'Sorry, there was an error getting your summary. Please try again.',
        ephemeral: true
      });
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

  async handleHurdles(interaction: CommandInteraction) {
    if (!interaction.isChatInputCommand()) return;
    
    try {
      console.log('🚧 Handling hurdles command for user:', interaction.user.username);
      
      const user = await this.notion.getUserByDiscordId(interaction.user.id);
      if (!user) {
        await interaction.reply({
          content: 'Please use `/join` first to register in the system.',
          ephemeral: true
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

      await interaction.reply({
        content: `🚧 **Hurdle Documented!**

✅ Your hurdle has been posted to #learnings-and-hurdles-feed
📊 **Details:**
• Type: ${type}
• Date: ${new Date().toLocaleDateString()}

💪 **Community Support Available!**
Others can help you find strategies to overcome this hurdle!`,
        ephemeral: false
      });

    } catch (error) {
      console.error('Error documenting hurdle:', error);
      await interaction.reply({
        content: 'Sorry, there was an error documenting your hurdle. Please try again.',
        ephemeral: true
      });
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
}