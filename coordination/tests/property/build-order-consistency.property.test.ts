/**
 * Property-Based Tests for Build Order Consistency
 * Feature: full-stack-coordination, Property 3: Build Order Consistency
 * Validates: Requirements 2.1
 */

import { expect } from 'chai';
import * as fc from 'fast-check';
import { BuildCoordinatorImpl, BuildAllResult } from '../../src/build';
import { ConfigManager, SystemConfig } from '../../src/config';
import { Environment } from '../../src/types';

describe('Property 3: Build Order Consistency', () => {
  /**
   * For any build initiation across any environment, the Coordination_System should build 
   * applications in dependency order (backend before frontend when frontend depends on backend types/contracts).
   */
  
  it('should always build backend before frontend', async function() {
    this.timeout(30000); // Increase timeout for build operations
    
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
          // Set up environment variables
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
          const buildCoordinator = new BuildCoordinatorImpl();
          
          try {
            const config = await configManager.loadConfig(testData.environment);
            
            // Track build order by recording timestamps
            const buildTimestamps: { app: string; startTime: number; endTime: number }[] = [];
            
            // Mock the buildApplication method to track order
            const originalBuildApplication = buildCoordinator.buildApplication.bind(buildCoordinator);
            buildCoordinator.buildApplication = async (app, cfg) => {
              const startTime = Date.now();
              buildTimestamps.push({ app, startTime, endTime: 0 });
              
              // Simulate build (don't actually build to keep tests fast)
              await new Promise(resolve => setTimeout(resolve, 10));
              
              const endTime = Date.now();
              buildTimestamps[buildTimestamps.length - 1].endTime = endTime;
              
              return {
                success: true,
                application: app,
                artifacts: [],
                duration: endTime - startTime,
                output: `Mock build output for ${app}`
              };
            };
            
            // Execute buildAll
            const result = await buildCoordinator.buildAll(config);
            
            // Property: Backend must be built before frontend
            expect(buildTimestamps.length).to.equal(2, 'Should build exactly 2 applications');
            
            const backendBuild = buildTimestamps.find(b => b.app === 'backend');
            const frontendBuild = buildTimestamps.find(b => b.app === 'frontend');
            
            expect(backendBuild).to.exist;
            expect(frontendBuild).to.exist;
            
            // Backend should start before frontend
            expect(backendBuild!.startTime).to.be.lessThan(
              frontendBuild!.startTime,
              'Backend build must start before frontend build'
            );
            
            // Backend should complete before frontend starts
            expect(backendBuild!.endTime).to.be.at.most(
              frontendBuild!.startTime,
              'Backend build must complete before frontend build starts'
            );
            
            // Restore original method
            buildCoordinator.buildApplication = originalBuildApplication;
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

  it('should maintain build order regardless of environment', async function() {
    this.timeout(30000); // Increase timeout for build operations
    
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          environments: fc.array(
            fc.constantFrom('development' as Environment, 'staging' as Environment, 'production' as Environment),
            { minLength: 1, maxLength: 3 }
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
          const buildCoordinator = new BuildCoordinatorImpl();
          const configManager = new ConfigManager();
          
          // Test build order for each environment
          for (const environment of testData.environments) {
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

            try {
              const config = await configManager.loadConfig(environment);
              
              // Track build order
              const buildOrder: string[] = [];
              
              // Mock the buildApplication method
              const originalBuildApplication = buildCoordinator.buildApplication.bind(buildCoordinator);
              buildCoordinator.buildApplication = async (app, cfg) => {
                buildOrder.push(app);
                
                // Simulate build
                await new Promise(resolve => setTimeout(resolve, 5));
                
                return {
                  success: true,
                  application: app,
                  artifacts: [],
                  duration: 5,
                  output: `Mock build output for ${app}`
                };
              };
              
              await buildCoordinator.buildAll(config);
              
              // Property: Build order must always be [backend, frontend]
              expect(buildOrder).to.deep.equal(
                ['backend', 'frontend'],
                `Build order must be backend then frontend for ${environment} environment`
              );
              
              // Restore original method
              buildCoordinator.buildApplication = originalBuildApplication;
            } catch (error) {
              if ((error as Error).message.includes('Missing required environment variable')) {
                continue; // Skip this environment
              }
              throw error;
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should not start frontend build if backend build is in progress', async function() {
    this.timeout(30000); // Increase timeout for build operations
    
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
          backendBuildDuration: fc.integer({ min: 10, max: 100 })
        }),
        async (testData) => {
          // Set up environment variables
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
          const buildCoordinator = new BuildCoordinatorImpl();
          
          try {
            const config = await configManager.loadConfig(testData.environment);
            
            // Track concurrent builds
            let backendBuildInProgress = false;
            let frontendStartedWhileBackendInProgress = false;
            
            // Mock the buildApplication method
            const originalBuildApplication = buildCoordinator.buildApplication.bind(buildCoordinator);
            buildCoordinator.buildApplication = async (app, cfg) => {
              if (app === 'backend') {
                backendBuildInProgress = true;
                await new Promise(resolve => setTimeout(resolve, testData.backendBuildDuration));
                backendBuildInProgress = false;
              } else if (app === 'frontend') {
                if (backendBuildInProgress) {
                  frontendStartedWhileBackendInProgress = true;
                }
                await new Promise(resolve => setTimeout(resolve, 5));
              }
              
              return {
                success: true,
                application: app,
                artifacts: [],
                duration: app === 'backend' ? testData.backendBuildDuration : 5,
                output: `Mock build output for ${app}`
              };
            };
            
            await buildCoordinator.buildAll(config);
            
            // Property: Frontend should never start while backend is in progress
            expect(frontendStartedWhileBackendInProgress).to.be.false;
            
            // Restore original method
            buildCoordinator.buildApplication = originalBuildApplication;
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
