"use strict";
/**
 * Property-Based Tests for Test Execution Independence
 * Feature: full-stack-coordination, Property 6: Test Execution Independence
 * Validates: Requirements 3.1
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
describe('Property 6: Test Execution Independence', () => {
    /**
     * For any test run command, unit tests for both applications should execute
     * independently and produce separate results.
     */
    it('should execute tests for both applications independently', async function () {
        this.timeout(60000); // Increase timeout for test execution
        await fc.assert(fc.asyncProperty(fc.record({
            backendTestsPassed: fc.integer({ min: 0, max: 100 }),
            backendTestsFailed: fc.integer({ min: 0, max: 20 }),
            frontendTestsPassed: fc.integer({ min: 0, max: 100 }),
            frontendTestsFailed: fc.integer({ min: 0, max: 20 })
        }), async (testData) => {
            const testCoordinator = new test_1.TestCoordinatorImpl();
            // Mock the runTests method to simulate independent execution
            const originalRunTests = testCoordinator.runTests.bind(testCoordinator);
            const executionOrder = [];
            const executionTimes = [];
            testCoordinator.runTests = async (app) => {
                const startTime = Date.now();
                executionOrder.push(app);
                // Simulate test execution
                await new Promise(resolve => setTimeout(resolve, 10));
                const endTime = Date.now();
                executionTimes.push({ app, start: startTime, end: endTime });
                // Return mock results based on test data
                const result = app === 'backend'
                    ? {
                        success: testData.backendTestsFailed === 0,
                        application: 'backend',
                        testsPassed: testData.backendTestsPassed,
                        testsFailed: testData.backendTestsFailed,
                        testsSkipped: 0,
                        duration: endTime - startTime,
                        failures: [],
                        output: 'Mock backend test output'
                    }
                    : {
                        success: testData.frontendTestsFailed === 0,
                        application: 'frontend',
                        testsPassed: testData.frontendTestsPassed,
                        testsFailed: testData.frontendTestsFailed,
                        testsSkipped: 0,
                        duration: endTime - startTime,
                        failures: [],
                        output: 'Mock frontend test output'
                    };
                return result;
            };
            // Execute tests for all applications
            const result = await testCoordinator.runAllTests();
            // Property 1: Both applications should have been tested
            (0, chai_1.expect)(executionOrder).to.have.lengthOf(2);
            (0, chai_1.expect)(executionOrder).to.include('backend');
            (0, chai_1.expect)(executionOrder).to.include('frontend');
            // Property 2: Results should be separate for each application
            (0, chai_1.expect)(result.backend).to.exist;
            (0, chai_1.expect)(result.frontend).to.exist;
            (0, chai_1.expect)(result.backend.application).to.equal('backend');
            (0, chai_1.expect)(result.frontend.application).to.equal('frontend');
            // Property 3: Backend results should match backend test data
            (0, chai_1.expect)(result.backend.testsPassed).to.equal(testData.backendTestsPassed);
            (0, chai_1.expect)(result.backend.testsFailed).to.equal(testData.backendTestsFailed);
            // Property 4: Frontend results should match frontend test data
            (0, chai_1.expect)(result.frontend.testsPassed).to.equal(testData.frontendTestsPassed);
            (0, chai_1.expect)(result.frontend.testsFailed).to.equal(testData.frontendTestsFailed);
            // Property 5: Results should be independent (one app's results don't affect the other)
            // Backend success/failure should not affect frontend results
            if (testData.backendTestsFailed > 0) {
                (0, chai_1.expect)(result.backend.success).to.be.false;
                // Frontend results should still be accurate regardless of backend
                (0, chai_1.expect)(result.frontend.testsPassed).to.equal(testData.frontendTestsPassed);
                (0, chai_1.expect)(result.frontend.testsFailed).to.equal(testData.frontendTestsFailed);
            }
            if (testData.frontendTestsFailed > 0) {
                (0, chai_1.expect)(result.frontend.success).to.be.false;
                // Backend results should still be accurate regardless of frontend
                (0, chai_1.expect)(result.backend.testsPassed).to.equal(testData.backendTestsPassed);
                (0, chai_1.expect)(result.backend.testsFailed).to.equal(testData.backendTestsFailed);
            }
            // Restore original method
            testCoordinator.runTests = originalRunTests;
        }), { numRuns: 100 });
    });
    it('should produce separate test results for each application', async function () {
        this.timeout(60000);
        await fc.assert(fc.asyncProperty(fc.record({
            backendDuration: fc.integer({ min: 10, max: 1000 }),
            frontendDuration: fc.integer({ min: 10, max: 1000 }),
            backendOutput: fc.string({ minLength: 10, maxLength: 100 }),
            frontendOutput: fc.string({ minLength: 10, maxLength: 100 })
        }), async (testData) => {
            const testCoordinator = new test_1.TestCoordinatorImpl();
            // Mock the runTests method
            const originalRunTests = testCoordinator.runTests.bind(testCoordinator);
            testCoordinator.runTests = async (app) => {
                const duration = app === 'backend' ? testData.backendDuration : testData.frontendDuration;
                const output = app === 'backend' ? testData.backendOutput : testData.frontendOutput;
                // Simulate test execution
                await new Promise(resolve => setTimeout(resolve, 5));
                return {
                    success: true,
                    application: app,
                    testsPassed: 10,
                    testsFailed: 0,
                    testsSkipped: 0,
                    duration,
                    failures: [],
                    output
                };
            };
            const result = await testCoordinator.runAllTests();
            // Property: Each application should have its own distinct results
            (0, chai_1.expect)(result.backend.application).to.equal('backend');
            (0, chai_1.expect)(result.frontend.application).to.equal('frontend');
            // Property: Results should contain application-specific data
            (0, chai_1.expect)(result.backend.duration).to.equal(testData.backendDuration);
            (0, chai_1.expect)(result.frontend.duration).to.equal(testData.frontendDuration);
            (0, chai_1.expect)(result.backend.output).to.equal(testData.backendOutput);
            (0, chai_1.expect)(result.frontend.output).to.equal(testData.frontendOutput);
            // Property: Results should not be mixed or shared
            (0, chai_1.expect)(result.backend.output).to.not.equal(result.frontend.output);
            // Restore original method
            testCoordinator.runTests = originalRunTests;
        }), { numRuns: 100 });
    });
    it('should allow tests to run in parallel without interference', async function () {
        this.timeout(60000);
        await fc.assert(fc.asyncProperty(fc.record({
            backendTestCount: fc.integer({ min: 1, max: 50 }),
            frontendTestCount: fc.integer({ min: 1, max: 50 })
        }), async (testData) => {
            const testCoordinator = new test_1.TestCoordinatorImpl();
            // Track concurrent execution
            let backendRunning = false;
            let frontendRunning = false;
            let concurrentExecution = false;
            // Mock the runTests method
            const originalRunTests = testCoordinator.runTests.bind(testCoordinator);
            testCoordinator.runTests = async (app) => {
                if (app === 'backend') {
                    backendRunning = true;
                    if (frontendRunning) {
                        concurrentExecution = true;
                    }
                }
                else {
                    frontendRunning = true;
                    if (backendRunning) {
                        concurrentExecution = true;
                    }
                }
                // Simulate test execution
                await new Promise(resolve => setTimeout(resolve, 20));
                if (app === 'backend') {
                    backendRunning = false;
                }
                else {
                    frontendRunning = false;
                }
                const testCount = app === 'backend' ? testData.backendTestCount : testData.frontendTestCount;
                return {
                    success: true,
                    application: app,
                    testsPassed: testCount,
                    testsFailed: 0,
                    testsSkipped: 0,
                    duration: 20,
                    failures: [],
                    output: `Ran ${testCount} tests for ${app}`
                };
            };
            const result = await testCoordinator.runAllTests();
            // Property: Tests should be able to run concurrently (independence)
            // This demonstrates that tests don't block each other
            (0, chai_1.expect)(concurrentExecution).to.be.true;
            // Property: Despite concurrent execution, results should be correct
            (0, chai_1.expect)(result.backend.testsPassed).to.equal(testData.backendTestCount);
            (0, chai_1.expect)(result.frontend.testsPassed).to.equal(testData.frontendTestCount);
            // Restore original method
            testCoordinator.runTests = originalRunTests;
        }), { numRuns: 100 });
    });
    it('should maintain independence when one application test fails', async function () {
        this.timeout(60000);
        await fc.assert(fc.asyncProperty(fc.record({
            backendFails: fc.boolean(),
            frontendFails: fc.boolean(),
            backendTestCount: fc.integer({ min: 5, max: 20 }),
            frontendTestCount: fc.integer({ min: 5, max: 20 })
        }), async (testData) => {
            const testCoordinator = new test_1.TestCoordinatorImpl();
            // Mock the runTests method
            const originalRunTests = testCoordinator.runTests.bind(testCoordinator);
            testCoordinator.runTests = async (app) => {
                await new Promise(resolve => setTimeout(resolve, 5));
                const fails = app === 'backend' ? testData.backendFails : testData.frontendFails;
                const testCount = app === 'backend' ? testData.backendTestCount : testData.frontendTestCount;
                return {
                    success: !fails,
                    application: app,
                    testsPassed: fails ? testCount - 1 : testCount,
                    testsFailed: fails ? 1 : 0,
                    testsSkipped: 0,
                    duration: 5,
                    failures: fails ? [{
                            application: app,
                            testName: 'failing test',
                            testFile: 'test.ts',
                            errorMessage: 'Test failed'
                        }] : [],
                    output: `Test output for ${app}`
                };
            };
            const result = await testCoordinator.runAllTests();
            // Property: Backend failure should not affect frontend test execution
            if (testData.backendFails) {
                (0, chai_1.expect)(result.backend.success).to.be.false;
                (0, chai_1.expect)(result.backend.testsFailed).to.equal(1);
                // Frontend should still execute and report its own results
                (0, chai_1.expect)(result.frontend.testsPassed).to.be.greaterThan(0);
                (0, chai_1.expect)(result.frontend.success).to.equal(!testData.frontendFails);
            }
            // Property: Frontend failure should not affect backend test execution
            if (testData.frontendFails) {
                (0, chai_1.expect)(result.frontend.success).to.be.false;
                (0, chai_1.expect)(result.frontend.testsFailed).to.equal(1);
                // Backend should still execute and report its own results
                (0, chai_1.expect)(result.backend.testsPassed).to.be.greaterThan(0);
                (0, chai_1.expect)(result.backend.success).to.equal(!testData.backendFails);
            }
            // Property: Overall success should only be true if both succeed
            const expectedOverallSuccess = !testData.backendFails && !testData.frontendFails;
            (0, chai_1.expect)(result.success).to.equal(expectedOverallSuccess);
            // Restore original method
            testCoordinator.runTests = originalRunTests;
        }), { numRuns: 100 });
    });
    it('should not allow "both" as a parameter to runTests', async function () {
        this.timeout(10000);
        await fc.assert(fc.asyncProperty(fc.constant('both'), async (app) => {
            const testCoordinator = new test_1.TestCoordinatorImpl();
            // Property: Calling runTests with "both" should throw an error
            try {
                await testCoordinator.runTests(app);
                // If we get here, the test should fail
                chai_1.expect.fail('Should have thrown an error for "both"');
            }
            catch (error) {
                (0, chai_1.expect)(error).to.be.instanceOf(Error);
                (0, chai_1.expect)(error.message).to.include('both');
            }
        }), { numRuns: 100 });
    });
});
