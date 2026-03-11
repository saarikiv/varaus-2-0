/**
 * Test Coordinator Module
 * Manages coordinated testing of frontend and backend applications
 */
import { ApplicationName } from '../types';
export type TestType = 'unit' | 'integration' | 'e2e' | 'all';
export interface TestCoordinator {
    runTests(app: ApplicationName, testType?: TestType): Promise<ApplicationTestResult>;
    runAllTests(testType?: TestType): Promise<TestAllResult>;
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
 *
 * Runs frontend and backend tests in parallel, parses Mocha-format output,
 * and reports a unified summary. Supports test type arguments (unit, integration,
 * e2e, all) — integration and e2e fall back to unit with a warning.
 */
export declare class TestCoordinatorImpl implements TestCoordinator {
    private projectRoot;
    constructor(projectRoot?: string);
    /**
     * Run tests for a single application independently.
     * Supports test type argument: unit, integration, e2e, all.
     * Integration and e2e types fall back to unit with a warning.
     */
    runTests(app: ApplicationName, testType?: TestType): Promise<ApplicationTestResult>;
    /**
     * Run tests for all applications independently.
     * Tests run in parallel since they are independent.
     * Supports test type argument forwarded to each application.
     */
    runAllTests(testType?: TestType): Promise<TestAllResult>;
    /**
     * Get application directory path
     */
    private getApplicationDirectory;
    /**
     * Execute test command for an application.
     * For 'unit' type, runs npm test. For 'all', also runs npm test (all tests).
     */
    private executeTests;
    /**
     * Parse test results from Mocha-format test output.
     * Extracts passing/failing/pending counts and individual failure details.
     */
    parseTestResults(app: ApplicationName, output: string): {
        passed: number;
        failed: number;
        skipped: number;
        failures: TestFailureInfo[];
    };
}
export declare const testCoordinator: TestCoordinatorImpl;
