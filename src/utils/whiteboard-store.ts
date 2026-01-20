import { promises as fs } from 'fs';
import path from 'path';
import { WhiteboardCycle, WhiteboardEntry } from '../types';

const STORAGE_FILE = path.resolve(process.cwd(), 'data', 'whiteboard-entries.json');
const HISTORY_LIMIT = 24;

interface WhiteboardData {
  current: WhiteboardCycle | null;
  history: WhiteboardCycle[];
}

const DEFAULT_DATA: WhiteboardData = {
  current: null,
  history: []
};

async function ensureStorageFile(): Promise<void> {
  const dir = path.dirname(STORAGE_FILE);
  await fs.mkdir(dir, { recursive: true });
  try {
    await fs.access(STORAGE_FILE);
  } catch {
    await fs.writeFile(STORAGE_FILE, JSON.stringify(DEFAULT_DATA, null, 2), 'utf-8');
  }
}

async function readWhiteboardData(): Promise<WhiteboardData> {
  await ensureStorageFile();
  try {
    const raw = await fs.readFile(STORAGE_FILE, 'utf-8');
    const parsed = JSON.parse(raw) as WhiteboardData;
    return {
      current: parsed.current || null,
      history: Array.isArray(parsed.history) ? parsed.history : []
    };
  } catch (error) {
    console.warn('⚠️ Failed to read whiteboard store, resetting to defaults:', error);
    await fs.writeFile(STORAGE_FILE, JSON.stringify(DEFAULT_DATA, null, 2), 'utf-8');
    return { ...DEFAULT_DATA };
  }
}

async function writeWhiteboardData(data: WhiteboardData): Promise<void> {
  await ensureStorageFile();
  await fs.writeFile(STORAGE_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

export async function getCurrentWhiteboardCycle(): Promise<WhiteboardCycle | null> {
  const data = await readWhiteboardData();
  return data.current;
}

export async function startWhiteboardCycle(
  weekStart: string,
  messageId?: string,
  channelId?: string
): Promise<WhiteboardCycle> {
  const data = await readWhiteboardData();
  const now = new Date().toISOString();

  if (data.current && data.current.weekStart === weekStart && data.current.status === 'open') {
    data.current = {
      ...data.current,
      messageId: messageId || data.current.messageId,
      channelId: channelId || data.current.channelId
    };
    await writeWhiteboardData(data);
    return data.current;
  }

  if (data.current && data.current.status === 'open') {
    data.current.status = 'closed';
    data.current.closedAt = now;
    data.history.unshift(data.current);
    data.history = data.history.slice(0, HISTORY_LIMIT);
  }

  const newCycle: WhiteboardCycle = {
    weekStart,
    createdAt: now,
    messageId,
    channelId,
    status: 'open',
    entries: []
  };

  data.current = newCycle;
  await writeWhiteboardData(data);
  return newCycle;
}

export async function addWhiteboardEntry(entry: WhiteboardEntry): Promise<WhiteboardCycle> {
  const data = await readWhiteboardData();
  if (!data.current || data.current.status !== 'open') {
    throw new Error('The weekly whiteboard is currently closed.');
  }
  if (data.current.weekStart !== entry.weekStart) {
    throw new Error('Entry does not belong to the current whiteboard week.');
  }

  data.current.entries.push(entry);
  await writeWhiteboardData(data);
  return data.current;
}

export async function closeCurrentWhiteboardCycle(): Promise<WhiteboardCycle | null> {
  const data = await readWhiteboardData();
  if (!data.current || data.current.status !== 'open') {
    return null;
  }

  data.current.status = 'closed';
  data.current.closedAt = new Date().toISOString();
  const closedCycle = data.current;
  data.history.unshift(closedCycle);
  data.history = data.history.slice(0, HISTORY_LIMIT);
  data.current = null;

  await writeWhiteboardData(data);
  return closedCycle;
}

export async function getEntriesForWeek(weekStart?: string): Promise<WhiteboardEntry[]> {
  const data = await readWhiteboardData();
  if (weekStart) {
    if (data.current && data.current.weekStart === weekStart) {
      return data.current.entries;
    }
    const archived = data.history.find(cycle => cycle.weekStart === weekStart);
    return archived ? archived.entries : [];
  }
  if (data.current) {
    return data.current.entries;
  }
  return [];
}
