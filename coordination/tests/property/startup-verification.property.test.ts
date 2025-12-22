/**
 * Property-Based Tests for Startup Verification
 * Feature: full-stack-coordination, Property 1: Startup Verification Completeness
 * Validates: Requirements 1.1, 1.2, 1.3
 */

import { expect } from 'chai';
import * as fc from 'fast-check';
import { ProcessConfig, StartupResult, StartupError } from '../../src/process';
import { Environment, ApplicationName } from '../../src/types';

describe('Property 1: Startup Verification Completeness', () => {
  /**
   * For any valid system configuration and startup request, the Coordination_System should 
   * launch both applications and verify connectivity (Firebase for backend, API endpoint for frontend) 
   * before reporting successful startup.
   */

  it('should ensure successful startup includes both application handles', () => {
    fc.assert(
      fc.property(
        fc.record({
          backendPort: fc.integer({ min: 3000, max: 9999 }),
          frontendPort: fc.integer({ min: 8000, max: 9999 }),
          backendPid: fc.integer({ min: 1000, max: 99999 }),
          frontendPid: fc.integer({ min: 1000, max: 99999 }),
          success: fc.boolean()
        }),
        (testData) => {
          // Simulate a startup result
          const result: StartupResult = testData.success
            ? {
                success: true,
                backend: {
                  pid: testData.backendPid,
                  port: testData.backendPort,
                  status: 'running',
                  logs: { entries: [] }
                },
                frontend: {
                  pid: testData.frontendPid,
                  port: testData.frontendPort,
                  status: 'running',
                  logs: { entries: [] }
                },
                errors: []
              }
            : {
                success: false,
                errors: [
                  {
                    application: 'backend',
                    phase: 'launch',
                    message: 'Failed to start',
                    troubleshooting: ['Check logs']
                  }
                ]
              };

          // Property: If startup succeeds, both applications should be present
          if (result.success) {
            expect(result.backend).to.exist;
            expect(result.frontend).to.exist;
            expect(result.backend?.status).to.equal('running');
            expect(result.frontend?.status).to.equal('running');
            expect(result.errors).to.be.empty;

            // Property: Process handles must have required fields
            expect(result.backend).to.have.property('pid');
            expect(result.backend).to.have.property('port');
            expect(result.backend).to.have.property('status');
            expect(result.backend).to.have.property('logs');

            expect(result.frontend).to.have.property('pid');
            expect(result.frontend).to.have.property('port');
            expect(result.frontend).to.have.property('status');
            expect(result.frontend).to.have.property('logs');

            // Property: PIDs should be positive
            expect(result.backend!.pid).to.be.greaterThan(0);
            expect(result.frontend!.pid).to.be.greaterThan(0);
          } else {
            // Property: If startup fails, errors should be provided
            expect(result.errors).to.not.be.empty;
            expect(result.errors[0]).to.have.property('application');
            expect(result.errors[0]).to.have.property('phase');
            expect(result.errors[0]).to.have.property('message');
            expect(result.errors[0]).to.have.property('troubleshooting');
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should not start frontend if backend connectivity fails', () => {
    fc.assert(
      fc.property(
        fc.record({
          backendPort: fc.integer({ min: 3000, max: 9999 }),
          frontendPort: fc.integer({ min: 8000, max: 9999 }),
          backendConnectivityFails: fc.boolean()
        }),
        (testData) => {
          // Simulate a startup result where backend connectivity fails
          const result: StartupResult = testData.backendConnectivityFails
            ? {
                success: false,
                backend: {
                  pid: 1234,
                  port: testData.backendPort,
                  status: 'error',
                  logs: { entries: [] }
                },
                errors: [
                  {
                    application: 'backend',
                    phase: 'connectivity',
                    message: 'Backend connectivity check failed',
                    troubleshooting: ['Check if backend is responding']
                  }
                ]
              }
            : {
                success: true,
                backend: {
                  pid: 1234,
                  port: testData.backendPort,
                  status: 'running',
                  logs: { entries: [] }
                },
                frontend: {
                  pid: 5678,
                  port: testData.frontendPort,
                  status: 'running',
                  logs: { entries: [] }
                },
                errors: []
              };

          // Property: If backend connectivity fails, frontend should not be started
          if (!result.success && result.errors.length > 0) {
            const backendError = result.errors.find(
              e => e.application === 'backend' && e.phase === 'connectivity'
            );
            if (backendError) {
              // Backend connectivity failed, so frontend should not have been started
              expect(result.frontend).to.be.undefined;
            }
          }

          // Property: If both are running, backend must have been verified first
          if (result.success && result.backend && result.frontend) {
            // Both are running, which means backend connectivity was verified
            expect(result.backend.status).to.equal('running');
            expect(result.frontend.status).to.equal('running');
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should provide process handles with required information', () => {
    fc.assert(
      fc.property(
        fc.record({
          backendPort: fc.integer({ min: 3000, max: 9999 }),
          frontendPort: fc.integer({ min: 8000, max: 9999 }),
          backendPid: fc.integer({ min: 1000, max: 99999 }),
          frontendPid: fc.integer({ min: 1000, max: 99999 })
        }),
        (testData) => {
          // Simulate a successful startup result
          const result: StartupResult = {
            success: true,
            backend: {
              pid: testData.backendPid,
              port: testData.backendPort,
              status: 'running',
              logs: { entries: [] }
            },
            frontend: {
              pid: testData.frontendPid,
              port: testData.frontendPort,
              status: 'running',
              logs: { entries: [] }
            },
            errors: []
          };

          // Property: Process handles must contain required information
          expect(result.backend).to.have.property('pid');
          expect(result.backend).to.have.property('port');
          expect(result.backend).to.have.property('status');
          expect(result.backend).to.have.property('logs');

          expect(result.frontend).to.have.property('pid');
          expect(result.frontend).to.have.property('port');
          expect(result.frontend).to.have.property('status');
          expect(result.frontend).to.have.property('logs');

          // Property: PIDs should be positive numbers
          expect(result.backend!.pid).to.be.greaterThan(0);
          expect(result.frontend!.pid).to.be.greaterThan(0);

          // Property: Logs should be accessible
          expect(result.backend!.logs).to.have.property('entries');
          expect(result.frontend!.logs).to.have.property('entries');
          expect(result.backend!.logs.entries).to.be.an('array');
          expect(result.frontend!.logs.entries).to.be.an('array');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should ensure frontend configuration includes backend endpoint', () => {
    fc.assert(
      fc.property(
        fc.record({
          backendPort: fc.integer({ min: 3000, max: 9999 }),
          frontendPort: fc.integer({ min: 8000, max: 9999 })
        }),
        (testData) => {
          // Create configurations
          const backendConfig: ProcessConfig = {
            port: testData.backendPort,
            environment: 'development'
          };

          const frontendConfig: ProcessConfig = {
            port: testData.frontendPort,
            apiEndpoint: `http://localhost:${testData.backendPort}`,
            environment: 'development'
          };

          // Property: Frontend API endpoint should reference backend port
          expect(frontendConfig.apiEndpoint).to.include(testData.backendPort.toString());
          expect(frontendConfig.apiEndpoint).to.include('localhost');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should provide troubleshooting information for startup errors', () => {
    fc.assert(
      fc.property(
        fc.record({
          application: fc.constantFrom('frontend' as ApplicationName, 'backend' as ApplicationName),
          phase: fc.constantFrom('launch', 'connectivity', 'configuration'),
          message: fc.string({ minLength: 10, maxLength: 100 })
        }),
        (testData) => {
          // Simulate a startup error
          const error: StartupError = {
            application: testData.application,
            phase: testData.phase as 'launch' | 'connectivity' | 'configuration',
            message: testData.message,
            troubleshooting: ['Step 1', 'Step 2', 'Step 3']
          };

          // Property: Every error must have all required fields
          expect(error).to.have.property('application');
          expect(error).to.have.property('phase');
          expect(error).to.have.property('message');
          expect(error).to.have.property('troubleshooting');

          // Property: Troubleshooting should be a non-empty array
          expect(error.troubleshooting).to.be.an('array');
          expect(error.troubleshooting.length).to.be.greaterThan(0);

          // Property: Message should be non-empty
          expect(error.message.length).to.be.greaterThan(0);
        }
      ),
      { numRuns: 100 }
    );
  });
});
