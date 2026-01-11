/**
 * Test script to verify Personality DB saving functionality
 * Tests with real Notion integration for user klumpenklarmarc
 */

import dotenv from 'dotenv';
import { NotionClient } from './src/notion/client';

// Load environment variables
dotenv.config();

async function testPersonalityDBSave() {
  console.log('🧪 Testing Personality DB Save Functionality\n');

  // Verify environment variables
  if (!process.env.NOTION_TOKEN) {
    console.error('❌ NOTION_TOKEN is not set in .env file');
    process.exit(1);
  }

  if (!process.env.NOTION_DATABASE_PERSONALITY) {
    console.error('❌ NOTION_DATABASE_PERSONALITY is not set in .env file');
    process.exit(1);
  }

  if (!process.env.NOTION_DATABASE_USERS) {
    console.error('❌ NOTION_DATABASE_USERS is not set in .env file');
    process.exit(1);
  }

  console.log('✅ Environment variables loaded');
  console.log(`   Personality DB ID: ${process.env.NOTION_DATABASE_PERSONALITY}`);
  console.log(`   Users DB ID: ${process.env.NOTION_DATABASE_USERS}\n`);

  // Initialize Notion client
  const notion = new NotionClient(process.env.NOTION_TOKEN!, {
    users: process.env.NOTION_DATABASE_USERS!,
    habits: process.env.NOTION_DATABASE_HABITS || '',
    proofs: process.env.NOTION_DATABASE_PROOFS || '',
    learnings: process.env.NOTION_DATABASE_LEARNINGS || '',
    hurdles: process.env.NOTION_DATABASE_HURDLES || '',
    weeks: process.env.NOTION_DATABASE_WEEKS || '',
    groups: process.env.NOTION_DATABASE_GROUPS || '',
    personality: process.env.NOTION_DATABASE_PERSONALITY!
  });

  // Marc's Discord ID
  const marcDiscordId = '383324294731661312';

  try {
    // Step 1: Get Marc's user from Users DB
    console.log('📋 Step 1: Looking up Marc in Users DB...');
    const user = await notion.getUserByDiscordId(marcDiscordId);
    
    if (!user) {
      console.error(`❌ User with Discord ID ${marcDiscordId} not found in Users DB`);
      console.log('   Please make sure Marc has run /join command first');
      process.exit(1);
    }

    console.log(`✅ Found user: ${user.name} (ID: ${user.id})\n`);

    // Step 2: Check if profile already exists
    console.log('📋 Step 2: Checking if profile already exists...');
    const existingProfile = await notion.getUserProfileByDiscordId(marcDiscordId);
    
    if (existingProfile) {
      console.log('⚠️  Profile already exists!');
      console.log(`   Profile ID: ${existingProfile.id}`);
      console.log(`   Personality Type: ${existingProfile.personalityType || 'Not set'}`);
      console.log(`   Core Values: ${existingProfile.coreValues?.join(', ') || 'Not set'}`);
      console.log(`   Life Vision: ${existingProfile.lifeVision ? existingProfile.lifeVision.substring(0, 50) + '...' : 'Not set'}`);
      console.log('\n   To test saving, you may want to delete this profile first or update it.\n');
    } else {
      console.log('✅ No existing profile found (good for testing)\n');
    }

    // Step 3: Test creating a profile
    console.log('📋 Step 3: Testing profile creation...');
    console.log('   Creating test profile with sample data...\n');

    const testProfile = {
      discordId: marcDiscordId,
      user: user,
      joinDate: new Date().toISOString().split('T')[0],
      personalityType: 'INTJ',
      coreValues: ['Test Value 1', 'Test Value 2', 'Test Value 3'],
      lifeVision: 'This is a test profile created to verify the Personality DB saving functionality works correctly.',
      mainGoals: [
        'Test Goal 1',
        'Test Goal 2',
        'Test Goal 3'
      ],
      bigFiveTraits: JSON.stringify({
        openness: 0.8,
        conscientiousness: 0.9,
        extraversion: 0.5,
        agreeableness: 0.7,
        neuroticism: 0.3
      }),
      lifeDomains: ['Health', 'Career', 'Relationships'],
      lifePhase: 'Early Career',
      desiredIdentity: 'I want to be a successful test subject',
      openSpace: 'This is a test entry created by the test script to verify functionality.'
    };

    console.log('   Profile data to save:');
    console.log(`   - Personality Type: ${testProfile.personalityType}`);
    console.log(`   - Core Values: ${testProfile.coreValues.join(', ')}`);
    console.log(`   - Life Vision: ${testProfile.lifeVision.substring(0, 50)}...`);
    console.log(`   - Main Goals: ${testProfile.mainGoals.length} goals`);
    console.log(`   - Life Domains: ${testProfile.lifeDomains.join(', ')}`);
    console.log(`   - Life Phase: ${testProfile.lifePhase}`);
    console.log(`   - Desired Identity: ${testProfile.desiredIdentity.substring(0, 50)}...\n`);

    const createdProfile = await notion.createUserProfile(testProfile);
    
    console.log('✅ Profile created successfully!');
    console.log(`   Profile ID: ${createdProfile.id}`);
    console.log(`   Discord ID: ${createdProfile.discordId}`);
    console.log(`\n🎉 SUCCESS! Profile saved to Personality DB!\n`);
    
    console.log('📝 Next steps:');
    console.log('   1. Check your Notion Personality DB to see the new entry');
    console.log('   2. If you see it, the saving functionality is working correctly!');
    console.log('   3. You can delete this test entry if desired\n');

  } catch (error) {
    console.error('\n❌ ERROR during test:');
    console.error('   Type:', error instanceof Error ? error.constructor.name : typeof error);
    console.error('   Message:', error instanceof Error ? error.message : String(error));
    
    if (error instanceof Error) {
      if (error.message.includes('Could not find database')) {
        console.error('\n💡 SOLUTION:');
        console.error('   The Personality Database may not be shared with your Notion integration.');
        console.error('   Steps to fix:');
        console.error('   1. Go to your Personality DB in Notion');
        console.error('   2. Click "Share" button');
        console.error('   3. Add your integration (Discord Habit System)');
        console.error('   4. Give it "Can edit" permissions');
        console.error('   5. Run this test again\n');
      } else if (error.message.includes('is a page, not a database')) {
        console.error('\n💡 SOLUTION:');
        console.error('   NOTION_DATABASE_PERSONALITY is pointing to a PAGE, not a DATABASE.');
        console.error('   You need the Database ID, not the Page ID.');
        console.error('   To get the Database ID:');
        console.error('   1. Open the database in Notion');
        console.error('   2. Look at the URL - the Database ID is the long string before the ?');
        console.error('   3. Update NOTION_DATABASE_PERSONALITY in your .env file\n');
      } else if (error.message.includes('body failed validation')) {
        console.error('\n💡 SOLUTION:');
        console.error('   The database properties may not match what the code expects.');
        console.error('   Check that your Personality DB has these exact properties:');
        console.error('   - Discord ID (Title)');
        console.error('   - User (Relation to Users DB)');
        console.error('   - Join Date (Date)');
        console.error('   - Personality T... (Select)');
        console.error('   - Core Values (Multi-select)');
        console.error('   - Life Vision (Rich text)');
        console.error('   - Main Goals (Rich text)');
        console.error('   - Big five traits (Rich text)');
        console.error('   - Life domains (Multi-select)');
        console.error('   - Life Phase (Select)');
        console.error('   - Desired Identity (Rich text)');
        console.error('   - Open Space (Rich text)\n');
      }
      
      if (error.stack) {
        console.error('   Stack trace:');
        console.error(error.stack);
      }
    }
    
    process.exit(1);
  }
}

// Run the test
testPersonalityDBSave().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

