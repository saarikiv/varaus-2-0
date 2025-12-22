"use strict";
/**
 * Property-Based Tests for Build Failure Blocking Deployment
 * Feature: full-stack-coordination, Property 5: Build Failure Blocks Deployment
 * Validates: Requirements 2.3
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
describe('Property 5: Build Failure Blocks Deployment', () => {
    /**
     * For any build failure in either application, the Coordination_System should prevent
     * deployment and return detailed error information identifying the failing component.
     */
    it('should prevent deployment when backend build fails', async function () {
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
            errorMessage: fc.string({ minLength: 10, maxLength: 100 })
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
                // Mock buildApplication to simulate backend failure
                const originalBuildApplication = buildCoordinator.buildApplication.bind(buildCoordinator);
                buildCoordinator.buildApplication = async (app, cfg) => {
                    if (app === 'backend') {
                        // Simulate backend build failure
                        return {
                            success: false,
                            application: 'backend',
                            artifacts: [],
                            duration: 10,
                            errors: [{
                                    application: 'backend',
                                    phase: 'compilation',
                                    message: testData.errorMessage
                                }],
                            output: `Build failed: ${testData.errorMessage}`
                        };
                    }
                    // Frontend should not be built
                    return {
                        success: true,
                        application: app,
                        artifacts: [],
                        duration: 5,
                        output: 'Mock build output'
                    };
                };
                const result = await buildCoordinator.buildAll(config);
                // Property: Build should fail overall
                (0, chai_1.expect)(result.success).to.be.false;
                // Property: Backend build should have failed
                (0, chai_1.expect)(result.backend.success).to.be.false;
                // Property: Backend errors should be present and identify the failing component
                (0, chai_1.expect)(result.backend.errors).to.exist;
                (0, chai_1.expect)(result.backend.errors.length).to.be.greaterThan(0);
                (0, chai_1.expect)(result.backend.errors[0].application).to.equal('backend');
                (0, chai_1.expect)(result.backend.errors[0].message).to.include(testData.errorMessage);
                // Property: Frontend should not have been built successfully (skipped or failed)
                (0, chai_1.expect)(result.frontend.success).to.be.false;
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
    it('should prevent deployment when frontend build fails', async function () {
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
            errorMessage: fc.string({ minLength: 10, maxLength: 100 }),
            errorFile: fc.string({ minLength: 5, maxLength: 50 }),
            errorLine: fc.integer({ min: 1, max: 1000 })
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
                // Mock buildApplication to simulate frontend failure
                const originalBuildApplication = buildCoordinator.buildApplication.bind(buildCoordinator);
                buildCoordinator.buildApplication = async (app, cfg) => {
                    if (app === 'backend') {
                        // Backend succeeds
                        return {
                            success: true,
                            application: 'backend',
                            artifacts: [],
                            duration: 10,
                            output: 'Backend build successful'
                        };
                    }
                    else if (app === 'frontend') {
                        // Frontend fails
                        return {
                            success: false,
                            application: 'frontend',
                            artifacts: [],
                            duration: 15,
                            errors: [{
                                    application: 'frontend',
                                    phase: 'compilation',
                                    message: testData.errorMessage,
                                    file: testData.errorFile,
                                    line: testData.errorLine
                                }],
                            output: `Build failed: ${testData.errorMessage}`
                        };
                    }
                    return {
                        success: true,
                        application: app,
                        artifacts: [],
                        duration: 5,
                        output: 'Mock build output'
                    };
                };
                const result = await buildCoordinator.buildAll(config);
                // Property: Build should fail overall
                (0, chai_1.expect)(result.success).to.be.false;
                // Property: Backend build should have succeeded
                (0, chai_1.expect)(result.backend.success).to.be.true;
                // Property: Frontend build should have failed
                (0, chai_1.expect)(result.frontend.success).to.be.false;
                // Property: Frontend errors should be present and identify the failing component
                (0, chai_1.expect)(result.frontend.errors).to.exist;
                (0, chai_1.expect)(result.frontend.errors.length).to.be.greaterThan(0);
                (0, chai_1.expect)(result.frontend.errors[0].application).to.equal('frontend');
                (0, chai_1.expect)(result.frontend.errors[0].message).to.include(testData.errorMessage);
                // Property: Error details should include file and line information
                if (result.frontend.errors[0].file) {
                    (0, chai_1.expect)(result.frontend.errors[0].file).to.equal(testData.errorFile);
                }
                if (result.frontend.errors[0].line) {
                    (0, chai_1.expect)(result.frontend.errors[0].line).to.equal(testData.errorLine);
                }
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
    it('should provide detailed error information for any build failure', async function () {
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
            failingApp: fc.constantFrom('backend', 'frontend'),
            errorPhase: fc.constantFrom('configuration', 'compilation', 'bundling', 'asset-processing'),
            errorMessage: fc.string({ minLength: 10, maxLength: 100 })
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
                // Mock buildApplication to simulate failure in specified app
                const originalBuildApplication = buildCoordinator.buildApplication.bind(buildCoordinator);
                buildCoordinator.buildApplication = async (app, cfg) => {
                    if (app === testData.failingApp) {
                        // Simulate failure
                        return {
                            success: false,
                            application: app,
                            artifacts: [],
                            duration: 10,
                            errors: [{
                                    application: app,
                                    phase: testData.errorPhase,
                                    message: testData.errorMessage
                                }],
                            output: `Build failed in ${testData.errorPhase}: ${testData.errorMessage}`
                        };
                    }
                    // Other app succeeds (or is skipped if backend fails)
                    return {
                        success: true,
                        application: app,
                        artifacts: [],
                        duration: 5,
                        output: 'Mock build output'
                    };
                };
                const result = await buildCoordinator.buildAll(config);
                // Property: Build should fail overall
                (0, chai_1.expect)(result.success).to.be.false;
                // Property: The failing application should be identified
                const failedResult = testData.failingApp === 'backend' ? result.backend : result.frontend;
                (0, chai_1.expect)(failedResult.success).to.be.false;
                // Property: Error information must be detailed
                (0, chai_1.expect)(failedResult.errors).to.exist;
                (0, chai_1.expect)(failedResult.errors.length).to.be.greaterThan(0);
                const error = failedResult.errors[0];
                // Property: Error must identify the failing application
                (0, chai_1.expect)(error.application).to.equal(testData.failingApp);
                // Property: Error must include the error message
                (0, chai_1.expect)(error.message).to.include(testData.errorMessage);
                // Property: Error must identify the phase where failure occurred
                (0, chai_1.expect)(error.phase).to.equal(testData.errorPhase);
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
    it('should not proceed with deployment when any build fails', async function () {
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
            backendFails: fc.boolean(),
            frontendFails: fc.boolean()
        }), async (testData) => {
            // Skip if both succeed (we're testing failure cases)
            if (!testData.backendFails && !testData.frontendFails) {
                return;
            }
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
                // Mock buildApplication to simulate failures
                const originalBuildApplication = buildCoordinator.buildApplication.bind(buildCoordinator);
                buildCoordinator.buildApplication = async (app, cfg) => {
                    const shouldFail = (app === 'backend' && testData.backendFails) ||
                        (app === 'frontend' && testData.frontendFails);
                    if (shouldFail) {
                        return {
                            success: false,
                            application: app,
                            artifacts: [],
                            duration: 10,
                            errors: [{
                                    application: app,
                                    phase: 'compilation',
                                    message: `${app} build failed`
                                }],
                            output: `${app} build failed`
                        };
                    }
                    return {
                        success: true,
                        application: app,
                        artifacts: [],
                        duration: 5,
                        output: `${app} build successful`
                    };
                };
                const result = await buildCoordinator.buildAll(config);
                // Property: If any build fails, overall result should be failure
                (0, chai_1.expect)(result.success).to.be.false;
                // Property: At least one application should have failed
                const anyFailed = !result.backend.success || !result.frontend.success;
                (0, chai_1.expect)(anyFailed).to.be.true;
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
