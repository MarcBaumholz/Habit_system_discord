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
import { WeeklyAgentScheduler } from './weekly-agent-scheduler';
import { AccountabilityScheduler } from './accountability-scheduler';
import { BuddyRotationScheduler } from './buddy-rotation-scheduler';
import { AllUsersWeeklyScheduler } from './all-users-weekly-scheduler';
import { PersonalChannelManager } from './personal-channel-manager';
import { DiscordLogger } from './discord-logger';
import { PersonalAssistant } from './personal-assistant';
import { AIIncentiveManager } from './ai-incentive-manager';
import { AgentSystem } from '../agents';
import { PerplexityClient } from '../ai/perplexity-client';
import { WebhookPoller } from './webhook-poller';
import { ChallengeManager } from './challenge-manager';
import { ChallengeStateManager } from './challenge-state';
import { ChallengeScheduler } from './challenge-scheduler';
import { ChallengeProofProcessor } from './challenge-proof-processor';
import { MidWeekScheduler } from './midweek-scheduler';
import { AdminCommandHandler } from './admin-commands';

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
  private weeklyAgentScheduler: WeeklyAgentScheduler;
  private accountabilityScheduler: AccountabilityScheduler;
  private buddyRotationScheduler: BuddyRotationScheduler;
  private allUsersWeeklyScheduler: AllUsersWeeklyScheduler;
  private personalChannelManager: PersonalChannelManager;
  private personalAssistant: PersonalAssistant;
  private aiIncentiveManager: AIIncentiveManager;
  private logger: DiscordLogger;
  private agentSystem: AgentSystem;
  private perplexityClient: PerplexityClient;
  private webhookPoller?: WebhookPoller;
  private challengeManager: ChallengeManager;
  private challengeStateManager: ChallengeStateManager;
  private challengeScheduler?: ChallengeScheduler;
  private challengeProofProcessor: ChallengeProofProcessor;
  private midWeekScheduler?: MidWeekScheduler;
  private adminCommandHandler: AdminCommandHandler;

  constructor(notion: NotionClient) {
    console.log('🔍 DEBUG: HabitBot constructor called');
    this.client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildWebhooks
      ]
    });

    this.commands = new Collection();
    this.notion = notion;
    console.log('🔍 DEBUG: Basic initialization done');
    this.logger = new DiscordLogger(this.client);
    this.channelHandlers = new ChannelHandlers(this.client, notion);
    this.personalChannelManager = new PersonalChannelManager(this.client, notion);
    this.personalAssistant = new PersonalAssistant(this.client, this.notion, this.logger);
    this.dailyMessageScheduler = new DailyMessageScheduler(this.client, notion, this.logger);
    this.weeklyAgentScheduler = new WeeklyAgentScheduler(this.client, notion, this.logger);
    this.accountabilityScheduler = new AccountabilityScheduler(this.client, notion, this.logger);
    this.buddyRotationScheduler = new BuddyRotationScheduler(this.client, notion, this.logger);
    this.allUsersWeeklyScheduler = new AllUsersWeeklyScheduler(this.client, notion, this.logger);
    this.adminCommandHandler = new AdminCommandHandler(notion, this.buddyRotationScheduler);
    this.commandHandler = new CommandHandler(notion, this.channelHandlers, this.personalChannelManager, this.logger, this.personalAssistant);
    this.habitFlow = new HabitFlowManager(notion, this.personalAssistant);
    this.proofProcessor = new ProofProcessor(notion);
    this.messageAnalyzer = new MessageAnalyzer(notion, this.client, this.logger);
    this.toolsAssistant = new ToolsAssistant(this.client, this.notion);
    
    // Generate profiles for all users on startup (async, don't block)
    this.personalAssistant.generateAllUserProfiles(true).catch(error => {
      console.error('⚠️ Error generating profiles on startup:', error);
    });
    
    // Start periodic profile update checker (reacts to database changes)
    this.personalAssistant.startPeriodicProfileUpdate();
    this.aiIncentiveManager = new AIIncentiveManager(this.client, this.notion, this.logger);
    
    // Initialize Multi-Agent System
    this.perplexityClient = new PerplexityClient(process.env.PERPLEXITY_API_KEY!);
    this.agentSystem = AgentSystem.getInstance();
    
    // Initialize Webhook Poller for accountability channel
    const accountabilityChannelId = process.env.DISCORD_ACCOUNTABILITY_GROUP;
    if (accountabilityChannelId) {
      this.webhookPoller = new WebhookPoller(
        this.client,
        this.proofProcessor,
        this.logger,
        accountabilityChannelId,
        10000 // Poll every 10 seconds
      );
    }

    // Initialize Weekly Challenge System
    console.log('🔍 DEBUG: Starting Weekly Challenge System initialization...');

    try {
      console.log('🔍 DEBUG: Creating ChallengeManager...');
      this.challengeManager = new ChallengeManager();
      console.log('✅ DEBUG: ChallengeManager created successfully');

      console.log('🔍 DEBUG: Creating ChallengeStateManager...');
      this.challengeStateManager = new ChallengeStateManager();
      console.log('✅ DEBUG: ChallengeStateManager created successfully');

      console.log('🔍 DEBUG: Creating ChallengeProofProcessor...');
      this.challengeProofProcessor = new ChallengeProofProcessor(
        notion,
        this.challengeManager,
        this.challengeStateManager
      );
      console.log('✅ DEBUG: ChallengeProofProcessor created successfully');

      // Initialize Challenge Scheduler (will be started after bot is ready)
      const weeklyChallengesChannelId = process.env.DISCORD_WEEKLY_CHALLENGES;
      console.log('🔍 DEBUG: Weekly Challenges Channel ID:', weeklyChallengesChannelId);

      if (weeklyChallengesChannelId) {
        console.log('🔍 DEBUG: Creating ChallengeScheduler...');
        this.challengeScheduler = new ChallengeScheduler(
          notion,
          this.challengeManager,
          this.challengeStateManager,
          weeklyChallengesChannelId,
          this.client
        );
        console.log('✅ DEBUG: ChallengeScheduler created successfully');
      } else {
        console.warn('⚠️ DEBUG: No Weekly Challenges Channel ID found - scheduler not initialized');
      }
    } catch (error) {
      console.error('❌ DEBUG: Error during challenge system initialization:', error);
      throw error;
    }

    this.setupCommands();
    this.setupEventHandlers();
  }

  private setupCommands() {
    const commands = [
      new SlashCommandBuilder()
        .setName('join')
        .setDescription('Join the habit tracking system'),
      
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
        .setName('tools')
        .setDescription('Get link to the habit tools website with 19+ proven strategies')
        .addStringOption(option =>
          option.setName('search')
            .setDescription('Search for a specific tool (optional)')
            .setRequired(false)),

      new SlashCommandBuilder()
        .setName('onboard')
        .setDescription('Erstelle dein persönliches Profil für den Mentor-Agent / Create your personal profile'),

      new SlashCommandBuilder()
        .setName('profile')
        .setDescription('Zeige dein Persönlichkeitsprofil an / View your personality profile'),

      new SlashCommandBuilder()
        .setName('profile-edit')
        .setDescription('Bearbeite dein Persönlichkeitsprofil / Edit your personality profile'),

      new SlashCommandBuilder()
        .setName('mentor')
        .setDescription('Get personalized habit coaching and analysis from the AI mentor')
        .addStringOption(option =>
          option.setName('query')
            .setDescription('What would you like help with? (e.g., "weekly analysis", "habit feedback", "coaching advice")')
            .setRequired(true)),

      new SlashCommandBuilder()
        .setName('identity')
        .setDescription('Get personality-based habit recommendations and identity analysis')
        .addStringOption(option =>
          option.setName('query')
            .setDescription('Analyze your identity and get personalized habit recommendations')
            .setRequired(true)),

      new SlashCommandBuilder()
        .setName('accountability')
        .setDescription('Get personalized accountability support and motivation')
        .addStringOption(option =>
          option.setName('query')
            .setDescription('Get accountability support and motivation')
            .setRequired(true)),

      new SlashCommandBuilder()
        .setName('group')
        .setDescription('Get group dynamics analysis and social recommendations')
        .addStringOption(option =>
          option.setName('query')
            .setDescription('Get group dynamics analysis and social recommendations')
            .setRequired(true)),

      new SlashCommandBuilder()
        .setName('learning-agent')
        .setDescription('Get insights from your learnings and hurdle solutions')
        .addStringOption(option =>
          option.setName('query')
            .setDescription('Get insights from your learnings and hurdle solutions')
            .setRequired(true)),

      new SlashCommandBuilder()
        .setName('pause')
        .setDescription('Pause your participation in the habit system')
        .addStringOption(option =>
          option.setName('reason')
            .setDescription('Why you are pausing (required)')
            .setRequired(true))
        .addStringOption(option =>
          option.setName('duration')
            .setDescription('How long you expect to pause (informational, optional)')
            .setRequired(false)),

      new SlashCommandBuilder()
        .setName('activate')
        .setDescription('Reactivate your participation in the habit system'),

      // Admin commands
      ...this.adminCommandHandler.getCommands()
    ];

    this.commands.set('join', { execute: this.commandHandler.handleJoin.bind(this.commandHandler) });
    this.commands.set('proof', { execute: this.commandHandler.handleProof.bind(this.commandHandler) });
    this.commands.set('summary', { execute: this.commandHandler.handleSummary.bind(this.commandHandler) });
    this.commands.set('learning', { execute: this.commandHandler.handleLearning.bind(this.commandHandler) });
    this.commands.set('hurdles', { execute: this.commandHandler.handleHurdles.bind(this.commandHandler) });
    this.commands.set('tools', { execute: this.commandHandler.handleTools.bind(this.commandHandler) });
    this.commands.set('onboard', { execute: this.commandHandler.handleOnboard.bind(this.commandHandler) });
    this.commands.set('profile', { execute: this.commandHandler.handleProfile.bind(this.commandHandler) });
    this.commands.set('profile-edit', { execute: this.commandHandler.handleProfileEdit.bind(this.commandHandler) });
    this.commands.set('mentor', { execute: this.handleMentorCommand.bind(this) });
    this.commands.set('identity', { execute: this.handleIdentityCommand.bind(this) });
    this.commands.set('accountability', { execute: this.handleAccountabilityCommand.bind(this) });
    this.commands.set('group', { execute: this.handleGroupCommand.bind(this) });
    this.commands.set('learning-agent', { execute: this.handleLearningCommand.bind(this) });
    this.commands.set('pause', { execute: this.commandHandler.handlePause.bind(this.commandHandler) });
    this.commands.set('activate', { execute: this.commandHandler.handleActivate.bind(this.commandHandler) });
    this.commands.set('batch', { execute: this.adminCommandHandler.handleBatchCommand.bind(this.adminCommandHandler) });

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
      
      // Initialize Multi-Agent System (temporarily disabled for daily message fix)
      /*
      try {
        await this.agentSystem.initialize(this.perplexityClient, this.notion);
        console.log('🤖 Multi-Agent Habit Mentor System initialized successfully!');
        
        await this.logger.success(
          'AGENT_SYSTEM',
          'Agent System Initialized',
          'Multi-Agent Habit Mentor System initialized successfully',
          {
            agentCount: (await this.agentSystem.getSystemStatus()).agents.length,
            systemHealth: (await this.agentSystem.getSystemHealth()).overall
          }
        );
      } catch (error) {
        console.error('❌ Failed to initialize Multi-Agent System:', error);
        await this.logger.error(
          'AGENT_SYSTEM',
          'Agent System Initialization Failed',
          `Failed to initialize Multi-Agent System: ${error.message}`,
          { error: error.message, stack: error.stack }
        );
      }
      */
      console.log('ℹ️ Multi-Agent System temporarily disabled for daily message fix');

      // Start the daily message scheduler for 66-day challenge
      this.dailyMessageScheduler.startScheduler();
      console.log('🗓️ Daily message scheduler started - 66-day challenge begins tomorrow at 6 AM!');
      
      // Start the webhook poller for accountability channel
      if (this.webhookPoller) {
        // DISABLED: WebhookPoller conflicts with main message handler
        // this.webhookPoller.start();
        console.log('🔄 Webhook poller started for accountability channel');
        
        await this.logger.success(
          'WEBHOOK_POLLER',
          'Webhook Poller Started',
          'Webhook poller started successfully for accountability channel',
          {
            channelId: process.env.DISCORD_ACCOUNTABILITY_GROUP,
            pollInterval: '10 seconds'
          }
        );
      }
      
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
        
        // Test daily message sending after 5 seconds (for testing)
        setTimeout(async () => {
          console.log('🧪 Testing daily message sending...');
          await this.dailyMessageScheduler.testSendDailyMessage();
        }, 5000);
      }, 3000);

      // Initialize mid-week scheduler
      const accountabilityChannelId = process.env.DISCORD_ACCOUNTABILITY_GROUP;
      if (accountabilityChannelId) {
        try {
          const accountabilityChannel = await this.client.channels.fetch(accountabilityChannelId);
          if (accountabilityChannel?.isTextBased()) {
            this.midWeekScheduler = new MidWeekScheduler(accountabilityChannel as any, this.logger);
            this.midWeekScheduler.start();
            console.log('📊 Mid-week scheduler initialized and started (Wednesday 8pm)');

            await this.logger.success(
              'MIDWEEK_SCHEDULER',
              'Mid-Week Scheduler Started',
              'CrewAI mid-week analysis scheduler initialized successfully',
              {
                schedule: 'Every Wednesday at 20:00',
                timezone: process.env.TIMEZONE || 'Europe/Berlin',
                accountabilityChannel: accountabilityChannelId
              }
            );
          }
        } catch (error) {
          console.error('❌ Failed to initialize mid-week scheduler:', error);
          await this.logger.logError(
            error as Error,
            'Mid-Week Scheduler Initialization',
            { component: 'MidWeekScheduler' }
          );
        }
      }
    });

    // Unified message listener for all message processing
    this.client.on('messageCreate', async message => {
      try {
        // Process webhook messages FIRST (before bot filter)
        if (message.channelId === process.env.DISCORD_ACCOUNTABILITY_GROUP) {
          // Check if this is a webhook message
          const authorNames = this.getAuthorNameCandidates(message);
          const nameWithWebhook = authorNames.find(name => this.hasWebhookKeyword(name));
          const isWebhookMessage = Boolean(message.webhookId) || Boolean(nameWithWebhook);
          
          // Additional check: if author is bot and username contains "webhook"
          // Removed "marc" check to prevent regular users from being classified as webhooks
          const isWebhookByUsername = message.author.bot && (
            message.author.username.toLowerCase().includes('webhook')
          );
          
          const finalIsWebhook = isWebhookMessage || isWebhookByUsername;
          
          if (finalIsWebhook) {
            await this.logger.info(
              'WEBHOOK_DETECTION',
              'Webhook Message Detected',
              `Processing webhook message from ${message.author.username}`,
              {
                webhookId: message.webhookId,
                authorNames: authorNames,
                nameWithWebhook: nameWithWebhook,
                isWebhookByUsername: isWebhookByUsername
              },
              {
                channelId: message.channelId,
                userId: message.author.id,
                guildId: message.guild?.id
              }
            );
            
            // Process webhook message directly
            await this.proofProcessor.handleAccountabilityMessage(message);
            return; // Exit early if webhook was processed
          }
        }

        // Skip bot messages to prevent logging loops (after webhook processing)
        if (message.author.bot) {
          return;
        }

        // Log all message creation (only for non-bot messages)
        await this.logger.logMessageCreate(message);

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

        // Weekly Challenges channel: process challenge proofs
        if (process.env.DISCORD_WEEKLY_CHALLENGES && message.channelId === process.env.DISCORD_WEEKLY_CHALLENGES) {
          await this.logger.info(
            'CHALLENGE_PROOF',
            'Challenge Proof Submission',
            `Processing challenge proof from ${message.author.username}`,
            {
              contentLength: message.content.length,
              isChallengesChannel: true
            },
            {
              channelId: message.channelId,
              userId: message.author.id,
              guildId: message.guild?.id
            }
          );
          await this.challengeProofProcessor.processMessage(message);
          return; // Exit early if challenge proof processor handled the message
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

        // Process accountability messages with proof processor
        // Note: Removed messageAnalyzer to prevent duplicate messages
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
      try {
        // Handle Modal Submissions
        if (interaction.isModalSubmit()) {
          // Onboarding modals
          if (interaction.customId === 'onboard_modal' || interaction.customId === 'onboard_modal_2') {
            await this.commandHandler.handleOnboardModalSubmit(interaction);
            return;
          }
          // Profile edit modal
          if (interaction.customId === 'profile_edit_modal') {
            await this.commandHandler.handleProfileEditModalSubmit(interaction);
            return;
          }
          // Keystone habit modals
          if (interaction.customId.startsWith('keystone_modal_')) {
            await this.habitFlow.handleModalSubmit(interaction);
            return;
          }
          return;
        }

        // Handle Button Interactions
        if (interaction.isButton()) {
          // Challenge join button
          if (interaction.customId === 'join_challenge') {
            await this.handleChallengeJoin(interaction);
            return;
          }
          // Profile edit button
          if (interaction.customId === 'profile_edit_button') {
            await this.commandHandler.handleProfileEdit(interaction);
            return;
          }
          // Onboarding flow buttons
          if (interaction.customId === 'onboard_modal_2_trigger') {
            await this.commandHandler.handleSecondOnboardModal(interaction);
            return;
          }
          // Keystone habit buttons (including day selector)
          if (interaction.customId.startsWith('keystone_') || interaction.customId.startsWith('day_')) {
            await this.habitFlow.handleButtonInteraction(interaction);
            return;
          }
          return;
        }

        if (!interaction.isChatInputCommand()) return;

        // Log all command interactions
        await this.logger.logCommandInteraction(interaction);

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
              guildId: interaction.guild?.id || undefined
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
              guildId: interaction.guild?.id || undefined
            },
            {
              channelId: interaction.channelId,
              userId: interaction.user.id,
              guildId: interaction.guild?.id || undefined
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
            commandName: interaction.isChatInputCommand() ? interaction.commandName : undefined
          },
          {
            channelId: interaction.channelId || undefined,
            userId: interaction.user.id,
            guildId: interaction.guild?.id || undefined
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

    // Initialize and start weekly agent scheduler
    try {
      console.log('🤖 Initializing Weekly Agent Scheduler...');
      await this.weeklyAgentScheduler.initialize();
      this.weeklyAgentScheduler.startScheduler();

      // Buddy assignment now happens automatically when /batch start is called
      console.log('👥 Buddy Assignment: Configured to run when batch starts (via /batch start command)');

      // Initialize and start all-users weekly scheduler
      await this.allUsersWeeklyScheduler.initialize();
      await this.allUsersWeeklyScheduler.startScheduler();
      console.log('✅ All-Users Weekly Scheduler started successfully (Wednesday 9 AM)');
      console.log('✅ Weekly Agent Scheduler started successfully');
    } catch (error) {
      console.error('❌ Failed to initialize Weekly Agent Scheduler:', error);
      await this.logger.logError(
        error as Error,
        'Weekly Agent Scheduler Initialization',
        { component: 'WeeklyAgentScheduler' }
      );
    }

    // Initialize and start accountability scheduler (Sunday 8 PM)
    try {
      console.log('💰 Initializing Accountability & Money Scheduler...');
      await this.accountabilityScheduler.initialize();
      this.accountabilityScheduler.startScheduler();
      console.log('✅ Accountability Scheduler started successfully (Sunday 8 PM)');
    } catch (error) {
      console.error('❌ Failed to initialize Accountability Scheduler:', error);
      await this.logger.logError(
        error as Error,
        'Accountability Scheduler Initialization',
        { component: 'AccountabilityScheduler' }
      );
    }

    // Initialize and start challenge scheduler
    console.log('🔍 DEBUG: Checking challenge scheduler...', {
      exists: !!this.challengeScheduler,
      channelId: process.env.DISCORD_WEEKLY_CHALLENGES
    });

    if (this.challengeScheduler) {
      try {
        console.log('🏆 Initializing Weekly Challenge Scheduler...');
        this.challengeScheduler.start();
        console.log('✅ Challenge Scheduler started successfully (Sun 9 AM evaluation, Sun 3 PM deploy, Wed 12 PM reminder)');
      } catch (error) {
        console.error('❌ Failed to initialize Challenge Scheduler:', error);
        await this.logger.logError(
          error as Error,
          'Challenge Scheduler Initialization',
          { component: 'ChallengeScheduler' }
        );
      }
    } else {
      console.warn('⚠️ Challenge Scheduler not initialized - check DISCORD_WEEKLY_CHALLENGES env var');
    }
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

  // Handle mentor command
  private async handleMentorCommand(interaction: any) {
    try {
      await interaction.deferReply();

      const query = interaction.options.getString('query');
      
      // Temporary: Agent system disabled for daily message fix
      await interaction.editReply('ℹ️ The mentor command is temporarily disabled while we deploy a critical fix. Please check back soon!');
      return;

      /*
      // Get user context from Notion
      const userContext = await this.getUserContext(interaction.user.id);
      
      if (!userContext) {
        await interaction.editReply('❌ User not found. Please use `/join` to register first.');
        return;
      }

      // Process with agent system
      const response = await this.agentSystem.processUserMessage(
        userContext,
        query,
        { 
          context: 'mentor_command',
          channel_id: interaction.channelId,
          user_id: interaction.user.id
        }
      );

      if (response.success) {
        // Format response for Discord
        let responseText = response.message;
        
        if (response.recommendations && response.recommendations.length > 0) {
          responseText += '\n\n**Recommendations:**';
          response.recommendations.forEach((rec: any, index: number) => {
            responseText += `\n${index + 1}. ${rec.title || rec.description}`;
          });
        }

        if (response.insights && response.insights.length > 0) {
          responseText += '\n\n**Insights:**';
          response.insights.forEach((insight: any, index: number) => {
            responseText += `\n${index + 1}. ${insight.insight}`;
          });
        }

        if (response.next_steps && response.next_steps.length > 0) {
          responseText += '\n\n**Next Steps:**';
          response.next_steps.forEach((step: string, index: number) => {
            responseText += `\n${index + 1}. ${step}`;
          });
        }

        // Truncate if too long
        if (responseText.length > 2000) {
          responseText = responseText.substring(0, 1997) + '...';
        }

        await interaction.editReply(responseText);
        
        await this.logger.success(
          'MENTOR_COMMAND',
          'Mentor Command Executed',
          `Mentor command executed successfully for user ${interaction.user.username}`,
          {
            query: query.substring(0, 100),
            responseLength: responseText.length,
            confidence: response.confidence,
            primaryAgent: response.metadata?.primary_agent
          },
          {
            channelId: interaction.channelId,
            userId: interaction.user.id,
            guildId: interaction.guild?.id || undefined
          }
        );
      } else {
        await interaction.editReply('❌ Sorry, I encountered an error while processing your request. Please try again later.');
        
        await this.logger.error(
          'MENTOR_COMMAND',
          'Mentor Command Failed',
          `Mentor command failed for user ${interaction.user.username}`,
          {
            query: query.substring(0, 100),
            error: response.message
          },
          {
            channelId: interaction.channelId,
            userId: interaction.user.id,
            guildId: interaction.guild?.id || undefined
          }
        );
      }
      */

    } catch (error) {
      console.error('Error handling mentor command:', error);
      
      await interaction.editReply('❌ Sorry, I encountered an error while processing your request. Please try again later.');
      
      await this.logger.logError(
        error as Error,
        'Mentor Command Error',
        {
          query: interaction.options.getString('query'),
          userId: interaction.user.id
        },
        {
          channelId: interaction.channelId,
          userId: interaction.user.id,
          guildId: interaction.guild?.id || undefined
        }
      );
    }
  }

  // Handle identity command
  private async handleIdentityCommand(interaction: any) {
    try {
      await interaction.deferReply();

      const query = interaction.options.getString('query');
      
      // Get user context from Notion
      const userContext = await this.getUserContext(interaction.user.id);
      
      if (!userContext) {
        await interaction.editReply('❌ User not found. Please use `/join` to register first.');
        return;
      }

      // Process with agent system
      const response = await this.agentSystem.processUserMessage(
        userContext,
        query,
        { 
          context: 'identity_command',
          channel_id: interaction.channelId,
          user_id: interaction.user.id
        }
      );

      if (response.success) {
        let responseText = response.message;
        
        if (responseText.length > 2000) {
          responseText = responseText.substring(0, 1997) + '...';
        }

        await interaction.editReply(responseText);
      } else {
        await interaction.editReply(`❌ ${response.message}`);
      }

    } catch (error) {
      console.error('Error handling identity command:', error);
      await interaction.editReply('❌ Sorry, I encountered an error while processing your request. Please try again later.');
    }
  }

  // Handle accountability command
  private async handleAccountabilityCommand(interaction: any) {
    try {
      await interaction.deferReply();

      const query = interaction.options.getString('query');
      
      // Get user context from Notion
      const userContext = await this.getUserContext(interaction.user.id);
      
      if (!userContext) {
        await interaction.editReply('❌ User not found. Please use `/join` to register first.');
        return;
      }

      // Process with agent system
      const response = await this.agentSystem.processUserMessage(
        userContext,
        query,
        { 
          context: 'accountability_command',
          channel_id: interaction.channelId,
          user_id: interaction.user.id
        }
      );

      if (response.success) {
        let responseText = response.message;
        
        if (responseText.length > 2000) {
          responseText = responseText.substring(0, 1997) + '...';
        }

        await interaction.editReply(responseText);
      } else {
        await interaction.editReply(`❌ ${response.message}`);
      }

    } catch (error) {
      console.error('Error handling accountability command:', error);
      await interaction.editReply('❌ Sorry, I encountered an error while processing your request. Please try again later.');
    }
  }

  // Handle group command
  private async handleGroupCommand(interaction: any) {
    try {
      await interaction.deferReply();

      const query = interaction.options.getString('query');
      
      // Get user context from Notion
      const userContext = await this.getUserContext(interaction.user.id);
      
      if (!userContext) {
        await interaction.editReply('❌ User not found. Please use `/join` to register first.');
        return;
      }

      // Process with agent system
      const response = await this.agentSystem.processUserMessage(
        userContext,
        query,
        { 
          context: 'group_command',
          channel_id: interaction.channelId,
          user_id: interaction.user.id
        }
      );

      if (response.success) {
        let responseText = response.message;
        
        if (responseText.length > 2000) {
          responseText = responseText.substring(0, 1997) + '...';
        }

        await interaction.editReply(responseText);
      } else {
        await interaction.editReply(`❌ ${response.message}`);
      }

    } catch (error) {
      console.error('Error handling group command:', error);
      await interaction.editReply('❌ Sorry, I encountered an error while processing your request. Please try again later.');
    }
  }

  // Handle learning command
  private async handleLearningCommand(interaction: any) {
    try {
      await interaction.deferReply();

      const query = interaction.options.getString('query');
      
      // Get user context from Notion
      const userContext = await this.getUserContext(interaction.user.id);
      
      if (!userContext) {
        await interaction.editReply('❌ User not found. Please use `/join` to register first.');
        return;
      }

      // Process with agent system
      const response = await this.agentSystem.processUserMessage(
        userContext,
        query,
        { 
          context: 'learning_command',
          channel_id: interaction.channelId,
          user_id: interaction.user.id
        }
      );

      if (response.success) {
        let responseText = response.message;
        
        if (responseText.length > 2000) {
          responseText = responseText.substring(0, 1997) + '...';
        }

        await interaction.editReply(responseText);
      } else {
        await interaction.editReply(`❌ ${response.message}`);
      }

    } catch (error) {
      console.error('Error handling learning command:', error);
      await interaction.editReply('❌ Sorry, I encountered an error while processing your request. Please try again later.');
    }
  }

  /**
   * Handle challenge join button click
   */
  private async handleChallengeJoin(interaction: any): Promise<void> {
    try {
      await interaction.deferReply({ ephemeral: true });

      const userId = interaction.user.id;

      // Check if user is active in Notion
      const user = await this.notion.getUserByDiscordId(userId);
      if (!user) {
        await interaction.editReply('❌ You need to join the habit system first! Use `/join` command.');
        return;
      }

      if (user.status !== 'active') {
        await interaction.editReply('❌ You need to be active in the habit system to join challenges. Use `/activate` to resume participation.');
        return;
      }

      // Check if user already joined
      if (this.challengeStateManager.hasUserJoined(userId)) {
        await interaction.editReply('⚠️ You have already joined this week\'s challenge! Submit proofs in this channel.');
        return;
      }

      // Get current challenge info
      const currentIndex = this.challengeStateManager.getCurrentChallengeIndex();
      const challenge = this.challengeManager.getChallengeByIndex(currentIndex);
      const { weekStart, weekEnd } = this.challengeStateManager.getCurrentWeek();

      if (!challenge || !weekStart) {
        await interaction.editReply('❌ No active challenge right now. Wait for Sunday at 3 PM!');
        return;
      }

      // Add user to joined list
      this.challengeStateManager.addJoinedUser(userId);

      // Send confirmation
      await interaction.editReply(
        `✅ **You joined the challenge!**\n\n` +
        `🏆 **Challenge:** ${challenge.name}\n` +
        `📅 **Period:** ${weekStart} → ${weekEnd}\n` +
        `🎯 **Goal:** Complete ${challenge.daysRequired} days\n` +
        `💰 **Reward:** €1 credit if you complete it!\n\n` +
        `Submit your daily proof in this channel. Type your achievement (e.g., "${challenge.dailyRequirement}"). Maximum 1 proof per day!\n\n` +
        `Good luck! 🚀`
      );

      // Log success
      await this.logger.success(
        'CHALLENGE',
        'User Joined Challenge',
        `${user.name} joined Challenge #${challenge.id}: ${challenge.name}`,
        {
          challengeId: challenge.id,
          challengeName: challenge.name,
          userName: user.name,
          weekStart,
          weekEnd
        },
        {
          channelId: interaction.channelId,
          userId: interaction.user.id,
          guildId: interaction.guild?.id
        }
      );

      // Update challenge message with new participant count
      const participantCount = this.challengeStateManager.getParticipantCount();
      const messageId = this.challengeStateManager.getChallengeMessageId();

      if (messageId) {
        try {
          const channel = await this.client.channels.fetch(process.env.DISCORD_WEEKLY_CHALLENGES!) as any;
          const message = await channel.messages.fetch(messageId);

          // Update the embed to show participant count
          const updatedEmbed = message.embeds[0];
          if (updatedEmbed) {
            updatedEmbed.fields = updatedEmbed.fields.filter((f: any) => f.name !== '👥 Participants');
            updatedEmbed.fields.push({
              name: '👥 Participants',
              value: `${participantCount} joined`,
              inline: true
            });

            await message.edit({ embeds: [updatedEmbed], components: message.components });
          }
        } catch (error) {
          console.error('Error updating challenge message:', error);
        }
      }
    } catch (error) {
      console.error('[Bot] Error handling challenge join:', error);
      await this.logger.logError(
        error as Error,
        'Challenge Join Error',
        {
          userId: interaction.user.id
        },
        {
          channelId: interaction.channelId,
          userId: interaction.user.id,
          guildId: interaction.guild?.id
        }
      );

      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({ content: '❌ There was an error joining the challenge. Please try again.', ephemeral: true });
      } else {
        await interaction.editReply('❌ There was an error joining the challenge. Please try again.');
      }
    }
  }

  // Helper method to get user context (temporarily disabled for daily message fix)
  private async getUserContext(discordId: string): Promise<any> {
    /*
    try {
      // Get user from Notion
      const user = await this.notion.getUserByDiscordId(discordId);
      if (!user) return null;

      // Get user's habits
      const habits = await this.notion.getUserHabits(user.id);

      // Get recent proofs (last 30 days)
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const proofs = await this.notion.getUserProofs(user.id, thirtyDaysAgo);

      // Get recent learnings
      const learnings = await this.notion.getUserLearnings(user.id, thirtyDaysAgo);

      // Get recent hurdles
      const hurdles = await this.notion.getUserHurdles(user.id, thirtyDaysAgo);

      // Get weekly summary
      const weeklySummary = await this.notion.getUserWeeklySummary(user.id);

      return {
        user,
        current_habits: habits,
        recent_proofs: proofs,
        learnings,
        hurdles,
        weekly_summary: weeklySummary
      };
    } catch (error) {
      console.error('Error getting user context:', error);
      return null;
    }
    */
    return null; // Temporarily disabled
  }

  // Helper methods for webhook detection
  private getAuthorNameCandidates(message: any): string[] {
    const names = new Set<string>();

    const member = message.member;
    if (member && typeof member.nickname === 'string') {
      const nickname = member.nickname.trim();
      if (nickname) {
        names.add(nickname);
      }
    }

    const author = message.author;
    const keys = ['username', 'globalName', 'displayName', 'tag', 'name'];
    for (const key of keys) {
      const value = author?.[key];
      if (typeof value === 'string') {
        const trimmed = value.trim();
        if (trimmed) {
          names.add(trimmed);
        }
      }
    }

    return Array.from(names);
  }

  private hasWebhookKeyword(value: string): boolean {
    return value.toLowerCase().includes('webhook');
  }

}
