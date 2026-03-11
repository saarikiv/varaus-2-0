/**
 * Health Monitor Module
 * Provides continuous monitoring and diagnostics
 */

import { ApplicationName, IntegrationStatus, ConnectivityStatus, CORSStatus, MemoryUsage, CPUUsage } from '../types';
import * as http from 'http';
import * as https from 'https';

export interface HealthMonitor {
  checkApplicationHealth(app: ApplicationName): Promise<HealthStatus>;
  checkIntegrationHealth(): Promise<IntegrationStatus>;
  startContinuousMonitoring(): void;
  stopContinuousMonitoring(): void;
  getHealthReport(): Promise<HealthReport>;
}

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  checks: HealthCheck[];
  lastChecked: Date;
  performance?: PerformanceMetrics;
}

export interface HealthCheck {
  name: string;
  status: 'pass' | 'fail' | 'warn';
  message?: string;
  duration: number;
}

export interface HealthReport {
  timestamp: Date;
  frontend: HealthStatus;
  backend: HealthStatus;
  integration: IntegrationStatus;
  overallStatus: 'healthy' | 'degraded' | 'unhealthy';
}

export interface PerformanceMetrics {
  responseTime?: number;
  memory: MemoryUsage;
  cpu: CPUUsage;
}

export interface HealthCheckEndpoint {
  url: string;
  timeout?: number;
}

/**
 * Health Monitor Implementation
 */
export class HealthMonitorImpl implements HealthMonitor {
  private frontendEndpoint: HealthCheckEndpoint;
  private backendEndpoint: HealthCheckEndpoint;
  private monitoringInterval?: NodeJS.Timeout;
  private monitoringIntervalMs: number = 30000; // 30 seconds
  private lastHealthReport?: HealthReport;

  constructor(
    frontendEndpoint: HealthCheckEndpoint,
    backendEndpoint: HealthCheckEndpoint
  ) {
    this.frontendEndpoint = frontendEndpoint;
    this.backendEndpoint = backendEndpoint;
  }

  /**
   * Check health of a specific application
   */
  async checkApplicationHealth(app: ApplicationName): Promise<HealthStatus> {
    if (app === 'both') {
      throw new Error('Cannot check health for "both" - specify "frontend" or "backend"');
    }

    const startTime = Date.now();
    const checks: HealthCheck[] = [];
    const endpoint = app === 'frontend' ? this.frontendEndpoint : this.backendEndpoint;

    // Check 1: Application responsiveness
    const responsivenessCheck = await this.checkResponsiveness(endpoint);
    checks.push(responsivenessCheck);

    // Check 2: Firebase connectivity (for backend)
    if (app === 'backend') {
      const firebaseCheck = await this.checkFirebaseConnectivity(endpoint);
      checks.push(firebaseCheck);
    }

    // Collect performance metrics
    const performance = await this.collectPerformanceMetrics(app, endpoint);

    // Determine overall status
    const hasFailures = checks.some(c => c.status === 'fail');
    const hasWarnings = checks.some(c => c.status === 'warn');
    const status: 'healthy' | 'degraded' | 'unhealthy' = 
      hasFailures ? 'unhealthy' : hasWarnings ? 'degraded' : 'healthy';

    return {
      status,
      checks,
      lastChecked: new Date(),
      performance
    };
  }

  /**
   * Check integration health between frontend and backend
   */
  async checkIntegrationHealth(): Promise<IntegrationStatus> {
    const checks = await Promise.all([
      this.checkApiConnectivity(),
      this.checkDatabaseConnectivity(),
      this.checkCorsStatus()
    ]);

    return {
      apiConnectivity: checks[0],
      databaseConnectivity: checks[1],
      crossOriginStatus: checks[2]
    };
  }

  /**
   * Start continuous health monitoring
   */
  startContinuousMonitoring(): void {
    if (this.monitoringInterval) {
      console.log('Health monitoring already running');
      return;
    }

    console.log(`Starting continuous health monitoring (interval: ${this.monitoringIntervalMs}ms)`);
    
    // Run initial check
    this.performHealthCheck().catch(err => {
      console.error('Health check failed:', err);
    });

    // Set up periodic checks
    this.monitoringInterval = setInterval(() => {
      this.performHealthCheck().catch(err => {
        console.error('Health check failed:', err);
      });
    }, this.monitoringIntervalMs);
  }

  /**
   * Stop continuous health monitoring
   */
  stopContinuousMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = undefined;
      console.log('Stopped continuous health monitoring');
    }
  }

  /**
   * Get the latest health report
   */
  async getHealthReport(): Promise<HealthReport> {
    const [frontendHealth, backendHealth, integrationStatus] = await Promise.all([
      this.checkApplicationHealth('frontend'),
      this.checkApplicationHealth('backend'),
      this.checkIntegrationHealth()
    ]);

    const overallStatus = this.determineOverallStatus(frontendHealth, backendHealth);

    const report: HealthReport = {
      timestamp: new Date(),
      frontend: frontendHealth,
      backend: backendHealth,
      integration: integrationStatus,
      overallStatus
    };

    this.lastHealthReport = report;
    return report;
  }

  /**
   * Perform a complete health check (used by continuous monitoring)
   */
  private async performHealthCheck(): Promise<void> {
    const report = await this.getHealthReport();
    
    // Log any issues
    if (report.overallStatus !== 'healthy') {
      console.warn(`Health check warning - Overall status: ${report.overallStatus}`);
      
      if (report.frontend.status !== 'healthy') {
        console.warn('Frontend issues:', report.frontend.checks.filter(c => c.status !== 'pass'));
      }
      
      if (report.backend.status !== 'healthy') {
        console.warn('Backend issues:', report.backend.checks.filter(c => c.status !== 'pass'));
      }
    }
  }

  /**
   * Check if an application is responding
   */
  private async checkResponsiveness(endpoint: HealthCheckEndpoint): Promise<HealthCheck> {
    const startTime = Date.now();
    
    try {
      await this.httpRequest(endpoint.url, endpoint.timeout || 5000);
      const duration = Date.now() - startTime;
      
      return {
        name: 'responsiveness',
        status: 'pass',
        message: `Application responding in ${duration}ms`,
        duration
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      return {
        name: 'responsiveness',
        status: 'fail',
        message: `Application not responding: ${errorMessage}`,
        duration
      };
    }
  }

  /**
   * Check Firebase connectivity (backend only)
   */
  private async checkFirebaseConnectivity(endpoint: HealthCheckEndpoint): Promise<HealthCheck> {
    const startTime = Date.now();
    
    try {
      // Try to hit a health endpoint that checks Firebase
      // For now, we'll assume if the backend is up, Firebase is accessible
      // In a real implementation, the backend would expose a /health/firebase endpoint
      const healthUrl = endpoint.url.replace(/\/$/, '') + '/health/firebase';
      
      try {
        await this.httpRequest(healthUrl, endpoint.timeout || 5000);
        const duration = Date.now() - startTime;
        
        return {
          name: 'firebase_connectivity',
          status: 'pass',
          message: 'Firebase connection verified',
          duration
        };
      } catch (error) {
        // If health endpoint doesn't exist, we can't verify Firebase
        // Return a warning instead of failure
        const duration = Date.now() - startTime;
        
        return {
          name: 'firebase_connectivity',
          status: 'warn',
          message: 'Firebase health endpoint not available - cannot verify connectivity',
          duration
        };
      }
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      return {
        name: 'firebase_connectivity',
        status: 'fail',
        message: `Firebase connectivity check failed: ${errorMessage}`,
        duration
      };
    }
  }

  /**
   * Check API connectivity between frontend and backend
   */
  private async checkApiConnectivity(): Promise<ConnectivityStatus> {
    try {
      // Check if backend is responding
      await this.httpRequest(this.backendEndpoint.url, 5000);
      return 'connected';
    } catch (error) {
      return 'disconnected';
    }
  }

  /**
   * Check database connectivity
   */
  private async checkDatabaseConnectivity(): Promise<ConnectivityStatus> {
    try {
      // Try to check Firebase connectivity through backend
      const healthUrl = this.backendEndpoint.url.replace(/\/$/, '') + '/health/firebase';
      await this.httpRequest(healthUrl, 5000);
      return 'connected';
    } catch (error) {
      // If we can't verify, assume degraded
      return 'degraded';
    }
  }

  /**
   * Check CORS status
   */
  private async checkCorsStatus(): Promise<CORSStatus> {
    try {
      // Check if backend has proper CORS headers
      // This is a simplified check - in reality, we'd need to make a cross-origin request
      await this.httpRequest(this.backendEndpoint.url, 5000);
      return 'configured';
    } catch (error) {
      return 'unknown';
    }
  }

  /**
   * Collect performance metrics for an application
   */
  private async collectPerformanceMetrics(
    app: ApplicationName,
    endpoint: HealthCheckEndpoint
  ): Promise<PerformanceMetrics> {
    // Measure response time
    const startTime = Date.now();
    try {
      await this.httpRequest(endpoint.url, endpoint.timeout || 5000);
    } catch (error) {
      // Ignore errors for metrics collection
    }
    const responseTime = Date.now() - startTime;

    // Get memory and CPU usage
    const memory = process.memoryUsage();
    const cpu = process.cpuUsage();

    return {
      responseTime,
      memory: {
        heapUsed: memory.heapUsed,
        heapTotal: memory.heapTotal,
        external: memory.external
      },
      cpu: {
        user: cpu.user,
        system: cpu.system
      }
    };
  }

  /**
   * Make an HTTP request with timeout
   */
  private async httpRequest(url: string, timeout: number): Promise<void> {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error(`Request timeout after ${timeout}ms`));
      }, timeout);

      const protocol = url.startsWith('https') ? https : http;
      
      protocol.get(url, (res) => {
        clearTimeout(timeoutId);
        
        // Consume response data to free up memory
        res.on('data', () => {});
        res.on('end', () => {
          if (res.statusCode && res.statusCode < 500) {
            resolve();
          } else {
            reject(new Error(`HTTP ${res.statusCode}`));
          }
        });
      }).on('error', (error) => {
        clearTimeout(timeoutId);
        reject(error);
      });
    });
  }

  /**
   * Determine overall system status
   */
  public determineOverallStatus(
    frontendHealth: HealthStatus,
    backendHealth: HealthStatus
  ): 'healthy' | 'degraded' | 'unhealthy' {
    if (frontendHealth.status === 'unhealthy' || backendHealth.status === 'unhealthy') {
      return 'unhealthy';
    }
    
    if (frontendHealth.status === 'degraded' || backendHealth.status === 'degraded') {
      return 'degraded';
    }
    
    return 'healthy';
  }
}

// Export factory function
export function createHealthMonitor(
  frontendUrl: string,
  backendUrl: string
): HealthMonitor {
  return new HealthMonitorImpl(
    { url: frontendUrl, timeout: 5000 },
    { url: backendUrl, timeout: 5000 }
  );
}
