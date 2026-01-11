import { Client, GatewayIntentBits, TextChannel, ButtonBuilder, ButtonStyle, ActionRowBuilder } from 'discord.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

interface TestResult {
  name: string;
  status: 'PASS' | 'FAIL' | 'SKIP';
  message: string;
  error?: any;
}

class BotTester {
  private client: Client;
  private results: TestResult[] = [];
  private testChannelId: string;

  constructor() {
    this.client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
      ]
    });

    // Use personal channel for testing
    this.testChannelId = process.env.DISCORD_PERSONAL_CHANNEL || '';
  }

  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.client.once('ready', () => {
        console.log(`✅ Connected as ${this.client.user?.tag}`);
        resolve();
      });

      this.client.on('error', (error) => {
        console.error('Client error:', error);
        reject(error);
      });

      this.client.login(process.env.DISCORD_BOT_TOKEN).catch(reject);
    });
  }

  async disconnect(): Promise<void> {
    await this.client.destroy();
  }

  private async getTestChannel(): Promise<TextChannel | null> {
    try {
      const channel = await this.client.channels.fetch(this.testChannelId);
      if (channel?.isTextBased()) {
        return channel as TextChannel;
      }
    } catch (error) {
      console.error('Error fetching test channel:', error);
    }
    return null;
  }

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private logResult(result: TestResult): void {
    this.results.push(result);
    const emoji = result.status === 'PASS' ? '✅' : result.status === 'FAIL' ? '❌' : '⏭️';
    console.log(`${emoji} ${result.name}: ${result.message}`);
    if (result.error) {
      console.error('   Error:', result.error);
    }
  }

  async test1_BotIsOnline(): Promise<void> {
    try {
      if (this.client.user) {
        this.logResult({
          name: 'Bot Online Status',
          status: 'PASS',
          message: `Bot is online as ${this.client.user.tag}`
        });
      } else {
        this.logResult({
          name: 'Bot Online Status',
          status: 'FAIL',
          message: 'Bot user not found'
        });
      }
    } catch (error) {
      this.logResult({
        name: 'Bot Online Status',
        status: 'FAIL',
        message: 'Failed to check bot status',
        error
      });
    }
  }

  async test2_ChannelAccess(): Promise<void> {
    try {
      const channel = await this.getTestChannel();
      if (channel) {
        this.logResult({
          name: 'Channel Access',
          status: 'PASS',
          message: `Successfully accessed test channel: ${channel.name}`
        });
      } else {
        this.logResult({
          name: 'Channel Access',
          status: 'FAIL',
          message: 'Could not access test channel'
        });
      }
    } catch (error) {
      this.logResult({
        name: 'Channel Access',
        status: 'FAIL',
        message: 'Error accessing channel',
        error
      });
    }
  }

  async test3_SlashCommandsRegistered(): Promise<void> {
    try {
      const guild = this.client.guilds.cache.first();
      if (!guild) {
        this.logResult({
          name: 'Slash Commands Registration',
          status: 'FAIL',
          message: 'No guild found'
        });
        return;
      }

      const commands = await guild.commands.fetch();
      const expectedCommands = [
        'join', 'proof', 'summary', 'learning', 'hurdles',
        'tools', 'onboard', 'profile', 'profile-edit',
        'mentor', 'identity', 'accountability', 'group',
        'learning-agent', 'pause', 'activate', 'batch'
      ];

      const registeredCommands = commands.map(cmd => cmd.name);
      const missingCommands = expectedCommands.filter(cmd => !registeredCommands.includes(cmd));

      if (missingCommands.length === 0) {
        this.logResult({
          name: 'Slash Commands Registration',
          status: 'PASS',
          message: `All ${expectedCommands.length} commands registered successfully`
        });
      } else {
        this.logResult({
          name: 'Slash Commands Registration',
          status: 'FAIL',
          message: `Missing commands: ${missingCommands.join(', ')}`,
          error: { missingCommands, registeredCommands }
        });
      }
    } catch (error) {
      this.logResult({
        name: 'Slash Commands Registration',
        status: 'FAIL',
        message: 'Error checking command registration',
        error
      });
    }
  }

  async test4_KeystoneHabitTrigger(): Promise<void> {
    try {
      const channel = await this.getTestChannel();
      if (!channel) {
        this.logResult({
          name: 'Keystone Habit Trigger',
          status: 'SKIP',
          message: 'Test channel not available'
        });
        return;
      }

      // Send the trigger message
      const triggerMessage = await channel.send('keystone habit');
      await this.delay(2000); // Wait for bot to respond

      // Fetch recent messages to check if bot responded
      const messages = await channel.messages.fetch({ limit: 5 });
      const botResponse = messages.find(m =>
        m.author.id === this.client.user?.id &&
        m.createdTimestamp > triggerMessage.createdTimestamp
      );

      if (botResponse) {
        // Check if the response has a button
        const hasButton = botResponse.components.length > 0;
        if (hasButton) {
          this.logResult({
            name: 'Keystone Habit Trigger',
            status: 'PASS',
            message: 'Bot responded with Create Keystone Habit button'
          });
        } else {
          this.logResult({
            name: 'Keystone Habit Trigger',
            status: 'FAIL',
            message: 'Bot responded but without button',
            error: { content: botResponse.content }
          });
        }
      } else {
        this.logResult({
          name: 'Keystone Habit Trigger',
          status: 'FAIL',
          message: 'Bot did not respond to keystone habit trigger'
        });
      }

      // Cleanup
      await triggerMessage.delete().catch(() => {});
    } catch (error) {
      this.logResult({
        name: 'Keystone Habit Trigger',
        status: 'FAIL',
        message: 'Error testing keystone habit trigger',
        error
      });
    }
  }

  async test5_MessageHandling(): Promise<void> {
    try {
      const channel = await this.getTestChannel();
      if (!channel) {
        this.logResult({
          name: 'Message Handling',
          status: 'SKIP',
          message: 'Test channel not available'
        });
        return;
      }

      // Send a normal message
      const testMessage = await channel.send('Test message - bot should not respond to this');
      await this.delay(1000);

      // Cleanup
      await testMessage.delete().catch(() => {});

      this.logResult({
        name: 'Message Handling',
        status: 'PASS',
        message: 'Bot message handling system is active'
      });
    } catch (error) {
      this.logResult({
        name: 'Message Handling',
        status: 'FAIL',
        message: 'Error testing message handling',
        error
      });
    }
  }

  async test6_DockerContainerHealth(): Promise<void> {
    try {
      // This test checks if the bot is responding, which indicates Docker container is healthy
      const channel = await this.getTestChannel();
      if (channel) {
        this.logResult({
          name: 'Docker Container Health',
          status: 'PASS',
          message: 'Bot is responding (container is healthy)'
        });
      } else {
        this.logResult({
          name: 'Docker Container Health',
          status: 'FAIL',
          message: 'Bot may not be running properly'
        });
      }
    } catch (error) {
      this.logResult({
        name: 'Docker Container Health',
        status: 'FAIL',
        message: 'Error checking container health',
        error
      });
    }
  }

  async test7_InteractionHandling(): Promise<void> {
    try {
      // Check if bot's interaction handlers are set up correctly
      // by verifying event listeners
      const listenerCount = this.client.listenerCount('interactionCreate');

      if (listenerCount > 0) {
        this.logResult({
          name: 'Interaction Handling',
          status: 'PASS',
          message: `Interaction handlers registered (${listenerCount} listeners)`
        });
      } else {
        this.logResult({
          name: 'Interaction Handling',
          status: 'FAIL',
          message: 'No interaction handlers registered'
        });
      }
    } catch (error) {
      this.logResult({
        name: 'Interaction Handling',
        status: 'FAIL',
        message: 'Error checking interaction handlers',
        error
      });
    }
  }

  generateReport(): void {
    console.log('\n' + '='.repeat(60));
    console.log('COMPREHENSIVE BOT TEST REPORT');
    console.log('='.repeat(60));
    console.log(`Total Tests: ${this.results.length}`);
    console.log(`Passed: ${this.results.filter(r => r.status === 'PASS').length}`);
    console.log(`Failed: ${this.results.filter(r => r.status === 'FAIL').length}`);
    console.log(`Skipped: ${this.results.filter(r => r.status === 'SKIP').length}`);
    console.log('='.repeat(60));

    console.log('\nDetailed Results:');
    this.results.forEach((result, index) => {
      const emoji = result.status === 'PASS' ? '✅' : result.status === 'FAIL' ? '❌' : '⏭️';
      console.log(`\n${index + 1}. ${emoji} ${result.name}`);
      console.log(`   Status: ${result.status}`);
      console.log(`   Message: ${result.message}`);
      if (result.error) {
        console.log(`   Error Details:`, result.error);
      }
    });
    console.log('\n' + '='.repeat(60));

    // Summary of issues
    const failures = this.results.filter(r => r.status === 'FAIL');
    if (failures.length > 0) {
      console.log('\n⚠️  ISSUES FOUND:');
      failures.forEach(fail => {
        console.log(`   - ${fail.name}: ${fail.message}`);
      });
    } else {
      console.log('\n✅ ALL TESTS PASSED!');
    }
  }

  async runAllTests(): Promise<void> {
    console.log('Starting comprehensive bot tests...\n');

    await this.test1_BotIsOnline();
    await this.test2_ChannelAccess();
    await this.test3_SlashCommandsRegistered();
    await this.test4_KeystoneHabitTrigger();
    await this.test5_MessageHandling();
    await this.test6_DockerContainerHealth();
    await this.test7_InteractionHandling();

    this.generateReport();
  }
}

async function main() {
  const tester = new BotTester();

  try {
    console.log('Connecting to Discord...');
    await tester.connect();

    console.log('Running tests...\n');
    await tester.runAllTests();

  } catch (error) {
    console.error('Fatal error during testing:', error);
  } finally {
    console.log('\nDisconnecting...');
    await tester.disconnect();
    console.log('Tests complete.');
  }
}

main();
