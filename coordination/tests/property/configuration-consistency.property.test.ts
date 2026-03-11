/**
 * Property-Based Tests for Configuration Consistency
 * Feature: coordination
 * Validates: Requirements 2.1–2.9, 3.1–3.7
 */

import { expect } from 'chai';
import * as fc from 'fast-check';
import {
  ConfigManager,
  isValidEnvironment,
  isValidFirebaseConfig,
  isValidFrontendConfig,
  isValidBackendConfig,
  isValidSystemConfig,
  validateConfigSchema,
  SystemConfig
} from '../../src/config';
import { Environment, FirebaseConfig, LogLevel } from '../../src/types';

// ─── Shared Arbitraries ──────────────────────────────────────────────────────

const validEnvironments: Environment[] = ['development', 'staging', 'production'];

const validEnvironmentArb = fc.constantFrom<Environment>(...validEnvironments);

const validLogLevelArb = fc.constantFrom<LogLevel>('debug', 'info', 'warn', 'error');

const firebaseConfigArb: fc.Arbitrary<FirebaseConfig> = fc.record({
  apiKey: fc.string({ minLength: 1, maxLength: 30 }),
  authDomain: fc.string({ minLength: 1, maxLength: 30 }),
  databaseURL: fc.string({ minLength: 1, maxLength: 30 }),
  projectId: fc.string({ minLength: 1, maxLength: 30 }),
  storageBucket: fc.string({ minLength: 1, maxLength: 30 }),
  messagingSenderId: fc.string({ minLength: 1, maxLength: 30 }),
  appId: fc.string({ minLength: 1, maxLength: 30 })
});

const validSystemConfigArb: fc.Arbitrary<SystemConfig> = fc.record({
  frontend: fc.record({
    apiEndpoint: fc.string({ minLength: 1, maxLength: 50 }),
    firebaseConfig: firebaseConfigArb,
    buildOutputPath: fc.string({ minLength: 1, maxLength: 30 }),
    devServerPort: fc.integer({ min: 1, max: 65535 })
  }),
  backend: fc.record({
    port: fc.integer({ min: 1, max: 65535 }),
    firebaseConfig: firebaseConfigArb,
    corsOrigins: fc.array(fc.string({ minLength: 1, maxLength: 30 }), { minLength: 1, maxLength: 5 }),
    logLevel: validLogLevelArb
  }),
  shared: fc.record({
    environment: validEnvironmentArb,
    projectRoot: fc.string({ minLength: 1, maxLength: 30 })
  })
});


// ─── Property 2: Environment validation accepts only valid environments ──────

describe('Feature: coordination, Property 2: Environment validation accepts only valid environments', () => {
  it('should return true for valid environments and false for all other strings', () => {
    // Test valid environments always accepted
    fc.assert(
      fc.property(
        validEnvironmentArb,
        (env) => {
          expect(isValidEnvironment(env)).to.be.true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should reject any string that is not development, staging, or production', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 0, maxLength: 50 }).filter(
          s => !validEnvironments.includes(s as Environment)
        ),
        (invalidEnv) => {
          expect(isValidEnvironment(invalidEnv)).to.be.false;
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ─── Property 3: Required environment variable names are correctly derived ───

describe('Feature: coordination, Property 3: Required environment variable names are correctly derived from environment', () => {
  it('should include FRONTEND_API_ENDPOINT, BACKEND_PORT, and all 7 Firebase vars prefixed with uppercase environment', () => {
    fc.assert(
      fc.property(
        validEnvironmentArb,
        (env) => {
          const manager = new ConfigManager();
          const requiredVars = manager.getRequiredVariables(env);
          const prefix = env.toUpperCase();

          // Must include the two non-Firebase vars
          expect(requiredVars).to.include('FRONTEND_API_ENDPOINT');
          expect(requiredVars).to.include('BACKEND_PORT');

          // Must include all 7 Firebase vars with correct prefix
          const expectedFirebaseVars = [
            `${prefix}_FIREBASE_API_KEY`,
            `${prefix}_FIREBASE_AUTH_DOMAIN`,
            `${prefix}_FIREBASE_DATABASE_URL`,
            `${prefix}_FIREBASE_PROJECT_ID`,
            `${prefix}_FIREBASE_STORAGE_BUCKET`,
            `${prefix}_FIREBASE_MESSAGING_SENDER_ID`,
            `${prefix}_FIREBASE_APP_ID`
          ];

          for (const varName of expectedFirebaseVars) {
            expect(requiredVars).to.include(varName);
          }

          // Total should be 2 + 7 = 9
          expect(requiredVars).to.have.length(9);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ─── Property 4: Missing environment variable errors identify variable, application, and environment ─

describe('Feature: coordination, Property 4: Missing environment variable errors identify variable, application, and environment', () => {
  let savedEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    savedEnv = { ...process.env };
  });

  afterEach(() => {
    process.env = savedEnv;
  });

  it('should throw error containing variable name, application, and environment for any missing required var', async () => {
    await fc.assert(
      fc.asyncProperty(
        validEnvironmentArb,
        fc.integer({ min: 0, max: 8 }),
        async (env, varIndex) => {
          // Reset env
          process.env = { ...savedEnv };

          const manager = new ConfigManager();
          const requiredVars = manager.getRequiredVariables(env);
          const prefix = env.toUpperCase();

          // Set ALL required vars first
          process.env.FRONTEND_API_ENDPOINT = 'http://localhost:3000/api';
          process.env.BACKEND_PORT = '3000';
          process.env[`${prefix}_FIREBASE_API_KEY`] = 'key';
          process.env[`${prefix}_FIREBASE_AUTH_DOMAIN`] = 'auth';
          process.env[`${prefix}_FIREBASE_DATABASE_URL`] = 'https://db.firebaseio.com';
          process.env[`${prefix}_FIREBASE_PROJECT_ID`] = 'proj';
          process.env[`${prefix}_FIREBASE_STORAGE_BUCKET`] = 'bucket';
          process.env[`${prefix}_FIREBASE_MESSAGING_SENDER_ID`] = 'sender';
          process.env[`${prefix}_FIREBASE_APP_ID`] = 'appid';

          // Remove one required var
          const missingVar = requiredVars[varIndex];
          delete process.env[missingVar];

          try {
            await manager.loadConfig(env);
            expect.fail('Should have thrown for missing variable: ' + missingVar);
          } catch (err: any) {
            const msg = err.message;
            expect(msg).to.include(missingVar);
            expect(msg.toLowerCase()).to.include(env);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});


// ─── Property 5: Firebase configuration consistency validation ───────────────

describe('Feature: coordination, Property 5: Firebase configuration consistency validation', () => {
  it('should report a validation error when frontend and backend Firebase projectId or databaseURL differ', () => {
    fc.assert(
      fc.property(
        validSystemConfigArb,
        fc.boolean(),
        fc.boolean(),
        fc.string({ minLength: 1, maxLength: 20 }),
        fc.string({ minLength: 1, maxLength: 20 }),
        (baseConfig, differProjectId, differDatabaseURL, altProjectId, altDatabaseURL) => {
          // We need at least one field to differ
          fc.pre(differProjectId || differDatabaseURL);

          const config: SystemConfig = JSON.parse(JSON.stringify(baseConfig));

          // Make the frontend and backend Firebase configs start the same
          config.backend.firebaseConfig = { ...config.frontend.firebaseConfig };

          // Now introduce differences
          if (differProjectId) {
            // Ensure they actually differ
            const newId = config.frontend.firebaseConfig.projectId + '_different';
            config.backend.firebaseConfig.projectId = newId;
          }
          if (differDatabaseURL) {
            const newUrl = config.frontend.firebaseConfig.databaseURL + '_different';
            config.backend.firebaseConfig.databaseURL = newUrl;
          }

          const manager = new ConfigManager();
          const result = manager.validateConfig(config);

          // Should have at least one error about Firebase mismatch
          const firebaseErrors = result.errors.filter(
            e => e.severity === 'error' &&
              (e.field.includes('projectId') || e.field.includes('databaseURL'))
          );
          expect(firebaseErrors.length).to.be.greaterThan(0);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ─── Property 6: Development API endpoint warning ────────────────────────────

describe('Feature: coordination, Property 6: Development API endpoint warning', () => {
  it('should produce a warning when dev frontend apiEndpoint does not contain backend port', () => {
    fc.assert(
      fc.property(
        firebaseConfigArb,
        fc.integer({ min: 1000, max: 9999 }),
        fc.integer({ min: 1000, max: 9999 }),
        fc.integer({ min: 1, max: 65535 }),
        (firebase, backendPort, differentPort, devServerPort) => {
          // Ensure the apiEndpoint port is different from backend port
          fc.pre(differentPort !== backendPort);

          const config: SystemConfig = {
            frontend: {
              apiEndpoint: `http://localhost:${differentPort}/api`,
              firebaseConfig: firebase,
              buildOutputPath: 'dist',
              devServerPort
            },
            backend: {
              port: backendPort,
              firebaseConfig: firebase,
              corsOrigins: [`http://localhost:${devServerPort}`],
              logLevel: 'info'
            },
            shared: {
              environment: 'development',
              projectRoot: '/project'
            }
          };

          const manager = new ConfigManager();
          const result = manager.validateConfig(config);

          const apiWarnings = result.errors.filter(
            e => e.severity === 'warning' && e.field === 'frontend.apiEndpoint'
          );
          expect(apiWarnings.length).to.be.greaterThan(0);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ─── Property 7: CORS origin warning ────────────────────────────────────────

describe('Feature: coordination, Property 7: CORS origin warning', () => {
  it('should produce a warning when backend corsOrigins does not include the frontend origin', () => {
    fc.assert(
      fc.property(
        firebaseConfigArb,
        fc.integer({ min: 1000, max: 9999 }),
        fc.integer({ min: 8000, max: 9999 }),
        (firebase, backendPort, devServerPort) => {
          const frontendOrigin = `http://localhost:${devServerPort}`;

          const config: SystemConfig = {
            frontend: {
              apiEndpoint: `http://localhost:${backendPort}/api`,
              firebaseConfig: firebase,
              buildOutputPath: 'dist',
              devServerPort
            },
            backend: {
              port: backendPort,
              firebaseConfig: firebase,
              corsOrigins: ['http://some-other-origin.com'],
              logLevel: 'info'
            },
            shared: {
              environment: 'development',
              projectRoot: '/project'
            }
          };

          const manager = new ConfigManager();
          const result = manager.validateConfig(config);

          const corsWarnings = result.errors.filter(
            e => e.severity === 'warning' && e.field === 'backend.corsOrigins'
          );
          expect(corsWarnings.length).to.be.greaterThan(0);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ─── Property 8: Default CORS origins match environment ──────────────────────

describe('Feature: coordination, Property 8: Default CORS origins match environment', () => {
  let savedEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    savedEnv = { ...process.env };
  });

  afterEach(() => {
    process.env = savedEnv;
  });

  it('should use correct default CORS origins per environment when BACKEND_CORS_ORIGINS is not set', async () => {
    const expectedDefaults: Record<Environment, string[]> = {
      development: ['http://localhost:8080'],
      staging: ['https://staging.varaus.example.com'],
      production: ['https://varaus.example.com']
    };

    await fc.assert(
      fc.asyncProperty(
        validEnvironmentArb,
        async (env) => {
          process.env = { ...savedEnv };

          // Ensure BACKEND_CORS_ORIGINS is NOT set
          delete process.env.BACKEND_CORS_ORIGINS;

          const prefix = env.toUpperCase();
          process.env.FRONTEND_API_ENDPOINT = 'http://localhost:3000/api';
          process.env.BACKEND_PORT = '3000';
          process.env[`${prefix}_FIREBASE_API_KEY`] = 'key';
          process.env[`${prefix}_FIREBASE_AUTH_DOMAIN`] = 'auth';
          process.env[`${prefix}_FIREBASE_DATABASE_URL`] = 'https://db.firebaseio.com';
          process.env[`${prefix}_FIREBASE_PROJECT_ID`] = 'proj';
          process.env[`${prefix}_FIREBASE_STORAGE_BUCKET`] = 'bucket';
          process.env[`${prefix}_FIREBASE_MESSAGING_SENDER_ID`] = 'sender';
          process.env[`${prefix}_FIREBASE_APP_ID`] = 'appid';

          const manager = new ConfigManager();
          const config = await manager.loadConfig(env);

          expect(config.backend.corsOrigins).to.deep.equal(expectedDefaults[env]);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ─── Property 9: Configuration schema validation rejects invalid configs ─────

describe('Feature: coordination, Property 9: Configuration schema validation rejects invalid configs', () => {
  it('should reject configs with invalid Firebase, backend port, logLevel, corsOrigins, devServerPort, or string fields', () => {
    // Generate configs that are invalid in at least one way
    const invalidConfigArb = fc.oneof(
      // Missing Firebase field
      fc.record({
        frontend: fc.record({
          apiEndpoint: fc.string({ minLength: 1, maxLength: 20 }),
          firebaseConfig: fc.record({
            apiKey: fc.string({ minLength: 1 }),
            authDomain: fc.string({ minLength: 1 }),
            databaseURL: fc.string({ minLength: 1 }),
            projectId: fc.string({ minLength: 1 }),
            storageBucket: fc.string({ minLength: 1 }),
            messagingSenderId: fc.string({ minLength: 1 })
            // appId intentionally missing
          }),
          buildOutputPath: fc.string({ minLength: 1 }),
          devServerPort: fc.integer({ min: 1, max: 65535 })
        }),
        backend: fc.record({
          port: fc.integer({ min: 1, max: 65535 }),
          firebaseConfig: firebaseConfigArb,
          corsOrigins: fc.array(fc.string({ minLength: 1 }), { minLength: 1 }),
          logLevel: validLogLevelArb
        }),
        shared: fc.record({
          environment: validEnvironmentArb,
          projectRoot: fc.string({ minLength: 1 })
        })
      }),
      // Backend port is not a number
      fc.record({
        frontend: fc.record({
          apiEndpoint: fc.string({ minLength: 1 }),
          firebaseConfig: firebaseConfigArb,
          buildOutputPath: fc.string({ minLength: 1 }),
          devServerPort: fc.integer({ min: 1, max: 65535 })
        }),
        backend: fc.record({
          port: fc.constant('not-a-number' as any),
          firebaseConfig: firebaseConfigArb,
          corsOrigins: fc.array(fc.string({ minLength: 1 }), { minLength: 1 }),
          logLevel: validLogLevelArb
        }),
        shared: fc.record({
          environment: validEnvironmentArb,
          projectRoot: fc.string({ minLength: 1 })
        })
      }),
      // Invalid logLevel
      fc.record({
        frontend: fc.record({
          apiEndpoint: fc.string({ minLength: 1 }),
          firebaseConfig: firebaseConfigArb,
          buildOutputPath: fc.string({ minLength: 1 }),
          devServerPort: fc.integer({ min: 1, max: 65535 })
        }),
        backend: fc.record({
          port: fc.integer({ min: 1, max: 65535 }),
          firebaseConfig: firebaseConfigArb,
          corsOrigins: fc.array(fc.string({ minLength: 1 }), { minLength: 1 }),
          logLevel: fc.constant('verbose' as any)
        }),
        shared: fc.record({
          environment: validEnvironmentArb,
          projectRoot: fc.string({ minLength: 1 })
        })
      }),
      // corsOrigins is not an array of strings
      fc.record({
        frontend: fc.record({
          apiEndpoint: fc.string({ minLength: 1 }),
          firebaseConfig: firebaseConfigArb,
          buildOutputPath: fc.string({ minLength: 1 }),
          devServerPort: fc.integer({ min: 1, max: 65535 })
        }),
        backend: fc.record({
          port: fc.integer({ min: 1, max: 65535 }),
          firebaseConfig: firebaseConfigArb,
          corsOrigins: fc.constant(42 as any),
          logLevel: validLogLevelArb
        }),
        shared: fc.record({
          environment: validEnvironmentArb,
          projectRoot: fc.string({ minLength: 1 })
        })
      }),
      // devServerPort is not a number
      fc.record({
        frontend: fc.record({
          apiEndpoint: fc.string({ minLength: 1 }),
          firebaseConfig: firebaseConfigArb,
          buildOutputPath: fc.string({ minLength: 1 }),
          devServerPort: fc.constant('not-a-number' as any)
        }),
        backend: fc.record({
          port: fc.integer({ min: 1, max: 65535 }),
          firebaseConfig: firebaseConfigArb,
          corsOrigins: fc.array(fc.string({ minLength: 1 }), { minLength: 1 }),
          logLevel: validLogLevelArb
        }),
        shared: fc.record({
          environment: validEnvironmentArb,
          projectRoot: fc.string({ minLength: 1 })
        })
      }),
      // apiEndpoint is not a string
      fc.record({
        frontend: fc.record({
          apiEndpoint: fc.constant(123 as any),
          firebaseConfig: firebaseConfigArb,
          buildOutputPath: fc.string({ minLength: 1 }),
          devServerPort: fc.integer({ min: 1, max: 65535 })
        }),
        backend: fc.record({
          port: fc.integer({ min: 1, max: 65535 }),
          firebaseConfig: firebaseConfigArb,
          corsOrigins: fc.array(fc.string({ minLength: 1 }), { minLength: 1 }),
          logLevel: validLogLevelArb
        }),
        shared: fc.record({
          environment: validEnvironmentArb,
          projectRoot: fc.string({ minLength: 1 })
        })
      }),
      // buildOutputPath is not a string
      fc.record({
        frontend: fc.record({
          apiEndpoint: fc.string({ minLength: 1 }),
          firebaseConfig: firebaseConfigArb,
          buildOutputPath: fc.constant(42 as any),
          devServerPort: fc.integer({ min: 1, max: 65535 })
        }),
        backend: fc.record({
          port: fc.integer({ min: 1, max: 65535 }),
          firebaseConfig: firebaseConfigArb,
          corsOrigins: fc.array(fc.string({ minLength: 1 }), { minLength: 1 }),
          logLevel: validLogLevelArb
        }),
        shared: fc.record({
          environment: validEnvironmentArb,
          projectRoot: fc.string({ minLength: 1 })
        })
      })
    );

    fc.assert(
      fc.property(
        invalidConfigArb,
        (config) => {
          const result = validateConfigSchema(config);
          expect(result.valid).to.be.false;
          expect(result.errors.length).to.be.greaterThan(0);
        }
      ),
      { numRuns: 100 }
    );
  });
});
