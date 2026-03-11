/**
 * Health Monitor Module
 * Provides continuous monitoring and diagnostics
 */
import { ApplicationName, IntegrationStatus, MemoryUsage, CPUUsage } from '../types';
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
export declare class HealthMonitorImpl implements HealthMonitor {
    private frontendEndpoint;
    private backendEndpoint;
    private monitoringInterval?;
    private monitoringIntervalMs;
    private lastHealthReport?;
    constructor(frontendEndpoint: HealthCheckEndpoint, backendEndpoint: HealthCheckEndpoint);
    /**
     * Check health of a specific application
     */
    checkApplicationHealth(app: ApplicationName): Promise<HealthStatus>;
    /**
     * Check integration health between frontend and backend
     */
    checkIntegrationHealth(): Promise<IntegrationStatus>;
    /**
     * Start continuous health monitoring
     */
    startContinuousMonitoring(): void;
    /**
     * Stop continuous health monitoring
     */
    stopContinuousMonitoring(): void;
    /**
     * Get the latest health report
     */
    getHealthReport(): Promise<HealthReport>;
    /**
     * Perform a complete health check (used by continuous monitoring)
     */
    private performHealthCheck;
    /**
     * Check if an application is responding
     */
    private checkResponsiveness;
    /**
     * Check Firebase connectivity (backend only)
     */
    private checkFirebaseConnectivity;
    /**
     * Check API connectivity between frontend and backend
     */
    private checkApiConnectivity;
    /**
     * Check database connectivity
     */
    private checkDatabaseConnectivity;
    /**
     * Check CORS status
     */
    private checkCorsStatus;
    /**
     * Collect performance metrics for an application
     */
    private collectPerformanceMetrics;
    /**
     * Make an HTTP request with timeout
     */
    private httpRequest;
    /**
     * Determine overall system status
     */
    determineOverallStatus(frontendHealth: HealthStatus, backendHealth: HealthStatus): 'healthy' | 'degraded' | 'unhealthy';
}
export declare function createHealthMonitor(frontendUrl: string, backendUrl: string): HealthMonitor;
