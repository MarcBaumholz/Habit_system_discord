const { NotionClient } = require('./src/notion/client.ts');
const { ChannelHandlers } = require('./src/bot/channel-handlers.ts');
require('dotenv').config();

async function testLearningFunctionality() {
  console.log('🧪 Testing Learning Functionality...\n');

  try {
    // Initialize Notion client
    const notion = new NotionClient(process.env.NOTION_TOKEN, {
      users: process.env.NOTION_DATABASE_USERS,
      habits: process.env.NOTION_DATABASE_HABITS,
      proofs: process.env.NOTION_DATABASE_PROOFS,
      learnings: process.env.NOTION_DATABASE_LEARNINGS,
      weeks: process.env.NOTION_DATABASE_WEEKS,
      groups: process.env.NOTION_DATABASE_GROUPS
    });

    console.log('✅ Notion client initialized');

    // Test 1: Check if we can create a learning entry
    console.log('\n📝 Test 1: Creating a learning entry...');
    
    const testLearning = {
      userId: 'test-user-id', // This would be a real user ID
      habitId: 'test-habit-id', // This would be a real habit ID
      text: 'Test learning: I discovered that doing 5 minutes of meditation in the morning helps me stay focused throughout the day.',
      createdAt: new Date().toISOString()
    };

    try {
      const learning = await notion.createLearning(testLearning);
      console.log('✅ Learning created successfully:', learning.id);
    } catch (error) {
      console.log('❌ Learning creation failed:', error.message);
      console.log('This might be expected if the user/habit IDs don\'t exist in Notion');
    }

    // Test 2: Check Discord channel handlers
    console.log('\n📢 Test 2: Testing Discord channel handlers...');
    
    const channelHandlers = new ChannelHandlers();
    
    try {
      // This would normally post to Discord, but we'll just test the method exists
      console.log('✅ Channel handlers initialized');
      console.log('📋 Available methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(channelHandlers)));
    } catch (error) {
      console.log('❌ Channel handlers failed:', error.message);
    }

    // Test 3: Check Notion database structure
    console.log('\n🗄️ Test 3: Checking Notion database structure...');
    
    try {
      // Try to query the learnings database
      const response = await notion.client.databases.query({
        database_id: process.env.NOTION_DATABASE_LEARNINGS
      });
      
      console.log('✅ Learnings database accessible');
      console.log('📊 Database has', response.results.length, 'existing entries');
      
      if (response.results.length > 0) {
        const firstEntry = response.results[0];
        console.log('📝 Sample entry properties:', Object.keys(firstEntry.properties));
      }
    } catch (error) {
      console.log('❌ Database query failed:', error.message);
    }

    console.log('\n🎯 Learning functionality test completed!');
    console.log('\n💡 Next steps:');
    console.log('1. Make sure you have a user created with /join');
    console.log('2. Create a habit with /habit add');
    console.log('3. Try /learning command in Discord');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testLearningFunctionality();
