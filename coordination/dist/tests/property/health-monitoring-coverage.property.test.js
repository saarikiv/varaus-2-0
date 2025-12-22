"use strict";
/**
 * Property Test: Health Monitoring Coverage
 * Feature: full-stack-coordination, Property 13: Health Monitoring Coverage
 * Validates: Requirements 6.1, 6.2, 6.3, 6.4
 *
 * Property: For any running system state, the Health_Monitoring should check
 * and report status for both applications including Firebase connectivity.
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
const health_1 = require("../../src/health");
const http = __importStar(require("http"));
describe('Property Test: Health Monitoring Coverage', function () {
    // Increase timeout for property tests
    this.timeout(30000);
    /**
     * Property 13: Health Monitoring Coverage
     * For any running system state, health monitoring should check both applications
     * and include Firebase connectivity checks
     */
    it('should check and report status for both applications including Firebase connectivity', async () => {
        // Use a fixed port to avoid port conflicts
        const frontendPort = 3456;
        const backendPort = 3457;
        const frontendServer = createMockServer(frontendPort, true);
        const backendServer = createMockServer(backendPort, true, true);
        try {
            // Wait for servers to start
            await Promise.all([
                waitForServer(frontendServer),
                waitForServer(backendServer)
            ]);
            // Create health monitor
            const monitor = new health_1.HealthMonitorImpl({ url: `http://127.0.0.1:${frontendPort}`, timeout: 1000 }, { url: `http://127.0.0.1:${backendPort}`, timeout: 1000 });
            // Get health report
            const report = await monitor.getHealthReport();
            // Verify coverage: report should include both applications
            (0, chai_1.expect)(report).to.have.property('frontend');
            (0, chai_1.expect)(report).to.have.property('backend');
            (0, chai_1.expect)(report).to.have.property('integration');
            (0, chai_1.expect)(report).to.have.property('overallStatus');
            (0, chai_1.expect)(report).to.have.property('timestamp');
            // Verify frontend health status is checked
            (0, chai_1.expect)(report.frontend).to.have.property('status');
            (0, chai_1.expect)(report.frontend).to.have.property('checks');
            (0, chai_1.expect)(report.frontend).to.have.property('lastChecked');
            (0, chai_1.expect)(report.frontend.checks).to.be.an('array');
            // Frontend should have responsiveness check
            const frontendResponsivenessCheck = report.frontend.checks.find(c => c.name === 'responsiveness');
            (0, chai_1.expect)(frontendResponsivenessCheck).to.exist;
            (0, chai_1.expect)(frontendResponsivenessCheck.status).to.equal('pass');
            // Verify backend health status is checked
            (0, chai_1.expect)(report.backend).to.have.property('status');
            (0, chai_1.expect)(report.backend).to.have.property('checks');
            (0, chai_1.expect)(report.backend).to.have.property('lastChecked');
            (0, chai_1.expect)(report.backend.checks).to.be.an('array');
            // Backend should have responsiveness check
            const backendResponsivenessCheck = report.backend.checks.find(c => c.name === 'responsiveness');
            (0, chai_1.expect)(backendResponsivenessCheck).to.exist;
            (0, chai_1.expect)(backendResponsivenessCheck.status).to.equal('pass');
            // Backend should have Firebase connectivity check
            const firebaseCheck = report.backend.checks.find(c => c.name === 'firebase_connectivity');
            (0, chai_1.expect)(firebaseCheck).to.exist;
            (0, chai_1.expect)(firebaseCheck.status).to.be.oneOf(['pass', 'fail', 'warn']);
            // Verify integration status is checked
            (0, chai_1.expect)(report.integration).to.have.property('apiConnectivity');
            (0, chai_1.expect)(report.integration).to.have.property('databaseConnectivity');
            (0, chai_1.expect)(report.integration).to.have.property('crossOriginStatus');
        }
        finally {
            // Clean up servers
            await Promise.all([
                closeServer(frontendServer),
                closeServer(backendServer)
            ]);
        }
    });
    /**
     * Test that health monitoring checks both applications independently
     */
    it('should check individual application health independently', async () => {
        const frontendPort = 3458;
        const backendPort = 3459;
        const frontendServer = createMockServer(frontendPort, true);
        const backendServer = createMockServer(backendPort, true, true);
        try {
            await Promise.all([
                waitForServer(frontendServer),
                waitForServer(backendServer)
            ]);
            const monitor = new health_1.HealthMonitorImpl({ url: `http://127.0.0.1:${frontendPort}`, timeout: 1000 }, { url: `http://127.0.0.1:${backendPort}`, timeout: 1000 });
            // Check frontend health
            const frontendHealth = await monitor.checkApplicationHealth('frontend');
            (0, chai_1.expect)(frontendHealth).to.have.property('status');
            (0, chai_1.expect)(frontendHealth).to.have.property('checks');
            (0, chai_1.expect)(frontendHealth).to.have.property('lastChecked');
            (0, chai_1.expect)(frontendHealth.checks).to.be.an('array').with.length.greaterThan(0);
            const frontendResponsivenessCheck = frontendHealth.checks.find(c => c.name === 'responsiveness');
            (0, chai_1.expect)(frontendResponsivenessCheck).to.exist;
            // Check backend health
            const backendHealth = await monitor.checkApplicationHealth('backend');
            (0, chai_1.expect)(backendHealth).to.have.property('status');
            (0, chai_1.expect)(backendHealth).to.have.property('checks');
            (0, chai_1.expect)(backendHealth).to.have.property('lastChecked');
            (0, chai_1.expect)(backendHealth.checks).to.be.an('array').with.length.greaterThan(0);
            const backendResponsivenessCheck = backendHealth.checks.find(c => c.name === 'responsiveness');
            (0, chai_1.expect)(backendResponsivenessCheck).to.exist;
            // Backend should have Firebase check
            const firebaseCheck = backendHealth.checks.find(c => c.name === 'firebase_connectivity');
            (0, chai_1.expect)(firebaseCheck).to.exist;
        }
        finally {
            await Promise.all([
                closeServer(frontendServer),
                closeServer(backendServer)
            ]);
        }
    });
});
/**
 * Helper: Create a mock HTTP server
 */
function createMockServer(port, responds, hasFirebaseEndpoint = false) {
    const server = http.createServer((req, res) => {
        if (!responds) {
            // Simulate unresponsive server by delaying response
            setTimeout(() => {
                res.writeHead(500);
                res.end('Server error');
            }, 2000);
            return;
        }
        // Handle Firebase health endpoint
        if (req.url === '/health/firebase' && hasFirebaseEndpoint) {
            res.writeHead(200);
            res.end(JSON.stringify({ status: 'connected' }));
            return;
        }
        // Default response
        res.writeHead(200);
        res.end('OK');
    });
    server.listen(port, '127.0.0.1');
    return server;
}
/**
 * Helper: Wait for server to start
 */
function waitForServer(server) {
    return new Promise((resolve) => {
        server.once('listening', () => resolve());
    });
}
/**
 * Helper: Close server
 */
function closeServer(server) {
    return new Promise((resolve) => {
        server.close(() => resolve());
    });
}
