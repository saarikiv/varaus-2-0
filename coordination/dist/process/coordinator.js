"use strict";
/**
 * Application Startup Coordinator
 * Manages coordinated startup of frontend and backend applications
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
exports.ApplicationCoordinator = void 0;
const http = __importStar(require("http"));
class ApplicationCoordinator {
    processManager;
    signalHandlersRegistered = false;
    constructor(processManager) {
        this.processManager = processManager;
    }
    /**
     * Start all applications with coordinated startup sequence.
     * Backend starts first, then frontend after backend connectivity is verified.
     * Registers SIGINT/SIGTERM handlers for graceful shutdown.
     */
    async startAll(config) {
        const errors = [];
        let backendHandle;
        let frontendHandle;
        const backendConfig = {
            port: config.backend.port,
            firebaseConfig: config.backend.firebaseConfig,
            environment: config.shared.environment,
            projectRoot: config.shared.projectRoot,
        };
        const frontendConfig = {
            port: config.frontend.devServerPort,
            apiEndpoint: config.frontend.apiEndpoint,
            firebaseConfig: config.frontend.firebaseConfig,
            environment: config.shared.environment,
            projectRoot: config.shared.projectRoot,
        };
        try {
            // Step 1: Start backend
            console.log('Starting backend application...');
            backendHandle = await this.processManager.startApplication('backend', backendConfig);
            console.log(`Backend started on port ${backendHandle.port}`);
            // Step 2: Verify backend HTTP connectivity
            console.log('Verifying backend connectivity...');
            const backendUrl = `http://localhost:${config.backend.port}`;
            const backendConnectivity = await this.verifyConnectivity(backendUrl);
            if (!backendConnectivity.success) {
                // On backend connectivity failure: stop backend, report failure
                await this.safeStop('backend');
                errors.push({
                    application: 'backend',
                    phase: 'connectivity',
                    message: backendConnectivity.error || 'Backend HTTP connectivity check failed',
                    troubleshooting: [
                        'Check if the backend port is already in use',
                        'Verify the backend application started without errors',
                        'Check backend logs for startup errors',
                        'Verify Firebase configuration is correct',
                        'Check network connectivity',
                    ],
                });
                return { success: false, backend: backendHandle, errors };
            }
            console.log('Backend connectivity verified');
            // Step 3: Start frontend
            console.log('Starting frontend application...');
            frontendHandle = await this.processManager.startApplication('frontend', frontendConfig);
            console.log(`Frontend started on port ${frontendHandle.port}`);
            // Step 4: Verify frontend HTTP connectivity
            console.log('Verifying frontend connectivity...');
            const frontendUrl = `http://localhost:${config.frontend.devServerPort}`;
            const frontendConnectivity = await this.verifyConnectivity(frontendUrl);
            if (!frontendConnectivity.success) {
                // On frontend connectivity failure: stop both, report failure
                await this.safeStop('both');
                errors.push({
                    application: 'frontend',
                    phase: 'connectivity',
                    message: frontendConnectivity.error || 'Frontend HTTP connectivity check failed',
                    troubleshooting: [
                        'Check if the frontend dev server port is already in use',
                        'Verify the frontend application started without errors',
                        'Check if the frontend API endpoint is configured correctly',
                        'Verify CORS settings on the backend',
                        'Check frontend logs for connection errors',
                    ],
                });
                return { success: false, backend: backendHandle, frontend: frontendHandle, errors };
            }
            console.log('Frontend connectivity verified');
            // Step 5: Display URLs on success
            const backendDisplayUrl = `http://localhost:${config.backend.port}`;
            const frontendDisplayUrl = `http://localhost:${config.frontend.devServerPort}`;
            console.log(`\nApplications started successfully!`);
            console.log(`  Frontend: ${frontendDisplayUrl}`);
            console.log(`  Backend:  ${backendDisplayUrl}`);
            // Step 6: Register signal handlers for graceful shutdown
            this.registerSignalHandlers();
            return {
                success: true,
                backend: backendHandle,
                frontend: frontendHandle,
                errors: [],
            };
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            const failedApp = backendHandle ? 'frontend' : 'backend';
            errors.push({
                application: failedApp,
                phase: 'launch',
                message: `Failed to start ${failedApp}: ${errorMessage}`,
                troubleshooting: this.getTroubleshootingSteps(failedApp, errorMessage),
            });
            // Clean up any started processes
            await this.safeStop('both');
            return { success: false, backend: backendHandle, frontend: frontendHandle, errors };
        }
    }
    /**
     * Stop all running applications gracefully.
     */
    async stopAll() {
        console.log('Stopping all applications...');
        await this.safeStop('both');
        console.log('All applications stopped');
    }
    /**
     * Legacy method: Start both applications with separate configs.
     * Prefer startAll(config) for new code.
     */
    async startBoth(backendConfig, frontendConfig) {
        const errors = [];
        let backendHandle;
        let frontendHandle;
        try {
            // Step 1: Start backend first
            console.log('Starting backend application...');
            backendHandle = await this.startBackend(backendConfig);
            console.log(`Backend started on port ${backendHandle.port}`);
            // Step 2: Verify backend connectivity
            console.log('Verifying backend connectivity...');
            const backendConnectivity = await this.verifyBackendConnectivity(backendHandle);
            if (!backendConnectivity.success) {
                errors.push({
                    application: 'backend',
                    phase: 'connectivity',
                    message: backendConnectivity.error || 'Backend connectivity check failed',
                    troubleshooting: [
                        'Check if the backend port is already in use',
                        'Verify Firebase configuration is correct',
                        'Check network connectivity',
                        'Review backend logs for errors',
                    ],
                });
                await this.safeStop('backend');
                return { success: false, backend: backendHandle, errors };
            }
            console.log('Backend connectivity verified');
            // Step 3: Start frontend
            console.log('Starting frontend application...');
            frontendHandle = await this.startFrontend(frontendConfig, backendHandle);
            console.log(`Frontend started on port ${frontendHandle.port}`);
            // Step 4: Verify frontend connectivity
            console.log('Verifying frontend-backend connectivity...');
            const frontendConnectivity = await this.verifyFrontendConnectivity(frontendHandle, backendHandle);
            if (!frontendConnectivity.success) {
                errors.push({
                    application: 'frontend',
                    phase: 'connectivity',
                    message: frontendConnectivity.error || 'Frontend-backend connectivity check failed',
                    troubleshooting: [
                        'Check if frontend API endpoint is configured correctly',
                        'Verify CORS settings on backend',
                        'Check if backend is still running',
                        'Review frontend logs for connection errors',
                    ],
                });
                await this.safeStop('both');
                return { success: false, backend: backendHandle, frontend: frontendHandle, errors };
            }
            console.log('Frontend-backend connectivity verified');
            // Display URLs on success
            if (backendHandle.port && frontendHandle.port) {
                console.log(`\nApplications started successfully!`);
                console.log(`  Frontend: http://localhost:${frontendHandle.port}`);
                console.log(`  Backend:  http://localhost:${backendHandle.port}`);
            }
            // Register signal handlers
            this.registerSignalHandlers();
            return {
                success: true,
                backend: backendHandle,
                frontend: frontendHandle,
                errors: [],
            };
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            const failedApp = backendHandle ? 'frontend' : 'backend';
            errors.push({
                application: failedApp,
                phase: 'launch',
                message: `Failed to start ${failedApp}: ${errorMessage}`,
                troubleshooting: this.getTroubleshootingSteps(failedApp, errorMessage),
            });
            await this.safeStop('both');
            return { success: false, backend: backendHandle, frontend: frontendHandle, errors };
        }
    }
    /**
     * Register SIGINT and SIGTERM signal handlers for graceful shutdown.
     */
    registerSignalHandlers() {
        if (this.signalHandlersRegistered) {
            return;
        }
        const shutdown = async (signal) => {
            console.log(`\nReceived ${signal}, shutting down gracefully...`);
            await this.stopAll();
            process.exit(0);
        };
        process.on('SIGINT', () => shutdown('SIGINT'));
        process.on('SIGTERM', () => shutdown('SIGTERM'));
        this.signalHandlersRegistered = true;
    }
    /**
     * Verify HTTP connectivity to a URL.
     */
    async verifyConnectivity(url, timeout = 5000) {
        try {
            await this.checkHttpEndpoint(url, timeout);
            return { success: true };
        }
        catch (error) {
            return {
                success: false,
                error: `HTTP endpoint not responding at ${url}: ${error instanceof Error ? error.message : String(error)}`,
            };
        }
    }
    /**
     * Start backend application (used by startBoth).
     */
    async startBackend(config) {
        try {
            return await this.processManager.startApplication('backend', config);
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            throw new Error(`Backend startup failed: ${errorMessage}`);
        }
    }
    /**
     * Start frontend application with backend configuration (used by startBoth).
     */
    async startFrontend(config, backendHandle) {
        try {
            const frontendConfig = {
                ...config,
                apiEndpoint: config.apiEndpoint || `http://localhost:${backendHandle.port}`,
            };
            return await this.processManager.startApplication('frontend', frontendConfig);
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            throw new Error(`Frontend startup failed: ${errorMessage}`);
        }
    }
    /**
     * Verify backend connectivity (used by startBoth).
     */
    async verifyBackendConnectivity(backendHandle) {
        if (!backendHandle.port) {
            return { success: false, error: 'Backend port not available' };
        }
        return this.verifyConnectivity(`http://localhost:${backendHandle.port}`);
    }
    /**
     * Verify frontend connectivity (used by startBoth).
     */
    async verifyFrontendConnectivity(frontendHandle, _backendHandle) {
        if (!frontendHandle.port) {
            return { success: false, error: 'Frontend port not available' };
        }
        return this.verifyConnectivity(`http://localhost:${frontendHandle.port}`);
    }
    /**
     * Check if an HTTP endpoint is responding.
     */
    async checkHttpEndpoint(url, timeout = 5000) {
        return new Promise((resolve, reject) => {
            const timeoutId = setTimeout(() => {
                reject(new Error(`Timeout after ${timeout}ms`));
            }, timeout);
            http
                .get(url, (res) => {
                clearTimeout(timeoutId);
                if (res.statusCode && res.statusCode < 500) {
                    resolve();
                }
                else {
                    reject(new Error(`HTTP ${res.statusCode}`));
                }
            })
                .on('error', (error) => {
                clearTimeout(timeoutId);
                reject(error);
            });
        });
    }
    /**
     * Safely stop applications, ignoring errors for apps that aren't running.
     */
    async safeStop(app) {
        try {
            await this.processManager.stopApplication(app);
        }
        catch {
            // Ignore errors during cleanup
        }
    }
    /**
     * Get troubleshooting steps based on error context.
     */
    getTroubleshootingSteps(app, errorMessage) {
        const commonSteps = [
            'Check if all dependencies are installed (npm install)',
            'Verify environment variables are set correctly',
            'Check application logs for detailed error messages',
        ];
        if (errorMessage.includes('EADDRINUSE') || errorMessage.includes('port')) {
            return [
                'Port is already in use - stop other processes using this port',
                'Try using a different port in configuration',
                ...commonSteps,
            ];
        }
        if (errorMessage.includes('ENOENT') || errorMessage.includes('not found')) {
            return [
                'Application files may be missing or in wrong location',
                'Verify project structure is correct',
                'Run npm install to ensure all dependencies are present',
                ...commonSteps,
            ];
        }
        if (errorMessage.includes('Firebase') || errorMessage.includes('database')) {
            return [
                'Check Firebase configuration credentials',
                'Verify Firebase project is accessible',
                'Check network connectivity to Firebase',
                ...commonSteps,
            ];
        }
        if (app === 'backend') {
            return [
                'Check if Node.js version is compatible (20.x required)',
                'Verify backend port is available',
                'Check Firebase configuration',
                ...commonSteps,
            ];
        }
        else {
            return [
                'Check if webpack build is configured correctly',
                'Verify frontend dev server port is available',
                'Check if backend is running and accessible',
                ...commonSteps,
            ];
        }
    }
}
exports.ApplicationCoordinator = ApplicationCoordinator;
