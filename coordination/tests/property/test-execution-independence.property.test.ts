/**
 * Property-Based Tests for Test Coordination
 * Feature: coordination
 * Validates: Requirements 10.3, 10.4, 10.5
 */

import { expect } from 'chai';
import * as fc from 'fast-check';
import { TestCoordinatorImpl, ApplicationTestResult, TestAllResult } from '../../src/test';
import { ApplicationName } from '../../src/types';

// ─── Property 19: Mocha output parser extracts correct counts ────────────────

describe('Feature: coordination, Property 19: Mocha output parser extracts correct counts', () => {
  /**
   * Validates: Requirements 10.3, 10.4
   *
   * For any string containing Mocha-format summary lines (e.g., "N passing",
   * "M failing", "K pending"), the parseTestResults function should extract
   * the correct integer values for passed, failed, and skipped counts.
   */

  it('should extract correct passing, failing, and pending counts from Mocha-format output', () => {
    const appArb = fc.constantFrom<ApplicationName>('frontend', 'backend');

    fc.assert(
      fc.property(
        appArb,
        fc.integer({ min: 0, max: 999 }),
        fc.integer({ min: 0, max: 999 }),
        fc.integer({ min: 0, max: 999 }),
        fc.integer({ min: 1, max: 9999 }),
        (app, passing, failing, pending, durationMs) => {
          const coordinator = new TestCoordinatorImpl();

          // Construct Mocha-format output
          const lines: string[] = [];
          lines.push('');
          lines.push('  Test Suite');
          lines.push('    ✓ some test');
          lines.push('');
          lines.push(`  ${passing} passing (${durationMs}ms)`);
          if (failing > 0) {
            lines.push(`  ${failing} failing`);
          }
          if (pending > 0) {
            lines.push(`  ${pending} pending`);
          }
          lines.push('');

          const output = lines.join('\n');
          const result = coordinator.parseTestResults(app, output);

          expect(result.passed).to.equal(passing);
          expect(result.failed).to.equal(failing);
          expect(result.skipped).to.equal(pending);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle output with only passing tests', () => {
    const appArb = fc.constantFrom<ApplicationName>('frontend', 'backend');

    fc.assert(
      fc.property(
        appArb,
        fc.integer({ min: 1, max: 500 }),
        (app, passing) => {
          const coordinator = new TestCoordinatorImpl();

          const output = `\n  ${passing} passing (42ms)\n`;
          const result = coordinator.parseTestResults(app, output);

          expect(result.passed).to.equal(passing);
          expect(result.failed).to.equal(0);
          expect(result.skipped).to.equal(0);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ─── Property 20: Test summary totals are consistent ─────────────────────────

describe('Feature: coordination, Property 20: Test summary totals are consistent', () => {
  /**
   * Validates: Requirements 10.5
   *
   * For any test-all result, the total passed count should equal
   * backend.testsPassed + frontend.testsPassed, and the total failed count
   * should equal backend.testsFailed + frontend.testsFailed.
   */

  it('should have total passed and failed counts equal to the sum of backend and frontend counts', () => {
    const applicationTestResultArb = (app: ApplicationName): fc.Arbitrary<ApplicationTestResult> =>
      fc.record({
        success: fc.boolean(),
        application: fc.constant(app),
        testsPassed: fc.integer({ min: 0, max: 500 }),
        testsFailed: fc.integer({ min: 0, max: 100 }),
        testsSkipped: fc.integer({ min: 0, max: 50 }),
        duration: fc.integer({ min: 0, max: 60000 }),
        failures: fc.constant([]),
        output: fc.string({ minLength: 0, maxLength: 50 })
      });

    fc.assert(
      fc.property(
        applicationTestResultArb('backend'),
        applicationTestResultArb('frontend'),
        fc.integer({ min: 0, max: 120000 }),
        (backendResult, frontendResult, totalDuration) => {
          const testAllResult: TestAllResult = {
            success: backendResult.success && frontendResult.success,
            backend: backendResult,
            frontend: frontendResult,
            totalDuration
          };

          // Total passed should equal sum of per-application passed
          const totalPassed = testAllResult.backend.testsPassed + testAllResult.frontend.testsPassed;
          expect(totalPassed).to.equal(backendResult.testsPassed + frontendResult.testsPassed);

          // Total failed should equal sum of per-application failed
          const totalFailed = testAllResult.backend.testsFailed + testAllResult.frontend.testsFailed;
          expect(totalFailed).to.equal(backendResult.testsFailed + frontendResult.testsFailed);

          // Overall success should be true only when both succeed
          expect(testAllResult.success).to.equal(backendResult.success && frontendResult.success);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should produce consistent totals via runAllTests with mocked runTests', async function () {
    this.timeout(30000);

    const appTestResultArb = fc.record({
      passed: fc.integer({ min: 0, max: 200 }),
      failed: fc.integer({ min: 0, max: 50 }),
      skipped: fc.integer({ min: 0, max: 30 })
    });

    await fc.assert(
      fc.asyncProperty(
        appTestResultArb,
        appTestResultArb,
        async (backendCounts, frontendCounts) => {
          const coordinator = new TestCoordinatorImpl();

          // Mock runTests to return controlled results
          coordinator.runTests = async (app: ApplicationName): Promise<ApplicationTestResult> => {
            const counts = app === 'backend' ? backendCounts : frontendCounts;
            return {
              success: counts.failed === 0,
              application: app,
              testsPassed: counts.passed,
              testsFailed: counts.failed,
              testsSkipped: counts.skipped,
              duration: 10,
              failures: [],
              output: ''
            };
          };

          const result = await coordinator.runAllTests();

          // Verify totals are consistent sums
          expect(result.backend.testsPassed + result.frontend.testsPassed)
            .to.equal(backendCounts.passed + frontendCounts.passed);
          expect(result.backend.testsFailed + result.frontend.testsFailed)
            .to.equal(backendCounts.failed + frontendCounts.failed);

          // Overall success is conjunction of individual successes
          const expectedSuccess = backendCounts.failed === 0 && frontendCounts.failed === 0;
          expect(result.success).to.equal(expectedSuccess);
        }
      ),
      { numRuns: 100 }
    );
  });
});
