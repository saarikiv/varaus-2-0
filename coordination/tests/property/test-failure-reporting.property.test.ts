/**
 * Property-Based Tests for Test Failure Reporting
 * Feature: full-stack-coordination, Property 7: Test Failure Reporting
 * Validates: Requirements 3.3
 */

import { expect } from 'chai';
import * as fc from 'fast-check';
import { TestCoordinatorImpl, ApplicationTestResult, TestFailureInfo } from '../../src/test';
import { ApplicationName } from '../../src/types';

describe('Property 7: Test Failure Reporting', () => {
  /**
   * For any test failure, the failure report should include application-specific context 
   * identifying which application's test failed and the specific test case.
   */

  it('should include application context in all failure reports', async function() {
    this.timeout(60000);
    
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          application: fc.constantFrom('frontend' as ApplicationName, 'backend' as ApplicationName),
          testName: fc.string({ minLength: 5, maxLength: 50 }),
          testFile: fc.string({ minLength: 5, maxLength: 30 }),
          errorMessage: fc.string({ minLength: 10, maxLength: 100 }),
          failureCount: fc.integer({ min: 1, max: 10 })
        }),
        async (testData) => {
          const testCoordinator = new TestCoordinatorImpl();
          
          // Mock the runTests method to simulate failures
          const originalRunTests = testCoordinator.runTests.bind(testCoordinator);
          
          testCoordinator.runTests = async (app: ApplicationName) => {
            await new Promise(resolve => setTimeout(resolve, 5));
            
            // Generate failures for the specified application
            const failures: TestFailureInfo[] = [];
            if (app === testData.application) {
              for (let i = 0; i < testData.failureCount; i++) {
                failures.push({
                  application: app,
                  testName: `${testData.testName}_${i}`,
                  testFile: testData.testFile,
                  errorMessage: testData.errorMessage
                });
              }
            }
            
            return {
              success: app !== testData.application,
              application: app,
              testsPassed: app === testData.application ? 0 : 10,
              testsFailed: app === testData.application ? testData.failureCount : 0,
              testsSkipped: 0,
              duration: 5,
              failures,
              output: `Test output for ${app}`
            };
          };
          
          const result = await testCoordinator.runAllTests();
          
          // Get the result for the failing application
          const failingResult = testData.application === 'backend' ? result.backend : result.frontend;
          
          // Property: All failures must include application context
          for (const failure of failingResult.failures) {
            expect(failure).to.have.property('application');
            expect(failure.application).to.equal(testData.application);
            
            // Property: All failures must include test identification
            expect(failure).to.have.property('testName');
            expect(failure.testName).to.be.a('string');
            expect(failure.testName.length).to.be.greaterThan(0);
            
            expect(failure).to.have.property('testFile');
            expect(failure.testFile).to.be.a('string');
            
            expect(failure).to.have.property('errorMessage');
            expect(failure.errorMessage).to.be.a('string');
            expect(failure.errorMessage.length).to.be.greaterThan(0);
          }
          
          // Property: Failure count should match
          expect(failingResult.failures.length).to.equal(testData.failureCount);
          
          // Restore original method
          testCoordinator.runTests = originalRunTests;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should distinguish failures between frontend and backend', async function() {
    this.timeout(60000);
    
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          backendFailures: fc.integer({ min: 0, max: 5 }),
          frontendFailures: fc.integer({ min: 0, max: 5 }),
          backendTestName: fc.string({ minLength: 5, maxLength: 30 }),
          frontendTestName: fc.string({ minLength: 5, maxLength: 30 })
        }),
        async (testData) => {
          const testCoordinator = new TestCoordinatorImpl();
          
          // Mock the runTests method
          const originalRunTests = testCoordinator.runTests.bind(testCoordinator);
          
          testCoordinator.runTests = async (app: ApplicationName) => {
            await new Promise(resolve => setTimeout(resolve, 5));
            
            const failureCount = app === 'backend' ? testData.backendFailures : testData.frontendFailures;
            const testName = app === 'backend' ? testData.backendTestName : testData.frontendTestName;
            
            const failures: TestFailureInfo[] = [];
            for (let i = 0; i < failureCount; i++) {
              failures.push({
                application: app,
                testName: `${testName}_${i}`,
                testFile: `${app}.test.ts`,
                errorMessage: `Test failed in ${app}`
              });
            }
            
            return {
              success: failureCount === 0,
              application: app,
              testsPassed: 10 - failureCount,
              testsFailed: failureCount,
              testsSkipped: 0,
              duration: 5,
              failures,
              output: `Test output for ${app}`
            };
          };
          
          const result = await testCoordinator.runAllTests();
          
          // Property: Backend failures should only reference backend
          for (const failure of result.backend.failures) {
            expect(failure.application).to.equal('backend');
            expect(failure.testName).to.include(testData.backendTestName);
            expect(failure.testFile).to.include('backend');
          }
          
          // Property: Frontend failures should only reference frontend
          for (const failure of result.frontend.failures) {
            expect(failure.application).to.equal('frontend');
            expect(failure.testName).to.include(testData.frontendTestName);
            expect(failure.testFile).to.include('frontend');
          }
          
          // Property: Failure counts should be correct
          expect(result.backend.failures.length).to.equal(testData.backendFailures);
          expect(result.frontend.failures.length).to.equal(testData.frontendFailures);
          
          // Property: No cross-contamination of failures
          const allBackendFailures = result.backend.failures.every(f => f.application === 'backend');
          const allFrontendFailures = result.frontend.failures.every(f => f.application === 'frontend');
          
          expect(allBackendFailures).to.be.true;
          expect(allFrontendFailures).to.be.true;
          
          // Restore original method
          testCoordinator.runTests = originalRunTests;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should provide detailed error information for each failure', async function() {
    this.timeout(60000);
    
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          application: fc.constantFrom('frontend' as ApplicationName, 'backend' as ApplicationName),
          testName: fc.string({ minLength: 5, maxLength: 50 }),
          testFile: fc.string({ minLength: 5, maxLength: 30 }),
          errorMessage: fc.string({ minLength: 10, maxLength: 100 }),
          stackTrace: fc.option(fc.string({ minLength: 20, maxLength: 200 }), { nil: undefined })
        }),
        async (testData) => {
          const testCoordinator = new TestCoordinatorImpl();
          
          // Mock the runTests method
          const originalRunTests = testCoordinator.runTests.bind(testCoordinator);
          
          testCoordinator.runTests = async (app: ApplicationName) => {
            await new Promise(resolve => setTimeout(resolve, 5));
            
            const failures: TestFailureInfo[] = [];
            if (app === testData.application) {
              failures.push({
                application: app,
                testName: testData.testName,
                testFile: testData.testFile,
                errorMessage: testData.errorMessage,
                stackTrace: testData.stackTrace
              });
            }
            
            return {
              success: app !== testData.application,
              application: app,
              testsPassed: app === testData.application ? 0 : 10,
              testsFailed: app === testData.application ? 1 : 0,
              testsSkipped: 0,
              duration: 5,
              failures,
              output: `Test output for ${app}`
            };
          };
          
          const result = await testCoordinator.runAllTests();
          
          // Get the result for the failing application
          const failingResult = testData.application === 'backend' ? result.backend : result.frontend;
          
          // Property: Failure must contain all required fields
          expect(failingResult.failures.length).to.equal(1);
          const failure = failingResult.failures[0];
          
          expect(failure.application).to.equal(testData.application);
          expect(failure.testName).to.equal(testData.testName);
          expect(failure.testFile).to.equal(testData.testFile);
          expect(failure.errorMessage).to.equal(testData.errorMessage);
          
          // Property: Stack trace should match if provided
          if (testData.stackTrace !== undefined) {
            expect(failure.stackTrace).to.equal(testData.stackTrace);
          }
          
          // Restore original method
          testCoordinator.runTests = originalRunTests;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should report failures with application-specific context in test results', async function() {
    this.timeout(60000);
    
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          backendHasFailures: fc.boolean(),
          frontendHasFailures: fc.boolean(),
          backendFailureCount: fc.integer({ min: 1, max: 5 }),
          frontendFailureCount: fc.integer({ min: 1, max: 5 })
        }),
        async (testData) => {
          const testCoordinator = new TestCoordinatorImpl();
          
          // Mock the runTests method
          const originalRunTests = testCoordinator.runTests.bind(testCoordinator);
          
          testCoordinator.runTests = async (app: ApplicationName) => {
            await new Promise(resolve => setTimeout(resolve, 5));
            
            const hasFailures = app === 'backend' ? testData.backendHasFailures : testData.frontendHasFailures;
            const failureCount = app === 'backend' ? testData.backendFailureCount : testData.frontendFailureCount;
            
            const failures: TestFailureInfo[] = [];
            if (hasFailures) {
              for (let i = 0; i < failureCount; i++) {
                failures.push({
                  application: app,
                  testName: `test_${app}_${i}`,
                  testFile: `${app}/test.ts`,
                  errorMessage: `Error in ${app} test ${i}`
                });
              }
            }
            
            return {
              success: !hasFailures,
              application: app,
              testsPassed: hasFailures ? 0 : 10,
              testsFailed: hasFailures ? failureCount : 0,
              testsSkipped: 0,
              duration: 5,
              failures,
              output: `Test output for ${app}`
            };
          };
          
          const result = await testCoordinator.runAllTests();
          
          // Property: Test results should correctly identify which application failed
          expect(result.backend.application).to.equal('backend');
          expect(result.frontend.application).to.equal('frontend');
          
          // Property: Backend failures should be reported in backend results
          if (testData.backendHasFailures) {
            expect(result.backend.success).to.be.false;
            expect(result.backend.testsFailed).to.equal(testData.backendFailureCount);
            expect(result.backend.failures.length).to.equal(testData.backendFailureCount);
            
            // All failures should be for backend
            result.backend.failures.forEach(failure => {
              expect(failure.application).to.equal('backend');
              expect(failure.testName).to.include('backend');
              expect(failure.testFile).to.include('backend');
              expect(failure.errorMessage).to.include('backend');
            });
          }
          
          // Property: Frontend failures should be reported in frontend results
          if (testData.frontendHasFailures) {
            expect(result.frontend.success).to.be.false;
            expect(result.frontend.testsFailed).to.equal(testData.frontendFailureCount);
            expect(result.frontend.failures.length).to.equal(testData.frontendFailureCount);
            
            // All failures should be for frontend
            result.frontend.failures.forEach(failure => {
              expect(failure.application).to.equal('frontend');
              expect(failure.testName).to.include('frontend');
              expect(failure.testFile).to.include('frontend');
              expect(failure.errorMessage).to.include('frontend');
            });
          }
          
          // Restore original method
          testCoordinator.runTests = originalRunTests;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should maintain failure context across multiple test runs', async function() {
    this.timeout(60000);
    
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          runs: fc.integer({ min: 1, max: 3 }),
          failuresPerRun: fc.integer({ min: 1, max: 3 })
        }),
        async (testData) => {
          const testCoordinator = new TestCoordinatorImpl();
          
          // Run tests multiple times
          for (let run = 0; run < testData.runs; run++) {
            // Mock the runTests method
            const originalRunTests = testCoordinator.runTests.bind(testCoordinator);
            
            testCoordinator.runTests = async (app: ApplicationName) => {
              await new Promise(resolve => setTimeout(resolve, 5));
              
              const failures: TestFailureInfo[] = [];
              for (let i = 0; i < testData.failuresPerRun; i++) {
                failures.push({
                  application: app,
                  testName: `test_run${run}_${i}`,
                  testFile: `${app}/test.ts`,
                  errorMessage: `Error in ${app} run ${run} test ${i}`
                });
              }
              
              return {
                success: false,
                application: app,
                testsPassed: 0,
                testsFailed: testData.failuresPerRun,
                testsSkipped: 0,
                duration: 5,
                failures,
                output: `Test output for ${app} run ${run}`
              };
            };
            
            const result = await testCoordinator.runAllTests();
            
            // Property: Each run should maintain proper application context
            expect(result.backend.application).to.equal('backend');
            expect(result.frontend.application).to.equal('frontend');
            
            // Property: Failures should reference the correct run
            result.backend.failures.forEach(failure => {
              expect(failure.application).to.equal('backend');
              expect(failure.testName).to.include(`run${run}`);
              expect(failure.errorMessage).to.include(`run ${run}`);
            });
            
            result.frontend.failures.forEach(failure => {
              expect(failure.application).to.equal('frontend');
              expect(failure.testName).to.include(`run${run}`);
              expect(failure.errorMessage).to.include(`run ${run}`);
            });
            
            // Restore original method
            testCoordinator.runTests = originalRunTests;
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
