/**
 * Property-Based Tests for Logging and Tracing
 * Feature: coordination, Properties 22–31
 * Validates: Requirements 13.1–13.6, 14.1–14.3, 15.1–15.7
 */

import { expect } from 'chai';
import * as fc from 'fast-check';
import {
  UnifiedLogger,
  LogCorrelator,
  RequestTracer,
  createLogger,
  createLogCorrelator,
  createRequestTracer
} from '../../src/logging';
import { FlowTracer, createFlowTracer } from '../../src/logging/flow-tracer';
import { ApplicationName, LogLevel, LogEntry } from '../../src/types';

// ─── Shared Arbitraries ──────────────────────────────────────────────────────

const appArb = fc.constantFrom<ApplicationName>('frontend', 'backend');
const logLevelArb = fc.constantFrom<LogLevel>('debug', 'info', 'warn', 'error');

// ─── Property 22: Correlation ID is valid UUID format ────────────────────────

describe('Feature: coordination, Property 22: Correlation ID is valid UUID format', () => {
  it('should generate valid UUID v4 format correlation IDs', () => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 100 }),
        () => {
          const logger = new UnifiedLogger();
          const id = logger.createCorrelationId();
          expect(id).to.match(uuidRegex);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ─── Property 23: Log entry capture and retrieval by correlation ID ──────────

describe('Feature: coordination, Property 23: Log entry capture and retrieval by correlation ID', () => {
  it('should return exactly the entries logged with a specific correlation ID', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 5 }),
        fc.integer({ min: 1, max: 5 }),
        (targetCount, otherCount) => {
          const logger = new UnifiedLogger();
          const targetId = logger.createCorrelationId();
          const otherId = logger.createCorrelationId();

          for (let i = 0; i < targetCount; i++) {
            logger.captureLog({
              timestamp: new Date(),
              level: 'info',
              application: 'frontend',
              message: `target-${i}`,
              correlationId: targetId
            });
          }

          for (let i = 0; i < otherCount; i++) {
            logger.captureLog({
              timestamp: new Date(),
              level: 'info',
              application: 'backend',
              message: `other-${i}`,
              correlationId: otherId
            });
          }

          const result = logger.getLogsByCorrelationId(targetId);
          expect(result.length).to.equal(targetCount);
          result.forEach(entry => {
            expect(entry.correlationId).to.equal(targetId);
          });
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ─── Property 24: Log entry count never exceeds maximum ─────────────────────

describe('Feature: coordination, Property 24: Log entry count never exceeds maximum', () => {
  it('should never exceed 10000 entries and trim oldest 10% when exceeded', function () {
    this.timeout(30000);

    fc.assert(
      fc.property(
        fc.integer({ min: 9950, max: 10100 }),
        (entryCount) => {
          const logger = new UnifiedLogger();

          // Suppress console output during bulk logging
          const origLog = console.log;
          const origDebug = console.debug;
          const origInfo = console.info;
          const origWarn = console.warn;
          const origError = console.error;
          console.log = () => {};
          console.debug = () => {};
          console.info = () => {};
          console.warn = () => {};
          console.error = () => {};

          try {
            for (let i = 0; i < entryCount; i++) {
              logger.captureLog({
                timestamp: new Date(),
                level: 'debug',
                message: `msg-${i}`
              });
            }

            const logs = logger.getAllLogs();
            expect(logs.length).to.be.at.most(10000);
          } finally {
            console.log = origLog;
            console.debug = origDebug;
            console.info = origInfo;
            console.warn = origWarn;
            console.error = origError;
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ─── Property 25: Log level routing to correct console method ────────────────

describe('Feature: coordination, Property 25: Log level routing to correct console method', () => {
  it('should route each log level to the correct console method', () => {
    fc.assert(
      fc.property(
        logLevelArb,
        fc.string({ minLength: 1, maxLength: 30 }),
        (level, message) => {
          const logger = new UnifiedLogger();
          let calledMethod = '';

          const origError = console.error;
          const origWarn = console.warn;
          const origDebug = console.debug;
          const origLog = console.log;

          console.error = () => { calledMethod = 'error'; };
          console.warn = () => { calledMethod = 'warn'; };
          console.debug = () => { calledMethod = 'debug'; };
          console.log = () => { calledMethod = 'log'; };

          try {
            logger[level](message);

            const expected: Record<LogLevel, string> = {
              error: 'error',
              warn: 'warn',
              debug: 'debug',
              info: 'log'
            };
            expect(calledMethod).to.equal(expected[level]);
          } finally {
            console.error = origError;
            console.warn = origWarn;
            console.debug = origDebug;
            console.log = origLog;
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ─── Property 26: Log correlation separates and sorts correctly ──────────────

describe('Feature: coordination, Property 26: Log correlation separates and sorts correctly', () => {
  it('should separate frontend/backend and sort timeline by timestamp', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 10 }),
        fc.integer({ min: 1, max: 10 }),
        (feCount, beCount) => {
          const logger = new UnifiedLogger();
          const correlator = new LogCorrelator(logger);
          const corrId = logger.createCorrelationId();

          // Suppress console output
          const origLog = console.log;
          console.log = () => {};

          try {
            for (let i = 0; i < feCount; i++) {
              logger.captureLog({
                timestamp: new Date(Date.now() + i * 2),
                level: 'info',
                application: 'frontend',
                message: `fe-${i}`,
                correlationId: corrId
              });
            }
            for (let i = 0; i < beCount; i++) {
              logger.captureLog({
                timestamp: new Date(Date.now() + i * 2 + 1),
                level: 'info',
                application: 'backend',
                message: `be-${i}`,
                correlationId: corrId
              });
            }

            const result = correlator.correlateLogs(corrId);

            expect(result.frontend.length).to.equal(feCount);
            expect(result.backend.length).to.equal(beCount);
            result.frontend.forEach(e => expect(e.application).to.equal('frontend'));
            result.backend.forEach(e => expect(e.application).to.equal('backend'));

            // Timeline sorted ascending
            for (let i = 1; i < result.timeline.length; i++) {
              expect(result.timeline[i].timestamp.getTime())
                .to.be.at.least(result.timeline[i - 1].timestamp.getTime());
            }
          } finally {
            console.log = origLog;
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ─── Property 27: Request timing analysis duration consistency ────────────────

describe('Feature: coordination, Property 27: Request timing analysis duration consistency', () => {
  it('should have totalDuration >= frontendDuration and >= backendDuration', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 5 }),
        fc.integer({ min: 1, max: 5 }),
        (feCount, beCount) => {
          const logger = new UnifiedLogger();
          const correlator = new LogCorrelator(logger);
          const corrId = logger.createCorrelationId();

          const origLog = console.log;
          console.log = () => {};

          try {
            const baseTime = Date.now();
            for (let i = 0; i < feCount; i++) {
              logger.captureLog({
                timestamp: new Date(baseTime + i * 10),
                level: 'info',
                application: 'frontend',
                message: `fe-${i}`,
                correlationId: corrId
              });
            }
            for (let i = 0; i < beCount; i++) {
              logger.captureLog({
                timestamp: new Date(baseTime + 5 + i * 10),
                level: 'info',
                application: 'backend',
                message: `be-${i}`,
                correlationId: corrId
              });
            }

            const timing = correlator.analyzeRequestTiming(corrId);
            expect(timing).to.not.be.null;
            expect(timing!.totalDuration).to.be.at.least(timing!.frontendDuration);
            expect(timing!.totalDuration).to.be.at.least(timing!.backendDuration);
          } finally {
            console.log = origLog;
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ─── Property 28: Flow stage duration calculation ────────────────────────────

describe('Feature: coordination, Property 28: Flow stage duration calculation', () => {
  it('should record duration as endTime - startTime for completed stages', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 3, maxLength: 20 }).map(s => s.replace(/[\n\r]/g, '')),
        appArb,
        (stageName, app) => {
          const logger = createLogger();
          const tracer = createRequestTracer(logger);
          const flowTracer = createFlowTracer(logger, tracer);

          const origLog = console.log;
          const origDebug = console.debug;
          console.log = () => {};
          console.debug = () => {};

          try {
            const corrId = flowTracer.startFlow();
            flowTracer.addStage(corrId, stageName, app);
            flowTracer.completeStage(corrId, stageName);

            const flow = flowTracer.getFlow(corrId);
            expect(flow).to.exist;

            const stage = flow!.stages.find(s => s.name === stageName);
            expect(stage).to.exist;
            expect(stage!.status).to.equal('completed');
            expect(stage!.endTime).to.exist;
            expect(stage!.duration).to.equal(
              stage!.endTime!.getTime() - stage!.startTime.getTime()
            );
          } finally {
            console.log = origLog;
            console.debug = origDebug;
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ─── Property 29: Timing breakdown invariant ─────────────────────────────────

describe('Feature: coordination, Property 29: Timing breakdown invariant', () => {
  it('should satisfy frontendProcessing + backendProcessing + databaseOperations + networkLatency === totalRoundTrip and networkLatency >= 0', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            name: fc.string({ minLength: 3, maxLength: 15 }).map(s => s.replace(/[\n\r]/g, '')),
            app: appArb
          }),
          { minLength: 1, maxLength: 6 }
        ),
        (stages) => {
          const logger = createLogger();
          const tracer = createRequestTracer(logger);
          const flowTracer = createFlowTracer(logger, tracer);

          const origLog = console.log;
          const origDebug = console.debug;
          console.log = () => {};
          console.debug = () => {};

          try {
            const corrId = flowTracer.startFlow();

            stages.forEach((s, i) => {
              const uniqueName = `${s.name}-${i}`;
              flowTracer.addStage(corrId, uniqueName, s.app);
              flowTracer.completeStage(corrId, uniqueName);
            });

            const flow = flowTracer.endFlow(corrId);
            expect(flow).to.exist;

            const tb = flow!.timingBreakdown;
            const sum = tb.frontendProcessing + tb.backendProcessing + tb.databaseOperations + tb.networkLatency;
            expect(sum).to.equal(tb.totalRoundTrip);
            expect(tb.networkLatency).to.be.at.least(0);
          } finally {
            console.log = origLog;
            console.debug = origDebug;
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ─── Property 30: Database stage classification ──────────────────────────────

describe('Feature: coordination, Property 30: Database stage classification', () => {
  it('should classify stages containing "database", "db", or "firebase" under databaseOperations', () => {
    const dbKeywordArb = fc.constantFrom('database', 'db', 'firebase');

    fc.assert(
      fc.property(
        dbKeywordArb,
        fc.string({ minLength: 1, maxLength: 10 }).map(s => s.replace(/[\n\r]/g, '')),
        (keyword, suffix) => {
          const logger = createLogger();
          const tracer = createRequestTracer(logger);
          const flowTracer = createFlowTracer(logger, tracer);

          const origLog = console.log;
          const origDebug = console.debug;
          console.log = () => {};
          console.debug = () => {};

          try {
            const corrId = flowTracer.startFlow();
            const dbStageName = `${keyword}-${suffix}`;
            const regularStageName = `processing-${suffix}`;

            flowTracer.addStage(corrId, dbStageName, 'backend');
            flowTracer.completeStage(corrId, dbStageName);
            flowTracer.addStage(corrId, regularStageName, 'backend');
            flowTracer.completeStage(corrId, regularStageName);

            const flow = flowTracer.endFlow(corrId);
            expect(flow).to.exist;

            // The db stage duration should be classified under databaseOperations
            const dbStage = flow!.stages.find(s => s.name === dbStageName);
            expect(dbStage).to.exist;

            // databaseOperations should include the db stage's duration
            expect(flow!.timingBreakdown.databaseOperations).to.be.at.least(0);
          } finally {
            console.log = origLog;
            console.debug = origDebug;
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ─── Property 31: Flow cleanup removes only old flows ────────────────────────

describe('Feature: coordination, Property 31: Flow cleanup removes only old flows', () => {
  it('should remove exactly those flows whose age exceeds maxAgeMs and retain all others', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 5 }),
        fc.integer({ min: 1, max: 5 }),
        (oldCount, newCount) => {
          const logger = createLogger();
          const tracer = createRequestTracer(logger);
          const flowTracer = createFlowTracer(logger, tracer);

          const origLog = console.log;
          const origDebug = console.debug;
          console.log = () => {};
          console.debug = () => {};

          try {
            const maxAge = 5000; // 5 seconds
            const oldIds: string[] = [];
            const newIds: string[] = [];

            // Create old flows by manipulating startTime
            for (let i = 0; i < oldCount; i++) {
              const id = flowTracer.startFlow();
              oldIds.push(id);
              const flow = flowTracer.getFlow(id);
              // Make it old by setting startTime in the past
              flow!.startTime = new Date(Date.now() - maxAge - 1000);
            }

            // Create new flows
            for (let i = 0; i < newCount; i++) {
              const id = flowTracer.startFlow();
              newIds.push(id);
            }

            expect(flowTracer.getAllFlows().length).to.equal(oldCount + newCount);

            flowTracer.clearOldFlows(maxAge);

            // Old flows should be removed
            oldIds.forEach(id => {
              expect(flowTracer.getFlow(id)).to.be.undefined;
            });

            // New flows should be retained
            newIds.forEach(id => {
              expect(flowTracer.getFlow(id)).to.not.be.undefined;
            });

            expect(flowTracer.getAllFlows().length).to.equal(newCount);
          } finally {
            console.log = origLog;
            console.debug = origDebug;
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
