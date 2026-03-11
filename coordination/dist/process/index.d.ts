/**
 * Process Manager Module
 * Handles application lifecycle management and coordination
 */
import { ApplicationName, ProcessStatus, LogStream, LogEntry, LogLevel } from '../types';
export interface ProcessManager {
    startApplication(app: ApplicationName, config: ProcessConfig): Promise<ProcessHandle>;
    stopApplication(app: ApplicationName): Promise<void>;
    restartApplication(app: ApplicationName): Promise<void>;
    getProcessStatus(app: ApplicationName): ProcessStatus;
    getLogEntries(app: ApplicationName): LogEntry[];
    watchForChanges(app: ApplicationName, callback: ChangeCallback): void;
}
export interface ProcessHandle {
    pid: number;
    port?: number;
    status: ProcessStatus;
    logs: LogStream;
}
export interface ProcessConfig {
    port?: number;
    apiEndpoint?: string;
    firebaseConfig?: any;
    environment?: string;
    projectRoot?: string;
    [key: string]: any;
}
export type ChangeCallback = (event: ChangeEvent) => void;
export interface ChangeEvent {
    type: 'add' | 'change' | 'unlink';
    path: string;
    timestamp: Date;
}
/**
 * Process Manager Implementation
 */
export declare class ProcessManagerImpl implements ProcessManager {
    private processes;
    private projectRoot;
    constructor(projectRoot?: string);
    startApplication(app: ApplicationName, config: ProcessConfig): Promise<ProcessHandle>;
    stopApplication(app: ApplicationName): Promise<void>;
    private stopSingle;
    restartApplication(app: ApplicationName): Promise<void>;
    getProcessStatus(app: ApplicationName): ProcessStatus;
    watchForChanges(app: ApplicationName, callback: ChangeCallback): void;
    /**
     * Get log entries for an application (max 1000 per app)
     */
    getLogEntries(app: ApplicationName): LogEntry[];
}
/**
 * Managed Process
 * Represents a single application process with lifecycle management
 */
export declare class ManagedProcess {
    private app;
    config: ProcessConfig;
    private projectRoot;
    private childProcess;
    status: ProcessStatus;
    private logEntries;
    private watchers;
    private fsWatcher;
    constructor(app: ApplicationName, config: ProcessConfig, projectRoot: string);
    start(): Promise<void>;
    stop(): Promise<void>;
    getHandle(): ProcessHandle;
    /**
     * Get a copy of the current log entries
     */
    getLogEntries(): LogEntry[];
    /**
     * Get the current log entry count
     */
    getLogCount(): number;
    /**
     * Add a log entry (used for testing and external log injection)
     */
    addLogEntry(level: LogLevel, message: string): void;
    watchForChanges(callback: ChangeCallback): void;
    private getApplicationDirectory;
    private getStartCommand;
    private getStartArgs;
    private buildEnvironment;
    private waitForReady;
    private log;
}
export declare const processManager: ProcessManagerImpl;
export * from './coordinator';
export * from './monitor';
