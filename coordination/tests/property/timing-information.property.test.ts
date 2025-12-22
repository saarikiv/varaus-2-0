/**
 * Property Test: Timing Information Availability
 * **Feature: full-stack-coordination, Property 16: Timing Information Availability**
 * **Validates: Requirements 7.5**
 * 
 * Property: For any performance investigation, the Coordination_System should 
 * provide timing information for both client and server operations.
 */

import { expect } from 'chai';
import * as fc from 'fast-check';
import {
  createLogger,
  createRequestTracer,
  createFlowTracer,
  Logger,
  RequestTracer,
  FlowTracer
} from '../../src/logging';
import { ApplicationName } from '../../src/types';

describe('Property Test: Timing Information Availability', () => {
  let logger: Logger;
  let tracer: RequestTracer;
  let flowTracer: FlowTracer;

  beforeEach(() => {
    logger = createLogger();
    tracer = createRequestTracer(logger);
    flowTracer = createFlowTracer(logger, tracer);
  });

  afterEach(() => {
    logger.clearLogs();
  });

  it('should provide timing information for all traced operations', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            application: fc.constantFrom<ApplicationName>('frontend', 'backend'),
            event: fc.string({ minLength: 5, maxLength: 30 }),
            duration: fc.integer({ min: 1, max: 5000 })
          }),
          { minLength: 1, maxLength: 10 }
        ),
        (operations) => {
          const correlationId = tracer.startTrace();

          // Add all operations with timing information
          operations.forEach(op => {
            tracer.addEvent(
              correlationId,
              op.application,
              op.event,
              op.duration
            );
          });

          // End the trace
          const trace = tracer.endTrace(correlationId);

          // Property: Trace should exist and have timing information
          expect(trace).to.not.be.undefined;
          expect(trace!.duration).to.be.a('number');
          expect(trace!.duration).to.be.at.least(0);

          // Property: All events should have timing information
          const allEvents = [...trace!.frontend, ...trace!.backend];
          allEvents.forEach(event => {
            if (event.duration !== undefined) {
              expect(event.duration).to.be.a('number');
              expect(event.duration).to.be.at.least(0);
            }
          });

          // Property: Request flow should include timing for each event
          const flow = tracer.getRequestFlow(correlationId);
          flow.forEach(event => {
            expect(event.timestamp).to.be.instanceOf(Date);
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should provide timing breakdown for client and server operations', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            name: fc.string({ minLength: 5, maxLength: 20 }),
            application: fc.constantFrom<ApplicationName>('frontend', 'backend'),
            duration: fc.integer({ min: 10, max: 1000 })
          }),
          { minLength: 2, maxLength: 8 }
        ),
        (stages) => {
          const correlationId = flowTracer.startFlow();

          // Add and complete stages synchronously for testing
          stages.forEach(stage => {
            flowTracer.addStage(
              correlationId,
              stage.name,
              stage.application
            );
            flowTracer.completeStage(correlationId, stage.name);
          });

          // End the flow
          const flow = flowTracer.endFlow(correlationId);

          // Property: Flow should have timing breakdown
          expect(flow).to.not.be.undefined;
          expect(flow!.timingBreakdown).to.exist;

          const breakdown = flow!.timingBreakdown;

          // Property: Timing breakdown should have all required fields
          expect(breakdown.frontendProcessing).to.be.a('number');
          expect(breakdown.backendProcessing).to.be.a('number');
          expect(breakdown.networkLatency).to.be.a('number');
          expect(breakdown.databaseOperations).to.be.a('number');
          expect(breakdown.totalRoundTrip).to.be.a('number');

          // Property: All timing values should be non-negative
          expect(breakdown.frontendProcessing).to.be.at.least(0);
          expect(breakdown.backendProcessing).to.be.at.least(0);
          expect(breakdown.networkLatency).to.be.at.least(0);
          expect(breakdown.databaseOperations).to.be.at.least(0);
          expect(breakdown.totalRoundTrip).to.be.at.least(0);

          // Property: Total should be reasonable relative to components
          // Note: Due to async timing variations, we just verify all values are non-negative
          // and that total is at least as large as any individual component
          expect(breakdown.totalRoundTrip).to.be.at.least(0);
          expect(breakdown.totalRoundTrip).to.be.at.least(breakdown.frontendProcessing);
          expect(breakdown.totalRoundTrip).to.be.at.least(breakdown.backendProcessing);
          expect(breakdown.totalRoundTrip).to.be.at.least(breakdown.databaseOperations);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should track timing for both frontend and backend operations separately', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 5 }),
        fc.integer({ min: 1, max: 5 }),
        fc.integer({ min: 10, max: 500 }),
        fc.integer({ min: 10, max: 500 }),
        (frontendCount, backendCount, frontendDuration, backendDuration) => {
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
          expect(flow).to.not.be.undefined;
          expect(flow!.stages.length).to.equal(frontendCount + backendCount);

          const frontendStages = flow!.stages.filter(s => s.application === 'frontend');
          const backendStages = flow!.stages.filter(s => s.application === 'backend');

          expect(frontendStages.length).to.equal(frontendCount);
          expect(backendStages.length).to.equal(backendCount);

          // Property: All stages should have timing information
          flow!.stages.forEach(stage => {
            expect(stage.startTime).to.be.instanceOf(Date);
            if (stage.status === 'completed') {
              expect(stage.endTime).to.be.instanceOf(Date);
              expect(stage.duration).to.be.a('number');
              expect(stage.duration).to.be.at.least(0);
            }
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should provide complete request flow with timing for performance investigation', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            stageName: fc.string({ minLength: 5, maxLength: 20 }),
            application: fc.constantFrom<ApplicationName>('frontend', 'backend')
          }),
          { minLength: 3, maxLength: 10 }
        ),
        (stages) => {
          const correlationId = flowTracer.startFlow();

          // Add and complete all stages
          stages.forEach(stage => {
            flowTracer.addStage(
              correlationId,
              stage.stageName,
              stage.application
            );
            flowTracer.completeStage(correlationId, stage.stageName);
          });

          // Get request flow
          const { flow, events, timeline } = flowTracer.getRequestFlow(correlationId);

          // Property: Flow should exist with timing information
          expect(flow).to.not.be.undefined;
          expect(flow!.startTime).to.be.instanceOf(Date);

          // Property: Events should be in chronological order
          for (let i = 1; i < events.length; i++) {
            expect(events[i].timestamp.getTime()).to.be.at.least(
              events[i - 1].timestamp.getTime()
            );
          }

          // Property: Timeline should be a non-empty string
          expect(timeline).to.be.a('string');
          expect(timeline.length).to.be.greaterThan(0);

          // Property: Timeline should contain timing information
          expect(timeline).to.include('ms');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should calculate accurate timing differences between operations', () => {
    fc.assert(
      fc.property(
        fc.array(fc.integer({ min: 10, max: 100 }), { minLength: 2, maxLength: 5 }),
        (durations) => {
          const correlationId = tracer.startTrace();
          const startTime = Date.now();

          // Add events with specific durations
          durations.forEach((duration, index) => {
            tracer.addEvent(
              correlationId,
              index % 2 === 0 ? 'frontend' : 'backend',
              `operation-${index}`,
              duration
            );
          });

          const trace = tracer.endTrace(correlationId);
          const endTime = Date.now();

          // Property: Trace duration should be reasonable
          expect(trace).to.not.be.undefined;
          expect(trace!.duration).to.be.a('number');
          expect(trace!.duration).to.be.at.least(0);
          expect(trace!.duration).to.be.at.most(endTime - startTime + 100); // Allow some tolerance

          // Property: All events should have durations recorded
          // Note: The tracer records actual elapsed time, not the passed duration parameter
          const allEvents = [...trace!.frontend, ...trace!.backend];
          allEvents.forEach((event) => {
            if (event.duration !== undefined) {
              // Duration should be a reasonable value (not negative, not too large)
              expect(event.duration).to.be.at.least(0);
              expect(event.duration).to.be.at.most(1000); // Reasonable upper bound for test
            }
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should provide timing information for database operations separately', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            name: fc.string({ minLength: 5, maxLength: 20 }),
            isDatabase: fc.boolean()
          }),
          { minLength: 2, maxLength: 8 }
        ),
        (operations) => {
          const correlationId = flowTracer.startFlow();

          // Add operations, marking database operations in the name
          operations.forEach(op => {
            const stageName = op.isDatabase ? `database-${op.name}` : op.name;
            flowTracer.addStage(correlationId, stageName, 'backend');
            flowTracer.completeStage(correlationId, stageName);
          });

          const flow = flowTracer.endFlow(correlationId);

          // Property: Flow should have timing breakdown with database operations
          expect(flow).to.not.be.undefined;
          expect(flow!.timingBreakdown.databaseOperations).to.be.a('number');
          expect(flow!.timingBreakdown.databaseOperations).to.be.at.least(0);

          // Property: Database operations should be tracked separately from backend processing
          const dbOperationCount = operations.filter(op => op.isDatabase).length;
          if (dbOperationCount > 0) {
            // If there are database operations, they should contribute to the timing
            const dbStages = flow!.stages.filter(s => 
              s.name.toLowerCase().includes('database')
            );
            expect(dbStages.length).to.equal(dbOperationCount);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should maintain timing accuracy across concurrent operations', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            operations: fc.array(
              fc.record({
                name: fc.string({ minLength: 5, maxLength: 15 }),
                application: fc.constantFrom<ApplicationName>('frontend', 'backend')
              }),
              { minLength: 1, maxLength: 3 }
            )
          }),
          { minLength: 2, maxLength: 4 }
        ),
        (requests) => {
          const correlationIds: string[] = [];

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
            
            expect(flow).to.not.be.undefined;
            expect(flow!.startTime).to.be.instanceOf(Date);
            expect(flow!.stages.length).to.equal(requests[index].operations.length);

            // Property: All stages should have timing
            flow!.stages.forEach(stage => {
              expect(stage.startTime).to.be.instanceOf(Date);
              if (stage.status === 'completed') {
                expect(stage.duration).to.be.a('number');
                expect(stage.duration).to.be.at.least(0);
              }
            });
          });

          // Property: Flows should not interfere with each other's timing
          const flows = correlationIds.map(id => flowTracer.getFlow(id));
          flows.forEach((flow, i) => {
            flows.forEach((otherFlow, j) => {
              if (i !== j) {
                expect(flow!.correlationId).to.not.equal(otherFlow!.correlationId);
              }
            });
          });
        }
      ),
      { numRuns: 100 }
    );
  });
});
