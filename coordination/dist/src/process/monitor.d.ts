/**
 * Process Monitor
 * Monitors application processes for crashes and file changes
 */
import { ProcessManagerImpl, ProcessConfig } from './index';
import { ApplicationName, ProcessStatus } from '../types';
export interface MonitorConfig {
    autoRestart: boolean;
    maxRestarts: number;
    restartDelay: number;
    watchFiles: boolean;
}
export interface MonitorStatus {
    application: ApplicationName;
    status: ProcessStatus;
    restartCount: number;
    lastRestart?: Date;
    watching: boolean;
}
export declare class ProcessMonitor {
    private processManager;
    private monitoredApps;
    private defaultConfig;
    constructor(processManager: ProcessManagerImpl);
    /**
     * Start monitoring an application
     */
    startMonitoring(app: ApplicationName, processConfig: ProcessConfig, monitorConfig?: Partial<MonitorConfig>): void;
    /**
     * Stop monitoring an application
     */
    stopMonitoring(app: ApplicationName): void;
    /**
     * Get monitoring status for an application
     */
    getStatus(app: ApplicationName): MonitorStatus | null;
    /**
     * Manually trigger a restart
     */
    triggerRestart(app: ApplicationName, reason: string): Promise<void>;
    /**
     * Set up crash monitoring with automatic restart
     */
    private setupCrashMonitoring;
    /**
     * Set up file watching with automatic rebuild/restart
     */
    private setupFileWatching;
    /**
     * Restart an application
     */
    private restartApplication;
}
