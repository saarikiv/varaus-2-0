/**
 * Property-Based Tests for Configuration Consistency
 * Feature: full-stack-coordination, Property 4: Environment Configuration Consistency
 * Validates: Requirements 2.2, 4.1, 4.4, 4.5
 */

import { expect } from 'chai';
import * as fc from 'fast-check';
import { ConfigManager, SystemConfig } from '../../src/config';
import { Environment, FirebaseConfig } from '../../src/types';

describe('Property 4: Environment Configuration Consistency', () => {
  /**
   * For any environment switch or configuration change, both applications should receive 
   * compatible configurations that reference the same Firebase instance and matching API endpoints.
   */
  
  it('should ensure both applications use the same Firebase instance', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          environment: fc.constantFrom('development' as Environment, 'staging' as Environment, 'production' as Environment),
          firebaseProjectId: fc.string({ minLength: 5, maxLength: 30 }),
          firebaseDatabaseURL: fc.webUrl(),
          apiKey: fc.string({ minLength: 20, maxLength: 50 }),
          authDomain: fc.webUrl(),
          storageBucket: fc.string({ minLength: 10, maxLength: 50 }),
          messagingSenderId: fc.string({ minLength: 10, maxLength: 20 }),
          appId: fc.string({ minLength: 20, maxLength: 50 }),
          backendPort: fc.integer({ min: 3000, max: 9999 }),
          frontendPort: fc.integer({ min: 8000, max: 9999 })
        }),
        async (testData) => {
          // Set up environment variables for this test
          const envPrefix = testData.environment.toUpperCase();
          process.env[`${envPrefix}_FIREBASE_API_KEY`] = testData.apiKey;
          process.env[`${envPrefix}_FIREBASE_AUTH_DOMAIN`] = testData.authDomain;
          process.env[`${envPrefix}_FIREBASE_DATABASE_URL`] = testData.firebaseDatabaseURL;
          process.env[`${envPrefix}_FIREBASE_PROJECT_ID`] = testData.firebaseProjectId;
          process.env[`${envPrefix}_FIREBASE_STORAGE_BUCKET`] = testData.storageBucket;
          process.env[`${envPrefix}_FIREBASE_MESSAGING_SENDER_ID`] = testData.messagingSenderId;
          process.env[`${envPrefix}_FIREBASE_APP_ID`] = testData.appId;
          process.env.FRONTEND_API_ENDPOINT = `http://localhost:${testData.backendPort}`;
          process.env.BACKEND_PORT = testData.backendPort.toString();

          const configManager = new ConfigManager();
          
          try {
            const config = await configManager.loadConfig(testData.environment);
            
            // Property: Both applications must use the same Firebase project
            expect(config.frontend.firebaseConfig.projectId).to.equal(
              config.backend.firebaseConfig.projectId,
              'Frontend and backend must use the same Firebase project ID'
            );
            
            // Property: Both applications must use the same Firebase database
            expect(config.frontend.firebaseConfig.databaseURL).to.equal(
              config.backend.firebaseConfig.databaseURL,
              'Frontend and backend must use the same Firebase database URL'
            );
            
            // Property: Firebase configs should be identical
            expect(config.frontend.firebaseConfig).to.deep.equal(
              config.backend.firebaseConfig,
              'Frontend and backend Firebase configurations must be identical'
            );
          } catch (error) {
            // If loading fails due to missing vars, that's expected and acceptable
            // We're only testing the consistency when config successfully loads
            if ((error as Error).message.includes('Missing required environment variable')) {
              return; // Skip this test case
            }
            throw error;
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should ensure frontend API endpoint matches backend configuration in development', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          firebaseProjectId: fc.string({ minLength: 5, maxLength: 30 }),
          firebaseDatabaseURL: fc.webUrl(),
          apiKey: fc.string({ minLength: 20, maxLength: 50 }),
          authDomain: fc.webUrl(),
          storageBucket: fc.string({ minLength: 10, maxLength: 50 }),
          messagingSenderId: fc.string({ minLength: 10, maxLength: 20 }),
          appId: fc.string({ minLength: 20, maxLength: 50 }),
          backendPort: fc.integer({ min: 3000, max: 9999 })
        }),
        async (testData) => {
          // Set up environment variables for development
          const environment: Environment = 'development';
          const envPrefix = environment.toUpperCase();
          
          process.env[`${envPrefix}_FIREBASE_API_KEY`] = testData.apiKey;
          process.env[`${envPrefix}_FIREBASE_AUTH_DOMAIN`] = testData.authDomain;
          process.env[`${envPrefix}_FIREBASE_DATABASE_URL`] = testData.firebaseDatabaseURL;
          process.env[`${envPrefix}_FIREBASE_PROJECT_ID`] = testData.firebaseProjectId;
          process.env[`${envPrefix}_FIREBASE_STORAGE_BUCKET`] = testData.storageBucket;
          process.env[`${envPrefix}_FIREBASE_MESSAGING_SENDER_ID`] = testData.messagingSenderId;
          process.env[`${envPrefix}_FIREBASE_APP_ID`] = testData.appId;
          process.env.FRONTEND_API_ENDPOINT = `http://localhost:${testData.backendPort}`;
          process.env.BACKEND_PORT = testData.backendPort.toString();

          const configManager = new ConfigManager();
          
          try {
            const config = await configManager.loadConfig(environment);
            
            // Property: In development, frontend API endpoint should reference backend port
            expect(config.frontend.apiEndpoint).to.include(
              config.backend.port.toString(),
              'Frontend API endpoint should reference backend port in development'
            );
          } catch (error) {
            if ((error as Error).message.includes('Missing required environment variable')) {
              return; // Skip this test case
            }
            throw error;
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should maintain configuration consistency across environment switches', async function() {
    this.timeout(10000); // Increase timeout for property test
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          environments: fc.array(
            fc.constantFrom('development' as Environment, 'staging' as Environment, 'production' as Environment),
            { minLength: 2, maxLength: 3 }
          ),
          firebaseProjectId: fc.string({ minLength: 5, maxLength: 30 }),
          firebaseDatabaseURL: fc.webUrl(),
          apiKey: fc.string({ minLength: 20, maxLength: 50 }),
          authDomain: fc.webUrl(),
          storageBucket: fc.string({ minLength: 10, maxLength: 50 }),
          messagingSenderId: fc.string({ minLength: 10, maxLength: 20 }),
          appId: fc.string({ minLength: 20, maxLength: 50 }),
          backendPort: fc.integer({ min: 3000, max: 9999 })
        }),
        async (testData) => {
          const configManager = new ConfigManager();
          const loadedConfigs: SystemConfig[] = [];

          // Load configurations for each environment
          for (const env of testData.environments) {
            const envPrefix = env.toUpperCase();
            process.env[`${envPrefix}_FIREBASE_API_KEY`] = testData.apiKey;
            process.env[`${envPrefix}_FIREBASE_AUTH_DOMAIN`] = testData.authDomain;
            process.env[`${envPrefix}_FIREBASE_DATABASE_URL`] = testData.firebaseDatabaseURL;
            process.env[`${envPrefix}_FIREBASE_PROJECT_ID`] = testData.firebaseProjectId;
            process.env[`${envPrefix}_FIREBASE_STORAGE_BUCKET`] = testData.storageBucket;
            process.env[`${envPrefix}_FIREBASE_MESSAGING_SENDER_ID`] = testData.messagingSenderId;
            process.env[`${envPrefix}_FIREBASE_APP_ID`] = testData.appId;
            process.env.FRONTEND_API_ENDPOINT = `http://localhost:${testData.backendPort}`;
            process.env.BACKEND_PORT = testData.backendPort.toString();

            try {
              const config = await configManager.loadConfig(env);
              loadedConfigs.push(config);
            } catch (error) {
              if ((error as Error).message.includes('Missing required environment variable')) {
                continue; // Skip this environment
              }
              throw error;
            }
          }

          // Property: Each loaded config should have consistent Firebase settings between apps
          for (const config of loadedConfigs) {
            expect(config.frontend.firebaseConfig.projectId).to.equal(
              config.backend.firebaseConfig.projectId,
              `Configuration for ${config.shared.environment} should have matching Firebase project IDs`
            );
            
            expect(config.frontend.firebaseConfig.databaseURL).to.equal(
              config.backend.firebaseConfig.databaseURL,
              `Configuration for ${config.shared.environment} should have matching Firebase database URLs`
            );
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should validate configuration compatibility when updating', async function() {
    this.timeout(10000); // Increase timeout for property test
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          environment: fc.constantFrom('development' as Environment, 'staging' as Environment, 'production' as Environment),
          initialFirebaseProjectId: fc.string({ minLength: 5, maxLength: 30 }),
          updatedFrontendProjectId: fc.string({ minLength: 5, maxLength: 30 }),
          firebaseDatabaseURL: fc.webUrl(),
          apiKey: fc.string({ minLength: 20, maxLength: 50 }),
          authDomain: fc.webUrl(),
          storageBucket: fc.string({ minLength: 10, maxLength: 50 }),
          messagingSenderId: fc.string({ minLength: 10, maxLength: 20 }),
          appId: fc.string({ minLength: 20, maxLength: 50 }),
          backendPort: fc.integer({ min: 3000, max: 9999 })
        }),
        async (testData) => {
          // Set up initial configuration
          const envPrefix = testData.environment.toUpperCase();
          process.env[`${envPrefix}_FIREBASE_API_KEY`] = testData.apiKey;
          process.env[`${envPrefix}_FIREBASE_AUTH_DOMAIN`] = testData.authDomain;
          process.env[`${envPrefix}_FIREBASE_DATABASE_URL`] = testData.firebaseDatabaseURL;
          process.env[`${envPrefix}_FIREBASE_PROJECT_ID`] = testData.initialFirebaseProjectId;
          process.env[`${envPrefix}_FIREBASE_STORAGE_BUCKET`] = testData.storageBucket;
          process.env[`${envPrefix}_FIREBASE_MESSAGING_SENDER_ID`] = testData.messagingSenderId;
          process.env[`${envPrefix}_FIREBASE_APP_ID`] = testData.appId;
          process.env.FRONTEND_API_ENDPOINT = `http://localhost:${testData.backendPort}`;
          process.env.BACKEND_PORT = testData.backendPort.toString();

          const configManager = new ConfigManager();
          
          try {
            const config = await configManager.loadConfig(testData.environment);
            
            // Try to update frontend config with a different Firebase project
            const updatedFrontendConfig = {
              ...config.frontend,
              firebaseConfig: {
                ...config.frontend.firebaseConfig,
                projectId: testData.updatedFrontendProjectId
              }
            };

            // Property: If project IDs differ, update should fail validation
            if (testData.initialFirebaseProjectId !== testData.updatedFrontendProjectId) {
              try {
                await configManager.updateConfig({ frontend: updatedFrontendConfig });
                // If we get here and IDs are different, validation should have caught it
                const validationResult = configManager.validateConfig({
                  ...config,
                  frontend: updatedFrontendConfig
                });
                expect(validationResult.valid).to.be.false;
              } catch (error) {
                // Expected to throw due to validation failure
                expect((error as Error).message).to.include('validation failed');
              }
            }
          } catch (error) {
            if ((error as Error).message.includes('Missing required environment variable')) {
              return; // Skip this test case
            }
            throw error;
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
