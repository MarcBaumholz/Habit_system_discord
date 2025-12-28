/**
 * Admin Commands Handler
 *
 * Commands only available in admin channel (DISCORD_ADMIN env var)
 */

import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { NotionClient } from '../notion/client';
import { getCurrentBatch, saveCurrentBatch, getCurrentBatchDay, getBatchEndDate } from '../utils/batch-manager';
import { BuddyRotationScheduler } from './buddy-rotation-scheduler';

export class AdminCommandHandler {
  private notionClient: NotionClient;
  private adminChannelId: string;
  private buddyScheduler: BuddyRotationScheduler | null;

  constructor(notionClient: NotionClient, buddyScheduler?: BuddyRotationScheduler) {
    this.notionClient = notionClient;
    this.adminChannelId = process.env.DISCORD_ADMIN || '';
    this.buddyScheduler = buddyScheduler || null;
  }

  /**
   * Check if command is from admin channel
   */
  isAdminChannel(channelId: string): boolean {
    return channelId === this.adminChannelId;
  }

  /**
   * Get admin command definitions
   */
  getCommands(): any[] {
    return [
      new SlashCommandBuilder()
        .setName('batch')
        .setDescription('Manage 66-day batches (Admin only)')
        .addSubcommand(subcommand =>
          subcommand
            .setName('start')
            .setDescription('Start a new 66-day batch')
            .addStringOption(option =>
              option
                .setName('name')
                .setDescription('Batch name (e.g., "january 2026")')
                .setRequired(true)))
        .addSubcommand(subcommand =>
          subcommand
            .setName('info')
            .setDescription('Show current batch information'))
    ];
  }

  /**
   * Handle /batch command
   */
  async handleBatchCommand(interaction: ChatInputCommandInteraction): Promise<void> {
    // Check if in admin channel
    if (!this.isAdminChannel(interaction.channelId)) {
      await interaction.reply({
        content: '❌ This command can only be used in the admin channel.',
        ephemeral: true
      });
      return;
    }

    const subcommand = interaction.options.getSubcommand();

    if (subcommand === 'start') {
      await this.handleBatchStart(interaction);
    } else if (subcommand === 'info') {
      await this.handleBatchInfo(interaction);
    }
  }

  /**
   * Handle /batch start <name>
   */
  private async handleBatchStart(interaction: ChatInputCommandInteraction): Promise<void> {
    await interaction.deferReply();

    try {
      // Get batch name from command
      const batchName = interaction.options.getString('name', true);

      // Normalize to lowercase
      const normalizedName = batchName.toLowerCase().trim();

      console.log(`🎯 Starting batch: "${normalizedName}"`);

      // Check if there's already an active batch
      const existingBatch = getCurrentBatch();
      if (existingBatch) {
        await interaction.editReply({
          content: `⚠️ There's already an active batch: **${existingBatch.name}**\n\nPlease complete or manually stop the current batch before starting a new one.`
        });
        return;
      }

      // Create batch metadata
      const today = new Date();
      const startDate = today.toISOString().split('T')[0]; // YYYY-MM-DD
      const endDate = getBatchEndDate(startDate);

      // Save batch metadata to JSON file
      saveCurrentBatch({
        name: normalizedName,
        startDate: startDate
      });

      console.log(`📦 Batch metadata saved: ${normalizedName}`);

      // Add batch label to all active users
      const enrolledCount = await this.notionClient.addBatchToAllActiveUsers(normalizedName);

      console.log(`👥 Enrolled ${enrolledCount} users in batch`);

      // Assign buddies for the batch
      let buddyPairsCount = 0;
      if (this.buddyScheduler) {
        try {
          buddyPairsCount = await this.buddyScheduler.assignBuddiesForBatch(normalizedName);
          console.log(`👥 Created ${buddyPairsCount} buddy pairs for batch`);
        } catch (error) {
          console.error('❌ Error assigning buddies:', error);
          // Continue even if buddy assignment fails
        }
      }

      // Send success message to admin channel
      await interaction.editReply({
        content: `✅ **Batch "${normalizedName}" started!**\n\n` +
          `📅 **Start Date:** ${startDate}\n` +
          `📅 **End Date:** ${endDate} (Day 66)\n` +
          `👥 **Enrolled Users:** ${enrolledCount} active users\n` +
          `👥 **Buddy Pairs Created:** ${buddyPairsCount}\n\n` +
          `🎯 Day 1 of 66 begins now for everyone!`
      });

      // Send welcome message to all enrolled users
      await this.sendBatchWelcomeMessages(normalizedName, startDate, endDate, enrolledCount);

    } catch (error) {
      console.error('❌ Error starting batch:', error);
      await interaction.editReply({
        content: `❌ Error starting batch: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }
  }

  /**
   * Handle /batch info
   */
  private async handleBatchInfo(interaction: ChatInputCommandInteraction): Promise<void> {
    await interaction.deferReply();

    try {
      const batch = getCurrentBatch();

      if (!batch) {
        await interaction.editReply({
          content: '📋 **No Active Batch**\n\nUse `/batch start <name>` to start a new 66-day batch.'
        });
        return;
      }

      const currentDay = getCurrentBatchDay();
      const endDate = getBatchEndDate(batch.startDate);
      const daysRemaining = Math.max(0, 66 - (currentDay || 0));

      // Get users in batch
      const batchUsers = await this.notionClient.getUsersInBatch(batch.name);

      await interaction.editReply({
        content: `📊 **Current Batch: ${batch.name}**\n\n` +
          `📅 **Day:** ${currentDay} of 66\n` +
          `⏳ **Days Remaining:** ${daysRemaining}\n` +
          `📅 **Start Date:** ${batch.startDate}\n` +
          `📅 **End Date:** ${endDate}\n` +
          `👥 **Enrolled Users:** ${batchUsers.length}\n\n` +
          `Status: ${currentDay && currentDay >= 66 ? '✅ Completed!' : '🟢 Active'}`
      });

    } catch (error) {
      console.error('❌ Error getting batch info:', error);
      await interaction.editReply({
        content: `❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }
  }

  /**
   * Send welcome message to accountability channel about batch start
   * (Individual user messages will be sent by daily scheduler)
   */
  private async sendBatchWelcomeMessages(
    batchName: string,
    startDate: string,
    endDate: string,
    userCount: number
  ): Promise<void> {
    // Placeholder - Welcome messages will be sent by daily message scheduler
    // This ensures all users get the Day 1 message with motivational quote
    console.log(`📨 Batch welcome will be sent via daily scheduler to ${userCount} users`);
  }
}
