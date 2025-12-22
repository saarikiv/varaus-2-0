/**
 * Application Startup Coordinator
 * Manages coordinated startup of frontend and backend applications
 */
import { ProcessManagerImpl, ProcessConfig, ProcessHandle } from './index';
import { ApplicationName } from '../types';
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
    constructor(processManager: ProcessManagerImpl);
    /**
     * Start both applications with proper coordination
     * Backend starts first, then frontend after backend connectivity is verified
     */
    startBoth(backendConfig: ProcessConfig, frontendConfig: ProcessConfig): Promise<StartupResult>;
    /**
     * Start backend application
     */
    private startBackend;
    /**
     * Start frontend application with backend configuration
     */
    private startFrontend;
    /**
     * Verify backend connectivity (HTTP and Firebase)
     */
    private verifyBackendConnectivity;
    /**
     * Verify frontend connectivity to backend
     */
    private verifyFrontendConnectivity;
    /**
     * Check if an HTTP endpoint is responding
     */
    private checkHttpEndpoint;
    /**
     * Get troubleshooting steps based on error
     */
    private getTroubleshootingSteps;
}
