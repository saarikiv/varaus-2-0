/**
 * Process Manager Module
 * Handles application lifecycle management and coordination
 */
import { ApplicationName, ProcessStatus, LogStream } from '../types';
export interface ProcessManager {
    startApplication(app: ApplicationName, config: ProcessConfig): Promise<ProcessHandle>;
    stopApplication(app: ApplicationName): Promise<void>;
    restartApplication(app: ApplicationName): Promise<void>;
    getProcessStatus(app: ApplicationName): ProcessStatus;
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
    restartApplication(app: ApplicationName): Promise<void>;
    getProcessStatus(app: ApplicationName): ProcessStatus;
    watchForChanges(app: ApplicationName, callback: ChangeCallback): void;
}
export declare const processManager: ProcessManagerImpl;
export * from './coordinator';
export * from './monitor';
