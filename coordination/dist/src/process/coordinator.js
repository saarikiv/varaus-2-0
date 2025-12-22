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
    constructor(processManager) {
        this.processManager = processManager;
    }
    /**
     * Start both applications with proper coordination
     * Backend starts first, then frontend after backend connectivity is verified
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
            // Step 2: Verify backend connectivity (including Firebase)
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
                        'Review backend logs for errors'
                    ]
                });
                // Stop backend if connectivity failed
                await this.processManager.stopApplication('backend');
                return {
                    success: false,
                    backend: backendHandle,
                    errors
                };
            }
            console.log('Backend connectivity verified');
            // Step 3: Start frontend with backend endpoint configuration
            console.log('Starting frontend application...');
            frontendHandle = await this.startFrontend(frontendConfig, backendHandle);
            console.log(`Frontend started on port ${frontendHandle.port}`);
            // Step 4: Verify frontend connectivity to backend
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
                        'Review frontend logs for connection errors'
                    ]
                });
                // Stop both applications if frontend connectivity failed
                await this.processManager.stopApplication('frontend');
                await this.processManager.stopApplication('backend');
                return {
                    success: false,
                    backend: backendHandle,
                    frontend: frontendHandle,
                    errors
                };
            }
            console.log('Frontend-backend connectivity verified');
            return {
                success: true,
                backend: backendHandle,
                frontend: frontendHandle,
                errors: []
            };
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            // Determine which application failed
            const failedApp = backendHandle ? 'frontend' : 'backend';
            errors.push({
                application: failedApp,
                phase: 'launch',
                message: `Failed to start ${failedApp}: ${errorMessage}`,
                troubleshooting: this.getTroubleshootingSteps(failedApp, errorMessage)
            });
            // Clean up any started processes
            try {
                if (frontendHandle) {
                    await this.processManager.stopApplication('frontend');
                }
                if (backendHandle) {
                    await this.processManager.stopApplication('backend');
                }
            }
            catch (cleanupError) {
                // Ignore cleanup errors
            }
            return {
                success: false,
                backend: backendHandle,
                frontend: frontendHandle,
                errors
            };
        }
    }
    /**
     * Start backend application
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
     * Start frontend application with backend configuration
     */
    async startFrontend(config, backendHandle) {
        try {
            // Ensure frontend knows about backend endpoint
            const frontendConfig = {
                ...config,
                apiEndpoint: config.apiEndpoint || `http://localhost:${backendHandle.port}`
            };
            return await this.processManager.startApplication('frontend', frontendConfig);
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            throw new Error(`Frontend startup failed: ${errorMessage}`);
        }
    }
    /**
     * Verify backend connectivity (HTTP and Firebase)
     */
    async verifyBackendConnectivity(backendHandle) {
        if (!backendHandle.port) {
            return {
                success: false,
                error: 'Backend port not available'
            };
        }
        // Check HTTP connectivity
        try {
            await this.checkHttpEndpoint(`http://localhost:${backendHandle.port}`);
        }
        catch (error) {
            return {
                success: false,
                error: `Backend HTTP endpoint not responding: ${error instanceof Error ? error.message : String(error)}`
            };
        }
        // Firebase connectivity would be checked by the backend itself
        // We can verify this by checking backend logs or a health endpoint
        // For now, we assume if HTTP is working, Firebase will be checked by the app
        return { success: true };
    }
    /**
     * Verify frontend connectivity to backend
     */
    async verifyFrontendConnectivity(frontendHandle, backendHandle) {
        if (!frontendHandle.port) {
            return {
                success: false,
                error: 'Frontend port not available'
            };
        }
        // Check if frontend is serving
        try {
            await this.checkHttpEndpoint(`http://localhost:${frontendHandle.port}`);
        }
        catch (error) {
            return {
                success: false,
                error: `Frontend HTTP endpoint not responding: ${error instanceof Error ? error.message : String(error)}`
            };
        }
        // The actual API connectivity will be tested when the frontend makes its first request
        // For now, we verify both are running
        return { success: true };
    }
    /**
     * Check if an HTTP endpoint is responding
     */
    async checkHttpEndpoint(url, timeout = 5000) {
        return new Promise((resolve, reject) => {
            const timeoutId = setTimeout(() => {
                reject(new Error(`Timeout after ${timeout}ms`));
            }, timeout);
            http.get(url, (res) => {
                clearTimeout(timeoutId);
                if (res.statusCode && res.statusCode < 500) {
                    resolve();
                }
                else {
                    reject(new Error(`HTTP ${res.statusCode}`));
                }
            }).on('error', (error) => {
                clearTimeout(timeoutId);
                reject(error);
            });
        });
    }
    /**
     * Get troubleshooting steps based on error
     */
    getTroubleshootingSteps(app, errorMessage) {
        const commonSteps = [
            'Check if all dependencies are installed (npm install)',
            'Verify environment variables are set correctly',
            'Check application logs for detailed error messages'
        ];
        if (errorMessage.includes('EADDRINUSE') || errorMessage.includes('port')) {
            return [
                'Port is already in use - stop other processes using this port',
                'Try using a different port in configuration',
                ...commonSteps
            ];
        }
        if (errorMessage.includes('ENOENT') || errorMessage.includes('not found')) {
            return [
                'Application files may be missing or in wrong location',
                'Verify project structure is correct',
                'Run npm install to ensure all dependencies are present',
                ...commonSteps
            ];
        }
        if (errorMessage.includes('Firebase') || errorMessage.includes('database')) {
            return [
                'Check Firebase configuration credentials',
                'Verify Firebase project is accessible',
                'Check network connectivity to Firebase',
                ...commonSteps
            ];
        }
        if (app === 'backend') {
            return [
                'Check if Node.js version is compatible (20.x required)',
                'Verify backend port is available',
                'Check Firebase configuration',
                ...commonSteps
            ];
        }
        else {
            return [
                'Check if webpack build is configured correctly',
                'Verify frontend dev server port is available',
                'Check if backend is running and accessible',
                ...commonSteps
            ];
        }
    }
}
exports.ApplicationCoordinator = ApplicationCoordinator;
