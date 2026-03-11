/**
 * Process Monitor
 * Monitors application processes for crashes and file changes.
 * Polls process status every 5 seconds, auto-restarts on crash with
 * configurable delay and max restart count, and watches src/ for file
 * changes with 1000ms debounce.
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
     * Poll process status every 5 seconds.
     * When a crash is detected (status "error" or "stopped"), schedule
     * a delayed restart unless max restarts have been reached or a
     * restart is already pending.
     */
    private setupCrashMonitoring;
    /**
     * Watch the application src/ directory for file changes.
     * Debounce changes for 1000ms before triggering a restart.
     */
    private setupFileWatching;
    /**
     * Restart an application and update tracking state.
     */
    private performRestart;
}
