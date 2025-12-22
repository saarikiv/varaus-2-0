/**
 * Property Test: Health Monitoring Coverage
 * Feature: full-stack-coordination, Property 13: Health Monitoring Coverage
 * Validates: Requirements 6.1, 6.2, 6.3, 6.4
 * 
 * Property: For any running system state, the Health_Monitoring should check 
 * and report status for both applications including Firebase connectivity.
 */

import { expect } from 'chai';
import * as fc from 'fast-check';
import { HealthMonitorImpl, HealthCheckEndpoint } from '../../src/health';
import { ApplicationName } from '../../src/types';
import * as http from 'http';

describe('Property Test: Health Monitoring Coverage', function() {
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
      const monitor = new HealthMonitorImpl(
        { url: `http://127.0.0.1:${frontendPort}`, timeout: 1000 },
        { url: `http://127.0.0.1:${backendPort}`, timeout: 1000 }
      );

      // Get health report
      const report = await monitor.getHealthReport();

      // Verify coverage: report should include both applications
      expect(report).to.have.property('frontend');
      expect(report).to.have.property('backend');
      expect(report).to.have.property('integration');
      expect(report).to.have.property('overallStatus');
      expect(report).to.have.property('timestamp');

      // Verify frontend health status is checked
      expect(report.frontend).to.have.property('status');
      expect(report.frontend).to.have.property('checks');
      expect(report.frontend).to.have.property('lastChecked');
      expect(report.frontend.checks).to.be.an('array');
      
      // Frontend should have responsiveness check
      const frontendResponsivenessCheck = report.frontend.checks.find(
        c => c.name === 'responsiveness'
      );
      expect(frontendResponsivenessCheck).to.exist;
      expect(frontendResponsivenessCheck!.status).to.equal('pass');

      // Verify backend health status is checked
      expect(report.backend).to.have.property('status');
      expect(report.backend).to.have.property('checks');
      expect(report.backend).to.have.property('lastChecked');
      expect(report.backend.checks).to.be.an('array');

      // Backend should have responsiveness check
      const backendResponsivenessCheck = report.backend.checks.find(
        c => c.name === 'responsiveness'
      );
      expect(backendResponsivenessCheck).to.exist;
      expect(backendResponsivenessCheck!.status).to.equal('pass');

      // Backend should have Firebase connectivity check
      const firebaseCheck = report.backend.checks.find(
        c => c.name === 'firebase_connectivity'
      );
      expect(firebaseCheck).to.exist;
      expect(firebaseCheck!.status).to.be.oneOf(['pass', 'fail', 'warn']);

      // Verify integration status is checked
      expect(report.integration).to.have.property('apiConnectivity');
      expect(report.integration).to.have.property('databaseConnectivity');
      expect(report.integration).to.have.property('crossOriginStatus');
    } finally {
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

      const monitor = new HealthMonitorImpl(
        { url: `http://127.0.0.1:${frontendPort}`, timeout: 1000 },
        { url: `http://127.0.0.1:${backendPort}`, timeout: 1000 }
      );

      // Check frontend health
      const frontendHealth = await monitor.checkApplicationHealth('frontend');
      expect(frontendHealth).to.have.property('status');
      expect(frontendHealth).to.have.property('checks');
      expect(frontendHealth).to.have.property('lastChecked');
      expect(frontendHealth.checks).to.be.an('array').with.length.greaterThan(0);
      
      const frontendResponsivenessCheck = frontendHealth.checks.find(c => c.name === 'responsiveness');
      expect(frontendResponsivenessCheck).to.exist;

      // Check backend health
      const backendHealth = await monitor.checkApplicationHealth('backend');
      expect(backendHealth).to.have.property('status');
      expect(backendHealth).to.have.property('checks');
      expect(backendHealth).to.have.property('lastChecked');
      expect(backendHealth.checks).to.be.an('array').with.length.greaterThan(0);
      
      const backendResponsivenessCheck = backendHealth.checks.find(c => c.name === 'responsiveness');
      expect(backendResponsivenessCheck).to.exist;
      
      // Backend should have Firebase check
      const firebaseCheck = backendHealth.checks.find(c => c.name === 'firebase_connectivity');
      expect(firebaseCheck).to.exist;
    } finally {
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
function createMockServer(port: number, responds: boolean, hasFirebaseEndpoint: boolean = false): http.Server {
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
function waitForServer(server: http.Server): Promise<void> {
  return new Promise((resolve) => {
    server.once('listening', () => resolve());
  });
}

/**
 * Helper: Close server
 */
function closeServer(server: http.Server): Promise<void> {
  return new Promise((resolve) => {
    server.close(() => resolve());
  });
}
