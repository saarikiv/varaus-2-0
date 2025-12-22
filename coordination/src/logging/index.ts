/**
 * Logging Module
 * Provides unified logging with correlation IDs for tracing requests across applications
 */

import { ApplicationName, LogLevel, LogEntry } from '../types';
import { randomUUID } from 'crypto';

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
export class UnifiedLogger implements Logger {
  private logs: LogEntry[] = [];
  private maxLogs: number = 10000; // Prevent memory overflow
  private application?: ApplicationName;

  constructor(application?: ApplicationName) {
    this.application = application;
  }

  /**
   * Generate a new correlation ID for request tracing
   */
  createCorrelationId(): string {
    return randomUUID();
  }

  /**
   * Log debug message
   */
  debug(message: string, correlationId?: string): void {
    this.log('debug', message, correlationId);
  }

  /**
   * Log info message
   */
  info(message: string, correlationId?: string): void {
    this.log('info', message, correlationId);
  }

  /**
   * Log warning message
   */
  warn(message: string, correlationId?: string): void {
    this.log('warn', message, correlationId);
  }

  /**
   * Log error message
   */
  error(message: string, correlationId?: string): void {
    this.log('error', message, correlationId);
  }

  /**
   * Capture a log entry from an application
   */
  captureLog(entry: LogEntry): void {
    this.logs.push(entry);
    this.trimLogs();
    this.outputLog(entry);
  }

  /**
   * Get all logs for a specific correlation ID
   */
  getLogsByCorrelationId(correlationId: string): LogEntry[] {
    return this.logs.filter(log => log.correlationId === correlationId);
  }

  /**
   * Get all captured logs
   */
  getAllLogs(): LogEntry[] {
    return [...this.logs];
  }

  /**
   * Clear all logs
   */
  clearLogs(): void {
    this.logs = [];
  }

  /**
   * Internal logging method
   */
  private log(level: LogLevel, message: string, correlationId?: string): void {
    const entry: LogEntry = {
      timestamp: new Date(),
      level,
      application: this.application,
      message,
      correlationId
    };

    this.captureLog(entry);
  }

  /**
   * Output log to console
   */
  private outputLog(entry: LogEntry): void {
    const timestamp = entry.timestamp.toISOString();
    const app = entry.application ? `[${entry.application}]` : '';
    const corrId = entry.correlationId ? `[${entry.correlationId.substring(0, 8)}]` : '';
    const level = `[${entry.level.toUpperCase()}]`;
    
    const logMessage = `${timestamp} ${level} ${app} ${corrId} ${entry.message}`;

    switch (entry.level) {
      case 'error':
        console.error(logMessage);
        break;
      case 'warn':
        console.warn(logMessage);
        break;
      case 'debug':
        console.debug(logMessage);
        break;
      default:
        console.log(logMessage);
    }
  }

  /**
   * Trim logs to prevent memory overflow
   */
  private trimLogs(): void {
    if (this.logs.length > this.maxLogs) {
      // Remove oldest 10% of logs
      const removeCount = Math.floor(this.maxLogs * 0.1);
      this.logs.splice(0, removeCount);
    }
  }
}

/**
 * Request Tracer for tracking request flow across applications
 */
export class RequestTracer {
  private traces: Map<string, RequestTrace> = new Map();
  private logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger;
  }

  /**
   * Start a new request trace
   */
  startTrace(correlationId?: string): string {
    const id = correlationId || this.logger.createCorrelationId();
    
    const trace: RequestTrace = {
      correlationId: id,
      startTime: new Date(),
      frontend: [],
      backend: []
    };

    this.traces.set(id, trace);
    this.logger.info(`Request trace started`, id);

    return id;
  }

  /**
   * Add an event to a trace
   */
  addEvent(
    correlationId: string,
    application: ApplicationName,
    event: string,
    duration?: number,
    metadata?: Record<string, any>
  ): void {
    const trace = this.traces.get(correlationId);
    if (!trace) {
      this.logger.warn(`Trace not found for correlation ID: ${correlationId}`);
      return;
    }

    const traceEvent: TraceEvent = {
      timestamp: new Date(),
      application: application === 'both' ? 'frontend' : application,
      event,
      duration,
      metadata
    };

    if (application === 'frontend' || application === 'both') {
      trace.frontend.push(traceEvent);
    }
    if (application === 'backend' || application === 'both') {
      trace.backend.push(traceEvent);
    }

    this.logger.debug(`Trace event: ${event}`, correlationId);
  }

  /**
   * End a request trace
   */
  endTrace(correlationId: string): RequestTrace | undefined {
    const trace = this.traces.get(correlationId);
    if (!trace) {
      this.logger.warn(`Trace not found for correlation ID: ${correlationId}`);
      return undefined;
    }

    trace.endTime = new Date();
    trace.duration = trace.endTime.getTime() - trace.startTime.getTime();

    this.logger.info(`Request trace completed (${trace.duration}ms)`, correlationId);

    return trace;
  }

  /**
   * Get a trace by correlation ID
   */
  getTrace(correlationId: string): RequestTrace | undefined {
    return this.traces.get(correlationId);
  }

  /**
   * Get all traces
   */
  getAllTraces(): RequestTrace[] {
    return Array.from(this.traces.values());
  }

  /**
   * Clear old traces (cleanup)
   */
  clearOldTraces(maxAgeMs: number = 3600000): void {
    const now = Date.now();
    const toDelete: string[] = [];

    this.traces.forEach((trace, id) => {
      const traceAge = now - trace.startTime.getTime();
      if (traceAge > maxAgeMs) {
        toDelete.push(id);
      }
    });

    toDelete.forEach(id => this.traces.delete(id));
    
    if (toDelete.length > 0) {
      this.logger.debug(`Cleared ${toDelete.length} old traces`);
    }
  }

  /**
   * Get complete request flow for a correlation ID
   */
  getRequestFlow(correlationId: string): TraceEvent[] {
    const trace = this.traces.get(correlationId);
    if (!trace) {
      return [];
    }

    // Combine and sort events by timestamp
    const allEvents = [...trace.frontend, ...trace.backend];
    allEvents.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    return allEvents;
  }
}

/**
 * Log Correlator - correlates logs from frontend and backend
 */
export class LogCorrelator {
  private logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger;
  }

  /**
   * Correlate frontend and backend logs by correlation ID
   */
  correlateLogs(correlationId: string): {
    frontend: LogEntry[];
    backend: LogEntry[];
    timeline: LogEntry[];
  } {
    const allLogs = this.logger.getLogsByCorrelationId(correlationId);
    
    const frontend = allLogs.filter(log => log.application === 'frontend');
    const backend = allLogs.filter(log => log.application === 'backend');
    
    // Create timeline sorted by timestamp
    const timeline = [...allLogs].sort((a, b) => 
      a.timestamp.getTime() - b.timestamp.getTime()
    );

    return { frontend, backend, timeline };
  }

  /**
   * Find related logs across applications
   */
  findRelatedLogs(timeWindowMs: number = 1000): Map<string, LogEntry[]> {
    const allLogs = this.logger.getAllLogs();
    const related = new Map<string, LogEntry[]>();

    // Group logs by correlation ID
    allLogs.forEach(log => {
      if (log.correlationId) {
        const existing = related.get(log.correlationId) || [];
        existing.push(log);
        related.set(log.correlationId, existing);
      }
    });

    return related;
  }

  /**
   * Analyze request flow timing
   */
  analyzeRequestTiming(correlationId: string): {
    totalDuration: number;
    frontendDuration: number;
    backendDuration: number;
    events: Array<{ event: string; timestamp: Date; application: ApplicationName }>;
  } | null {
    const correlated = this.correlateLogs(correlationId);
    
    if (correlated.timeline.length === 0) {
      return null;
    }

    const firstEvent = correlated.timeline[0];
    const lastEvent = correlated.timeline[correlated.timeline.length - 1];
    const totalDuration = lastEvent.timestamp.getTime() - firstEvent.timestamp.getTime();

    const frontendFirst = correlated.frontend[0];
    const frontendLast = correlated.frontend[correlated.frontend.length - 1];
    const frontendDuration = frontendFirst && frontendLast
      ? frontendLast.timestamp.getTime() - frontendFirst.timestamp.getTime()
      : 0;

    const backendFirst = correlated.backend[0];
    const backendLast = correlated.backend[correlated.backend.length - 1];
    const backendDuration = backendFirst && backendLast
      ? backendLast.timestamp.getTime() - backendFirst.timestamp.getTime()
      : 0;

    const events = correlated.timeline.map(log => ({
      event: log.message,
      timestamp: log.timestamp,
      application: log.application || 'frontend'
    }));

    return {
      totalDuration,
      frontendDuration,
      backendDuration,
      events
    };
  }
}

// Export factory functions
export function createLogger(application?: ApplicationName): Logger {
  return new UnifiedLogger(application);
}

export function createRequestTracer(logger: Logger): RequestTracer {
  return new RequestTracer(logger);
}

export function createLogCorrelator(logger: Logger): LogCorrelator {
  return new LogCorrelator(logger);
}

// Export flow tracer
export * from './flow-tracer';

// Export singleton instance for global use
export const globalLogger = new UnifiedLogger();
export const globalTracer = new RequestTracer(globalLogger);
export const globalCorrelator = new LogCorrelator(globalLogger);
