/**
 * Property-Based Tests for Build Coordination
 * Feature: coordination, Properties 16–18
 * Validates: Requirements 9.2, 9.4, 9.5, 9.6, 9.8
 */

import { expect } from 'chai';
import * as fc from 'fast-check';
import { BuildCoordinatorImpl, ApplicationBuildResult } from '../../src/build';
import { SystemConfig } from '../../src/config';
import { Environment, ApplicationName, LogLevel, FirebaseConfig } from '../../src/types';

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

const systemConfigArb: fc.Arbitrary<SystemConfig> = fc.record({
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


// ─── Property 16: NODE_ENV mapping from environment ──────────────────────────

describe('Feature: coordination, Property 16: NODE_ENV mapping from environment', () => {
  /**
   * **Validates: Requirements 9.4, 9.5**
   *
   * For any build configuration, if the environment is "production" then NODE_ENV
   * should be set to "production"; for "development" or "staging", NODE_ENV should
   * be set to "development".
   */

  it('should set NODE_ENV to "production" for production and "development" otherwise', () => {
    fc.assert(
      fc.property(
        systemConfigArb,
        fc.constantFrom<ApplicationName>('frontend', 'backend'),
        (config, app) => {
          const coordinator = new BuildCoordinatorImpl();
          const env = (coordinator as any).buildEnvironment(app, config);

          if (config.shared.environment === 'production') {
            expect(env.NODE_ENV).to.equal('production');
          } else {
            // development or staging
            expect(env.NODE_ENV).to.equal('development');
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should map each specific environment correctly', () => {
    fc.assert(
      fc.property(
        validEnvironmentArb,
        firebaseConfigArb,
        fc.integer({ min: 1, max: 65535 }),
        fc.constantFrom<ApplicationName>('frontend', 'backend'),
        (environment, firebase, port, app) => {
          const config: SystemConfig = {
            frontend: {
              apiEndpoint: 'http://localhost:3000/api',
              firebaseConfig: firebase,
              buildOutputPath: 'dist',
              devServerPort: 8080
            },
            backend: {
              port,
              firebaseConfig: firebase,
              corsOrigins: ['http://localhost:8080'],
              logLevel: 'info'
            },
            shared: {
              environment,
              projectRoot: '/project'
            }
          };

          const coordinator = new BuildCoordinatorImpl();
          const env = (coordinator as any).buildEnvironment(app, config);

          const expected = environment === 'production' ? 'production' : 'development';
          expect(env.NODE_ENV).to.equal(expected);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ─── Property 17: Backend build failure blocks frontend build ────────────────

describe('Feature: coordination, Property 17: Backend build failure blocks frontend build', () => {
  /**
   * **Validates: Requirements 9.2**
   *
   * For any build-all execution where the backend build fails, the frontend build
   * result should indicate it was skipped (not executed), and the overall result
   * should be unsuccessful.
   */

  it('should skip frontend and fail overall when backend build fails', async function () {
    this.timeout(30000);

    await fc.assert(
      fc.asyncProperty(
        systemConfigArb,
        fc.string({ minLength: 1, maxLength: 80 }),
        async (config, errorMessage) => {
          const coordinator = new BuildCoordinatorImpl();
          let frontendBuildCalled = false;

          // Mock buildApplication: backend always fails, track if frontend is called
          coordinator.buildApplication = async (app: ApplicationName, cfg: SystemConfig): Promise<ApplicationBuildResult> => {
            if (app === 'backend') {
              return {
                success: false,
                application: 'backend',
                artifacts: [],
                duration: 10,
                errors: [{
                  application: 'backend',
                  phase: 'compilation',
                  message: errorMessage
                }],
                output: `Build failed: ${errorMessage}`
              };
            }
            // If we reach here, frontend was called
            frontendBuildCalled = true;
            return {
              success: true,
              application: 'frontend',
              artifacts: [],
              duration: 5,
              output: 'Should not reach here'
            };
          };

          const result = await coordinator.buildAll(config);

          // Overall result must be unsuccessful
          expect(result.success).to.be.false;

          // Backend must have failed
          expect(result.backend.success).to.be.false;

          // Frontend must not have been executed (skipped)
          expect(frontendBuildCalled).to.be.false;
          expect(result.frontend.success).to.be.false;

          // Frontend result should indicate it was skipped
          expect(result.frontend.errors).to.exist;
          expect(result.frontend.errors!.length).to.be.greaterThan(0);
          const skipMessage = result.frontend.errors![0].message.toLowerCase();
          expect(skipMessage).to.include('skip');
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ─── Property 18: Build error parser detects known error patterns ────────────

describe('Feature: coordination, Property 18: Build error parser detects known error patterns', () => {
  /**
   * **Validates: Requirements 9.6, 9.8**
   *
   * For any build output string containing webpack/TypeScript error patterns,
   * module-not-found patterns, or syntax error patterns, the parseBuildErrors
   * function should return at least one BuildErrorInfo entry with the application
   * name and error message.
   */

  const appArb = fc.constantFrom<ApplicationName>('frontend', 'backend');

  it('should detect webpack/TypeScript error patterns (ERROR in ./file.ts:line:col)', () => {
    fc.assert(
      fc.property(
        appArb,
        fc.string({ minLength: 1, maxLength: 40 }).map(s => s.replace(/[\n\r]/g, '')),
        fc.integer({ min: 1, max: 9999 }),
        fc.integer({ min: 1, max: 999 }),
        (app, fileName, line, col) => {
          const errorLine = `ERROR in ./${fileName}.ts:${line}:${col}`;
          const output = `Some preamble\n${errorLine}\nSome trailing text`;

          const coordinator = new BuildCoordinatorImpl();
          const errors = (coordinator as any).parseBuildErrors(app, output);

          expect(errors.length).to.be.greaterThan(0);

          const matchingError = errors.find(
            (e: any) => e.application === app && e.message.includes('ERROR in')
          );
          expect(matchingError).to.exist;
          expect(matchingError.application).to.equal(app);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should detect module-not-found patterns', () => {
    fc.assert(
      fc.property(
        appArb,
        fc.constantFrom('Module not found', 'Cannot find module'),
        fc.string({ minLength: 1, maxLength: 40 }).map(s => s.replace(/[\n\r]/g, '')),
        (app, pattern, moduleName) => {
          const errorLine = `${pattern}: '${moduleName}'`;
          const output = `Build output\n${errorLine}\nMore output`;

          const coordinator = new BuildCoordinatorImpl();
          const errors = (coordinator as any).parseBuildErrors(app, output);

          expect(errors.length).to.be.greaterThan(0);

          const matchingError = errors.find(
            (e: any) => e.application === app && e.message.includes(pattern)
          );
          expect(matchingError).to.exist;
          expect(matchingError.application).to.equal(app);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should detect syntax error patterns', () => {
    fc.assert(
      fc.property(
        appArb,
        fc.string({ minLength: 1, maxLength: 60 }).map(s => s.replace(/[\n\r]/g, '')),
        (app, detail) => {
          const errorLine = `SyntaxError: ${detail}`;
          const output = `Compiling...\n${errorLine}\nDone`;

          const coordinator = new BuildCoordinatorImpl();
          const errors = (coordinator as any).parseBuildErrors(app, output);

          expect(errors.length).to.be.greaterThan(0);

          const matchingError = errors.find(
            (e: any) => e.application === app && e.message.includes('SyntaxError')
          );
          expect(matchingError).to.exist;
          expect(matchingError.application).to.equal(app);
        }
      ),
      { numRuns: 100 }
    );
  });
});
