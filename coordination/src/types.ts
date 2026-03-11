/**
 * Shared Types
 * Common types used across all coordination modules
 */

// ─── Type Aliases ────────────────────────────────────────────────────────────

export type Environment = 'development' | 'staging' | 'production';
export type ApplicationName = 'frontend' | 'backend' | 'both';
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';
export type ProcessStatus = 'starting' | 'running' | 'stopping' | 'stopped' | 'error';
export type ConnectivityStatus = 'connected' | 'disconnected' | 'degraded';
export type CORSStatus = 'configured' | 'misconfigured' | 'unknown';

// ─── Core Interfaces ─────────────────────────────────────────────────────────

export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  databaseURL: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

export interface LogEntry {
  timestamp: Date;
  level: LogLevel;
  application?: ApplicationName;
  message: string;
  correlationId?: string;
}

export interface LogStream {
  entries: LogEntry[];
}

export interface MemoryUsage {
  heapUsed: number;
  heapTotal: number;
  external: number;
}

export interface CPUUsage {
  user: number;
  system: number;
}

export interface IntegrationStatus {
  apiConnectivity: ConnectivityStatus;
  databaseConnectivity: ConnectivityStatus;
  crossOriginStatus: CORSStatus;
}

// ─── Configuration Models ────────────────────────────────────────────────────

export interface SystemConfig {
  frontend: FrontendConfig;
  backend: BackendConfig;
  shared: SharedConfig;
}

export interface FrontendConfig {
  apiEndpoint: string;
  firebaseConfig: FirebaseConfig;
  buildOutputPath: string;
  devServerPort: number;
}

export interface BackendConfig {
  port: number;
  firebaseConfig: FirebaseConfig;
  corsOrigins: string[];
  logLevel: LogLevel;
}

export interface SharedConfig {
  environment: Environment;
  projectRoot: string;
}

// ─── Process Models ──────────────────────────────────────────────────────────

export interface ProcessHandle {
  pid: number;
  port?: number;
  status: ProcessStatus;
  logs: LogEntry[];
}

export interface ProcessConfig {
  port?: number;
  apiEndpoint?: string;
  firebaseConfig?: any;
  environment?: string;
  projectRoot?: string;
}

export interface MonitorConfig {
  autoRestart: boolean;
  maxRestarts: number;
  restartDelay: number;
  watchFiles: boolean;
}

// ─── Build Models ────────────────────────────────────────────────────────────

export interface BuildAllResult {
  success: boolean;
  backend: ApplicationBuildResult;
  frontend: ApplicationBuildResult;
  totalDuration: number;
}

export interface ApplicationBuildResult {
  success: boolean;
  application: ApplicationName;
  artifacts: BuildArtifactInfo[];
  duration: number;
  errors?: BuildErrorInfo[];
  output: string;
}

export interface BuildErrorInfo {
  application: ApplicationName;
  phase: string;
  message: string;
  file?: string;
  line?: number;
  column?: number;
}

export interface BuildArtifactInfo {
  path: string;
  size: number;
}

// ─── Test Models ─────────────────────────────────────────────────────────────

export interface TestAllResult {
  success: boolean;
  backend: ApplicationTestResult;
  frontend: ApplicationTestResult;
  totalDuration: number;
}

export interface ApplicationTestResult {
  success: boolean;
  application: ApplicationName;
  testsPassed: number;
  testsFailed: number;
  testsSkipped: number;
  duration: number;
  failures: TestFailureInfo[];
  output: string;
}

export interface TestFailureInfo {
  testName: string;
  errorMessage: string;
}

// ─── Health Models ───────────────────────────────────────────────────────────

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

export interface PerformanceMetrics {
  responseTime?: number;
  memory: MemoryUsage;
  cpu: CPUUsage;
}

// ─── Flow Tracing Models ─────────────────────────────────────────────────────

export interface FlowTrace {
  correlationId: string;
  startTime: Date;
  endTime?: Date;
  totalDuration?: number;
  stages: FlowStage[];
  timingBreakdown: TimingBreakdown;
}

export interface FlowStage {
  name: string;
  application: ApplicationName;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  status: 'pending' | 'completed' | 'failed';
  error?: string;
  metadata?: Record<string, any>;
}

export interface TimingBreakdown {
  frontendProcessing: number;
  networkLatency: number;
  backendProcessing: number;
  databaseOperations: number;
  totalRoundTrip: number;
}

// ─── Deployment Models ───────────────────────────────────────────────────────

export interface DeploymentResult {
  success: boolean;
  target: Environment;
  timestamp: Date;
  healthCheckStatus?: string;
}
