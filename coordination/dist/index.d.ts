/**
 * Varaus Full-Stack Coordination System
 * Main entry point for the coordination system
 */
export * from './types';
export { coordinationCLI, CoordinationCLIImpl } from './cli';
export type { CoordinationCLI, DeploymentTarget, BuildResult, BuildArtifact, BuildError, TestResult, TestFailure, SystemStatus, ApplicationStatus } from './cli';
export { ConfigManager, configManager, configSchema, validateConfigSchema, isValidEnvironment, isValidFirebaseConfig, isValidFrontendConfig, isValidBackendConfig, isValidSystemConfig } from './config';
export type { ConfigurationManager, ApplicationConfig, ValidationResult, ValidationError, ConfigSchema } from './config';
export { ProcessManagerImpl, ManagedProcess, processManager } from './process';
export type { ProcessManager, ChangeCallback, ChangeEvent } from './process';
export { HealthMonitorImpl, createHealthMonitor } from './health';
export type { HealthMonitor, HealthStatus, HealthReport, HealthCheckEndpoint } from './health';
export * from './logging';
export { BuildCoordinatorImpl, buildCoordinator } from './build';
export type { BuildCoordinator } from './build';
export { TestCoordinatorImpl, testCoordinator } from './test';
export type { TestCoordinator, TestType } from './test';
