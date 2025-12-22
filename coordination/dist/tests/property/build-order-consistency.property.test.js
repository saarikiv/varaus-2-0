"use strict";
/**
 * Property-Based Tests for Build Order Consistency
 * Feature: full-stack-coordination, Property 3: Build Order Consistency
 * Validates: Requirements 2.1
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const fc = __importStar(require("fast-check"));
const build_1 = require("../../src/build");
const config_1 = require("../../src/config");
describe('Property 3: Build Order Consistency', () => {
    /**
     * For any build initiation across any environment, the Coordination_System should build
     * applications in dependency order (backend before frontend when frontend depends on backend types/contracts).
     */
    it('should always build backend before frontend', async function () {
        this.timeout(30000); // Increase timeout for build operations
        await fc.assert(fc.asyncProperty(fc.record({
            environment: fc.constantFrom('development', 'staging', 'production'),
            firebaseProjectId: fc.string({ minLength: 5, maxLength: 30 }),
            firebaseDatabaseURL: fc.webUrl(),
            apiKey: fc.string({ minLength: 20, maxLength: 50 }),
            authDomain: fc.webUrl(),
            storageBucket: fc.string({ minLength: 10, maxLength: 50 }),
            messagingSenderId: fc.string({ minLength: 10, maxLength: 20 }),
            appId: fc.string({ minLength: 20, maxLength: 50 }),
            backendPort: fc.integer({ min: 3000, max: 9999 }),
            frontendPort: fc.integer({ min: 8000, max: 9999 })
        }), async (testData) => {
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
            const configManager = new config_1.ConfigManager();
            const buildCoordinator = new build_1.BuildCoordinatorImpl();
            try {
                const config = await configManager.loadConfig(testData.environment);
                // Track build order by recording timestamps
                const buildTimestamps = [];
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
                (0, chai_1.expect)(buildTimestamps.length).to.equal(2, 'Should build exactly 2 applications');
                const backendBuild = buildTimestamps.find(b => b.app === 'backend');
                const frontendBuild = buildTimestamps.find(b => b.app === 'frontend');
                (0, chai_1.expect)(backendBuild).to.exist;
                (0, chai_1.expect)(frontendBuild).to.exist;
                // Backend should start before frontend
                (0, chai_1.expect)(backendBuild.startTime).to.be.lessThan(frontendBuild.startTime, 'Backend build must start before frontend build');
                // Backend should complete before frontend starts
                (0, chai_1.expect)(backendBuild.endTime).to.be.at.most(frontendBuild.startTime, 'Backend build must complete before frontend build starts');
                // Restore original method
                buildCoordinator.buildApplication = originalBuildApplication;
            }
            catch (error) {
                if (error.message.includes('Missing required environment variable')) {
                    return; // Skip this test case
                }
                throw error;
            }
        }), { numRuns: 100 });
    });
    it('should maintain build order regardless of environment', async function () {
        this.timeout(30000); // Increase timeout for build operations
        await fc.assert(fc.asyncProperty(fc.record({
            environments: fc.array(fc.constantFrom('development', 'staging', 'production'), { minLength: 1, maxLength: 3 }),
            firebaseProjectId: fc.string({ minLength: 5, maxLength: 30 }),
            firebaseDatabaseURL: fc.webUrl(),
            apiKey: fc.string({ minLength: 20, maxLength: 50 }),
            authDomain: fc.webUrl(),
            storageBucket: fc.string({ minLength: 10, maxLength: 50 }),
            messagingSenderId: fc.string({ minLength: 10, maxLength: 20 }),
            appId: fc.string({ minLength: 20, maxLength: 50 }),
            backendPort: fc.integer({ min: 3000, max: 9999 })
        }), async (testData) => {
            const buildCoordinator = new build_1.BuildCoordinatorImpl();
            const configManager = new config_1.ConfigManager();
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
                    const buildOrder = [];
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
                    (0, chai_1.expect)(buildOrder).to.deep.equal(['backend', 'frontend'], `Build order must be backend then frontend for ${environment} environment`);
                    // Restore original method
                    buildCoordinator.buildApplication = originalBuildApplication;
                }
                catch (error) {
                    if (error.message.includes('Missing required environment variable')) {
                        continue; // Skip this environment
                    }
                    throw error;
                }
            }
        }), { numRuns: 100 });
    });
    it('should not start frontend build if backend build is in progress', async function () {
        this.timeout(30000); // Increase timeout for build operations
        await fc.assert(fc.asyncProperty(fc.record({
            environment: fc.constantFrom('development', 'staging', 'production'),
            firebaseProjectId: fc.string({ minLength: 5, maxLength: 30 }),
            firebaseDatabaseURL: fc.webUrl(),
            apiKey: fc.string({ minLength: 20, maxLength: 50 }),
            authDomain: fc.webUrl(),
            storageBucket: fc.string({ minLength: 10, maxLength: 50 }),
            messagingSenderId: fc.string({ minLength: 10, maxLength: 20 }),
            appId: fc.string({ minLength: 20, maxLength: 50 }),
            backendPort: fc.integer({ min: 3000, max: 9999 }),
            backendBuildDuration: fc.integer({ min: 10, max: 100 })
        }), async (testData) => {
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
            const configManager = new config_1.ConfigManager();
            const buildCoordinator = new build_1.BuildCoordinatorImpl();
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
                    }
                    else if (app === 'frontend') {
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
                (0, chai_1.expect)(frontendStartedWhileBackendInProgress).to.be.false;
                // Restore original method
                buildCoordinator.buildApplication = originalBuildApplication;
            }
            catch (error) {
                if (error.message.includes('Missing required environment variable')) {
                    return; // Skip this test case
                }
                throw error;
            }
        }), { numRuns: 100 });
    });
});
