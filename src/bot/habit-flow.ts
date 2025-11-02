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

type SendableChannel = TextBasedChannel & { send: TextChannel['send'] };

interface HabitModalCache {
  // Modal 1 data
  name: string;
  domains: string;
  frequency: string;
  context: string;
  difficulty: string;

  // Modal 2 data (added after second modal)
  smartGoal?: string;
  why?: string;
  minimalDose?: string;
  habitLoop?: string;

  // User data
  userId: string;
  timestamp: number;
}

export class HabitFlowManager {
  private notion: NotionClient;
  private modalCache: Map<string, HabitModalCache> = new Map();
  private readonly CACHE_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes

  constructor(notion: NotionClient) {
    this.notion = notion;

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

    // Show Modal 1 immediately
    await this.showModal1(message, user);
  }

  private async showModal1(message: Message, user: User) {
    const textChannel = message.channel as TextChannel;

    // Store user ID in cache for later
    this.modalCache.set(message.author.id, {
      name: '',
      domains: '',
      frequency: '',
      context: '',
      difficulty: '',
      userId: user.id,
      timestamp: Date.now()
    });

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

    // Handle different button triggers
    if (interaction.customId === 'keystone_habit_start') {
      await this.showModal1FromButton(interaction);
    } else if (interaction.customId === 'keystone_modal_2_trigger') {
      await this.showModal2(interaction);
    } else if (interaction.customId === 'keystone_modal_3_trigger') {
      await this.showModal3(interaction);
    }
  }

  private async showModal1FromButton(interaction: ButtonInteraction) {
    // Build Modal 1
    const modal = new ModalBuilder()
      .setCustomId('keystone_modal_1')
      .setTitle('🔥 Keystone Habit - Basics');

    // Field 1: Name
    const nameInput = new TextInputBuilder()
      .setCustomId('name')
      .setLabel('What do you want to call this habit?')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('z.B. Morgen-Meditation, Fitness Training, Lesen')
      .setRequired(true);

    // Field 2: Domains
    const domainsInput = new TextInputBuilder()
      .setCustomId('domains')
      .setLabel('Which life categories? (comma-separated)')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('z.B. mental health, productivity, fitness')
      .setRequired(true);

    // Field 3: Frequency
    const frequencyInput = new TextInputBuilder()
      .setCustomId('frequency')
      .setLabel('How many days per week? (1-7)')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('z.B. 7 (täglich), 5 (werktags), 3 (3x pro Woche)')
      .setRequired(true);

    // Field 4: Context
    const contextInput = new TextInputBuilder()
      .setCustomId('context')
      .setLabel('When and where will you do it?')
      .setStyle(TextInputStyle.Paragraph)
      .setPlaceholder('z.B. Morgens um 7 Uhr in meinem Zimmer, nach dem Aufwachen')
      .setRequired(true);

    // Field 5: Difficulty
    const difficultyInput = new TextInputBuilder()
      .setCustomId('difficulty')
      .setLabel('Difficulty level? (easy/medium/hard)')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('easy, medium oder hard')
      .setRequired(true);

    // Create action rows (max 5 per modal)
    const row1 = new ActionRowBuilder<TextInputBuilder>().addComponents(nameInput);
    const row2 = new ActionRowBuilder<TextInputBuilder>().addComponents(domainsInput);
    const row3 = new ActionRowBuilder<TextInputBuilder>().addComponents(frequencyInput);
    const row4 = new ActionRowBuilder<TextInputBuilder>().addComponents(contextInput);
    const row5 = new ActionRowBuilder<TextInputBuilder>().addComponents(difficultyInput);

    modal.addComponents(row1, row2, row3, row4, row5);

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
      }
    } catch (error) {
      console.error('Error handling modal submit:', error);
      await interaction.reply({
        content: '❌ Es gab einen Fehler beim Speichern deiner Daten. Bitte versuche es erneut.',
        ephemeral: true
      });
    }
  }

  private async handleModal1Submit(interaction: ModalSubmitInteraction, discordId: string) {
    // Extract values from Modal 1
    const name = interaction.fields.getTextInputValue('name');
    const domains = interaction.fields.getTextInputValue('domains');
    const frequency = interaction.fields.getTextInputValue('frequency');
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
    cachedData.frequency = frequency;
    cachedData.context = context;
    cachedData.difficulty = difficulty;
    cachedData.timestamp = Date.now();
    this.modalCache.set(discordId, cachedData);

    // Send button for Modal 2
    const button = new ButtonBuilder()
      .setCustomId('keystone_modal_2_trigger')
      .setLabel('📝 Continue to Goals & Motivation')
      .setStyle(ButtonStyle.Primary);

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(button);

    await interaction.reply({
      content: '✅ **Basics gespeichert!** Weiter zum nächsten Schritt:',
      components: [row],
      ephemeral: true
    });
  }

  private async showModal2(interaction: ButtonInteraction) {
    const modal = new ModalBuilder()
      .setCustomId('keystone_modal_2')
      .setTitle('🎯 Keystone Habit - Goals & Motivation');

    // Field 1: SMART Goal
    const smartGoalInput = new TextInputBuilder()
      .setCustomId('smartGoal')
      .setLabel('What is the SMART goal for this habit?')
      .setStyle(TextInputStyle.Paragraph)
      .setPlaceholder('z.B. 10 Minuten täglich meditieren für besseren Fokus in 66 Tagen')
      .setRequired(true);

    // Field 2: Why
    const whyInput = new TextInputBuilder()
      .setCustomId('why')
      .setLabel('Why is this habit important for you?')
      .setStyle(TextInputStyle.Paragraph)
      .setPlaceholder('z.B. Ich will meine Konzentration verbessern und weniger gestresst sein')
      .setRequired(true);

    // Field 3: Minimal Dose
    const minimalDoseInput = new TextInputBuilder()
      .setCustomId('minimalDose')
      .setLabel('Minimal dose on tough days?')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('z.B. 2 Minuten, 5 Liegestütze, 1 Seite lesen')
      .setRequired(true);

    // Field 4: Habit Loop
    const habitLoopInput = new TextInputBuilder()
      .setCustomId('habitLoop')
      .setLabel('Habit loop (cue → routine → reward)')
      .setStyle(TextInputStyle.Paragraph)
      .setPlaceholder('z.B. Cue: Wecker → Routine: 10 Min Meditation → Reward: Kaffee trinken')
      .setRequired(true);

    const row1 = new ActionRowBuilder<TextInputBuilder>().addComponents(smartGoalInput);
    const row2 = new ActionRowBuilder<TextInputBuilder>().addComponents(whyInput);
    const row3 = new ActionRowBuilder<TextInputBuilder>().addComponents(minimalDoseInput);
    const row4 = new ActionRowBuilder<TextInputBuilder>().addComponents(habitLoopInput);

    modal.addComponents(row1, row2, row3, row4);

    await interaction.showModal(modal);
  }

  private async handleModal2Submit(interaction: ModalSubmitInteraction, discordId: string) {
    // Extract values from Modal 2
    const smartGoal = interaction.fields.getTextInputValue('smartGoal');
    const why = interaction.fields.getTextInputValue('why');
    const minimalDose = interaction.fields.getTextInputValue('minimalDose');
    const habitLoop = interaction.fields.getTextInputValue('habitLoop');

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
    cachedData.timestamp = Date.now();
    this.modalCache.set(discordId, cachedData);

    // Send button for Modal 3
    const button = new ButtonBuilder()
      .setCustomId('keystone_modal_3_trigger')
      .setLabel('📋 Continue to Planning & Support')
      .setStyle(ButtonStyle.Primary);

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(button);

    await interaction.reply({
      content: '✅ **Goals & Motivation gespeichert!** Letzter Schritt:',
      components: [row],
      ephemeral: true
    });
  }

  private async showModal3(interaction: ButtonInteraction) {
    const modal = new ModalBuilder()
      .setCustomId('keystone_modal_3')
      .setTitle('📋 Keystone Habit - Planning & Support');

    // Field 1: Implementation Intentions
    const implementationIntentionsInput = new TextInputBuilder()
      .setCustomId('implementationIntentions')
      .setLabel('Implementation intentions (If-then plans)')
      .setStyle(TextInputStyle.Paragraph)
      .setPlaceholder('z.B. Wenn Wecker klingelt, dann Meditation starten. Wenn ich müde bin, dann minimal dose machen.')
      .setRequired(true);

    // Field 2: Hurdles
    const hurdlesInput = new TextInputBuilder()
      .setCustomId('hurdles')
      .setLabel('What hurdles might get in the way?')
      .setStyle(TextInputStyle.Paragraph)
      .setPlaceholder('z.B. Zu müde morgens, Zeitdruck, Vergesslichkeit, Familie stört')
      .setRequired(true);

    // Field 3: Reminder Type
    const reminderTypeInput = new TextInputBuilder()
      .setCustomId('reminderType')
      .setLabel('How do you want to be reminded?')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('z.B. Discord DM, Personal Channel, Keine Reminder')
      .setRequired(true);

    const row1 = new ActionRowBuilder<TextInputBuilder>().addComponents(implementationIntentionsInput);
    const row2 = new ActionRowBuilder<TextInputBuilder>().addComponents(hurdlesInput);
    const row3 = new ActionRowBuilder<TextInputBuilder>().addComponents(reminderTypeInput);

    modal.addComponents(row1, row2, row3);

    await interaction.showModal(modal);
  }

  private async handleModal3Submit(interaction: ModalSubmitInteraction, discordId: string) {
    // Extract values from Modal 3
    const implementationIntentions = interaction.fields.getTextInputValue('implementationIntentions');
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

    // Validate all data is present
    if (!cachedData.smartGoal || !cachedData.why || !cachedData.minimalDose || !cachedData.habitLoop) {
      await interaction.reply({
        content: '❌ Daten fehlen. Bitte starte den Flow neu mit "keystone habit".',
        ephemeral: true
      });
      this.modalCache.delete(discordId);
      return;
    }

    // Build complete habit payload
    const habitPayload = this.buildHabitPayloadFromCache(
      cachedData,
      implementationIntentions,
      hurdles,
      reminderType
    );

    try {
      // Save to Notion
      const habit = await this.notion.createHabit(habitPayload);

      console.log('✅ Keystone habit created via modal flow:', habit.id);

      // Send success message
      await interaction.reply({
        content: `🎉 **Keystone Habit erstellt!**\n\n**${habit.name}** wurde erfolgreich gespeichert!\n\n✨ Domains: ${habit.domains.join(', ')}\n📅 Frequency: ${habit.frequency}x pro Woche\n💪 Minimal Dose: ${habit.minimalDose}\n\nNutze jetzt \`/proof\` um deine täglichen Beweise zu tracken!`,
        ephemeral: false
      });

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

  private buildHabitPayloadFromCache(
    cache: HabitModalCache,
    implementationIntentions: string,
    hurdles: string,
    reminderType: string
  ): Omit<Habit, 'id'> {
    // Transform domains (split by comma)
    const domainsArray = cache.domains
      .split(',')
      .map(d => d.trim())
      .filter(Boolean);

    // Transform frequency (parse and clamp 1-7)
    const frequencyNum = parseInt(cache.frequency.replace(/[^0-9]/g, ''), 10);
    const frequencyClamped = Math.max(1, Math.min(7, isNaN(frequencyNum) ? 1 : frequencyNum));

    return {
      userId: cache.userId,
      name: cache.name,
      domains: domainsArray,
      frequency: frequencyClamped,
      context: cache.context,
      difficulty: cache.difficulty,
      smartGoal: cache.smartGoal!,
      why: cache.why!,
      minimalDose: cache.minimalDose!,
      habitLoop: cache.habitLoop!,
      implementationIntentions,
      hurdles,
      reminderType
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
}
