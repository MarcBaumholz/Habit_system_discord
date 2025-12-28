#!/usr/bin/env ts-node

/**
 * File Watcher for TDD
 * 
 * Watches for file changes and automatically runs tests,
 * sending results to Discord test channel.
 * 
 * Usage: npm run test:discord:watch
 */

import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

dotenv.config();

const execAsync = promisify(exec);
const TEST_CHANNEL_ID = process.env.DISCORD_TESTCHANNEL || '1454881425911316572';

interface WatchedFile {
  path: string;
  lastModified: number;
}

class TestWatcher {
  private watchedFiles: Map<string, WatchedFile> = new Map();
  private isRunning = false;
  private debounceTimeout: NodeJS.Timeout | null = null;

  constructor(
    private watchDirs: string[],
    private testCommand: string = 'npm run test:discord'
  ) {}

  async watch(): Promise<void> {
    console.log('👀 Starting file watcher for TDD...\n');
    console.log(`📁 Watching directories: ${this.watchDirs.join(', ')}`);
    console.log(`📤 Test results will be sent to Discord channel: ${TEST_CHANNEL_ID}\n`);

    // Initial scan
    await this.scanAndWatch();

    // Watch for changes
    setInterval(() => {
      this.checkForChanges();
    }, 1000); // Check every second

    console.log('✅ File watcher active. Waiting for changes...\n');
    console.log('💡 Tip: Edit any file in src/ or tests/ to trigger test execution\n');
  }

  private async scanAndWatch(): Promise<void> {
    for (const dir of this.watchDirs) {
      if (fs.existsSync(dir)) {
        this.scanDirectory(dir);
      }
    }
  }

  private scanDirectory(dir: string): void {
    const files = fs.readdirSync(dir);

    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);

      if (stat.isDirectory() && !file.includes('node_modules') && !file.startsWith('.')) {
        this.scanDirectory(filePath);
      } else if (file.endsWith('.ts') && !file.endsWith('.d.ts')) {
        this.watchedFiles.set(filePath, {
          path: filePath,
          lastModified: stat.mtimeMs
        });
      }
    });
  }

  private checkForChanges(): void {
    let hasChanges = false;

    for (const [filePath, watched] of this.watchedFiles.entries()) {
      if (!fs.existsSync(filePath)) {
        this.watchedFiles.delete(filePath);
        hasChanges = true;
        continue;
      }

      const stat = fs.statSync(filePath);
      if (stat.mtimeMs > watched.lastModified) {
        watched.lastModified = stat.mtimeMs;
        hasChanges = true;
        console.log(`📝 File changed: ${filePath}`);
      }
    }

    if (hasChanges && !this.isRunning) {
      this.debounceRunTests();
    }
  }

  private debounceRunTests(): void {
    if (this.debounceTimeout) {
      clearTimeout(this.debounceTimeout);
    }

    this.debounceTimeout = setTimeout(() => {
      this.runTests();
    }, 2000); // Wait 2 seconds after last change
  }

  private async runTests(): Promise<void> {
    if (this.isRunning) {
      return;
    }

    this.isRunning = true;
    console.log('\n🧪 Running tests...\n');

    try {
      await execAsync(this.testCommand, {
        cwd: process.cwd(),
        env: { ...process.env, DISCORD_TESTCHANNEL: TEST_CHANNEL_ID }
      });
      console.log('✅ Tests completed. Results sent to Discord.\n');
    } catch (error: any) {
      console.error('❌ Test execution failed:', error.message);
    } finally {
      this.isRunning = false;
      
      // Rescan for new files
      await this.scanAndWatch();
    }
  }
}

async function main() {
  const watcher = new TestWatcher(['src', 'tests']);
  await watcher.watch();

  // Keep process alive
  process.on('SIGINT', () => {
    console.log('\n👋 Stopping file watcher...');
    process.exit(0);
  });
}

if (require.main === module) {
  main().catch(console.error);
}
