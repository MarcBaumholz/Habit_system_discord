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

client.once('ready', () => {
  console.log('🤖 Debug Bot connected!');
  console.log(`📊 Monitoring channel: ${ACCOUNTABILITY_CHANNEL_ID}`);
  console.log('🎯 Ready to analyze messages...');
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
        // Send confirmation
        await message.reply({
          content: `${emoji} **Proof Automatically Detected!**\n\n📊 **Details:**\n• Unit: ${unit}\n• Type: ${isMinimalDose ? 'Minimal Dose' : isCheatDay ? 'Cheat Day' : 'Full Proof'}\n• AI Analysis: ✅`
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

client.on('error', (error) => {
  console.error('❌ Bot error:', error);
});

client.on('warn', (warning) => {
  console.warn('⚠️ Bot warning:', warning);
});

client.login(process.env.DISCORD_BOT_TOKEN).catch(error => {
  console.error('❌ Login failed:', error);
});
