/**
 * Batch Manager - Simple file-based batch metadata storage
 *
 * Stores current batch info in data/current-batch.json
 * No separate database needed - just one JSON file!
 */

import fs from 'fs';
import path from 'path';
import { BatchMetadata } from '../types';

const BATCH_FILE_PATH = path.join(process.cwd(), 'data', 'current-batch.json');

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
 * Read current batch metadata from file
 * Returns null if no batch is active
 */
export function getCurrentBatch(): BatchMetadata | null {
  try {
    if (!fs.existsSync(BATCH_FILE_PATH)) {
      return null;
    }

    const data = fs.readFileSync(BATCH_FILE_PATH, 'utf-8');
    const batch: BatchMetadata = JSON.parse(data);

    return batch;
  } catch (error) {
    console.error('❌ Error reading batch file:', error);
    return null;
  }
}

/**
 * Save current batch metadata to file
 */
export function saveCurrentBatch(batch: BatchMetadata): void {
  try {
    ensureDataDirectory();

    const data = JSON.stringify(batch, null, 2);
    fs.writeFileSync(BATCH_FILE_PATH, data, 'utf-8');

    console.log(`✅ Batch saved: ${batch.name} (Start: ${batch.startDate})`);
  } catch (error) {
    console.error('❌ Error saving batch file:', error);
    throw error;
  }
}

/**
 * Clear current batch (delete the file)
 */
export function clearCurrentBatch(): void {
  try {
    if (fs.existsSync(BATCH_FILE_PATH)) {
      fs.unlinkSync(BATCH_FILE_PATH);
      console.log('✅ Batch file cleared');
    }
  } catch (error) {
    console.error('❌ Error clearing batch file:', error);
    throw error;
  }
}

/**
 * Check if there's an active batch
 */
export function hasActiveBatch(): boolean {
  return getCurrentBatch() !== null;
}

/**
 * Get current batch day (1-66)
 * Returns null if no batch is active or batch is completed
 */
export function getCurrentBatchDay(): number | null {
  const batch = getCurrentBatch();
  if (!batch) {
    return null;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const startDate = new Date(batch.startDate);
  startDate.setHours(0, 0, 0, 0);

  const diffMs = today.getTime() - startDate.getTime();
  const daysDiff = Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1;

  // Clamp to 1-66 range
  const currentDay = Math.max(1, Math.min(daysDiff, 66));

  return currentDay;
}

/**
 * Check if current batch has completed (reached day 66)
 */
export function isBatchCompleted(): boolean {
  const currentDay = getCurrentBatchDay();
  return currentDay !== null && currentDay >= 66;
}

/**
 * Get current batch week (1-10)
 */
export function getCurrentBatchWeek(): number | null {
  const currentDay = getCurrentBatchDay();
  if (currentDay === null) {
    return null;
  }

  return Math.ceil(currentDay / 7);
}

/**
 * Calculate end date for batch (start date + 66 days)
 */
export function getBatchEndDate(startDate: string): string {
  const start = new Date(startDate);
  const end = new Date(start);
  end.setDate(start.getDate() + 65); // Day 66 is 65 days after Day 1

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
