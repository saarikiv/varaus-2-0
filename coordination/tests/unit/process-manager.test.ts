import { expect } from 'chai';
import { ProcessManagerImpl, ManagedProcess, ProcessConfig } from '../../src/process/index';

describe('ProcessManagerImpl', () => {
  let pm: ProcessManagerImpl;

  beforeEach(() => {
    pm = new ProcessManagerImpl('/fake/root');
  });

  describe('getProcessStatus', () => {
    it('should return "stopped" for an application that has not been started', () => {
      expect(pm.getProcessStatus('frontend')).to.equal('stopped');
      expect(pm.getProcessStatus('backend')).to.equal('stopped');
    });

    it('should throw when querying status for "both"', () => {
      expect(() => pm.getProcessStatus('both')).to.throw('Cannot get status for "both"');
    });
  });

  describe('startApplication', () => {
    it('should throw when trying to start "both"', async () => {
      try {
        await pm.startApplication('both', {});
        expect.fail('Should have thrown');
      } catch (err: any) {
        expect(err.message).to.include('Cannot start "both"');
      }
    });
  });

  describe('stopApplication', () => {
    it('should throw when stopping a non-running single application', async () => {
      try {
        await pm.stopApplication('frontend');
        expect.fail('Should have thrown');
      } catch (err: any) {
        expect(err.message).to.include('frontend is not running');
      }
    });

    it('should not throw when stopping "both" with no running applications', async () => {
      // Should complete without error - gracefully handles missing processes
      await pm.stopApplication('both');
    });
  });

  describe('restartApplication', () => {
    it('should throw when restarting "both"', async () => {
      try {
        await pm.restartApplication('both');
        expect.fail('Should have thrown');
      } catch (err: any) {
        expect(err.message).to.include('Cannot restart "both"');
      }
    });

    it('should throw when restarting a non-running application', async () => {
      try {
        await pm.restartApplication('frontend');
        expect.fail('Should have thrown');
      } catch (err: any) {
        expect(err.message).to.include('frontend is not running');
      }
    });
  });

  describe('watchForChanges', () => {
    it('should throw when watching "both"', () => {
      expect(() => pm.watchForChanges('both', () => {})).to.throw('Cannot watch "both"');
    });

    it('should throw when watching a non-running application', () => {
      expect(() => pm.watchForChanges('frontend', () => {})).to.throw('frontend is not running');
    });
  });

  describe('getLogEntries', () => {
    it('should return empty array for non-running application', () => {
      expect(pm.getLogEntries('frontend')).to.deep.equal([]);
    });

    it('should throw when getting logs for "both"', () => {
      expect(() => pm.getLogEntries('both')).to.throw('Cannot get logs for "both"');
    });
  });
});

describe('ManagedProcess', () => {
  describe('log entry capping', () => {
    it('should cap log entries at 1000', () => {
      const mp = new ManagedProcess('frontend', {}, '/fake/root');

      // Add 1050 log entries
      for (let i = 0; i < 1050; i++) {
        mp.addLogEntry('info', `Log message ${i}`);
      }

      expect(mp.getLogCount()).to.equal(1000);
      // The oldest entries should have been removed
      const entries = mp.getLogEntries();
      expect(entries[0].message).to.equal('Log message 50');
      expect(entries[999].message).to.equal('Log message 1049');
    });

    it('should not exceed 1000 entries even with many additions', () => {
      const mp = new ManagedProcess('backend', {}, '/fake/root');

      for (let i = 0; i < 2000; i++) {
        mp.addLogEntry('info', `Message ${i}`);
      }

      expect(mp.getLogCount()).to.be.at.most(1000);
    });
  });

  describe('status tracking', () => {
    it('should start with "stopped" status', () => {
      const mp = new ManagedProcess('frontend', {}, '/fake/root');
      expect(mp.status).to.equal('stopped');
    });
  });

  describe('getHandle', () => {
    it('should return a handle with correct initial values', () => {
      const mp = new ManagedProcess('frontend', { port: 8080 }, '/fake/root');
      const handle = mp.getHandle();

      expect(handle.pid).to.equal(0);
      expect(handle.port).to.equal(8080);
      expect(handle.status).to.equal('stopped');
      expect(handle.logs.entries).to.be.an('array').that.is.empty;
    });

    it('should include log entries in the handle', () => {
      const mp = new ManagedProcess('backend', {}, '/fake/root');
      mp.addLogEntry('info', 'test message');

      const handle = mp.getHandle();
      expect(handle.logs.entries).to.have.length(1);
      expect(handle.logs.entries[0].message).to.equal('test message');
      expect(handle.logs.entries[0].level).to.equal('info');
      expect(handle.logs.entries[0].application).to.equal('backend');
    });
  });

  describe('log entries', () => {
    it('should capture log entries with correct fields', () => {
      const mp = new ManagedProcess('frontend', {}, '/fake/root');
      mp.addLogEntry('error', 'something went wrong');

      const entries = mp.getLogEntries();
      expect(entries).to.have.length(1);
      expect(entries[0].level).to.equal('error');
      expect(entries[0].message).to.equal('something went wrong');
      expect(entries[0].application).to.equal('frontend');
      expect(entries[0].timestamp).to.be.instanceOf(Date);
    });

    it('should return a copy of log entries', () => {
      const mp = new ManagedProcess('frontend', {}, '/fake/root');
      mp.addLogEntry('info', 'msg1');

      const entries1 = mp.getLogEntries();
      mp.addLogEntry('info', 'msg2');
      const entries2 = mp.getLogEntries();

      // entries1 should not be affected by the second addLogEntry
      expect(entries1).to.have.length(1);
      expect(entries2).to.have.length(2);
    });
  });
});
