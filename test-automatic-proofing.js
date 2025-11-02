#!/usr/bin/env node
/**
 * Test Automatic Proofing - Query User and Habits
 * This script queries the first user from the database and displays their habits
 * to help debug the automatic proofing matching issue for jonesMCL
 */

require('dotenv').config();
const { NotionClient } = require('./dist/notion/client');

async function testAutomaticProofing() {
  console.log('🔍 Testing Automatic Proofing System\n');
  console.log('='.repeat(60));

  try {
    // Initialize Notion client
    const notion = new NotionClient(process.env.NOTION_TOKEN, {
      users: process.env.NOTION_DATABASE_USERS,
      habits: process.env.NOTION_DATABASE_HABITS,
      proofs: process.env.NOTION_DATABASE_PROOFS,
      learnings: process.env.NOTION_DATABASE_LEARNINGS,
      hurdles: process.env.NOTION_DATABASE_HURDLES,
      weeks: process.env.NOTION_DATABASE_WEEKS,
      groups: process.env.NOTION_DATABASE_GROUPS,
      personality: process.env.NOTION_DATABASE_PERSONALITY
    });

    // Get first user from database
    console.log('\n📊 Fetching users from database...');
    const allUsers = await notion.getAllUsers();
    
    if (allUsers.length === 0) {
      console.log('❌ No users found in database');
      return;
    }

    console.log(`✅ Found ${allUsers.length} users in database\n`);
    
    // List all users for reference
    console.log('📋 All users in database:');
    allUsers.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.name} (Discord ID: ${user.discordId})`);
    });
    console.log('');
    
    // Find jonesMCL/jonas user (checking name variations)
    let testUser = allUsers.find(u => 
      u.name.toLowerCase().includes('jones') || 
      u.name.toLowerCase().includes('jonas') ||
      u.name.toLowerCase().includes('jonesmcl') ||
      u.discordId === 'jonesMCL' // Also check Discord ID if it matches
    );
    
    // If not found, use first user
    if (!testUser) {
      console.log('⚠️  jonesMCL/jonas not found, using first user');
      testUser = allUsers[0];
    } else {
      console.log(`✅ Found target user: ${testUser.name}`);
    }
    console.log('👤 First User (Test User):');
    console.log(`   Name: ${testUser.name}`);
    console.log(`   Discord ID: ${testUser.discordId}`);
    console.log(`   Notion ID: ${testUser.id}`);
    console.log(`   Timezone: ${testUser.timezone}`);

    // Get habits for this user
    console.log('\n📋 Fetching habits for user...');
    const habits = await notion.getHabitsByUserId(testUser.id);

    if (habits.length === 0) {
      console.log('❌ No habits found for this user');
      return;
    }

    console.log(`✅ Found ${habits.length} habits:\n`);
    habits.forEach((habit, index) => {
      console.log(`   Habit ${index + 1}:`);
      console.log(`      Name: "${habit.name}"`);
      console.log(`      ID: ${habit.id}`);
      console.log(`      Frequency: ${habit.frequency}x per week`);
      console.log(`      Domains: ${habit.domains.join(', ') || 'none'}`);
      console.log(`      Context: ${habit.context || 'none'}`);
      console.log(`      Minimal Dose: ${habit.minimalDose || 'none'}`);
      console.log('');
    });

    // Test matching with different AI classification results
    console.log('\n🧪 Testing Habit Matching Strategies:\n');
    console.log('='.repeat(60));

    // Simulate what AI might return for different messages
    const aiClassifications = [
      'lesen',
      'reading',
      '25 min lesen',
      '25 min reading',
      'Lesen',
      'Reading'
    ];

    console.log('\n📝 Testing different matching strategies:\n');
    
    for (const classifiedName of aiClassifications) {
      console.log(`AI Classified: "${classifiedName}"`);
      
      const normalized = classifiedName.trim().toLowerCase();
      
      // Strategy 1: Exact match
      const exactMatch = habits.find(h => 
        h.name.trim().toLowerCase() === normalized
      );
      
      // Strategy 2: Partial match
      const partialMatch = habits.find(h => {
        const hLower = h.name.trim().toLowerCase();
        return hLower.includes(normalized) || normalized.includes(hLower);
      });

      // Strategy 3: Word-based match
      const words = normalized.split(/\s+/).filter(w => w.length > 2);
      const wordMatch = habits.find(h => {
        const habitWords = h.name.toLowerCase().split(/\s+/).filter(w => w.length > 2);
        return words.some(word => 
          habitWords.some(hw => hw.includes(word) || word.includes(hw))
        );
      });

      if (exactMatch) {
        console.log(`   ✅ Exact match: "${exactMatch.name}"`);
      } else if (partialMatch) {
        console.log(`   ✅ Partial match: "${partialMatch.name}"`);
      } else if (wordMatch) {
        console.log(`   ✅ Word-based match: "${wordMatch.name}"`);
      } else {
        console.log(`   ❌ No match found`);
        console.log(`      Available habits: ${habits.map(h => `"${h.name}"`).join(', ')}`);
      }
      console.log('');
    }

    console.log('='.repeat(60));
    console.log('\n✅ Test completed successfully!');
    console.log('\n💡 Next steps:');
    console.log('   1. Review the habit names above');
    console.log('   2. Check which messages would match which habits');
    console.log('   3. Improve matchHabit function to handle these cases');

  } catch (error) {
    console.error('\n❌ Error during test:');
    console.error(error);
    if (error.stack) {
      console.error(error.stack);
    }
  }
}

// Run the test
testAutomaticProofing().catch(console.error);

