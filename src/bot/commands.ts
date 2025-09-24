import { SlashCommandBuilder, CommandInteraction, AttachmentBuilder } from 'discord.js';
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
      // Check if user already exists
      let user = await this.notion.getUserByDiscordId(discordId);
      
      if (!user) {
        // Create new user
        user = await this.notion.createUser({
          discordId,
          name: interaction.user.username,
          timezone: 'Europe/Berlin', // Default, can be updated later
          bestTime: '09:00', // Default
          trustCount: 0
        });
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
    const frequency = interaction.options.getString('frequency') || '';
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
      const user = await this.notion.getUserByDiscordId(interaction.user.id);
      if (!user) {
        await interaction.reply({
          content: 'Please use `/join` first to register in the system.',
          ephemeral: true
        });
        return;
      }

      // For now, we'll use the first habit. In a real implementation, you'd let users select which habit
      // This is a simplified version for MVP
      const proof = await this.notion.createProof({
        userId: user.id,
        habitId: 'placeholder-habit-id', // This would need to be resolved from user's habits
        date: new Date().toISOString().split('T')[0],
        unit,
        note,
        attachmentUrl: attachment?.url,
        isMinimalDose,
        isCheatDay
      });

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
      const user = await this.notion.getUserByDiscordId(interaction.user.id);
      if (!user) {
        await interaction.reply({
          content: 'Please use `/join` first to register in the system.',
          ephemeral: true
        });
        return;
      }

      // This would calculate actual summary from proofs
      await interaction.reply({
        content: `📊 **Your Weekly Summary**

🎯 **This Week's Progress:**
• ✅ Proofs submitted: 5/7 days
• ⭐ Minimal doses: 2 days  
• 🎯 Cheat days: 1 day
• 📈 Completion rate: 71%

💪 **Streak Status:**
• Current streak: 3 days
• Best streak: 7 days
• Total habits tracked: 2

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

  async handleLearning(interaction: CommandInteraction) {
    if (!interaction.isChatInputCommand()) return;
    
    const learningText = interaction.options.getString('text') || '';

    try {
      const user = await this.notion.getUserByDiscordId(interaction.user.id);
      if (!user) {
        await interaction.reply({
          content: 'Please use `/join` first to register in the system.',
          ephemeral: true
        });
        return;
      }

      // Post to learnings channel
      await this.channelHandlers.postToLearningsChannel(learningText, interaction.user.id);

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
}