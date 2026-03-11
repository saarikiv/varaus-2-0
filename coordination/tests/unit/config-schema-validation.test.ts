import { expect } from 'chai';
import {
  isValidEnvironment,
  isValidFirebaseConfig,
  isValidFrontendConfig,
  isValidBackendConfig,
  isValidSystemConfig,
  validateConfigSchema
} from '../../src/config/index';

function makeValidFirebaseConfig() {
  return {
    apiKey: 'test-key',
    authDomain: 'test.firebaseapp.com',
    databaseURL: 'https://test.firebaseio.com',
    projectId: 'test-project',
    storageBucket: 'test.appspot.com',
    messagingSenderId: '123456',
    appId: '1:123:web:abc'
  };
}

function makeValidFrontendConfig() {
  return {
    apiEndpoint: 'http://localhost:3000/api',
    firebaseConfig: makeValidFirebaseConfig(),
    buildOutputPath: 'dist',
    devServerPort: 8080
  };
}

function makeValidBackendConfig() {
  return {
    port: 3000,
    firebaseConfig: makeValidFirebaseConfig(),
    corsOrigins: ['http://localhost:8080'],
    logLevel: 'info' as const
  };
}

function makeValidSystemConfig() {
  return {
    frontend: makeValidFrontendConfig(),
    backend: makeValidBackendConfig(),
    shared: {
      environment: 'development' as const,
      projectRoot: '/project'
    }
  };
}

describe('Config Schema Validation', () => {
  describe('isValidEnvironment', () => {
    it('should accept "development"', () => {
      expect(isValidEnvironment('development')).to.be.true;
    });

    it('should accept "staging"', () => {
      expect(isValidEnvironment('staging')).to.be.true;
    });

    it('should accept "production"', () => {
      expect(isValidEnvironment('production')).to.be.true;
    });

    it('should reject invalid strings', () => {
      expect(isValidEnvironment('test')).to.be.false;
      expect(isValidEnvironment('')).to.be.false;
    });

    it('should reject non-string values', () => {
      expect(isValidEnvironment(42)).to.be.false;
      expect(isValidEnvironment(null)).to.be.false;
      expect(isValidEnvironment(undefined)).to.be.false;
    });
  });

  describe('isValidFirebaseConfig', () => {
    it('should accept a valid firebase config with all 7 fields', () => {
      expect(isValidFirebaseConfig(makeValidFirebaseConfig())).to.be.true;
    });

    it('should reject when a field is missing', () => {
      const config = makeValidFirebaseConfig();
      delete (config as any).appId;
      expect(isValidFirebaseConfig(config)).to.be.false;
    });

    it('should reject when a field is not a string', () => {
      const config = { ...makeValidFirebaseConfig(), apiKey: 123 };
      expect(isValidFirebaseConfig(config)).to.be.false;
    });

    it('should reject null and non-objects', () => {
      expect(isValidFirebaseConfig(null)).to.be.false;
      expect(isValidFirebaseConfig('string')).to.be.false;
      expect(isValidFirebaseConfig(42)).to.be.false;
    });
  });

  describe('isValidFrontendConfig', () => {
    it('should return valid for a correct frontend config', () => {
      const result = isValidFrontendConfig(makeValidFrontendConfig());
      expect(result.valid).to.be.true;
      expect(result.errors).to.have.length(0);
    });

    it('should report error when apiEndpoint is not a string', () => {
      const config = { ...makeValidFrontendConfig(), apiEndpoint: 123 };
      const result = isValidFrontendConfig(config);
      expect(result.valid).to.be.false;
      expect(result.errors).to.include('FrontendConfig.apiEndpoint must be a string');
    });

    it('should report error when devServerPort is not a number', () => {
      const config = { ...makeValidFrontendConfig(), devServerPort: 'not-a-number' };
      const result = isValidFrontendConfig(config);
      expect(result.valid).to.be.false;
      expect(result.errors).to.include('FrontendConfig.devServerPort must be a number');
    });

    it('should report error when buildOutputPath is not a string', () => {
      const config = { ...makeValidFrontendConfig(), buildOutputPath: 42 };
      const result = isValidFrontendConfig(config);
      expect(result.valid).to.be.false;
      expect(result.errors).to.include('FrontendConfig.buildOutputPath must be a string');
    });

    it('should report error for invalid firebase config', () => {
      const config = { ...makeValidFrontendConfig(), firebaseConfig: {} };
      const result = isValidFrontendConfig(config);
      expect(result.valid).to.be.false;
      expect(result.errors.some(e => e.includes('firebaseConfig'))).to.be.true;
    });

    it('should aggregate multiple errors', () => {
      const result = isValidFrontendConfig({ apiEndpoint: 123, devServerPort: 'bad' });
      expect(result.valid).to.be.false;
      expect(result.errors.length).to.be.greaterThan(1);
    });

    it('should reject non-objects', () => {
      const result = isValidFrontendConfig(null);
      expect(result.valid).to.be.false;
      expect(result.errors).to.include('FrontendConfig must be an object');
    });
  });

  describe('isValidBackendConfig', () => {
    it('should return valid for a correct backend config', () => {
      const result = isValidBackendConfig(makeValidBackendConfig());
      expect(result.valid).to.be.true;
      expect(result.errors).to.have.length(0);
    });

    it('should report error when port is not a number', () => {
      const config = { ...makeValidBackendConfig(), port: 'not-a-number' };
      const result = isValidBackendConfig(config);
      expect(result.valid).to.be.false;
      expect(result.errors).to.include('BackendConfig.port must be a number');
    });

    it('should report error for invalid logLevel', () => {
      const config = { ...makeValidBackendConfig(), logLevel: 'verbose' };
      const result = isValidBackendConfig(config);
      expect(result.valid).to.be.false;
      expect(result.errors.some(e => e.includes('logLevel'))).to.be.true;
    });

    it('should report error when corsOrigins is not an array of strings', () => {
      const config = { ...makeValidBackendConfig(), corsOrigins: 'not-array' };
      const result = isValidBackendConfig(config);
      expect(result.valid).to.be.false;
      expect(result.errors.some(e => e.includes('corsOrigins'))).to.be.true;
    });

    it('should report error when corsOrigins contains non-strings', () => {
      const config = { ...makeValidBackendConfig(), corsOrigins: [123, 'valid'] };
      const result = isValidBackendConfig(config);
      expect(result.valid).to.be.false;
      expect(result.errors.some(e => e.includes('corsOrigins'))).to.be.true;
    });

    it('should reject non-objects', () => {
      const result = isValidBackendConfig(null);
      expect(result.valid).to.be.false;
      expect(result.errors).to.include('BackendConfig must be an object');
    });
  });

  describe('isValidSystemConfig', () => {
    it('should return valid for a correct system config', () => {
      const result = isValidSystemConfig(makeValidSystemConfig());
      expect(result.valid).to.be.true;
      expect(result.errors).to.have.length(0);
    });

    it('should report errors from frontend, backend, and shared', () => {
      const result = isValidSystemConfig({
        frontend: { apiEndpoint: 123 },
        backend: { port: 'bad' },
        shared: { environment: 'invalid' }
      });
      expect(result.valid).to.be.false;
      expect(result.errors.length).to.be.greaterThan(2);
    });

    it('should report error for invalid environment in shared', () => {
      const config = makeValidSystemConfig();
      (config.shared as any).environment = 'invalid';
      const result = isValidSystemConfig(config);
      expect(result.valid).to.be.false;
      expect(result.errors.some(e => e.includes('environment'))).to.be.true;
    });

    it('should report error when shared.projectRoot is not a string', () => {
      const config = makeValidSystemConfig();
      (config.shared as any).projectRoot = 42;
      const result = isValidSystemConfig(config);
      expect(result.valid).to.be.false;
      expect(result.errors.some(e => e.includes('projectRoot'))).to.be.true;
    });

    it('should reject non-objects', () => {
      const result = isValidSystemConfig(null);
      expect(result.valid).to.be.false;
      expect(result.errors).to.include('SystemConfig must be an object');
    });
  });

  describe('validateConfigSchema', () => {
    it('should return valid for a correct config', () => {
      const result = validateConfigSchema(makeValidSystemConfig());
      expect(result.valid).to.be.true;
      expect(result.errors).to.have.length(0);
    });

    it('should aggregate all errors from invalid config', () => {
      const result = validateConfigSchema({});
      expect(result.valid).to.be.false;
      expect(result.errors.length).to.be.greaterThan(0);
    });

    it('should reject completely invalid input', () => {
      const result = validateConfigSchema('not-an-object');
      expect(result.valid).to.be.false;
    });
  });
});
