import { expect } from 'chai';
import { ApplicationCoordinator, StartupResult, StartupError } from '../../src/process/coordinator';
import { ProcessManagerImpl, ProcessHandle, ProcessConfig } from '../../src/process/index';
import { SystemConfig, ApplicationName } from '../../src/types';

function makeSystemConfig(): SystemConfig {
  return {
    frontend: {
      apiEndpoint: 'http://localhost:3001/api',
      firebaseConfig: {
        apiKey: 'key', authDomain: 'auth', databaseURL: 'https://db.firebaseio.com',
        projectId: 'proj', storageBucket: 'bucket', messagingSenderId: 'sender', appId: 'app',
      },
      buildOutputPath: 'dist',
      devServerPort: 8080,
    },
    backend: {
      port: 3001,
      firebaseConfig: {
        apiKey: 'key', authDomain: 'auth', databaseURL: 'https://db.firebaseio.com',
        projectId: 'proj', storageBucket: 'bucket', messagingSenderId: 'sender', appId: 'app',
      },
      corsOrigins: ['http://localhost:8080'],
      logLevel: 'info',
    },
    shared: {
      environment: 'development',
      projectRoot: '/fake/root',
    },
  };
}

function makeHandle(app: 'frontend' | 'backend', port: number): ProcessHandle {
  return {
    pid: app === 'backend' ? 1234 : 5678,
    port,
    status: 'running',
    logs: { entries: [] },
  };
}

/**
 * A fake ProcessManagerImpl that lets us control startApplication/stopApplication behavior.
 */
class FakeProcessManager extends ProcessManagerImpl {
  public startCalls: Array<{ app: ApplicationName; config: ProcessConfig }> = [];
  public stopCalls: ApplicationName[] = [];
  private startResults: Array<ProcessHandle | Error> = [];

  constructor() {
    super('/fake/root');
  }

  setStartResults(...results: Array<ProcessHandle | Error>) {
    this.startResults = results;
  }

  async startApplication(app: ApplicationName, config: ProcessConfig): Promise<ProcessHandle> {
    this.startCalls.push({ app, config });
    const result = this.startResults.shift();
    if (!result) {
      throw new Error('No start result configured');
    }
    if (result instanceof Error) {
      throw result;
    }
    return result;
  }

  async stopApplication(app: ApplicationName): Promise<void> {
    this.stopCalls.push(app);
  }
}

describe('ApplicationCoordinator', () => {
  let fakePm: FakeProcessManager;
  let coordinator: ApplicationCoordinator;
  let originalLog: typeof console.log;

  beforeEach(() => {
    fakePm = new FakeProcessManager();
    coordinator = new ApplicationCoordinator(fakePm);
    // Suppress console output during tests
    originalLog = console.log;
    console.log = () => {};
  });

  afterEach(() => {
    console.log = originalLog;
  });

  describe('startAll', () => {
    it('should return success when both apps start and connectivity passes', async () => {
      const config = makeSystemConfig();
      const backendHandle = makeHandle('backend', 3001);
      const frontendHandle = makeHandle('frontend', 8080);

      fakePm.setStartResults(backendHandle, frontendHandle);
      // Stub verifyConnectivity to always succeed
      (coordinator as any).verifyConnectivity = async () => ({ success: true });

      const result = await coordinator.startAll(config);

      expect(result.success).to.be.true;
      expect(result.backend).to.deep.equal(backendHandle);
      expect(result.frontend).to.deep.equal(frontendHandle);
      expect(result.errors).to.be.empty;
      // Backend should be started first, then frontend
      expect(fakePm.startCalls[0].app).to.equal('backend');
      expect(fakePm.startCalls[1].app).to.equal('frontend');
    });

    it('should stop backend and report failure when backend connectivity fails', async () => {
      const config = makeSystemConfig();
      const backendHandle = makeHandle('backend', 3001);

      fakePm.setStartResults(backendHandle);
      (coordinator as any).verifyConnectivity = async () => ({
        success: false,
        error: 'Backend HTTP connectivity check failed',
      });

      const result = await coordinator.startAll(config);

      expect(result.success).to.be.false;
      expect(result.errors).to.have.length(1);
      expect(result.errors[0].application).to.equal('backend');
      expect(result.errors[0].phase).to.equal('connectivity');
      expect(result.errors[0].troubleshooting).to.be.an('array').that.is.not.empty;
      expect(result.frontend).to.be.undefined;
      // Backend should have been stopped
      expect(fakePm.stopCalls).to.include('backend');
    });

    it('should stop both and report failure when frontend connectivity fails', async () => {
      const config = makeSystemConfig();
      const backendHandle = makeHandle('backend', 3001);
      const frontendHandle = makeHandle('frontend', 8080);

      fakePm.setStartResults(backendHandle, frontendHandle);
      let callCount = 0;
      (coordinator as any).verifyConnectivity = async () => {
        callCount++;
        if (callCount === 1) return { success: true }; // backend passes
        return { success: false, error: 'Frontend not responding' }; // frontend fails
      };

      const result = await coordinator.startAll(config);

      expect(result.success).to.be.false;
      expect(result.errors).to.have.length(1);
      expect(result.errors[0].application).to.equal('frontend');
      expect(result.errors[0].phase).to.equal('connectivity');
      expect(result.errors[0].troubleshooting).to.be.an('array').that.is.not.empty;
      // Both should have been stopped
      expect(fakePm.stopCalls).to.include('both');
    });

    it('should handle backend start failure with cleanup', async () => {
      const config = makeSystemConfig();

      fakePm.setStartResults(new Error('EADDRINUSE'));

      const result = await coordinator.startAll(config);

      expect(result.success).to.be.false;
      expect(result.errors).to.have.length(1);
      expect(result.errors[0].application).to.equal('backend');
      expect(result.errors[0].phase).to.equal('launch');
      expect(result.errors[0].message).to.include('EADDRINUSE');
      expect(fakePm.stopCalls.length).to.be.greaterThan(0);
    });

    it('should handle frontend start failure with cleanup', async () => {
      const config = makeSystemConfig();
      const backendHandle = makeHandle('backend', 3001);

      fakePm.setStartResults(backendHandle, new Error('Frontend startup failed'));
      (coordinator as any).verifyConnectivity = async () => ({ success: true });

      const result = await coordinator.startAll(config);

      expect(result.success).to.be.false;
      expect(result.errors).to.have.length(1);
      expect(result.errors[0].application).to.equal('frontend');
      expect(result.errors[0].phase).to.equal('launch');
      expect(fakePm.stopCalls.length).to.be.greaterThan(0);
    });

    it('should pass correct config to process manager', async () => {
      const config = makeSystemConfig();
      const backendHandle = makeHandle('backend', 3001);
      const frontendHandle = makeHandle('frontend', 8080);

      fakePm.setStartResults(backendHandle, frontendHandle);
      (coordinator as any).verifyConnectivity = async () => ({ success: true });

      await coordinator.startAll(config);

      // Backend config should have the backend port
      expect(fakePm.startCalls[0].config.port).to.equal(3001);
      expect(fakePm.startCalls[0].config.environment).to.equal('development');
      // Frontend config should have the frontend port and API endpoint
      expect(fakePm.startCalls[1].config.port).to.equal(8080);
      expect(fakePm.startCalls[1].config.apiEndpoint).to.equal('http://localhost:3001/api');
    });
  });

  describe('stopAll', () => {
    it('should stop all applications', async () => {
      await coordinator.stopAll();
      expect(fakePm.stopCalls).to.include('both');
    });

    it('should not throw even if stop fails', async () => {
      fakePm.stopApplication = async () => { throw new Error('nothing running'); };
      // Should not throw
      await coordinator.stopAll();
    });
  });

  describe('registerSignalHandlers', () => {
    it('should register handlers only once', () => {
      const listeners: string[] = [];
      const originalOn = process.on.bind(process);
      process.on = ((event: string, listener: any) => {
        listeners.push(event);
        return process;
      }) as any;

      coordinator.registerSignalHandlers();
      coordinator.registerSignalHandlers(); // second call should be no-op

      process.on = originalOn;

      const sigintCount = listeners.filter(e => e === 'SIGINT').length;
      const sigtermCount = listeners.filter(e => e === 'SIGTERM').length;
      expect(sigintCount).to.equal(1);
      expect(sigtermCount).to.equal(1);
    });
  });

  describe('troubleshooting steps', () => {
    it('should provide port-related troubleshooting for EADDRINUSE errors', async () => {
      const config = makeSystemConfig();
      fakePm.setStartResults(new Error('EADDRINUSE: address already in use'));

      const result = await coordinator.startAll(config);

      expect(result.errors[0].troubleshooting.some(
        (s: string) => s.toLowerCase().includes('port')
      )).to.be.true;
    });

    it('should provide file-related troubleshooting for ENOENT errors', async () => {
      const config = makeSystemConfig();
      fakePm.setStartResults(new Error('ENOENT: no such file'));

      const result = await coordinator.startAll(config);

      expect(result.errors[0].troubleshooting.some(
        (s: string) => s.toLowerCase().includes('npm install') || s.toLowerCase().includes('missing')
      )).to.be.true;
    });

    it('should provide Firebase troubleshooting for Firebase errors', async () => {
      const config = makeSystemConfig();
      fakePm.setStartResults(new Error('Firebase initialization failed'));

      const result = await coordinator.startAll(config);

      expect(result.errors[0].troubleshooting.some(
        (s: string) => s.toLowerCase().includes('firebase')
      )).to.be.true;
    });
  });
});
