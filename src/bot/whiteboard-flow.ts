import {
  ButtonInteraction,
  ModalBuilder,
  ModalSubmitInteraction,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder
} from 'discord.js';
import { NotionClient } from '../notion/client';
import { DiscordLogger } from './discord-logger';
import { WhiteboardEntry, WhiteboardCategory } from '../types';
import { formatLocalDate } from '../utils/date-utils';
import { addWhiteboardEntry, getEntriesForWeek } from '../utils/whiteboard-store';

const BUTTON_PREFIX = 'whiteboard_add_entry';
const VIEW_PREFIX = 'whiteboard_view_entries';
const MODAL_PREFIX = 'whiteboard_modal';

const CATEGORY_LABELS: Record<WhiteboardCategory, string> = {
  win: 'Win / Highlight',
  learning: 'Learning / Insight',
  hurdle: 'Hürde / Challenge',
  question: 'Frage / Blocker',
  insight: 'Pattern / Insight',
  other: 'Sonstiges'
};

const CATEGORY_ALIASES: Record<string, WhiteboardCategory> = {
  win: 'win',
  wins: 'win',
  highlight: 'win',
  learning: 'learning',
  insight: 'learning',
  lesson: 'learning',
  hurdle: 'hurdle',
  obstacle: 'hurdle',
  challenge: 'hurdle',
  question: 'question',
  blocker: 'question',
  doubt: 'question',
  idea: 'other',
  other: 'other',
  thoughts: 'other'
};

export class WhiteboardFlowManager {
  private notion: NotionClient;
  private logger: DiscordLogger;

  constructor(notion: NotionClient, logger: DiscordLogger) {
    this.notion = notion;
    this.logger = logger;
  }

  async handleButtonInteraction(interaction: ButtonInteraction): Promise<void> {
    try {
      console.log('🧩 Whiteboard button clicked:', {
        customId: interaction.customId,
        userId: interaction.user?.id,
        channelId: interaction.channelId
      });
      if (interaction.customId.startsWith(BUTTON_PREFIX)) {
        const weekStart = this.extractWeekStart(interaction.customId, BUTTON_PREFIX);
        console.log('🪞 Opening whiteboard modal:', { weekStart });
        await interaction.showModal(this.buildWhiteboardModal(weekStart));
        return;
      }

      if (interaction.customId.startsWith(VIEW_PREFIX)) {
        const weekStart = this.extractWeekStart(interaction.customId, VIEW_PREFIX)
          || formatLocalDate(this.notion.getCurrentWeekInfo().weekStart);
        console.log('🪞 Sending whiteboard entries summary:', { weekStart });
        const entries = await getEntriesForWeek(weekStart);
        const summary = this.buildEntriesSummary(entries);
        await interaction.reply({ content: summary, ephemeral: true });
        return;
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      console.error('❌ Whiteboard button handler error:', err.message, err.stack);
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({
          content: '❌ Das Whiteboard konnte gerade nicht geöffnet werden. Bitte versuche es in Kürze erneut. (Hinweis: Der Haupt-Bot muss laufen, damit die Buttons funktionieren.)',
          ephemeral: true
        }).catch((e) => console.error('Whiteboard fallback reply failed:', e));
      }
    }
  }

  async handleModalSubmit(interaction: ModalSubmitInteraction): Promise<void> {
    if (!interaction.customId.startsWith(MODAL_PREFIX)) {
      return;
    }

    await interaction.deferReply({ ephemeral: true });
    try {
      const weekStart = this.extractWeekStart(interaction.customId, MODAL_PREFIX)
        || formatLocalDate(this.notion.getCurrentWeekInfo().weekStart);
      console.log('🪞 Whiteboard modal submit:', {
        weekStart,
        userId: interaction.user?.id,
        username: interaction.user?.username
      });

      const categoryInput = interaction.fields.getTextInputValue('whiteboard_category');
      const text = interaction.fields.getTextInputValue('whiteboard_text');
      const category = this.normalizeCategory(categoryInput);

      const user = await this.notion.getUserByDiscordId(interaction.user.id);

      const entry: WhiteboardEntry = {
        userId: user?.id,
        discordId: interaction.user.id,
        username: interaction.user.username,
        weekStart,
        category,
        categoryLabel: CATEGORY_LABELS[category],
        text: text.trim(),
        timestamp: new Date().toISOString()
      };

      await addWhiteboardEntry(entry);

      await this.logger.success(
        'WHITEBOARD',
        'Entry Saved',
        `Saved whiteboard entry for ${entry.username}`,
        {
          userId: entry.userId,
          discordId: entry.discordId,
          weekStart: entry.weekStart,
          category: entry.category
        }
      );

      await interaction.editReply(
        `✅ Deine ${CATEGORY_LABELS[category]}-Eintragung wurde gespeichert. ` +
        'Wir fassen alles am Montag 06:00 Uhr zusammen.'
      );
    } catch (error) {
      console.error('❌ Error saving whiteboard entry:', error);
      await interaction.editReply(
        '❌ Deine Eintragung konnte gerade nicht gespeichert werden. Bitte probiere es erneut.'
      );
    }
  }

  private buildWhiteboardModal(weekStart?: string | null): ModalBuilder {
    const customId = weekStart ? `${MODAL_PREFIX}_${weekStart}` : MODAL_PREFIX;

    const modal = new ModalBuilder()
      .setCustomId(customId)
      .setTitle('Accountability Whiteboard');

    const categoryInput = new TextInputBuilder()
      .setCustomId('whiteboard_category')
      .setLabel('Typ (win/learn/hurdle/q/insight/other)')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('learning')
      .setRequired(true);

    const textInput = new TextInputBuilder()
      .setCustomId('whiteboard_text')
      .setLabel('Dein Learning, Hürde oder Win')
      .setStyle(TextInputStyle.Paragraph)
      .setPlaceholder('Was ist passiert, was nahmst du mit?')
      .setRequired(true)
      .setMaxLength(1000);

    modal.addComponents(
      new ActionRowBuilder<TextInputBuilder>().addComponents(categoryInput),
      new ActionRowBuilder<TextInputBuilder>().addComponents(textInput)
    );

    return modal;
  }

  private buildEntriesSummary(entries: WhiteboardEntry[]): string {
    if (entries.length === 0) {
      return 'Das Whiteboard ist noch leer – du kannst als Erste:r etwas hinzufügen!';
    }

    const grouped: Record<WhiteboardCategory, WhiteboardEntry[]> = {
      win: [],
      learning: [],
      hurdle: [],
      question: [],
      insight: [],
      other: []
    };

    entries.forEach(entry => {
      grouped[entry.category]?.push(entry);
    });

    const order: WhiteboardCategory[] = ['learning', 'win', 'hurdle', 'insight', 'question', 'other'];
    const sections: string[] = [];

    for (const category of order) {
      const bucket = grouped[category];
      if (!bucket.length) {
        continue;
      }

      const snippet = bucket.slice(0, 4).map(entry => {
        return `- ${entry.username}: ${this.truncate(entry.text, 110)}`;
      });
      if (bucket.length > 4) {
        snippet.push(`… +${bucket.length - 4} weitere Einträge`);
      }

      sections.push(`**${CATEGORY_LABELS[category]} (${bucket.length})**\n${snippet.join('\n')}`);
    }

    return sections.join('\n\n');
  }

  private extractWeekStart(source: string, prefix: string): string | null {
    if (!source.startsWith(prefix)) {
      return null;
    }
    const trimmed = source.slice(prefix.length + 1);
    return trimmed || null;
  }

  private normalizeCategory(input: string): WhiteboardCategory {
    const cleaned = input.trim().toLowerCase();
    if (CATEGORY_ALIASES[cleaned]) {
      return CATEGORY_ALIASES[cleaned];
    }
    if (CATEGORY_LABELS[cleaned as WhiteboardCategory]) {
      return cleaned as WhiteboardCategory;
    }
    return 'other';
  }

  private truncate(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    return `${text.slice(0, maxLength - 1)}…`;
  }
}
