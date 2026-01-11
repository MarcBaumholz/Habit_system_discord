import {
  ButtonInteraction,
  ModalSubmitInteraction,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder
} from 'discord.js';
import { NotionClient } from '../notion/client';

const REFLECTION_BUTTON_ID_PREFIX = 'weekly_reflection_start';
const REFLECTION_MODAL_ID_PREFIX = 'weekly_reflection_modal';

export class ReflectionFlowManager {
  private notion: NotionClient;

  constructor(notion: NotionClient) {
    this.notion = notion;
  }

  async handleButtonInteraction(interaction: ButtonInteraction): Promise<void> {
    if (!interaction.customId.startsWith(REFLECTION_BUTTON_ID_PREFIX)) {
      return;
    }

    const weekStartDate = this.extractWeekStartDate(interaction.customId, REFLECTION_BUTTON_ID_PREFIX);
    const modal = this.buildReflectionModal(weekStartDate);

    try {
      await interaction.showModal(modal);
    } catch (error) {
      console.error('Failed to show weekly reflection modal:', error);
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({
          content: '❌ Reflection form could not be opened. Please try again.',
          ephemeral: true
        });
      }
    }
  }

  async handleModalSubmit(interaction: ModalSubmitInteraction): Promise<void> {
    if (!interaction.customId.startsWith(REFLECTION_MODAL_ID_PREFIX)) {
      return;
    }

    try {
      await interaction.deferReply({ ephemeral: true });
      const discordId = interaction.user.id;
      const user = await this.notion.getUserByDiscordId(discordId);

      if (!user) {
        await interaction.editReply('Please use `/join` first to register in the system.');
        return;
      }

      const wins = interaction.fields.getTextInputValue('reflection_wins');
      const challenge = interaction.fields.getTextInputValue('reflection_challenge');
      const learning = interaction.fields.getTextInputValue('reflection_learning');
      const nextWeek = interaction.fields.getTextInputValue('reflection_next_week');

      const fallbackWeekInfo = this.notion.getCurrentWeekInfo();
      const parsedWeekStartDate = this.extractWeekStartDate(interaction.customId, REFLECTION_MODAL_ID_PREFIX);
      const weekStartDate = parsedWeekStartDate || fallbackWeekInfo.weekStart.toISOString().split('T')[0];
      const reflectionDate = new Date().toISOString().split('T')[0];
      const weekNumber = this.getISOWeekNumber(new Date(weekStartDate));

      const reflectionResponses = this.buildReflectionResponses({
        wins,
        challenge,
        learning,
        nextWeek
      });

      const existingWeek = await this.notion.getWeekByUserAndStartDate(user.id, weekStartDate);

      if (existingWeek) {
        await this.notion.updateWeekReflection(existingWeek.id, {
          reflectionResponses,
          reflectionCompleted: true,
          reflectionDate
        });
      } else {
        await this.notion.createWeek({
          userId: user.id,
          discordId: user.discordId,
          weekNum: weekNumber,
          startDate: weekStartDate,
          summary: '',
          score: 0,
          reflectionResponses,
          reflectionCompleted: true,
          reflectionDate
        });
      }

      const actionLabel = existingWeek ? 'Updated' : 'Saved';
      await interaction.editReply(
        `✅ **${actionLabel} weekly reflection**\n\n` +
        `**Your snapshot:**\n` +
        `• **Wins:** ${wins}\n` +
        `• **Challenge:** ${challenge}\n` +
        `• **Learning:** ${learning}\n` +
        `• **Next week:** ${nextWeek}`
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorDetails = error instanceof Error && error.stack ? error.stack : errorMessage;
      console.error('❌ Error handling weekly reflection modal submit:', errorDetails);
      
      // Log more details for debugging
      if (error instanceof Error) {
        console.error('Error name:', error.name);
        console.error('Error message:', error.message);
      }
      
      const userFriendlyMessage = '❌ Something went wrong while saving your reflection. Please try again.';
      if (interaction.deferred || interaction.replied) {
        await interaction.editReply(userFriendlyMessage);
      } else {
        await interaction.reply({
          content: userFriendlyMessage,
          ephemeral: true
        });
      }
    }
  }

  private buildReflectionResponses(data: {
    wins: string;
    challenge: string;
    learning: string;
    nextWeek: string;
  }): string {
    return [
      `Win: ${data.wins}`,
      `Obstacle: ${data.challenge}`,
      `Pattern: ${data.learning}`,
      `Next change: ${data.nextWeek}`
    ].join('\n');
  }

  private buildReflectionModal(weekStartDate?: string | null): ModalBuilder {
    const modalId = weekStartDate
      ? `${REFLECTION_MODAL_ID_PREFIX}_${weekStartDate}`
      : REFLECTION_MODAL_ID_PREFIX;

    const modal = new ModalBuilder()
      .setCustomId(modalId)
      .setTitle('Weekly Reflection');

    const winsInput = new TextInputBuilder()
      .setCustomId('reflection_wins')
      .setLabel('Biggest win worth repeating?')
      .setStyle(TextInputStyle.Paragraph)
      .setPlaceholder('Name the habit or moment that mattered most')
      .setRequired(true)
      .setMaxLength(1000);

    const challengeInput = new TextInputBuilder()
      .setCustomId('reflection_challenge')
      .setLabel('What got in the way most?')
      .setStyle(TextInputStyle.Paragraph)
      .setPlaceholder('Time, energy, environment, or plan (root cause)')
      .setRequired(true)
      .setMaxLength(1000);

    const learningInput = new TextInputBuilder()
      .setCustomId('reflection_learning')
      .setLabel('What pattern did you notice?')
      .setStyle(TextInputStyle.Paragraph)
      .setPlaceholder('Trigger, time of day, or routine link')
      .setRequired(true)
      .setMaxLength(1000);

    const nextWeekInput = new TextInputBuilder()
      .setCustomId('reflection_next_week')
      .setLabel('One specific change for next week?')
      .setStyle(TextInputStyle.Paragraph)
      .setPlaceholder('If X happens, I will do Y')
      .setRequired(true)
      .setMaxLength(1000);

    modal.addComponents(
      new ActionRowBuilder<TextInputBuilder>().addComponents(winsInput),
      new ActionRowBuilder<TextInputBuilder>().addComponents(challengeInput),
      new ActionRowBuilder<TextInputBuilder>().addComponents(learningInput),
      new ActionRowBuilder<TextInputBuilder>().addComponents(nextWeekInput)
    );

    return modal;
  }

  private extractWeekStartDate(customId: string, prefix: string): string | null {
    if (!customId.startsWith(prefix)) {
      return null;
    }
    const parts = customId.split('_');
    if (parts.length < 4) {
      return null;
    }
    const datePart = parts.slice(3).join('_');
    return datePart || null;
  }

  private getISOWeekNumber(date: Date): number {
    const target = new Date(date.valueOf());
    const dayNr = (date.getDay() + 6) % 7;
    target.setDate(target.getDate() - dayNr + 3);
    const firstThursday = target.valueOf();
    target.setMonth(0, 1);
    if (target.getDay() !== 4) {
      target.setMonth(0, 1 + ((4 - target.getDay()) + 7) % 7);
    }
    return 1 + Math.ceil((firstThursday - target.valueOf()) / 604800000);
  }
}
