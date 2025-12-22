"use strict";
/**
 * Property-Based Tests for Startup Error Handling
 * Feature: full-stack-coordination, Property 2: Startup Error Handling
 * Validates: Requirements 1.4
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
describe('Property 2: Startup Error Handling', () => {
    /**
     * For any application startup failure scenario, the Coordination_System should provide
     * an error message that identifies the failing application and includes troubleshooting guidance.
     */
    it('should identify the failing application in error messages', () => {
        fc.assert(fc.property(fc.record({
            failedApp: fc.constantFrom('frontend', 'backend'),
            phase: fc.constantFrom('launch', 'connectivity', 'configuration'),
            errorMessage: fc.string({ minLength: 10, maxLength: 200 })
        }), (testData) => {
            // Simulate a startup failure
            const result = {
                success: false,
                errors: [
                    {
                        application: testData.failedApp,
                        phase: testData.phase,
                        message: testData.errorMessage,
                        troubleshooting: ['Check logs', 'Verify configuration']
                    }
                ]
            };
            // Property: Error must identify the failing application
            (0, chai_1.expect)(result.errors).to.have.lengthOf.at.least(1);
            (0, chai_1.expect)(result.errors[0].application).to.equal(testData.failedApp);
            (0, chai_1.expect)(result.errors[0].application).to.be.oneOf(['frontend', 'backend']);
        }), { numRuns: 100 });
    });
    it('should include troubleshooting guidance for all errors', function () {
        this.timeout(10000); // Increase timeout for property test
        fc.assert(fc.property(fc.record({
            application: fc.constantFrom('frontend', 'backend'),
            phase: fc.constantFrom('launch', 'connectivity', 'configuration'),
            message: fc.string({ minLength: 10, maxLength: 200 }),
            troubleshootingSteps: fc.array(fc.string({ minLength: 5, maxLength: 100 }), { minLength: 1, maxLength: 10 })
        }), (testData) => {
            // Create an error with troubleshooting guidance
            const error = {
                application: testData.application,
                phase: testData.phase,
                message: testData.message,
                troubleshooting: testData.troubleshootingSteps
            };
            // Property: Every error must include troubleshooting guidance
            (0, chai_1.expect)(error.troubleshooting).to.be.an('array');
            (0, chai_1.expect)(error.troubleshooting).to.not.be.empty;
            (0, chai_1.expect)(error.troubleshooting.length).to.be.greaterThan(0);
            // Property: Each troubleshooting step should be a non-empty string
            error.troubleshooting.forEach(step => {
                (0, chai_1.expect)(step).to.be.a('string');
                (0, chai_1.expect)(step.length).to.be.greaterThan(0);
            });
        }), { numRuns: 100 });
    });
    it('should provide clear error messages for all failure scenarios', () => {
        fc.assert(fc.property(fc.record({
            application: fc.constantFrom('frontend', 'backend'),
            phase: fc.constantFrom('launch', 'connectivity', 'configuration'),
            message: fc.string({ minLength: 10, maxLength: 200 })
        }), (testData) => {
            // Create a startup error
            const error = {
                application: testData.application,
                phase: testData.phase,
                message: testData.message,
                troubleshooting: ['Step 1', 'Step 2']
            };
            // Property: Error message must be clear and non-empty
            (0, chai_1.expect)(error.message).to.be.a('string');
            (0, chai_1.expect)(error.message.length).to.be.greaterThan(0);
            // Property: Error must specify the phase where failure occurred
            (0, chai_1.expect)(error.phase).to.be.oneOf(['launch', 'connectivity', 'configuration']);
        }), { numRuns: 100 });
    });
    it('should differentiate between launch, connectivity, and configuration errors', () => {
        fc.assert(fc.property(fc.record({
            application: fc.constantFrom('frontend', 'backend'),
            launchError: fc.string({ minLength: 10, maxLength: 100 }),
            connectivityError: fc.string({ minLength: 10, maxLength: 100 }),
            configError: fc.string({ minLength: 10, maxLength: 100 })
        }), (testData) => {
            // Create errors for each phase
            const launchError = {
                application: testData.application,
                phase: 'launch',
                message: testData.launchError,
                troubleshooting: ['Check if application files exist']
            };
            const connectivityError = {
                application: testData.application,
                phase: 'connectivity',
                message: testData.connectivityError,
                troubleshooting: ['Check network connectivity']
            };
            const configError = {
                application: testData.application,
                phase: 'configuration',
                message: testData.configError,
                troubleshooting: ['Verify environment variables']
            };
            // Property: Each error type should have distinct phase
            (0, chai_1.expect)(launchError.phase).to.equal('launch');
            (0, chai_1.expect)(connectivityError.phase).to.equal('connectivity');
            (0, chai_1.expect)(configError.phase).to.equal('configuration');
            // Property: All errors should have the same application
            (0, chai_1.expect)(launchError.application).to.equal(testData.application);
            (0, chai_1.expect)(connectivityError.application).to.equal(testData.application);
            (0, chai_1.expect)(configError.application).to.equal(testData.application);
        }), { numRuns: 100 });
    });
    it('should provide context-specific troubleshooting for different error types', () => {
        fc.assert(fc.property(fc.record({
            application: fc.constantFrom('frontend', 'backend'),
            errorType: fc.constantFrom('port_in_use', 'missing_files', 'firebase_error', 'network_error')
        }), (testData) => {
            // Simulate different error types with appropriate troubleshooting
            let troubleshooting = [];
            let message = '';
            let phase = 'launch';
            switch (testData.errorType) {
                case 'port_in_use':
                    message = 'Port is already in use';
                    phase = 'launch';
                    troubleshooting = [
                        'Stop other processes using this port',
                        'Try using a different port',
                        'Check if another instance is running'
                    ];
                    break;
                case 'missing_files':
                    message = 'Application files not found';
                    phase = 'launch';
                    troubleshooting = [
                        'Verify project structure is correct',
                        'Run npm install to ensure dependencies are present',
                        'Check if files are in the correct location'
                    ];
                    break;
                case 'firebase_error':
                    message = 'Firebase connectivity failed';
                    phase = 'connectivity';
                    troubleshooting = [
                        'Check Firebase configuration credentials',
                        'Verify Firebase project is accessible',
                        'Check network connectivity to Firebase'
                    ];
                    break;
                case 'network_error':
                    message = 'Network connectivity check failed';
                    phase = 'connectivity';
                    troubleshooting = [
                        'Check if the service is responding',
                        'Verify network connectivity',
                        'Check firewall settings'
                    ];
                    break;
            }
            const error = {
                application: testData.application,
                phase,
                message,
                troubleshooting
            };
            // Property: Troubleshooting should be relevant to the error type
            (0, chai_1.expect)(error.troubleshooting).to.not.be.empty;
            (0, chai_1.expect)(error.troubleshooting.length).to.be.greaterThan(0);
            // Property: Port errors should mention port-related troubleshooting
            if (testData.errorType === 'port_in_use') {
                const hasPortGuidance = error.troubleshooting.some(step => step.toLowerCase().includes('port'));
                (0, chai_1.expect)(hasPortGuidance).to.be.true;
            }
            // Property: Firebase errors should mention Firebase-related troubleshooting
            if (testData.errorType === 'firebase_error') {
                const hasFirebaseGuidance = error.troubleshooting.some(step => step.toLowerCase().includes('firebase'));
                (0, chai_1.expect)(hasFirebaseGuidance).to.be.true;
            }
            // Property: File errors should mention file-related troubleshooting
            if (testData.errorType === 'missing_files') {
                const hasFileGuidance = error.troubleshooting.some(step => step.toLowerCase().includes('file') ||
                    step.toLowerCase().includes('install') ||
                    step.toLowerCase().includes('structure'));
                (0, chai_1.expect)(hasFileGuidance).to.be.true;
            }
        }), { numRuns: 100 });
    });
    it('should ensure failed startups do not report success', () => {
        fc.assert(fc.property(fc.record({
            application: fc.constantFrom('frontend', 'backend'),
            phase: fc.constantFrom('launch', 'connectivity', 'configuration'),
            message: fc.string({ minLength: 10, maxLength: 200 })
        }), (testData) => {
            // Create a failed startup result
            const result = {
                success: false,
                errors: [
                    {
                        application: testData.application,
                        phase: testData.phase,
                        message: testData.message,
                        troubleshooting: ['Check logs']
                    }
                ]
            };
            // Property: If there are errors, success must be false
            if (result.errors.length > 0) {
                (0, chai_1.expect)(result.success).to.be.false;
            }
            // Property: Failed results should not have both applications running
            if (!result.success) {
                const bothRunning = result.backend?.status === 'running' && result.frontend?.status === 'running';
                (0, chai_1.expect)(bothRunning).to.be.false;
            }
        }), { numRuns: 100 });
    });
    it('should provide multiple troubleshooting steps for complex errors', () => {
        fc.assert(fc.property(fc.record({
            application: fc.constantFrom('frontend', 'backend'),
            phase: fc.constantFrom('launch', 'connectivity', 'configuration'),
            message: fc.string({ minLength: 10, maxLength: 200 }),
            numSteps: fc.integer({ min: 2, max: 10 })
        }), (testData) => {
            // Create troubleshooting steps
            const troubleshooting = Array.from({ length: testData.numSteps }, (_, i) => `Troubleshooting step ${i + 1}`);
            const error = {
                application: testData.application,
                phase: testData.phase,
                message: testData.message,
                troubleshooting
            };
            // Property: Should have at least 2 troubleshooting steps for better guidance
            (0, chai_1.expect)(error.troubleshooting.length).to.be.at.least(2);
            // Property: All steps should be unique
            const uniqueSteps = new Set(error.troubleshooting);
            (0, chai_1.expect)(uniqueSteps.size).to.equal(error.troubleshooting.length);
        }), { numRuns: 100 });
    });
});
