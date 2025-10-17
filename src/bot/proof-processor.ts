import { Message } from 'discord.js';
import { NotionClient } from '../notion/client';
import { Habit, User } from '../types';
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

    const authorNames = this.getAuthorNameCandidates(message);
    const nameWithWebhook = authorNames.find(name => this.hasWebhookKeyword(name));
    const isWebhookMessage = Boolean(message.webhookId) || Boolean(nameWithWebhook);

    console.log('🔍 PROOF_PROCESSOR: Processing message:', {
      author: message.author.username,
      bot: message.author.bot,
      webhookId: message.webhookId,
      isWebhookMessage: isWebhookMessage,
      authorNames: authorNames,
      nameWithWebhook: nameWithWebhook,
      content: message.content.substring(0, 50)
    });

    if (!isWebhookMessage && message.author.bot) {
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
      let resolvedUser: User | undefined;

      if (isWebhookMessage) {
        console.log('🔍 PROOF_PROCESSOR: Resolving webhook user...', {
          authorNames: authorNames
        });
        
        const resolution = await this.resolveWebhookUser(authorNames);
        console.log('🔍 PROOF_PROCESSOR: Webhook user resolution result:', {
          user: resolution.user?.name || 'null',
          fragment: resolution.fragment,
          conflicts: resolution.conflicts
        });
        
        if (!resolution.user) {
          const fragmentText = resolution.fragment ? ` ("${resolution.fragment}")` : '';
          const conflictText = resolution.conflicts.length > 0
            ? ` Possible matches: ${resolution.conflicts.join(', ')}.`
            : '';
          console.log('❌ PROOF_PROCESSOR: Webhook user resolution failed');
          await message.reply(`I could not match this webhook${fragmentText} to a Notion user.${conflictText} Please update the webhook name to include your Notion profile name.`);
          return;
        }
        resolvedUser = resolution.user;
        console.log('✅ PROOF_PROCESSOR: Webhook user resolved:', resolvedUser.name);
      }

      await this.processMessage(message, resolvedUser);
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

  private async processMessage(message: Message, userOverride?: User) {
    const user = userOverride ?? await this.notion.getUserByDiscordId(message.author.id);
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

    // Get weekly frequency count AFTER proof creation
    const frequencyCount = await this.notion.getWeeklyFrequencyCount(user.id, habit.id);
    console.log(`📊 Weekly frequency: ${frequencyCount.current}/${frequencyCount.target}`);

    // Determine emoji based on proof type
    const emoji = classification.isMinimalDose ? '⭐' : classification.isCheatDay ? '🎯' : '✅';
    await message.react(emoji);

    // Send detailed confirmation message (same as message analyzer)
    const habitInfo = habit ? `\n• Habit: ${habit.name}` : '';
    const detailedMessage = `${emoji} **Proof Automatically Detected!**\n\n📊 **Details:**\n• Unit: ${unit}\n• Type: ${classification.isMinimalDose ? 'Minimal Dose' : classification.isCheatDay ? 'Cheat Day' : 'Full Proof'}${habitInfo}\n• This Week: ${frequencyCount.current}/${frequencyCount.target}\n• Saved to Notion ✅`;
    
    console.log('🔍 PROOF_PROCESSOR: Sending detailed message:', {
      messageId: message.id,
      isWebhook: Boolean(message.webhookId),
      author: message.author.username,
      detailedMessage: detailedMessage.substring(0, 100) + '...'
    });
    
    await message.reply({
      content: detailedMessage
    });
  }

  private matchHabit(habits: Habit[], habitName: string | undefined) {
    if (!habitName) {
      return null;
    }

    const normalized = habitName.trim().toLowerCase();
    return habits.find(habit => habit.name.trim().toLowerCase() === normalized) || null;
  }

  private getAuthorNameCandidates(message: Message): string[] {
    const names = new Set<string>();

    const member = message.member as any;
    if (member && typeof member.nickname === 'string') {
      const nickname = member.nickname.trim();
      if (nickname) {
        names.add(nickname);
      }
    }

    const author: any = message.author;
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

  private async resolveWebhookUser(authorNames: string[]): Promise<{ user: User | null; fragment: string | null; conflicts: string[] }> {
    if (authorNames.length === 0) {
      return { user: null, fragment: null, conflicts: [] };
    }

    const users = await this.notion.getAllUsers();
    if (!users || users.length === 0) {
      return { user: null, fragment: authorNames[0], conflicts: [] };
    }

    const prioritized = [
      ...authorNames.filter(name => this.hasWebhookKeyword(name)),
      ...authorNames.filter(name => !this.hasWebhookKeyword(name))
    ];

    let fallbackFragment: string | null = prioritized[0] ?? null;
    let fallbackConflicts: string[] = [];

    for (const candidate of prioritized) {
      const fragment = this.extractWebhookFragment(candidate);
      if (!fragment) {
        continue;
      }

      const match = this.matchUserByFragment(fragment, users);
      if (match.user) {
        return { user: match.user, fragment, conflicts: [] };
      }

      if (match.conflicts.length > 0) {
        fallbackFragment = fragment;
        fallbackConflicts = match.conflicts;
      } else if (fragment) {
        fallbackFragment = fragment;
      }
    }

    return { user: null, fragment: fallbackFragment, conflicts: fallbackConflicts };
  }

  private matchUserByFragment(fragment: string, users: User[]): { user: User | null; conflicts: string[] } {
    const normalizedFragment = this.normalizeName(fragment);
    if (!normalizedFragment || normalizedFragment.length < 2) {
      return { user: null, conflicts: [] };
    }

    const scored = users
      .map(user => {
        const normalizedName = this.normalizeName(user.name);
        if (!normalizedName) {
          return null;
        }

        let score = 0;
        if (normalizedName === normalizedFragment) {
          score = 4;
        } else if (normalizedName.startsWith(normalizedFragment)) {
          score = 3;
        } else if (normalizedName.includes(normalizedFragment)) {
          score = 2;
        } else if (normalizedFragment.includes(normalizedName)) {
          score = 1;
        }

        return score > 0 ? { user, score, normalizedName } : null;
      })
      .filter((entry): entry is { user: User; score: number; normalizedName: string } => entry !== null);

    if (scored.length === 0) {
      return { user: null, conflicts: [] };
    }

    scored.sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      return b.normalizedName.length - a.normalizedName.length;
    });

    const topScore = scored[0].score;
    const topMatches = scored.filter(entry => entry.score === topScore);

    if (topMatches.length === 1) {
      return { user: topMatches[0].user, conflicts: [] };
    }

    return { user: null, conflicts: topMatches.map(entry => entry.user.name) };
  }

  private extractWebhookFragment(rawName: string): string | null {
    if (!rawName) {
      return null;
    }

    const withoutKeyword = rawName.replace(/webhook/gi, ' ').trim();
    const base = withoutKeyword || rawName;
    const normalizedSpaces = base.replace(/\s+/g, ' ').trim();
    if (!normalizedSpaces) {
      return null;
    }

    const tokens = normalizedSpaces.split(/[\s_\-]+/).filter(Boolean);
    if (tokens.length === 0) {
      return normalizedSpaces;
    }

    tokens.sort((a, b) => b.length - a.length);
    return tokens[0] || normalizedSpaces;
  }

  private normalizeName(value: string): string {
    if (!value) {
      return '';
    }

    const trimmed = value.trim();
    if (!trimmed) {
      return '';
    }

    return trimmed
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '');
  }

  private hasWebhookKeyword(value: string): boolean {
    return value.toLowerCase().includes('webhook');
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
