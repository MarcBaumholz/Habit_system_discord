/**
 * Batch Manager - Simple file-based batch metadata storage
 *
 * Stores all batches in data/batches.json
 * Supports multiple concurrent batches
 * No separate database needed - just one JSON file!
 */

import fs from 'fs';
import path from 'path';
import { BatchMetadata, BatchStatus } from '../types';

const BATCHES_FILE_PATH = path.join(process.cwd(), 'data', 'batches.json');
const LEGACY_BATCH_FILE_PATH = path.join(process.cwd(), 'data', 'current-batch.json');

/**
 * Ensure data directory exists
 */
function ensureDataDirectory(): void {
  const dataDir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

/**
 * Migrate legacy current-batch.json to new batches.json format
 */
function migrateLegacyBatch(): void {
  try {
    if (fs.existsSync(LEGACY_BATCH_FILE_PATH) && !fs.existsSync(BATCHES_FILE_PATH)) {
      const legacyData = fs.readFileSync(LEGACY_BATCH_FILE_PATH, 'utf-8');
      const legacyBatch: BatchMetadata = JSON.parse(legacyData);

      // Save as array in new format
      const batches: BatchMetadata[] = [legacyBatch];
      fs.writeFileSync(BATCHES_FILE_PATH, JSON.stringify(batches, null, 2), 'utf-8');

      console.log('✅ Migrated legacy batch file to new format');
    }
  } catch (error) {
    console.error('⚠️ Error migrating legacy batch file:', error);
  }
}

/**
 * Get all batches from storage
 */
export function getAllBatches(): BatchMetadata[] {
  try {
    migrateLegacyBatch();

    console.log(`🔍 DEBUG: Checking batches file at: ${BATCHES_FILE_PATH}`);
    console.log(`🔍 DEBUG: process.cwd() = ${process.cwd()}`);

    if (!fs.existsSync(BATCHES_FILE_PATH)) {
      console.log('⚠️ DEBUG: Batches file does not exist at expected path');
      return [];
    }

    const data = fs.readFileSync(BATCHES_FILE_PATH, 'utf-8');
    console.log(`🔍 DEBUG: Read batches file, length: ${data.length} bytes`);
    
    const batches: BatchMetadata[] = JSON.parse(data);
    console.log(`✅ DEBUG: Parsed ${batches.length} batch(es) from file`);

    batches.forEach((batch, index) => {
      console.log(`   Batch ${index + 1}: ${batch.name}, status: ${batch.status}`);
    });

    return batches;
  } catch (error) {
    console.error('❌ Error reading batches file:', error);
    if (error instanceof Error) {
      console.error('   Error message:', error.message);
      console.error('   Error stack:', error.stack);
    }
    return [];
  }
}

/**
 * Get batches that are active or in pre-phase (available for users to join)
 */
export function getActiveBatches(): BatchMetadata[] {
  const allBatches = getAllBatches();
  console.log(`🔍 DEBUG: getActiveBatches() called, found ${allBatches.length} total batch(es)`);
  
  const activeBatches = allBatches.filter(batch => {
    // Defensive check: ensure batch has a status field
    if (!batch.status) {
      console.warn(`   ⚠️  Batch "${batch.name}" has no status field, excluding`);
      return false;
    }
    
    const isActive = batch.status === 'active' || batch.status === 'pre-phase';
    if (!isActive) {
      console.log(`   ⏭️  Excluding batch "${batch.name}" with status "${batch.status}" (valid statuses: 'active', 'pre-phase')`);
    } else {
      console.log(`   ✅ Including batch "${batch.name}" with status "${batch.status}"`);
    }
    return isActive;
  });
  
  console.log(`✅ DEBUG: getActiveBatches() returning ${activeBatches.length} active/pre-phase batch(es)`);
  if (activeBatches.length === 0 && allBatches.length > 0) {
    console.warn(`⚠️ WARNING: Found ${allBatches.length} batch(es) but none are active/pre-phase!`);
    console.warn(`   Batch statuses found: ${allBatches.map(b => `"${b.name}": "${b.status || 'undefined'}"`).join(', ')}`);
  }
  
  return activeBatches;
}

/**
 * Get a specific batch by name
 */
export function getBatchByName(name: string): BatchMetadata | null {
  const allBatches = getAllBatches();
  const batch = allBatches.find(b => b.name === name);
  return batch || null;
}

/**
 * Save a batch (creates new or updates existing)
 */
export function saveBatch(batch: BatchMetadata): void {
  try {
    ensureDataDirectory();

    const allBatches = getAllBatches();
    const existingIndex = allBatches.findIndex(b => b.name === batch.name);

    if (existingIndex >= 0) {
      // Update existing batch
      allBatches[existingIndex] = batch;
      console.log(`✅ Batch updated: ${batch.name}`);
    } else {
      // Add new batch
      allBatches.push(batch);
      console.log(`✅ Batch created: ${batch.name}`);
    }

    const data = JSON.stringify(allBatches, null, 2);
    fs.writeFileSync(BATCHES_FILE_PATH, data, 'utf-8');
  } catch (error) {
    console.error('❌ Error saving batch:', error);
    throw error;
  }
}

/**
 * Clear all batches (for testing purposes)
 */
export function clearAllBatches(): void {
  try {
    if (fs.existsSync(BATCHES_FILE_PATH)) {
      fs.unlinkSync(BATCHES_FILE_PATH);
      console.log('✅ All batches cleared');
    }
  } catch (error) {
    console.error('❌ Error clearing batches:', error);
    throw error;
  }
}

/**
 * Read current batch metadata from file
 * Returns the first active batch found, or null
 * @deprecated Use getAllBatches() or getActiveBatches() for multi-batch support
 */
export function getCurrentBatch(): BatchMetadata | null {
  const activeBatches = getActiveBatches();

  // Return first active batch for backward compatibility
  if (activeBatches.length > 0) {
    return activeBatches[0];
  }

  return null;
}

/**
 * Save current batch metadata to file
 * @deprecated Use saveBatch() instead
 */
export function saveCurrentBatch(batch: BatchMetadata): void {
  saveBatch(batch);
}

/**
 * Clear current batch (delete the file)
 * @deprecated Use clearAllBatches() or remove specific batch
 */
export function clearCurrentBatch(): void {
  clearAllBatches();
}

/**
 * Check if there's an active batch
 */
export function hasActiveBatch(): boolean {
  return getCurrentBatch() !== null;
}

/**
 * Get current batch day (1-90)
 * Returns null if no batch is active, batch is in pre-phase, or batch is completed
 */
export function getCurrentBatchDay(): number | null {
  const batch = getCurrentBatch();
  if (!batch) {
    return null;
  }

  // If batch is in pre-phase, no day count yet
  if (batch.status === 'pre-phase') {
    return null;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const startDate = new Date(batch.startDate);
  startDate.setHours(0, 0, 0, 0);

  // If today is before start date, return null (shouldn't happen if status is correct)
  if (today < startDate) {
    return null;
  }

  const diffMs = today.getTime() - startDate.getTime();
  const daysDiff = Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1;

  // Clamp to 1-90 range
  const currentDay = Math.max(1, Math.min(daysDiff, 90));

  return currentDay;
}

/**
 * Check if current batch has completed (reached day 90)
 */
export function isBatchCompleted(): boolean {
  const currentDay = getCurrentBatchDay();
  return currentDay !== null && currentDay >= 90;
}

/**
 * Get current batch week (1-13)
 */
export function getCurrentBatchWeek(): number | null {
  const currentDay = getCurrentBatchDay();
  if (currentDay === null) {
    return null;
  }

  return Math.ceil(currentDay / 7);
}

/**
 * Calculate end date for batch (start date + 90 days)
 */
export function getBatchEndDate(startDate: string): string {
  const start = new Date(startDate);
  const end = new Date(start);
  end.setDate(start.getDate() + 89); // Day 90 is 89 days after Day 1

  return end.toISOString().split('T')[0]; // YYYY-MM-DD
}

/**
 * Filter habits to only include those from the current active batch
 * If no batch is active, returns all habits (backward compatibility)
 */
export function filterHabitsByCurrentBatch<T extends { batch?: string }>(habits: T[]): T[] {
  const currentBatch = getCurrentBatch();

  if (!currentBatch) {
    // No active batch - return all habits for backward compatibility
    return habits;
  }

  // Filter to only include habits that match the current batch
  return habits.filter(habit => habit.batch === currentBatch.name);
}

/**
 * Get current batch status
 * Returns null if no batch exists
 */
export function getBatchStatus(): BatchStatus | null {
  const batch = getCurrentBatch();
  return batch ? batch.status : null;
}

/**
 * Check if current batch is in pre-phase
 */
export function isBatchInPrePhase(): boolean {
  const batch = getCurrentBatch();
  return batch?.status === 'pre-phase';
}

/**
 * Check if current batch is active (started)
 */
export function isBatchActive(): boolean {
  const batch = getCurrentBatch();
  return batch?.status === 'active';
}

/**
 * Update batch status
 */
export function updateBatchStatus(status: BatchStatus): void {
  const batch = getCurrentBatch();
  if (!batch) {
    throw new Error('No batch to update');
  }

  batch.status = status;
  saveCurrentBatch(batch);
  console.log(`✅ Batch status updated to: ${status}`);
}

/**
 * Get days until batch starts (for pre-phase batches)
 * Returns null if batch is not in pre-phase or no batch exists
 */
export function getDaysUntilBatchStart(): number | null {
  const batch = getCurrentBatch();
  if (!batch || batch.status !== 'pre-phase') {
    return null;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const startDate = new Date(batch.startDate);
  startDate.setHours(0, 0, 0, 0);

  const diffMs = startDate.getTime() - today.getTime();
  const daysDiff = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  return daysDiff;
}

/**
 * Check if batch start date has arrived (should transition to active)
 */
export function shouldBatchStart(): boolean {
  const batch = getCurrentBatch();
  if (!batch || batch.status !== 'pre-phase') {
    return false;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const startDate = new Date(batch.startDate);
  startDate.setHours(0, 0, 0, 0);

  return today >= startDate;
}
