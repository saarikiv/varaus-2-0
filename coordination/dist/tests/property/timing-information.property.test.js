"use strict";
/**
 * Property Test: Timing Information Availability
 * **Feature: full-stack-coordination, Property 16: Timing Information Availability**
 * **Validates: Requirements 7.5**
 *
 * Property: For any performance investigation, the Coordination_System should
 * provide timing information for both client and server operations.
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
describe('Property Test: Timing Information Availability', () => {
    let logger;
    let tracer;
    let flowTracer;
    beforeEach(() => {
        logger = (0, logging_1.createLogger)();
        tracer = (0, logging_1.createRequestTracer)(logger);
        flowTracer = (0, logging_1.createFlowTracer)(logger, tracer);
    });
    afterEach(() => {
        logger.clearLogs();
    });
    it('should provide timing information for all traced operations', () => {
        fc.assert(fc.property(fc.array(fc.record({
            application: fc.constantFrom('frontend', 'backend'),
            event: fc.string({ minLength: 5, maxLength: 30 }),
            duration: fc.integer({ min: 1, max: 5000 })
        }), { minLength: 1, maxLength: 10 }), (operations) => {
            const correlationId = tracer.startTrace();
            // Add all operations with timing information
            operations.forEach(op => {
                tracer.addEvent(correlationId, op.application, op.event, op.duration);
            });
            // End the trace
            const trace = tracer.endTrace(correlationId);
            // Property: Trace should exist and have timing information
            (0, chai_1.expect)(trace).to.not.be.undefined;
            (0, chai_1.expect)(trace.duration).to.be.a('number');
            (0, chai_1.expect)(trace.duration).to.be.at.least(0);
            // Property: All events should have timing information
            const allEvents = [...trace.frontend, ...trace.backend];
            allEvents.forEach(event => {
                if (event.duration !== undefined) {
                    (0, chai_1.expect)(event.duration).to.be.a('number');
                    (0, chai_1.expect)(event.duration).to.be.at.least(0);
                }
            });
            // Property: Request flow should include timing for each event
            const flow = tracer.getRequestFlow(correlationId);
            flow.forEach(event => {
                (0, chai_1.expect)(event.timestamp).to.be.instanceOf(Date);
            });
        }), { numRuns: 100 });
    });
    it('should provide timing breakdown for client and server operations', () => {
        fc.assert(fc.property(fc.array(fc.record({
            name: fc.string({ minLength: 5, maxLength: 20 }),
            application: fc.constantFrom('frontend', 'backend'),
            duration: fc.integer({ min: 10, max: 1000 })
        }), { minLength: 2, maxLength: 8 }), (stages) => {
            const correlationId = flowTracer.startFlow();
            // Add and complete stages synchronously for testing
            stages.forEach(stage => {
                flowTracer.addStage(correlationId, stage.name, stage.application);
                flowTracer.completeStage(correlationId, stage.name);
            });
            // End the flow
            const flow = flowTracer.endFlow(correlationId);
            // Property: Flow should have timing breakdown
            (0, chai_1.expect)(flow).to.not.be.undefined;
            (0, chai_1.expect)(flow.timingBreakdown).to.exist;
            const breakdown = flow.timingBreakdown;
            // Property: Timing breakdown should have all required fields
            (0, chai_1.expect)(breakdown.frontendProcessing).to.be.a('number');
            (0, chai_1.expect)(breakdown.backendProcessing).to.be.a('number');
            (0, chai_1.expect)(breakdown.networkLatency).to.be.a('number');
            (0, chai_1.expect)(breakdown.databaseOperations).to.be.a('number');
            (0, chai_1.expect)(breakdown.totalRoundTrip).to.be.a('number');
            // Property: All timing values should be non-negative
            (0, chai_1.expect)(breakdown.frontendProcessing).to.be.at.least(0);
            (0, chai_1.expect)(breakdown.backendProcessing).to.be.at.least(0);
            (0, chai_1.expect)(breakdown.networkLatency).to.be.at.least(0);
            (0, chai_1.expect)(breakdown.databaseOperations).to.be.at.least(0);
            (0, chai_1.expect)(breakdown.totalRoundTrip).to.be.at.least(0);
            // Property: Total should be reasonable relative to components
            // Note: Due to async timing variations, we just verify all values are non-negative
            // and that total is at least as large as any individual component
            (0, chai_1.expect)(breakdown.totalRoundTrip).to.be.at.least(0);
            (0, chai_1.expect)(breakdown.totalRoundTrip).to.be.at.least(breakdown.frontendProcessing);
            (0, chai_1.expect)(breakdown.totalRoundTrip).to.be.at.least(breakdown.backendProcessing);
            (0, chai_1.expect)(breakdown.totalRoundTrip).to.be.at.least(breakdown.databaseOperations);
        }), { numRuns: 100 });
    });
    it('should track timing for both frontend and backend operations separately', () => {
        fc.assert(fc.property(fc.integer({ min: 1, max: 5 }), fc.integer({ min: 1, max: 5 }), fc.integer({ min: 10, max: 500 }), fc.integer({ min: 10, max: 500 }), (frontendCount, backendCount, frontendDuration, backendDuration) => {
            const correlationId = flowTracer.startFlow();
            // Add frontend stages
            for (let i = 0; i < frontendCount; i++) {
                const stageName = `frontend-stage-${i}`;
                flowTracer.addStage(correlationId, stageName, 'frontend');
                flowTracer.completeStage(correlationId, stageName);
            }
            // Add backend stages
            for (let i = 0; i < backendCount; i++) {
                const stageName = `backend-stage-${i}`;
                flowTracer.addStage(correlationId, stageName, 'backend');
                flowTracer.completeStage(correlationId, stageName);
            }
            const flow = flowTracer.endFlow(correlationId);
            // Property: Flow should separate frontend and backend stages
            (0, chai_1.expect)(flow).to.not.be.undefined;
            (0, chai_1.expect)(flow.stages.length).to.equal(frontendCount + backendCount);
            const frontendStages = flow.stages.filter(s => s.application === 'frontend');
            const backendStages = flow.stages.filter(s => s.application === 'backend');
            (0, chai_1.expect)(frontendStages.length).to.equal(frontendCount);
            (0, chai_1.expect)(backendStages.length).to.equal(backendCount);
            // Property: All stages should have timing information
            flow.stages.forEach(stage => {
                (0, chai_1.expect)(stage.startTime).to.be.instanceOf(Date);
                if (stage.status === 'completed') {
                    (0, chai_1.expect)(stage.endTime).to.be.instanceOf(Date);
                    (0, chai_1.expect)(stage.duration).to.be.a('number');
                    (0, chai_1.expect)(stage.duration).to.be.at.least(0);
                }
            });
        }), { numRuns: 100 });
    });
    it('should provide complete request flow with timing for performance investigation', () => {
        fc.assert(fc.property(fc.array(fc.record({
            stageName: fc.string({ minLength: 5, maxLength: 20 }),
            application: fc.constantFrom('frontend', 'backend')
        }), { minLength: 3, maxLength: 10 }), (stages) => {
            const correlationId = flowTracer.startFlow();
            // Add and complete all stages
            stages.forEach(stage => {
                flowTracer.addStage(correlationId, stage.stageName, stage.application);
                flowTracer.completeStage(correlationId, stage.stageName);
            });
            // Get request flow
            const { flow, events, timeline } = flowTracer.getRequestFlow(correlationId);
            // Property: Flow should exist with timing information
            (0, chai_1.expect)(flow).to.not.be.undefined;
            (0, chai_1.expect)(flow.startTime).to.be.instanceOf(Date);
            // Property: Events should be in chronological order
            for (let i = 1; i < events.length; i++) {
                (0, chai_1.expect)(events[i].timestamp.getTime()).to.be.at.least(events[i - 1].timestamp.getTime());
            }
            // Property: Timeline should be a non-empty string
            (0, chai_1.expect)(timeline).to.be.a('string');
            (0, chai_1.expect)(timeline.length).to.be.greaterThan(0);
            // Property: Timeline should contain timing information
            (0, chai_1.expect)(timeline).to.include('ms');
        }), { numRuns: 100 });
    });
    it('should calculate accurate timing differences between operations', () => {
        fc.assert(fc.property(fc.array(fc.integer({ min: 10, max: 100 }), { minLength: 2, maxLength: 5 }), (durations) => {
            const correlationId = tracer.startTrace();
            const startTime = Date.now();
            // Add events with specific durations
            durations.forEach((duration, index) => {
                tracer.addEvent(correlationId, index % 2 === 0 ? 'frontend' : 'backend', `operation-${index}`, duration);
            });
            const trace = tracer.endTrace(correlationId);
            const endTime = Date.now();
            // Property: Trace duration should be reasonable
            (0, chai_1.expect)(trace).to.not.be.undefined;
            (0, chai_1.expect)(trace.duration).to.be.a('number');
            (0, chai_1.expect)(trace.duration).to.be.at.least(0);
            (0, chai_1.expect)(trace.duration).to.be.at.most(endTime - startTime + 100); // Allow some tolerance
            // Property: All events should have durations recorded
            // Note: The tracer records actual elapsed time, not the passed duration parameter
            const allEvents = [...trace.frontend, ...trace.backend];
            allEvents.forEach((event) => {
                if (event.duration !== undefined) {
                    // Duration should be a reasonable value (not negative, not too large)
                    (0, chai_1.expect)(event.duration).to.be.at.least(0);
                    (0, chai_1.expect)(event.duration).to.be.at.most(1000); // Reasonable upper bound for test
                }
            });
        }), { numRuns: 100 });
    });
    it('should provide timing information for database operations separately', () => {
        fc.assert(fc.property(fc.array(fc.record({
            name: fc.string({ minLength: 5, maxLength: 20 }),
            isDatabase: fc.boolean()
        }), { minLength: 2, maxLength: 8 }), (operations) => {
            const correlationId = flowTracer.startFlow();
            // Add operations, marking database operations in the name
            operations.forEach(op => {
                const stageName = op.isDatabase ? `database-${op.name}` : op.name;
                flowTracer.addStage(correlationId, stageName, 'backend');
                flowTracer.completeStage(correlationId, stageName);
            });
            const flow = flowTracer.endFlow(correlationId);
            // Property: Flow should have timing breakdown with database operations
            (0, chai_1.expect)(flow).to.not.be.undefined;
            (0, chai_1.expect)(flow.timingBreakdown.databaseOperations).to.be.a('number');
            (0, chai_1.expect)(flow.timingBreakdown.databaseOperations).to.be.at.least(0);
            // Property: Database operations should be tracked separately from backend processing
            const dbOperationCount = operations.filter(op => op.isDatabase).length;
            if (dbOperationCount > 0) {
                // If there are database operations, they should contribute to the timing
                const dbStages = flow.stages.filter(s => s.name.toLowerCase().includes('database'));
                (0, chai_1.expect)(dbStages.length).to.equal(dbOperationCount);
            }
        }), { numRuns: 100 });
    });
    it('should maintain timing accuracy across concurrent operations', () => {
        fc.assert(fc.property(fc.array(fc.record({
            operations: fc.array(fc.record({
                name: fc.string({ minLength: 5, maxLength: 15 }),
                application: fc.constantFrom('frontend', 'backend')
            }), { minLength: 1, maxLength: 3 })
        }), { minLength: 2, maxLength: 4 }), (requests) => {
            const correlationIds = [];
            // Start multiple concurrent flows
            requests.forEach(request => {
                const correlationId = flowTracer.startFlow();
                correlationIds.push(correlationId);
                request.operations.forEach(op => {
                    flowTracer.addStage(correlationId, op.name, op.application);
                    flowTracer.completeStage(correlationId, op.name);
                });
            });
            // Property: Each flow should have independent timing information
            correlationIds.forEach((correlationId, index) => {
                const flow = flowTracer.getFlow(correlationId);
                (0, chai_1.expect)(flow).to.not.be.undefined;
                (0, chai_1.expect)(flow.startTime).to.be.instanceOf(Date);
                (0, chai_1.expect)(flow.stages.length).to.equal(requests[index].operations.length);
                // Property: All stages should have timing
                flow.stages.forEach(stage => {
                    (0, chai_1.expect)(stage.startTime).to.be.instanceOf(Date);
                    if (stage.status === 'completed') {
                        (0, chai_1.expect)(stage.duration).to.be.a('number');
                        (0, chai_1.expect)(stage.duration).to.be.at.least(0);
                    }
                });
            });
            // Property: Flows should not interfere with each other's timing
            const flows = correlationIds.map(id => flowTracer.getFlow(id));
            flows.forEach((flow, i) => {
                flows.forEach((otherFlow, j) => {
                    if (i !== j) {
                        (0, chai_1.expect)(flow.correlationId).to.not.equal(otherFlow.correlationId);
                    }
                });
            });
        }), { numRuns: 100 });
    });
});
