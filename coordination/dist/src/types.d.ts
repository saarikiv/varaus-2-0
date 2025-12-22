/**
 * Shared Types
 * Common types used across all coordination modules
 */
export type Environment = 'development' | 'staging' | 'production';
export type ApplicationName = 'frontend' | 'backend' | 'both';
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';
export type ProcessStatus = 'starting' | 'running' | 'stopping' | 'stopped' | 'error';
export type ConnectivityStatus = 'connected' | 'disconnected' | 'degraded';
export type CORSStatus = 'configured' | 'misconfigured' | 'unknown';
export interface LogEntry {
    timestamp: Date;
    level: LogLevel;
    application?: ApplicationName;
    message: string;
    correlationId?: string;
}
export interface LogStream {
    entries: LogEntry[];
}
export interface MemoryUsage {
    heapUsed: number;
    heapTotal: number;
    external: number;
}
export interface CPUUsage {
    user: number;
    system: number;
}
export interface FirebaseConfig {
    apiKey: string;
    authDomain: string;
    databaseURL: string;
    projectId: string;
    storageBucket: string;
    messagingSenderId: string;
    appId: string;
}
export interface IntegrationStatus {
    apiConnectivity: ConnectivityStatus;
    databaseConnectivity: ConnectivityStatus;
    crossOriginStatus: CORSStatus;
}
