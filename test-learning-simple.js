const { Client } = require('@notionhq/client');
require('dotenv').config();

async function testLearningFunctionality() {
  console.log('🧪 Testing Learning Functionality...\n');

  try {
    // Initialize Notion client directly
    const notion = new Client({ auth: process.env.NOTION_TOKEN });
    
    console.log('✅ Notion client initialized');

    // Test 1: Check learnings database structure
    console.log('\n📝 Test 1: Checking learnings database...');
    
    try {
      const response = await notion.databases.query({
        database_id: process.env.NOTION_DATABASE_LEARNINGS
      });
      
      console.log('✅ Learnings database accessible');
      console.log('📊 Database has', response.results.length, 'existing entries');
      
      if (response.results.length > 0) {
        const firstEntry = response.results[0];
        console.log('📝 Sample entry properties:', Object.keys(firstEntry.properties));
        
        // Show the structure of a learning entry
        const properties = firstEntry.properties;
        console.log('\n📋 Learning entry structure:');
        console.log('- User:', properties['User'] ? 'Relation exists' : 'No relation');
        console.log('- Habit:', properties['Habit'] ? 'Relation exists' : 'No relation');
        console.log('- Text:', properties['Text'] ? 'Text exists' : 'No text');
        console.log('- Created At:', properties['Created At'] ? 'Date exists' : 'No date');
      }
    } catch (error) {
      console.log('❌ Database query failed:', error.message);
    }

    // Test 2: Check if we can create a learning entry (this will likely fail due to missing relations)
    console.log('\n📝 Test 2: Attempting to create a learning entry...');
    
    try {
      const testLearning = {
        parent: { database_id: process.env.NOTION_DATABASE_LEARNINGS },
        properties: {
          'User': { relation: [{ id: 'fake-user-id' }] },
          'Habit': { relation: [{ id: 'fake-habit-id' }] },
          'Text': { rich_text: [{ text: { content: 'Test learning: This is a test learning entry.' } }] },
          'Created At': { date: { start: new Date().toISOString() } }
        }
      };

      const learning = await notion.pages.create(testLearning);
      console.log('✅ Learning created successfully:', learning.id);
    } catch (error) {
      console.log('❌ Learning creation failed (expected):', error.message);
      console.log('This is expected because the user/habit IDs don\'t exist');
    }

    // Test 3: Check Discord bot status
    console.log('\n🤖 Test 3: Checking Discord bot status...');
    
    try {
      const { exec } = require('child_process');
      exec('ps aux | grep "ts-node src/index.ts" | grep -v grep', (error, stdout, stderr) => {
        if (stdout.trim()) {
          console.log('✅ Discord bot is running');
          console.log('📊 Bot process:', stdout.trim());
        } else {
          console.log('❌ Discord bot is not running');
        }
      });
    } catch (error) {
      console.log('❌ Could not check bot status:', error.message);
    }

    console.log('\n🎯 Learning functionality test completed!');
    console.log('\n💡 To test the learning command:');
    console.log('1. Make sure the Discord bot is running');
    console.log('2. Use /join command first to create a user');
    console.log('3. Use /habit add to create a habit');
    console.log('4. Use /learning "Your learning text here" to test');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testLearningFunctionality();
