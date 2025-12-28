/**
 * Cycle Calculator - Deprecated
 *
 * This file is deprecated. Use batch-manager.ts instead for all batch-related functionality.
 * Keeping this file for backward compatibility only.
 */

export function getCurrentBatchDay(): null {
  // This function is deprecated - use batch-manager.ts instead
  console.warn('cycle-calculator.ts is deprecated. Use batch-manager.ts instead.');
  return null;
}

export function getBatchWeek(dayInCycle: number): number {
  return Math.ceil(dayInCycle / 7);
}

export function getCycleStage(dayInCycle: number): 'early' | 'middle' | 'final' {
  if (dayInCycle <= 21) {
    return 'early';
  } else if (dayInCycle <= 44) {
    return 'middle';
  } else {
    return 'final';
  }
}
