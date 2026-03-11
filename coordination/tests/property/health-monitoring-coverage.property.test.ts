/**
 * Property-Based Tests for Health Monitoring
 * Feature: coordination
 * Validates: Requirements 11.6, 11.7, 11.8
 */

import { expect } from 'chai';
import * as fc from 'fast-check';
import { HealthMonitorImpl, HealthStatus } from '../../src/health';

// ─── Shared Arbitraries ──────────────────────────────────────────────────────

const healthStatusValues: Array<'healthy' | 'degraded' | 'unhealthy'> = ['healthy', 'degraded', 'unhealthy'];

const healthStatusArb: fc.Arbitrary<'healthy' | 'degraded' | 'unhealthy'> =
  fc.constantFrom<'healthy' | 'degraded' | 'unhealthy'>(...healthStatusValues);

/**
 * Generate a HealthStatus object with a given status value.
 */
function makeHealthStatus(status: 'healthy' | 'degraded' | 'unhealthy'): HealthStatus {
  return {
    status,
    checks: [],
    lastChecked: new Date(),
  };
}

// ─── Property 21: Overall health status determination ────────────────────────

describe('Feature: coordination, Property 21: Overall health status determination', () => {
  /**
   * Validates: Requirements 11.6, 11.7, 11.8
   *
   * For any combination of frontend and backend health statuses, the overall
   * status should be "unhealthy" if either is "unhealthy", "degraded" if either
   * is "degraded" and neither is "unhealthy", and "healthy" otherwise.
   */
  it('should return the correct overall status for any combination of frontend and backend statuses', () => {
    const monitor = new HealthMonitorImpl(
      { url: 'http://localhost:0', timeout: 1000 },
      { url: 'http://localhost:0', timeout: 1000 }
    );

    fc.assert(
      fc.property(
        healthStatusArb,
        healthStatusArb,
        (frontendStatus, backendStatus) => {
          const frontendHealth = makeHealthStatus(frontendStatus);
          const backendHealth = makeHealthStatus(backendStatus);

          const result = monitor.determineOverallStatus(frontendHealth, backendHealth);

          // Compute expected result
          let expected: 'healthy' | 'degraded' | 'unhealthy';
          if (frontendStatus === 'unhealthy' || backendStatus === 'unhealthy') {
            expected = 'unhealthy';
          } else if (frontendStatus === 'degraded' || backendStatus === 'degraded') {
            expected = 'degraded';
          } else {
            expected = 'healthy';
          }

          expect(result).to.equal(expected);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should always return "unhealthy" when either application is unhealthy', () => {
    const monitor = new HealthMonitorImpl(
      { url: 'http://localhost:0', timeout: 1000 },
      { url: 'http://localhost:0', timeout: 1000 }
    );

    fc.assert(
      fc.property(
        healthStatusArb,
        (otherStatus) => {
          // Frontend unhealthy
          const result1 = monitor.determineOverallStatus(
            makeHealthStatus('unhealthy'),
            makeHealthStatus(otherStatus)
          );
          expect(result1).to.equal('unhealthy');

          // Backend unhealthy
          const result2 = monitor.determineOverallStatus(
            makeHealthStatus(otherStatus),
            makeHealthStatus('unhealthy')
          );
          expect(result2).to.equal('unhealthy');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should return "degraded" when either is degraded and neither is unhealthy', () => {
    const monitor = new HealthMonitorImpl(
      { url: 'http://localhost:0', timeout: 1000 },
      { url: 'http://localhost:0', timeout: 1000 }
    );

    const nonUnhealthyArb = fc.constantFrom<'healthy' | 'degraded'>('healthy', 'degraded');

    fc.assert(
      fc.property(
        nonUnhealthyArb,
        (otherStatus) => {
          // Frontend degraded, backend non-unhealthy
          const result1 = monitor.determineOverallStatus(
            makeHealthStatus('degraded'),
            makeHealthStatus(otherStatus)
          );
          expect(result1).to.equal('degraded');

          // Backend degraded, frontend non-unhealthy
          const result2 = monitor.determineOverallStatus(
            makeHealthStatus(otherStatus),
            makeHealthStatus('degraded')
          );
          expect(result2).to.equal('degraded');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should return "healthy" only when both are healthy', () => {
    const monitor = new HealthMonitorImpl(
      { url: 'http://localhost:0', timeout: 1000 },
      { url: 'http://localhost:0', timeout: 1000 }
    );

    const result = monitor.determineOverallStatus(
      makeHealthStatus('healthy'),
      makeHealthStatus('healthy')
    );
    expect(result).to.equal('healthy');
  });
});
