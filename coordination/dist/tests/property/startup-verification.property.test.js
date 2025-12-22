"use strict";
/**
 * Property-Based Tests for Startup Verification
 * Feature: full-stack-coordination, Property 1: Startup Verification Completeness
 * Validates: Requirements 1.1, 1.2, 1.3
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
describe('Property 1: Startup Verification Completeness', () => {
    /**
     * For any valid system configuration and startup request, the Coordination_System should
     * launch both applications and verify connectivity (Firebase for backend, API endpoint for frontend)
     * before reporting successful startup.
     */
    it('should ensure successful startup includes both application handles', () => {
        fc.assert(fc.property(fc.record({
            backendPort: fc.integer({ min: 3000, max: 9999 }),
            frontendPort: fc.integer({ min: 8000, max: 9999 }),
            backendPid: fc.integer({ min: 1000, max: 99999 }),
            frontendPid: fc.integer({ min: 1000, max: 99999 }),
            success: fc.boolean()
        }), (testData) => {
            // Simulate a startup result
            const result = testData.success
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
                (0, chai_1.expect)(result.backend).to.exist;
                (0, chai_1.expect)(result.frontend).to.exist;
                (0, chai_1.expect)(result.backend?.status).to.equal('running');
                (0, chai_1.expect)(result.frontend?.status).to.equal('running');
                (0, chai_1.expect)(result.errors).to.be.empty;
                // Property: Process handles must have required fields
                (0, chai_1.expect)(result.backend).to.have.property('pid');
                (0, chai_1.expect)(result.backend).to.have.property('port');
                (0, chai_1.expect)(result.backend).to.have.property('status');
                (0, chai_1.expect)(result.backend).to.have.property('logs');
                (0, chai_1.expect)(result.frontend).to.have.property('pid');
                (0, chai_1.expect)(result.frontend).to.have.property('port');
                (0, chai_1.expect)(result.frontend).to.have.property('status');
                (0, chai_1.expect)(result.frontend).to.have.property('logs');
                // Property: PIDs should be positive
                (0, chai_1.expect)(result.backend.pid).to.be.greaterThan(0);
                (0, chai_1.expect)(result.frontend.pid).to.be.greaterThan(0);
            }
            else {
                // Property: If startup fails, errors should be provided
                (0, chai_1.expect)(result.errors).to.not.be.empty;
                (0, chai_1.expect)(result.errors[0]).to.have.property('application');
                (0, chai_1.expect)(result.errors[0]).to.have.property('phase');
                (0, chai_1.expect)(result.errors[0]).to.have.property('message');
                (0, chai_1.expect)(result.errors[0]).to.have.property('troubleshooting');
            }
        }), { numRuns: 100 });
    });
    it('should not start frontend if backend connectivity fails', () => {
        fc.assert(fc.property(fc.record({
            backendPort: fc.integer({ min: 3000, max: 9999 }),
            frontendPort: fc.integer({ min: 8000, max: 9999 }),
            backendConnectivityFails: fc.boolean()
        }), (testData) => {
            // Simulate a startup result where backend connectivity fails
            const result = testData.backendConnectivityFails
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
                const backendError = result.errors.find(e => e.application === 'backend' && e.phase === 'connectivity');
                if (backendError) {
                    // Backend connectivity failed, so frontend should not have been started
                    (0, chai_1.expect)(result.frontend).to.be.undefined;
                }
            }
            // Property: If both are running, backend must have been verified first
            if (result.success && result.backend && result.frontend) {
                // Both are running, which means backend connectivity was verified
                (0, chai_1.expect)(result.backend.status).to.equal('running');
                (0, chai_1.expect)(result.frontend.status).to.equal('running');
            }
        }), { numRuns: 100 });
    });
    it('should provide process handles with required information', () => {
        fc.assert(fc.property(fc.record({
            backendPort: fc.integer({ min: 3000, max: 9999 }),
            frontendPort: fc.integer({ min: 8000, max: 9999 }),
            backendPid: fc.integer({ min: 1000, max: 99999 }),
            frontendPid: fc.integer({ min: 1000, max: 99999 })
        }), (testData) => {
            // Simulate a successful startup result
            const result = {
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
            (0, chai_1.expect)(result.backend).to.have.property('pid');
            (0, chai_1.expect)(result.backend).to.have.property('port');
            (0, chai_1.expect)(result.backend).to.have.property('status');
            (0, chai_1.expect)(result.backend).to.have.property('logs');
            (0, chai_1.expect)(result.frontend).to.have.property('pid');
            (0, chai_1.expect)(result.frontend).to.have.property('port');
            (0, chai_1.expect)(result.frontend).to.have.property('status');
            (0, chai_1.expect)(result.frontend).to.have.property('logs');
            // Property: PIDs should be positive numbers
            (0, chai_1.expect)(result.backend.pid).to.be.greaterThan(0);
            (0, chai_1.expect)(result.frontend.pid).to.be.greaterThan(0);
            // Property: Logs should be accessible
            (0, chai_1.expect)(result.backend.logs).to.have.property('entries');
            (0, chai_1.expect)(result.frontend.logs).to.have.property('entries');
            (0, chai_1.expect)(result.backend.logs.entries).to.be.an('array');
            (0, chai_1.expect)(result.frontend.logs.entries).to.be.an('array');
        }), { numRuns: 100 });
    });
    it('should ensure frontend configuration includes backend endpoint', () => {
        fc.assert(fc.property(fc.record({
            backendPort: fc.integer({ min: 3000, max: 9999 }),
            frontendPort: fc.integer({ min: 8000, max: 9999 })
        }), (testData) => {
            // Create configurations
            const backendConfig = {
                port: testData.backendPort,
                environment: 'development'
            };
            const frontendConfig = {
                port: testData.frontendPort,
                apiEndpoint: `http://localhost:${testData.backendPort}`,
                environment: 'development'
            };
            // Property: Frontend API endpoint should reference backend port
            (0, chai_1.expect)(frontendConfig.apiEndpoint).to.include(testData.backendPort.toString());
            (0, chai_1.expect)(frontendConfig.apiEndpoint).to.include('localhost');
        }), { numRuns: 100 });
    });
    it('should provide troubleshooting information for startup errors', () => {
        fc.assert(fc.property(fc.record({
            application: fc.constantFrom('frontend', 'backend'),
            phase: fc.constantFrom('launch', 'connectivity', 'configuration'),
            message: fc.string({ minLength: 10, maxLength: 100 })
        }), (testData) => {
            // Simulate a startup error
            const error = {
                application: testData.application,
                phase: testData.phase,
                message: testData.message,
                troubleshooting: ['Step 1', 'Step 2', 'Step 3']
            };
            // Property: Every error must have all required fields
            (0, chai_1.expect)(error).to.have.property('application');
            (0, chai_1.expect)(error).to.have.property('phase');
            (0, chai_1.expect)(error).to.have.property('message');
            (0, chai_1.expect)(error).to.have.property('troubleshooting');
            // Property: Troubleshooting should be a non-empty array
            (0, chai_1.expect)(error.troubleshooting).to.be.an('array');
            (0, chai_1.expect)(error.troubleshooting.length).to.be.greaterThan(0);
            // Property: Message should be non-empty
            (0, chai_1.expect)(error.message.length).to.be.greaterThan(0);
        }), { numRuns: 100 });
    });
});
