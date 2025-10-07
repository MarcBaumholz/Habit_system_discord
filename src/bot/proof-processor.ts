import { Message } from 'discord.js';
import { NotionClient } from '../notion/client';
import { Habit } from '../types';
import axios from 'axios';

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
  private perplexityApiKey: string | undefined;
  private warnedMissingConfig = false;
  private inFlightMessages: Set<string> = new Set();

  constructor(notion: NotionClient) {
    this.notion = notion;
    this.accountabilityChannelId = process.env.DISCORD_ACCOUNTABILITY_GROUP;
    this.perplexityApiKey = process.env.PERPLEXITY_API_KEY;
  }

  async handleAccountabilityMessage(message: Message) {
    if (!this.accountabilityChannelId || message.channelId !== this.accountabilityChannelId) {
      return;
    }

    if (message.author.bot) {
      return;
    }

    if (!this.perplexityApiKey) {
      this.warnMissingConfig('PERPLEXITY_API_KEY');
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

    const proof = await this.notion.createProof({
      userId: user.id,
      habitId: habit.id,
      date: new Date(message.createdAt).toISOString().split('T')[0],
      unit,
      note,
      attachmentUrl: undefined, // We'll pass this separately
      isMinimalDose: classification.isMinimalDose,
      isCheatDay: classification.isCheatDay
    }, attachmentUrl);

    console.log(`✅ Proof created via ProofProcessor: ${proof.id} for user ${user.name}`);

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

    const prompt = `Du bist ein Experte für Gewohnheits-Proofs mit KI-gestützter semantischer Analyse.\n\nVerfügbare Habits:\n${habitDescriptions}\n\nDiscord Nachricht:\n${messageContent || '(leer)'}\n\nAnhänge:\n${attachmentDescriptions}\n\nANALYSE-ANWEISUNGEN:\n1. Analysiere JEDES Wort in der Nachricht auf semantische Bedeutung\n2. Berücksichtige Synonyme, verwandte Aktivitäten und Kontext\n3. Suche nach indirekten Referenzen (z.B. "gespielt" könnte Musik, Sport oder Spiele bedeuten)\n4. Berücksichtige Zeitangaben, Intensität und Aktivitätstyp\n5. Verwende semantisches Verständnis für bessere Zuordnung\n\nGib eine JSON-Antwort mit folgendem Format zurück:\n{\n  "habitName": string // exakter Name aus der Liste oder "unknown"\n  "unit": string // z.B. "30 min", "5 km" oder "1x"\n  "note": string // kurze Zusammenfassung in max. 140 Zeichen\n  "isMinimalDose": boolean\n  "isCheatDay": boolean\n}\n\nWICHTIG: \n- Nutze "unknown", wenn keine Habit passt\n- Verwende nur gültiges JSON ohne Zusatztext\n- Sei besonders vorsichtig bei Musik-Instrumenten wie Gitarre - diese sollten nur Musik-Habits zugeordnet werden, nicht Meditation\n- Analysiere Synonyme und verwandte Begriffe für bessere Zuordnung\n- Berücksichtige Kontext und Intention der Nachricht`;

    if (!this.perplexityApiKey) {
      console.error('Perplexity API key not configured');
      return null;
    }

    try {
      const response = await axios.post('https://api.perplexity.ai/chat/completions', {
        model: 'sonar',
        messages: [
          { role: 'system', content: 'Du antwortest ausschließlich mit validem JSON.' },
          { role: 'user', content: prompt }
        ]
      }, {
        headers: {
          'Authorization': `Bearer ${this.perplexityApiKey}`,
          'Content-Type': 'application/json'
        }
      });

      const rawContent = response.data.choices[0].message.content;
      if (!rawContent || typeof rawContent !== 'string') {
        return null;
      }

      // Clean the response - remove markdown code blocks if present
      let cleanContent = rawContent.trim();
      if (cleanContent.startsWith('```json')) {
        cleanContent = cleanContent.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (cleanContent.startsWith('```')) {
        cleanContent = cleanContent.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }

      try {
        const parsed = JSON.parse(cleanContent) as ProofClassification;
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
        console.error('Failed to parse Perplexity response:', error, rawContent);
        return null;
      }
    } catch (error) {
      console.error('Perplexity API error:', error);
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
