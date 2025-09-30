import { Client, Message, TextChannel } from 'discord.js';
import { NotionClient } from '../notion/client';
import { DiscordLogger } from './discord-logger';

export class PersonalAssistant {
  private client: Client;
  private notion: NotionClient;
  private logger: DiscordLogger;

  constructor(client: Client, notion: NotionClient, logger: DiscordLogger) {
    this.client = client;
    this.notion = notion;
    this.logger = logger;
  }

  async handlePersonalChannelMessage(message: Message): Promise<boolean> {
    // Only handle messages in personal channels
    const channel = message.channel;
    if (!channel || !('name' in channel) || !channel.name || !channel.name.startsWith('personal-')) {
      return false;
    }

    // Skip bot messages
    if (message.author.bot) {
      return false;
    }

    const content = message.content.toLowerCase().trim();

    // Handle different types of personal interactions
    if (this.isGreeting(content)) {
      await this.handleGreeting(message);
      return true;
    }

    if (this.isQuestion(content)) {
      await this.handleQuestion(message);
      return true;
    }

    if (this.isMoodCheck(content)) {
      await this.handleMoodCheck(message);
      return true;
    }

    if (this.isProgressUpdate(content)) {
      await this.handleProgressUpdate(message);
      return true;
    }

    return false;
  }

  private isGreeting(content: string): boolean {
    const greetings = ['hi', 'hello', 'hey', 'hallo', 'moin', 'guten tag', 'guten morgen', 'guten abend'];
    return greetings.some(greeting => content.includes(greeting));
  }

  private isQuestion(content: string): boolean {
    return content.includes('?') || 
           content.includes('wie') || 
           content.includes('was') || 
           content.includes('warum') || 
           content.includes('wann') || 
           content.includes('wo') || 
           content.includes('wer');
  }

  private isMoodCheck(content: string): boolean {
    const moodWords = ['müde', 'tired', 'motivation', 'energie', 'energy', 'schlecht', 'gut', 'gut', 'bad', 'stressed', 'gestresst'];
    return moodWords.some(word => content.includes(word));
  }

  private isProgressUpdate(content: string): boolean {
    const progressWords = ['fortschritt', 'progress', 'schwierig', 'difficult', 'einfach', 'easy', 'geschafft', 'done', 'erfolg', 'success'];
    return progressWords.some(word => content.includes(word));
  }

  private async handleGreeting(message: Message): Promise<void> {
    const channel = message.channel as TextChannel;
    
    const greetings = [
      `👋 Hallo ${message.author.username}! Wie geht es dir heute?`,
      `😊 Hey ${message.author.username}! Bereit für deine Gewohnheiten heute?`,
      `🚀 Hi ${message.author.username}! Lass uns an deinen Zielen arbeiten!`,
      `💪 Hallo ${message.author.username}! Wie läuft deine 66-Tage Challenge?`
    ];

    const randomGreeting = greetings[Math.floor(Math.random() * greetings.length)];
    
    await channel.send(randomGreeting);

    await this.logger.info(
      'PERSONAL_ASSISTANT',
      'Greeting Response',
      `Responded to greeting from ${message.author.username}`,
      {
        channelId: message.channelId,
        responseType: 'greeting'
      },
      {
        channelId: message.channelId,
        userId: message.author.id,
        guildId: message.guild?.id
      }
    );
  }

  private async handleQuestion(message: Message): Promise<void> {
    const channel = message.channel as TextChannel;
    
    const helpfulResponses = [
      `🤔 Das ist eine gute Frage! Ich kann dir bei deinen Gewohnheiten helfen. Schreibe \`keystonehabit\` um eine neue Gewohnheit anzulegen, oder teile deine Fortschritte mit mir!`,
      `💡 Ich bin hier um zu helfen! Du kannst mit \`/summary\` deine Wochenstatistiken sehen, oder \`keystonehabit\` schreiben um eine neue Gewohnheit zu definieren.`,
      `🎯 Gute Frage! Lass uns an deinen Zielen arbeiten. Schreibe \`keystonehabit\` wenn du eine neue Gewohnheit anlegen möchtest, oder teile einfach deine Gedanken mit mir!`
    ];

    const randomResponse = helpfulResponses[Math.floor(Math.random() * helpfulResponses.length)];
    
    await channel.send(randomResponse);

    await this.logger.info(
      'PERSONAL_ASSISTANT',
      'Question Response',
      `Responded to question from ${message.author.username}`,
      {
        channelId: message.channelId,
        responseType: 'question'
      },
      {
        channelId: message.channelId,
        userId: message.author.id,
        guildId: message.guild?.id
      }
    );
  }

  private async handleMoodCheck(message: Message): Promise<void> {
    const channel = message.channel as TextChannel;
    
    // Check if user mentioned being tired or lacking motivation
    if (message.content.toLowerCase().includes('müde') || message.content.toLowerCase().includes('tired')) {
      await channel.send(`😴 Ich verstehe, dass du müde bist. Denk daran: Auch eine kleine Aktion ist besser als keine! Was ist deine kleinste mögliche Gewohnheit für heute?`);
    } else if (message.content.toLowerCase().includes('motivation') || message.content.toLowerCase().includes('energie')) {
      await channel.send(`⚡ Motivation kommt und geht, aber Gewohnheiten bleiben! Konzentriere dich auf die kleinen Schritte. Du schaffst das! 💪`);
    } else {
      await channel.send(`💭 Es ist okay, verschiedene Emotionen zu haben. Gewohnheiten helfen uns durch alle Stimmungen hindurch. Wie geht es dir wirklich?`);
    }

    await this.logger.info(
      'PERSONAL_ASSISTANT',
      'Mood Check Response',
      `Responded to mood check from ${message.author.username}`,
      {
        channelId: message.channelId,
        responseType: 'mood_check'
      },
      {
        channelId: message.channelId,
        userId: message.author.id,
        guildId: message.guild?.id
      }
    );
  }

  private async handleProgressUpdate(message: Message): Promise<void> {
    const channel = message.channel as TextChannel;
    
    if (message.content.toLowerCase().includes('geschafft') || message.content.toLowerCase().includes('done')) {
      await channel.send(`🎉 Das ist großartig! Du machst Fortschritte! Teile gerne mehr Details mit mir oder verwende \`/proof\` um deine Erfolge zu dokumentieren.`);
    } else if (message.content.toLowerCase().includes('schwierig') || message.content.toLowerCase().includes('difficult')) {
      await channel.send(`💪 Schwierige Zeiten sind Teil des Prozesses. Denk daran: Jeder Tag ist eine neue Chance. Was könnte dir heute helfen?`);
    } else {
      await channel.send(`📈 Es ist toll, dass du über deinen Fortschritt nachdenkst! Teile gerne mehr mit mir - ich bin hier um zu helfen!`);
    }

    await this.logger.info(
      'PERSONAL_ASSISTANT',
      'Progress Update Response',
      `Responded to progress update from ${message.author.username}`,
      {
        channelId: message.channelId,
        responseType: 'progress_update'
      },
      {
        channelId: message.channelId,
        userId: message.author.id,
        guildId: message.guild?.id
      }
    );
  }

  // Method to send proactive recommendations
  async sendPersonalRecommendation(userId: string, channelId: string, recommendation: string): Promise<void> {
    try {
      const channel = this.client.channels.cache.get(channelId) as TextChannel;
      if (!channel) return;

      await channel.send(recommendation);

      await this.logger.info(
        'PERSONAL_ASSISTANT',
        'Proactive Recommendation',
        `Sent proactive recommendation to user ${userId}`,
        {
          channelId: channelId,
          recommendationType: 'proactive'
        },
        {
          channelId: channelId,
          userId: userId
        }
      );
    } catch (error) {
      console.error('Error sending personal recommendation:', error);
    }
  }
}
