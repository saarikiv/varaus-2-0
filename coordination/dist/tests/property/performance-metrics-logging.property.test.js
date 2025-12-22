"use strict";
/**
 * Property Test: Performance Metrics Logging
 * Feature: full-stack-coordination, Property 14: Performance Metrics Logging
 * Validates: Requirements 6.5
 *
 * Property: For any detected performance issue, the Health_Monitoring should
 * log metrics for both frontend and backend operations.
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
describe('Property Test: Performance Metrics Logging', function () {
    // Increase timeout for property tests
    this.timeout(30000);
    /**
     * Property 14: Performance Metrics Logging
     * For any detected performance issue, health monitoring should log metrics
     * for both frontend and backend operations
     */
    it('should log performance metrics for both applications', async () => {
        const frontendPort = 3460;
        const backendPort = 3461;
        const frontendServer = createMockServerWithDelay(frontendPort, 100);
        const backendServer = createMockServerWithDelay(backendPort, 100);
        try {
            // Wait for servers to start
            await Promise.all([
                waitForServer(frontendServer),
                waitForServer(backendServer)
            ]);
            // Create health monitor
            const monitor = new health_1.HealthMonitorImpl({ url: `http://127.0.0.1:${frontendPort}`, timeout: 2000 }, { url: `http://127.0.0.1:${backendPort}`, timeout: 2000 });
            // Get health report
            const report = await monitor.getHealthReport();
            // Verify frontend performance metrics are logged
            (0, chai_1.expect)(report.frontend).to.have.property('performance');
            (0, chai_1.expect)(report.frontend.performance).to.exist;
            if (report.frontend.performance) {
                // Should have response time
                (0, chai_1.expect)(report.frontend.performance).to.have.property('responseTime');
                (0, chai_1.expect)(report.frontend.performance.responseTime).to.be.a('number');
                (0, chai_1.expect)(report.frontend.performance.responseTime).to.be.at.least(0);
                // Should have memory metrics
                (0, chai_1.expect)(report.frontend.performance).to.have.property('memory');
                (0, chai_1.expect)(report.frontend.performance.memory).to.have.property('heapUsed');
                (0, chai_1.expect)(report.frontend.performance.memory).to.have.property('heapTotal');
                (0, chai_1.expect)(report.frontend.performance.memory).to.have.property('external');
                (0, chai_1.expect)(report.frontend.performance.memory.heapUsed).to.be.a('number');
                (0, chai_1.expect)(report.frontend.performance.memory.heapTotal).to.be.a('number');
                (0, chai_1.expect)(report.frontend.performance.memory.external).to.be.a('number');
                // Should have CPU metrics
                (0, chai_1.expect)(report.frontend.performance).to.have.property('cpu');
                (0, chai_1.expect)(report.frontend.performance.cpu).to.have.property('user');
                (0, chai_1.expect)(report.frontend.performance.cpu).to.have.property('system');
                (0, chai_1.expect)(report.frontend.performance.cpu.user).to.be.a('number');
                (0, chai_1.expect)(report.frontend.performance.cpu.system).to.be.a('number');
            }
            // Verify backend performance metrics are logged
            (0, chai_1.expect)(report.backend).to.have.property('performance');
            (0, chai_1.expect)(report.backend.performance).to.exist;
            if (report.backend.performance) {
                // Should have response time
                (0, chai_1.expect)(report.backend.performance).to.have.property('responseTime');
                (0, chai_1.expect)(report.backend.performance.responseTime).to.be.a('number');
                (0, chai_1.expect)(report.backend.performance.responseTime).to.be.at.least(0);
                // Should have memory metrics
                (0, chai_1.expect)(report.backend.performance).to.have.property('memory');
                (0, chai_1.expect)(report.backend.performance.memory).to.have.property('heapUsed');
                (0, chai_1.expect)(report.backend.performance.memory).to.have.property('heapTotal');
                (0, chai_1.expect)(report.backend.performance.memory).to.have.property('external');
                // Should have CPU metrics
                (0, chai_1.expect)(report.backend.performance).to.have.property('cpu');
                (0, chai_1.expect)(report.backend.performance.cpu).to.have.property('user');
                (0, chai_1.expect)(report.backend.performance.cpu).to.have.property('system');
            }
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
     * Test that performance metrics reflect actual response times
     */
    it('should accurately measure response times', async () => {
        const port = 3462;
        const delay = 200;
        const server = createMockServerWithDelay(port, delay);
        try {
            await waitForServer(server);
            const monitor = new health_1.HealthMonitorImpl({ url: `http://127.0.0.1:${port}`, timeout: 2000 }, { url: `http://127.0.0.1:${port}`, timeout: 2000 });
            const health = await monitor.checkApplicationHealth('frontend');
            // Verify performance metrics exist
            (0, chai_1.expect)(health).to.have.property('performance');
            (0, chai_1.expect)(health.performance).to.exist;
            if (health.performance) {
                // Response time should be positive
                (0, chai_1.expect)(health.performance.responseTime).to.be.at.least(0);
                // Response time should be reasonable (not more than delay + 1000ms overhead)
                (0, chai_1.expect)(health.performance.responseTime).to.be.at.most(delay + 1000);
            }
        }
        finally {
            await closeServer(server);
        }
    });
    /**
     * Test that memory metrics are always positive numbers
     */
    it('should log valid memory metrics', async () => {
        const frontendPort = 3463;
        const backendPort = 3464;
        const frontendServer = createMockServerWithDelay(frontendPort, 0);
        const backendServer = createMockServerWithDelay(backendPort, 0);
        try {
            await Promise.all([
                waitForServer(frontendServer),
                waitForServer(backendServer)
            ]);
            const monitor = new health_1.HealthMonitorImpl({ url: `http://127.0.0.1:${frontendPort}`, timeout: 2000 }, { url: `http://127.0.0.1:${backendPort}`, timeout: 2000 });
            const report = await monitor.getHealthReport();
            // Check frontend memory metrics
            if (report.frontend.performance) {
                (0, chai_1.expect)(report.frontend.performance.memory.heapUsed).to.be.at.least(0);
                (0, chai_1.expect)(report.frontend.performance.memory.heapTotal).to.be.at.least(0);
                (0, chai_1.expect)(report.frontend.performance.memory.external).to.be.at.least(0);
                // heapUsed should not exceed heapTotal
                (0, chai_1.expect)(report.frontend.performance.memory.heapUsed).to.be.at.most(report.frontend.performance.memory.heapTotal);
            }
            // Check backend memory metrics
            if (report.backend.performance) {
                (0, chai_1.expect)(report.backend.performance.memory.heapUsed).to.be.at.least(0);
                (0, chai_1.expect)(report.backend.performance.memory.heapTotal).to.be.at.least(0);
                (0, chai_1.expect)(report.backend.performance.memory.external).to.be.at.least(0);
                // heapUsed should not exceed heapTotal
                (0, chai_1.expect)(report.backend.performance.memory.heapUsed).to.be.at.most(report.backend.performance.memory.heapTotal);
            }
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
 * Helper: Create a mock HTTP server with configurable delay
 */
function createMockServerWithDelay(port, delayMs) {
    const server = http.createServer((req, res) => {
        setTimeout(() => {
            res.writeHead(200);
            res.end('OK');
        }, delayMs);
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
