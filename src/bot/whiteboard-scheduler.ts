import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  TextChannel
} from 'discord.js';
import { Client } from 'discord.js';
import * as cron from 'node-cron';
import { NotionClient } from '../notion/client';
import { DiscordLogger } from './discord-logger';
import { formatLocalDate } from '../utils/date-utils';
import {
  startWhiteboardCycle,
  getCurrentWhiteboardCycle,
  closeCurrentWhiteboardCycle
} from '../utils/whiteboard-store';
import { WhiteboardCycle } from '../types';

const SUNDAY_CRON = '30 20 * * 0';
const MONDAY_CRON = '0 6 * * 1';

const CATEGORY_LABELS: Record<string, string> = {
  win: 'Wins',
  learning: 'Learnings',
  hurdle: 'Hürden',
  question: 'Fragen & Blocker',
  insight: 'Insights',
  other: 'Sonstiges'
};

export class WhiteboardScheduler {
  private client: Client;
  private notion: NotionClient;
  private logger: DiscordLogger;
  private accountabilityChannelId: string;
  private timezone: string;

  constructor(client: Client, notion: NotionClient, logger: DiscordLogger) {
    this.client = client;
    this.notion = notion;
    this.logger = logger;
    this.accountabilityChannelId = process.env.DISCORD_ACCOUNTABILITY_GROUP || '';
    this.timezone = process.env.TIMEZONE || 'Europe/Berlin';
  }

  /** Call this to post the whiteboard immediately (e.g. for manual testing). */
  async postWhiteboardNow(): Promise<void> {
    await this.postWhiteboard();
  }

  startScheduler(): void {
    cron.schedule(SUNDAY_CRON, async () => {
      try {
        await this.logger.info(
          'WHITEBOARD_SCHEDULER',
          'Weekly Whiteboard Posted',
          'Posting reflection whiteboard for the week',
          { cronExpression: SUNDAY_CRON, timezone: this.timezone }
        );
        await this.postWhiteboard();
      } catch (error) {
        await this.logger.logError(
          error as Error,
          'Whiteboard Scheduler Error',
          { cronExpression: SUNDAY_CRON }
        );
        console.error('❌ Error posting reflection whiteboard:', error);
      }
    }, {
      scheduled: true,
      timezone: this.timezone
    });

    cron.schedule(MONDAY_CRON, async () => {
      try {
        await this.logger.info(
          'WHITEBOARD_SCHEDULER',
          'Weekly Whiteboard Closed',
          'Closing reflection whiteboard',
          { cronExpression: MONDAY_CRON, timezone: this.timezone }
        );
        await this.closeWhiteboard();
      } catch (error) {
        await this.logger.logError(
          error as Error,
          'Whiteboard Closing Error',
          { cronExpression: MONDAY_CRON }
        );
        console.error('❌ Error closing reflection whiteboard:', error);
      }
    }, {
      scheduled: true,
      timezone: this.timezone
    });

    console.log(`🪞 Reflection whiteboard scheduler started (Sun ${SUNDAY_CRON}, Mon ${MONDAY_CRON})`);
  }

  private async postWhiteboard(): Promise<void> {
    const channel = await this.fetchAccountabilityChannel();
    if (!channel) {
      return;
    }

    const weekStart = formatLocalDate(this.notion.getCurrentWeekInfo().weekStart);

    const embed = new EmbedBuilder()
      .setTitle('🪞 Weekly Reflection Whiteboard')
      .setDescription('Das Whiteboard ist offen. Trage Learnings, Hürden oder Wins bis Montag 06:00 Uhr ein.')
      .addFields(
        { name: '🕒 Zeitfenster', value: 'Sonntag 20:30 Uhr bis Montag 06:00 Uhr', inline: true },
        { name: '✍️ Anleitung', value: 'Drücke „Add to Whiteboard“, wähle den Typ und beschreibe deine Erkenntnis.', inline: false }
      )
      .setFooter({ text: 'Die Einträge werden automatisch gespeichert und am Montag Morgen zusammengefasst.' });

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(`whiteboard_add_entry_${weekStart}`)
        .setLabel('Add to Whiteboard')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId(`whiteboard_view_entries_${weekStart}`)
        .setLabel('View Entries')
        .setStyle(ButtonStyle.Secondary)
    );

    const message = await channel.send({
      embeds: [embed],
      components: [row]
    });

    await startWhiteboardCycle(weekStart, message.id, channel.id);
    console.log(`✅ Whiteboard message posted for week ${weekStart}`);
  }

  private async closeWhiteboard(): Promise<void> {
    const cycle = await getCurrentWhiteboardCycle();
    if (!cycle) {
      console.log('ℹ️ No active whiteboard to close.');
      return;
    }

    const channel = await this.fetchAccountabilityChannel();
    if (!channel) {
      return;
    }

    const summaryEmbed = this.buildSummaryEmbed(cycle);
    await channel.send({
      content: '🔒 Whiteboard geschlossen – hier der schnelle Überblick:',
      embeds: [summaryEmbed]
    });

    await this.disableBoardMessage(cycle);

    await closeCurrentWhiteboardCycle();
    console.log(`✅ Whiteboard cycle for ${cycle.weekStart} closed.`);
  }

  private buildSummaryEmbed(cycle: WhiteboardCycle): EmbedBuilder {
    const embed = new EmbedBuilder()
      .setTitle('🪞 Weekly Reflection Whiteboard — Zusammenfassung')
      .setDescription(
        `Week start: ${cycle.weekStart}\n` +
        `Einträge: ${cycle.entries.length}\n` +
        'Danke an alle Beiträge! Die Learnings bleiben im System.'
      )
      .setFooter({ text: 'Die nächste Runde startet wieder am Sonntag' })
      .setColor(0x00b8d9);

    const grouped = cycle.entries.reduce<Record<string, number>>((acc, entry) => {
      acc[entry.category] = (acc[entry.category] || 0) + 1;
      return acc;
    }, {});

    Object.entries(grouped).forEach(([category, count]) => {
      const label = CATEGORY_LABELS[category] || category;
      embed.addFields({ name: `• ${label}`, value: `${count} Einträge`, inline: true });
    });

    if (cycle.entries.length === 0) {
      embed.addFields({ name: 'Status', value: 'Kein Beitrag diese Woche', inline: false });
    }

    return embed;
  }

  private async disableBoardMessage(cycle: WhiteboardCycle): Promise<void> {
    if (!cycle.messageId || !cycle.channelId) {
      return;
    }

    try {
      const channel = await this.client.channels.fetch(cycle.channelId);
      if (!channel || !channel.isTextBased()) {
        return;
      }

      const fetchedMessage = await (channel as TextChannel).messages.fetch(cycle.messageId);
      if (!fetchedMessage) {
        return;
      }

      const disabledRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId(`whiteboard_add_entry_${cycle.weekStart}`)
          .setLabel('Add to Whiteboard')
          .setStyle(ButtonStyle.Primary)
          .setDisabled(true),
        new ButtonBuilder()
          .setCustomId(`whiteboard_view_entries_${cycle.weekStart}`)
          .setLabel('View Entries')
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(true)
      );

      const embed = new EmbedBuilder()
        .setTitle('🪞 Weekly Reflection Whiteboard — Geschlossen')
        .setDescription('Die Einträge sind sicher gespeichert. Der nächste Round startet Sonntag 20:30 Uhr.')
        .setColor(0xffa500);

      await fetchedMessage.edit({
        embeds: [embed],
        components: [disabledRow]
      });
    } catch (error) {
      console.error('❌ Failed to disable whiteboard message:', error);
    }
  }

  private async fetchAccountabilityChannel(): Promise<TextChannel | null> {
    if (!this.accountabilityChannelId) {
      console.error('❌ DISCORD_ACCOUNTABILITY_GROUP is not configured.');
      return null;
    }

    const channel = await this.client.channels.fetch(this.accountabilityChannelId);
    if (!channel || !channel.isTextBased()) {
      console.error('❌ Could not fetch accountability channel for whiteboard.');
      return null;
    }

    return channel as TextChannel;
  }
}
