"use strict";
/**
 * Build Coordinator Module
 * Manages coordinated building of frontend and backend applications
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
exports.buildCoordinator = exports.BuildCoordinatorImpl = void 0;
const child_process_1 = require("child_process");
const path = __importStar(require("path"));
/**
 * Build Coordinator Implementation
 */
class BuildCoordinatorImpl {
    projectRoot;
    constructor(projectRoot = process.cwd()) {
        this.projectRoot = projectRoot;
    }
    /**
     * Build a single application with environment-specific configuration
     */
    async buildApplication(app, config) {
        if (app === 'both') {
            throw new Error('Cannot build "both" - use buildAll() instead');
        }
        const startTime = Date.now();
        const errors = [];
        const artifacts = [];
        let output = '';
        try {
            // Apply environment-specific configuration
            const env = this.buildEnvironment(app, config);
            const appDir = this.getApplicationDirectory(app);
            console.log(`Building ${app} for ${config.shared.environment} environment...`);
            // Execute build command
            const buildOutput = await this.executeBuild(app, appDir, env);
            output = buildOutput;
            // Check for build errors in output
            const buildErrors = this.parseBuildErrors(app, buildOutput);
            if (buildErrors.length > 0) {
                errors.push(...buildErrors);
                return {
                    success: false,
                    application: app,
                    artifacts: [],
                    duration: Date.now() - startTime,
                    errors,
                    output
                };
            }
            // Collect build artifacts
            // Note: In a real implementation, we would scan the build output directory
            // For now, we'll return a placeholder
            console.log(`${app} build completed successfully`);
            return {
                success: true,
                application: app,
                artifacts,
                duration: Date.now() - startTime,
                output
            };
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            errors.push({
                application: app,
                phase: 'compilation',
                message: `Build failed: ${errorMessage}`,
                details: output
            });
            return {
                success: false,
                application: app,
                artifacts: [],
                duration: Date.now() - startTime,
                errors,
                output
            };
        }
    }
    /**
     * Build all applications in correct dependency order
     * Backend is built first, then frontend
     */
    async buildAll(config) {
        const startTime = Date.now();
        console.log('Starting coordinated build process...');
        console.log(`Environment: ${config.shared.environment}`);
        // Step 1: Build backend first (frontend may depend on backend types/contracts)
        console.log('\n=== Building Backend ===');
        const backendResult = await this.buildApplication('backend', config);
        if (!backendResult.success) {
            console.error('Backend build failed - stopping build process');
            // Return early if backend build fails
            return {
                success: false,
                backend: backendResult,
                frontend: {
                    success: false,
                    application: 'frontend',
                    artifacts: [],
                    duration: 0,
                    errors: [{
                            application: 'frontend',
                            phase: 'configuration',
                            message: 'Frontend build skipped due to backend build failure'
                        }],
                    output: ''
                },
                totalDuration: Date.now() - startTime
            };
        }
        // Step 2: Build frontend after backend succeeds
        console.log('\n=== Building Frontend ===');
        const frontendResult = await this.buildApplication('frontend', config);
        const success = backendResult.success && frontendResult.success;
        const totalDuration = Date.now() - startTime;
        if (success) {
            console.log(`\n✓ Build completed successfully in ${totalDuration}ms`);
        }
        else {
            console.error(`\n✗ Build failed after ${totalDuration}ms`);
        }
        return {
            success,
            backend: backendResult,
            frontend: frontendResult,
            totalDuration
        };
    }
    /**
     * Get application directory path
     */
    getApplicationDirectory(app) {
        if (app === 'frontend') {
            return path.join(this.projectRoot, 'varaus');
        }
        else if (app === 'backend') {
            return path.join(this.projectRoot, 'varausserver');
        }
        throw new Error(`Unknown application: ${app}`);
    }
    /**
     * Build environment variables for the application
     */
    buildEnvironment(app, config) {
        const env = { ...process.env };
        const environment = config.shared.environment;
        // Common environment variables
        env.NODE_ENV = environment === 'production' ? 'production' : 'development';
        if (app === 'backend') {
            const backendConfig = config.backend;
            env.BACKEND_PORT = String(backendConfig.port);
            env.BACKEND_LOG_LEVEL = backendConfig.logLevel;
            env.BACKEND_CORS_ORIGINS = backendConfig.corsOrigins.join(',');
            // Firebase configuration
            const prefix = environment.toUpperCase();
            env[`${prefix}_FIREBASE_API_KEY`] = backendConfig.firebaseConfig.apiKey;
            env[`${prefix}_FIREBASE_AUTH_DOMAIN`] = backendConfig.firebaseConfig.authDomain;
            env[`${prefix}_FIREBASE_DATABASE_URL`] = backendConfig.firebaseConfig.databaseURL;
            env[`${prefix}_FIREBASE_PROJECT_ID`] = backendConfig.firebaseConfig.projectId;
            env[`${prefix}_FIREBASE_STORAGE_BUCKET`] = backendConfig.firebaseConfig.storageBucket;
            env[`${prefix}_FIREBASE_MESSAGING_SENDER_ID`] = backendConfig.firebaseConfig.messagingSenderId;
            env[`${prefix}_FIREBASE_APP_ID`] = backendConfig.firebaseConfig.appId;
        }
        else if (app === 'frontend') {
            const frontendConfig = config.frontend;
            env.FRONTEND_API_ENDPOINT = frontendConfig.apiEndpoint;
            env.FRONTEND_BUILD_OUTPUT = frontendConfig.buildOutputPath;
            // Firebase configuration
            const prefix = environment.toUpperCase();
            env[`${prefix}_FIREBASE_API_KEY`] = frontendConfig.firebaseConfig.apiKey;
            env[`${prefix}_FIREBASE_AUTH_DOMAIN`] = frontendConfig.firebaseConfig.authDomain;
            env[`${prefix}_FIREBASE_DATABASE_URL`] = frontendConfig.firebaseConfig.databaseURL;
            env[`${prefix}_FIREBASE_PROJECT_ID`] = frontendConfig.firebaseConfig.projectId;
            env[`${prefix}_FIREBASE_STORAGE_BUCKET`] = frontendConfig.firebaseConfig.storageBucket;
            env[`${prefix}_FIREBASE_MESSAGING_SENDER_ID`] = frontendConfig.firebaseConfig.messagingSenderId;
            env[`${prefix}_FIREBASE_APP_ID`] = frontendConfig.firebaseConfig.appId;
        }
        return env;
    }
    /**
     * Execute build command for an application
     */
    async executeBuild(app, appDir, env) {
        return new Promise((resolve, reject) => {
            let output = '';
            let errorOutput = '';
            const buildProcess = (0, child_process_1.spawn)('npm', ['run', 'build'], {
                cwd: appDir,
                env,
                shell: true
            });
            buildProcess.stdout?.on('data', (data) => {
                const text = data.toString();
                output += text;
                process.stdout.write(text);
            });
            buildProcess.stderr?.on('data', (data) => {
                const text = data.toString();
                errorOutput += text;
                process.stderr.write(text);
            });
            buildProcess.on('exit', (code) => {
                const fullOutput = output + errorOutput;
                if (code === 0) {
                    resolve(fullOutput);
                }
                else {
                    reject(new Error(`Build process exited with code ${code}`));
                }
            });
            buildProcess.on('error', (error) => {
                reject(error);
            });
        });
    }
    /**
     * Parse build errors from build output
     */
    parseBuildErrors(app, output) {
        const errors = [];
        // Look for common error patterns
        const lines = output.split('\n');
        for (const line of lines) {
            // Webpack/TypeScript error pattern: ERROR in ./src/file.ts:10:5
            const webpackMatch = line.match(/ERROR in (.+):(\d+):(\d+)/);
            if (webpackMatch) {
                errors.push({
                    application: app,
                    phase: 'compilation',
                    message: line,
                    file: webpackMatch[1],
                    line: parseInt(webpackMatch[2], 10),
                    column: parseInt(webpackMatch[3], 10)
                });
                continue;
            }
            // Generic error pattern
            if (line.toLowerCase().includes('error') && !line.includes('0 errors')) {
                errors.push({
                    application: app,
                    phase: 'compilation',
                    message: line.trim()
                });
            }
            // Module not found
            if (line.includes('Module not found') || line.includes('Cannot find module')) {
                errors.push({
                    application: app,
                    phase: 'compilation',
                    message: line.trim()
                });
            }
            // Syntax errors
            if (line.includes('SyntaxError')) {
                errors.push({
                    application: app,
                    phase: 'compilation',
                    message: line.trim()
                });
            }
        }
        return errors;
    }
}
exports.BuildCoordinatorImpl = BuildCoordinatorImpl;
// Export singleton instance
exports.buildCoordinator = new BuildCoordinatorImpl();
