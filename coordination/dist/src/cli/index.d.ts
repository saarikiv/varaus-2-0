/**
 * Coordination CLI Module
 * Provides command-line interface for managing both applications
 */
import { Environment, ApplicationName, LogStream, ProcessStatus, MemoryUsage, CPUUsage, IntegrationStatus } from '../types';
export interface CoordinationCLI {
    start(environment: Environment): Promise<void>;
    build(environment: Environment): Promise<BuildResult>;
    test(testType: TestType): Promise<TestResult>;
    deploy(target: DeploymentTarget): Promise<DeploymentResult>;
    status(): Promise<SystemStatus>;
    logs(application?: ApplicationName): Promise<LogStream>;
}
export type TestType = 'unit' | 'integration' | 'e2e' | 'all';
export type DeploymentTarget = 'staging' | 'production';
export interface BuildResult {
    success: boolean;
    artifacts: BuildArtifact[];
    duration: number;
    errors?: BuildError[];
}
export interface BuildArtifact {
    application: ApplicationName;
    path: string;
    size: number;
    hash: string;
}
export interface BuildError {
    application: ApplicationName;
    message: string;
    file?: string;
    line?: number;
}
export interface TestResult {
    success: boolean;
    passed: number;
    failed: number;
    duration: number;
    failures?: TestFailure[];
}
export interface TestFailure {
    application: ApplicationName;
    testName: string;
    message: string;
}
export interface DeploymentResult {
    success: boolean;
    environment: Environment;
    timestamp: Date;
    healthChecksPassed: boolean;
}
export interface SystemStatus {
    frontend: ApplicationStatus;
    backend: ApplicationStatus;
    integration: IntegrationStatus;
    environment: Environment;
    uptime: number;
}
export interface ApplicationStatus {
    status: ProcessStatus;
    port?: number;
    pid?: number;
    memory: MemoryUsage;
    cpu: CPUUsage;
    lastRestart?: Date;
}
/**
 * Coordination CLI Implementation
 */
export declare class CoordinationCLIImpl implements CoordinationCLI {
    private configManager;
    private processManager;
    private buildCoordinator;
    private testCoordinator;
    private startTime;
    private currentEnvironment?;
    constructor(projectRoot?: string);
    /**
     * Start both applications in development environment
     * Requirements: 1.1
     */
    start(environment: Environment): Promise<void>;
    /**
     * Build both applications for specified environment
     * Requirements: 2.1
     */
    build(environment: Environment): Promise<BuildResult>;
    /**
     * Run tests for both applications
     * Requirements: 3.1
     */
    test(testType: TestType): Promise<TestResult>;
    /**
     * Get current system status
     * Requirements: 1.1
     */
    status(): Promise<SystemStatus>;
    /**
     * Get logs from applications
     * Requirements: 1.1
     */
    logs(application?: ApplicationName): Promise<LogStream>;
    /**
     * Deploy applications to staging or production
     * Requirements: 2.4, 2.5
     */
    deploy(target: DeploymentTarget): Promise<DeploymentResult>;
    /**
     * Set up graceful shutdown handlers
     */
    private setupGracefulShutdown;
    /**
     * Provide troubleshooting guidance based on error
     */
    private provideTroubleshootingGuidance;
}
export declare const coordinationCLI: CoordinationCLIImpl;
