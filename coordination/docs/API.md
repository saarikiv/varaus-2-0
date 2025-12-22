# API Documentation

This document provides detailed API reference for the Varaus Full-Stack Coordination System.

## Table of Contents

- [Coordination CLI](#coordination-cli)
- [Configuration Manager](#configuration-manager)
- [Process Manager](#process-manager)
- [Build Coordinator](#build-coordinator)
- [Test Coordinator](#test-coordinator)
- [Health Monitor](#health-monitor)
- [Types and Interfaces](#types-and-interfaces)

## Coordination CLI

The main interface for managing both applications.

### CoordinationCLI Interface

```typescript
interface CoordinationCLI {
  start(environment: Environment): Promise<void>;
  build(environment: Environment): Promise<BuildResult>;
  test(testType: TestType): Promise<TestResult>;
  deploy(target: DeploymentTarget): Promise<DeploymentResult>;
  status(): Promise<SystemStatus>;
  logs(application?: ApplicationName): Promise<LogStream>;
}
```

### start(environment)

Starts both frontend and backend applications in the specified environment.

**Parameters:**
- `environment: Environment` - The target environment ('development', 'staging', or 'production')

**Returns:** `Promise<void>`

**Behavior:**
1. Loads and validates configuration for the environment
2. Starts backend application first
3. Verifies Firebase connectivity
4. Starts frontend application
5. Verifies API connectivity
6. Enables hot reload for both applications
7. Sets up graceful shutdown handlers

**Throws:**
- Configuration validation errors
- Port already in use errors
- Firebase connectivity errors
- Application startup errors

**Example:**
```typescript
import { coordinationCLI } from './cli';

await coordinationCLI.start('development');
```

### build(environment)

Builds both applications for the specified environment.

**Parameters:**
- `environment: Environment` - The target environment

**Returns:** `Promise<BuildResult>`

**BuildResult:**
```typescript
interface BuildResult {
  success: boolean;
  artifacts: BuildArtifact[];
  duration: number;
  errors?: BuildError[];
}
```

**Behavior:**
1. Loads configuration for the environment
2. Builds backend application first
3. Builds frontend application
4. Collects build artifacts
5. Reports any errors

**Example:**
```typescript
const result = await coordinationCLI.build('production');
if (result.success) {
  console.log(`Build completed in ${result.duration}ms`);
  console.log(`Generated ${result.artifacts.length} artifacts`);
}
```

### test(testType)

Runs tests for both applications.

**Parameters:**
- `testType: TestType` - Type of tests to run ('unit', 'integration', 'e2e', or 'all')

**Returns:** `Promise<TestResult>`

**TestResult:**
```typescript
interface TestResult {
  success: boolean;
  passed: number;
  failed: number;
  duration: number;
  failures?: TestFailure[];
}
```

**Example:**
```typescript
const result = await coordinationCLI.test('unit');
console.log(`${result.passed} tests passed, ${result.failed} tests failed`);
```

### deploy(target)

Deploys both applications to staging or production.

**Parameters:**
- `target: DeploymentTarget` - Deployment target ('staging' or 'production')

**Returns:** `Promise<DeploymentResult>`

**DeploymentResult:**
```typescript
interface DeploymentResult {
  success: boolean;
  environment: Environment;
  timestamp: Date;
  healthChecksPassed: boolean;
}
```

**Behavior:**
1. Loads configuration for target environment
2. Builds both applications
3. Runs tests
4. Deploys applications (platform-specific)
5. Runs health checks
6. Reports deployment status

**Example:**
```typescript
const result = await coordinationCLI.deploy('staging');
if (result.success && result.healthChecksPassed) {
  console.log('Deployment successful with all health checks passing');
}
```

### status()

Gets current system status.

**Returns:** `Promise<SystemStatus>`

**SystemStatus:**
```typescript
interface SystemStatus {
  frontend: ApplicationStatus;
  backend: ApplicationStatus;
  integration: IntegrationStatus;
  environment: Environment;
  uptime: number;
}
```

**Example:**
```typescript
const status = await coordinationCLI.status();
console.log(`Frontend: ${status.frontend.status}`);
console.log(`Backend: ${status.backend.status}`);
console.log(`Uptime: ${status.uptime}ms`);
```

### logs(application?)

Gets logs from applications.

**Parameters:**
- `application?: ApplicationName` - Optional application filter ('frontend', 'backend', or 'both')

**Returns:** `Promise<LogStream>`

**Example:**
```typescript
const logs = await coordinationCLI.logs('backend');
logs.entries.forEach(entry => {
  console.log(`[${entry.timestamp}] ${entry.message}`);
});
```

## Configuration Manager

Manages environment-specific configurations.

### ConfigManager Class

```typescript
class ConfigManager {
  constructor(projectRoot: string);
  loadConfig(environment: Environment): Promise<SystemConfig>;
  validateConfig(config: SystemConfig): ValidationResult;
  updateConfig(updates: Partial<SystemConfig>): Promise<void>;
  getApplicationConfig(app: ApplicationName, env: Environment): ApplicationConfig;
}
```

### loadConfig(environment)

Loads configuration for the specified environment.

**Parameters:**
- `environment: Environment` - Target environment

**Returns:** `Promise<SystemConfig>`

**SystemConfig:**
```typescript
interface SystemConfig {
  frontend: FrontendConfig;
  backend: BackendConfig;
  shared: SharedConfig;
}

interface FrontendConfig {
  apiEndpoint: string;
  firebaseConfig: FirebaseConfig;
  buildOutputPath: string;
  devServerPort: number;
}

interface BackendConfig {
  port: number;
  firebaseConfig: FirebaseConfig;
  corsOrigins: string[];
  logLevel: LogLevel;
}

interface SharedConfig {
  environment: Environment;
  projectRoot: string;
}
```

**Behavior:**
1. Reads environment variables
2. Validates required variables are present
3. Constructs configuration objects
4. Validates configuration compatibility
5. Returns complete system configuration

**Throws:**
- Missing environment variable errors
- Configuration validation errors

**Example:**
```typescript
import { ConfigManager } from './config';

const configManager = new ConfigManager(process.cwd());
const config = await configManager.loadConfig('development');

console.log(`Backend port: ${config.backend.port}`);
console.log(`Frontend API endpoint: ${config.frontend.apiEndpoint}`);
```

### validateConfig(config)

Validates a configuration object.

**Parameters:**
- `config: SystemConfig` - Configuration to validate

**Returns:** `ValidationResult`

**ValidationResult:**
```typescript
interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

interface ValidationError {
  field: string;
  message: string;
}
```

**Example:**
```typescript
const result = configManager.validateConfig(config);
if (!result.valid) {
  result.errors.forEach(error => {
    console.error(`${error.field}: ${error.message}`);
  });
}
```

## Process Manager

Manages application lifecycle.

### ProcessManager Interface

```typescript
interface ProcessManager {
  startApplication(app: ApplicationName, config: ApplicationConfig): Promise<ProcessHandle>;
  stopApplication(app: ApplicationName): Promise<void>;
  restartApplication(app: ApplicationName): Promise<void>;
  getProcessStatus(app: ApplicationName): ProcessStatus;
  watchForChanges(app: ApplicationName, callback: ChangeCallback): void;
}
```

### startApplication(app, config)

Starts an application with the given configuration.

**Parameters:**
- `app: ApplicationName` - Application to start ('frontend', 'backend', or 'both')
- `config: ApplicationConfig` - Application-specific configuration

**Returns:** `Promise<ProcessHandle>`

**ProcessHandle:**
```typescript
interface ProcessHandle {
  pid: number;
  port?: number;
  status: ProcessStatus;
  logs: LogStream;
}

type ProcessStatus = 'starting' | 'running' | 'stopping' | 'stopped' | 'error';
```

**Example:**
```typescript
import { ProcessManagerImpl } from './process';

const processManager = new ProcessManagerImpl(process.cwd());
const handle = await processManager.startApplication('backend', {
  port: 3000,
  firebaseConfig: config.backend.firebaseConfig,
  environment: 'development',
  projectRoot: process.cwd()
});

console.log(`Backend started with PID ${handle.pid}`);
```

### stopApplication(app)

Stops a running application.

**Parameters:**
- `app: ApplicationName` - Application to stop

**Returns:** `Promise<void>`

**Example:**
```typescript
await processManager.stopApplication('frontend');
```

### restartApplication(app)

Restarts a running application.

**Parameters:**
- `app: ApplicationName` - Application to restart

**Returns:** `Promise<void>`

**Example:**
```typescript
await processManager.restartApplication('backend');
```

### getProcessStatus(app)

Gets the current status of an application.

**Parameters:**
- `app: ApplicationName` - Application to check

**Returns:** `ProcessStatus`

**Example:**
```typescript
const status = processManager.getProcessStatus('frontend');
console.log(`Frontend status: ${status}`);
```

### watchForChanges(app, callback)

Watches for file changes and triggers callback.

**Parameters:**
- `app: ApplicationName` - Application to watch
- `callback: ChangeCallback` - Function to call when changes detected

**ChangeCallback:**
```typescript
type ChangeCallback = (changedFiles: string[]) => void;
```

**Example:**
```typescript
processManager.watchForChanges('backend', async (files) => {
  console.log(`Files changed: ${files.join(', ')}`);
  await processManager.restartApplication('backend');
});
```

## Build Coordinator

Coordinates build processes.

### BuildCoordinator Interface

```typescript
interface BuildCoordinator {
  buildAll(config: SystemConfig): Promise<CompleteBuildResult>;
  buildApplication(app: ApplicationName, config: ApplicationConfig): Promise<ApplicationBuildResult>;
}
```

### buildAll(config)

Builds all applications in the correct order.

**Parameters:**
- `config: SystemConfig` - System configuration

**Returns:** `Promise<CompleteBuildResult>`

**CompleteBuildResult:**
```typescript
interface CompleteBuildResult {
  success: boolean;
  backend: ApplicationBuildResult;
  frontend: ApplicationBuildResult;
  totalDuration: number;
}

interface ApplicationBuildResult {
  success: boolean;
  artifacts: BuildArtifact[];
  duration: number;
  errors?: BuildError[];
}
```

**Example:**
```typescript
import { BuildCoordinatorImpl } from './build';

const buildCoordinator = new BuildCoordinatorImpl(process.cwd());
const result = await buildCoordinator.buildAll(config);

if (result.success) {
  console.log(`Build completed in ${result.totalDuration}ms`);
}
```

## Test Coordinator

Coordinates test execution.

### TestCoordinator Interface

```typescript
interface TestCoordinator {
  runAllTests(): Promise<CompleteTestResult>;
  runApplicationTests(app: ApplicationName): Promise<ApplicationTestResult>;
}
```

### runAllTests()

Runs tests for all applications.

**Returns:** `Promise<CompleteTestResult>`

**CompleteTestResult:**
```typescript
interface CompleteTestResult {
  success: boolean;
  backend: ApplicationTestResult;
  frontend: ApplicationTestResult;
  totalDuration: number;
}

interface ApplicationTestResult {
  application: ApplicationName;
  testsPassed: number;
  testsFailed: number;
  duration: number;
  failures: TestFailure[];
}
```

**Example:**
```typescript
import { TestCoordinatorImpl } from './test';

const testCoordinator = new TestCoordinatorImpl(process.cwd());
const result = await testCoordinator.runAllTests();

console.log(`Total: ${result.backend.testsPassed + result.frontend.testsPassed} passed`);
```

## Health Monitor

Monitors application health.

### HealthMonitor Interface

```typescript
interface HealthMonitor {
  checkApplicationHealth(app: ApplicationName): Promise<HealthStatus>;
  checkIntegrationHealth(): Promise<IntegrationStatus>;
  startContinuousMonitoring(): void;
  stopContinuousMonitoring(): void;
  getHealthReport(): Promise<HealthReport>;
}
```

### checkApplicationHealth(app)

Checks health of a specific application.

**Parameters:**
- `app: ApplicationName` - Application to check

**Returns:** `Promise<HealthStatus>`

**HealthStatus:**
```typescript
interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  checks: HealthCheck[];
  lastChecked: Date;
}

interface HealthCheck {
  name: string;
  status: 'pass' | 'fail' | 'warn';
  message?: string;
  duration: number;
}
```

**Example:**
```typescript
import { createHealthMonitor } from './health';

const healthMonitor = createHealthMonitor(
  'http://localhost:8080',
  'http://localhost:3000'
);

const health = await healthMonitor.checkApplicationHealth('backend');
console.log(`Backend health: ${health.status}`);
health.checks.forEach(check => {
  console.log(`  ${check.name}: ${check.status}`);
});
```

### checkIntegrationHealth()

Checks integration between applications.

**Returns:** `Promise<IntegrationStatus>`

**IntegrationStatus:**
```typescript
interface IntegrationStatus {
  apiConnectivity: ConnectivityStatus;
  databaseConnectivity: ConnectivityStatus;
  crossOriginStatus: CORSStatus;
}

type ConnectivityStatus = 'connected' | 'disconnected' | 'degraded';
type CORSStatus = 'configured' | 'misconfigured' | 'unknown';
```

**Example:**
```typescript
const integration = await healthMonitor.checkIntegrationHealth();
console.log(`API connectivity: ${integration.apiConnectivity}`);
console.log(`Database connectivity: ${integration.databaseConnectivity}`);
```

## Types and Interfaces

### Core Types

```typescript
type Environment = 'development' | 'staging' | 'production';
type ApplicationName = 'frontend' | 'backend' | 'both';
type LogLevel = 'debug' | 'info' | 'warn' | 'error';
```

### Firebase Configuration

```typescript
interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  databaseURL: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}
```

### Application Status

```typescript
interface ApplicationStatus {
  status: ProcessStatus;
  port?: number;
  pid?: number;
  memory: MemoryUsage;
  cpu: CPUUsage;
  lastRestart?: Date;
}

interface MemoryUsage {
  heapUsed: number;
  heapTotal: number;
  external: number;
}

interface CPUUsage {
  user: number;
  system: number;
}
```

### Log Stream

```typescript
interface LogStream {
  entries: LogEntry[];
}

interface LogEntry {
  timestamp: Date;
  level: LogLevel;
  application: ApplicationName;
  message: string;
  correlationId?: string;
}
```

## Error Handling

All async methods may throw errors. Common error types:

### ConfigurationError

Thrown when configuration is invalid or missing.

```typescript
class ConfigurationError extends Error {
  constructor(message: string, public field?: string);
}
```

### ProcessError

Thrown when process operations fail.

```typescript
class ProcessError extends Error {
  constructor(message: string, public application: ApplicationName);
}
```

### BuildError

Thrown when build operations fail.

```typescript
class BuildError extends Error {
  constructor(
    message: string,
    public application: ApplicationName,
    public file?: string,
    public line?: number
  );
}
```

## Usage Examples

### Complete Startup Flow

```typescript
import { CoordinationCLIImpl } from './cli';

async function startDevelopment() {
  const cli = new CoordinationCLIImpl();
  
  try {
    // Start both applications
    await cli.start('development');
    
    // Check status
    const status = await cli.status();
    console.log('System started:', status);
    
    // Monitor health
    setInterval(async () => {
      const currentStatus = await cli.status();
      if (currentStatus.backend.status !== 'running') {
        console.error('Backend is not running!');
      }
    }, 30000);  // Check every 30 seconds
    
  } catch (error) {
    console.error('Failed to start:', error);
    process.exit(1);
  }
}

startDevelopment();
```

### Build and Deploy Flow

```typescript
async function deployToProduction() {
  const cli = new CoordinationCLIImpl();
  
  try {
    // Build for production
    console.log('Building for production...');
    const buildResult = await cli.build('production');
    
    if (!buildResult.success) {
      console.error('Build failed:', buildResult.errors);
      return;
    }
    
    // Run tests
    console.log('Running tests...');
    const testResult = await cli.test('all');
    
    if (!testResult.success) {
      console.error('Tests failed:', testResult.failures);
      return;
    }
    
    // Deploy
    console.log('Deploying to production...');
    const deployResult = await cli.deploy('production');
    
    if (deployResult.success && deployResult.healthChecksPassed) {
      console.log('Deployment successful!');
    } else {
      console.error('Deployment failed or health checks did not pass');
    }
    
  } catch (error) {
    console.error('Deployment process failed:', error);
  }
}

deployToProduction();
```
