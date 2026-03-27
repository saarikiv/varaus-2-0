"use strict";
/**
 * Logging Module
 * Provides unified logging with correlation IDs for tracing requests across applications.
 *
 * All backend endpoints (including POST /deleteProfile) are captured automatically
 * via correlation IDs — no endpoint-specific logging configuration is required.
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.globalCorrelator = exports.globalTracer = exports.globalLogger = exports.LogCorrelator = exports.RequestTracer = exports.UnifiedLogger = void 0;
exports.createLogger = createLogger;
exports.createRequestTracer = createRequestTracer;
exports.createLogCorrelator = createLogCorrelator;
const crypto_1 = require("crypto");
/**
 * Unified Logger Implementation
 */
class UnifiedLogger {
    logs = [];
    maxLogs = 10000; // Prevent memory overflow
    application;
    constructor(application) {
        this.application = application;
    }
    /**
     * Generate a new correlation ID for request tracing
     */
    createCorrelationId() {
        return (0, crypto_1.randomUUID)();
    }
    /**
     * Log debug message
     */
    debug(message, correlationId) {
        this.log('debug', message, correlationId);
    }
    /**
     * Log info message
     */
    info(message, correlationId) {
        this.log('info', message, correlationId);
    }
    /**
     * Log warning message
     */
    warn(message, correlationId) {
        this.log('warn', message, correlationId);
    }
    /**
     * Log error message
     */
    error(message, correlationId) {
        this.log('error', message, correlationId);
    }
    /**
     * Capture a log entry from an application
     */
    captureLog(entry) {
        this.logs.push(entry);
        this.trimLogs();
        this.outputLog(entry);
    }
    /**
     * Get all logs for a specific correlation ID
     */
    getLogsByCorrelationId(correlationId) {
        return this.logs.filter(log => log.correlationId === correlationId);
    }
    /**
     * Get all captured logs
     */
    getAllLogs() {
        return [...this.logs];
    }
    /**
     * Clear all logs
     */
    clearLogs() {
        this.logs = [];
    }
    /**
     * Internal logging method
     */
    log(level, message, correlationId) {
        const entry = {
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
    outputLog(entry) {
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
    trimLogs() {
        if (this.logs.length > this.maxLogs) {
            // Remove oldest 10% of logs
            const removeCount = Math.floor(this.maxLogs * 0.1);
            this.logs.splice(0, removeCount);
        }
    }
}
exports.UnifiedLogger = UnifiedLogger;
/**
 * Request Tracer for tracking request flow across applications
 */
class RequestTracer {
    traces = new Map();
    logger;
    constructor(logger) {
        this.logger = logger;
    }
    /**
     * Start a new request trace
     */
    startTrace(correlationId) {
        const id = correlationId || this.logger.createCorrelationId();
        const trace = {
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
    addEvent(correlationId, application, event, duration, metadata) {
        const trace = this.traces.get(correlationId);
        if (!trace) {
            this.logger.warn(`Trace not found for correlation ID: ${correlationId}`);
            return;
        }
        const traceEvent = {
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
    endTrace(correlationId) {
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
    getTrace(correlationId) {
        return this.traces.get(correlationId);
    }
    /**
     * Get all traces
     */
    getAllTraces() {
        return Array.from(this.traces.values());
    }
    /**
     * Clear old traces (cleanup)
     */
    clearOldTraces(maxAgeMs = 3600000) {
        const now = Date.now();
        const toDelete = [];
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
    getRequestFlow(correlationId) {
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
exports.RequestTracer = RequestTracer;
/**
 * Log Correlator - correlates logs from frontend and backend
 */
class LogCorrelator {
    logger;
    constructor(logger) {
        this.logger = logger;
    }
    /**
     * Correlate frontend and backend logs by correlation ID
     */
    correlateLogs(correlationId) {
        const allLogs = this.logger.getLogsByCorrelationId(correlationId);
        const frontend = allLogs.filter(log => log.application === 'frontend');
        const backend = allLogs.filter(log => log.application === 'backend');
        // Create timeline sorted by timestamp
        const timeline = [...allLogs].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
        return { frontend, backend, timeline };
    }
    /**
     * Find related logs across applications
     */
    findRelatedLogs(timeWindowMs = 1000) {
        const allLogs = this.logger.getAllLogs();
        const related = new Map();
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
    analyzeRequestTiming(correlationId) {
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
exports.LogCorrelator = LogCorrelator;
// Export factory functions
function createLogger(application) {
    return new UnifiedLogger(application);
}
function createRequestTracer(logger) {
    return new RequestTracer(logger);
}
function createLogCorrelator(logger) {
    return new LogCorrelator(logger);
}
// Export flow tracer
__exportStar(require("./flow-tracer"), exports);
// Export singleton instance for global use
exports.globalLogger = new UnifiedLogger();
exports.globalTracer = new RequestTracer(exports.globalLogger);
exports.globalCorrelator = new LogCorrelator(exports.globalLogger);
