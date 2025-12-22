/**
 * Test Coordinator Module
 * Manages coordinated testing of frontend and backend applications
 */
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
export declare class TestCoordinatorImpl implements TestCoordinator {
    private projectRoot;
    constructor(projectRoot?: string);
    /**
     * Run tests for a single application independently
     */
    runTests(app: ApplicationName): Promise<ApplicationTestResult>;
    /**
     * Run tests for all applications independently
     * Tests run in parallel since they are independent
     */
    runAllTests(): Promise<TestAllResult>;
    /**
     * Get application directory path
     */
    private getApplicationDirectory;
    /**
     * Execute test command for an application
     */
    private executeTests;
    /**
     * Parse test results from test output
     */
    private parseTestResults;
}
export declare const testCoordinator: TestCoordinatorImpl;
