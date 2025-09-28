const { NotionClient } = require('./dist/notion/client');

async function testHurdles() {
  console.log('🧪 Testing Hurdles Functionality...\n');

  try {
    // Initialize Notion client
    const notion = new NotionClient(process.env.NOTION_TOKEN, {
      users: process.env.NOTION_DATABASE_USERS,
      habits: process.env.NOTION_DATABASE_HABITS,
      proofs: process.env.NOTION_DATABASE_PROOFS,
      learnings: process.env.NOTION_DATABASE_LEARNINGS,
      hurdles: process.env.NOTION_DATABASE_HURDLES,
      weeks: process.env.NOTION_DATABASE_WEEKS,
      groups: process.env.NOTION_DATABASE_GROUPS
    });

    console.log('✅ Notion client initialized');
    console.log('📊 Hurdles database ID:', process.env.NOTION_DATABASE_HURDLES);

    // Test creating a hurdle
    const testHurdle = {
      userId: '278d42a1-faf5-8176-9a84-ec4ae5c130ef', // Use existing user ID
      habitId: undefined, // Optional
      name: 'Test Hurdle - Time Management',
      hurdleType: 'Time Management',
      description: 'This is a test hurdle to verify the system works correctly.',
      date: new Date().toISOString().split('T')[0]
    };

    console.log('\n🔍 Creating test hurdle...');
    console.log('Data:', testHurdle);

    const createdHurdle = await notion.createHurdle(testHurdle);
    
    console.log('✅ Hurdle created successfully!');
    console.log('📝 Hurdle ID:', createdHurdle.id);
    console.log('📝 Hurdle Name:', createdHurdle.name);
    console.log('📝 Hurdle Type:', createdHurdle.hurdleType);
    console.log('📝 Description:', createdHurdle.description);
    console.log('📝 Date:', createdHurdle.date);

    console.log('\n🎉 Hurdles functionality is working correctly!');

  } catch (error) {
    console.error('❌ Error testing hurdles:', error);
    console.error('Error details:', error.message);
  }
}

// Load environment variables
require('dotenv').config();

// Run the test
testHurdles();

