import { Client, Message, TextChannel } from 'discord.js';
import { NotionClient } from '../notion/client';
import { DiscordLogger } from './discord-logger';
import { PerplexityClient } from '../ai/perplexity-client';

export class PersonalAssistant {
  private client: Client;
  private notion: NotionClient;
  private logger: DiscordLogger;
  private aiClient: PerplexityClient | null;

  constructor(client: Client, notion: NotionClient, logger: DiscordLogger) {
    this.client = client;
    this.notion = notion;
    this.logger = logger;
    
    // Initialize AI client if API key is available
    if (PerplexityClient.isAvailable()) {
      this.aiClient = new PerplexityClient(process.env.PERPLEXITY_API_KEY!);
      console.log('🤖 AI-powered Personal Assistant enabled');
    } else {
      this.aiClient = null;
      console.log('⚠️ PERPLEXITY_API_KEY not found - AI features disabled');
    }
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

    // Try AI-powered response first if available
    if (this.aiClient && this.shouldUseAI(content)) {
      const aiHandled = await this.handleAIQuery(message);
      if (aiHandled) {
        return true;
      }
    }

    // Fallback to rule-based responses
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

  private shouldUseAI(content: string): boolean {
    // Use AI for complex questions, data analysis, or specific habit-related queries
    const aiTriggers = [
      'how', 'what', 'why', 'when', 'where', 'wie', 'was', 'warum', 'wann', 'wo',
      'analysis', 'analyze', 'analyze', 'statistics', 'stats', 'data', 'trend',
      'recommend', 'suggest', 'advice', 'help', 'tip', 'empfehlung', 'rat',
      'improve', 'better', 'optimize', 'optimize', 'verbessern', 'optimieren',
      'pattern', 'habit', 'routine', 'consistency', 'consist', 'gewohnheit'
    ];
    
    return aiTriggers.some(trigger => content.includes(trigger)) && content.length > 10;
  }

  private async handleAIQuery(message: Message): Promise<boolean> {
    if (!this.aiClient) return false;

    try {
      const channel = message.channel as TextChannel;
      
      // Show typing indicator
      await channel.sendTyping();

      // Get user data for context
      const user = await this.notion.getUserByDiscordId(message.author.id);
      if (!user) {
        await channel.send('❌ Ich kann deine Daten nicht finden. Bitte verwende zuerst `/join` um dich zu registrieren.');
        return true;
      }

      // Gather user context data
      const userContext = await this.gatherUserContext(user.id);

      // Generate AI response
      const aiResponse = await this.aiClient.generateContextualResponse(
        message.content,
        userContext
      );

      // Send response with length checking
      const fullMessage = `🤖 **AI Assistant:**\n\n${aiResponse}`;
      await this.sendLongMessage(channel, fullMessage);

      // Log the AI interaction
      await this.logger.info(
        'AI_ASSISTANT',
        'AI Query Processed',
        `AI processed query from ${message.author.username}`,
        {
          query: message.content,
          responseLength: aiResponse.length,
          hasContext: userContext.habits.length > 0
        },
        {
          channelId: message.channelId,
          userId: message.author.id,
          guildId: message.guild?.id
        }
      );

      return true;

    } catch (error) {
      console.error('Error in AI query handling:', error);
      
      const channel = message.channel as TextChannel;
      await channel.send('❌ Entschuldigung, ich hatte ein Problem beim Verarbeiten deiner Anfrage. Bitte versuche es erneut.');

      await this.logger.error(
        'AI_ASSISTANT',
        'AI Query Error',
        `Error processing AI query from ${message.author.username}`,
        {
          error: (error as Error).message,
          query: message.content
        },
        {
          channelId: message.channelId,
          userId: message.author.id,
          guildId: message.guild?.id
        }
      );

      return true; // Still handled, even with error
    }
  }

  private async gatherUserContext(userId: string): Promise<{
    habits: any[];
    recentProofs: any[];
    learnings: any[];
    hurdles: any[];
    summary: any;
  }> {
    try {
      console.log('🔍 Gathering user context for userId:', userId);
      
      // Get user's habits
      console.log('📊 Getting habits...');
      const habits = await this.notion.getHabitsByUserId(userId);
      console.log('✅ Habits retrieved:', habits.length);

      // Get recent proofs (last 7 days) - with error handling
      console.log('📊 Getting recent proofs...');
      let recentProofs: any[] = [];
      try {
        recentProofs = await this.getRecentProofs(userId, 7);
        console.log('✅ Recent proofs retrieved:', recentProofs.length);
      } catch (error) {
        console.error('⚠️ Error getting recent proofs:', error);
        recentProofs = [];
      }

      // Get recent learnings (last 10)
      console.log('📊 Getting recent learnings...');
      let learnings: any[] = [];
      try {
        learnings = await this.getRecentLearnings(userId, 10);
        console.log('✅ Recent learnings retrieved:', learnings.length);
      } catch (error) {
        console.error('⚠️ Error getting recent learnings:', error);
        learnings = [];
      }

      // Get recent hurdles (last 5)
      console.log('📊 Getting recent hurdles...');
      let hurdles: any[] = [];
      try {
        hurdles = await this.getRecentHurdles(userId, 5);
        console.log('✅ Recent hurdles retrieved:', hurdles.length);
      } catch (error) {
        console.error('⚠️ Error getting recent hurdles:', error);
        hurdles = [];
      }

      // Get user summary
      console.log('📊 Getting user summary...');
      let summary: any = null;
      try {
        summary = await this.notion.getUserSummary(userId);
        console.log('✅ User summary retrieved:', summary);
      } catch (error) {
        console.error('⚠️ Error getting user summary:', error);
        summary = null;
      }

      const context = {
        habits: habits || [],
        recentProofs: recentProofs || [],
        learnings: learnings || [],
        hurdles: hurdles || [],
        summary: summary || null
      };

      console.log('📋 Final context:', {
        habitsCount: context.habits.length,
        proofsCount: context.recentProofs.length,
        learningsCount: context.learnings.length,
        hurdlesCount: context.hurdles.length,
        hasSummary: !!context.summary
      });

      return context;

    } catch (error) {
      console.error('❌ Error gathering user context:', error);
      return {
        habits: [],
        recentProofs: [],
        learnings: [],
        hurdles: [],
        summary: null
      };
    }
  }

  private async getRecentProofs(userId: string, days: number): Promise<any[]> {
    try {
      const endDate = new Date().toISOString().split('T')[0];
      const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      const proofs = await this.notion.getProofsByUserId(userId, startDate, endDate);
      
      // Enrich proofs with habit names
      const enrichedProofs = await Promise.all(
        proofs.map(async (proof) => {
          try {
            const habits = await this.notion.getHabitsByUserId(userId);
            const habit = habits.find(h => h.id === proof.habitId);
            return {
              ...proof,
              habitName: habit?.name || 'Unknown Habit'
            };
          } catch (error) {
            return { ...proof, habitName: 'Unknown Habit' };
          }
        })
      );
      
      return enrichedProofs;
    } catch (error) {
      console.error('Error getting recent proofs:', error);
      return [];
    }
  }

  private async getRecentLearnings(userId: string, limit: number): Promise<any[]> {
    try {
      return await this.notion.getLearningsByUserId(userId, limit);
    } catch (error) {
      console.error('Error getting recent learnings:', error);
      return [];
    }
  }

  private async getRecentHurdles(userId: string, limit: number): Promise<any[]> {
    try {
      return await this.notion.getHurdlesByUserId(userId, limit);
    } catch (error) {
      console.error('Error getting recent hurdles:', error);
      return [];
    }
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

  /**
   * Send a long message by splitting it into multiple Discord messages if needed
   */
  private async sendLongMessage(channel: TextChannel, message: string): Promise<void> {
    const maxLength = 1950; // Leave some buffer for Discord's 2000 char limit
    
    if (message.length <= maxLength) {
      // Message is short enough, send as is
      await channel.send(message);
      return;
    }

    console.log(`📝 Message too long (${message.length} chars), splitting into multiple parts...`);
    
    // Split message into logical chunks
    const chunks = this.splitMessageIntoChunks(message, maxLength);
    
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const partIndicator = chunks.length > 1 ? `\n\n*Teil ${i + 1}/${chunks.length}*\n` : '';
      
      await channel.send(partIndicator + chunk);
      
      // Small delay between messages to avoid rate limiting
      if (i < chunks.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    console.log(`✅ Sent message in ${chunks.length} parts`);
  }

  /**
   * Split a long message into logical chunks while preserving content structure
   */
  private splitMessageIntoChunks(message: string, maxLength: number): string[] {
    const chunks: string[] = [];
    
    // First, try to split by major sections (double newlines)
    const sections = message.split('\n\n');
    let currentChunk = '';
    
    for (const section of sections) {
      // If adding this section would exceed the limit
      if (currentChunk.length + section.length + 2 > maxLength) {
        // If current chunk has content, save it
        if (currentChunk.trim()) {
          chunks.push(currentChunk.trim());
          currentChunk = '';
        }
        
        // If the section itself is too long, split it by lines
        if (section.length > maxLength) {
          const lines = section.split('\n');
          let lineChunk = '';
          
          for (const line of lines) {
            if (lineChunk.length + line.length + 1 > maxLength) {
              if (lineChunk.trim()) {
                chunks.push(lineChunk.trim());
                lineChunk = '';
              }
              
              // If a single line is still too long, force split it
              if (line.length > maxLength) {
                chunks.push(line.substring(0, maxLength));
                lineChunk = line.substring(maxLength);
              } else {
                lineChunk = line;
              }
            } else {
              lineChunk += (lineChunk ? '\n' : '') + line;
            }
          }
          
          if (lineChunk.trim()) {
            currentChunk = lineChunk;
          }
        } else {
          currentChunk = section;
        }
      } else {
        currentChunk += (currentChunk ? '\n\n' : '') + section;
      }
    }
    
    // Add the last chunk if it has content
    if (currentChunk.trim()) {
      chunks.push(currentChunk.trim());
    }
    
    return chunks;
  }
}
