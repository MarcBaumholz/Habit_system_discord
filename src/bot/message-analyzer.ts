import { Message, Client } from 'discord.js';
import { NotionClient } from '../notion/client';
import { User, Habit } from '../types';
import { DiscordLogger } from './discord-logger';
import { HabitFlowManager } from './habit-flow';

export class MessageAnalyzer {
  private notion: NotionClient;
  private client: Client;
  private logger: DiscordLogger;
  private habitFlow: HabitFlowManager;

  constructor(notion: NotionClient, client: Client, logger: DiscordLogger) {
    this.notion = notion;
    this.client = client;
    this.logger = logger;
    this.habitFlow = new HabitFlowManager(notion);
  }

  async analyzeMessage(message: Message) {
    try {
      console.log('🔍 Analyzing message from user:', message.author.username);
      
      await this.logger.info(
        'MESSAGE_ANALYSIS',
        'Message Analysis Started',
        `Starting analysis of message from ${message.author.username}`,
        {
          messageLength: message.content.length,
          hasAttachments: message.attachments.size > 0,
          channelId: message.channelId
        },
        {
          channelId: message.channelId,
          userId: message.author.id,
          guildId: message.guild?.id
        }
      );
      
      // Skip bot messages
      if (message.author.bot) return;

      // Check for keystone habit trigger keywords first
      if (this.isKeystoneHabitTrigger(message.content)) {
        console.log('🎯 Keystone habit trigger detected in message');
        await this.logger.info(
          'MESSAGE_ANALYSIS',
          'Keystone Habit Trigger Detected',
          `User ${message.author.username} triggered keystone habit flow`,
          {
            content: message.content,
            channelId: message.channelId
          },
          {
            channelId: message.channelId,
            userId: message.author.id,
            guildId: message.guild?.id
          }
        );
        
        // Handle the keystone habit flow
        const handled = await this.habitFlow.handleMessage(message);
        if (handled) {
          return true;
        }
      }

      // Get user from Notion
      const user = await this.notion.getUserByDiscordId(message.author.id);
      if (!user) {
        await this.logger.warning(
          'MESSAGE_ANALYSIS',
          'User Not Found',
          `User ${message.author.username} not found in Notion system`,
          {
            discordId: message.author.id,
            username: message.author.username
          },
          {
            channelId: message.channelId,
            userId: message.author.id,
            guildId: message.guild?.id
          }
        );
        console.log('❌ User not found in system:', message.author.username);
        return;
      }

      console.log('✅ User found:', user.name);

      // Get user's habits
      const habits = await this.notion.getHabitsByUserId(user.id);
      if (habits.length === 0) {
        await this.logger.warning(
          'MESSAGE_ANALYSIS',
          'No Habits Found',
          `User ${user.name} has no habits configured`,
          {
            userId: user.id,
            userName: user.name
          },
          {
            channelId: message.channelId,
            userId: message.author.id,
            guildId: message.guild?.id
          }
        );
        console.log('❌ No habits found for user:', user.name);
        return;
      }

      console.log('📊 Found', habits.length, 'habits for user');
      console.log('🎯 User habits:', habits.map(h => `${h.name} (${h.smartGoal})`));

      await this.logger.debug(
        'MESSAGE_ANALYSIS',
        'User Habits Loaded',
        `Found ${habits.length} habits for user ${user.name}`,
        {
          habits: habits.map(h => ({ id: h.id, name: h.name, smartGoal: h.smartGoal }))
        },
        {
          channelId: message.channelId,
          userId: message.author.id,
          guildId: message.guild?.id
        }
      );

      // Analyze the message content with habit matching
      const analysis = await this.analyzeContentWithHabitMatching(message.content, habits);
      
      if (analysis.isProof) {
        console.log('✅ Message identified as proof');
        console.log('🎯 Matched habit:', analysis.matchedHabit?.name || 'Unknown');
        
        await this.logger.success(
          'MESSAGE_ANALYSIS',
          'Proof Detected',
          `Message identified as proof for habit: ${analysis.matchedHabit?.name || 'Unknown'}`,
          {
            matchedHabit: analysis.matchedHabit?.name,
            unit: analysis.unit,
            isMinimalDose: analysis.isMinimalDose,
            isCheatDay: analysis.isCheatDay
          },
          {
            channelId: message.channelId,
            userId: message.author.id,
            guildId: message.guild?.id
          }
        );
        
        await this.createProofFromMessage(message, user, analysis);
      } else {
        console.log('ℹ️ Message not identified as proof');
        
        await this.logger.info(
          'MESSAGE_ANALYSIS',
          'No Proof Detected',
          `Message from ${message.author.username} not identified as proof`,
          {
            contentLength: message.content.length,
            hasAttachments: message.attachments.size > 0
          },
          {
            channelId: message.channelId,
            userId: message.author.id,
            guildId: message.guild?.id
          }
        );
      }

    } catch (error) {
      await this.logger.logError(
        error as Error,
        'Message Analysis',
        {
          userId: message.author.id,
          channelId: message.channelId,
          contentLength: message.content.length
        },
        {
          channelId: message.channelId,
          userId: message.author.id,
          guildId: message.guild?.id
        }
      );
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
    // Use the flexible analysis that includes habit matching
    const analysis = await this.analyzeContent(content, habits);
    
    // If a habit was matched, find the habit object
    let matchedHabit: Habit | undefined;
    if (analysis.habitId) {
      matchedHabit = habits.find(h => h.id === analysis.habitId);
    }
    
    return {
      ...analysis,
      matchedHabit
    };
  }

  private async matchHabitToContent(content: string, habits: Habit[]): Promise<Habit | undefined> {
    const lowerContent = content.toLowerCase();
    
    console.log('🔍 AI-Powered Semantic Matching...');
    console.log('📝 Content:', lowerContent);
    
    // First try AI-powered semantic matching if Perplexity is available
    if (process.env.PERPLEXITY_API_KEY) {
      const aiMatch = await this.performAISemanticMatching(content, habits);
      if (aiMatch) {
        console.log(`🤖 AI matched: ${aiMatch.name}`);
        return aiMatch;
      }
    }
    
    // Fallback to enhanced rule-based matching
    return this.performRuleBasedMatching(content, habits);
  }

  private async performAISemanticMatching(content: string, habits: Habit[]): Promise<Habit | undefined> {
    try {
      const habitDescriptions = habits.map((habit, index) => 
        `Habit ${index + 1}: ${habit.name}\n- SMART Goal: ${habit.smartGoal}\n- Context: ${habit.context}\n- Domains: ${habit.domains.join(', ')}`
      ).join('\n\n');

      const prompt = `You are an expert habit matching AI. Analyze the user's message and match it to the most appropriate habit.

Available Habits:
${habitDescriptions}

User Message: "${content}"

CRITICAL INSTRUCTIONS:
1. Look for DIRECT habit name mentions first (e.g., "meditation" → Meditation habit)
2. Analyze activity keywords and synonyms (e.g., "exercise" → Exercise habit)
3. Consider time patterns (e.g., "10min meditation" → Meditation habit)
4. Match based on activity type, not just keywords
5. Look for PARTIAL matches (e.g., "Deep work" → "Deep work and single tasking")
6. Consider synonyms and related terms (e.g., "focused work", "concentration" → Deep work)
7. Return ONLY the exact habit name that matches, or "unknown" if no clear match

COMMON PATTERNS:
- "10min meditation" → Meditation
- "30min exercise" → Exercise  
- "meditation 15min" → Meditation
- "did reading" → Reading
- "played guitar" → Guitar/Music
- "went running" → Running
- "cooked dinner" → Cooking
- "Deep work" → Deep work and single tasking
- "focused work" → Deep work and single tasking
- "concentration" → Deep work and single tasking
- "single tasking" → Deep work and single tasking

SYNONYMS TO CONSIDER:
- Deep work = focused work, concentration, single tasking, deep focus
- Meditation = mindfulness, breathing, calm
- Exercise = workout, training, sports, fitness
- Reading = books, literature, studying

Return only the exact habit name, nothing else.`;

      const response = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'sonar',
          messages: [
            { role: 'system', content: 'You are a precise habit matching AI. Return only the exact habit name or "unknown".' },
            { role: 'user', content: prompt }
          ]
        })
      });

      const data = await response.json();
      const matchedHabitName = data.choices[0].message.content.trim();

      console.log(`🤖 AI suggested: "${matchedHabitName}"`);

      if (matchedHabitName === 'unknown') {
        return undefined;
      }

      // Find the exact habit match
      const matchedHabit = habits.find(habit => 
        habit.name.toLowerCase() === matchedHabitName.toLowerCase()
      );

      if (matchedHabit) {
        console.log(`✅ AI matched to: ${matchedHabit.name}`);
        return matchedHabit;
      }

      console.log(`❌ AI suggestion "${matchedHabitName}" not found in habits`);
      return undefined;

    } catch (error) {
      console.error('❌ AI semantic matching failed:', error);
      return undefined;
    }
  }

  private performRuleBasedMatching(content: string, habits: Habit[]): Habit | undefined {
    const lowerContent = content.toLowerCase();
    
    console.log('🔍 Enhanced Rule-Based Matching...');
    console.log('📝 Content:', lowerContent);
    
    // First check for direct habit name matches (highest priority)
    const directMatch = habits.find(habit => {
      const habitName = habit.name.toLowerCase();
      return lowerContent.includes(habitName);
    });
    
    if (directMatch) {
      console.log(`✅ Direct habit name match found: ${directMatch.name}`);
      return directMatch;
    }

    // Check for partial habit name matches (high priority)
    const partialMatch = habits.find(habit => {
      const habitName = habit.name.toLowerCase();
      const habitWords = habitName.split(' ');
      
      // Check if any significant word from habit name is in the content
      return habitWords.some(word => {
        if (word.length > 3) { // Only consider words longer than 3 characters
          return lowerContent.includes(word);
        }
        return false;
      });
    });
    
    if (partialMatch) {
      console.log(`✅ Partial habit name match found: ${partialMatch.name}`);
      return partialMatch;
    }
    
    // Check for time + activity patterns
    const timeActivityPattern = /(\d+(?:\.\d+)?)\s*(min|minutes?|hour|hours?|hr|hrs)\s+(\w+)/i;
    const timeActivityMatch = content.match(timeActivityPattern);
    
    if (timeActivityMatch) {
      const activity = timeActivityMatch[3].toLowerCase();
      console.log(`🎯 Time + activity pattern: ${activity}`);
      
      const activityMatch = habits.find(habit => {
        const habitName = habit.name.toLowerCase();
        return habitName.includes(activity) || activity.includes(habitName.split(' ')[0]);
      });
      
      if (activityMatch) {
        console.log(`✅ Activity pattern matched: ${activityMatch.name}`);
        return activityMatch;
      }
    }
    
    // Create a comprehensive scoring system for habit matching
    const habitScores = habits.map(habit => {
      let score = 0;
      const habitName = habit.name.toLowerCase();
      const smartGoal = habit.smartGoal?.toLowerCase() || '';
      const context = habit.context?.toLowerCase() || '';
      const why = habit.why?.toLowerCase() || '';
      
      console.log(`🎯 Checking habit: ${habit.name} (${smartGoal})`);
      
      // Partial name matching (high priority)
      const habitWords = habitName.split(' ');
      habitWords.forEach(word => {
        if (word.length > 2 && lowerContent.includes(word)) {
          score += 10;
          console.log(`✅ Partial name match "${word}": +10`);
        }
      });

      // Synonym matching for common habit types
      const synonyms: Record<string, string[]> = {
        'deep work': ['deep work', 'focused work', 'concentration', 'single tasking', 'deep focus', 'focused time', 'concentrated work'],
        'meditation': ['meditation', 'mindfulness', 'breathing', 'calm', 'meditate'],
        'exercise': ['exercise', 'workout', 'training', 'sports', 'fitness', 'gym', 'running', 'cycling'],
        'reading': ['reading', 'books', 'literature', 'study', 'studying', 'read'],
        'journaling': ['journaling', 'journal', 'writing', 'morning pages', 'diary']
      };

      // Check for synonym matches
      Object.entries(synonyms).forEach(([key, values]) => {
        if (habitName.includes(key)) {
          values.forEach(synonym => {
            if (lowerContent.includes(synonym)) {
              score += 15;
              console.log(`✅ Synonym match "${synonym}" for "${key}": +15`);
            }
          });
        }
      });
      
      // SMART goal keyword matching with synonyms
      const goalWords = smartGoal.split(' ').filter(word => word.length > 2);
      goalWords.forEach(word => {
        if (lowerContent.includes(word)) {
          score += 5;
          console.log(`✅ Goal word match "${word}": +5`);
        }
      });
      
      // Context and why matching
      const contextWords = context.split(' ').filter(word => word.length > 2);
      contextWords.forEach(word => {
        if (lowerContent.includes(word)) {
          score += 3;
          console.log(`✅ Context word match "${word}": +3`);
        }
      });
      
      const whyWords = why.split(' ').filter(word => word.length > 2);
      whyWords.forEach(word => {
        if (lowerContent.includes(word)) {
          score += 2;
          console.log(`✅ Why word match "${word}": +2`);
        }
      });
      
      // Comprehensive activity keywords with synonyms
      const activityKeywords = {
        'sport': ['sport', 'exercise', 'workout', 'training', 'fitness', 'gym', 'physical', 'cardio', 'strength', 'muscle', 'body'],
        'meditation': ['meditation', 'mindfulness', 'breathing', 'calm', 'zen', 'peace', 'tranquil', 'serene', 'meditate', 'mindful', 'mindful', 'contemplation', 'reflection', 'inner', 'spiritual'],
        'reading': ['reading', 'book', 'study', 'learn', 'education', 'read', 'literature', 'text', 'page', 'chapter', 'article'],
        'writing': ['writing', 'journal', 'blog', 'article', 'content', 'write', 'pen', 'paper', 'document', 'text', 'story'],
        'running': ['running', 'jogging', 'sprint', 'marathon', 'cardio', 'run', 'jog', 'dash', 'race', 'track', 'treadmill'],
        'yoga': ['yoga', 'stretching', 'flexibility', 'pose', 'mat', 'stretch', 'bend', 'flex', 'balance', 'posture'],
        'coding': ['coding', 'programming', 'development', 'code', 'script', 'program', 'software', 'app', 'debug', 'algorithm'],
        'music': ['music', 'instrument', 'practice', 'song', 'melody', 'guitar', 'piano', 'violin', 'drum', 'bass', 'playing', 'played', 'practice', 'rehearsal', 'concert', 'band', 'sound', 'audio', 'rhythm', 'tune'],
        'art': ['art', 'drawing', 'painting', 'creative', 'design', 'paint', 'draw', 'sketch', 'canvas', 'brush', 'color', 'artistic'],
        'cooking': ['cooking', 'recipe', 'kitchen', 'meal', 'food', 'cook', 'bake', 'prepare', 'ingredient', 'chef', 'dining']
      };
      
      // Check for activity-specific keywords with enhanced matching
      Object.entries(activityKeywords).forEach(([activity, keywords]) => {
        if (habitName.includes(activity) || smartGoal.includes(activity) || context.includes(activity)) {
          keywords.forEach(keyword => {
            if (lowerContent.includes(keyword)) {
              score += 4;
              console.log(`✅ Activity keyword "${keyword}" for ${activity}: +4`);
            }
          });
        }
      });
      
      // Enhanced music keyword matching
      const musicKeywords = ['guitar', 'piano', 'violin', 'drum', 'bass', 'playing', 'played', 'practice', 'rehearsal', 'concert', 'band', 'sound', 'audio', 'rhythm', 'tune', 'melody', 'song'];
      const hasMusicKeywords = musicKeywords.some(keyword => lowerContent.includes(keyword));
      const isMusicHabit = habitName.includes('music') || habitName.includes('guitar') || habitName.includes('piano') ||
                          smartGoal.includes('music') || smartGoal.includes('guitar') || smartGoal.includes('piano') ||
                          context.includes('music') || context.includes('guitar') || context.includes('piano');
      
      if (hasMusicKeywords && isMusicHabit) {
        score += 10; // High score for music-related activities
        console.log(`✅ Music keyword match for music habit: +10`);
      }
      
      // Time-based matching with flexible patterns
      const timePatterns = [
        /(\d+)\s*(min|minutes?|hour|hours?)/i,
        /(\d+)\s*(sec|seconds?)/i,
        /(\d+)\s*(day|days)/i,
        /(\d+)\s*(week|weeks)/i
      ];
      
      timePatterns.forEach(pattern => {
        const timeMatch = content.match(pattern);
        if (timeMatch && (smartGoal.includes(timeMatch[1]) || context.includes(timeMatch[1]))) {
          score += 6;
          console.log(`✅ Time match "${timeMatch[0]}": +6`);
        }
      });
      
      // Intensity and frequency matching
      const intensityWords = ['intense', 'light', 'heavy', 'quick', 'slow', 'fast', 'easy', 'hard', 'difficult', 'challenging'];
      const frequencyWords = ['daily', 'weekly', 'monthly', 'regular', 'consistent', 'routine'];
      
      intensityWords.forEach(word => {
        if (lowerContent.includes(word) && (smartGoal.includes(word) || context.includes(word))) {
          score += 2;
          console.log(`✅ Intensity match "${word}": +2`);
        }
      });
      
      frequencyWords.forEach(word => {
        if (lowerContent.includes(word) && (smartGoal.includes(word) || context.includes(word))) {
          score += 3;
          console.log(`✅ Frequency match "${word}": +3`);
        }
      });
      
      console.log(`📊 Final score for "${habit.name}": ${score}`);
      return { habit, score };
    });
    
    // Sort by score and return the best match
    habitScores.sort((a, b) => b.score - a.score);
    const bestMatch = habitScores[0];
    
    if (bestMatch && bestMatch.score >= 10) { // Require minimum score of 10 for confidence
      console.log(`🎯 Best match: ${bestMatch.habit.name} (score: ${bestMatch.score})`);
      return bestMatch.habit;
    }
    
    console.log('❌ No habit match found - returning undefined to prevent incorrect mapping');
    return undefined;
  }

  /**
   * Flexible habit matching - finds ANY word variation from habit names
   * This makes the system automatically detect proofs without requiring "proof" keywords
   */
  private findFlexibleHabitMatch(content: string, habits: Habit[]): { habit: Habit; matchType: string; matchedWords: string[] } | null {
    console.log('🔍 Flexible Habit Matching - Checking for ANY word variations...');
    
    // Comprehensive synonym dictionary for common habit types
    const synonyms: Record<string, string[]> = {
      'deep work': ['deep work', 'focused work', 'concentration', 'single tasking', 'deep focus', 'focused time', 'concentrated work', 'deep', 'work', 'focus'],
      'meditation': ['meditation', 'mindfulness', 'breathing', 'calm', 'meditate', 'meditating', 'mindful'],
      'exercise': ['exercise', 'workout', 'training', 'sports', 'fitness', 'gym', 'running', 'cycling', 'swimming', 'lifting', 'cardio'],
      'reading': ['reading', 'books', 'literature', 'study', 'studying', 'read', 'book', 'text'],
      'journaling': ['journaling', 'journal', 'writing', 'morning pages', 'diary', 'write', 'written', 'log', 'wrote'],
      'sleep': ['sleep', 'sleeping', 'bed', 'rest', 'nap', 'slept'],
      'water': ['water', 'hydration', 'hydrated', 'drink', 'drinking', 'fluid'],
      'walking': ['walking', 'walk', 'walked', 'stroll', 'hiking', 'step'],
      'cooking': ['cooking', 'cook', 'cooked', 'meal', 'food', 'kitchen'],
      'cleaning': ['cleaning', 'clean', 'cleaned', 'tidy', 'organize', 'organized'],
      'learning': ['learning', 'learn', 'learned', 'study', 'studying', 'education', 'skill'],
      'practicing': ['practicing', 'practice', 'practiced', 'rehearse', 'training', 'skill'],
      'socializing': ['socializing', 'social', 'friends', 'family', 'meeting', 'chat', 'conversation'],
      'planning': ['planning', 'plan', 'planned', 'organize', 'schedule', 'preparation'],
      'reflection': ['reflection', 'reflect', 'reflected', 'thinking', 'contemplation', 'review']
    };

    // Score each habit based on how well it matches
    const habitScores = habits.map(habit => {
      let score = 0;
      let matchedWords: string[] = [];
      const habitName = habit.name.toLowerCase();
      const habitWords = habitName.split(' ').filter(word => word.length > 2);
      
      console.log(`🎯 Analyzing habit: "${habit.name}"`);
      
      // 1. Direct habit name match (highest score)
      if (content.includes(habitName)) {
        score += 100;
        matchedWords.push(habitName);
        console.log(`✅ Direct name match: +100`);
      }
      
      // 2. Partial habit name match (high score)
      habitWords.forEach(word => {
        if (content.includes(word)) {
          score += 50;
          matchedWords.push(word);
          console.log(`✅ Partial name match "${word}": +50`);
        }
      });
      
      // 3. Synonym matching (medium-high score)
      Object.entries(synonyms).forEach(([key, values]) => {
        if (habitName.includes(key)) {
          values.forEach(synonym => {
            if (content.includes(synonym)) {
              score += 30;
              matchedWords.push(synonym);
              console.log(`✅ Synonym match "${synonym}" for "${key}": +30`);
            }
          });
        }
      });
      
      // 4. SMART goal keyword matching (medium score)
      if (habit.smartGoal) {
        const goalWords = habit.smartGoal.toLowerCase().split(' ').filter(word => word.length > 3);
        goalWords.forEach(word => {
          if (content.includes(word)) {
            score += 20;
            matchedWords.push(word);
            console.log(`✅ Goal word match "${word}": +20`);
          }
        });
      }
      
      // 5. Context and why matching (lower score)
      if (habit.context) {
        const contextWords = habit.context.toLowerCase().split(' ').filter(word => word.length > 3);
        contextWords.forEach(word => {
          if (content.includes(word)) {
            score += 15;
            matchedWords.push(word);
            console.log(`✅ Context word match "${word}": +15`);
          }
        });
      }
      
      if (habit.why) {
        const whyWords = habit.why.toLowerCase().split(' ').filter(word => word.length > 3);
        whyWords.forEach(word => {
          if (content.includes(word)) {
            score += 10;
            matchedWords.push(word);
            console.log(`✅ Why word match "${word}": +10`);
          }
        });
      }
      
      console.log(`📊 Total score for "${habit.name}": ${score}`);
      
      return {
        habit,
        score,
        matchedWords: [...new Set(matchedWords)] // Remove duplicates
      };
    });
    
    // Find the habit with the highest score
    const bestMatch = habitScores.reduce((best, current) => 
      current.score > best.score ? current : best
    );
    
    // Only return a match if score is above threshold (very flexible - any reasonable match)
    if (bestMatch.score >= 10) {
      console.log(`🎯 Best match: "${bestMatch.habit.name}" with score ${bestMatch.score}`);
      console.log(`📝 Matched words: ${bestMatch.matchedWords.join(', ')}`);
      
      let matchType = 'unknown';
      if (bestMatch.score >= 100) matchType = 'direct_name';
      else if (bestMatch.score >= 50) matchType = 'partial_name';
      else if (bestMatch.score >= 30) matchType = 'synonym';
      else if (bestMatch.score >= 20) matchType = 'goal_keyword';
      else matchType = 'context_keyword';
      
      return {
        habit: bestMatch.habit,
        matchType,
        matchedWords: bestMatch.matchedWords
      };
    }
    
    console.log('❌ No habit match found - score too low');
    return null;
  }

  private async analyzeContent(content: string, habits: Habit[]): Promise<{
    isProof: boolean;
    habitId?: string;
    unit?: string;
    note?: string;
    isMinimalDose?: boolean;
    isCheatDay?: boolean;
  }> {
    const lowerContent = content.toLowerCase();
    
    console.log('🔍 Enhanced Flexible Proof Detection Analysis...');
    console.log('📝 Content:', lowerContent);
    
    // 1. Check for ANY word variation from habit names (FLEXIBLE APPROACH)
    const habitMatch = this.findFlexibleHabitMatch(lowerContent, habits);
    
    if (habitMatch) {
      console.log(`✅ Flexible habit match found: ${habitMatch.habit.name}`);
      
      // Extract unit from message
      const unitMatch = content.match(/(\d+(?:\.\d+)?)\s*(minutes?|hours?|reps?|sets?|km|miles?|kg|lbs?|min)/i);
      const unit = unitMatch ? `${unitMatch[1]} ${unitMatch[2]}` : '1 session';
      
      // Check for minimal dose and cheat day indicators
      const minimalDoseIndicators = ['minimal', 'small', 'quick', 'brief', 'just', 'only'];
      const isMinimalDose = minimalDoseIndicators.some(indicator => 
        lowerContent.includes(indicator)
      );
      
      const cheatDayIndicators = ['cheat', 'rest', 'break', 'off day', 'skip'];
      const isCheatDay = cheatDayIndicators.some(indicator => 
        lowerContent.includes(indicator)
      );
      
      return {
        isProof: true,
        habitId: habitMatch.habit.id,
        unit,
        note: content,
        isMinimalDose,
        isCheatDay
      };
    }
    
    // 2. Check for time + activity patterns (e.g., "10min meditation")
    const timeActivityPattern = /(\d+(?:\.\d+)?)\s*(min|minutes?|hour|hours?|hr|hrs)\s+(\w+)/i;
    const timeActivityMatch = content.match(timeActivityPattern);
    
    if (timeActivityMatch) {
      const timeUnit = timeActivityMatch[1] + ' ' + timeActivityMatch[2];
      const activity = timeActivityMatch[3].toLowerCase();
      
      console.log(`✅ Time + activity pattern found: ${timeUnit} ${activity}`);
      
      // Check if activity matches any habit name
      const activityHabitMatch = habits.find(habit => {
        const habitName = habit.name.toLowerCase();
        return habitName.includes(activity) || activity.includes(habitName.split(' ')[0]);
      });
      
      if (activityHabitMatch) {
        console.log(`✅ Activity matched to habit: ${activityHabitMatch.name}`);
        
        const minimalDoseIndicators = ['minimal', 'small', 'quick', 'brief', 'just', 'only'];
        const isMinimalDose = minimalDoseIndicators.some(indicator => 
          lowerContent.includes(indicator)
        );
        
        const cheatDayIndicators = ['cheat', 'rest', 'break', 'off day', 'skip'];
        const isCheatDay = cheatDayIndicators.some(indicator => 
          lowerContent.includes(indicator)
        );
        
        return {
          isProof: true,
          habitId: activityHabitMatch.id,
          unit: timeUnit,
          note: content,
          isMinimalDose,
          isCheatDay
        };
      }
    }
    
    // 3. Check for expanded proof indicators (fallback)
    const proofIndicators = [
      'done', 'completed', 'finished', 'did', 'accomplished',
      'minutes', 'hours', 'reps', 'sets', 'km', 'miles',
      'proof', 'evidence', 'tracking', 'progress',
      // Activity keywords
      'meditation', 'exercise', 'reading', 'writing', 'sport', 'workout',
      'guitar', 'music', 'piano', 'running', 'yoga', 'cooking',
      'study', 'learning', 'practice', 'training'
    ];

    const hasProofIndicators = proofIndicators.some(indicator => 
      lowerContent.includes(indicator)
    );

    if (!hasProofIndicators) {
      console.log('❌ No proof indicators found');
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

  private isKeystoneHabitTrigger(content: string): boolean {
    const lowerContent = content.toLowerCase().trim();
    
    // Define all possible variations of keystone habit triggers
    const keystoneTriggers = [
      'keystone habit',
      'keystone habits', 
      'keystonehabit',
      'keystonehabits',
      'keystone-habit',
      'keystone-habits',
      'keystone_habit',
      'keystone_habits'
    ];
    
    // Check if the message contains any of the trigger variations
    return keystoneTriggers.some(trigger => lowerContent.includes(trigger));
  }

  private async createProofFromMessage(message: Message, user: User, analysis: any) {
    try {
      const attachmentUrl = message.attachments.size > 0 ? message.attachments.first()?.url : undefined;
      
      // Log proof creation start
      await this.logger.info(
        'MESSAGE_ANALYSIS',
        'Creating Proof from Message',
        `Creating proof for user ${user.name} from message`,
        {
          userId: user.id,
          habitId: analysis.habitId,
          unit: analysis.unit,
          isMinimalDose: analysis.isMinimalDose,
          isCheatDay: analysis.isCheatDay,
          messageLength: message.content.length
        },
        {
          channelId: message.channelId,
          userId: message.author.id,
          guildId: message.guild?.id
        }
      );

      const proof = await this.notion.createProof({
        userId: user.id,
        habitId: analysis.habitId,
        date: new Date().toISOString().split('T')[0],
        unit: analysis.unit || '1 session',
        note: analysis.note || message.content,
        attachmentUrl: undefined, // We'll pass this separately
        isMinimalDose: analysis.isMinimalDose || false,
        isCheatDay: analysis.isCheatDay || false
      }, attachmentUrl);

      console.log('✅ Proof created from message:', proof.id);

      // Log successful proof creation
      await this.logger.success(
        'MESSAGE_ANALYSIS',
        'Proof Created Successfully',
        `Proof created for user ${user.name} from message`,
        {
          proofId: proof.id,
          userId: user.id,
          habitId: analysis.habitId,
          unit: analysis.unit,
          savedToNotion: true
        },
        {
          channelId: message.channelId,
          userId: message.author.id,
          guildId: message.guild?.id
        }
      );

      // React to the message with appropriate emoji
      const emoji = analysis.isMinimalDose ? '⭐' : analysis.isCheatDay ? '🎯' : '✅';
      await message.react(emoji);

      // Get weekly frequency count AFTER proof creation
      const frequencyCount = await this.notion.getWeeklyFrequencyCount(user.id, analysis.habitId);
      console.log(`📊 Weekly frequency: ${frequencyCount.current}/${frequencyCount.target}`);

      // Send confirmation to the user with habit information and frequency count
      const habitInfo = analysis.matchedHabit ? `\n• Habit: ${analysis.matchedHabit.name}` : '';
      await message.reply({
        content: `${emoji} **Proof Automatically Detected!**\n\n📊 **Details:**\n• Unit: ${analysis.unit}\n• Type: ${analysis.isMinimalDose ? 'Minimal Dose' : analysis.isCheatDay ? 'Cheat Day' : 'Full Proof'}${habitInfo}\n• This Week: ${frequencyCount.current}/${frequencyCount.target}\n• Saved to Notion ✅`
      });

    } catch (error) {
      console.error('❌ Error creating proof from message:', error);
      await this.logger.error(
        'MESSAGE_ANALYSIS',
        'Proof Creation Failed',
        `Failed to create proof for user ${user.name}`,
        {
          error: (error as Error).message,
          userId: user.id,
          habitId: analysis.habitId
        },
        {
          channelId: message.channelId,
          userId: message.author.id,
          guildId: message.guild?.id
        }
      );
    }
  }
}

