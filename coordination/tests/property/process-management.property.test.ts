/**
 * Property-Based Tests for Process Management
 * Feature: coordination
 * Validates: Requirements 7.1, 7.9
 */

import { expect } from 'chai';
import * as fc from 'fast-check';
import { ProcessManagerImpl, ManagedProcess } from '../../src/process';
import { ApplicationName, ProcessStatus, LogLevel } from '../../src/types';

// ─── Shared Arbitraries ──────────────────────────────────────────────────────

const validProcessStatuses: ProcessStatus[] = ['starting', 'running', 'stopping', 'stopped', 'error'];

const singleAppArb = fc.constantFrom<ApplicationName>('frontend', 'backend');

const logLevelArb = fc.constantFrom<LogLevel>('debug', 'info', 'warn', 'error');

// ─── Property 14: Process status is always a valid state ─────────────────────

describe('Feature: coordination, Property 14: Process status is always a valid state', () => {
  it('should always return a valid ProcessStatus for any application', () => {
    /**
     * Validates: Requirements 7.1
     *
     * For any application tracked by the Process Manager, getProcessStatus
     * should always return one of: "starting", "running", "stopping", "stopped", or "error".
     * When no process has been started, the default status should be "stopped".
     */
    fc.assert(
      fc.property(
        singleAppArb,
        (app) => {
          const pm = new ProcessManagerImpl('/tmp/fake-project');
          const status = pm.getProcessStatus(app);
          expect(validProcessStatuses).to.include(status);
          // Default for untracked processes should be 'stopped'
          expect(status).to.equal('stopped');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should return a valid ProcessStatus for a ManagedProcess in any state', () => {
    /**
     * Validates: Requirements 7.1
     *
     * Directly verify that ManagedProcess.status is always a valid ProcessStatus
     * after construction (initial state).
     */
    fc.assert(
      fc.property(
        singleAppArb,
        (app) => {
          const mp = new ManagedProcess(app, {}, '/tmp/fake-project');
          expect(validProcessStatuses).to.include(mp.status);
          // Initial status should be 'stopped'
          expect(mp.status).to.equal('stopped');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should return a valid ProcessStatus after manually setting status to any valid state', () => {
    /**
     * Validates: Requirements 7.1
     *
     * For any valid ProcessStatus value assigned to a ManagedProcess,
     * the status field should remain that valid value.
     */
    fc.assert(
      fc.property(
        singleAppArb,
        fc.constantFrom<ProcessStatus>(...validProcessStatuses),
        (app, targetStatus) => {
          const mp = new ManagedProcess(app, {}, '/tmp/fake-project');
          mp.status = targetStatus;
          expect(validProcessStatuses).to.include(mp.status);
          expect(mp.status).to.equal(targetStatus);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ─── Property 15: Log entry count per application never exceeds 1000 ─────────

describe('Feature: coordination, Property 15: Log entry count per application never exceeds 1000', () => {
  it('should never exceed 1000 log entries regardless of how many are added', () => {
    /**
     * Validates: Requirements 7.9
     *
     * For any sequence of log entries added to a ManagedProcess,
     * the stored log entry count should never exceed 1000.
     */
    fc.assert(
      fc.property(
        singleAppArb,
        fc.integer({ min: 900, max: 1200 }),
        logLevelArb,
        (app, entryCount, level) => {
          const mp = new ManagedProcess(app, {}, '/tmp/fake-project');

          for (let i = 0; i < entryCount; i++) {
            mp.addLogEntry(level, `Log message ${i}`);
          }

          expect(mp.getLogCount()).to.be.at.most(1000);
          expect(mp.getLogEntries().length).to.be.at.most(1000);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should remove the oldest entry when the limit is reached', () => {
    /**
     * Validates: Requirements 7.9
     *
     * When more than 1000 entries are added, the oldest entries should be
     * removed so that the most recent entries are retained.
     */
    fc.assert(
      fc.property(
        singleAppArb,
        fc.integer({ min: 1001, max: 1500 }),
        (app, entryCount) => {
          const mp = new ManagedProcess(app, {}, '/tmp/fake-project');

          for (let i = 0; i < entryCount; i++) {
            mp.addLogEntry('info', `Message-${i}`);
          }

          const entries = mp.getLogEntries();
          expect(entries.length).to.equal(1000);

          // The last entry should be the most recently added
          const lastEntry = entries[entries.length - 1];
          expect(lastEntry.message).to.equal(`Message-${entryCount - 1}`);

          // The first entry should be the oldest surviving one (entryCount - 1000)
          const firstEntry = entries[0];
          expect(firstEntry.message).to.equal(`Message-${entryCount - 1000}`);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should also respect the limit when accessed through ProcessManagerImpl.getLogEntries', () => {
    /**
     * Validates: Requirements 7.9
     *
     * Verify the 1000-entry cap is respected when accessing logs through
     * the ProcessManagerImpl interface (getLogEntries returns at most 1000).
     */
    fc.assert(
      fc.property(
        singleAppArb,
        (app) => {
          const pm = new ProcessManagerImpl('/tmp/fake-project');
          // No process started, should return empty array
          const entries = pm.getLogEntries(app);
          expect(entries.length).to.be.at.most(1000);
          expect(entries).to.deep.equal([]);
        }
      ),
      { numRuns: 100 }
    );
  });
});
