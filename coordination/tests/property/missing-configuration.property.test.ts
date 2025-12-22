/**
 * Property-Based Tests for Missing Configuration Detection
 * Feature: full-stack-coordination, Property 9: Missing Configuration Detection
 * Validates: Requirements 4.3
 */

import { expect } from 'chai';
import * as fc from 'fast-check';
import { ConfigManager } from '../../src/config';
import { Environment } from '../../src/types';

describe('Property 9: Missing Configuration Detection', () => {
  /**
   * For any missing required environment variable, the Coordination_System should provide 
   * an error message that names the missing variable and indicates which application requires it.
   */
  
  it('should detect and report missing Firebase configuration variables', async function() {
    this.timeout(10000); // Increase timeout for property test
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          environment: fc.constantFrom('development' as Environment, 'staging' as Environment, 'production' as Environment),
          missingVarIndex: fc.integer({ min: 0, max: 6 }), // 7 Firebase vars
          backendPort: fc.integer({ min: 3000, max: 9999 })
        }),
        async (testData) => {
          const envPrefix = testData.environment.toUpperCase();
          
          // List of all required Firebase variables
          const firebaseVars = [
            `${envPrefix}_FIREBASE_API_KEY`,
            `${envPrefix}_FIREBASE_AUTH_DOMAIN`,
            `${envPrefix}_FIREBASE_DATABASE_URL`,
            `${envPrefix}_FIREBASE_PROJECT_ID`,
            `${envPrefix}_FIREBASE_STORAGE_BUCKET`,
            `${envPrefix}_FIREBASE_MESSAGING_SENDER_ID`,
            `${envPrefix}_FIREBASE_APP_ID`
          ];
          
          // Set all variables except the one we want to test as missing
          const missingVar = firebaseVars[testData.missingVarIndex];
          
          for (let i = 0; i < firebaseVars.length; i++) {
            if (i === testData.missingVarIndex) {
              delete process.env[firebaseVars[i]];
            } else {
              process.env[firebaseVars[i]] = `test-value-${i}`;
            }
          }
          
          process.env.FRONTEND_API_ENDPOINT = `http://localhost:${testData.backendPort}`;
          process.env.BACKEND_PORT = testData.backendPort.toString();

          const configManager = new ConfigManager();
          
          try {
            await configManager.loadConfig(testData.environment);
            // Should not reach here - should throw an error
            expect.fail('Expected loadConfig to throw an error for missing variable');
          } catch (error) {
            const errorMessage = (error as Error).message;
            
            // Property: Error message must name the missing variable
            expect(errorMessage).to.include(
              missingVar,
              `Error message should name the missing variable: ${missingVar}`
            );
            
            // Property: Error message must indicate which application requires it
            // Firebase vars are required by both applications
            expect(errorMessage).to.match(
              /both applications|frontend|backend/i,
              'Error message should indicate which application requires the variable'
            );
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should detect and report missing frontend-specific configuration variables', async function() {
    this.timeout(10000); // Increase timeout for property test
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          environment: fc.constantFrom('development' as Environment, 'staging' as Environment, 'production' as Environment),
          backendPort: fc.integer({ min: 3000, max: 9999 })
        }),
        async (testData) => {
          const envPrefix = testData.environment.toUpperCase();
          
          // Set all Firebase variables
          process.env[`${envPrefix}_FIREBASE_API_KEY`] = 'test-api-key';
          process.env[`${envPrefix}_FIREBASE_AUTH_DOMAIN`] = 'test-auth-domain';
          process.env[`${envPrefix}_FIREBASE_DATABASE_URL`] = 'http://test-db.example.com';
          process.env[`${envPrefix}_FIREBASE_PROJECT_ID`] = 'test-project';
          process.env[`${envPrefix}_FIREBASE_STORAGE_BUCKET`] = 'test-bucket';
          process.env[`${envPrefix}_FIREBASE_MESSAGING_SENDER_ID`] = 'test-sender';
          process.env[`${envPrefix}_FIREBASE_APP_ID`] = 'test-app-id';
          process.env.BACKEND_PORT = testData.backendPort.toString();
          
          // Delete frontend-specific variable
          delete process.env.FRONTEND_API_ENDPOINT;

          const configManager = new ConfigManager();
          
          try {
            await configManager.loadConfig(testData.environment);
            // Should not reach here - should throw an error
            expect.fail('Expected loadConfig to throw an error for missing FRONTEND_API_ENDPOINT');
          } catch (error) {
            const errorMessage = (error as Error).message;
            
            // Property: Error message must name the missing variable
            expect(errorMessage).to.include(
              'FRONTEND_API_ENDPOINT',
              'Error message should name the missing variable: FRONTEND_API_ENDPOINT'
            );
            
            // Property: Error message must indicate it's required by frontend
            expect(errorMessage).to.match(
              /frontend/i,
              'Error message should indicate that frontend requires this variable'
            );
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should detect and report missing backend-specific configuration variables', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          environment: fc.constantFrom('development' as Environment, 'staging' as Environment, 'production' as Environment),
          apiEndpoint: fc.webUrl()
        }),
        async (testData) => {
          const envPrefix = testData.environment.toUpperCase();
          
          // Set all Firebase variables
          process.env[`${envPrefix}_FIREBASE_API_KEY`] = 'test-api-key';
          process.env[`${envPrefix}_FIREBASE_AUTH_DOMAIN`] = 'test-auth-domain';
          process.env[`${envPrefix}_FIREBASE_DATABASE_URL`] = 'http://test-db.example.com';
          process.env[`${envPrefix}_FIREBASE_PROJECT_ID`] = 'test-project';
          process.env[`${envPrefix}_FIREBASE_STORAGE_BUCKET`] = 'test-bucket';
          process.env[`${envPrefix}_FIREBASE_MESSAGING_SENDER_ID`] = 'test-sender';
          process.env[`${envPrefix}_FIREBASE_APP_ID`] = 'test-app-id';
          process.env.FRONTEND_API_ENDPOINT = testData.apiEndpoint;
          
          // Delete backend-specific variable
          delete process.env.BACKEND_PORT;

          const configManager = new ConfigManager();
          
          try {
            await configManager.loadConfig(testData.environment);
            // Should not reach here - should throw an error
            expect.fail('Expected loadConfig to throw an error for missing BACKEND_PORT');
          } catch (error) {
            const errorMessage = (error as Error).message;
            
            // Property: Error message must name the missing variable
            expect(errorMessage).to.include(
              'BACKEND_PORT',
              'Error message should name the missing variable: BACKEND_PORT'
            );
            
            // Property: Error message must indicate it's required by backend
            expect(errorMessage).to.match(
              /backend/i,
              'Error message should indicate that backend requires this variable'
            );
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should provide clear error messages for any missing required variable', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          environment: fc.constantFrom('development' as Environment, 'staging' as Environment, 'production' as Environment)
        }),
        async (testData) => {
          // Clear all environment variables
          const envPrefix = testData.environment.toUpperCase();
          delete process.env[`${envPrefix}_FIREBASE_API_KEY`];
          delete process.env[`${envPrefix}_FIREBASE_AUTH_DOMAIN`];
          delete process.env[`${envPrefix}_FIREBASE_DATABASE_URL`];
          delete process.env[`${envPrefix}_FIREBASE_PROJECT_ID`];
          delete process.env[`${envPrefix}_FIREBASE_STORAGE_BUCKET`];
          delete process.env[`${envPrefix}_FIREBASE_MESSAGING_SENDER_ID`];
          delete process.env[`${envPrefix}_FIREBASE_APP_ID`];
          delete process.env.FRONTEND_API_ENDPOINT;
          delete process.env.BACKEND_PORT;

          const configManager = new ConfigManager();
          
          try {
            await configManager.loadConfig(testData.environment);
            // Should not reach here - should throw an error
            expect.fail('Expected loadConfig to throw an error for missing variables');
          } catch (error) {
            const errorMessage = (error as Error).message;
            
            // Property: Error message must be clear and informative
            expect(errorMessage).to.match(
              /missing required environment variable/i,
              'Error message should clearly indicate a missing environment variable'
            );
            
            // Property: Error message must include the environment context
            expect(errorMessage).to.include(
              testData.environment,
              'Error message should include the environment context'
            );
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
