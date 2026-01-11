/**
 * Quick script to check and update user status
 */

import dotenv from 'dotenv';
import { NotionClient } from './src/notion/client';

dotenv.config();

async function main() {
  const notion = new NotionClient(process.env.NOTION_TOKEN!, {
    users: process.env.NOTION_DATABASE_USERS!,
    habits: process.env.NOTION_DATABASE_HABITS!,
    proofs: process.env.NOTION_DATABASE_PROOFS!,
    learnings: process.env.NOTION_DATABASE_LEARNINGS!,
    hurdles: process.env.NOTION_DATABASE_HURDLES!,
    weeks: process.env.NOTION_DATABASE_WEEKS!,
    groups: process.env.NOTION_DATABASE_GROUPS!
  });

  // Get Marc's Discord ID from env
  const marcDiscordId = process.env.MARC_DISCORD_USER_ID;
  if (!marcDiscordId) {
    console.error('❌ MARC_DISCORD_USER_ID not set in environment');
    process.exit(1);
  }

  console.log(`🔍 Checking user status for Discord ID: ${marcDiscordId}\n`);

  try {
    const user = await notion.getUserByDiscordId(marcDiscordId);
    
    if (!user) {
      console.error('❌ User not found in Notion');
      process.exit(1);
    }

    console.log('📊 Current User Status:');
    console.log(`   Name: ${user.name}`);
    console.log(`   Discord ID: ${user.discordId}`);
    console.log(`   Status: ${user.status || 'undefined'} (should be 'active')`);
    console.log(`   Personal Channel: ${user.personalChannelId || 'not set'}\n`);

    if (user.status === 'pause') {
      console.log('⚠️  User is currently PAUSED');
      console.log('🔄 Activating user...\n');
      
      const updatedUser = await notion.updateUser(user.id, {
        status: 'active'
      });

      console.log('✅ User activated successfully!');
      console.log(`   New Status: ${updatedUser.status}\n`);
    } else if (!user.status || user.status !== 'active') {
      console.log('⚠️  User status is not "active"');
      console.log('🔄 Setting status to active...\n');
      
      const updatedUser = await notion.updateUser(user.id, {
        status: 'active'
      });

      console.log('✅ User status updated to active!');
      console.log(`   New Status: ${updatedUser.status}\n`);
    } else {
      console.log('✅ User is already active!\n');
    }

    // Verify Notion access by fetching some data
    console.log('🔍 Verifying Notion access...\n');
    
    const habits = await notion.getHabitsByUserId(user.id);
    console.log(`✅ Habits: ${habits.length} habits found`);

    const proofs = await notion.getProofsByUserId(user.id);
    console.log(`✅ Proofs: ${proofs.length} proofs found`);

    const learnings = await notion.getLearningsByDiscordId(marcDiscordId);
    console.log(`✅ Learnings: ${learnings.length} learnings found`);

    const hurdles = await notion.getHurdlesByDiscordId(marcDiscordId);
    console.log(`✅ Hurdles: ${hurdles.length} hurdles found\n`);

    console.log('✅ All Notion access checks passed!\n');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

main().catch(console.error);
