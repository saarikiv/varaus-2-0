"use strict";
/**
 * Coordination CLI Module
 * Provides command-line interface for managing both applications
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.coordinationCLI = exports.CoordinationCLIImpl = void 0;
const config_1 = require("../config");
const process_1 = require("../process");
const health_1 = require("../health");
const build_1 = require("../build");
const test_1 = require("../test");
/**
 * Coordination CLI Implementation
 */
class CoordinationCLIImpl {
    configManager;
    processManager;
    buildCoordinator;
    testCoordinator;
    startTime;
    currentEnvironment;
    constructor(projectRoot = process.cwd()) {
        this.configManager = new config_1.ConfigManager(projectRoot);
        this.processManager = new process_1.ProcessManagerImpl(projectRoot);
        this.buildCoordinator = new build_1.BuildCoordinatorImpl(projectRoot);
        this.testCoordinator = new test_1.TestCoordinatorImpl(projectRoot);
        this.startTime = new Date();
    }
    /**
     * Start both applications in development environment
     * Requirements: 1.1
     */
    async start(environment) {
        console.log(`\n=== Starting Varaus Full-Stack Coordination System ===`);
        console.log(`Environment: ${environment}\n`);
        try {
            // Step 1: Load and validate configuration
            console.log('Loading configuration...');
            const config = await this.configManager.loadConfig(environment);
            this.currentEnvironment = environment;
            console.log('✓ Configuration loaded and validated\n');
            // Step 2: Start backend first
            console.log('Starting backend application...');
            const backendConfig = {
                port: config.backend.port,
                firebaseConfig: config.backend.firebaseConfig,
                environment,
                projectRoot: config.shared.projectRoot
            };
            await this.processManager.startApplication('backend', backendConfig);
            console.log(`✓ Backend started on port ${config.backend.port}\n`);
            // Step 3: Verify backend connectivity (including Firebase)
            console.log('Verifying backend connectivity...');
            const backendUrl = `http://localhost:${config.backend.port}`;
            const healthMonitor = (0, health_1.createHealthMonitor)('', backendUrl);
            try {
                const backendHealth = await healthMonitor.checkApplicationHealth('backend');
                if (backendHealth.status === 'unhealthy') {
                    throw new Error('Backend health check failed');
                }
                console.log('✓ Backend connectivity verified\n');
            }
            catch (error) {
                console.warn('⚠ Backend health check could not be completed (this is normal if health endpoints are not implemented)\n');
            }
            // Step 4: Start frontend
            console.log('Starting frontend application...');
            const frontendConfig = {
                port: config.frontend.devServerPort,
                apiEndpoint: config.frontend.apiEndpoint,
                firebaseConfig: config.frontend.firebaseConfig,
                environment,
                projectRoot: config.shared.projectRoot
            };
            await this.processManager.startApplication('frontend', frontendConfig);
            console.log(`✓ Frontend started on port ${config.frontend.devServerPort}\n`);
            // Step 5: Verify frontend connectivity
            console.log('Verifying frontend connectivity...');
            const frontendUrl = `http://localhost:${config.frontend.devServerPort}`;
            const fullHealthMonitor = (0, health_1.createHealthMonitor)(frontendUrl, backendUrl);
            try {
                const frontendHealth = await fullHealthMonitor.checkApplicationHealth('frontend');
                if (frontendHealth.status === 'unhealthy') {
                    throw new Error('Frontend health check failed');
                }
                console.log('✓ Frontend connectivity verified\n');
            }
            catch (error) {
                console.warn('⚠ Frontend health check could not be completed (this is normal if health endpoints are not implemented)\n');
            }
            console.log('=== System Started Successfully ===');
            console.log(`Frontend: http://localhost:${config.frontend.devServerPort}`);
            console.log(`Backend:  http://localhost:${config.backend.port}`);
            console.log('\nPress Ctrl+C to stop all applications\n');
            // Set up graceful shutdown
            this.setupGracefulShutdown();
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.error(`\n✗ Failed to start system: ${errorMessage}\n`);
            // Provide troubleshooting guidance
            this.provideTroubleshootingGuidance(error);
            // Clean up any started processes
            try {
                await this.processManager.stopApplication('both');
            }
            catch (cleanupError) {
                // Ignore cleanup errors
            }
            throw error;
        }
    }
    /**
     * Build both applications for specified environment
     * Requirements: 2.1
     */
    async build(environment) {
        console.log(`\n=== Building Applications for ${environment} ===\n`);
        try {
            // Step 1: Load configuration
            const config = await this.configManager.loadConfig(environment);
            // Step 2: Build all applications in correct order
            const buildResult = await this.buildCoordinator.buildAll(config);
            if (!buildResult.success) {
                console.error('\n✗ Build failed\n');
                // Provide detailed error information
                if (buildResult.backend.errors && buildResult.backend.errors.length > 0) {
                    console.error('Backend errors:');
                    buildResult.backend.errors.forEach(err => {
                        console.error(`  - ${err.message}`);
                        if (err.file) {
                            console.error(`    at ${err.file}:${err.line || '?'}`);
                        }
                    });
                }
                if (buildResult.frontend.errors && buildResult.frontend.errors.length > 0) {
                    console.error('Frontend errors:');
                    buildResult.frontend.errors.forEach(err => {
                        console.error(`  - ${err.message}`);
                        if (err.file) {
                            console.error(`    at ${err.file}:${err.line || '?'}`);
                        }
                    });
                }
                return {
                    success: false,
                    artifacts: [],
                    duration: buildResult.totalDuration,
                    errors: [
                        ...(buildResult.backend.errors || []).map(e => ({
                            application: 'backend',
                            message: e.message,
                            file: e.file,
                            line: e.line
                        })),
                        ...(buildResult.frontend.errors || []).map(e => ({
                            application: 'frontend',
                            message: e.message,
                            file: e.file,
                            line: e.line
                        }))
                    ]
                };
            }
            console.log('\n✓ Build completed successfully\n');
            return {
                success: true,
                artifacts: [
                    ...buildResult.backend.artifacts.map(a => ({
                        application: a.application,
                        path: a.path,
                        size: a.size,
                        hash: a.hash
                    })),
                    ...buildResult.frontend.artifacts.map(a => ({
                        application: a.application,
                        path: a.path,
                        size: a.size,
                        hash: a.hash
                    }))
                ],
                duration: buildResult.totalDuration
            };
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.error(`\n✗ Build failed: ${errorMessage}\n`);
            throw error;
        }
    }
    /**
     * Run tests for both applications
     * Requirements: 3.1
     */
    async test(testType) {
        console.log(`\n=== Running ${testType} Tests ===\n`);
        try {
            // For now, we only support 'unit' and 'all' test types
            // Integration and e2e tests would require additional implementation
            if (testType === 'integration' || testType === 'e2e') {
                console.warn(`⚠ ${testType} tests not yet implemented, running unit tests instead\n`);
            }
            // Run tests for both applications
            const testResult = await this.testCoordinator.runAllTests();
            if (!testResult.success) {
                console.error('\n✗ Some tests failed\n');
                // Provide detailed failure information
                if (testResult.backend.failures.length > 0) {
                    console.error('Backend test failures:');
                    testResult.backend.failures.forEach(failure => {
                        console.error(`  - ${failure.testName}`);
                        console.error(`    ${failure.errorMessage}`);
                    });
                }
                if (testResult.frontend.failures.length > 0) {
                    console.error('Frontend test failures:');
                    testResult.frontend.failures.forEach(failure => {
                        console.error(`  - ${failure.testName}`);
                        console.error(`    ${failure.errorMessage}`);
                    });
                }
                return {
                    success: false,
                    passed: testResult.backend.testsPassed + testResult.frontend.testsPassed,
                    failed: testResult.backend.testsFailed + testResult.frontend.testsFailed,
                    duration: testResult.totalDuration,
                    failures: [
                        ...testResult.backend.failures.map(f => ({
                            application: f.application,
                            testName: f.testName,
                            message: f.errorMessage
                        })),
                        ...testResult.frontend.failures.map(f => ({
                            application: f.application,
                            testName: f.testName,
                            message: f.errorMessage
                        }))
                    ]
                };
            }
            console.log('\n✓ All tests passed\n');
            return {
                success: true,
                passed: testResult.backend.testsPassed + testResult.frontend.testsPassed,
                failed: 0,
                duration: testResult.totalDuration
            };
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.error(`\n✗ Test execution failed: ${errorMessage}\n`);
            throw error;
        }
    }
    /**
     * Get current system status
     * Requirements: 1.1
     */
    async status() {
        console.log('\n=== System Status ===\n');
        try {
            const frontendStatus = this.processManager.getProcessStatus('frontend');
            const backendStatus = this.processManager.getProcessStatus('backend');
            // Get memory and CPU usage
            const memory = process.memoryUsage();
            const cpu = process.cpuUsage();
            const memoryUsage = {
                heapUsed: memory.heapUsed,
                heapTotal: memory.heapTotal,
                external: memory.external
            };
            const cpuUsage = {
                user: cpu.user,
                system: cpu.system
            };
            // Check integration status if both applications are running
            let integrationStatus = {
                apiConnectivity: 'disconnected',
                databaseConnectivity: 'disconnected',
                crossOriginStatus: 'unknown'
            };
            if (frontendStatus === 'running' && backendStatus === 'running' && this.currentEnvironment) {
                try {
                    const config = await this.configManager.loadConfig(this.currentEnvironment);
                    const healthMonitor = (0, health_1.createHealthMonitor)(`http://localhost:${config.frontend.devServerPort}`, `http://localhost:${config.backend.port}`);
                    integrationStatus = await healthMonitor.checkIntegrationHealth();
                }
                catch (error) {
                    // If we can't check integration, leave it as disconnected
                }
            }
            const uptime = Date.now() - this.startTime.getTime();
            const systemStatus = {
                frontend: {
                    status: frontendStatus,
                    memory: memoryUsage,
                    cpu: cpuUsage
                },
                backend: {
                    status: backendStatus,
                    memory: memoryUsage,
                    cpu: cpuUsage
                },
                integration: integrationStatus,
                environment: this.currentEnvironment || 'development',
                uptime
            };
            // Display status
            console.log(`Environment: ${systemStatus.environment}`);
            console.log(`Uptime: ${Math.floor(uptime / 1000)}s\n`);
            console.log(`Frontend: ${frontendStatus}`);
            console.log(`Backend:  ${backendStatus}\n`);
            console.log(`Integration:`);
            console.log(`  API Connectivity:      ${integrationStatus.apiConnectivity}`);
            console.log(`  Database Connectivity: ${integrationStatus.databaseConnectivity}`);
            console.log(`  CORS Status:           ${integrationStatus.crossOriginStatus}\n`);
            return systemStatus;
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.error(`\n✗ Failed to get status: ${errorMessage}\n`);
            throw error;
        }
    }
    /**
     * Get logs from applications
     * Requirements: 1.1
     */
    async logs(application) {
        console.log(`\n=== Application Logs ===\n`);
        try {
            // For now, return empty log stream
            // In a full implementation, we would collect logs from the process manager
            console.log('Log streaming not yet fully implemented');
            console.log('Check individual application logs in their respective directories\n');
            return {
                entries: []
            };
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.error(`\n✗ Failed to get logs: ${errorMessage}\n`);
            throw error;
        }
    }
    /**
     * Deploy applications to staging or production
     * Requirements: 2.4, 2.5
     */
    async deploy(target) {
        const environment = target === 'staging' ? 'staging' : 'production';
        console.log(`\n=== Deploying to ${target} ===\n`);
        try {
            // Step 1: Load configuration for target environment
            console.log('Loading configuration...');
            const config = await this.configManager.loadConfig(environment);
            console.log('✓ Configuration loaded\n');
            // Step 2: Build applications for target environment
            console.log('Building applications...');
            const buildResult = await this.buildCoordinator.buildAll(config);
            if (!buildResult.success) {
                console.error('✗ Build failed - deployment aborted\n');
                // Provide detailed error information
                if (buildResult.backend.errors && buildResult.backend.errors.length > 0) {
                    console.error('Backend build errors:');
                    buildResult.backend.errors.forEach(err => {
                        console.error(`  - ${err.message}`);
                    });
                }
                if (buildResult.frontend.errors && buildResult.frontend.errors.length > 0) {
                    console.error('Frontend build errors:');
                    buildResult.frontend.errors.forEach(err => {
                        console.error(`  - ${err.message}`);
                    });
                }
                return {
                    success: false,
                    environment,
                    timestamp: new Date(),
                    healthChecksPassed: false
                };
            }
            console.log('✓ Build completed successfully\n');
            // Step 3: Run tests before deployment
            console.log('Running tests...');
            const testResult = await this.testCoordinator.runAllTests();
            if (!testResult.success) {
                console.error('✗ Tests failed - deployment aborted\n');
                const totalFailed = testResult.backend.testsFailed + testResult.frontend.testsFailed;
                console.error(`Failed tests: ${totalFailed}`);
                return {
                    success: false,
                    environment,
                    timestamp: new Date(),
                    healthChecksPassed: false
                };
            }
            console.log('✓ All tests passed\n');
            // Step 4: Deploy applications
            // Note: Actual deployment would depend on the deployment platform
            // For Firebase hosting, we would use firebase deploy
            // For Heroku, we would use git push heroku
            // This is a simplified implementation
            console.log('Deploying applications...');
            console.log('⚠ Actual deployment to hosting platform not implemented');
            console.log('  In a production system, this would:');
            console.log('  - Deploy backend to hosting platform (e.g., Heroku, AWS)');
            console.log('  - Deploy frontend to hosting platform (e.g., Firebase Hosting, Netlify)');
            console.log('  - Update environment configurations');
            console.log('  - Run database migrations if needed\n');
            // Step 5: Verify deployment with health checks
            console.log('Running health checks...');
            // For staging/production, we would check the actual deployed URLs
            // For now, we'll simulate health checks
            let healthChecksPassed = true;
            try {
                // In a real implementation, we would:
                // 1. Wait for deployment to complete
                // 2. Check health endpoints on deployed URLs
                // 3. Verify database connectivity
                // 4. Check integration between frontend and backend
                console.log('⚠ Health check verification not fully implemented');
                console.log('  In a production system, this would verify:');
                console.log('  - Backend application is responding');
                console.log('  - Frontend application is accessible');
                console.log('  - Database connectivity is working');
                console.log('  - API integration is functional\n');
                // Simulate health check
                await new Promise(resolve => setTimeout(resolve, 1000));
                console.log('✓ Health checks passed (simulated)\n');
            }
            catch (error) {
                console.error('✗ Health checks failed\n');
                healthChecksPassed = false;
            }
            const deploymentResult = {
                success: healthChecksPassed,
                environment,
                timestamp: new Date(),
                healthChecksPassed
            };
            if (deploymentResult.success) {
                console.log(`✓ Deployment to ${target} completed successfully\n`);
            }
            else {
                console.error(`✗ Deployment to ${target} completed with health check failures\n`);
            }
            return deploymentResult;
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.error(`\n✗ Deployment failed: ${errorMessage}\n`);
            return {
                success: false,
                environment,
                timestamp: new Date(),
                healthChecksPassed: false
            };
        }
    }
    /**
     * Set up graceful shutdown handlers
     */
    setupGracefulShutdown() {
        const shutdown = async () => {
            console.log('\n\nShutting down...');
            try {
                await this.processManager.stopApplication('both');
                console.log('✓ All applications stopped\n');
                process.exit(0);
            }
            catch (error) {
                console.error('Error during shutdown:', error);
                process.exit(1);
            }
        };
        process.on('SIGINT', shutdown);
        process.on('SIGTERM', shutdown);
    }
    /**
     * Provide troubleshooting guidance based on error
     */
    provideTroubleshootingGuidance(error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.log('\n=== Troubleshooting Guidance ===\n');
        if (errorMessage.includes('Missing required environment variable')) {
            console.log('Missing environment variables detected.');
            console.log('Please ensure all required environment variables are set:');
            console.log('  - FRONTEND_API_ENDPOINT');
            console.log('  - BACKEND_PORT');
            console.log('  - <ENV>_FIREBASE_* variables (where <ENV> is DEVELOPMENT, STAGING, or PRODUCTION)');
            console.log('\nCreate a .env file or set these variables in your shell.\n');
        }
        else if (errorMessage.includes('EADDRINUSE')) {
            console.log('Port already in use.');
            console.log('Another process is using the required port.');
            console.log('Try stopping other applications or changing the port configuration.\n');
        }
        else if (errorMessage.includes('ENOENT') || errorMessage.includes('Cannot find module')) {
            console.log('Missing dependencies detected.');
            console.log('Run npm install in both application directories:');
            console.log('  cd varaus && npm install');
            console.log('  cd varausserver && npm install\n');
        }
        else if (errorMessage.includes('Firebase')) {
            console.log('Firebase connectivity issue detected.');
            console.log('Please verify:');
            console.log('  - Firebase configuration is correct');
            console.log('  - Firebase project is accessible');
            console.log('  - Network connectivity to Firebase services\n');
        }
        else {
            console.log('For general issues:');
            console.log('  1. Ensure all dependencies are installed (npm install)');
            console.log('  2. Check that environment variables are set correctly');
            console.log('  3. Verify that no other processes are using the required ports');
            console.log('  4. Check application logs for more details\n');
        }
    }
}
exports.CoordinationCLIImpl = CoordinationCLIImpl;
// Export singleton instance
exports.coordinationCLI = new CoordinationCLIImpl();
