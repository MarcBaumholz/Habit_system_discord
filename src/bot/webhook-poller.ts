import { Client, TextChannel, Message } from 'discord.js';
import { ProofProcessor } from './proof-processor';
import { DiscordLogger } from './discord-logger';

/**
 * WebhookPoller - Polls for webhook messages that don't trigger messageCreate events
 * 
 * Discord webhook messages don't trigger bot messageCreate events, so we need to
 * periodically check the channel for new webhook messages and process them manually.
 */
export class WebhookPoller {
  private client: Client;
  private proofProcessor: ProofProcessor;
  private logger: DiscordLogger;
  private channelId: string;
  private pollInterval: number;
  private lastCheckedMessageId: string | null = null;
  private intervalId: NodeJS.Timeout | null = null;
  private processedMessageIds: Set<string> = new Set();

  constructor(
    client: Client,
    proofProcessor: ProofProcessor,
    logger: DiscordLogger,
    channelId: string,
    pollInterval: number = 10000 // Poll every 10 seconds
  ) {
    this.client = client;
    this.proofProcessor = proofProcessor;
    this.logger = logger;
    this.channelId = channelId;
    this.pollInterval = pollInterval;
  }

  /**
   * Start polling for webhook messages
   */
  start() {
    console.log(`🔄 Starting webhook poller for channel ${this.channelId} (interval: ${this.pollInterval}ms)`);
    
    this.intervalId = setInterval(async () => {
      await this.pollMessages();
    }, this.pollInterval);

    // Do an immediate check
    this.pollMessages();
  }

  /**
   * Stop polling
   */
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('🛑 Webhook poller stopped');
    }
  }

  /**
   * Poll for new webhook messages in the accountability channel
   */
  private async pollMessages() {
    try {
      const channel = await this.client.channels.fetch(this.channelId);
      
      if (!channel || !channel.isTextBased()) {
        console.error('❌ Channel not found or not text-based');
        return;
      }

      const textChannel = channel as TextChannel;
      
      // Fetch recent messages (last 10)
      const messages = await textChannel.messages.fetch({ limit: 10 });
      
      // Process messages in chronological order (oldest first)
      const sortedMessages = Array.from(messages.values()).sort((a, b) => 
        a.createdTimestamp - b.createdTimestamp
      );

      for (const message of sortedMessages) {
        // Skip if we've already processed this message
        if (this.processedMessageIds.has(message.id)) {
          continue;
        }

        // Check if this is a webhook message
        const isWebhookMessage = this.isWebhookMessage(message);
        
        if (isWebhookMessage) {
          console.log(`✅ Found webhook message from ${message.author.username}: "${message.content}"`);
          
          await this.logger.info(
            'WEBHOOK_POLLER',
            'Webhook Message Found',
            `Polling detected webhook message from ${message.author.username}`,
            {
              messageId: message.id,
              webhookId: message.webhookId,
              author: message.author.username,
              content: message.content.substring(0, 100)
            },
            {
              channelId: message.channelId,
              userId: message.author.id,
              guildId: message.guild?.id
            }
          );

          // Process the webhook message
          await this.proofProcessor.handleAccountabilityMessage(message);
          
          // Mark as processed
          this.processedMessageIds.add(message.id);
        }
      }

      // Clean up old processed message IDs (keep last 100)
      if (this.processedMessageIds.size > 100) {
        const idsArray = Array.from(this.processedMessageIds);
        const toRemove = idsArray.slice(0, idsArray.length - 100);
        toRemove.forEach(id => this.processedMessageIds.delete(id));
      }

    } catch (error) {
      console.error('❌ Error polling webhook messages:', error);
      await this.logger.logError(
        error as Error,
        'Webhook Polling',
        {
          channelId: this.channelId
        },
        {
          channelId: this.channelId
        }
      );
    }
  }

  /**
   * Check if a message is a webhook message
   */
  private isWebhookMessage(message: Message): boolean {
    // Check if message has webhookId
    if (message.webhookId) {
      return true;
    }

    // Check if author is a bot and username contains "webhook" or "Marc"
    if (message.author.bot) {
      const username = message.author.username.toLowerCase();
      if (username.includes('webhook') || username.includes('marc')) {
        return true;
      }
    }

    return false;
  }
}

