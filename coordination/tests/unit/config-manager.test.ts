import { expect } from 'chai';
import { ConfigManager } from '../../src/config/index';

function setEnvVars(env: Record<string, string>) {
  for (const [key, value] of Object.entries(env)) {
    process.env[key] = value;
  }
}

function clearEnvVars(keys: string[]) {
  for (const key of keys) {
    delete process.env[key];
  }
}

function makeDevEnvVars(): Record<string, string> {
  return {
    FRONTEND_API_ENDPOINT: 'http://localhost:3000/api',
    BACKEND_PORT: '3000',
    DEVELOPMENT_FIREBASE_API_KEY: 'test-key',
    DEVELOPMENT_FIREBASE_AUTH_DOMAIN: 'test.firebaseapp.com',
    DEVELOPMENT_FIREBASE_DATABASE_URL: 'https://test.firebaseio.com',
    DEVELOPMENT_FIREBASE_PROJECT_ID: 'test-project',
    DEVELOPMENT_FIREBASE_STORAGE_BUCKET: 'test.appspot.com',
    DEVELOPMENT_FIREBASE_MESSAGING_SENDER_ID: '123456',
    DEVELOPMENT_FIREBASE_APP_ID: '1:123:web:abc',
  };
}

function makeStagingEnvVars(): Record<string, string> {
  return {
    FRONTEND_API_ENDPOINT: 'https://staging.varaus.example.com/api',
    BACKEND_PORT: '3000',
    STAGING_FIREBASE_API_KEY: 'staging-key',
    STAGING_FIREBASE_AUTH_DOMAIN: 'staging.firebaseapp.com',
    STAGING_FIREBASE_DATABASE_URL: 'https://staging.firebaseio.com',
    STAGING_FIREBASE_PROJECT_ID: 'staging-project',
    STAGING_FIREBASE_STORAGE_BUCKET: 'staging.appspot.com',
    STAGING_FIREBASE_MESSAGING_SENDER_ID: '654321',
    STAGING_FIREBASE_APP_ID: '1:654:web:def',
  };
}

function makeProductionEnvVars(): Record<string, string> {
  return {
    FRONTEND_API_ENDPOINT: 'https://varaus.example.com/api',
    BACKEND_PORT: '3000',
    PRODUCTION_FIREBASE_API_KEY: 'prod-key',
    PRODUCTION_FIREBASE_AUTH_DOMAIN: 'prod.firebaseapp.com',
    PRODUCTION_FIREBASE_DATABASE_URL: 'https://prod.firebaseio.com',
    PRODUCTION_FIREBASE_PROJECT_ID: 'prod-project',
    PRODUCTION_FIREBASE_STORAGE_BUCKET: 'prod.appspot.com',
    PRODUCTION_FIREBASE_MESSAGING_SENDER_ID: '789012',
    PRODUCTION_FIREBASE_APP_ID: '1:789:web:ghi',
  };
}

describe('ConfigManager', () => {
  let savedEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    savedEnv = { ...process.env };
  });

  afterEach(() => {
    process.env = savedEnv;
  });

  describe('loadConfig()', () => {
    it('should load development config from environment variables', async () => {
      const vars = makeDevEnvVars();
      setEnvVars(vars);

      const manager = new ConfigManager('/project');
      const config = await manager.loadConfig('development');

      expect(config.frontend.apiEndpoint).to.equal('http://localhost:3000/api');
      expect(config.backend.port).to.equal(3000);
      expect(config.frontend.firebaseConfig.projectId).to.equal('test-project');
      expect(config.backend.firebaseConfig.projectId).to.equal('test-project');
      expect(config.shared.environment).to.equal('development');
      expect(config.shared.projectRoot).to.equal('/project');
    });

    it('should load staging config with STAGING_ prefixed Firebase vars', async () => {
      const vars = makeStagingEnvVars();
      setEnvVars(vars);

      const manager = new ConfigManager('/project');
      const config = await manager.loadConfig('staging');

      expect(config.frontend.firebaseConfig.apiKey).to.equal('staging-key');
      expect(config.frontend.firebaseConfig.projectId).to.equal('staging-project');
      expect(config.shared.environment).to.equal('staging');
    });

    it('should load production config with PRODUCTION_ prefixed Firebase vars', async () => {
      const vars = makeProductionEnvVars();
      setEnvVars(vars);

      const manager = new ConfigManager('/project');
      const config = await manager.loadConfig('production');

      expect(config.frontend.firebaseConfig.apiKey).to.equal('prod-key');
      expect(config.shared.environment).to.equal('production');
    });

    it('should throw error identifying missing variable name, application, and environment', async () => {
      // Set all vars except FRONTEND_API_ENDPOINT
      const vars = makeDevEnvVars();
      delete vars.FRONTEND_API_ENDPOINT;
      setEnvVars(vars);

      const manager = new ConfigManager('/project');
      try {
        await manager.loadConfig('development');
        expect.fail('Should have thrown');
      } catch (err: any) {
        expect(err.message).to.include('FRONTEND_API_ENDPOINT');
        expect(err.message).to.include('frontend');
        expect(err.message).to.include('development');
      }
    });

    it('should throw error when BACKEND_PORT is missing', async () => {
      const vars = makeDevEnvVars();
      delete vars.BACKEND_PORT;
      setEnvVars(vars);

      const manager = new ConfigManager('/project');
      try {
        await manager.loadConfig('development');
        expect.fail('Should have thrown');
      } catch (err: any) {
        expect(err.message).to.include('BACKEND_PORT');
        expect(err.message).to.include('backend');
        expect(err.message).to.include('development');
      }
    });

    it('should throw error when a Firebase variable is missing', async () => {
      const vars = makeDevEnvVars();
      delete vars.DEVELOPMENT_FIREBASE_PROJECT_ID;
      setEnvVars(vars);

      const manager = new ConfigManager('/project');
      try {
        await manager.loadConfig('development');
        expect.fail('Should have thrown');
      } catch (err: any) {
        expect(err.message).to.include('DEVELOPMENT_FIREBASE_PROJECT_ID');
        expect(err.message).to.include('development');
      }
    });

    it('should use default CORS origins for development', async () => {
      const vars = makeDevEnvVars();
      setEnvVars(vars);

      const manager = new ConfigManager('/project');
      const config = await manager.loadConfig('development');

      expect(config.backend.corsOrigins).to.deep.equal(['http://localhost:8080']);
    });

    it('should use default CORS origins for staging', async () => {
      const vars = makeStagingEnvVars();
      setEnvVars(vars);

      const manager = new ConfigManager('/project');
      const config = await manager.loadConfig('staging');

      expect(config.backend.corsOrigins).to.deep.equal(['https://staging.varaus.example.com']);
    });

    it('should use default CORS origins for production', async () => {
      const vars = makeProductionEnvVars();
      setEnvVars(vars);

      const manager = new ConfigManager('/project');
      const config = await manager.loadConfig('production');

      expect(config.backend.corsOrigins).to.deep.equal(['https://varaus.example.com']);
    });

    it('should parse BACKEND_CORS_ORIGINS when set', async () => {
      const vars = makeDevEnvVars();
      vars.BACKEND_CORS_ORIGINS = 'http://localhost:8080, http://localhost:3001';
      setEnvVars(vars);

      const manager = new ConfigManager('/project');
      const config = await manager.loadConfig('development');

      expect(config.backend.corsOrigins).to.deep.equal(['http://localhost:8080', 'http://localhost:3001']);
    });
  });

  describe('validateConfig()', () => {
    it('should return valid for a correct config', () => {
      const manager = new ConfigManager('/project');
      const config = {
        frontend: {
          apiEndpoint: 'http://localhost:3000/api',
          firebaseConfig: {
            apiKey: 'key', authDomain: 'auth', databaseURL: 'https://db.firebaseio.com',
            projectId: 'proj', storageBucket: 'bucket', messagingSenderId: 'sender', appId: 'app'
          },
          buildOutputPath: 'dist',
          devServerPort: 8080
        },
        backend: {
          port: 3000,
          firebaseConfig: {
            apiKey: 'key', authDomain: 'auth', databaseURL: 'https://db.firebaseio.com',
            projectId: 'proj', storageBucket: 'bucket', messagingSenderId: 'sender', appId: 'app'
          },
          corsOrigins: ['http://localhost:8080'],
          logLevel: 'info' as const
        },
        shared: { environment: 'development' as const, projectRoot: '/project' }
      };

      const result = manager.validateConfig(config);
      expect(result.valid).to.be.true;
    });

    it('should report error when Firebase projectId differs between frontend and backend', () => {
      const manager = new ConfigManager('/project');
      const config = {
        frontend: {
          apiEndpoint: 'http://localhost:3000/api',
          firebaseConfig: {
            apiKey: 'key', authDomain: 'auth', databaseURL: 'https://db.firebaseio.com',
            projectId: 'frontend-proj', storageBucket: 'bucket', messagingSenderId: 'sender', appId: 'app'
          },
          buildOutputPath: 'dist',
          devServerPort: 8080
        },
        backend: {
          port: 3000,
          firebaseConfig: {
            apiKey: 'key', authDomain: 'auth', databaseURL: 'https://db.firebaseio.com',
            projectId: 'backend-proj', storageBucket: 'bucket', messagingSenderId: 'sender', appId: 'app'
          },
          corsOrigins: ['http://localhost:8080'],
          logLevel: 'info' as const
        },
        shared: { environment: 'development' as const, projectRoot: '/project' }
      };

      const result = manager.validateConfig(config);
      const projectIdErrors = result.errors.filter(e => e.field === 'firebaseConfig.projectId' && e.severity === 'error');
      expect(projectIdErrors.length).to.be.greaterThan(0);
    });

    it('should report error when Firebase databaseURL differs between frontend and backend', () => {
      const manager = new ConfigManager('/project');
      const config = {
        frontend: {
          apiEndpoint: 'http://localhost:3000/api',
          firebaseConfig: {
            apiKey: 'key', authDomain: 'auth', databaseURL: 'https://frontend-db.firebaseio.com',
            projectId: 'proj', storageBucket: 'bucket', messagingSenderId: 'sender', appId: 'app'
          },
          buildOutputPath: 'dist',
          devServerPort: 8080
        },
        backend: {
          port: 3000,
          firebaseConfig: {
            apiKey: 'key', authDomain: 'auth', databaseURL: 'https://backend-db.firebaseio.com',
            projectId: 'proj', storageBucket: 'bucket', messagingSenderId: 'sender', appId: 'app'
          },
          corsOrigins: ['http://localhost:8080'],
          logLevel: 'info' as const
        },
        shared: { environment: 'development' as const, projectRoot: '/project' }
      };

      const result = manager.validateConfig(config);
      const dbErrors = result.errors.filter(e => e.field === 'firebaseConfig.databaseURL' && e.severity === 'error');
      expect(dbErrors.length).to.be.greaterThan(0);
    });

    it('should warn when dev frontend apiEndpoint does not reference backend port', () => {
      const manager = new ConfigManager('/project');
      const firebase = {
        apiKey: 'key', authDomain: 'auth', databaseURL: 'https://db.firebaseio.com',
        projectId: 'proj', storageBucket: 'bucket', messagingSenderId: 'sender', appId: 'app'
      };
      const config = {
        frontend: {
          apiEndpoint: 'http://localhost:9999/api',
          firebaseConfig: firebase,
          buildOutputPath: 'dist',
          devServerPort: 8080
        },
        backend: {
          port: 3000,
          firebaseConfig: firebase,
          corsOrigins: ['http://localhost:8080'],
          logLevel: 'info' as const
        },
        shared: { environment: 'development' as const, projectRoot: '/project' }
      };

      const result = manager.validateConfig(config);
      const warnings = result.errors.filter(e => e.severity === 'warning' && e.field === 'frontend.apiEndpoint');
      expect(warnings.length).to.be.greaterThan(0);
      expect(warnings[0].message).to.include('3000');
    });

    it('should not warn about apiEndpoint in non-development environments', () => {
      const manager = new ConfigManager('/project');
      const firebase = {
        apiKey: 'key', authDomain: 'auth', databaseURL: 'https://db.firebaseio.com',
        projectId: 'proj', storageBucket: 'bucket', messagingSenderId: 'sender', appId: 'app'
      };
      const config = {
        frontend: {
          apiEndpoint: 'https://staging.varaus.example.com/api',
          firebaseConfig: firebase,
          buildOutputPath: 'dist',
          devServerPort: 8080
        },
        backend: {
          port: 3000,
          firebaseConfig: firebase,
          corsOrigins: ['https://staging.varaus.example.com'],
          logLevel: 'info' as const
        },
        shared: { environment: 'staging' as const, projectRoot: '/project' }
      };

      const result = manager.validateConfig(config);
      const apiWarnings = result.errors.filter(e => e.field === 'frontend.apiEndpoint');
      expect(apiWarnings.length).to.equal(0);
    });

    it('should warn when backend corsOrigins does not include frontend origin', () => {
      const manager = new ConfigManager('/project');
      const firebase = {
        apiKey: 'key', authDomain: 'auth', databaseURL: 'https://db.firebaseio.com',
        projectId: 'proj', storageBucket: 'bucket', messagingSenderId: 'sender', appId: 'app'
      };
      const config = {
        frontend: {
          apiEndpoint: 'http://localhost:3000/api',
          firebaseConfig: firebase,
          buildOutputPath: 'dist',
          devServerPort: 8080
        },
        backend: {
          port: 3000,
          firebaseConfig: firebase,
          corsOrigins: ['http://some-other-origin.com'],
          logLevel: 'info' as const
        },
        shared: { environment: 'development' as const, projectRoot: '/project' }
      };

      const result = manager.validateConfig(config);
      const corsWarnings = result.errors.filter(e => e.severity === 'warning' && e.field === 'backend.corsOrigins');
      expect(corsWarnings.length).to.be.greaterThan(0);
    });

    it('should treat warnings as non-blocking (valid remains true)', () => {
      const manager = new ConfigManager('/project');
      const firebase = {
        apiKey: 'key', authDomain: 'auth', databaseURL: 'https://db.firebaseio.com',
        projectId: 'proj', storageBucket: 'bucket', messagingSenderId: 'sender', appId: 'app'
      };
      const config = {
        frontend: {
          apiEndpoint: 'http://localhost:9999/api',
          firebaseConfig: firebase,
          buildOutputPath: 'dist',
          devServerPort: 8080
        },
        backend: {
          port: 3000,
          firebaseConfig: firebase,
          corsOrigins: ['http://some-other-origin.com'],
          logLevel: 'info' as const
        },
        shared: { environment: 'development' as const, projectRoot: '/project' }
      };

      const result = manager.validateConfig(config);
      // Should have warnings but still be valid
      const warnings = result.errors.filter(e => e.severity === 'warning');
      expect(warnings.length).to.be.greaterThan(0);
      expect(result.valid).to.be.true;
    });
  });

  describe('getApplicationConfig()', () => {
    it('should return frontend config after loading', async () => {
      setEnvVars(makeDevEnvVars());
      const manager = new ConfigManager('/project');
      await manager.loadConfig('development');

      const frontendConfig = manager.getApplicationConfig('frontend', 'development');
      expect(frontendConfig).to.have.property('apiEndpoint');
    });

    it('should return backend config after loading', async () => {
      setEnvVars(makeDevEnvVars());
      const manager = new ConfigManager('/project');
      await manager.loadConfig('development');

      const backendConfig = manager.getApplicationConfig('backend', 'development');
      expect(backendConfig).to.have.property('port');
    });

    it('should throw when config not loaded', () => {
      const manager = new ConfigManager('/project');
      expect(() => manager.getApplicationConfig('frontend', 'development')).to.throw();
    });

    it('should throw for "both" application name', async () => {
      setEnvVars(makeDevEnvVars());
      const manager = new ConfigManager('/project');
      await manager.loadConfig('development');

      expect(() => manager.getApplicationConfig('both', 'development')).to.throw();
    });
  });
});
