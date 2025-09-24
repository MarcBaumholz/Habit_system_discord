import { Client, GatewayIntentBits, Collection, REST, Routes } from 'discord.js';
import { SlashCommandBuilder } from 'discord.js';
import { CommandHandler } from './commands';
import { ChannelHandlers } from './channel-handlers';
import { NotionClient } from '../notion/client';

export class HabitBot {
  private client: Client;
  private commands: Collection<string, any>;
  private commandHandler: CommandHandler;
  private channelHandlers: ChannelHandlers;
  private notion: NotionClient;

  constructor(notion: NotionClient) {
    this.client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
      ]
    });

    this.commands = new Collection();
    this.notion = notion;
    this.channelHandlers = new ChannelHandlers(this.client, notion);
    this.commandHandler = new CommandHandler(notion, this.channelHandlers);
    this.setupCommands();
    this.setupEventHandlers();
  }

  private setupCommands() {
    const commands = [
      new SlashCommandBuilder()
        .setName('join')
        .setDescription('Join the habit tracking system'),
      
      new SlashCommandBuilder()
        .setName('habit')
        .setDescription('Manage your habits')
        .addSubcommand(subcommand =>
          subcommand
            .setName('add')
            .setDescription('Add a new keystone habit')
            .addStringOption(option =>
              option.setName('name')
                .setDescription('Name of the habit')
                .setRequired(true))
            .addStringOption(option =>
              option.setName('domains')
                .setDescription('Life domains (comma-separated)')
                .setRequired(true))
            .addStringOption(option =>
              option.setName('frequency')
                .setDescription('How often (e.g., daily, weekly)')
                .setRequired(true))
            .addStringOption(option =>
              option.setName('context')
                .setDescription('When and where')
                .setRequired(true))
            .addStringOption(option =>
              option.setName('difficulty')
                .setDescription('Easy, medium, or hard')
                .setRequired(true))
            .addStringOption(option =>
              option.setName('smart_goal')
                .setDescription('Your SMART goal')
                .setRequired(true))
            .addStringOption(option =>
              option.setName('why')
                .setDescription('Why this habit matters')
                .setRequired(true))
            .addStringOption(option =>
              option.setName('minimal_dose')
                .setDescription('Minimal version for tough days')
                .setRequired(true))
            .addStringOption(option =>
              option.setName('habit_loop')
                .setDescription('Cue, craving, routine, reward')
                .setRequired(true))
            .addStringOption(option =>
              option.setName('implementation_intentions')
                .setDescription('If-then plans')
                .setRequired(true))
            .addStringOption(option =>
              option.setName('hurdles')
                .setDescription('Potential obstacles')
                .setRequired(true))
            .addStringOption(option =>
              option.setName('reminder_type')
                .setDescription('How you want to be reminded')
                .setRequired(true))),

      new SlashCommandBuilder()
        .setName('proof')
        .setDescription('Submit daily proof')
        .addStringOption(option =>
          option.setName('unit')
            .setDescription('Measurement unit (e.g., 30 min, 1 km)')
            .setRequired(true))
        .addStringOption(option =>
          option.setName('note')
            .setDescription('Optional note about your proof')
            .setRequired(false))
        .addBooleanOption(option =>
          option.setName('minimal_dose')
            .setDescription('Is this a minimal dose?')
            .setRequired(false))
        .addBooleanOption(option =>
          option.setName('cheat_day')
            .setDescription('Is this a cheat day?')
            .setRequired(false))
        .addAttachmentOption(option =>
          option.setName('attachment')
            .setDescription('Photo/video/audio proof')
            .setRequired(false)),

      new SlashCommandBuilder()
        .setName('summary')
        .setDescription('Get your weekly summary')
        .addIntegerOption(option =>
          option.setName('week')
            .setDescription('Week number (optional)')
            .setRequired(false)),

      new SlashCommandBuilder()
        .setName('learning')
        .setDescription('Share a learning with the community')
        .addStringOption(option =>
          option.setName('text')
            .setDescription('Your learning or insight')
            .setRequired(true))
    ];

    this.commands.set('join', { execute: this.commandHandler.handleJoin.bind(this.commandHandler) });
    this.commands.set('habit', { execute: this.commandHandler.handleHabitAdd.bind(this.commandHandler) });
    this.commands.set('proof', { execute: this.commandHandler.handleProof.bind(this.commandHandler) });
    this.commands.set('summary', { execute: this.commandHandler.handleSummary.bind(this.commandHandler) });
    this.commands.set('learning', { execute: this.commandHandler.handleLearning.bind(this.commandHandler) });

    return commands;
  }

  private setupEventHandlers() {
    this.client.once('ready', async () => {
      console.log(`Bot is ready! Logged in as ${this.client.user?.tag}`);
      
      // Send startup message to the main channel
      await this.sendStartupMessage();
    });

    this.client.on('interactionCreate', async interaction => {
      if (!interaction.isChatInputCommand()) return;

      // Handle subcommands
      if (interaction.commandName === 'habit' && interaction.options.getSubcommand() === 'add') {
        try {
          await this.commandHandler.handleHabitAdd(interaction);
        } catch (error) {
          console.error('Error executing habit add command:', error);
          if (interaction.replied || interaction.deferred) {
            await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
          } else {
            await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
          }
        }
        return;
      }

      const command = this.commands.get(interaction.commandName);
      if (!command) {
        console.error(`No command matching ${interaction.commandName} was found.`);
        return;
      }

      try {
        await command.execute(interaction);
      } catch (error) {
        console.error('Error executing command:', error);
        if (interaction.replied || interaction.deferred) {
          await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
        } else {
          await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
        }
      }
    });

    // Handle reactions to proofs
    this.client.on('messageReactionAdd', async (reaction, user) => {
      if (reaction.partial) {
        try {
          await reaction.fetch();
        } catch (error) {
          console.error('Something went wrong when fetching the reaction:', error);
          return;
        }
      }

      // Handle proof reactions
      if (reaction.emoji.name === '👍' || reaction.emoji.name === '🎉') {
        await this.channelHandlers.handleProofReaction(reaction.message, reaction);
      }
    });
  }

  async registerCommands(token: string, clientId: string, guildId: string) {
    const commands = this.setupCommands();
    const rest = new REST({ version: '10' }).setToken(token);

    try {
      console.log('Started refreshing application (/) commands.');

      await rest.put(
        Routes.applicationGuildCommands(clientId, guildId),
        { body: commands }
      );

      console.log('Successfully reloaded application (/) commands.');
    } catch (error) {
      console.error('Error registering commands:', error);
    }
  }

  async start(token: string) {
    await this.client.login(token);
  }

  // Method to post weekly reviews
  async postWeeklyReview(weekNumber: number) {
    const groupStats = {
      activeUsers: 5,
      completionRate: 85,
      totalProofs: 35,
      minimalDoses: 8,
      cheatDays: 2,
      topPerformers: '@marc @sarah @alex'
    };

    await this.channelHandlers.postWeeklyReview(weekNumber, groupStats);
  }

  // Method to post donation pool updates
  async postDonationPoolUpdate(missedDays: number, totalPool: number) {
    await this.channelHandlers.postDonationPoolUpdate(missedDays, totalPool);
  }

  private async sendStartupMessage() {
    try {
      const channel = this.client.channels.cache.get(process.env.DISCORD_ACCOUNTABILITY_GROUP || '') as any;
      if (!channel) {
        console.log('Main channel not found, skipping startup message');
        return;
      }

      const startupMessage = `🤖 **Discord Habit System is Online!**

🎯 **Available Commands:**
• \`/join\` - Register in the habit tracking system
• \`/habit add\` - Create your keystone habits
• \`/proof\` - Submit daily proof with measurement
• \`/summary\` - Get your weekly progress summary
• \`/learning\` - Share insights with the community

📋 **Channel Guide:**
• **#learnings-feed** - Share insights and learnings
• **#weekly-reviews** - Weekly progress and group summaries
• **#accountability-group-1** - Social accountability and group support

🚀 **Get Started:**
1. Use \`/join\` to register in the system
2. Use \`/habit add\` to create your first keystone habit
3. Use \`/proof\` daily to track your progress
4. Share learnings with \`/learning\` to help the community

💪 **Ready for your 66-day habit challenge!**`;

      await channel.send(startupMessage);
      console.log('Startup message sent to main channel');
      
    } catch (error) {
      console.error('Error sending startup message:', error);
    }
  }
}