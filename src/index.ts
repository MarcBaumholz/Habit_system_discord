import dotenv from 'dotenv';
import { HabitBot } from './bot/bot';
import { NotionClient } from './notion/client';

// Load environment variables
dotenv.config();

async function main() {
  // Validate required environment variables
  const requiredEnvVars = [
    'DISCORD_BOT_TOKEN',
    'DISCORD_CLIENT_ID',
    'DISCORD_GUILD_ID',
    'NOTION_TOKEN',
    'NOTION_DATABASE_USERS',
    'NOTION_DATABASE_HABITS',
    'NOTION_DATABASE_PROOFS',
    'NOTION_DATABASE_LEARNINGS',
    'NOTION_DATABASE_HURDLES',
    'NOTION_DATABASE_WEEKS',
    'NOTION_DATABASE_GROUPS',
    'NOTION_DATABASE_PERSONALITY',
    'DISCORD_PERSONAL_CHANNEL',
    'DISCORD_ACCOUNTABILITY_GROUP',
    'DISCORD_TOOLS',
    'DISCORD_INFO_CHANNEL',
    'PERPLEXITY_API_KEY'
  ];

  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      console.error(`Missing required environment variable: ${envVar}`);
      process.exit(1);
    }
  }

  // Initialize Notion client
  const notion = new NotionClient(process.env.NOTION_TOKEN!, {
    users: process.env.NOTION_DATABASE_USERS!,
    habits: process.env.NOTION_DATABASE_HABITS!,
    proofs: process.env.NOTION_DATABASE_PROOFS!,
    learnings: process.env.NOTION_DATABASE_LEARNINGS!,
    hurdles: process.env.NOTION_DATABASE_HURDLES!,
    weeks: process.env.NOTION_DATABASE_WEEKS!,
    groups: process.env.NOTION_DATABASE_GROUPS!,
    personality: process.env.NOTION_DATABASE_PERSONALITY!
  });

  // Initialize and start bot
  const bot = new HabitBot(notion);
  
  try {
    // Register slash commands
    await bot.registerCommands(
      process.env.DISCORD_BOT_TOKEN!,
      process.env.DISCORD_CLIENT_ID!,
      process.env.DISCORD_GUILD_ID!
    );

    // Start the bot
    await bot.start(process.env.DISCORD_BOT_TOKEN!);
  } catch (error) {
    console.error('Failed to start bot:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('Shutting down gracefully...');
  process.exit(0);
});

main().catch(console.error);
