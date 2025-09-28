import { Message, Client } from 'discord.js';
import { NotionClient } from '../notion/client';
import { User, Habit } from '../types';

export class MessageAnalyzer {
  private notion: NotionClient;
  private client: Client;

  constructor(notion: NotionClient, client: Client) {
    this.notion = notion;
    this.client = client;
  }

  async analyzeMessage(message: Message) {
    try {
      console.log('🔍 Analyzing message from user:', message.author.username);
      
      // Skip bot messages
      if (message.author.bot) return;

      // Get user from Notion
      const user = await this.notion.getUserByDiscordId(message.author.id);
      if (!user) {
        console.log('❌ User not found in system:', message.author.username);
        return;
      }

      console.log('✅ User found:', user.name);

      // Get user's habits
      const habits = await this.notion.getHabitsByUserId(user.id);
      if (habits.length === 0) {
        console.log('❌ No habits found for user:', user.name);
        return;
      }

      console.log('📊 Found', habits.length, 'habits for user');
      console.log('🎯 User habits:', habits.map(h => `${h.name} (${h.smartGoal})`));

      // Analyze the message content with habit matching
      const analysis = await this.analyzeContentWithHabitMatching(message.content, habits);
      
      if (analysis.isProof) {
        console.log('✅ Message identified as proof');
        console.log('🎯 Matched habit:', analysis.matchedHabit?.name || 'Unknown');
        await this.createProofFromMessage(message, user, analysis);
      } else {
        console.log('ℹ️ Message not identified as proof');
      }

    } catch (error) {
      console.error('❌ Error analyzing message:', error);
    }
  }

  private async analyzeContentWithHabitMatching(content: string, habits: Habit[]): Promise<{
    isProof: boolean;
    habitId?: string;
    unit?: string;
    note?: string;
    isMinimalDose?: boolean;
    isCheatDay?: boolean;
    matchedHabit?: Habit;
  }> {
    // First check if it's a proof
    const basicAnalysis = await this.analyzeContent(content, habits);
    
    if (!basicAnalysis.isProof) {
      return { ...basicAnalysis, matchedHabit: undefined };
    }

    // Now try to match with specific habits
    const matchedHabit = this.matchHabitToContent(content, habits);
    
    return {
      ...basicAnalysis,
      habitId: matchedHabit?.id || basicAnalysis.habitId,
      matchedHabit
    };
  }

  private matchHabitToContent(content: string, habits: Habit[]): Habit | undefined {
    const lowerContent = content.toLowerCase();
    
    console.log('🔍 Matching content to habits...');
    console.log('📝 Content:', lowerContent);
    
    // Create a scoring system for habit matching
    const habitScores = habits.map(habit => {
      let score = 0;
      const habitName = habit.name.toLowerCase();
      const smartGoal = habit.smartGoal?.toLowerCase() || '';
      
      console.log(`🎯 Checking habit: ${habit.name} (${smartGoal})`);
      
      // Direct name matching
      if (lowerContent.includes(habitName)) {
        score += 10;
        console.log(`✅ Direct name match: +10`);
      }
      
      // SMART goal keyword matching
      const goalWords = smartGoal.split(' ').filter(word => word.length > 3);
      goalWords.forEach(word => {
        if (lowerContent.includes(word)) {
          score += 5;
          console.log(`✅ Goal word match "${word}": +5`);
        }
      });
      
      // Common activity keywords
      const activityKeywords = {
        'sport': ['sport', 'exercise', 'workout', 'training', 'fitness', 'gym'],
        'meditation': ['meditation', 'mindfulness', 'breathing', 'calm', 'zen'],
        'reading': ['reading', 'book', 'study', 'learn', 'education'],
        'writing': ['writing', 'journal', 'blog', 'article', 'content'],
        'running': ['running', 'jogging', 'sprint', 'marathon', 'cardio'],
        'yoga': ['yoga', 'stretching', 'flexibility', 'pose', 'mat'],
        'coding': ['coding', 'programming', 'development', 'code', 'script'],
        'music': ['music', 'instrument', 'practice', 'song', 'melody'],
        'art': ['art', 'drawing', 'painting', 'creative', 'design'],
        'cooking': ['cooking', 'recipe', 'kitchen', 'meal', 'food']
      };
      
      // Check for activity-specific keywords
      Object.entries(activityKeywords).forEach(([activity, keywords]) => {
        if (habitName.includes(activity) || smartGoal.includes(activity)) {
          keywords.forEach(keyword => {
            if (lowerContent.includes(keyword)) {
              score += 3;
              console.log(`✅ Activity keyword "${keyword}" for ${activity}: +3`);
            }
          });
        }
      });
      
      // Time-based matching (if habit mentions specific times)
      const timePattern = /(\d+)\s*(min|minutes?|hour|hours?)/i;
      const timeMatch = content.match(timePattern);
      if (timeMatch && smartGoal.includes(timeMatch[1])) {
        score += 7;
        console.log(`✅ Time match "${timeMatch[0]}": +7`);
      }
      
      console.log(`📊 Final score for "${habit.name}": ${score}`);
      return { habit, score };
    });
    
    // Sort by score and return the best match
    habitScores.sort((a, b) => b.score - a.score);
    const bestMatch = habitScores[0];
    
    if (bestMatch && bestMatch.score > 0) {
      console.log(`🎯 Best match: ${bestMatch.habit.name} (score: ${bestMatch.score})`);
      return bestMatch.habit;
    }
    
    console.log('❌ No habit match found, using first habit as fallback');
    return habits[0]; // Fallback to first habit
  }

  private async analyzeContent(content: string, habits: Habit[]): Promise<{
    isProof: boolean;
    habitId?: string;
    unit?: string;
    note?: string;
    isMinimalDose?: boolean;
    isCheatDay?: boolean;
  }> {
    // Simple AI-like analysis (you can replace this with actual AI)
    const lowerContent = content.toLowerCase();
    
    // Check for proof indicators
    const proofIndicators = [
      'done', 'completed', 'finished', 'did', 'accomplished',
      'minutes', 'hours', 'reps', 'sets', 'km', 'miles',
      'proof', 'evidence', 'tracking', 'progress'
    ];

    const hasProofIndicators = proofIndicators.some(indicator => 
      lowerContent.includes(indicator)
    );

    if (!hasProofIndicators) {
      return { isProof: false };
    }

    // Extract unit (numbers with units)
    const unitMatch = content.match(/(\d+(?:\.\d+)?)\s*(minutes?|hours?|reps?|sets?|km|miles?|kg|lbs?)/i);
    const unit = unitMatch ? `${unitMatch[1]} ${unitMatch[2]}` : '1 session';

    // Check for minimal dose indicators
    const minimalDoseIndicators = ['minimal', 'small', 'quick', 'brief', 'just', 'only'];
    const isMinimalDose = minimalDoseIndicators.some(indicator => 
      lowerContent.includes(indicator)
    );

    // Check for cheat day indicators
    const cheatDayIndicators = ['cheat', 'rest', 'break', 'off day', 'skip'];
    const isCheatDay = cheatDayIndicators.some(indicator => 
      lowerContent.includes(indicator)
    );

    // Use first habit for now (in a real implementation, you'd match based on content)
    const habitId = habits[0].id;

    return {
      isProof: true,
      habitId,
      unit,
      note: content,
      isMinimalDose,
      isCheatDay
    };
  }

  private async createProofFromMessage(message: Message, user: User, analysis: any) {
    try {
      const proof = await this.notion.createProof({
        userId: user.id,
        habitId: analysis.habitId,
        date: new Date().toISOString().split('T')[0],
        unit: analysis.unit || '1 session',
        note: analysis.note || message.content,
        attachmentUrl: message.attachments.size > 0 ? message.attachments.first()?.url : undefined,
        isMinimalDose: analysis.isMinimalDose || false,
        isCheatDay: analysis.isCheatDay || false
      });

      console.log('✅ Proof created from message:', proof.id);

      // React to the message with appropriate emoji
      const emoji = analysis.isMinimalDose ? '⭐' : analysis.isCheatDay ? '🎯' : '✅';
      await message.react(emoji);

      // Get weekly frequency count
      const frequencyCount = await this.notion.getWeeklyFrequencyCount(user.id, analysis.habitId);
      console.log(`📊 Weekly frequency: ${frequencyCount.current}/${frequencyCount.target}`);

      // Send confirmation to the user with habit information and frequency count
      const habitInfo = analysis.matchedHabit ? `\n• Habit: ${analysis.matchedHabit.name}` : '';
      await message.reply({
        content: `${emoji} **Proof Automatically Detected!**\n\n📊 **Details:**\n• Unit: ${analysis.unit}\n• Type: ${analysis.isMinimalDose ? 'Minimal Dose' : analysis.isCheatDay ? 'Cheat Day' : 'Full Proof'}${habitInfo}\n• This Week: ${frequencyCount.current}/${frequencyCount.target}\n• Saved to Notion ✅`
      });

    } catch (error) {
      console.error('❌ Error creating proof from message:', error);
    }
  }
}

