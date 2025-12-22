"use strict";
/**
 * Property Test: Logging Correlation
 * **Feature: full-stack-coordination, Property 15: Logging Correlation**
 * **Validates: Requirements 7.1, 7.2, 7.4**
 *
 * Property: For any error or traced user action, the Coordination_System should
 * capture correlated logs from both applications with request correlation IDs.
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
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const fc = __importStar(require("fast-check"));
const logging_1 = require("../../src/logging");
describe('Property Test: Logging Correlation', () => {
    let logger;
    let tracer;
    let correlator;
    beforeEach(() => {
        logger = (0, logging_1.createLogger)();
        tracer = (0, logging_1.createRequestTracer)(logger);
        correlator = (0, logging_1.createLogCorrelator)(logger);
    });
    afterEach(() => {
        logger.clearLogs();
    });
    it('should correlate logs from both applications with correlation IDs', () => {
        fc.assert(fc.property(
        // Generate random log messages for frontend and backend
        fc.array(fc.string({ minLength: 5, maxLength: 50 }), { minLength: 1, maxLength: 10 }), fc.array(fc.string({ minLength: 5, maxLength: 50 }), { minLength: 1, maxLength: 10 }), fc.constantFrom('debug', 'info', 'warn', 'error'), (frontendMessages, backendMessages, logLevel) => {
            // Create a correlation ID
            const correlationId = logger.createCorrelationId();
            // Log messages from frontend
            const frontendLogger = (0, logging_1.createLogger)('frontend');
            frontendMessages.forEach(msg => {
                frontendLogger.captureLog({
                    timestamp: new Date(),
                    level: logLevel,
                    application: 'frontend',
                    message: msg,
                    correlationId
                });
            });
            // Log messages from backend
            const backendLogger = (0, logging_1.createLogger)('backend');
            backendMessages.forEach(msg => {
                backendLogger.captureLog({
                    timestamp: new Date(),
                    level: logLevel,
                    application: 'backend',
                    message: msg,
                    correlationId
                });
            });
            // Capture all logs in the main logger
            frontendLogger.getAllLogs().forEach(log => logger.captureLog(log));
            backendLogger.getAllLogs().forEach(log => logger.captureLog(log));
            // Correlate logs
            const correlated = correlator.correlateLogs(correlationId);
            // Property: All logs should be retrievable by correlation ID
            (0, chai_1.expect)(correlated.frontend.length).to.equal(frontendMessages.length);
            (0, chai_1.expect)(correlated.backend.length).to.equal(backendMessages.length);
            // Property: All logs should have the same correlation ID
            correlated.frontend.forEach(log => {
                (0, chai_1.expect)(log.correlationId).to.equal(correlationId);
                (0, chai_1.expect)(log.application).to.equal('frontend');
            });
            correlated.backend.forEach(log => {
                (0, chai_1.expect)(log.correlationId).to.equal(correlationId);
                (0, chai_1.expect)(log.application).to.equal('backend');
            });
            // Property: Timeline should contain all logs in chronological order
            (0, chai_1.expect)(correlated.timeline.length).to.equal(frontendMessages.length + backendMessages.length);
            // Verify timeline is sorted by timestamp
            for (let i = 1; i < correlated.timeline.length; i++) {
                (0, chai_1.expect)(correlated.timeline[i].timestamp.getTime()).to.be.at.least(correlated.timeline[i - 1].timestamp.getTime());
            }
        }), { numRuns: 100 });
    });
    it('should capture error logs with correlation IDs from both applications', () => {
        fc.assert(fc.property(fc.string({ minLength: 10, maxLength: 100 }), fc.string({ minLength: 10, maxLength: 100 }), (frontendError, backendError) => {
            const correlationId = logger.createCorrelationId();
            // Simulate error in frontend
            const frontendLogger = (0, logging_1.createLogger)('frontend');
            frontendLogger.error(frontendError, correlationId);
            // Simulate error in backend
            const backendLogger = (0, logging_1.createLogger)('backend');
            backendLogger.error(backendError, correlationId);
            // Capture logs
            frontendLogger.getAllLogs().forEach(log => logger.captureLog(log));
            backendLogger.getAllLogs().forEach(log => logger.captureLog(log));
            // Get correlated logs
            const logs = logger.getLogsByCorrelationId(correlationId);
            // Property: Both error logs should be captured with correlation ID
            (0, chai_1.expect)(logs.length).to.be.at.least(2);
            const frontendLogs = logs.filter(log => log.application === 'frontend');
            const backendLogs = logs.filter(log => log.application === 'backend');
            (0, chai_1.expect)(frontendLogs.length).to.be.at.least(1);
            (0, chai_1.expect)(backendLogs.length).to.be.at.least(1);
            // Property: All error logs should have error level
            const errorLogs = logs.filter(log => log.level === 'error');
            (0, chai_1.expect)(errorLogs.length).to.be.at.least(2);
            // Property: All logs should have the correlation ID
            logs.forEach(log => {
                (0, chai_1.expect)(log.correlationId).to.equal(correlationId);
            });
        }), { numRuns: 100 });
    });
    it('should trace user actions across both applications with correlation', () => {
        fc.assert(fc.property(fc.array(fc.record({
            application: fc.constantFrom('frontend', 'backend'),
            event: fc.string({ minLength: 5, maxLength: 30 }),
            duration: fc.integer({ min: 1, max: 1000 })
        }), { minLength: 2, maxLength: 10 }), (actions) => {
            const correlationId = tracer.startTrace();
            // Add all events to the trace
            actions.forEach(action => {
                tracer.addEvent(correlationId, action.application, action.event, action.duration);
            });
            // End the trace
            const trace = tracer.endTrace(correlationId);
            // Property: Trace should exist and have correlation ID
            (0, chai_1.expect)(trace).to.not.be.undefined;
            (0, chai_1.expect)(trace.correlationId).to.equal(correlationId);
            // Property: All events should be captured
            const allEvents = [...trace.frontend, ...trace.backend];
            (0, chai_1.expect)(allEvents.length).to.equal(actions.length);
            // Property: Events should be in the correct application arrays
            const frontendActions = actions.filter(a => a.application === 'frontend');
            const backendActions = actions.filter(a => a.application === 'backend');
            (0, chai_1.expect)(trace.frontend.length).to.equal(frontendActions.length);
            (0, chai_1.expect)(trace.backend.length).to.equal(backendActions.length);
            // Property: Request flow should return all events in order
            const flow = tracer.getRequestFlow(correlationId);
            (0, chai_1.expect)(flow.length).to.equal(actions.length);
            // Verify chronological order
            for (let i = 1; i < flow.length; i++) {
                (0, chai_1.expect)(flow[i].timestamp.getTime()).to.be.at.least(flow[i - 1].timestamp.getTime());
            }
        }), { numRuns: 100 });
    });
    it('should maintain correlation across multiple concurrent requests', () => {
        fc.assert(fc.property(fc.array(fc.record({
            messages: fc.array(fc.string({ minLength: 5, maxLength: 30 }), { minLength: 1, maxLength: 5 })
        }), { minLength: 2, maxLength: 5 }), (requests) => {
            const correlationIds = [];
            // Create multiple concurrent requests with different correlation IDs
            requests.forEach(request => {
                const correlationId = logger.createCorrelationId();
                correlationIds.push(correlationId);
                // Log messages for this request from both applications
                const frontendLogger = (0, logging_1.createLogger)('frontend');
                const backendLogger = (0, logging_1.createLogger)('backend');
                request.messages.forEach(msg => {
                    frontendLogger.info(`Frontend: ${msg}`, correlationId);
                    backendLogger.info(`Backend: ${msg}`, correlationId);
                });
                // Capture logs
                frontendLogger.getAllLogs().forEach(log => logger.captureLog(log));
                backendLogger.getAllLogs().forEach(log => logger.captureLog(log));
            });
            // Property: Each correlation ID should have its own isolated logs
            correlationIds.forEach((correlationId, index) => {
                const logs = logger.getLogsByCorrelationId(correlationId);
                const expectedCount = requests[index].messages.length * 2; // frontend + backend
                (0, chai_1.expect)(logs.length).to.equal(expectedCount);
                // Property: All logs should have the correct correlation ID
                logs.forEach(log => {
                    (0, chai_1.expect)(log.correlationId).to.equal(correlationId);
                });
                // Property: Logs should not contain messages from other requests
                const otherCorrelationIds = correlationIds.filter(id => id !== correlationId);
                otherCorrelationIds.forEach(otherId => {
                    logs.forEach(log => {
                        (0, chai_1.expect)(log.correlationId).to.not.equal(otherId);
                    });
                });
            });
        }), { numRuns: 100 });
    });
    it('should analyze request timing with correlation', () => {
        fc.assert(fc.property(fc.array(fc.string({ minLength: 5, maxLength: 20 }), { minLength: 2, maxLength: 8 }), (events) => {
            const correlationId = logger.createCorrelationId();
            // Create logs with timestamps
            const frontendLogger = (0, logging_1.createLogger)('frontend');
            const backendLogger = (0, logging_1.createLogger)('backend');
            events.forEach((event, index) => {
                // Alternate between frontend and backend
                if (index % 2 === 0) {
                    frontendLogger.info(event, correlationId);
                }
                else {
                    backendLogger.info(event, correlationId);
                }
            });
            // Capture logs
            frontendLogger.getAllLogs().forEach(log => logger.captureLog(log));
            backendLogger.getAllLogs().forEach(log => logger.captureLog(log));
            // Analyze timing
            const timing = correlator.analyzeRequestTiming(correlationId);
            // Property: Timing analysis should exist for valid correlation ID
            (0, chai_1.expect)(timing).to.not.be.null;
            // Property: Total duration should be non-negative
            (0, chai_1.expect)(timing.totalDuration).to.be.at.least(0);
            // Property: Frontend and backend durations should be non-negative
            (0, chai_1.expect)(timing.frontendDuration).to.be.at.least(0);
            (0, chai_1.expect)(timing.backendDuration).to.be.at.least(0);
            // Property: Events should match the logged events
            (0, chai_1.expect)(timing.events.length).to.equal(events.length);
            // Property: Events should have timestamps and applications
            timing.events.forEach(event => {
                (0, chai_1.expect)(event.timestamp).to.be.instanceOf(Date);
                (0, chai_1.expect)(['frontend', 'backend']).to.include(event.application);
            });
        }), { numRuns: 100 });
    });
});
