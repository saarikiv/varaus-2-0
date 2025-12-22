/**
 * Test Coordinator Module
 * Manages coordinated testing of frontend and backend applications
 */

import { spawn } from 'child_process';
import * as path from 'path';
import { ApplicationName } from '../types';

export interface TestCoordinator {
  runTests(app: ApplicationName): Promise<ApplicationTestResult>;
  runAllTests(): Promise<TestAllResult>;
}

export interface ApplicationTestResult {
  success: boolean;
  application: ApplicationName;
  testsPassed: number;
  testsFailed: number;
  testsSkipped: number;
  duration: number;
  failures: TestFailureInfo[];
  output: string;
}

export interface TestAllResult {
  success: boolean;
  backend: ApplicationTestResult;
  frontend: ApplicationTestResult;
  totalDuration: number;
}

export interface TestFailureInfo {
  application: ApplicationName;
  testName: string;
  testFile: string;
  errorMessage: string;
  stackTrace?: string;
}

/**
 * Test Coordinator Implementation
 */
export class TestCoordinatorImpl implements TestCoordinator {
  private projectRoot: string;

  constructor(projectRoot: string = process.cwd()) {
    this.projectRoot = projectRoot;
  }

  /**
   * Run tests for a single application independently
   */
  async runTests(app: ApplicationName): Promise<ApplicationTestResult> {
    if (app === 'both') {
      throw new Error('Cannot run tests for "both" - use runAllTests() instead');
    }

    const startTime = Date.now();
    const failures: TestFailureInfo[] = [];
    let output = '';

    try {
      const appDir = this.getApplicationDirectory(app);
      
      console.log(`Running tests for ${app}...`);

      // Execute test command
      const testOutput = await this.executeTests(app, appDir);
      output = testOutput;

      // Parse test results from output
      const testResults = this.parseTestResults(app, testOutput);

      console.log(`${app} tests completed: ${testResults.passed} passed, ${testResults.failed} failed, ${testResults.skipped} skipped`);

      return {
        success: testResults.failed === 0,
        application: app,
        testsPassed: testResults.passed,
        testsFailed: testResults.failed,
        testsSkipped: testResults.skipped,
        duration: Date.now() - startTime,
        failures: testResults.failures,
        output
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      // If test execution failed completely, return failure result
      failures.push({
        application: app,
        testName: 'Test Execution',
        testFile: 'unknown',
        errorMessage: `Test execution failed: ${errorMessage}`,
        stackTrace: output
      });

      return {
        success: false,
        application: app,
        testsPassed: 0,
        testsFailed: 1,
        testsSkipped: 0,
        duration: Date.now() - startTime,
        failures,
        output
      };
    }
  }

  /**
   * Run tests for all applications independently
   * Tests run in parallel since they are independent
   */
  async runAllTests(): Promise<TestAllResult> {
    const startTime = Date.now();

    console.log('Starting coordinated test execution...');
    console.log('Running tests for both applications independently...\n');

    // Run tests in parallel since they are independent
    const [backendResult, frontendResult] = await Promise.all([
      this.runTests('backend'),
      this.runTests('frontend')
    ]);

    const success = backendResult.success && frontendResult.success;
    const totalDuration = Date.now() - startTime;

    console.log('\n=== Test Summary ===');
    console.log(`Backend: ${backendResult.testsPassed} passed, ${backendResult.testsFailed} failed`);
    console.log(`Frontend: ${frontendResult.testsPassed} passed, ${frontendResult.testsFailed} failed`);

    if (success) {
      console.log(`\n✓ All tests passed in ${totalDuration}ms`);
    } else {
      console.error(`\n✗ Some tests failed after ${totalDuration}ms`);
    }

    return {
      success,
      backend: backendResult,
      frontend: frontendResult,
      totalDuration
    };
  }

  /**
   * Get application directory path
   */
  private getApplicationDirectory(app: ApplicationName): string {
    if (app === 'frontend') {
      return path.join(this.projectRoot, 'varaus');
    } else if (app === 'backend') {
      return path.join(this.projectRoot, 'varausserver');
    }
    throw new Error(`Unknown application: ${app}`);
  }

  /**
   * Execute test command for an application
   */
  private async executeTests(
    app: ApplicationName,
    appDir: string
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      let output = '';
      let errorOutput = '';

      const testProcess = spawn('npm', ['test'], {
        cwd: appDir,
        shell: true
      });

      testProcess.stdout?.on('data', (data: Buffer) => {
        const text = data.toString();
        output += text;
        process.stdout.write(text);
      });

      testProcess.stderr?.on('data', (data: Buffer) => {
        const text = data.toString();
        errorOutput += text;
        process.stderr.write(text);
      });

      testProcess.on('exit', (code: number | null) => {
        const fullOutput = output + errorOutput;
        
        // Note: Test runners may exit with non-zero code when tests fail
        // We still want to parse the results, so we resolve with the output
        resolve(fullOutput);
      });

      testProcess.on('error', (error: Error) => {
        reject(error);
      });
    });
  }

  /**
   * Parse test results from test output
   */
  private parseTestResults(app: ApplicationName, output: string): {
    passed: number;
    failed: number;
    skipped: number;
    failures: TestFailureInfo[];
  } {
    const failures: TestFailureInfo[] = [];
    let passed = 0;
    let failed = 0;
    let skipped = 0;

    const lines = output.split('\n');

    // Parse Mocha output format
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Look for test summary line: "X passing", "Y failing", "Z pending"
      const passingMatch = line.match(/(\d+)\s+passing/);
      if (passingMatch) {
        passed = parseInt(passingMatch[1], 10);
      }

      const failingMatch = line.match(/(\d+)\s+failing/);
      if (failingMatch) {
        failed = parseInt(failingMatch[1], 10);
      }

      const pendingMatch = line.match(/(\d+)\s+pending/);
      if (pendingMatch) {
        skipped = parseInt(pendingMatch[1], 10);
      }

      // Parse individual test failures
      // Mocha format: "  1) test name:"
      const failureMatch = line.match(/^\s+\d+\)\s+(.+):/);
      if (failureMatch) {
        const testName = failureMatch[1].trim();
        
        // Look ahead for error message
        let errorMessage = '';
        let stackTrace = '';
        let j = i + 1;
        
        while (j < lines.length && !lines[j].match(/^\s+\d+\)/)) {
          const errorLine = lines[j];
          
          if (errorLine.includes('Error:') || errorLine.includes('AssertionError:')) {
            errorMessage = errorLine.trim();
          } else if (errorLine.trim().startsWith('at ')) {
            stackTrace += errorLine + '\n';
          }
          
          j++;
        }

        failures.push({
          application: app,
          testName,
          testFile: 'unknown', // Would need more sophisticated parsing to extract file
          errorMessage: errorMessage || 'Test failed',
          stackTrace: stackTrace || undefined
        });
      }
    }

    // If we couldn't parse the summary, try to infer from failures
    if (passed === 0 && failed === 0 && failures.length > 0) {
      failed = failures.length;
    }

    return {
      passed,
      failed,
      skipped,
      failures
    };
  }
}

// Export singleton instance
export const testCoordinator = new TestCoordinatorImpl();
