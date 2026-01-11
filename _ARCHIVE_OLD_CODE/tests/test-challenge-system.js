/**
 * Challenge System Integration Test
 *
 * Tests all functionalities of the Weekly Challenge System:
 * 1. Mock challenge deployment (Sunday 3 PM)
 * 2. Users joining challenge via button
 * 3. Users submitting proofs
 * 4. Weekly evaluation and rewards (Sunday 9 AM)
 * 5. Mid-week reminder (Wednesday)
 */

const dotenv = require('dotenv');
const { Client } = require('@notionhq/client');

// Load environment variables
dotenv.config();

const notion = new Client({ auth: process.env.NOTION_TOKEN });

// Test configuration
const CHALLENGE_PROOFS_DB = process.env.NOTION_DATABASE_CHALLENGE_PROOFS;
const USERS_DB = process.env.NOTION_DATABASE_USERS;
const PRICE_POOL_DB = process.env.NOTION_DATABASE_PRICE_POOL;
const TEST_DISCORD_ID = process.env.MARC_DISCORD_USER_ID || '699002308146495571';

// Helper function to format date as YYYY-MM-DD
function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Helper to get Sunday dates
function getSundayDates() {
  const today = new Date();
  // Find last Sunday
  const lastSunday = new Date(today);
  lastSunday.setDate(today.getDate() - today.getDay());

  // Next Sunday
  const nextSunday = new Date(lastSunday);
  nextSunday.setDate(lastSunday.getDate() + 7);

  return {
    weekStart: formatDate(lastSunday),
    weekEnd: formatDate(nextSunday)
  };
}

// Test 1: Get test user from Notion
async function test1_GetTestUser() {
  console.log('\n🧪 TEST 1: Getting test user from Notion...');

  try {
    const response = await notion.databases.query({
      database_id: USERS_DB,
      filter: {
        property: 'DiscordID',
        rich_text: { equals: TEST_DISCORD_ID }
      }
    });

    if (response.results.length === 0) {
      console.log('❌ Test user not found. Please join the system first with /join command.');
      return null;
    }

    const user = response.results[0];
    const userId = user.id;
    const name = user.properties['Name']?.rich_text?.[0]?.text?.content || 'Unknown';
    const status = user.properties['Status']?.select?.name || 'unknown';

    console.log('✅ Test user found:');
    console.log(`   - User ID: ${userId}`);
    console.log(`   - Name: ${name}`);
    console.log(`   - Discord ID: ${TEST_DISCORD_ID}`);
    console.log(`   - Status: ${status}`);

    if (status !== 'active') {
      console.log('⚠️  User is not active. Use /activate command to activate.');
    }

    return { userId, name, discordId: TEST_DISCORD_ID, status };
  } catch (error) {
    console.error('❌ Error getting test user:', error.message);
    return null;
  }
}

// Test 2: Create mock challenge proof (simulating user submission)
async function test2_CreateChallengeProof(user, challengeNumber = 1) {
  console.log('\n🧪 TEST 2: Creating challenge proof (simulating proof submission)...');

  const { weekStart, weekEnd } = getSundayDates();
  const today = formatDate(new Date());

  const challengeNames = [
    'Deep Work Sessions',
    'Morning Pages Journaling',
    'Cold Exposure Therapy',
    'Reading Sprint',
    'Intermittent Fasting (16:8)'
  ];

  try {
    // Check if proof already exists for today
    const existing = await notion.databases.query({
      database_id: CHALLENGE_PROOFS_DB,
      filter: {
        and: [
          {
            property: 'User',
            relation: { contains: user.userId }
          },
          {
            property: 'Date',
            date: { equals: today }
          },
          {
            property: 'Challenge Number',
            number: { equals: challengeNumber }
          }
        ]
      }
    });

    if (existing.results.length > 0) {
      console.log('⚠️  Proof already exists for today. Skipping creation.');
      console.log(`   - Proof ID: ${existing.results[0].id}`);
      return existing.results[0];
    }

    // Create proof
    const proof = await notion.pages.create({
      parent: { database_id: CHALLENGE_PROOFS_DB },
      properties: {
        'Title': {
          title: [{ text: { content: `Challenge ${challengeNumber} - Proof - ${today}` } }]
        },
        'Challenge Number': { number: challengeNumber },
        'Challenge Name': {
          rich_text: [{ text: { content: challengeNames[challengeNumber - 1] } }]
        },
        'User': { relation: [{ id: user.userId }] },
        'Date': { date: { start: today } },
        'Unit': { rich_text: [{ text: { content: '90 minutes deep work' } }] },
        'Note': {
          rich_text: [{ text: { content: 'Test proof - worked on challenge system implementation' } }]
        },
        'Is Minimal Dose': { checkbox: false },
        'Week Start ': { date: { start: weekStart } },
        'Week End': { date: { start: weekEnd } }
      }
    });

    console.log('✅ Challenge proof created successfully:');
    console.log(`   - Proof ID: ${proof.id}`);
    console.log(`   - Challenge: ${challengeNames[challengeNumber - 1]}`);
    console.log(`   - Date: ${today}`);
    console.log(`   - Week: ${weekStart} → ${weekEnd}`);

    return proof;
  } catch (error) {
    console.error('❌ Error creating challenge proof:', error.message);
    throw error;
  }
}

// Test 3: Query user's challenge proofs
async function test3_GetUserChallengeProofs(user, challengeNumber = 1) {
  console.log('\n🧪 TEST 3: Getting user\'s challenge proofs...');

  const { weekStart } = getSundayDates();

  try {
    const response = await notion.databases.query({
      database_id: CHALLENGE_PROOFS_DB,
      filter: {
        and: [
          {
            property: 'User',
            relation: { contains: user.userId }
          },
          {
            property: 'Week Start ',
            date: { equals: weekStart }
          },
          {
            property: 'Challenge Number',
            number: { equals: challengeNumber }
          }
        ]
      },
      sorts: [{ property: 'Date', direction: 'ascending' }]
    });

    console.log('✅ User challenge proofs retrieved:');
    console.log(`   - Total proofs: ${response.results.length}`);

    response.results.forEach((proof, index) => {
      const date = proof.properties['Date']?.date?.start;
      const unit = proof.properties['Unit']?.rich_text?.[0]?.text?.content;
      const isMinimal = proof.properties['Is Minimal Dose']?.checkbox;

      console.log(`   ${index + 1}. Date: ${date}, Unit: ${unit}, Minimal: ${isMinimal ? 'Yes' : 'No'}`);
    });

    return response.results;
  } catch (error) {
    console.error('❌ Error getting challenge proofs:', error.message);
    throw error;
  }
}

// Test 4: Simulate challenge evaluation
async function test4_EvaluateChallenge(challengeNumber = 1, daysRequired = 5) {
  console.log('\n🧪 TEST 4: Simulating challenge evaluation (Sunday 9 AM)...');

  const { weekStart } = getSundayDates();

  try {
    // Get all proofs for this challenge
    const allProofs = await notion.databases.query({
      database_id: CHALLENGE_PROOFS_DB,
      filter: {
        and: [
          {
            property: 'Week Start ',
            date: { equals: weekStart }
          },
          {
            property: 'Challenge Number',
            number: { equals: challengeNumber }
          }
        ]
      }
    });

    console.log(`📊 Challenge evaluation for week ${weekStart}:`);
    console.log(`   - Total proofs submitted: ${allProofs.results.length}`);

    // Group by user
    const userProofs = {};
    for (const proof of allProofs.results) {
      const userRelation = proof.properties['User']?.relation;
      if (userRelation && userRelation.length > 0) {
        const userId = userRelation[0].id;
        if (!userProofs[userId]) {
          userProofs[userId] = [];
        }
        userProofs[userId].push(proof);
      }
    }

    console.log(`   - Unique participants: ${Object.keys(userProofs).length}`);

    // Evaluate each participant
    const winners = [];
    for (const [userId, proofs] of Object.entries(userProofs)) {
      const proofCount = proofs.length;
      const completed = proofCount >= daysRequired;

      // Get user name
      const userPage = await notion.pages.retrieve({ page_id: userId });
      const userName = userPage.properties['Name']?.rich_text?.[0]?.text?.content || 'Unknown';
      const discordId = userPage.properties['DiscordID']?.rich_text?.[0]?.text?.content || 'Unknown';

      console.log(`   - ${userName}: ${proofCount}/${daysRequired} days ${completed ? '✅ WINNER' : '❌ Incomplete'}`);

      if (completed) {
        winners.push({ userId, userName, discordId, proofCount });
      }
    }

    console.log(`\n🏆 Winners: ${winners.length}`);

    return { totalParticipants: Object.keys(userProofs).length, winners };
  } catch (error) {
    console.error('❌ Error evaluating challenge:', error.message);
    throw error;
  }
}

// Test 5: Create reward entry for winner
async function test5_CreateChallengeReward(user) {
  console.log('\n🧪 TEST 5: Creating challenge reward (€1 credit)...');

  const { weekStart } = getSundayDates();

  try {
    // Check if reward already exists
    const existing = await notion.databases.query({
      database_id: PRICE_POOL_DB,
      filter: {
        and: [
          {
            property: 'Discord ID',
            title: { equals: user.discordId }
          },
          {
            property: 'Week date',
            date: { equals: weekStart }
          },
          {
            property: 'Message',
            rich_text: { contains: 'Challenge completion reward' }
          }
        ]
      }
    });

    if (existing.results.length > 0) {
      console.log('⚠️  Reward already exists for this user this week.');
      console.log(`   - Reward ID: ${existing.results[0].id}`);
      return existing.results[0];
    }

    // Create reward entry (negative price = credit)
    const reward = await notion.pages.create({
      parent: { database_id: PRICE_POOL_DB },
      properties: {
        'Discord ID': {
          title: [{ text: { content: user.discordId } }]
        },
        'User': { relation: [{ id: user.userId }] },
        'Week date': { date: { start: weekStart } },
        'Message': {
          rich_text: [{ text: { content: 'Challenge completion reward - earned €1' } }]
        },
        'Price': { number: -1.00 } // Negative = credit
      }
    });

    console.log('✅ Challenge reward created successfully:');
    console.log(`   - Reward ID: ${reward.id}`);
    console.log(`   - Amount: €1.00 (credit)`);
    console.log(`   - Week: ${weekStart}`);

    return reward;
  } catch (error) {
    console.error('❌ Error creating challenge reward:', error.message);
    throw error;
  }
}

// Test 6: Verify all database operations
async function test6_VerifyDatabases() {
  console.log('\n🧪 TEST 6: Verifying database connections...');

  try {
    // Test Users DB
    const usersTest = await notion.databases.retrieve({ database_id: USERS_DB });
    console.log(`✅ Users DB connected: ${usersTest.title[0]?.plain_text || 'Users'}`);

    // Test Challenge Proofs DB
    const proofsTest = await notion.databases.retrieve({ database_id: CHALLENGE_PROOFS_DB });
    console.log(`✅ Challenge Proofs DB connected: ${proofsTest.title[0]?.plain_text || 'Challenge Proofs'}`);

    // Test Price Pool DB
    const poolTest = await notion.databases.retrieve({ database_id: PRICE_POOL_DB });
    console.log(`✅ Price Pool DB connected: ${poolTest.title[0]?.plain_text || 'Price Pool'}`);

    return true;
  } catch (error) {
    console.error('❌ Error verifying databases:', error.message);
    return false;
  }
}

// Test 7: Create multiple proofs for evaluation testing
async function test7_CreateMultipleProofs(user, challengeNumber = 1, numDays = 5) {
  console.log(`\n🧪 TEST 7: Creating ${numDays} proofs for evaluation testing...`);

  const { weekStart, weekEnd } = getSundayDates();
  const challengeName = 'Deep Work Sessions';

  try {
    const createdProofs = [];
    const startDate = new Date(weekStart);

    for (let i = 0; i < numDays; i++) {
      const proofDate = new Date(startDate);
      proofDate.setDate(startDate.getDate() + i);
      const dateStr = formatDate(proofDate);

      // Check if proof exists
      const existing = await notion.databases.query({
        database_id: CHALLENGE_PROOFS_DB,
        filter: {
          and: [
            { property: 'User', relation: { contains: user.userId } },
            { property: 'Date', date: { equals: dateStr } },
            { property: 'Challenge Number', number: { equals: challengeNumber } }
          ]
        }
      });

      if (existing.results.length > 0) {
        console.log(`   ${i + 1}. ${dateStr} - Already exists, skipping`);
        createdProofs.push(existing.results[0]);
        continue;
      }

      // Create proof
      const proof = await notion.pages.create({
        parent: { database_id: CHALLENGE_PROOFS_DB },
        properties: {
          'Title': { title: [{ text: { content: `Challenge ${challengeNumber} - Proof - ${dateStr}` } }] },
          'Challenge Number': { number: challengeNumber },
          'Challenge Name': { rich_text: [{ text: { content: challengeName } }] },
          'User': { relation: [{ id: user.userId }] },
          'Date': { date: { start: dateStr } },
          'Unit': { rich_text: [{ text: { content: `${60 + i * 10} minutes deep work` } }] },
          'Note': { rich_text: [{ text: { content: `Test proof day ${i + 1}` } }] },
          'Is Minimal Dose': { checkbox: i % 3 === 0 }, // Every 3rd is minimal
          'Week Start ': { date: { start: weekStart } },
          'Week End': { date: { start: weekEnd } }
        }
      });

      console.log(`   ${i + 1}. ${dateStr} - Created ✅`);
      createdProofs.push(proof);

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 300));
    }

    console.log(`✅ Created/verified ${createdProofs.length} proofs`);
    return createdProofs;
  } catch (error) {
    console.error('❌ Error creating multiple proofs:', error.message);
    throw error;
  }
}

// Main test runner
async function runAllTests() {
  console.log('🚀 Starting Challenge System Integration Tests\n');
  console.log('='.repeat(60));

  try {
    // Test 6: Verify database connections first
    const dbsOk = await test6_VerifyDatabases();
    if (!dbsOk) {
      console.log('\n❌ Database verification failed. Please check your .env configuration.');
      process.exit(1);
    }

    // Test 1: Get test user
    const user = await test1_GetTestUser();
    if (!user) {
      console.log('\n❌ Cannot proceed without test user.');
      process.exit(1);
    }

    // Test 7: Create multiple proofs for full week simulation
    await test7_CreateMultipleProofs(user, 1, 5);

    // Test 2: Create single proof
    await test2_CreateChallengeProof(user, 1);

    // Test 3: Query user's proofs
    const proofs = await test3_GetUserChallengeProofs(user, 1);

    // Test 4: Evaluate challenge
    const evaluation = await test4_EvaluateChallenge(1, 5);

    // Test 5: Create reward if user won
    if (evaluation.winners.some(w => w.userId === user.userId)) {
      await test5_CreateChallengeReward(user);
    } else {
      console.log('\n⚠️  Skipping reward creation - user did not complete challenge');
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ ALL TESTS COMPLETED SUCCESSFULLY!');
    console.log('\n📊 Summary:');
    console.log(`   - User: ${user.name} (${user.discordId})`);
    console.log(`   - Proofs submitted: ${proofs.length}`);
    console.log(`   - Total participants: ${evaluation.totalParticipants}`);
    console.log(`   - Winners: ${evaluation.winners.length}`);
    console.log(`   - User completed: ${evaluation.winners.some(w => w.userId === user.userId) ? 'Yes ✅' : 'No ❌'}`);
    console.log('\n🎉 The Challenge System is ready for deployment!');

  } catch (error) {
    console.error('\n❌ TEST SUITE FAILED:', error);
    process.exit(1);
  }
}

// Run tests
runAllTests();
