/**
 * Test script to verify Profile Edit functionality
 * Tests with real Notion integration for user Marc
 */

import dotenv from 'dotenv';
import { NotionClient } from './src/notion/client';

// Load environment variables
dotenv.config();

async function testProfileEdit() {
  console.log('🧪 Testing Profile Edit Functionality\n');

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

  console.log('✅ Environment variables loaded\n');

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
    // Step 1: Get Marc's current profile
    console.log('📋 Step 1: Getting Marc\'s current profile...');
    const currentProfile = await notion.getUserProfileByDiscordId(marcDiscordId);
    
    if (!currentProfile) {
      console.error(`❌ Profile not found for Discord ID ${marcDiscordId}`);
      console.log('   Please make sure Marc has run /onboard command first');
      process.exit(1);
    }

    console.log('✅ Current profile found:');
    console.log(`   Profile ID: ${currentProfile.id}`);
    console.log(`   Personality Type: ${currentProfile.personalityType || 'Not set'}`);
    console.log(`   Core Values: ${currentProfile.coreValues?.join(', ') || 'Not set'}`);
    console.log(`   Life Vision: ${currentProfile.lifeVision ? currentProfile.lifeVision.substring(0, 50) + '...' : 'Not set'}`);
    console.log(`   Main Goals: ${currentProfile.mainGoals?.length || 0} goals`);
    console.log(`   Big Five Traits: ${currentProfile.bigFiveTraits || 'Not set'}\n`);

    // Step 2: Save original values for restoration
    const originalPersonalityType = currentProfile.personalityType;
    const originalCoreValues = currentProfile.coreValues ? [...currentProfile.coreValues] : [];
    
    // Step 3: Test updating one field (Personality Type)
    console.log('📝 Step 2: Testing profile update - changing Personality Type...');
    const testPersonalityType = originalPersonalityType === 'INTJ' ? 'ENFP' : 'INTJ';
    console.log(`   Changing from "${originalPersonalityType || 'Not set'}" to "${testPersonalityType}"\n`);

    const updatedProfile = await notion.updateUserProfile(marcDiscordId, {
      personalityType: testPersonalityType
    });

    if (!updatedProfile) {
      console.error('❌ Failed to update profile');
      process.exit(1);
    }

    console.log('✅ Profile updated successfully!');
    console.log(`   New Personality Type: ${updatedProfile.personalityType}\n`);

    // Step 4: Verify the change
    console.log('🔍 Step 3: Verifying the change...');
    const verifiedProfile = await notion.getUserProfileByDiscordId(marcDiscordId);
    
    if (!verifiedProfile) {
      console.error('❌ Could not retrieve profile after update');
      process.exit(1);
    }

    if (verifiedProfile.personalityType === testPersonalityType) {
      console.log('✅ VERIFICATION SUCCESSFUL!');
      console.log(`   Personality Type correctly updated to: ${verifiedProfile.personalityType}\n`);
    } else {
      console.error('❌ VERIFICATION FAILED!');
      console.error(`   Expected: ${testPersonalityType}`);
      console.error(`   Got: ${verifiedProfile.personalityType}`);
      process.exit(1);
    }

    // Step 5: Restore original value
    console.log('🔄 Step 4: Restoring original value...');
    if (originalPersonalityType) {
      const restoredProfile = await notion.updateUserProfile(marcDiscordId, {
        personalityType: originalPersonalityType
      });
      
      if (restoredProfile && restoredProfile.personalityType === originalPersonalityType) {
        console.log('✅ Original value restored successfully\n');
      } else {
        console.warn('⚠️  Could not restore original value - please update manually\n');
      }
    } else {
      // If it was not set, we can set it back to undefined by updating with empty
      console.log('   Original value was not set, leaving test value\n');
    }

    console.log('🎉 PROFILE EDIT TEST COMPLETE!');
    console.log('\n📝 Summary:');
    console.log('   ✅ Profile retrieval: Working');
    console.log('   ✅ Profile update: Working');
    console.log('   ✅ Change verification: Working');
    console.log('   ✅ Profile edit functionality is fully operational!\n');

  } catch (error) {
    console.error('\n❌ ERROR during test:');
    console.error('   Type:', error instanceof Error ? error.constructor.name : typeof error);
    console.error('   Message:', error instanceof Error ? error.message : String(error));
    
    if (error instanceof Error && error.stack) {
      console.error('   Stack trace:');
      console.error(error.stack);
    }
    
    process.exit(1);
  }
}

// Run the test
testProfileEdit().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

