/**
 * Logging Module
 * Provides unified logging with correlation IDs for tracing requests across applications.
 *
 * All backend endpoints (including POST /deleteProfile) are captured automatically
 * via correlation IDs — no endpoint-specific logging configuration is required.
 */
import { ApplicationName, LogEntry } from '../types';
export interface Logger {
    debug(message: string, correlationId?: string): void;
    info(message: string, correlationId?: string): void;
    warn(message: string, correlationId?: string): void;
    error(message: string, correlationId?: string): void;
    createCorrelationId(): string;
    captureLog(entry: LogEntry): void;
    getLogsByCorrelationId(correlationId: string): LogEntry[];
    getAllLogs(): LogEntry[];
    clearLogs(): void;
}
export interface RequestTrace {
    correlationId: string;
    startTime: Date;
    endTime?: Date;
    duration?: number;
    frontend: TraceEvent[];
    backend: TraceEvent[];
}
export interface TraceEvent {
    timestamp: Date;
    application: ApplicationName;
    event: string;
    duration?: number;
    metadata?: Record<string, any>;
}
/**
 * Unified Logger Implementation
 */
export declare class UnifiedLogger implements Logger {
    private logs;
    private maxLogs;
    private application?;
    constructor(application?: ApplicationName);
    /**
     * Generate a new correlation ID for request tracing
     */
    createCorrelationId(): string;
    /**
     * Log debug message
     */
    debug(message: string, correlationId?: string): void;
    /**
     * Log info message
     */
    info(message: string, correlationId?: string): void;
    /**
     * Log warning message
     */
    warn(message: string, correlationId?: string): void;
    /**
     * Log error message
     */
    error(message: string, correlationId?: string): void;
    /**
     * Capture a log entry from an application
     */
    captureLog(entry: LogEntry): void;
    /**
     * Get all logs for a specific correlation ID
     */
    getLogsByCorrelationId(correlationId: string): LogEntry[];
    /**
     * Get all captured logs
     */
    getAllLogs(): LogEntry[];
    /**
     * Clear all logs
     */
    clearLogs(): void;
    /**
     * Internal logging method
     */
    private log;
    /**
     * Output log to console
     */
    private outputLog;
    /**
     * Trim logs to prevent memory overflow
     */
    private trimLogs;
}
/**
 * Request Tracer for tracking request flow across applications
 */
export declare class RequestTracer {
    private traces;
    private logger;
    constructor(logger: Logger);
    /**
     * Start a new request trace
     */
    startTrace(correlationId?: string): string;
    /**
     * Add an event to a trace
     */
    addEvent(correlationId: string, application: ApplicationName, event: string, duration?: number, metadata?: Record<string, any>): void;
    /**
     * End a request trace
     */
    endTrace(correlationId: string): RequestTrace | undefined;
    /**
     * Get a trace by correlation ID
     */
    getTrace(correlationId: string): RequestTrace | undefined;
    /**
     * Get all traces
     */
    getAllTraces(): RequestTrace[];
    /**
     * Clear old traces (cleanup)
     */
    clearOldTraces(maxAgeMs?: number): void;
    /**
     * Get complete request flow for a correlation ID
     */
    getRequestFlow(correlationId: string): TraceEvent[];
}
/**
 * Log Correlator - correlates logs from frontend and backend
 */
export declare class LogCorrelator {
    private logger;
    constructor(logger: Logger);
    /**
     * Correlate frontend and backend logs by correlation ID
     */
    correlateLogs(correlationId: string): {
        frontend: LogEntry[];
        backend: LogEntry[];
        timeline: LogEntry[];
    };
    /**
     * Find related logs across applications
     */
    findRelatedLogs(timeWindowMs?: number): Map<string, LogEntry[]>;
    /**
     * Analyze request flow timing
     */
    analyzeRequestTiming(correlationId: string): {
        totalDuration: number;
        frontendDuration: number;
        backendDuration: number;
        events: Array<{
            event: string;
            timestamp: Date;
            application: ApplicationName;
        }>;
    } | null;
}
export declare function createLogger(application?: ApplicationName): Logger;
export declare function createRequestTracer(logger: Logger): RequestTracer;
export declare function createLogCorrelator(logger: Logger): LogCorrelator;
export * from './flow-tracer';
export declare const globalLogger: UnifiedLogger;
export declare const globalTracer: RequestTracer;
export declare const globalCorrelator: LogCorrelator;
