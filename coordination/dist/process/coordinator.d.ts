/**
 * Application Startup Coordinator
 * Manages coordinated startup of frontend and backend applications
 */
import { ProcessManagerImpl, ProcessConfig, ProcessHandle } from './index';
import { ApplicationName, SystemConfig } from '../types';
export interface StartupResult {
    success: boolean;
    backend?: ProcessHandle;
    frontend?: ProcessHandle;
    errors: StartupError[];
}
export interface StartupError {
    application: ApplicationName;
    phase: 'launch' | 'connectivity' | 'configuration';
    message: string;
    troubleshooting: string[];
}
export declare class ApplicationCoordinator {
    private processManager;
    private signalHandlersRegistered;
    constructor(processManager: ProcessManagerImpl);
    /**
     * Start all applications with coordinated startup sequence.
     * Backend starts first, then frontend after backend connectivity is verified.
     * Registers SIGINT/SIGTERM handlers for graceful shutdown.
     */
    startAll(config: SystemConfig): Promise<StartupResult>;
    /**
     * Stop all running applications gracefully.
     */
    stopAll(): Promise<void>;
    /**
     * Legacy method: Start both applications with separate configs.
     * Prefer startAll(config) for new code.
     */
    startBoth(backendConfig: ProcessConfig, frontendConfig: ProcessConfig): Promise<StartupResult>;
    /**
     * Register SIGINT and SIGTERM signal handlers for graceful shutdown.
     */
    registerSignalHandlers(): void;
    /**
     * Verify HTTP connectivity to a URL.
     */
    verifyConnectivity(url: string, timeout?: number): Promise<{
        success: boolean;
        error?: string;
    }>;
    /**
     * Start backend application (used by startBoth).
     */
    private startBackend;
    /**
     * Start frontend application with backend configuration (used by startBoth).
     */
    private startFrontend;
    /**
     * Verify backend connectivity (used by startBoth).
     */
    private verifyBackendConnectivity;
    /**
     * Verify frontend connectivity (used by startBoth).
     */
    private verifyFrontendConnectivity;
    /**
     * Check if an HTTP endpoint is responding.
     */
    private checkHttpEndpoint;
    /**
     * Safely stop applications, ignoring errors for apps that aren't running.
     */
    private safeStop;
    /**
     * Get troubleshooting steps based on error context.
     */
    private getTroubleshootingSteps;
}
