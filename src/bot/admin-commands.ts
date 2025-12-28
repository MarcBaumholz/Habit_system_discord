/**
 * Admin Commands Handler
 *
 * Commands only available in admin channel (DISCORD_ADMIN env var)
 */

import { ChatInputCommandInteraction, SlashCommandBuilder, TextChannel } from 'discord.js';
import { NotionClient } from '../notion/client';
import {
  getCurrentBatch,
  saveCurrentBatch,
  getCurrentBatchDay,
  getBatchEndDate,
  getDaysUntilBatchStart,
  isBatchInPrePhase,
  isBatchActive
} from '../utils/batch-manager';
import { BuddyRotationScheduler } from './buddy-rotation-scheduler';

export class AdminCommandHandler {
  private notionClient: NotionClient;
  private adminChannelId: string;
  private accountabilityChannelId: string;
  private buddyScheduler: BuddyRotationScheduler | null;

  constructor(notionClient: NotionClient, buddyScheduler?: BuddyRotationScheduler) {
    this.notionClient = notionClient;
    this.adminChannelId = process.env.DISCORD_ADMIN || '';
    this.accountabilityChannelId = process.env.DISCORD_ACCOUNTABILITY_GROUP || '';
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
                .setRequired(true))
            .addStringOption(option =>
              option
                .setName('start-date')
                .setDescription('Start date (YYYY-MM-DD, e.g., 2026-01-05). If not provided, starts today.')
                .setRequired(false)))
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
      const startDateInput = interaction.options.getString('start-date');

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

      // Determine start date
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      let startDate: Date;
      if (startDateInput) {
        // Validate date format (YYYY-MM-DD)
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(startDateInput)) {
          await interaction.editReply({
            content: '❌ Invalid date format. Please use YYYY-MM-DD (e.g., 2026-01-05)'
          });
          return;
        }

        startDate = new Date(startDateInput);
        startDate.setHours(0, 0, 0, 0);

        // Validate date is not in the past
        if (startDate < today) {
          await interaction.editReply({
            content: '❌ Start date cannot be in the past. Please choose today or a future date.'
          });
          return;
        }
      } else {
        // No start date provided - start today
        startDate = today;
      }

      // Determine batch status
      const isPrePhase = startDate > today;
      const status: 'pre-phase' | 'active' = isPrePhase ? 'pre-phase' : 'active';

      const startDateStr = startDate.toISOString().split('T')[0]; // YYYY-MM-DD
      const createdDateStr = today.toISOString().split('T')[0];
      const endDate = getBatchEndDate(startDateStr);

      // Create batch metadata
      saveCurrentBatch({
        name: normalizedName,
        createdDate: createdDateStr,
        startDate: startDateStr,
        endDate: endDate,
        status: status
      });

      console.log(`📦 Batch metadata saved: ${normalizedName} (Status: ${status})`);

      if (isPrePhase) {
        // PRE-PHASE: Batch created but not started yet
        const daysUntilStart = Math.floor((startDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

        await interaction.editReply({
          content: `✅ **Batch "${normalizedName}" created!**\n\n` +
            `📅 **Created:** ${createdDateStr}\n` +
            `📅 **Start Date:** ${startDateStr} (in ${daysUntilStart} days)\n` +
            `📅 **End Date:** ${endDate} (Day 66)\n` +
            `⏳ **Status:** Pre-phase\n\n` +
            `👥 Users can now join the batch using \`/join\` command.\n` +
            `🎯 The batch will automatically start on ${startDateStr}!`
        });

        // Post announcement to accountability channel (if available)
        if (this.accountabilityChannelId) {
          const channel = interaction.client.channels.cache.get(this.accountabilityChannelId) as TextChannel;
          if (channel) {
            await channel.send(
              `🎉 **New Batch Available!**\n\n` +
              `📦 **Batch Name:** ${normalizedName}\n` +
              `📅 **Start Date:** ${startDateStr} (in ${daysUntilStart} days)\n` +
              `📅 **End Date:** ${endDate}\n\n` +
              `👉 Join now using \`/join\` command!\n` +
              `⏰ Batch starts on ${startDateStr}.`
            );
          }
        }

      } else {
        // ACTIVE: Batch starts immediately

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
            `📅 **Start Date:** ${startDateStr}\n` +
            `📅 **End Date:** ${endDate} (Day 66)\n` +
            `👥 **Enrolled Users:** ${enrolledCount} active users\n` +
            `👥 **Buddy Pairs Created:** ${buddyPairsCount}\n\n` +
            `🎯 Day 1 of 66 begins now for everyone!`
        });

        // Send welcome message to all enrolled users
        await this.sendBatchWelcomeMessages(normalizedName, startDateStr, endDate, enrolledCount);
      }

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
          content: '📋 **No Active Batch**\n\nUse `/batch start <name> [start-date]` to create a new 66-day batch.'
        });
        return;
      }

      // Get users in batch
      const batchUsers = await this.notionClient.getUsersInBatch(batch.name);

      if (batch.status === 'pre-phase') {
        // PRE-PHASE: Show countdown and enrollment info
        const daysUntilStart = getDaysUntilBatchStart() || 0;

        await interaction.editReply({
          content: `📊 **Batch: ${batch.name}**\n\n` +
            `⏳ **Status:** Pre-phase\n` +
            `📅 **Created:** ${batch.createdDate}\n` +
            `📅 **Start Date:** ${batch.startDate} (in ${daysUntilStart} days)\n` +
            `📅 **End Date:** ${batch.endDate} (Day 66)\n` +
            `👥 **Enrolled Users:** ${batchUsers.length}\n\n` +
            `🎯 Users can join using \`/join\` command.\n` +
            `⏰ Batch will automatically start on ${batch.startDate}.`
        });

      } else if (batch.status === 'active') {
        // ACTIVE: Show current day and progress
        const currentDay = getCurrentBatchDay();
        const daysRemaining = Math.max(0, 66 - (currentDay || 0));

        await interaction.editReply({
          content: `📊 **Current Batch: ${batch.name}**\n\n` +
            `🟢 **Status:** Active\n` +
            `📅 **Day:** ${currentDay} of 66\n` +
            `⏳ **Days Remaining:** ${daysRemaining}\n` +
            `📅 **Start Date:** ${batch.startDate}\n` +
            `📅 **End Date:** ${batch.endDate}\n` +
            `👥 **Enrolled Users:** ${batchUsers.length}\n\n` +
            `${currentDay && currentDay >= 66 ? '✅ Batch completed!' : '💪 Keep going!'}`
        });

      } else if (batch.status === 'completed') {
        // COMPLETED: Show completion info
        await interaction.editReply({
          content: `📊 **Batch: ${batch.name}**\n\n` +
            `✅ **Status:** Completed\n` +
            `📅 **Start Date:** ${batch.startDate}\n` +
            `📅 **End Date:** ${batch.endDate}\n` +
            `👥 **Participants:** ${batchUsers.length}\n\n` +
            `🎉 All 66 days completed!\n` +
            `Use \`/batch start <name>\` to create a new batch.`
        });
      }

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
