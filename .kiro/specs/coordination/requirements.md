# Requirements Document - Coordination System

## Introduction

The Coordination System is a TypeScript-based CLI tool that orchestrates the Varaus sauna reservation frontend and backend applications as a single unit. It provides environment-specific configuration, coordinated process management, build orchestration, test execution, health monitoring, unified logging with request tracing, and deployment with verification.

## Glossary

- **Coordination_System**: The TypeScript-based CLI tool that orchestrates the frontend and backend applications as a single unit.
- **Config_Manager**: The module responsible for loading, validating, and managing environment-specific configuration for both applications.
- **Process_Manager**: The module responsible for starting, stopping, restarting, and monitoring operating system processes for both applications.
- **Build_Coordinator**: The module responsible for orchestrating the build process for both applications in the correct dependency order.
- **Test_Coordinator**: The module responsible for running tests across both applications independently and providing unified reporting.
- **Health_Monitor**: The module responsible for continuously checking application responsiveness, Firebase connectivity, and integration health.
- **Unified_Logger**: The module responsible for capturing, correlating, and outputting log entries from both applications using correlation IDs.
- **Flow_Tracer**: The module responsible for tracking complete request flows from frontend through backend with timing breakdowns.
- **Process_Monitor**: The module responsible for detecting application crashes and file changes, and triggering automatic restarts.
- **Application_Coordinator**: The module responsible for coordinating the startup sequence of both applications with connectivity verification between each step.
- **Dependency_Checker**: The module responsible for verifying that shared dependencies between frontend and backend have compatible versions.
- **Version_Checker**: The module responsible for verifying Node.js version compatibility for both applications.
- **Environment**: One of three deployment targets: development, staging, or production.
- **Correlation_ID**: A UUID used to trace a single request across frontend and backend log entries.
- **Firebase_Config**: The set of seven Firebase credential fields (apiKey, authDomain, databaseURL, projectId, storageBucket, messagingSenderId, appId) required by both applications.

## Requirements

### Requirement 1: CLI Command Interface

**User Story:** As a developer, I want a single command-line interface to manage both applications, so that I do not need to operate each application separately.

#### Acceptance Criteria

1. THE Coordination_System SHALL expose the commands: start, build, test, status, logs, deploy, and help.
2. WHEN an unknown command is provided, THE Coordination_System SHALL print an error message identifying the unknown command and exit with a non-zero exit code.
3. WHEN the help command is invoked, THE Coordination_System SHALL display usage information listing all available commands, their arguments, and relevant environment variables.
4. WHEN no command is provided, THE Coordination_System SHALL display the help information.
5. WHEN a command fails with an error, THE Coordination_System SHALL print the error message to standard error and exit with a non-zero exit code.

### Requirement 2: Environment Configuration Management

**User Story:** As a developer, I want environment-specific configuration loaded and validated automatically, so that both applications always run with consistent and correct settings.

#### Acceptance Criteria

1. THE Config_Manager SHALL support three environments: development, staging, and production.
2. WHEN an invalid environment name is provided, THE Coordination_System SHALL print an error listing the valid environments and exit with a non-zero exit code.
3. WHEN configuration is loaded, THE Config_Manager SHALL read required environment variables including FRONTEND_API_ENDPOINT, BACKEND_PORT, and all seven Firebase credential variables prefixed with the uppercase environment name.
4. IF a required environment variable is missing, THEN THE Config_Manager SHALL throw an error identifying the missing variable, the application that requires the variable, and the target environment.
5. WHEN configuration is loaded, THE Config_Manager SHALL validate that the frontend and backend use the same Firebase projectId and databaseURL.
6. IF the frontend and backend Firebase projectId values differ, THEN THE Config_Manager SHALL report a validation error.
7. WHEN configuration is loaded in the development environment, THE Config_Manager SHALL warn if the frontend apiEndpoint does not reference the backend port.
8. WHEN configuration is loaded, THE Config_Manager SHALL warn if the backend CORS origins do not include the frontend origin.
9. THE Config_Manager SHALL provide default CORS origins based on the environment: "http://localhost:8080" for development, "https://staging.varaus.example.com" for staging, and "https://varaus.example.com" for production.

### Requirement 3: Configuration Schema Validation

**User Story:** As a developer, I want configuration validated against a schema, so that type errors and structural problems are caught before applications start.

#### Acceptance Criteria

1. THE Config_Manager SHALL validate that the Firebase_Config object contains all seven required string fields: apiKey, authDomain, databaseURL, projectId, storageBucket, messagingSenderId, and appId.
2. THE Config_Manager SHALL validate that the backend port is a number.
3. THE Config_Manager SHALL validate that the backend logLevel is one of: debug, info, warn, or error.
4. THE Config_Manager SHALL validate that the backend corsOrigins is an array of strings.
5. THE Config_Manager SHALL validate that the frontend devServerPort is a number.
6. THE Config_Manager SHALL validate that the frontend apiEndpoint and buildOutputPath are strings.
7. IF schema validation fails, THEN THE Config_Manager SHALL report the validation errors and prevent the system from proceeding.

### Requirement 4: Dependency Compatibility Checking

**User Story:** As a developer, I want shared dependencies between frontend and backend checked for version compatibility, so that runtime conflicts are detected early.

#### Acceptance Criteria

1. THE Dependency_Checker SHALL identify all packages that appear in both the frontend and backend dependency lists (dependencies and devDependencies).
2. WHEN a shared dependency is found, THE Dependency_Checker SHALL compare the major versions of the frontend and backend versions.
3. IF two versions of a shared dependency have different major versions, THEN THE Dependency_Checker SHALL report the dependency as incompatible.
4. IF a version string cannot be parsed, THEN THE Dependency_Checker SHALL treat the dependency as incompatible.
5. THE Dependency_Checker SHALL return a summary indicating whether all shared dependencies are compatible, along with the list of incompatible dependencies.

### Requirement 5: Node.js Version Compatibility Checking

**User Story:** As a developer, I want the system to verify that the current Node.js version is compatible with both applications, so that version-related runtime errors are prevented.

#### Acceptance Criteria

1. THE Version_Checker SHALL parse Node.js engine requirements from both application package.json files.
2. THE Version_Checker SHALL support version range formats including "20.x", ">=18", "^18.0.0", and "18.x || 20.x".
3. WHEN the current Node.js major version does not satisfy an application engine requirement, THE Version_Checker SHALL report the incompatibility with the application name, required version, and current version.
4. THE Version_Checker SHALL determine the set of Node.js major versions that satisfy both applications simultaneously.
5. IF no common Node.js version satisfies both applications, THEN THE Version_Checker SHALL report the applications as incompatible.

### Requirement 6: Coordinated Application Startup

**User Story:** As a developer, I want both applications started with a single command in the correct order with connectivity verification, so that I have a reliable development environment.

#### Acceptance Criteria

1. WHEN the start command is invoked, THE Coordination_System SHALL load and validate configuration for the specified environment before starting any application.
2. WHEN starting applications, THE Application_Coordinator SHALL start the backend application before the frontend application.
3. WHEN the backend has started, THE Application_Coordinator SHALL verify backend HTTP connectivity before starting the frontend.
4. IF backend connectivity verification fails, THEN THE Application_Coordinator SHALL stop the backend and report the failure with troubleshooting steps.
5. WHEN the frontend has started, THE Application_Coordinator SHALL verify frontend HTTP connectivity.
6. IF frontend connectivity verification fails, THEN THE Application_Coordinator SHALL stop both applications and report the failure with troubleshooting steps.
7. WHEN both applications start successfully, THE Coordination_System SHALL display the frontend and backend URLs.
8. THE Coordination_System SHALL register signal handlers for SIGINT and SIGTERM to perform graceful shutdown of both applications.

### Requirement 7: Process Lifecycle Management

**User Story:** As a developer, I want to start, stop, and restart individual applications, so that I can manage application processes during development.

#### Acceptance Criteria

1. THE Process_Manager SHALL track the status of each application as one of: starting, running, stopping, stopped, or error.
2. WHEN starting an application, THE Process_Manager SHALL spawn a child process using `npm run dev` in the application directory.
3. WHEN starting an application, THE Process_Manager SHALL inject environment variables for port, API endpoint, and Firebase configuration into the child process environment.
4. IF an application that is already running is started again, THEN THE Process_Manager SHALL throw an error indicating the application is already running.
5. WHEN stopping applications with the target "both", THE Process_Manager SHALL stop the frontend and backend concurrently.
6. WHEN stopping an application, THE Process_Manager SHALL send SIGTERM first and SIGKILL after a 5-second timeout if the process has not exited.
7. WHEN restarting an application, THE Process_Manager SHALL stop the application and then start the application with the same configuration.
8. THE Process_Manager SHALL capture stdout and stderr from child processes as log entries.
9. THE Process_Manager SHALL retain the most recent 1000 log entries per application.

### Requirement 8: Process Monitoring and Auto-Restart

**User Story:** As a developer, I want crashed applications to be automatically restarted and file changes to trigger rebuilds, so that my development workflow is uninterrupted.

#### Acceptance Criteria

1. THE Process_Monitor SHALL poll application process status every 5 seconds.
2. WHEN an application status changes to "error" or "stopped" and auto-restart is enabled, THE Process_Monitor SHALL restart the application after a configurable delay (default 2000ms).
3. THE Process_Monitor SHALL enforce a maximum restart count (default 3) per application.
4. IF the maximum restart count is reached, THEN THE Process_Monitor SHALL stop automatic restarts and log an error message.
5. WHEN file watching is enabled, THE Process_Monitor SHALL watch the application `src/` directory for file changes.
6. WHEN a file change is detected, THE Process_Monitor SHALL debounce changes for 1000ms before triggering a restart.
7. THE Process_Monitor SHALL track the restart count and last restart timestamp for each monitored application.

### Requirement 9: Coordinated Build Process

**User Story:** As a developer, I want both applications built in the correct dependency order with environment-specific configuration, so that builds are reliable and correctly configured.

#### Acceptance Criteria

1. WHEN building all applications, THE Build_Coordinator SHALL build the backend before the frontend.
2. IF the backend build fails, THEN THE Build_Coordinator SHALL skip the frontend build and report the backend failure.
3. WHEN building an application, THE Build_Coordinator SHALL execute `npm run build` in the application directory with environment-specific variables injected.
4. WHEN building for production, THE Build_Coordinator SHALL set NODE_ENV to "production".
5. WHEN building for development or staging, THE Build_Coordinator SHALL set NODE_ENV to "development".
6. THE Build_Coordinator SHALL parse build output for error patterns including webpack/TypeScript errors, module-not-found errors, and syntax errors.
7. THE Build_Coordinator SHALL report build duration for each application and the total build duration.
8. IF a build error is detected, THEN THE Build_Coordinator SHALL report the error with the application name, phase, message, and file location when available.

### Requirement 10: Coordinated Test Execution

**User Story:** As a developer, I want tests for both applications run independently with unified reporting, so that I can verify correctness across the full stack.

#### Acceptance Criteria

1. WHEN running all tests, THE Test_Coordinator SHALL execute frontend and backend tests in parallel.
2. THE Test_Coordinator SHALL execute `npm test` in each application directory.
3. THE Test_Coordinator SHALL parse Mocha-format test output to extract the count of passing, failing, and pending tests.
4. WHEN tests fail, THE Test_Coordinator SHALL extract individual test failure names and error messages from the output.
5. THE Test_Coordinator SHALL report a unified summary with per-application pass/fail counts and total duration.
6. THE Coordination_System SHALL support test type arguments: unit, integration, e2e, and all.

### Requirement 11: Health Monitoring

**User Story:** As a developer, I want continuous health monitoring of both applications and their integration, so that I am alerted to problems promptly.

#### Acceptance Criteria

1. THE Health_Monitor SHALL check application responsiveness by making HTTP GET requests with a configurable timeout (default 5000ms).
2. WHEN checking backend health, THE Health_Monitor SHALL additionally check Firebase connectivity via a `/health/firebase` endpoint.
3. IF the Firebase health endpoint is not available, THEN THE Health_Monitor SHALL report a warning instead of a failure.
4. THE Health_Monitor SHALL check integration health including API connectivity, database connectivity, and CORS status.
5. THE Health_Monitor SHALL support continuous monitoring at a configurable interval (default 30000ms).
6. THE Health_Monitor SHALL determine overall system status as "healthy", "degraded", or "unhealthy" based on individual application statuses.
7. IF any application is unhealthy, THEN THE Health_Monitor SHALL report the overall status as "unhealthy".
8. IF any application is degraded and none are unhealthy, THEN THE Health_Monitor SHALL report the overall status as "degraded".
9. THE Health_Monitor SHALL collect performance metrics including response time, memory usage (heapUsed, heapTotal, external), and CPU usage (user, system).
10. THE Health_Monitor SHALL include the `/deleteProfile` endpoint in the set of monitored backend routes.

### Requirement 12: System Status Reporting

**User Story:** As a developer, I want to view the current status of both applications and their integration, so that I can diagnose issues quickly.

#### Acceptance Criteria

1. WHEN the status command is invoked, THE Coordination_System SHALL display the current environment, system uptime, frontend status, backend status, API connectivity, database connectivity, and CORS status.
2. THE Coordination_System SHALL report process status, memory usage, and CPU usage for each application.
3. WHILE both applications are running, THE Coordination_System SHALL check integration health and include the results in the status report.

### Requirement 13: Unified Logging with Correlation

**User Story:** As a developer, I want logs from both applications correlated by request ID, so that I can trace issues across the full stack.

#### Acceptance Criteria

1. THE Unified_Logger SHALL generate UUID-based correlation IDs for request tracing.
2. THE Unified_Logger SHALL capture log entries with timestamp, level (debug, info, warn, error), application name, message, and optional correlation ID.
3. THE Unified_Logger SHALL output log entries to the console in the format: `{timestamp} [{LEVEL}] [{application}] [{correlationId_prefix}] {message}`.
4. THE Unified_Logger SHALL support retrieval of all log entries matching a given correlation ID.
5. THE Unified_Logger SHALL enforce a maximum log entry count (default 10000) and trim the oldest 10% of entries when the limit is exceeded.
6. THE Unified_Logger SHALL route error-level logs to console.error, warn-level logs to console.warn, and debug-level logs to console.debug.

### Requirement 14: Log Correlation and Request Timing Analysis

**User Story:** As a developer, I want to correlate logs across applications and analyze request timing, so that I can identify performance bottlenecks.

#### Acceptance Criteria

1. THE Log_Correlator SHALL separate correlated logs into frontend entries, backend entries, and a combined timeline sorted by timestamp.
2. THE Log_Correlator SHALL calculate total request duration, frontend processing duration, and backend processing duration from correlated log timestamps.
3. THE Log_Correlator SHALL group all logs by correlation ID to find related log entries across applications.

### Requirement 15: Request Flow Tracing

**User Story:** As a developer, I want to trace complete request flows from frontend through backend with timing breakdowns, so that I can understand end-to-end request performance.

#### Acceptance Criteria

1. THE Flow_Tracer SHALL track request flows as a sequence of named stages, each associated with an application and timing information.
2. WHEN a stage is completed, THE Flow_Tracer SHALL record the stage duration as the difference between start and end timestamps.
3. WHEN a flow is ended, THE Flow_Tracer SHALL calculate a timing breakdown with categories: frontend processing, network latency, backend processing, and database operations.
4. THE Flow_Tracer SHALL classify stages containing "database", "db", or "firebase" in the name as database operations.
5. THE Flow_Tracer SHALL calculate network latency as the total round-trip time minus the sum of all categorized processing times.
6. THE Flow_Tracer SHALL format a human-readable timeline showing each event with elapsed time, application, event name, and duration.
7. THE Flow_Tracer SHALL support cleanup of flows older than a configurable maximum age (default 1 hour).

### Requirement 16: Deployment with Verification

**User Story:** As a developer, I want to deploy both applications to staging or production with automated build, test, and health verification, so that deployments are safe and reliable.

#### Acceptance Criteria

1. WHEN the deploy command is invoked, THE Coordination_System SHALL accept a deployment target of "staging" or "production".
2. IF no deployment target is provided, THEN THE Coordination_System SHALL print an error and exit with a non-zero exit code.
3. IF an invalid deployment target is provided, THEN THE Coordination_System SHALL print an error listing valid targets and exit with a non-zero exit code.
4. WHEN deploying, THE Coordination_System SHALL execute the following steps in order: load configuration, build both applications, run all tests, deploy applications, and run health checks.
5. IF the build step fails during deployment, THEN THE Coordination_System SHALL abort the deployment and report the build errors.
6. IF the test step fails during deployment, THEN THE Coordination_System SHALL abort the deployment and report the number of failed tests.
7. WHEN deployment completes, THE Coordination_System SHALL return a result containing success status, target environment, timestamp, and health check status.

### Requirement 17: Startup Error Troubleshooting Guidance

**User Story:** As a developer, I want actionable troubleshooting guidance when startup fails, so that I can resolve issues without searching documentation.

#### Acceptance Criteria

1. IF a startup error message contains "Missing required environment variable", THEN THE Coordination_System SHALL list the required environment variables and suggest creating a .env file.
2. IF a startup error message contains "EADDRINUSE", THEN THE Coordination_System SHALL advise stopping other processes using the port or changing the port configuration.
3. IF a startup error message contains "ENOENT" or "Cannot find module", THEN THE Coordination_System SHALL advise running npm install in both application directories.
4. IF a startup error message contains "Firebase", THEN THE Coordination_System SHALL advise verifying Firebase configuration, project accessibility, and network connectivity.
5. IF the error does not match a known pattern, THEN THE Coordination_System SHALL provide general troubleshooting steps including dependency installation, environment variable verification, and port availability checks.

### Requirement 18: Cross-Platform Setup Automation

**User Story:** As a developer, I want automated setup scripts for both Linux/Mac and Windows, so that the development environment can be configured on any platform.

#### Acceptance Criteria

1. THE Coordination_System SHALL provide a Bash setup script for Linux and macOS.
2. THE Coordination_System SHALL provide a PowerShell setup script for Windows.
3. WHEN executed, THE setup script SHALL verify that Node.js version 20 or higher is installed.
4. IF Node.js is not installed or the version is below 20, THEN THE setup script SHALL print an error and exit.
5. WHEN executed, THE setup script SHALL install npm dependencies in the coordination, varausserver, and varaus directories.
6. IF a .env file does not exist, THEN THE setup script SHALL create a .env.template file with placeholder values for all three environments.
7. WHEN all dependencies are installed, THE setup script SHALL build the coordination system by running `npm run build`.
8. WHEN setup completes, THE setup script SHALL display next steps including environment configuration and start commands.
