import { expect } from 'chai';
import { ProcessMonitor, MonitorConfig } from '../../src/process/monitor';
import { ProcessManagerImpl, ProcessConfig } from '../../src/process/index';
import { ProcessStatus } from '../../src/types';

/**
 * Stub ProcessManagerImpl that lets us control process status
 * and track method calls without spawning real processes.
 */
class StubProcessManager extends ProcessManagerImpl {
  public statusMap: Map<string, ProcessStatus> = new Map();
  public restartCalls: string[] = [];
  public watchCallbacks: Map<string, Function> = new Map();

  constructor() {
    super('/fake/root');
  }

  getProcessStatus(app: any): ProcessStatus {
    return this.statusMap.get(app) || 'stopped';
  }

  async restartApplication(app: any): Promise<void> {
    this.restartCalls.push(app);
    // Simulate successful restart by setting status to running
    this.statusMap.set(app, 'running');
  }

  watchForChanges(app: any, callback: any): void {
    this.watchCallbacks.set(app, callback);
  }
}

describe('ProcessMonitor', () => {
  let stub: StubProcessManager;
  let monitor: ProcessMonitor;

  beforeEach(() => {
    stub = new StubProcessManager();
    monitor = new ProcessMonitor(stub);
  });

  afterEach(() => {
    // Clean up all monitoring intervals/timeouts
    monitor.stopMonitoring('both');
  });

  describe('startMonitoring', () => {
    it('should throw when monitoring "both"', () => {
      expect(() => monitor.startMonitoring('both', {})).to.throw('Cannot monitor "both"');
    });

    it('should register an application for monitoring', () => {
      stub.statusMap.set('frontend', 'running');
      monitor.startMonitoring('frontend', {}, { watchFiles: false });
      const status = monitor.getStatus('frontend');
      expect(status).to.not.be.null;
      expect(status!.application).to.equal('frontend');
      expect(status!.restartCount).to.equal(0);
    });

    it('should use default config when none provided', () => {
      stub.statusMap.set('backend', 'running');
      monitor.startMonitoring('backend', {});
      const status = monitor.getStatus('backend');
      expect(status).to.not.be.null;
      expect(status!.watching).to.be.true;
    });

    it('should allow overriding config values', () => {
      stub.statusMap.set('frontend', 'running');
      monitor.startMonitoring('frontend', {}, { watchFiles: false, maxRestarts: 5 });
      const status = monitor.getStatus('frontend');
      expect(status).to.not.be.null;
      expect(status!.watching).to.be.false;
    });
  });

  describe('stopMonitoring', () => {
    it('should remove the application from monitoring', () => {
      stub.statusMap.set('frontend', 'running');
      monitor.startMonitoring('frontend', {}, { watchFiles: false });
      monitor.stopMonitoring('frontend');
      expect(monitor.getStatus('frontend')).to.be.null;
    });

    it('should stop both applications when "both" is passed', () => {
      stub.statusMap.set('frontend', 'running');
      stub.statusMap.set('backend', 'running');
      monitor.startMonitoring('frontend', {}, { watchFiles: false });
      monitor.startMonitoring('backend', {}, { watchFiles: false });
      monitor.stopMonitoring('both');
      expect(monitor.getStatus('frontend')).to.be.null;
      expect(monitor.getStatus('backend')).to.be.null;
    });

    it('should be a no-op for an unmonitored application', () => {
      // Should not throw
      monitor.stopMonitoring('frontend');
    });
  });

  describe('getStatus', () => {
    it('should throw when querying "both"', () => {
      expect(() => monitor.getStatus('both')).to.throw('Cannot get status for "both"');
    });

    it('should return null for unmonitored application', () => {
      expect(monitor.getStatus('frontend')).to.be.null;
    });

    it('should reflect current process status from manager', () => {
      stub.statusMap.set('backend', 'running');
      monitor.startMonitoring('backend', {}, { watchFiles: false });
      expect(monitor.getStatus('backend')!.status).to.equal('running');

      stub.statusMap.set('backend', 'error');
      expect(monitor.getStatus('backend')!.status).to.equal('error');
    });
  });

  describe('triggerRestart', () => {
    it('should throw when restarting "both"', async () => {
      try {
        await monitor.triggerRestart('both', 'test');
        expect.fail('Should have thrown');
      } catch (err: any) {
        expect(err.message).to.include('Cannot restart "both"');
      }
    });

    it('should throw for unmonitored application', async () => {
      try {
        await monitor.triggerRestart('frontend', 'test');
        expect.fail('Should have thrown');
      } catch (err: any) {
        expect(err.message).to.include('not being monitored');
      }
    });

    it('should restart and update tracking state', async () => {
      stub.statusMap.set('frontend', 'running');
      monitor.startMonitoring('frontend', {}, { watchFiles: false, autoRestart: false });

      await monitor.triggerRestart('frontend', 'manual');

      expect(stub.restartCalls).to.deep.equal(['frontend']);
      const status = monitor.getStatus('frontend');
      expect(status!.restartCount).to.equal(1);
      expect(status!.lastRestart).to.be.instanceOf(Date);
    });
  });

  describe('crash monitoring (auto-restart)', () => {
    it('should auto-restart when process status becomes "error"', async () => {
      stub.statusMap.set('backend', 'running');
      monitor.startMonitoring('backend', {}, {
        watchFiles: false,
        autoRestart: true,
        maxRestarts: 3,
        restartDelay: 50 // short delay for testing
      });

      // Simulate crash
      stub.statusMap.set('backend', 'error');

      // Wait for poll (5s) + restart delay (50ms) + buffer
      await new Promise(resolve => setTimeout(resolve, 5200));

      expect(stub.restartCalls).to.include('backend');
      const status = monitor.getStatus('backend');
      expect(status!.restartCount).to.be.greaterThan(0);
      expect(status!.lastRestart).to.be.instanceOf(Date);
    }).timeout(10000);

    it('should stop auto-restarts after max restart count is reached', async () => {
      stub.statusMap.set('frontend', 'running');
      monitor.startMonitoring('frontend', {}, {
        watchFiles: false,
        autoRestart: true,
        maxRestarts: 2,
        restartDelay: 10
      });

      // Simulate crash, restart, crash cycle
      stub.statusMap.set('frontend', 'error');

      // Wait for first poll + restart
      await new Promise(resolve => setTimeout(resolve, 5200));
      // Simulate another crash
      stub.statusMap.set('frontend', 'error');
      await new Promise(resolve => setTimeout(resolve, 5200));

      // After 2 restarts, no more should happen
      const countAfterMax = stub.restartCalls.filter(c => c === 'frontend').length;
      stub.restartCalls.length = 0;

      // Simulate another crash
      stub.statusMap.set('frontend', 'error');
      await new Promise(resolve => setTimeout(resolve, 5200));

      // No additional restarts should have been triggered
      const additionalRestarts = stub.restartCalls.filter(c => c === 'frontend').length;
      expect(additionalRestarts).to.equal(0);
    }).timeout(20000);
  });

  describe('file watching with debounce', () => {
    it('should trigger restart after debounce period on file change', async () => {
      stub.statusMap.set('backend', 'running');
      monitor.startMonitoring('backend', {}, {
        watchFiles: true,
        autoRestart: false
      });

      // Simulate file change via the watch callback
      const callback = stub.watchCallbacks.get('backend');
      expect(callback).to.exist;

      callback!({ type: 'change', path: '/fake/src/file.ts', timestamp: new Date() });

      // Before debounce (1000ms), no restart
      await new Promise(resolve => setTimeout(resolve, 500));
      expect(stub.restartCalls).to.be.empty;

      // After debounce
      await new Promise(resolve => setTimeout(resolve, 700));
      expect(stub.restartCalls).to.include('backend');
    }).timeout(5000);

    it('should debounce rapid file changes', async () => {
      stub.statusMap.set('frontend', 'running');
      monitor.startMonitoring('frontend', {}, {
        watchFiles: true,
        autoRestart: false
      });

      const callback = stub.watchCallbacks.get('frontend');
      expect(callback).to.exist;

      // Rapid fire changes
      callback!({ type: 'change', path: '/fake/src/a.ts', timestamp: new Date() });
      await new Promise(resolve => setTimeout(resolve, 200));
      callback!({ type: 'change', path: '/fake/src/b.ts', timestamp: new Date() });
      await new Promise(resolve => setTimeout(resolve, 200));
      callback!({ type: 'change', path: '/fake/src/c.ts', timestamp: new Date() });

      // Wait for debounce from last change
      await new Promise(resolve => setTimeout(resolve, 1200));

      // Should only have restarted once despite 3 file changes
      expect(stub.restartCalls.filter(c => c === 'frontend')).to.have.length(1);
    }).timeout(5000);
  });

  describe('restart tracking per application', () => {
    it('should track restart count independently per application', async () => {
      stub.statusMap.set('frontend', 'running');
      stub.statusMap.set('backend', 'running');
      monitor.startMonitoring('frontend', {}, { watchFiles: false, autoRestart: false });
      monitor.startMonitoring('backend', {}, { watchFiles: false, autoRestart: false });

      await monitor.triggerRestart('frontend', 'test');
      await monitor.triggerRestart('frontend', 'test');
      await monitor.triggerRestart('backend', 'test');

      expect(monitor.getStatus('frontend')!.restartCount).to.equal(2);
      expect(monitor.getStatus('backend')!.restartCount).to.equal(1);
    });

    it('should record last restart timestamp', async () => {
      stub.statusMap.set('backend', 'running');
      monitor.startMonitoring('backend', {}, { watchFiles: false, autoRestart: false });

      const before = new Date();
      await monitor.triggerRestart('backend', 'test');
      const after = new Date();

      const status = monitor.getStatus('backend');
      expect(status!.lastRestart).to.be.instanceOf(Date);
      expect(status!.lastRestart!.getTime()).to.be.at.least(before.getTime());
      expect(status!.lastRestart!.getTime()).to.be.at.most(after.getTime());
    });
  });
});
