import { Message, TextBasedChannel, TextChannel } from 'discord.js';
import { NotionClient } from '../notion/client';
import { Habit, User } from '../types';

interface HabitQuestion {
  key: HabitFieldKey;
  prompt: string;
  transform?: (input: string) => string | string[] | number;
}

type HabitFieldKey = Exclude<keyof Habit, 'id' | 'userId'>;

type HabitAnswers = Partial<Omit<Habit, 'id'>> & { userId: string };

interface HabitFlowState {
  user: User;
  answers: HabitAnswers;
  questionIndex: number;
}

type SendableChannel = TextBasedChannel & { send: TextChannel['send'] };

export class HabitFlowManager {
  private notion: NotionClient;
  private activeFlows: Map<string, HabitFlowState> = new Map();

  private static QUESTIONS: HabitQuestion[] = [
    {
      key: 'name',
      prompt: 'Let\'s define your keystone habit. What do you want to call this habit?'
    },
    {
      key: 'domains',
      prompt: 'Which life domains does this habit impact? Please list them separated by commas.',
      transform: (input: string) =>
        input
          .split(',')
          .map(domain => domain.trim())
          .filter(Boolean)
    },
    {
      key: 'frequency',
      prompt: 'How many days per week will you do this habit? (1-7)',
      transform: (input: string) => {
        const n = parseInt(input.replace(/[^0-9]/g, ''), 10);
        if (Number.isNaN(n) || n < 1) return 1;
        if (n > 7) return 7;
        return n;
      }
    },
    {
      key: 'context',
      prompt: 'When and where will you do it? Describe the context for this habit.'
    },
    {
      key: 'difficulty',
      prompt: 'How difficult does this habit feel right now? (easy, medium, hard)'
    },
    {
      key: 'smartGoal',
      prompt: 'What is the SMART goal for this habit? (Specific, Measurable, Achievable, Relevant, Time-bound)'
    },
    {
      key: 'why',
      prompt: 'Why is this habit important for you right now?'
    },
    {
      key: 'minimalDose',
      prompt: 'What\'s the minimal dose you commit to on tough days?'
    },
    {
      key: 'habitLoop',
      prompt: 'Describe the habit loop: cue → routine → reward.'
    },
    {
      key: 'implementationIntentions',
      prompt: 'List your implementation intentions. (If situation X happens, I will do Y.)'
    },
    {
      key: 'hurdles',
      prompt: 'What hurdles might get in the way of staying consistent?'
    },
    {
      key: 'reminderType',
      prompt: 'How do you want to be reminded about this habit?'
    }
  ];

  constructor(notion: NotionClient) {
    this.notion = notion;
  }

  async handleMessage(message: Message): Promise<boolean> {
    if (message.author.bot) {
      return false;
    }

    // Check if this is a personal channel (starts with "personal-")
    const channel = message.channel;
    if (!channel || !('name' in channel) || !channel.name || !channel.name.startsWith('personal-')) {
      return false;
    }

    const existingFlow = this.activeFlows.get(message.author.id);

    if (existingFlow) {
      await this.recordAnswer(existingFlow, message);
      return true;
    }

    const content = message.content.trim();
    if (content.length === 0) {
      return false;
    }

    if (this.matchesTrigger(content)) {
      await this.startFlow(message);
      return true;
    }

    return false;
  }

  private matchesTrigger(content: string): boolean {
    return content.toLowerCase() === 'keystonehabit';
  }

  private async startFlow(message: Message) {
    const channel = this.getTextChannel(message);
    if (!channel) {
      return;
    }

    const user = await this.fetchOrNotifyUser(message, channel);
    if (!user) {
      return;
    }

    if (this.activeFlows.has(message.author.id)) {
      await channel.send('You already have an active keystone habit flow. Answer the current question or say "cancel" to start over.');
      return;
    }

    await channel.send(`🔥 **Keystone Habit Builder**

Habits compound small actions into big outcomes. Defining a clear keystone habit helps you:
• Focus on what really moves the needle
• Stay accountable to your group
• Build momentum for the full 66-day challenge

We\'ll walk through a few questions together to set up your habit with intention.`);

    const state: HabitFlowState = {
      user,
      answers: {
        userId: user.id
      },
      questionIndex: 0
    };

    this.activeFlows.set(message.author.id, state);
    await this.askCurrentQuestion(channel, message.author.id);
  }

  private async recordAnswer(state: HabitFlowState, message: Message) {
    const currentQuestion = HabitFlowManager.QUESTIONS[state.questionIndex];
    const input = message.content.trim();
    const channel = this.getTextChannel(message);
    if (!channel) {
      return;
    }

    if (input.toLowerCase() === 'cancel') {
      this.activeFlows.delete(message.author.id);
      await channel.send('Keystone habit flow cancelled. Send `KeystoneHabit` whenever you want to start again.');
      return;
    }

    if (!currentQuestion) {
      return;
    }

    const transformed = currentQuestion.transform ? currentQuestion.transform(input) : input;
    state.answers[currentQuestion.key] = transformed as any;
    state.questionIndex += 1;

    if (state.questionIndex >= HabitFlowManager.QUESTIONS.length) {
      await this.completeFlow(channel, message.author.id);
      return;
    }

    await this.askCurrentQuestion(channel, message.author.id);
  }

  private async askCurrentQuestion(channel: SendableChannel, userId: string) {
    const state = this.activeFlows.get(userId);
    if (!state) {
      return;
    }

    const question = HabitFlowManager.QUESTIONS[state.questionIndex];
    if (!question) {
      return;
    }

    await channel.send(`❓ ${question.prompt}`);
  }

  private async completeFlow(channel: SendableChannel, userId: string) {
    const state = this.activeFlows.get(userId);
    if (!state) {
      return;
    }

    try {
      const habitPayload = this.buildHabitPayload(state);
      const habit = await this.notion.createHabit(habitPayload);

      console.log('✅ Keystone habit created via flow:', habit.id);

      await channel.send('🎉 Thanks for integrating your keystone habit! It\'s now saved and ready to track. Use `/proof` when you take action.');
    } catch (error) {
      console.error('Failed to save keystone habit:', error);
      await channel.send('⚠️ Something went wrong while saving your habit. Please try again or reach out for support.');
    } finally {
      this.activeFlows.delete(userId);
    }
  }

  private buildHabitPayload(state: HabitFlowState): Omit<Habit, 'id'> {
    const missing = HabitFlowManager.QUESTIONS
      .map(question => question.key)
      .filter(key => state.answers[key] === undefined);

    if (missing.length > 0) {
      throw new Error(`Missing habit fields: ${missing.join(', ')}`);
    }

    return {
      userId: state.answers.userId,
      name: state.answers.name as string,
      domains: (state.answers.domains as string[]) || [],
      frequency: (state.answers.frequency as number) ?? 1,
      context: state.answers.context as string,
      difficulty: state.answers.difficulty as string,
      smartGoal: state.answers.smartGoal as string,
      why: state.answers.why as string,
      minimalDose: state.answers.minimalDose as string,
      habitLoop: state.answers.habitLoop as string,
      implementationIntentions: state.answers.implementationIntentions as string,
      hurdles: state.answers.hurdles as string,
      reminderType: state.answers.reminderType as string
    };
  }

  private getTextChannel(message: Message): SendableChannel | null {
    const channel = message.channel;
    if (!channel.isTextBased()) {
      return null;
    }

    if (!('send' in channel) || typeof channel.send !== 'function') {
      return null;
    }

    return channel as SendableChannel;
  }

  private async fetchOrNotifyUser(message: Message, channel: SendableChannel): Promise<User | null> {
    try {
      const existingUser = await this.notion.getUserByDiscordId(message.author.id);
      if (existingUser) {
        return existingUser;
      }

      await channel.send('Please use `/join` first so we can link your Discord account to Notion. Then send `KeystoneHabit` to restart this flow.');
      return null;
    } catch (error) {
      console.error('Failed to fetch user for keystone habit flow:', error);
      await channel.send('⚠️ I couldn\'t verify your account right now. Please try again in a moment.');
      return null;
    }
  }

  // Removed ensureChannelConfigured - now works dynamically with all personal channels
}
