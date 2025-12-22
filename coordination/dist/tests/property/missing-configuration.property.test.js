"use strict";
/**
 * Property-Based Tests for Missing Configuration Detection
 * Feature: full-stack-coordination, Property 9: Missing Configuration Detection
 * Validates: Requirements 4.3
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
const config_1 = require("../../src/config");
describe('Property 9: Missing Configuration Detection', () => {
    /**
     * For any missing required environment variable, the Coordination_System should provide
     * an error message that names the missing variable and indicates which application requires it.
     */
    it('should detect and report missing Firebase configuration variables', async function () {
        this.timeout(10000); // Increase timeout for property test
        await fc.assert(fc.asyncProperty(fc.record({
            environment: fc.constantFrom('development', 'staging', 'production'),
            missingVarIndex: fc.integer({ min: 0, max: 6 }), // 7 Firebase vars
            backendPort: fc.integer({ min: 3000, max: 9999 })
        }), async (testData) => {
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
                }
                else {
                    process.env[firebaseVars[i]] = `test-value-${i}`;
                }
            }
            process.env.FRONTEND_API_ENDPOINT = `http://localhost:${testData.backendPort}`;
            process.env.BACKEND_PORT = testData.backendPort.toString();
            const configManager = new config_1.ConfigManager();
            try {
                await configManager.loadConfig(testData.environment);
                // Should not reach here - should throw an error
                chai_1.expect.fail('Expected loadConfig to throw an error for missing variable');
            }
            catch (error) {
                const errorMessage = error.message;
                // Property: Error message must name the missing variable
                (0, chai_1.expect)(errorMessage).to.include(missingVar, `Error message should name the missing variable: ${missingVar}`);
                // Property: Error message must indicate which application requires it
                // Firebase vars are required by both applications
                (0, chai_1.expect)(errorMessage).to.match(/both applications|frontend|backend/i, 'Error message should indicate which application requires the variable');
            }
        }), { numRuns: 100 });
    });
    it('should detect and report missing frontend-specific configuration variables', async function () {
        this.timeout(10000); // Increase timeout for property test
        await fc.assert(fc.asyncProperty(fc.record({
            environment: fc.constantFrom('development', 'staging', 'production'),
            backendPort: fc.integer({ min: 3000, max: 9999 })
        }), async (testData) => {
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
            const configManager = new config_1.ConfigManager();
            try {
                await configManager.loadConfig(testData.environment);
                // Should not reach here - should throw an error
                chai_1.expect.fail('Expected loadConfig to throw an error for missing FRONTEND_API_ENDPOINT');
            }
            catch (error) {
                const errorMessage = error.message;
                // Property: Error message must name the missing variable
                (0, chai_1.expect)(errorMessage).to.include('FRONTEND_API_ENDPOINT', 'Error message should name the missing variable: FRONTEND_API_ENDPOINT');
                // Property: Error message must indicate it's required by frontend
                (0, chai_1.expect)(errorMessage).to.match(/frontend/i, 'Error message should indicate that frontend requires this variable');
            }
        }), { numRuns: 100 });
    });
    it('should detect and report missing backend-specific configuration variables', async () => {
        await fc.assert(fc.asyncProperty(fc.record({
            environment: fc.constantFrom('development', 'staging', 'production'),
            apiEndpoint: fc.webUrl()
        }), async (testData) => {
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
            const configManager = new config_1.ConfigManager();
            try {
                await configManager.loadConfig(testData.environment);
                // Should not reach here - should throw an error
                chai_1.expect.fail('Expected loadConfig to throw an error for missing BACKEND_PORT');
            }
            catch (error) {
                const errorMessage = error.message;
                // Property: Error message must name the missing variable
                (0, chai_1.expect)(errorMessage).to.include('BACKEND_PORT', 'Error message should name the missing variable: BACKEND_PORT');
                // Property: Error message must indicate it's required by backend
                (0, chai_1.expect)(errorMessage).to.match(/backend/i, 'Error message should indicate that backend requires this variable');
            }
        }), { numRuns: 100 });
    });
    it('should provide clear error messages for any missing required variable', async () => {
        await fc.assert(fc.asyncProperty(fc.record({
            environment: fc.constantFrom('development', 'staging', 'production')
        }), async (testData) => {
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
            const configManager = new config_1.ConfigManager();
            try {
                await configManager.loadConfig(testData.environment);
                // Should not reach here - should throw an error
                chai_1.expect.fail('Expected loadConfig to throw an error for missing variables');
            }
            catch (error) {
                const errorMessage = error.message;
                // Property: Error message must be clear and informative
                (0, chai_1.expect)(errorMessage).to.match(/missing required environment variable/i, 'Error message should clearly indicate a missing environment variable');
                // Property: Error message must include the environment context
                (0, chai_1.expect)(errorMessage).to.include(testData.environment, 'Error message should include the environment context');
            }
        }), { numRuns: 100 });
    });
});
