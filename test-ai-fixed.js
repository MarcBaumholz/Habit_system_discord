const { Client, GatewayIntentBits } = require('discord.js');
require('dotenv').config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// Set the correct channel ID
const ACCOUNTABILITY_CHANNEL_ID = '1420295931689173002';

client.once('ready', () => {
  console.log('🤖 Bot connected with AI analysis!');
  console.log(`📊 Monitoring channel: ${ACCOUNTABILITY_CHANNEL_ID}`);
  console.log('🎯 Send messages like "30 min sport" to test AI analysis');
});

client.on('messageCreate', async (message) => {
  // Only analyze messages in the accountability group
  if (message.channelId === ACCOUNTABILITY_CHANNEL_ID) {
    console.log(`📨 Message detected: "${message.content}" from ${message.author.username}`);
    
    // Skip bot messages
    if (message.author.bot) return;
    
    // Simple AI analysis
    const lowerContent = message.content.toLowerCase();
    const proofIndicators = [
      'done', 'completed', 'finished', 'did', 'accomplished',
      'minutes', 'hours', 'reps', 'sets', 'km', 'miles',
      'proof', 'evidence', 'tracking', 'progress', 'sport', 'min'
    ];
    
    const hasProofIndicators = proofIndicators.some(indicator => 
      lowerContent.includes(indicator)
    );
    
    if (hasProofIndicators) {
      console.log('✅ Message identified as proof!');
      
      // Extract unit
      const unitMatch = message.content.match(/(\d+(?:\.\d+)?)\s*(minutes?|hours?|reps?|sets?|km|miles?|kg|lbs?|min)/i);
      const unit = unitMatch ? `${unitMatch[1]} ${unitMatch[2]}` : '1 session';
      
      // Check for minimal dose
      const isMinimalDose = lowerContent.includes('minimal') || lowerContent.includes('quick') || lowerContent.includes('just');
      
      // Check for cheat day
      const isCheatDay = lowerContent.includes('cheat') || lowerContent.includes('rest') || lowerContent.includes('break');
      
      const emoji = isMinimalDose ? '⭐' : isCheatDay ? '🎯' : '✅';
      
      try {
        // React to the message
        await message.react(emoji);
        
        // Send confirmation
        await message.reply({
          content: `${emoji} **Proof Automatically Detected!**\n\n📊 **Details:**\n• Unit: ${unit}\n• Type: ${isMinimalDose ? 'Minimal Dose' : isCheatDay ? 'Cheat Day' : 'Full Proof'}\n• AI Analysis: ✅`
        });
        
        console.log('✅ Proof processed successfully!');
        
      } catch (error) {
        console.error('❌ Error processing proof:', error.message);
      }
    } else {
      console.log('ℹ️ Message not identified as proof');
    }
  }
});

client.login(process.env.DISCORD_BOT_TOKEN);
