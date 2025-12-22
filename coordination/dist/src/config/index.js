"use strict";
/**
 * Configuration Manager Module
 * Manages environment-specific configurations and ensures compatibility
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.configManager = exports.ConfigManager = exports.configSchema = void 0;
exports.configSchema = {
    validateEnvironment(env) {
        return ['development', 'staging', 'production'].includes(env);
    },
    validateFirebaseConfig(config) {
        return (typeof config === 'object' &&
            typeof config.apiKey === 'string' &&
            typeof config.authDomain === 'string' &&
            typeof config.databaseURL === 'string' &&
            typeof config.projectId === 'string' &&
            typeof config.storageBucket === 'string' &&
            typeof config.messagingSenderId === 'string' &&
            typeof config.appId === 'string');
    },
    validateFrontendConfig(config) {
        return (typeof config === 'object' &&
            typeof config.apiEndpoint === 'string' &&
            exports.configSchema.validateFirebaseConfig(config.firebaseConfig) &&
            typeof config.buildOutputPath === 'string' &&
            typeof config.devServerPort === 'number');
    },
    validateBackendConfig(config) {
        return (typeof config === 'object' &&
            typeof config.port === 'number' &&
            exports.configSchema.validateFirebaseConfig(config.firebaseConfig) &&
            Array.isArray(config.corsOrigins) &&
            config.corsOrigins.every((origin) => typeof origin === 'string') &&
            ['debug', 'info', 'warn', 'error'].includes(config.logLevel));
    },
    validateSystemConfig(config) {
        return (typeof config === 'object' &&
            exports.configSchema.validateFrontendConfig(config.frontend) &&
            exports.configSchema.validateBackendConfig(config.backend) &&
            typeof config.shared === 'object' &&
            exports.configSchema.validateEnvironment(config.shared.environment) &&
            typeof config.shared.projectRoot === 'string');
    }
};
/**
 * Configuration Manager Implementation
 */
class ConfigManager {
    currentConfig = null;
    projectRoot;
    constructor(projectRoot = process.cwd()) {
        this.projectRoot = projectRoot;
    }
    async loadConfig(environment) {
        // Load environment-specific configurations
        const config = {
            frontend: this.loadFrontendConfig(environment),
            backend: this.loadBackendConfig(environment),
            shared: {
                environment,
                projectRoot: this.projectRoot
            }
        };
        // Validate the loaded configuration
        const validationResult = this.validateConfig(config);
        if (!validationResult.valid) {
            const errorMessages = validationResult.errors
                .map(err => `${err.field}: ${err.message}`)
                .join(', ');
            throw new Error(`Configuration validation failed: ${errorMessages}`);
        }
        this.currentConfig = config;
        return config;
    }
    validateConfig(config) {
        const errors = [];
        // Validate schema
        if (!exports.configSchema.validateSystemConfig(config)) {
            errors.push({
                field: 'config',
                message: 'Configuration does not match expected schema',
                severity: 'error'
            });
        }
        // Validate compatibility between frontend and backend
        const compatibilityErrors = this.validateCompatibility(config);
        errors.push(...compatibilityErrors);
        // Detect missing required environment variables
        const missingVarErrors = this.detectMissingVariables(config);
        errors.push(...missingVarErrors);
        return {
            valid: errors.filter(e => e.severity === 'error').length === 0,
            errors
        };
    }
    async updateConfig(updates) {
        if (!this.currentConfig) {
            throw new Error('No configuration loaded. Call loadConfig first.');
        }
        const updatedConfig = {
            ...this.currentConfig,
            ...updates,
            frontend: { ...this.currentConfig.frontend, ...updates.frontend },
            backend: { ...this.currentConfig.backend, ...updates.backend },
            shared: { ...this.currentConfig.shared, ...updates.shared }
        };
        const validationResult = this.validateConfig(updatedConfig);
        if (!validationResult.valid) {
            const errorMessages = validationResult.errors
                .filter(e => e.severity === 'error')
                .map(err => `${err.field}: ${err.message}`)
                .join(', ');
            throw new Error(`Configuration update validation failed: ${errorMessages}`);
        }
        this.currentConfig = updatedConfig;
    }
    getApplicationConfig(app, env) {
        if (!this.currentConfig || this.currentConfig.shared.environment !== env) {
            throw new Error(`Configuration for ${app} in ${env} environment not loaded`);
        }
        if (app === 'frontend') {
            return this.currentConfig.frontend;
        }
        else if (app === 'backend') {
            return this.currentConfig.backend;
        }
        else {
            throw new Error(`Cannot get config for 'both' - specify 'frontend' or 'backend'`);
        }
    }
    loadFrontendConfig(environment) {
        const firebaseConfig = this.loadFirebaseConfig(environment);
        return {
            apiEndpoint: this.getRequiredEnvVar('FRONTEND_API_ENDPOINT', environment, 'frontend'),
            firebaseConfig,
            buildOutputPath: process.env.FRONTEND_BUILD_OUTPUT || 'varaus/public',
            devServerPort: parseInt(process.env.FRONTEND_DEV_PORT || '8080', 10)
        };
    }
    loadBackendConfig(environment) {
        const firebaseConfig = this.loadFirebaseConfig(environment);
        return {
            port: parseInt(this.getRequiredEnvVar('BACKEND_PORT', environment, 'backend'), 10),
            firebaseConfig,
            corsOrigins: this.parseCorsOrigins(environment),
            logLevel: (process.env.BACKEND_LOG_LEVEL || 'info')
        };
    }
    loadFirebaseConfig(environment) {
        const prefix = environment.toUpperCase();
        return {
            apiKey: this.getRequiredEnvVar(`${prefix}_FIREBASE_API_KEY`, environment, 'both applications'),
            authDomain: this.getRequiredEnvVar(`${prefix}_FIREBASE_AUTH_DOMAIN`, environment, 'both applications'),
            databaseURL: this.getRequiredEnvVar(`${prefix}_FIREBASE_DATABASE_URL`, environment, 'both applications'),
            projectId: this.getRequiredEnvVar(`${prefix}_FIREBASE_PROJECT_ID`, environment, 'both applications'),
            storageBucket: this.getRequiredEnvVar(`${prefix}_FIREBASE_STORAGE_BUCKET`, environment, 'both applications'),
            messagingSenderId: this.getRequiredEnvVar(`${prefix}_FIREBASE_MESSAGING_SENDER_ID`, environment, 'both applications'),
            appId: this.getRequiredEnvVar(`${prefix}_FIREBASE_APP_ID`, environment, 'both applications')
        };
    }
    parseCorsOrigins(environment) {
        const corsEnvVar = process.env.BACKEND_CORS_ORIGINS;
        if (!corsEnvVar) {
            // Default CORS origins based on environment
            if (environment === 'development') {
                return ['http://localhost:8080'];
            }
            else if (environment === 'staging') {
                return ['https://staging.varaus.example.com'];
            }
            else {
                return ['https://varaus.example.com'];
            }
        }
        return corsEnvVar.split(',').map(origin => origin.trim());
    }
    getRequiredEnvVar(varName, environment, application) {
        const value = process.env[varName];
        if (!value) {
            const appInfo = application || this.determineApplicationForVar(varName);
            throw new Error(`Missing required environment variable: ${varName} (required by ${appInfo} for ${environment} environment)`);
        }
        return value;
    }
    validateCompatibility(config) {
        const errors = [];
        // Check that both applications use the same Firebase instance
        const frontendFirebase = config.frontend.firebaseConfig;
        const backendFirebase = config.backend.firebaseConfig;
        if (frontendFirebase.projectId !== backendFirebase.projectId) {
            errors.push({
                field: 'firebaseConfig.projectId',
                message: `Frontend and backend must use the same Firebase project. Frontend: ${frontendFirebase.projectId}, Backend: ${backendFirebase.projectId}`,
                severity: 'error'
            });
        }
        if (frontendFirebase.databaseURL !== backendFirebase.databaseURL) {
            errors.push({
                field: 'firebaseConfig.databaseURL',
                message: `Frontend and backend must use the same Firebase database. Frontend: ${frontendFirebase.databaseURL}, Backend: ${backendFirebase.databaseURL}`,
                severity: 'error'
            });
        }
        // Check that frontend API endpoint matches backend configuration
        const backendUrl = `http://localhost:${config.backend.port}`;
        if (config.shared.environment === 'development' && !config.frontend.apiEndpoint.includes(`${config.backend.port}`)) {
            errors.push({
                field: 'frontend.apiEndpoint',
                message: `Frontend API endpoint (${config.frontend.apiEndpoint}) should point to backend port ${config.backend.port} in development`,
                severity: 'warning'
            });
        }
        // Check CORS configuration
        const frontendOrigin = config.shared.environment === 'development'
            ? `http://localhost:${config.frontend.devServerPort}`
            : config.frontend.apiEndpoint.replace(/\/api.*$/, '');
        if (!config.backend.corsOrigins.includes(frontendOrigin)) {
            errors.push({
                field: 'backend.corsOrigins',
                message: `Backend CORS origins should include frontend origin: ${frontendOrigin}`,
                severity: 'warning'
            });
        }
        return errors;
    }
    detectMissingVariables(config) {
        const errors = [];
        const environment = config.shared.environment;
        // Check required variables for each application
        const requiredVars = this.getRequiredVariables(environment);
        for (const varName of requiredVars) {
            if (!process.env[varName]) {
                const application = this.determineApplicationForVar(varName);
                errors.push({
                    field: varName,
                    message: `Missing required environment variable: ${varName} (required by ${application})`,
                    severity: 'error'
                });
            }
        }
        return errors;
    }
    getRequiredVariables(environment) {
        const prefix = environment.toUpperCase();
        return [
            'FRONTEND_API_ENDPOINT',
            'BACKEND_PORT',
            `${prefix}_FIREBASE_API_KEY`,
            `${prefix}_FIREBASE_AUTH_DOMAIN`,
            `${prefix}_FIREBASE_DATABASE_URL`,
            `${prefix}_FIREBASE_PROJECT_ID`,
            `${prefix}_FIREBASE_STORAGE_BUCKET`,
            `${prefix}_FIREBASE_MESSAGING_SENDER_ID`,
            `${prefix}_FIREBASE_APP_ID`
        ];
    }
    determineApplicationForVar(varName) {
        if (varName.startsWith('FRONTEND_')) {
            return 'frontend';
        }
        else if (varName.startsWith('BACKEND_')) {
            return 'backend';
        }
        else if (varName.includes('FIREBASE')) {
            return 'both applications';
        }
        return 'unknown';
    }
}
exports.ConfigManager = ConfigManager;
// Export a singleton instance
exports.configManager = new ConfigManager();
