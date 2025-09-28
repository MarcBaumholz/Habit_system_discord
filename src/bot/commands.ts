import { SlashCommandBuilder, CommandInteraction, AttachmentBuilder, ChatInputCommandInteraction } from 'discord.js';
import { NotionClient } from '../notion/client';
import { ChannelHandlers } from './channel-handlers';
import { User, Habit, Proof } from '../types';

export class CommandHandler {
  private notion: NotionClient;
  private channelHandlers: ChannelHandlers;

  constructor(notion: NotionClient, channelHandlers: ChannelHandlers) {
    this.notion = notion;
    this.channelHandlers = channelHandlers;
  }

  async handleJoin(interaction: CommandInteraction) {
    const discordId = interaction.user.id;
    
    try {
      console.log('🔍 Starting join process for user:', discordId);
      
      // Check if user already exists
      let user = await this.notion.getUserByDiscordId(discordId);
      
      if (!user) {
        console.log('👤 Creating new user in Notion');
        // Create new user
        user = await this.notion.createUser({
          discordId,
          name: interaction.user.username,
          timezone: 'Europe/Berlin', // Default, can be updated later
          bestTime: '09:00', // Default
          trustCount: 0
        });
        console.log('✅ User created successfully:', user.id);
      } else {
        console.log('✅ User already exists:', user.name);
      }

      await interaction.reply({
        content: `🎉 **Welcome to the Habit System, ${user.name}!**

✅ You're now registered in the system!
📝 Your profile has been created in Notion

🚀 **Next Steps:**
• Use \`/habit add\` to create your first keystone habit
• Use \`/proof\` to submit daily evidence
• Use \`/summary\` to track your progress
• Use \`/learning\` to share insights with the community

💪 **Ready for your 66-day habit challenge!**`,
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
      const proof = await this.notion.createProof(proofData);
      console.log('✅ Proof created successfully:', proof.id);

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

      // Save learning to Notion
      console.log('📝 Saving learning to Notion...');
      const learning = await this.notion.createLearning({
        userId: user.id,
        habitId: user.id, // Using user ID as placeholder for now
        text: learningText,
        createdAt: new Date().toISOString()
      });
      console.log('✅ Learning saved to Notion:', learning.id);

      // Post to learnings channel
      console.log('📢 Posting to learnings channel...');
      await this.channelHandlers.postToLearningsChannel(learningText, interaction.user.id);
      console.log('✅ Posted to Discord channel');

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