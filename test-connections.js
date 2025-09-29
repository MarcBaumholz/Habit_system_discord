// Test script to verify Discord and Notion connections
const { Client, GatewayIntentBits } = require('discord.js');
const { Client: NotionClient } = require('@notionhq/client');
require('dotenv').config();

async function testConnections() {
  console.log('🔍 Testing Discord and Notion connections...\n');

  // Test Discord Connection
  console.log('1. Testing Discord Connection...');
  try {
    const discordClient = new Client({
      intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages]
    });

    discordClient.once('ready', () => {
      console.log('✅ Discord: Bot is ready!');
      console.log(`   Logged in as: ${discordClient.user.tag}`);
      console.log(`   Bot ID: ${discordClient.user.id}`);
      
      // Test guild access
      const guild = discordClient.guilds.cache.get(process.env.DISCORD_GUILD_ID);
      if (guild) {
        console.log(`✅ Discord: Guild access confirmed - ${guild.name}`);
      } else {
        console.log('❌ Discord: Guild not found or no access');
      }
      
      discordClient.destroy();
    });

    await discordClient.login(process.env.DISCORD_BOT_TOKEN);
    
    // Wait a bit for the ready event
    await new Promise(resolve => setTimeout(resolve, 2000));
    
  } catch (error) {
    console.log('❌ Discord: Connection failed');
    console.log(`   Error: ${error.message}`);
  }

  console.log('\n2. Testing Notion Connection...');
  try {
    const notion = new NotionClient({ auth: process.env.NOTION_TOKEN });
    
    // Test Users database
    console.log('   Testing Users database...');
    const usersResponse = await notion.databases.query({
      database_id: process.env.NOTION_DATABASE_USERS
    });
    console.log(`✅ Notion: Users database accessible (${usersResponse.results.length} entries)`);
    
    // Test Habits database
    console.log('   Testing Habits database...');
    const habitsResponse = await notion.databases.query({
      database_id: process.env.NOTION_DATABASE_HABITS
    });
    console.log(`✅ Notion: Habits database accessible (${habitsResponse.results.length} entries)`);
    
    // Test Proofs database
    console.log('   Testing Proofs database...');
    const proofsResponse = await notion.databases.query({
      database_id: process.env.NOTION_DATABASE_PROOFS
    });
    console.log(`✅ Notion: Proofs database accessible (${proofsResponse.results.length} entries)`);
    
    console.log('✅ Notion: All databases accessible!');
    
  } catch (error) {
    console.log('❌ Notion: Connection failed');
    console.log(`   Error: ${error.message}`);
    
    if (error.code === 'unauthorized') {
      console.log('   💡 Check your NOTION_TOKEN in .env file');
    } else if (error.code === 'object_not_found') {
      console.log('   💡 Check your database IDs in .env file');
    }
  }

  console.log('\n3. Environment Variables Check...');
  const requiredVars = [
    'DISCORD_BOT_TOKEN',
    'DISCORD_CLIENT_ID', 
    'DISCORD_GUILD_ID',
    'NOTION_TOKEN',
    'NOTION_DATABASE_USERS',
    'NOTION_DATABASE_HABITS',
    'NOTION_DATABASE_PROOFS'
  ];

  let allVarsPresent = true;
  requiredVars.forEach(varName => {
    if (process.env[varName]) {
      console.log(`✅ ${varName}: Set`);
    } else {
      console.log(`❌ ${varName}: Missing`);
      allVarsPresent = false;
    }
  });

  if (allVarsPresent) {
    console.log('✅ All required environment variables are set');
  } else {
    console.log('❌ Some environment variables are missing');
  }

  console.log('\n🔧 Discord Permission Issue:');
  console.log('The "Missing Access" error means the bot needs proper permissions.');
  console.log('To fix:');
  console.log('1. Go to Discord Server Settings → Integrations');
  console.log('2. Find your bot and ensure it has "Use Slash Commands" permission');
  console.log('3. The bot should work even without this permission for basic commands');
}

testConnections().catch(console.error);