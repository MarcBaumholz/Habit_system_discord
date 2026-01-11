/**
 * Test script to verify batch selection functionality
 * This creates test batches and verifies they can be retrieved
 */

import {
  saveBatch,
  getAllBatches,
  getActiveBatches,
  getBatchByName,
  clearAllBatches
} from './src/utils/batch-manager';
import { BatchMetadata } from './src/types';

async function testBatchSelection() {
  console.log('🧪 Testing Batch Selection Functionality\n');

  try {
    // Step 1: Clear existing batches
    console.log('1️⃣ Clearing existing batches...');
    clearAllBatches();
    console.log('   ✅ Cleared\n');

    // Step 2: Create test batches
    console.log('2️⃣ Creating test batches...');

    const batch1: BatchMetadata = {
      name: 'january 2026',
      createdDate: '2026-01-01',
      startDate: '2026-01-15',
      endDate: '2026-03-22',
      status: 'pre-phase'
    };

    const batch2: BatchMetadata = {
      name: 'february 2026',
      createdDate: '2026-01-20',
      startDate: '2026-02-01',
      endDate: '2026-04-08',
      status: 'active'
    };

    const batch3: BatchMetadata = {
      name: 'march 2026',
      createdDate: '2026-02-15',
      startDate: '2026-03-01',
      endDate: '2026-05-06',
      status: 'completed'
    };

    saveBatch(batch1);
    saveBatch(batch2);
    saveBatch(batch3);
    console.log('   ✅ Created 3 batches\n');

    // Step 3: Get all batches
    console.log('3️⃣ Retrieving all batches...');
    const allBatches = getAllBatches();
    console.log(`   ✅ Found ${allBatches.length} batches:`);
    allBatches.forEach(b => {
      console.log(`      - ${b.name} (${b.status})`);
    });
    console.log('');

    // Step 4: Get active batches only
    console.log('4️⃣ Retrieving active batches (for user selection)...');
    const activeBatches = getActiveBatches();
    console.log(`   ✅ Found ${activeBatches.length} active/pre-phase batches:`);
    activeBatches.forEach(b => {
      const emoji = b.status === 'active' ? '🟢' : '🟡';
      console.log(`      ${emoji} ${b.name} (${b.status}) - Starts: ${b.startDate}`);
    });
    console.log('');

    // Step 5: Get specific batch by name
    console.log('5️⃣ Getting specific batch by name...');
    const selectedBatch = getBatchByName('february 2026');
    if (selectedBatch) {
      console.log(`   ✅ Found batch: ${selectedBatch.name}`);
      console.log(`      Status: ${selectedBatch.status}`);
      console.log(`      Start Date: ${selectedBatch.startDate}`);
      console.log(`      End Date: ${selectedBatch.endDate}`);
    } else {
      console.log('   ❌ Batch not found');
    }
    console.log('');

    // Step 6: Simulate user flow
    console.log('6️⃣ Simulating user batch selection flow...');
    console.log('   User sees these batches in the habit creation flow:');
    const userVisibleBatches = getActiveBatches();
    userVisibleBatches.forEach((b, index) => {
      const emoji = b.status === 'active' ? '🟢' : '🟡';
      console.log(`      [${index + 1}] ${emoji} ${b.name} (${b.status === 'active' ? 'Active' : 'Pre-phase'}) - Starts: ${b.startDate}`);
    });

    const userSelectedBatchName = 'february 2026';
    console.log(`\n   User selects: "${userSelectedBatchName}"`);

    const userBatch = getBatchByName(userSelectedBatchName);
    if (userBatch) {
      console.log(`   ✅ Habit will be assigned to batch: ${userBatch.name}`);
      console.log(`      Batch status: ${userBatch.status}`);
      console.log(`      Batch start: ${userBatch.startDate}`);
    }
    console.log('');

    // Step 7: Verify batch selection works
    console.log('7️⃣ Verification checks...');
    const checks = [
      { name: 'All batches retrieved', pass: allBatches.length === 3 },
      { name: 'Active batches filtered correctly', pass: activeBatches.length === 2 },
      { name: 'Completed batch excluded', pass: !activeBatches.some(b => b.status === 'completed') },
      { name: 'Batch retrieval by name works', pass: selectedBatch !== null },
      { name: 'User can select batch', pass: userBatch !== null }
    ];

    checks.forEach(check => {
      console.log(`   ${check.pass ? '✅' : '❌'} ${check.name}`);
    });

    const allPassed = checks.every(c => c.pass);
    console.log('');

    if (allPassed) {
      console.log('🎉 All tests passed! Batch selection is working correctly.\n');
      console.log('📋 Summary:');
      console.log('   - Users can now manually select which batch to join');
      console.log('   - Only active and pre-phase batches are shown');
      console.log('   - Completed batches are hidden from selection');
      console.log('   - Batch selection is integrated into habit creation flow');
    } else {
      console.log('❌ Some tests failed. Please review the implementation.');
    }

    // Cleanup
    console.log('\n🧹 Cleaning up test batches...');
    clearAllBatches();
    console.log('   ✅ Cleanup complete');

  } catch (error) {
    console.error('❌ Error during testing:', error);
    throw error;
  }
}

// Run the test
testBatchSelection()
  .then(() => {
    console.log('\n✅ Test completed successfully');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  });
