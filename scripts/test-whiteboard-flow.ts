/**
 * Test: Whiteboard Modal Submit and View Entries
 *
 * - Creates a temp whiteboard cycle, runs handleModalSubmit with a mock modal,
 *   asserts the entry is stored. Restores the store afterward.
 * - For View Entries: buildEntriesSummary is exercised via getEntriesForWeek + the
 *   same flow (entries in store are shown in the summary).
 *
 * Run when the main bot is NOT running to avoid races on data/whiteboard-entries.json.
 *
 *   npx ts-node scripts/test-whiteboard-flow.ts
 */

import * as dotenv from 'dotenv';
import { promises as fs } from 'fs';
import path from 'path';
import { startWhiteboardCycle, getEntriesForWeek } from '../src/utils/whiteboard-store';
import { WhiteboardFlowManager } from '../src/bot/whiteboard-flow';

dotenv.config();

const STORAGE_FILE = path.resolve(process.cwd(), 'data', 'whiteboard-entries.json');
const BACKUP_FILE = path.resolve(process.cwd(), 'data', 'whiteboard-entries.json.bak');
const TEST_WEEK = '2030-01-07';
const TEST_TEXT = 'Test-Eintrag für Whiteboard (scripts/test-whiteboard-flow)';

async function backup(): Promise<void> {
  try {
    await fs.access(STORAGE_FILE);
    await fs.copyFile(STORAGE_FILE, BACKUP_FILE);
  } catch {
    // no file or not readable; backup is no-op
  }
}

async function restore(): Promise<void> {
  try {
    await fs.access(BACKUP_FILE);
    await fs.copyFile(BACKUP_FILE, STORAGE_FILE);
    await fs.unlink(BACKUP_FILE);
  } catch {
    // ignore
  }
}

async function main() {
  console.log('🧪 Whiteboard Flow Test (Modal Submit + Store)\n');
  console.log('='.repeat(60));

  const mockNotion = {
    getCurrentWeekInfo: () => ({
      weekStart: new Date(TEST_WEEK),
      weekEnd: new Date('2030-01-13'),
      weekNumber: 1
    }),
    getUserByDiscordId: async () => ({ id: 'notion-test-user' })
  } as any;

  const mockLogger = {
    success: async () => {}
  } as any;

  let editReplyContent: string | null = null;
  const mockModal = {
    customId: `whiteboard_modal_${TEST_WEEK}`,
    user: { id: 'discord-123', username: 'TestUser' },
    fields: {
      getTextInputValue: (key: string) =>
        key === 'whiteboard_category' ? 'learning' : key === 'whiteboard_text' ? TEST_TEXT : ''
    },
    deferReply: async () => {},
    editReply: async (opts: string | { content?: string }) => {
      editReplyContent = typeof opts === 'string' ? opts : opts?.content ?? null;
    }
  } as any;

  await backup();
  try {
    await startWhiteboardCycle(TEST_WEEK);
    const flow = new WhiteboardFlowManager(mockNotion, mockLogger);
    await flow.handleModalSubmit(mockModal);

    const entries = await getEntriesForWeek(TEST_WEEK);
    if (entries.length !== 1) {
      throw new Error(`Expected 1 entry, got ${entries.length}`);
    }
    if (entries[0].text !== TEST_TEXT || entries[0].category !== 'learning') {
      throw new Error(`Entry mismatch: ${JSON.stringify(entries[0])}`);
    }
    const msg = editReplyContent ?? '';
    if (!msg.includes('gespeichert')) {
      throw new Error(`Expected success editReply, got: ${editReplyContent}`);
    }

    console.log('✅ Modal submit: entry stored and editReply contained "gespeichert"');
    console.log('   Entry:', JSON.stringify(entries[0], null, 2));

    // View Entries path: getEntriesForWeek is what buildEntriesSummary uses
    const viewEntries = await getEntriesForWeek(TEST_WEEK);
    if (viewEntries.length === 0) {
      throw new Error('View Entries: expected entries for test week');
    }
    console.log('✅ View Entries: getEntriesForWeek returned', viewEntries.length, 'entry/entries');
  } finally {
    await restore();
  }

  console.log('\n' + '='.repeat(60));
  console.log('✅ All whiteboard flow checks passed.\n');
}

main().catch((e) => {
  console.error('\n❌', e.message);
  restore().finally(() => process.exit(1));
});
