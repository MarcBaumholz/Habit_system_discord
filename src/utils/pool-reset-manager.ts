import fs from 'fs';
import path from 'path';

type PoolResetRecord = {
  lastResetWeekStart: string;
};

const RESET_FILE_PATH = path.join(process.cwd(), 'data', 'pool-reset.json');

function ensureDataDirectory(): void {
  const dataDir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

function readResetRecord(): PoolResetRecord | null {
  try {
    if (!fs.existsSync(RESET_FILE_PATH)) {
      return null;
    }
    const raw = fs.readFileSync(RESET_FILE_PATH, 'utf-8');
    return JSON.parse(raw) as PoolResetRecord;
  } catch (error) {
    console.error('Error reading pool reset record:', error);
    return null;
  }
}

function writeResetRecord(record: PoolResetRecord): void {
  try {
    ensureDataDirectory();
    fs.writeFileSync(RESET_FILE_PATH, JSON.stringify(record, null, 2), 'utf-8');
  } catch (error) {
    console.error('Error writing pool reset record:', error);
    throw error;
  }
}

export function getPoolResetWeekStart(): string | null {
  const record = readResetRecord();
  return record ? record.lastResetWeekStart : null;
}

export function setPoolResetWeekStart(weekStart: string): void {
  writeResetRecord({ lastResetWeekStart: weekStart });
}

export function ensurePoolResetWeekStart(weekStart: string): string {
  const existing = getPoolResetWeekStart();
  if (existing) {
    return existing;
  }
  setPoolResetWeekStart(weekStart);
  return weekStart;
}
