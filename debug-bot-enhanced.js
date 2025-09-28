const { Client, GatewayIntentBits } = require('discord.js');
require('dotenv').config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

const ACCOUNTABILITY_CHANNEL_ID = '1420295931689173002';

// Mock user and habits for testing
const mockUser = {
  id: 'user-123',
  name: 'Marc',
  discordId: '123456789'
};

const mockHabits = [
  {
    id: 'habit-1',
    name: 'Daily Sport',
    smartGoal: '30 minutes of exercise every day',
    userId: 'user-123'
  },
  {
    id: 'habit-2', 
    name: 'Meditation',
    smartGoal: '10 minutes of mindfulness practice',
    userId: 'user-123'
  },
  {
    id: 'habit-3',
    name: 'Reading',
    smartGoal: 'Read 20 pages of a book',
    userId: 'user-123'
  }
];

client.once('ready', () => {
  console.log('🤖 Enhanced Debug Bot connected!');
  console.log(`📊 Monitoring channel: ${ACCOUNTABILITY_CHANNEL_ID}`);
  console.log('🎯 Ready to analyze messages with habit matching...');
  console.log('📋 Mock habits loaded:', mockHabits.map(h => `${h.name} (${h.smartGoal})`));
});

client.on('messageCreate', async (message) => {
  console.log(`📨 Message received in channel ${message.channelId}: "${message.content}" from ${message.author.username}`);
  
  // Check if it's the accountability channel
  if (message.channelId === ACCOUNTABILITY_CHANNEL_ID) {
    console.log('✅ Message is in accountability channel!');
    
    // Skip bot messages
    if (message.author.bot) {
      console.log('🤖 Skipping bot message');
      return;
    }
    
    console.log('👤 Processing user message...');
    
    // Simple AI analysis
    const lowerContent = message.content.toLowerCase();
    console.log(`🔍 Analyzing content: "${lowerContent}"`);
    
    const proofIndicators = [
      'done', 'completed', 'finished', 'did', 'accomplished',
      'minutes', 'hours', 'reps', 'sets', 'km', 'miles',
      'proof', 'evidence', 'tracking', 'progress', 'sport', 'min'
    ];
    
    const hasProofIndicators = proofIndicators.some(indicator => {
      const found = lowerContent.includes(indicator);
      if (found) console.log(`✅ Found indicator: "${indicator}"`);
      return found;
    });
    
    if (hasProofIndicators) {
      console.log('✅ Message identified as proof!');
      
      // Extract unit
      const unitMatch = message.content.match(/(\d+(?:\.\d+)?)\s*(minutes?|hours?|reps?|sets?|km|miles?|kg|lbs?|min)/i);
      const unit = unitMatch ? `${unitMatch[1]} ${unitMatch[2]}` : '1 session';
      console.log(`📊 Extracted unit: "${unit}"`);
      
      // HABIT MATCHING LOGIC
      console.log('🎯 Starting habit matching...');
      const matchedHabit = matchHabitToContent(message.content, mockHabits);
      console.log(`🎯 Matched habit: ${matchedHabit.name} (${matchedHabit.smartGoal})`);
      
      // Check for minimal dose
      const isMinimalDose = lowerContent.includes('minimal') || lowerContent.includes('quick') || lowerContent.includes('just');
      console.log(`⭐ Minimal dose: ${isMinimalDose}`);
      
      // Check for cheat day
      const isCheatDay = lowerContent.includes('cheat') || lowerContent.includes('rest') || lowerContent.includes('break');
      console.log(`🎯 Cheat day: ${isCheatDay}`);
      
      const emoji = isMinimalDose ? '⭐' : isCheatDay ? '🎯' : '✅';
      console.log(`🎭 Selected emoji: ${emoji}`);
      
      try {
        console.log('🔄 Adding reaction...');
        // React to the message
        await message.react(emoji);
        console.log('✅ Reaction added successfully!');
        
        console.log('🔄 Sending reply...');
        // Send confirmation with habit info
        await message.reply({
          content: `${emoji} **Proof Automatically Detected!**\n\n📊 **Details:**\n• Unit: ${unit}\n• Type: ${isMinimalDose ? 'Minimal Dose' : isCheatDay ? 'Cheat Day' : 'Full Proof'}\n• Habit: ${matchedHabit.name}\n• AI Analysis: ✅`
        });
        console.log('✅ Reply sent successfully!');
        
        console.log('✅ Proof processed successfully!');
        
      } catch (error) {
        console.error('❌ Error processing proof:', error.message);
        console.error('❌ Full error:', error);
      }
    } else {
      console.log('ℹ️ Message not identified as proof');
    }
  } else {
    console.log(`❌ Message not in target channel (expected: ${ACCOUNTABILITY_CHANNEL_ID}, got: ${message.channelId})`);
  }
});

// Enhanced habit matching function
function matchHabitToContent(content, habits) {
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

client.on('error', (error) => {
  console.error('❌ Bot error:', error);
});

client.on('warn', (warning) => {
  console.warn('⚠️ Bot warning:', warning);
});

client.login(process.env.DISCORD_BOT_TOKEN).catch(error => {
  console.error('❌ Login failed:', error);
});
