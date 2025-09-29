// Send startup message to Discord channel
const { Client, GatewayIntentBits } = require('discord.js');
require('dotenv').config();

async function sendStartupMessage() {
  console.log('🤖 Sending startup message to Discord...');

  const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages]
  });

  client.once('ready', async () => {
    console.log(`Bot is ready! Logged in as ${client.user.tag}`);
    
    try {
      // Try to find the main channel
      const guild = client.guilds.cache.get(process.env.DISCORD_GUILD_ID);
      if (!guild) {
        console.log('❌ Guild not found');
        return;
      }

      console.log(`✅ Found guild: ${guild.name}`);
      
      // List all channels
      console.log('📋 Available channels:');
      guild.channels.cache.forEach((channel, id) => {
        if (channel.type === 0) { // Text channels
          console.log(`   - ${channel.name} (ID: ${id})`);
        }
      });

      // Try to send message to the first text channel
      const textChannels = guild.channels.cache.filter(channel => channel.type === 0);
      const firstChannel = textChannels.first();
      
      if (firstChannel) {
        const startupMessage = `🤖 **Discord Habit System is Online!**

🎯 **Available Commands:**
• \`/join\` - Register in the habit tracking system
• \`/habit add\` - Create your keystone habits
• \`/proof\` - Submit daily proof with measurement
• \`/summary\` - Get your weekly progress summary
• \`/learning\` - Share insights with the community

📋 **Channel Guide:**
• **#learnings-feed** - Share insights and learnings
• **#weekly-reviews** - Weekly progress and group summaries
• **#accountability-group-1** - Social accountability and group support

🚀 **Get Started:**
1. Use \`/join\` to register in the system
2. Use \`/habit add\` to create your first keystone habit
3. Use \`/proof\` daily to track your progress
4. Share learnings with \`/learning\` to help the community

💪 **Ready for your 66-day habit challenge!**`;

        await firstChannel.send(startupMessage);
        console.log(`✅ Startup message sent to #${firstChannel.name}`);
      } else {
        console.log('❌ No text channels found');
      }
      
    } catch (error) {
      console.error('❌ Error sending startup message:', error);
    } finally {
      client.destroy();
    }
  });

  try {
    await client.login(process.env.DISCORD_BOT_TOKEN);
  } catch (error) {
    console.error('❌ Failed to login:', error);
  }
}

sendStartupMessage().catch(console.error);