#!/usr/bin/env ts-node

/**
 * Test Runner Script
 * 
 * Runs tests and sends results to Discord test channel
 * Usage: npm run test:discord
 */

import * as dotenv from 'dotenv';
import { TestFramework } from '../src/test/test-framework';
import * as path from 'path';
import * as fs from 'fs';

dotenv.config();

const TEST_CHANNEL_ID = process.env.DISCORD_TESTCHANNEL || '1454881425911316572';

function findTestFiles(dir: string, fileList: string[] = []): string[] {
  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory() && !file.includes('node_modules') && !file.startsWith('.')) {
      findTestFiles(filePath, fileList);
    } else if (file.endsWith('.test.ts') || file.endsWith('.spec.ts')) {
      fileList.push(filePath);
    }
  });

  return fileList;
}

async function findTestFilesAsync(): Promise<string[]> {
  const testDirs = ['tests', 'src'];
  const files: string[] = [];

  for (const dir of testDirs) {
    if (fs.existsSync(dir)) {
      files.push(...findTestFiles(dir));
    }
  }

  return files;
}

async function runTestFile(filePath: string): Promise<void> {
  console.log(`Running tests from: ${filePath}`);
  
  // Dynamic import and execution
  try {
    // Clear require cache to ensure fresh imports
    delete require.cache[require.resolve(path.resolve(filePath))];
    
    // Import and run the test file
    await import(path.resolve(filePath));
  } catch (error: any) {
    console.error(`Error running test file ${filePath}:`, error);
    throw error;
  }
}

async function getCodeChanges(): Promise<string> {
  // Try to get git diff of staged/unstaged changes
  try {
    const { execSync } = require('child_process');
    const diff = execSync('git diff HEAD', { encoding: 'utf-8' });
    return diff.substring(0, 2000); // Limit to 2000 chars
  } catch {
    return 'No git changes detected';
  }
}

async function main() {
  console.log('🧪 Starting Test Runner...\n');
  console.log(` channel: ${TEST_CHANNEL_ID}\n`);

  const testFiles = await findTestFilesAsync();
  
  if (testFiles.length === 0) {
    console.log('⚠️  No test files found');
    const test = new TestFramework('No Tests Found', TEST_CHANNEL_ID);
    await test.testRunner.initialize();
    await test.testRunner.sendTestResults({
      name: 'No Tests Found',
      tests: [],
      total: 0,
      passed: 0,
      failed: 0,
      skipped: 0,
      duration: 0
    }, 'No test files found in project');
    await test.testRunner.destroy();
    return;
  }

  console.log(`Found ${testFiles.length} test file(s):`);
  testFiles.forEach(f => console.log(`  - ${f}`));
  console.log('');

  const codeChanges = await getCodeChanges();

  // Run each test file
  for (const file of testFiles) {
    try {
      await runTestFile(file);
    } catch (error) {
      console.error(`Failed to run ${file}:`, error);
    }
  }

  console.log('\n✅ Test execution complete');
  console.log('📤 Results sent to Discord test channel');
}

if (require.main === module) {
  main().catch(console.error);
}
