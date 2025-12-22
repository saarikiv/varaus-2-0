"use strict";
/**
 * Property-Based Tests for Test Failure Reporting
 * Feature: full-stack-coordination, Property 7: Test Failure Reporting
 * Validates: Requirements 3.3
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const fc = __importStar(require("fast-check"));
const test_1 = require("../../src/test");
describe('Property 7: Test Failure Reporting', () => {
    /**
     * For any test failure, the failure report should include application-specific context
     * identifying which application's test failed and the specific test case.
     */
    it('should include application context in all failure reports', async function () {
        this.timeout(60000);
        await fc.assert(fc.asyncProperty(fc.record({
            application: fc.constantFrom('frontend', 'backend'),
            testName: fc.string({ minLength: 5, maxLength: 50 }),
            testFile: fc.string({ minLength: 5, maxLength: 30 }),
            errorMessage: fc.string({ minLength: 10, maxLength: 100 }),
            failureCount: fc.integer({ min: 1, max: 10 })
        }), async (testData) => {
            const testCoordinator = new test_1.TestCoordinatorImpl();
            // Mock the runTests method to simulate failures
            const originalRunTests = testCoordinator.runTests.bind(testCoordinator);
            testCoordinator.runTests = async (app) => {
                await new Promise(resolve => setTimeout(resolve, 5));
                // Generate failures for the specified application
                const failures = [];
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
                (0, chai_1.expect)(failure).to.have.property('application');
                (0, chai_1.expect)(failure.application).to.equal(testData.application);
                // Property: All failures must include test identification
                (0, chai_1.expect)(failure).to.have.property('testName');
                (0, chai_1.expect)(failure.testName).to.be.a('string');
                (0, chai_1.expect)(failure.testName.length).to.be.greaterThan(0);
                (0, chai_1.expect)(failure).to.have.property('testFile');
                (0, chai_1.expect)(failure.testFile).to.be.a('string');
                (0, chai_1.expect)(failure).to.have.property('errorMessage');
                (0, chai_1.expect)(failure.errorMessage).to.be.a('string');
                (0, chai_1.expect)(failure.errorMessage.length).to.be.greaterThan(0);
            }
            // Property: Failure count should match
            (0, chai_1.expect)(failingResult.failures.length).to.equal(testData.failureCount);
            // Restore original method
            testCoordinator.runTests = originalRunTests;
        }), { numRuns: 100 });
    });
    it('should distinguish failures between frontend and backend', async function () {
        this.timeout(60000);
        await fc.assert(fc.asyncProperty(fc.record({
            backendFailures: fc.integer({ min: 0, max: 5 }),
            frontendFailures: fc.integer({ min: 0, max: 5 }),
            backendTestName: fc.string({ minLength: 5, maxLength: 30 }),
            frontendTestName: fc.string({ minLength: 5, maxLength: 30 })
        }), async (testData) => {
            const testCoordinator = new test_1.TestCoordinatorImpl();
            // Mock the runTests method
            const originalRunTests = testCoordinator.runTests.bind(testCoordinator);
            testCoordinator.runTests = async (app) => {
                await new Promise(resolve => setTimeout(resolve, 5));
                const failureCount = app === 'backend' ? testData.backendFailures : testData.frontendFailures;
                const testName = app === 'backend' ? testData.backendTestName : testData.frontendTestName;
                const failures = [];
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
                (0, chai_1.expect)(failure.application).to.equal('backend');
                (0, chai_1.expect)(failure.testName).to.include(testData.backendTestName);
                (0, chai_1.expect)(failure.testFile).to.include('backend');
            }
            // Property: Frontend failures should only reference frontend
            for (const failure of result.frontend.failures) {
                (0, chai_1.expect)(failure.application).to.equal('frontend');
                (0, chai_1.expect)(failure.testName).to.include(testData.frontendTestName);
                (0, chai_1.expect)(failure.testFile).to.include('frontend');
            }
            // Property: Failure counts should be correct
            (0, chai_1.expect)(result.backend.failures.length).to.equal(testData.backendFailures);
            (0, chai_1.expect)(result.frontend.failures.length).to.equal(testData.frontendFailures);
            // Property: No cross-contamination of failures
            const allBackendFailures = result.backend.failures.every(f => f.application === 'backend');
            const allFrontendFailures = result.frontend.failures.every(f => f.application === 'frontend');
            (0, chai_1.expect)(allBackendFailures).to.be.true;
            (0, chai_1.expect)(allFrontendFailures).to.be.true;
            // Restore original method
            testCoordinator.runTests = originalRunTests;
        }), { numRuns: 100 });
    });
    it('should provide detailed error information for each failure', async function () {
        this.timeout(60000);
        await fc.assert(fc.asyncProperty(fc.record({
            application: fc.constantFrom('frontend', 'backend'),
            testName: fc.string({ minLength: 5, maxLength: 50 }),
            testFile: fc.string({ minLength: 5, maxLength: 30 }),
            errorMessage: fc.string({ minLength: 10, maxLength: 100 }),
            stackTrace: fc.option(fc.string({ minLength: 20, maxLength: 200 }), { nil: undefined })
        }), async (testData) => {
            const testCoordinator = new test_1.TestCoordinatorImpl();
            // Mock the runTests method
            const originalRunTests = testCoordinator.runTests.bind(testCoordinator);
            testCoordinator.runTests = async (app) => {
                await new Promise(resolve => setTimeout(resolve, 5));
                const failures = [];
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
            (0, chai_1.expect)(failingResult.failures.length).to.equal(1);
            const failure = failingResult.failures[0];
            (0, chai_1.expect)(failure.application).to.equal(testData.application);
            (0, chai_1.expect)(failure.testName).to.equal(testData.testName);
            (0, chai_1.expect)(failure.testFile).to.equal(testData.testFile);
            (0, chai_1.expect)(failure.errorMessage).to.equal(testData.errorMessage);
            // Property: Stack trace should match if provided
            if (testData.stackTrace !== undefined) {
                (0, chai_1.expect)(failure.stackTrace).to.equal(testData.stackTrace);
            }
            // Restore original method
            testCoordinator.runTests = originalRunTests;
        }), { numRuns: 100 });
    });
    it('should report failures with application-specific context in test results', async function () {
        this.timeout(60000);
        await fc.assert(fc.asyncProperty(fc.record({
            backendHasFailures: fc.boolean(),
            frontendHasFailures: fc.boolean(),
            backendFailureCount: fc.integer({ min: 1, max: 5 }),
            frontendFailureCount: fc.integer({ min: 1, max: 5 })
        }), async (testData) => {
            const testCoordinator = new test_1.TestCoordinatorImpl();
            // Mock the runTests method
            const originalRunTests = testCoordinator.runTests.bind(testCoordinator);
            testCoordinator.runTests = async (app) => {
                await new Promise(resolve => setTimeout(resolve, 5));
                const hasFailures = app === 'backend' ? testData.backendHasFailures : testData.frontendHasFailures;
                const failureCount = app === 'backend' ? testData.backendFailureCount : testData.frontendFailureCount;
                const failures = [];
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
            (0, chai_1.expect)(result.backend.application).to.equal('backend');
            (0, chai_1.expect)(result.frontend.application).to.equal('frontend');
            // Property: Backend failures should be reported in backend results
            if (testData.backendHasFailures) {
                (0, chai_1.expect)(result.backend.success).to.be.false;
                (0, chai_1.expect)(result.backend.testsFailed).to.equal(testData.backendFailureCount);
                (0, chai_1.expect)(result.backend.failures.length).to.equal(testData.backendFailureCount);
                // All failures should be for backend
                result.backend.failures.forEach(failure => {
                    (0, chai_1.expect)(failure.application).to.equal('backend');
                    (0, chai_1.expect)(failure.testName).to.include('backend');
                    (0, chai_1.expect)(failure.testFile).to.include('backend');
                    (0, chai_1.expect)(failure.errorMessage).to.include('backend');
                });
            }
            // Property: Frontend failures should be reported in frontend results
            if (testData.frontendHasFailures) {
                (0, chai_1.expect)(result.frontend.success).to.be.false;
                (0, chai_1.expect)(result.frontend.testsFailed).to.equal(testData.frontendFailureCount);
                (0, chai_1.expect)(result.frontend.failures.length).to.equal(testData.frontendFailureCount);
                // All failures should be for frontend
                result.frontend.failures.forEach(failure => {
                    (0, chai_1.expect)(failure.application).to.equal('frontend');
                    (0, chai_1.expect)(failure.testName).to.include('frontend');
                    (0, chai_1.expect)(failure.testFile).to.include('frontend');
                    (0, chai_1.expect)(failure.errorMessage).to.include('frontend');
                });
            }
            // Restore original method
            testCoordinator.runTests = originalRunTests;
        }), { numRuns: 100 });
    });
    it('should maintain failure context across multiple test runs', async function () {
        this.timeout(60000);
        await fc.assert(fc.asyncProperty(fc.record({
            runs: fc.integer({ min: 1, max: 3 }),
            failuresPerRun: fc.integer({ min: 1, max: 3 })
        }), async (testData) => {
            const testCoordinator = new test_1.TestCoordinatorImpl();
            // Run tests multiple times
            for (let run = 0; run < testData.runs; run++) {
                // Mock the runTests method
                const originalRunTests = testCoordinator.runTests.bind(testCoordinator);
                testCoordinator.runTests = async (app) => {
                    await new Promise(resolve => setTimeout(resolve, 5));
                    const failures = [];
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
                (0, chai_1.expect)(result.backend.application).to.equal('backend');
                (0, chai_1.expect)(result.frontend.application).to.equal('frontend');
                // Property: Failures should reference the correct run
                result.backend.failures.forEach(failure => {
                    (0, chai_1.expect)(failure.application).to.equal('backend');
                    (0, chai_1.expect)(failure.testName).to.include(`run${run}`);
                    (0, chai_1.expect)(failure.errorMessage).to.include(`run ${run}`);
                });
                result.frontend.failures.forEach(failure => {
                    (0, chai_1.expect)(failure.application).to.equal('frontend');
                    (0, chai_1.expect)(failure.testName).to.include(`run${run}`);
                    (0, chai_1.expect)(failure.errorMessage).to.include(`run ${run}`);
                });
                // Restore original method
                testCoordinator.runTests = originalRunTests;
            }
        }), { numRuns: 100 });
    });
});
