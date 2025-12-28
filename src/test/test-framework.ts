import { DiscordTestRunner, TestSuite, TestResult } from './discord-test-runner';

export type TestFunction = () => Promise<void> | void;

export interface TestCase {
  name: string;
  fn: TestFunction;
  timeout?: number;
}

export class TestFramework {
  private _testRunner: DiscordTestRunner;
  private tests: TestCase[] = [];
  private suiteName: string;

  constructor(suiteName: string, testChannelId: string) {
    this.suiteName = suiteName;
    this._testRunner = new DiscordTestRunner(testChannelId);
  }

  get testRunner(): DiscordTestRunner {
    return this._testRunner;
  }

  test(name: string, fn: TestFunction, timeout: number = 5000): void {
    this.tests.push({ name, fn, timeout });
  }

  async run(): Promise<TestSuite> {
    await this._testRunner.initialize();
    await this._testRunner.sendTestStart(this.suiteName, `Running ${this.tests.length} test(s)`);

    const results: TestResult[] = [];
    const startTime = Date.now();

    for (const testCase of this.tests) {
      const testStart = Date.now();
      let result: TestResult;

      try {
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error(`Test timeout after ${testCase.timeout}ms`)), testCase.timeout);
        });

        await Promise.race([Promise.resolve(testCase.fn()), timeoutPromise]);
        
        const duration = Date.now() - testStart;
        result = {
          name: testCase.name,
          status: 'passed',
          duration
        };
      } catch (error: any) {
        const duration = Date.now() - testStart;
        result = {
          name: testCase.name,
          status: 'failed',
          duration,
          error: error.message || String(error),
          details: error.stack
        };
      }

      results.push(result);
    }

    const duration = Date.now() - startTime;
    const passed = results.filter(r => r.status === 'passed').length;
    const failed = results.filter(r => r.status === 'failed').length;
    const skipped = results.filter(r => r.status === 'skipped').length;

    const suite: TestSuite = {
      name: this.suiteName,
      tests: results,
      total: this.tests.length,
      passed,
      failed,
      skipped,
      duration
    };

    await this._testRunner.sendTestResults(suite);
    await this._testRunner.destroy();

    return suite;
  }

  // Helper assertions
  static assert(condition: boolean, message: string = 'Assertion failed'): void {
    if (!condition) {
      throw new Error(message);
    }
  }

  static assertEqual(actual: any, expected: any, message?: string): void {
    if (actual !== expected) {
      throw new Error(message || `Expected ${expected}, but got ${actual}`);
    }
  }

  static assertNotEqual(actual: any, expected: any, message?: string): void {
    if (actual === expected) {
      throw new Error(message || `Expected values to be different, but both were ${actual}`);
    }
  }

  static assertThrows(fn: () => void, expectedError?: string): void {
    try {
      fn();
      throw new Error('Expected function to throw, but it did not');
    } catch (error: any) {
      if (expectedError && !error.message.includes(expectedError)) {
        throw new Error(`Expected error to contain "${expectedError}", but got "${error.message}"`);
      }
    }
  }
}
