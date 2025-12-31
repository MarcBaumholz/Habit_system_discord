import {
  Message,
  TextBasedChannel,
  TextChannel,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  ModalSubmitInteraction,
  ButtonBuilder,
  ButtonStyle,
  ButtonInteraction
} from 'discord.js';
import { NotionClient } from '../notion/client';
import { Habit, User } from '../types';
import { getCurrentBatch } from '../utils/batch-manager';

type SendableChannel = TextBasedChannel & { send: TextChannel['send'] };

interface HabitModalCache {
  // Day selector data
  selectedDays: string[];

  // Modal 1 data
  name: string;
  domains: string;
  context: string;
  difficulty: string;

  // Modal 2 data
  smartGoal?: string;
  why?: string;
  minimalDose?: string;
  habitLoop?: string;
  consequences?: string;

  // Modal 3 data
  curiosityPassionPurpose?: string;
  autonomy?: string;
  hurdles?: string;
  reminderType?: string;

  // Modal 4 data
  commitmentSignature?: string;

  // User data
  userId: string;
  timestamp: number;
}

export class HabitFlowManager {
  private notion: NotionClient;
  private modalCache: Map<string, HabitModalCache> = new Map();
  private readonly CACHE_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes
  private personalAssistant?: any; // Optional - will be set if available
  private readonly CELEBRATION_GIFS = [
    'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExMG01NmZneXMybmx5c2pjOTgweXk3MTZxZWdtOWFhY243dXR6NG9xcyZlcD12MV9naWZzX3NlYXJjaCZjdD1n/3orieSQLr3L6lYpSo0/giphy.gif',
    'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExcjBzemNhZW5pemF6OTd1OG8wdDhjNTB4bHJzenVzemlmaXN5bjFqYSZlcD12MV9naWZzX3NlYXJjaCZjdD1n/l4FGI8GoTL7N4DsyI/giphy.gif',
    'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExbWlkdDF5YzgxOTA3NTFqcjkxbWc4dXFvN3V5cGxkNzF0Y2Zsc3o3ZSZlcD12MV9naWZzX3NlYXJjaCZjdD1n/l0MYGYzk5wXCFnQ76/giphy.gif'
  ];
  private readonly CELEBRATION_REACTION = '🎊';

  constructor(notion: NotionClient, personalAssistant?: any) {
    this.notion = notion;
    this.personalAssistant = personalAssistant;

    // Cleanup stale cache entries every 5 minutes
    setInterval(() => {
      this.cleanupStaleCache();
    }, 5 * 60 * 1000);
  }

  private cleanupStaleCache() {
    const now = Date.now();
    const staleKeys: string[] = [];

    this.modalCache.forEach((data, discordId) => {
      if (now - data.timestamp > this.CACHE_EXPIRY_MS) {
        staleKeys.push(discordId);
      }
    });

    staleKeys.forEach(key => {
      console.log(`🧹 Cleaning up stale habit modal cache for user: ${key}`);
      this.modalCache.delete(key);
    });
  }

  async handleMessage(message: Message): Promise<boolean> {
    if (message.author.bot) {
      return false;
    }

    const channel = message.channel;
    if (!channel) {
      return false;
    }

    const content = message.content.trim();
    if (content.length === 0) {
      return false;
    }

    // Check if message triggers keystone habit flow
    if (this.matchesTrigger(content)) {
      await this.startFlow(message);
      return true;
    }

    return false;
  }

  private matchesTrigger(content: string): boolean {
    const lowerContent = content.toLowerCase().trim();

    // Define all possible variations of keystone habit triggers
    const keystoneTriggers = [
      'keystone habit',
      'keystone habits',
      'keystonehabit',
      'keystonehabits',
      'keystone-habit',
      'keystone-habits',
      'keystone_habit',
      'keystone_habits'
    ];

    // Check if the message contains any of the trigger variations
    return keystoneTriggers.some(trigger => lowerContent.includes(trigger));
  }

  private async startFlow(message: Message) {
    const textChannel = this.getTextChannel(message);
    if (!textChannel) {
      return;
    }

    // Verify user exists in Notion
    const user = await this.fetchOrNotifyUser(message, textChannel);
    if (!user) {
      return;
    }

    // Initialize cache
    this.modalCache.set(message.author.id, {
      selectedDays: [],
      name: '',
      domains: '',
      context: '',
      difficulty: '',
      userId: user.id,
      timestamp: Date.now()
    });

    // Show Modal 1 first (Basics)
    await this.showModal1(message, user);
  }

  private async showModal1(message: Message, user: User) {
    const textChannel = message.channel as TextChannel;

    // Create button to trigger the modal
    const button = new ButtonBuilder()
      .setCustomId('keystone_habit_start')
      .setLabel('🔥 Create Keystone Habit')
      .setStyle(ButtonStyle.Primary);

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(button);

    try {
      await textChannel.send({
        content: `🔥 **Keystone Habit Builder**\n\nHabits compound small actions into big outcomes. Defining a clear keystone habit helps you:\n• Focus on what really moves the needle\n• Stay accountable to your group\n• Build momentum for the full 66-day challenge\n\nClick the button below to start creating your keystone habit.`,
        components: [row]
      });
    } catch (error) {
      console.error('Failed to send button for habit flow:', error);
    }
  }

  private async showDaySelector(messageOrInteraction: Message | ButtonInteraction, user: User) {
    const isMessage = 'channel' in messageOrInteraction && 'author' in messageOrInteraction;
    const textChannel = (isMessage 
      ? (messageOrInteraction as Message).channel 
      : (messageOrInteraction as ButtonInteraction).channel) as TextChannel;
    const discordId = isMessage 
      ? (messageOrInteraction as Message).author.id 
      : (messageOrInteraction as ButtonInteraction).user.id;
    const cachedData = this.modalCache.get(discordId);

    if (!cachedData) {
      if (isMessage) {
        await textChannel.send('❌ Session expired. Please type "keystone habit" again.');
      } else {
        await (messageOrInteraction as ButtonInteraction).reply({
          content: '❌ Session expired. Please type "keystone habit" again.',
          ephemeral: true
        });
      }
      return;
    }

    const selectedDays = cachedData.selectedDays || [];
    const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const dayEmojis = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

    // Create day buttons
    const dayButtons = dayLabels.map((day, index) => {
      const isSelected = selectedDays.includes(day);
      const button = new ButtonBuilder()
        .setCustomId(`day_${day.toLowerCase()}`)
        .setLabel(`${isSelected ? '✅' : '⭕'} ${dayEmojis[index]}`)
        .setStyle(isSelected ? ButtonStyle.Success : ButtonStyle.Secondary);
      return button;
    });

    // Create action rows (max 5 buttons per row)
    const row1 = new ActionRowBuilder<ButtonBuilder>().addComponents(dayButtons.slice(0, 4));
    const row2 = new ActionRowBuilder<ButtonBuilder>().addComponents(dayButtons.slice(4, 7));

    // Continue button
    const continueButton = new ButtonBuilder()
      .setCustomId('day_selector_continue')
      .setLabel('Step 1/4: Continue to Basics')
      .setStyle(ButtonStyle.Primary)
      .setDisabled(selectedDays.length === 0);

    const row3 = new ActionRowBuilder<ButtonBuilder>().addComponents(continueButton);

    const selectedText = selectedDays.length > 0 
      ? `**Selected:** ${selectedDays.join(', ')} (${selectedDays.length} days/week)`
      : '**Select at least one day**';

    const content = `📅 **Select Days for Your Habit**\n\nClick the circles to select which days you want to do this habit:\n\n${selectedText}\n\n*You can change your selection anytime before continuing.*`;

    try {
      if (isMessage) {
        await textChannel.send({
          content,
          components: [row1, row2, row3]
        });
      } else {
        const buttonInteraction = messageOrInteraction as ButtonInteraction;
        if (buttonInteraction.replied || buttonInteraction.deferred) {
          await buttonInteraction.followUp({
            content,
            components: [row1, row2, row3]
          });
        } else {
          await buttonInteraction.reply({
            content,
            components: [row1, row2, row3],
            ephemeral: false
          });
        }
      }
    } catch (error) {
      console.error('Failed to send day selector:', error);
    }
  }

  async handleButtonInteraction(interaction: ButtonInteraction): Promise<void> {
    const discordId = interaction.user.id;
    const cachedData = this.modalCache.get(discordId);

    if (!cachedData) {
      await interaction.reply({
        content: '❌ Session abgelaufen. Bitte schreibe "keystone habit" um neu zu starten.',
        ephemeral: true
      });
      return;
    }

    // Handle day selector buttons
    if (interaction.customId.startsWith('day_')) {
      if (interaction.customId === 'day_selector_continue') {
        if (cachedData.selectedDays.length === 0) {
          await interaction.reply({
            content: '❌ Please select at least one day before continuing.',
            ephemeral: true
          });
          return;
        }
        // After day selection, show button to continue to Modal 2
        const button = new ButtonBuilder()
          .setCustomId('keystone_modal_2_trigger')
          .setLabel('Step 2/4: Goals & Motivation')
          .setStyle(ButtonStyle.Primary);

        const row = new ActionRowBuilder<ButtonBuilder>().addComponents(button);

        await interaction.update({
          content: `✅ **Days selected!** Continue to the next step:`,
          components: [row]
        });
        return;
      }

      // Toggle day selection
      const dayMap: { [key: string]: string } = {
        'day_mon': 'Mon',
        'day_tue': 'Tue',
        'day_wed': 'Wed',
        'day_thu': 'Thu',
        'day_fri': 'Fri',
        'day_sat': 'Sat',
        'day_sun': 'Sun'
      };

      const selectedDay = dayMap[interaction.customId];
      if (selectedDay) {
        const index = cachedData.selectedDays.indexOf(selectedDay);
        if (index > -1) {
          cachedData.selectedDays.splice(index, 1);
        } else {
          cachedData.selectedDays.push(selectedDay);
        }
        cachedData.timestamp = Date.now();
        this.modalCache.set(discordId, cachedData);

        // Update the message with new selection
        await this.updateDaySelectorMessage(interaction, cachedData);
      }
      return;
    }

    // Handle different button triggers
    if (interaction.customId === 'keystone_habit_start') {
      // Start flow - show Modal 1
      await this.showModal1FromButton(interaction);
    } else if (interaction.customId === 'keystone_modal_2_trigger') {
      await this.showModal2(interaction);
    } else if (interaction.customId === 'keystone_modal_3_trigger') {
      await this.showModal3(interaction);
    } else if (interaction.customId === 'keystone_modal_4_trigger') {
      await this.showModal4(interaction);
    } else if (interaction.customId === 'keystone_summary_confirm') {
      await this.showModal4(interaction);
    }
  }

  private async updateDaySelectorMessage(interaction: ButtonInteraction, cachedData: HabitModalCache) {
    const selectedDays = cachedData.selectedDays || [];
    const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const dayEmojis = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

    const dayButtons = dayLabels.map((day, index) => {
      const isSelected = selectedDays.includes(day);
      const button = new ButtonBuilder()
        .setCustomId(`day_${day.toLowerCase()}`)
        .setLabel(`${isSelected ? '✅' : '⭕'} ${dayEmojis[index]}`)
        .setStyle(isSelected ? ButtonStyle.Success : ButtonStyle.Secondary);
      return button;
    });

    const row1 = new ActionRowBuilder<ButtonBuilder>().addComponents(dayButtons.slice(0, 4));
    const row2 = new ActionRowBuilder<ButtonBuilder>().addComponents(dayButtons.slice(4, 7));

    const continueButton = new ButtonBuilder()
      .setCustomId('day_selector_continue')
      .setLabel('Step 2/4: Continue to Goals & Motivation')
      .setStyle(ButtonStyle.Primary)
      .setDisabled(selectedDays.length === 0);

    const row3 = new ActionRowBuilder<ButtonBuilder>().addComponents(continueButton);

    const selectedText = selectedDays.length > 0 
      ? `**Selected:** ${selectedDays.join(', ')} (${selectedDays.length} days/week)`
      : '**Select at least one day**';

    try {
      await interaction.update({
        content: `✅ **Basics saved!**\n\n📅 **Now select which days you want to do this habit:**\n\n${selectedText}\n\n*You can change your selection anytime before continuing.*`,
        components: [row1, row2, row3]
      });
    } catch (error) {
      console.error('Failed to update day selector:', error);
    }
  }

  private async showModal1FromButton(interaction: ButtonInteraction) {
    // Build Modal 1
    const modal = new ModalBuilder()
      .setCustomId('keystone_modal_1')
      .setTitle('Step 1/4: Basics');

    // Field 1: Name
    const nameInput = new TextInputBuilder()
      .setCustomId('name')
      .setLabel('What do you want to call this habit?')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('e.g. Morning Meditation, Daily Running, Reading Before Bed')
      .setMaxLength(100)
      .setRequired(true);

    // Field 2: Domains
    const domainsInput = new TextInputBuilder()
      .setCustomId('domains')
      .setLabel('Which life categories? (comma-separated)')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('e.g. mental health, productivity, fitness, relationships')
      .setMaxLength(200)
      .setRequired(true);

    // Field 3: Context
    const contextInput = new TextInputBuilder()
      .setCustomId('context')
      .setLabel('When and where will you do it?')
      .setStyle(TextInputStyle.Paragraph)
      .setPlaceholder('e.g. Every morning at 7am in my bedroom, right after waking up')
      .setMaxLength(1000)
      .setRequired(true);

    // Field 4: Difficulty
    const difficultyInput = new TextInputBuilder()
      .setCustomId('difficulty')
      .setLabel('Difficulty level? (easy/medium/hard)')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('easy, medium, or hard')
      .setMaxLength(10)
      .setRequired(true);

    // Create action rows (max 5 per modal)
    const row1 = new ActionRowBuilder<TextInputBuilder>().addComponents(nameInput);
    const row2 = new ActionRowBuilder<TextInputBuilder>().addComponents(domainsInput);
    const row3 = new ActionRowBuilder<TextInputBuilder>().addComponents(contextInput);
    const row4 = new ActionRowBuilder<TextInputBuilder>().addComponents(difficultyInput);

    modal.addComponents(row1, row2, row3, row4);

    try {
      await interaction.showModal(modal);
    } catch (error) {
      console.error('Failed to show Modal 1:', error);
      await interaction.reply({
        content: '❌ Modal konnte nicht geöffnet werden. Bitte versuche es erneut.',
        ephemeral: true
      });
    }
  }

  async handleModalSubmit(interaction: ModalSubmitInteraction): Promise<void> {
    const discordId = interaction.user.id;

    try {
      if (interaction.customId === 'keystone_modal_1') {
        await this.handleModal1Submit(interaction, discordId);
      } else if (interaction.customId === 'keystone_modal_2') {
        await this.handleModal2Submit(interaction, discordId);
      } else if (interaction.customId === 'keystone_modal_3') {
        await this.handleModal3Submit(interaction, discordId);
      } else if (interaction.customId === 'keystone_modal_4') {
        await this.handleModal4Submit(interaction, discordId);
      }
    } catch (error) {
      console.error('Error handling modal submit:', error);
      await interaction.reply({
        content: '❌ Es gab einen Fehler beim Speichern deiner Daten. Bitte versuche es erneut.',
        ephemeral: true
      });
    }
  }

  private async showSummary(interaction: ModalSubmitInteraction, cachedData: HabitModalCache) {
    const selectedDaysText = cachedData.selectedDays.length > 0 
      ? cachedData.selectedDays.join(', ') 
      : 'Not selected';
    const frequency = cachedData.selectedDays.length;

    // Helper function to truncate text for Discord's 2000 char limit
    const truncate = (text: string | undefined, maxLength: number = 150): string => {
      if (!text) return 'Not provided';
      if (text.length <= maxLength) return text;
      return text.substring(0, maxLength - 3) + '...';
    };

    const summary = `📋 **Step 4/4: Review Your Habit Contract**

**Basics:**
• **Name:** ${truncate(cachedData.name, 100)}
• **Domains:** ${truncate(cachedData.domains, 100)}
• **Days:** ${selectedDaysText} (${frequency}x/week)
• **Context:** ${truncate(cachedData.context, 150)}
• **Difficulty:** ${truncate(cachedData.difficulty, 10)}

**Goals & Motivation:**
• **SMART Goal:** ${truncate(cachedData.smartGoal, 150)}
• **Epic Meaning:** ${truncate(cachedData.why, 150)}
• **Minimal Dose:** ${truncate(cachedData.minimalDose, 100)}
• **Habit Loop:** ${truncate(cachedData.habitLoop, 150)}
• **Consequences:** ${truncate(cachedData.consequences, 150)}

**Reflection & Planning:**
• **Curiosity/Passion/Purpose:** ${truncate(cachedData.curiosityPassionPurpose, 150)}
• **Autonomy:** ${truncate(cachedData.autonomy, 150)}
• **Hurdles:** ${truncate(cachedData.hurdles, 150)}
• **Reminder:** ${truncate(cachedData.reminderType, 100)}

**Ready to commit to 66 days?**`;

    // Ensure summary doesn't exceed Discord's 2000 character limit
    const maxSummaryLength = 1950; // Leave buffer
    const finalSummary = summary.length > maxSummaryLength 
      ? summary.substring(0, maxSummaryLength - 3) + '...' 
      : summary;

    const confirmButton = new ButtonBuilder()
      .setCustomId('keystone_summary_confirm')
      .setLabel('Step 4/4: Sign 66-Day Commitment')
      .setStyle(ButtonStyle.Success);

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(confirmButton);

    await interaction.reply({
      content: finalSummary,
      components: [row],
      ephemeral: false
    });
  }

  private async showModal4(interaction: ButtonInteraction) {
    const modal = new ModalBuilder()
      .setCustomId('keystone_modal_4')
      .setTitle('Step 4/4: 66-Day Commitment');

    const commitmentInput = new TextInputBuilder()
      .setCustomId('commitmentSignature')
      .setLabel('Type "I commit" to sign contract')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('I commit')
      .setRequired(true);

    const row = new ActionRowBuilder<TextInputBuilder>().addComponents(commitmentInput);

    modal.addComponents(row);

    await interaction.showModal(modal);
  }

  private async handleModal4Submit(interaction: ModalSubmitInteraction, discordId: string) {
    const commitmentSignature = interaction.fields.getTextInputValue('commitmentSignature');

    // Validate commitment signature
    if (commitmentSignature.trim().toLowerCase() !== 'i commit') {
      await interaction.reply({
        content: '❌ Please type exactly "I commit" (case-insensitive) to confirm your 66-day commitment.',
        ephemeral: true
      });
      return;
    }

    // Get cached data
    const cachedData = this.modalCache.get(discordId);
    if (!cachedData) {
      await interaction.reply({
        content: '❌ Session abgelaufen. Bitte starte den Flow neu mit "keystone habit".',
        ephemeral: true
      });
      return;
    }

    // Update cache with commitment
    cachedData.commitmentSignature = commitmentSignature;
    cachedData.timestamp = Date.now();
    this.modalCache.set(discordId, cachedData);

    // Build complete habit payload
    const habitPayload = this.buildHabitPayloadFromCache(cachedData);

    try {
      // Save to Notion
      const habit = await this.notion.createHabit(habitPayload);

      console.log('✅ Keystone habit created via modal flow:', habit.id);

      // Regenerate AI profile after habit creation
      if (this.personalAssistant) {
        try {
          await this.personalAssistant.regenerateProfile(discordId);
        } catch (error) {
          console.error('⚠️ Error regenerating AI profile after habit creation:', error);
        }
      }

      // Send success message
      const selectedDaysText = cachedData.selectedDays.length > 0 
        ? cachedData.selectedDays.join(', ') 
        : 'Not selected';

      const successMessage = await interaction.reply({
        content: `🎉 **Keystone Habit Created!**\n\n**${habit.name}** has been successfully saved!\n\n✨ **Domains:** ${habit.domains.join(', ')}\n📅 **Days:** ${selectedDaysText} (${habit.frequency}x/week)\n💪 **Minimal Dose:** ${habit.minimalDose}\n✅ **66-Day Commitment:** Signed\n\nUse \`/proof\` to track your daily proofs!`,
        ephemeral: false,
        fetchReply: true
      }) as Message;

      await this.addConfettiReaction(successMessage);
      await this.sendCelebrationFollowUp(interaction, habit.name);

      // Clear cache
      this.modalCache.delete(discordId);
    } catch (error) {
      console.error('Failed to save keystone habit:', error);
      await interaction.reply({
        content: '⚠️ Es gab einen Fehler beim Speichern deines Habits. Bitte versuche es erneut oder kontaktiere den Support.',
        ephemeral: true
      });

      // Clear cache on error too
      this.modalCache.delete(discordId);
    }
  }

  private async handleModal1Submit(interaction: ModalSubmitInteraction, discordId: string) {
    // Extract values from Modal 1
    const name = interaction.fields.getTextInputValue('name');
    const domains = interaction.fields.getTextInputValue('domains');
    const context = interaction.fields.getTextInputValue('context');
    const difficulty = interaction.fields.getTextInputValue('difficulty');

    // Get cached data
    const cachedData = this.modalCache.get(discordId);
    if (!cachedData) {
      await interaction.reply({
        content: '❌ Session abgelaufen. Bitte starte den Flow neu mit "keystone habit".',
        ephemeral: true
      });
      return;
    }

    // Update cache with Modal 1 data
    cachedData.name = name;
    cachedData.domains = domains;
    cachedData.context = context;
    cachedData.difficulty = difficulty;
    cachedData.timestamp = Date.now();
    this.modalCache.set(discordId, cachedData);

    // After Modal 1, show day selector (mid-level step)
    await this.showDaySelectorAfterModal1(interaction, cachedData);
  }

  private async showDaySelectorAfterModal1(interaction: ModalSubmitInteraction, cachedData: HabitModalCache) {
    const selectedDays = cachedData.selectedDays || [];
    const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const dayEmojis = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

    // Create day buttons
    const dayButtons = dayLabels.map((day, index) => {
      const isSelected = selectedDays.includes(day);
      const button = new ButtonBuilder()
        .setCustomId(`day_${day.toLowerCase()}`)
        .setLabel(`${isSelected ? '✅' : '⭕'} ${dayEmojis[index]}`)
        .setStyle(isSelected ? ButtonStyle.Success : ButtonStyle.Secondary);
      return button;
    });

    // Create action rows (max 5 buttons per row)
    const row1 = new ActionRowBuilder<ButtonBuilder>().addComponents(dayButtons.slice(0, 4));
    const row2 = new ActionRowBuilder<ButtonBuilder>().addComponents(dayButtons.slice(4, 7));

    // Continue button
    const continueButton = new ButtonBuilder()
      .setCustomId('day_selector_continue')
      .setLabel('Step 2/4: Continue to Goals & Motivation')
      .setStyle(ButtonStyle.Primary)
      .setDisabled(selectedDays.length === 0);

    const row3 = new ActionRowBuilder<ButtonBuilder>().addComponents(continueButton);

    const selectedText = selectedDays.length > 0 
      ? `**Selected:** ${selectedDays.join(', ')} (${selectedDays.length} days/week)`
      : '**Select at least one day**';

    const content = `✅ **Basics saved!**\n\n📅 **Now select which days you want to do this habit:**\n\n${selectedText}\n\n*You can change your selection anytime before continuing.*`;

    try {
      await interaction.reply({
        content,
        components: [row1, row2, row3],
        ephemeral: false
      });
    } catch (error) {
      console.error('Failed to send day selector:', error);
      await interaction.reply({
        content: '✅ **Basics saved!** Please type "keystone habit" again to continue.',
        ephemeral: true
      });
    }
  }

  private async showModal2(interaction: ButtonInteraction) {
    const modal = new ModalBuilder()
      .setCustomId('keystone_modal_2')
      .setTitle('Step 2/4: Goals & Motivation');

    // Field 1: SMART Goal
    const smartGoalInput = new TextInputBuilder()
      .setCustomId('smartGoal')
      .setLabel('Enter a clear SMART goal')
      .setStyle(TextInputStyle.Paragraph)
      .setPlaceholder('e.g. Meditate 10 min daily for better focus in 66 days')
      .setMaxLength(1000)
      .setRequired(true);

    // Field 2: Epic Meaning / Big Why
    const whyInput = new TextInputBuilder()
      .setCustomId('why')
      .setLabel('What is your epic meaning?')
      .setStyle(TextInputStyle.Paragraph)
      .setPlaceholder('Why does this matter? What identity will you become?')
      .setMaxLength(1000)
      .setRequired(true);

    // Field 3: Minimal Dose
    const minimalDoseInput = new TextInputBuilder()
      .setCustomId('minimalDose')
      .setLabel('Minimal dose (0.8 rule)')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('e.g. 2 min meditation, 5 push-ups, 1 page read')
      .setMaxLength(200)
      .setRequired(true);

    // Field 4: Habit Loop
    const habitLoopInput = new TextInputBuilder()
      .setCustomId('habitLoop')
      .setLabel('Habit loop (cue→craving→routine→reward)')
      .setStyle(TextInputStyle.Paragraph)
      .setPlaceholder('Cue: Alarm rings → Craving: Want focus → Routine: Meditate → Reward: Coffee')
      .setMaxLength(1000)
      .setRequired(true);

    // Field 5: Consequences
    const consequencesInput = new TextInputBuilder()
      .setCustomId('consequences')
      .setLabel('Consequences of not committing?')
      .setStyle(TextInputStyle.Paragraph)
      .setPlaceholder('What happens if you don\'t do this? What will you lose?')
      .setMaxLength(1000)
      .setRequired(true);

    const row1 = new ActionRowBuilder<TextInputBuilder>().addComponents(smartGoalInput);
    const row2 = new ActionRowBuilder<TextInputBuilder>().addComponents(whyInput);
    const row3 = new ActionRowBuilder<TextInputBuilder>().addComponents(minimalDoseInput);
    const row4 = new ActionRowBuilder<TextInputBuilder>().addComponents(habitLoopInput);
    const row5 = new ActionRowBuilder<TextInputBuilder>().addComponents(consequencesInput);

    modal.addComponents(row1, row2, row3, row4, row5);

    await interaction.showModal(modal);
  }

  private async handleModal2Submit(interaction: ModalSubmitInteraction, discordId: string) {
    // Extract values from Modal 2
    const smartGoal = interaction.fields.getTextInputValue('smartGoal');
    const why = interaction.fields.getTextInputValue('why');
    const minimalDose = interaction.fields.getTextInputValue('minimalDose');
    const habitLoop = interaction.fields.getTextInputValue('habitLoop');
    const consequences = interaction.fields.getTextInputValue('consequences');

    // Get cached data
    const cachedData = this.modalCache.get(discordId);
    if (!cachedData) {
      await interaction.reply({
        content: '❌ Session abgelaufen. Bitte starte den Flow neu mit "keystone habit".',
        ephemeral: true
      });
      return;
    }

    // Update cache with Modal 2 data
    cachedData.smartGoal = smartGoal;
    cachedData.why = why;
    cachedData.minimalDose = minimalDose;
    cachedData.habitLoop = habitLoop;
    cachedData.consequences = consequences;
    cachedData.timestamp = Date.now();
    this.modalCache.set(discordId, cachedData);

    // Send button for Modal 3
    const button = new ButtonBuilder()
      .setCustomId('keystone_modal_3_trigger')
      .setLabel('Step 3/4: Reflection & Planning')
      .setStyle(ButtonStyle.Primary);

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(button);

    await interaction.reply({
      content: '✅ **Goals & Motivation saved!** Continue to the next step:',
      components: [row],
      ephemeral: true
    });
  }

  private async showModal3(interaction: ButtonInteraction) {
    const modal = new ModalBuilder()
      .setCustomId('keystone_modal_3')
      .setTitle('Step 3/4: Reflection & Planning');

    // Field 1: Curiosity/Passion/Purpose
    const curiosityPassionPurposeInput = new TextInputBuilder()
      .setCustomId('curiosityPassionPurpose')
      .setLabel('Curiosity, passion & purpose?')
      .setStyle(TextInputStyle.Paragraph)
      .setPlaceholder('What makes you curious? Which passion drives you? What higher purpose?')
      .setMaxLength(1000)
      .setRequired(true);

    // Field 2: Autonomy
    const autonomyInput = new TextInputBuilder()
      .setCustomId('autonomy')
      .setLabel('How does this give you control?')
      .setStyle(TextInputStyle.Paragraph)
      .setPlaceholder('How does this habit give you more control over your life?')
      .setMaxLength(1000)
      .setRequired(true);

    // Field 3: Hurdles
    const hurdlesInput = new TextInputBuilder()
      .setCustomId('hurdles')
      .setLabel('What hurdles might get in the way?')
      .setStyle(TextInputStyle.Paragraph)
      .setPlaceholder('e.g. Too tired mornings, time pressure, forgetfulness')
      .setMaxLength(1000)
      .setRequired(true);

    // Field 4: Reminder Type
    const reminderTypeInput = new TextInputBuilder()
      .setCustomId('reminderType')
      .setLabel('How to be reminded?')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('e.g. Discord DM, Calendar, Phone Alarm')
      .setMaxLength(200)
      .setRequired(true);

    const row1 = new ActionRowBuilder<TextInputBuilder>().addComponents(curiosityPassionPurposeInput);
    const row2 = new ActionRowBuilder<TextInputBuilder>().addComponents(autonomyInput);
    const row3 = new ActionRowBuilder<TextInputBuilder>().addComponents(hurdlesInput);
    const row4 = new ActionRowBuilder<TextInputBuilder>().addComponents(reminderTypeInput);

    modal.addComponents(row1, row2, row3, row4);

    await interaction.showModal(modal);
  }

  private async handleModal3Submit(interaction: ModalSubmitInteraction, discordId: string) {
    // Extract values from Modal 3
    const curiosityPassionPurpose = interaction.fields.getTextInputValue('curiosityPassionPurpose');
    const autonomy = interaction.fields.getTextInputValue('autonomy');
    const hurdles = interaction.fields.getTextInputValue('hurdles');
    const reminderType = interaction.fields.getTextInputValue('reminderType');

    // Get cached data
    const cachedData = this.modalCache.get(discordId);
    if (!cachedData) {
      await interaction.reply({
        content: '❌ Session abgelaufen. Bitte starte den Flow neu mit "keystone habit".',
        ephemeral: true
      });
      return;
    }

    // Update cache with Modal 3 data
    cachedData.curiosityPassionPurpose = curiosityPassionPurpose;
    cachedData.autonomy = autonomy;
    cachedData.hurdles = hurdles;
    cachedData.reminderType = reminderType;
    cachedData.timestamp = Date.now();
    this.modalCache.set(discordId, cachedData);

    // Validate all required data is present
    if (!cachedData.smartGoal || !cachedData.why || !cachedData.minimalDose || !cachedData.habitLoop) {
      await interaction.reply({
        content: '❌ Daten fehlen. Bitte starte den Flow neu mit "keystone habit".',
        ephemeral: true
      });
      this.modalCache.delete(discordId);
      return;
    }

    // Show summary before final submission
    await this.showSummary(interaction, cachedData);
  }

  private buildHabitPayloadFromCache(cache: HabitModalCache): Omit<Habit, 'id'> {
    // Transform domains (split by comma)
    const domainsArray = cache.domains
      .split(',')
      .map(d => d.trim())
      .filter(Boolean);

    // Calculate frequency from selected days
    const frequency = Math.max(1, Math.min(7, cache.selectedDays?.length || 1));

    // Get current active batch
    const currentBatch = getCurrentBatch();
    const batchName = currentBatch?.name;

    return {
      userId: cache.userId,
      name: cache.name,
      domains: domainsArray,
      frequency: frequency,
      selectedDays: cache.selectedDays || [],
      context: cache.context,
      difficulty: cache.difficulty,
      smartGoal: cache.smartGoal!,
      why: cache.why!,
      minimalDose: cache.minimalDose!,
      habitLoop: cache.habitLoop!,
      hurdles: cache.hurdles!,
      reminderType: cache.reminderType!,
      autonomy: cache.autonomy,
      curiosityPassionPurpose: cache.curiosityPassionPurpose,
      consequences: cache.consequences,
      commitmentSignature: cache.commitmentSignature,
      batch: batchName
    };
  }

  private getTextChannel(message: Message): SendableChannel | null {
    const channel = message.channel;
    if (!channel.isTextBased()) {
      return null;
    }

    if (!('send' in channel) || typeof channel.send !== 'function') {
      return null;
    }

    return channel as SendableChannel;
  }

  private async fetchOrNotifyUser(message: Message, channel: SendableChannel): Promise<User | null> {
    try {
      const existingUser = await this.notion.getUserByDiscordId(message.author.id);
      if (existingUser) {
        return existingUser;
      }

      await channel.send('Please use `/join` first so we can link your Discord account to Notion. Then send `KeystoneHabit` to restart this flow.');
      return null;
    } catch (error) {
      console.error('Failed to fetch user for keystone habit flow:', error);
      await channel.send('⚠️ I couldn\'t verify your account right now. Please try again in a moment.');
      return null;
    }
  }

  private getRandomCelebrationGif(): string {
    if (!this.CELEBRATION_GIFS.length) {
      return '';
    }

    const index = Math.floor(Math.random() * this.CELEBRATION_GIFS.length);
    return this.CELEBRATION_GIFS[index];
  }

  private async addConfettiReaction(message: Message) {
    try {
      await message.react(this.CELEBRATION_REACTION);
    } catch (error) {
      console.error('Failed to add celebration reaction:', error);
    }
  }

  private async sendCelebrationFollowUp(interaction: ModalSubmitInteraction, habitName: string) {
    const gifUrl = this.getRandomCelebrationGif();
    const mention = `<@${interaction.user.id}>`;
    const messageLines = [
      `🎊 ${mention} Yeah, you started this new habit **${habitName}**!`,
      'Keep showing up — the 66-day streak begins right now! 🚀'
    ];

    const content = gifUrl ? `${messageLines.join('\n')}\n${gifUrl}` : messageLines.join('\n');

    try {
      await interaction.followUp({
        content,
        ephemeral: false
      });
    } catch (error) {
      console.error('Failed to send celebration GIF:', error);
    }
  }
}
