import { Message } from 'discord.js';
import { NotionClient } from '../notion/client';
import { Habit } from '../types';

interface ProofClassification {
  habitName: string;
  unit: string;
  note: string;
  isMinimalDose: boolean;
  isCheatDay: boolean;
}

export class ProofProcessor {
  private notion: NotionClient;
  private accountabilityChannelId: string | undefined;
  private openRouterApiKey: string | undefined;
  private model: string;
  private warnedMissingConfig = false;
  private inFlightMessages: Set<string> = new Set();

  constructor(notion: NotionClient) {
    this.notion = notion;
    this.accountabilityChannelId = process.env.DISCORD_ACCOUNTABILITY_GROUP;
    this.openRouterApiKey = process.env.OPENROUTER_API_KEY;
    this.model = process.env.OPENROUTER_MODEL || 'deepseek/deepseek-chat-v3.1:free';
  }

  async handleAccountabilityMessage(message: Message) {
    if (!this.accountabilityChannelId || message.channelId !== this.accountabilityChannelId) {
      return;
    }

    if (message.author.bot) {
      return;
    }

    if (!this.openRouterApiKey) {
      this.warnMissingConfig('OPENROUTER_API_KEY');
      return;
    }

    if (this.inFlightMessages.has(message.id)) {
      return;
    }

    this.inFlightMessages.add(message.id);

    try {
      await this.processMessage(message);
    } catch (error) {
      console.error('Failed to process accountability proof:', error);
      try {
        await message.react('⚠️');
      } catch (reactError) {
        console.error('Failed to react to message after error:', reactError);
      }
    } finally {
      this.inFlightMessages.delete(message.id);
    }
  }

  private async processMessage(message: Message) {
    const user = await this.notion.getUserByDiscordId(message.author.id);
    if (!user) {
      await message.reply('Please use `/join` first so I can link your proofs to your profile.');
      return;
    }

    const habits = await this.notion.getHabitsByUserId(user.id);
    if (!habits || habits.length === 0) {
      await message.reply('I could not find any habits yet. Create one with `KeystoneHabit` or `/habit add` first.');
      return;
    }

    const attachments = Array.from(message.attachments.values()).map(att => ({
      name: att.name,
      url: att.url,
      contentType: att.contentType
    }));

    const classification = await this.classifyProof(message.content, habits, attachments);
    if (!classification) {
      await message.reply('I could not classify this proof automatically. Please mention the habit explicitly or use `/proof` manually.');
      return;
    }

    const habit = this.matchHabit(habits, classification.habitName);
    if (!habit) {
      await message.reply('I could not match this proof to one of your habits. Please double-check the name or use `/proof` manually.');
      return;
    }

    const attachmentUrl = attachments[0]?.url;
    const unit = classification.unit?.trim() || '1x';
    const note = classification.note?.trim() || message.content.trim();

    await this.notion.createProof({
      userId: user.id,
      habitId: habit.id,
      date: new Date(message.createdAt).toISOString().split('T')[0],
      unit,
      note,
      attachmentUrl,
      isMinimalDose: classification.isMinimalDose,
      isCheatDay: classification.isCheatDay
    });

    await message.react('✅');
  }

  private matchHabit(habits: Habit[], habitName: string | undefined) {
    if (!habitName) {
      return null;
    }

    const normalized = habitName.trim().toLowerCase();
    return habits.find(habit => habit.name.trim().toLowerCase() === normalized) || null;
  }

  private async classifyProof(
    messageContent: string,
    habits: Habit[],
    attachments: Array<{ name: string | null; url: string; contentType: string | null }>
  ): Promise<ProofClassification | null> {
    if (!messageContent && attachments.length === 0) {
      return null;
    }

    const habitDescriptions = habits.map((habit, index) => `Habit ${index + 1}: ${habit.name}\n- Domains: ${habit.domains.join(', ') || 'n/a'}\n- Context: ${habit.context}\n- Minimal Dose: ${habit.minimalDose}\n- Why: ${habit.why}`).join('\n\n');

    const attachmentDescriptions = attachments.length > 0
      ? attachments.map(att => `${att.name || 'attachment'} (${att.contentType || 'unknown type'}): ${att.url}`).join('\n')
      : 'Keine Anhänge';

    const prompt = `Du bist ein Assistent, der Gewohnheits-Proofs klassifiziert.\n\nVerfügbare Habits:\n${habitDescriptions}\n\nDiscord Nachricht:\n${messageContent || '(leer)'}\n\nAnhänge:\n${attachmentDescriptions}\n\nAnalysiere sorgfältig und gib eine JSON-Antwort mit folgendem Format zurück:\n{\n  "habitName": string // exakter Name aus der Liste oder "unknown"\n  "unit": string // z.B. "30 min", "5 km" oder "1x"\n  "note": string // kurze Zusammenfassung in max. 140 Zeichen\n  "isMinimalDose": boolean\n  "isCheatDay": boolean\n}\n\nNutze "unknown", wenn keine Habit passt. Verwende nur gültiges JSON ohne Zusatztext.`;

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.openRouterApiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://habit-system.local',
        'X-Title': 'Discord Habit System'
      },
      body: JSON.stringify({
        model: this.model,
        messages: [
          { role: 'system', content: 'Du antwortest ausschließlich mit validem JSON.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0
      })
    });

    if (!response.ok) {
      console.error('OpenRouter API error:', await response.text());
      return null;
    }

    const data = await response.json();
    const rawContent = data?.choices?.[0]?.message?.content;
    if (!rawContent || typeof rawContent !== 'string') {
      return null;
    }

    try {
      const parsed = JSON.parse(rawContent) as ProofClassification;
      if (!parsed || typeof parsed !== 'object') {
        return null;
      }

      return {
        habitName: parsed.habitName,
        unit: parsed.unit,
        note: parsed.note,
        isMinimalDose: Boolean(parsed.isMinimalDose),
        isCheatDay: Boolean(parsed.isCheatDay)
      };
    } catch (error) {
      console.error('Failed to parse OpenRouter response:', error, rawContent);
      return null;
    }
  }

  private warnMissingConfig(key: string) {
    if (this.warnedMissingConfig) {
      return;
    }
    console.warn(`Missing required configuration: ${key}. Automatic proof processing disabled.`);
    this.warnedMissingConfig = true;
  }
}
