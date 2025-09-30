import { Client, GatewayIntentBits, Collection, REST, Routes } from 'discord.js';
import { SlashCommandBuilder } from 'discord.js';
import { CommandHandler } from './commands';
import { ChannelHandlers } from './channel-handlers';
import { HabitFlowManager } from './habit-flow';
import { ProofProcessor } from './proof-processor';
import { MessageAnalyzer } from './message-analyzer';
import { NotionClient } from '../notion/client';
import { ToolsAssistant } from './tools-assistant';
import { DailyMessageScheduler } from './daily-message-scheduler';
import { PersonalChannelManager } from './personal-channel-manager';
import { DiscordLogger } from './discord-logger';
import { PersonalAssistant } from './personal-assistant';

export class HabitBot {
  private client: Client;
  private commands: Collection<string, any>;
  private commandHandler: CommandHandler;
  private channelHandlers: ChannelHandlers;
  private notion: NotionClient;
  private habitFlow: HabitFlowManager;
  private proofProcessor: ProofProcessor;
  private messageAnalyzer: MessageAnalyzer;
  private toolsAssistant: ToolsAssistant;
  private dailyMessageScheduler: DailyMessageScheduler;
  private personalChannelManager: PersonalChannelManager;
  private personalAssistant: PersonalAssistant;
  private logger: DiscordLogger;

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
    this.logger = new DiscordLogger(this.client);
    this.channelHandlers = new ChannelHandlers(this.client, notion);
    this.personalChannelManager = new PersonalChannelManager(this.client, notion);
    this.commandHandler = new CommandHandler(notion, this.channelHandlers, this.personalChannelManager, this.logger);
    this.habitFlow = new HabitFlowManager(notion);
    this.proofProcessor = new ProofProcessor(notion);
    this.messageAnalyzer = new MessageAnalyzer(notion, this.client, this.logger);
    this.toolsAssistant = new ToolsAssistant(this.client, this.notion);
    this.dailyMessageScheduler = new DailyMessageScheduler(this.client, notion, this.logger);
    this.personalAssistant = new PersonalAssistant(this.client, this.notion, this.logger);
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
            .addIntegerOption(option =>
              option.setName('frequency')
                .setDescription('Days per week (1-7)')
                .setRequired(true)
                .setMinValue(1)
                .setMaxValue(7))
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
            .setRequired(true)),

      new SlashCommandBuilder()
        .setName('hurdles')
        .setDescription('Document a hurdle or obstacle')
        .addStringOption(option =>
          option.setName('name')
            .setDescription('Short title for the hurdle')
            .setRequired(true))
        .addStringOption(option =>
          option.setName('type')
            .setDescription('Type of hurdle')
            .setRequired(true)
            .addChoices(
              { name: 'Time Management', value: 'Time Management' },
              { name: 'Motivation', value: 'Motivation' },
              { name: 'Environment', value: 'Environment' },
              { name: 'Social', value: 'Social' },
              { name: 'Health', value: 'Health' },
              { name: 'Resources', value: 'Resources' },
              { name: 'Knowledge', value: 'Knowledge' },
              { name: 'Habit Stacking', value: 'Habit Stacking' },
              { name: 'Perfectionism', value: 'Perfectionism' },
              { name: 'Other', value: 'Other' }
            ))
        .addStringOption(option =>
          option.setName('description')
            .setDescription('Detailed description of the hurdle')
            .setRequired(true)),

      new SlashCommandBuilder()
        .setName('keystonehabit')
        .setDescription('Create a keystone habit - the foundation of your daily routine')
        .addStringOption(option =>
          option.setName('name')
            .setDescription('Name of your keystone habit')
            .setRequired(true))
        .addStringOption(option =>
          option.setName('domains')
            .setDescription('Life domains this habit affects (comma-separated: health, fitness, work, etc.)')
            .setRequired(true))
        .addIntegerOption(option =>
          option.setName('frequency')
            .setDescription('How many days per week? (1-7)')
            .setRequired(true)
            .setMinValue(1)
            .setMaxValue(7))
        .addStringOption(option =>
          option.setName('context')
            .setDescription('When and where will you do this habit?')
            .setRequired(true))
        .addStringOption(option =>
          option.setName('difficulty')
            .setDescription('How challenging is this habit?')
            .setRequired(true)
            .addChoices(
              { name: 'Easy - Takes minimal effort', value: 'easy' },
              { name: 'Medium - Requires some discipline', value: 'medium' },
              { name: 'Hard - Needs strong commitment', value: 'hard' }
            ))
        .addStringOption(option =>
          option.setName('smart_goal')
            .setDescription('Your specific, measurable goal for this habit')
            .setRequired(true))
        .addStringOption(option =>
          option.setName('why')
            .setDescription('Why is this habit important to you?')
            .setRequired(true))
        .addStringOption(option =>
          option.setName('minimal_dose')
            .setDescription('What\'s the smallest version you can do on tough days?')
            .setRequired(true))
        .addStringOption(option =>
          option.setName('habit_loop')
            .setDescription('Describe your habit loop: Cue → Craving → Routine → Reward')
            .setRequired(true))
        .addStringOption(option =>
          option.setName('implementation_intentions')
            .setDescription('If-then plans for obstacles (e.g., "If I feel tired, then I will do 5 minutes")')
            .setRequired(true))
        .addStringOption(option =>
          option.setName('hurdles')
            .setDescription('What challenges might you face?')
            .setRequired(true))
        .addStringOption(option =>
          option.setName('reminder_type')
            .setDescription('How will you remember to do this habit?')
            .setRequired(true)
            .addChoices(
              { name: 'Phone Alarm', value: 'phone_alarm' },
              { name: 'Calendar Event', value: 'calendar' },
              { name: 'Habit Stacking', value: 'habit_stacking' },
              { name: 'Visual Reminder', value: 'visual' },
              { name: 'Accountability Partner', value: 'accountability' }
            ))
    ];

    this.commands.set('join', { execute: this.commandHandler.handleJoin.bind(this.commandHandler) });
    this.commands.set('habit', { execute: this.commandHandler.handleHabitAdd.bind(this.commandHandler) });
    this.commands.set('proof', { execute: this.commandHandler.handleProof.bind(this.commandHandler) });
    this.commands.set('summary', { execute: this.commandHandler.handleSummary.bind(this.commandHandler) });
    this.commands.set('learning', { execute: this.commandHandler.handleLearning.bind(this.commandHandler) });
    this.commands.set('hurdles', { execute: this.commandHandler.handleHurdles.bind(this.commandHandler) });
    this.commands.set('keystonehabit', { execute: this.commandHandler.handleKeystoneHabit.bind(this.commandHandler) });

    return commands;
  }

  private async safeReply(interaction: any, content: any, ephemeral = false) {
    try {
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({ content, ephemeral });
      } else {
        await interaction.reply({ content, ephemeral });
      }
    } catch (error) {
      console.error('Failed to reply to interaction:', error);
      // Try to send a message to the channel instead
      try {
        const channel = interaction.channel;
        if (channel) {
          await channel.send(`⚠️ ${interaction.user}, there was an issue with your command: ${typeof content === 'string' ? content : JSON.stringify(content)}`);
        }
      } catch (fallbackError) {
        console.error('Failed to send fallback message:', fallbackError);
      }
    }
  }

  private setupEventHandlers() {
    this.client.once('ready', async () => {
      console.log(`Bot is ready! Logged in as ${this.client.user?.tag}`);
      
      // Wait a moment for Discord client to be fully ready
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Log bot startup
      await this.logger.success(
        'SYSTEM',
        'Server Restart',
        `Discord Habit System bot is now online and ready`,
        {
          botTag: this.client.user?.tag,
          guilds: this.client.guilds.cache.size,
          channels: this.client.channels.cache.size,
          users: this.client.users.cache.size,
          restartTime: new Date().toISOString(),
          version: '1.0.0'
        }
      );
      
      // Start the daily message scheduler for 66-day challenge
      this.dailyMessageScheduler.startScheduler();
      console.log('🗓️ Daily message scheduler started - 66-day challenge begins tomorrow at 6 AM!');
      
      // Log scheduler start after a brief delay
      setTimeout(async () => {
        await this.logger.success(
          'SCHEDULER',
          'Scheduler Started',
          'Daily message scheduler started successfully',
          {
            cronExpression: '0 6 * * *',
            timezone: process.env.TIMEZONE || 'Europe/Berlin',
            accountabilityChannelId: process.env.DISCORD_ACCOUNTABILITY_GROUP
          }
        );
      }, 3000);
    });

    // Unified message listener for all message processing
    this.client.on('messageCreate', async message => {
      // Skip bot messages
      if (message.author.bot) return;

      // Log all message creation
      await this.logger.logMessageCreate(message);

      try {
        // First, try habit flow processing (for personal channels)
        const habitFlowHandled = await this.habitFlow.handleMessage(message);
        if (habitFlowHandled) {
          await this.logger.info(
            'HABIT_FLOW',
            'Habit Flow Handled',
            `Habit flow processed message from ${message.author.username}`,
            {
              flowType: 'keystone_habit',
              channelId: message.channelId
            },
            {
              channelId: message.channelId,
              userId: message.author.id,
              guildId: message.guild?.id
            }
          );
          return; // Exit early if habit flow handled the message
        }

        // Try personal assistant processing (for personal channels)
        const personalAssistantHandled = await this.personalAssistant.handlePersonalChannelMessage(message);
        if (personalAssistantHandled) {
          return; // Exit early if personal assistant handled the message
        }

        // Tools channel: respond with toolbox suggestions
        if (process.env.DISCORD_TOOLS && message.channelId === process.env.DISCORD_TOOLS) {
          await this.logger.info(
            'TOOLS_ASSISTANT',
            'Tools Channel Message',
            `Processing tools request from ${message.author.username}`,
            {
              contentLength: message.content.length,
              isToolsChannel: true
            },
            {
              channelId: message.channelId,
              userId: message.author.id,
              guildId: message.guild?.id
            }
          );
          await this.toolsAssistant.handleMessage(message);
          return; // Exit early if tools assistant handled the message
        }

        // Only analyze messages in the accountability group
        if (message.channelId === process.env.DISCORD_ACCOUNTABILITY_GROUP) {
          await this.logger.info(
            'MESSAGE_ANALYSIS',
            'Analyzing Accountability Message',
            `Analyzing message from ${message.author.username} for proof detection`,
            {
              contentLength: message.content.length,
              hasAttachments: message.attachments.size > 0
            },
            {
              channelId: message.channelId,
              userId: message.author.id,
              guildId: message.guild?.id
            }
          );
          await this.messageAnalyzer.analyzeMessage(message);
          return; // Exit early if message analyzer handled the message
        }

        // Fallback: try proof processor for accountability messages
        await this.proofProcessor.handleAccountabilityMessage(message);

      } catch (error) {
        await this.logger.logError(
          error as Error,
          'Message Processing',
          {
            channelId: message.channelId,
            userId: message.author.id,
            content: message.content.substring(0, 200)
          },
          {
            channelId: message.channelId,
            userId: message.author.id,
            guildId: message.guild?.id
          }
        );
      }
    });

    this.client.on('interactionCreate', async interaction => {
      if (!interaction.isChatInputCommand()) return;

      // Log all command interactions
      await this.logger.logCommandInteraction(interaction);

      try {
        // Handle subcommands
        if (interaction.commandName === 'habit' && interaction.options.getSubcommand() === 'add') {
          try {
            await this.commandHandler.handleHabitAdd(interaction);
          } catch (error) {
            await this.logger.logError(
              error as Error,
              'Habit Add Command',
              {
                commandName: 'habit add',
                userId: interaction.user.id,
                guildId: interaction.guild?.id
              },
              {
                channelId: interaction.channelId,
                userId: interaction.user.id,
                guildId: interaction.guild?.id
              }
            );
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
          await this.logger.warning(
            'COMMAND',
            'Unknown Command',
            `User ${interaction.user.username} tried to execute unknown command: ${interaction.commandName}`,
            {
              commandName: interaction.commandName,
              availableCommands: Array.from(this.commands.keys())
            },
            {
              channelId: interaction.channelId,
              userId: interaction.user.id,
              guildId: interaction.guild?.id
            }
          );
          console.error(`No command matching ${interaction.commandName} was found.`);
          return;
        }

        try {
          await command.execute(interaction);
        } catch (error) {
          await this.logger.logError(
            error as Error,
            'Command Execution',
            {
              commandName: interaction.commandName,
              userId: interaction.user.id,
              guildId: interaction.guild?.id
            },
            {
              channelId: interaction.channelId,
              userId: interaction.user.id,
              guildId: interaction.guild?.id
            }
          );
          console.error('Error executing command:', error);
          if (interaction.replied || interaction.deferred) {
            await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
          } else {
            await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
          }
        }
      } catch (error) {
        await this.logger.logError(
          error as Error,
          'Interaction Processing',
          {
            interactionType: 'chatInputCommand',
            commandName: interaction.commandName
          },
          {
            channelId: interaction.channelId,
            userId: interaction.user.id,
            guildId: interaction.guild?.id
          }
        );
      }
    });


    // Handle reactions to proofs
    this.client.on('messageReactionAdd', async (reaction, user) => {
      if (reaction.partial) {
        try {
          await reaction.fetch();
        } catch (error) {
          await this.logger.logError(
            error as Error,
            'Reaction Fetch',
            {
              reactionEmoji: reaction.emoji.toString(),
              messageId: reaction.message.id
            },
            {
              channelId: reaction.message.channelId,
              userId: user.id,
              guildId: reaction.message.guild?.id
            }
          );
          console.error('Something went wrong when fetching the reaction:', error);
          return;
        }
      }

      // Log all reactions (only if not partial and user is not partial)
      if (!reaction.partial && !user.partial) {
        await this.logger.logReactionAdd(reaction, user);
      }

      // Handle proof reactions
      if (reaction.emoji.name === '👍' || reaction.emoji.name === '🎉') {
        try {
          await this.channelHandlers.handleProofReaction(reaction.message, reaction);
          await this.logger.success(
            'PROOF_REACTION',
            'Proof Reaction Handled',
            `Proof reaction ${reaction.emoji.name} processed successfully`,
            {
              emoji: reaction.emoji.toString(),
              messageId: reaction.message.id,
              isProofReaction: true
            },
            {
              channelId: reaction.message.channelId,
              userId: user.id,
              guildId: reaction.message.guild?.id
            }
          );
        } catch (error) {
          await this.logger.logError(
            error as Error,
            'Proof Reaction Handling',
            {
              emoji: reaction.emoji.toString(),
              messageId: reaction.message.id
            },
            {
              channelId: reaction.message.channelId,
              userId: user.id,
              guildId: reaction.message.guild?.id
            }
          );
        }
      }
    });

    // Additional Discord events for comprehensive monitoring
    this.client.on('guildCreate', async guild => {
      await this.logger.success(
        'GUILD',
        'Bot Added to Guild',
        `Bot was added to guild: ${guild.name}`,
        {
          guildId: guild.id,
          memberCount: guild.memberCount,
          channelCount: guild.channels.cache.size,
          ownerId: guild.ownerId
        }
      );
    });

    this.client.on('guildDelete', async guild => {
      await this.logger.warning(
        'GUILD',
        'Bot Removed from Guild',
        `Bot was removed from guild: ${guild.name}`,
        {
          guildId: guild.id,
          memberCount: guild.memberCount,
          wasAvailable: guild.available
        }
      );
    });

    this.client.on('channelCreate', async channel => {
      if (channel.isTextBased()) {
        await this.logger.logChannelCreate(channel as any);
      }
    });

    this.client.on('channelDelete', async channel => {
      if (channel.isTextBased()) {
        await this.logger.logChannelDelete(channel as any);
      }
    });

    this.client.on('guildMemberAdd', async member => {
      await this.logger.logUserJoin(member.user);
    });

    this.client.on('guildMemberRemove', async member => {
      await this.logger.logUserLeave(member.user);
    });

    // Error handling
    this.client.on('error', async error => {
      await this.logger.error(
        'DISCORD_CLIENT',
        'Discord Client Error',
        `Discord client encountered an error: ${error.message}`,
        {
          error: error.message,
          stack: error.stack
        }
      );
    });

    this.client.on('warn', async info => {
      await this.logger.warning(
        'DISCORD_CLIENT',
        'Discord Client Warning',
        `Discord client warning: ${info}`,
        {
          warning: info
        }
      );
    });
  }

  async registerCommands(token: string, clientId: string, guildId: string) {
    const commands = this.setupCommands();
    const rest = new REST({ version: '10' }).setToken(token);

    try {
      console.log('Started refreshing application (/) commands.');
      
      await this.logger.info(
        'COMMANDS',
        'Command Registration Started',
        'Starting to register slash commands with Discord',
        {
          commandCount: commands.length,
          guildId: guildId,
          clientId: clientId
        }
      );

      await rest.put(
        Routes.applicationGuildCommands(clientId, guildId),
        { body: commands }
      );

      console.log('Successfully reloaded application (/) commands.');
      
      await this.logger.success(
        'COMMANDS',
        'Command Registration Successful',
        'Successfully registered all slash commands with Discord',
        {
          commandCount: commands.length,
          registeredCommands: commands.map(cmd => cmd.name),
          guildId: guildId
        }
      );
    } catch (error) {
      await this.logger.logError(
        error as Error,
        'Command Registration',
        {
          commandCount: commands.length,
          guildId: guildId,
          clientId: clientId
        }
      );
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

}
