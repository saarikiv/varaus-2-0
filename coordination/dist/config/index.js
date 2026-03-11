"use strict";
/**
 * Configuration Manager Module
 * Manages environment-specific configurations and ensures compatibility
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
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.configManager = exports.ConfigManager = exports.configSchema = void 0;
exports.isValidEnvironment = isValidEnvironment;
exports.isValidFirebaseConfig = isValidFirebaseConfig;
exports.isValidFrontendConfig = isValidFrontendConfig;
exports.isValidBackendConfig = isValidBackendConfig;
exports.isValidSystemConfig = isValidSystemConfig;
exports.validateConfigSchema = validateConfigSchema;
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
// ─── Standalone Schema Validation Functions ──────────────────────────────────
const VALID_ENVIRONMENTS = ['development', 'staging', 'production'];
const VALID_LOG_LEVELS = ['debug', 'info', 'warn', 'error'];
const FIREBASE_REQUIRED_FIELDS = [
    'apiKey', 'authDomain', 'databaseURL', 'projectId',
    'storageBucket', 'messagingSenderId', 'appId'
];
/**
 * Validates that a value is a valid Environment.
 */
function isValidEnvironment(value) {
    return typeof value === 'string' && VALID_ENVIRONMENTS.includes(value);
}
/**
 * Validates that a value is a valid FirebaseConfig with all 7 required string fields.
 */
function isValidFirebaseConfig(value) {
    if (typeof value !== 'object' || value === null)
        return false;
    const obj = value;
    return FIREBASE_REQUIRED_FIELDS.every(field => typeof obj[field] === 'string');
}
/**
 * Validates a FrontendConfig, returning aggregated errors.
 */
function isValidFrontendConfig(value) {
    const errors = [];
    if (typeof value !== 'object' || value === null) {
        errors.push('FrontendConfig must be an object');
        return { valid: false, errors };
    }
    const obj = value;
    if (typeof obj.apiEndpoint !== 'string') {
        errors.push('FrontendConfig.apiEndpoint must be a string');
    }
    if (typeof obj.buildOutputPath !== 'string') {
        errors.push('FrontendConfig.buildOutputPath must be a string');
    }
    if (typeof obj.devServerPort !== 'number') {
        errors.push('FrontendConfig.devServerPort must be a number');
    }
    if (!isValidFirebaseConfig(obj.firebaseConfig)) {
        errors.push('FrontendConfig.firebaseConfig is invalid or missing required fields');
    }
    return { valid: errors.length === 0, errors };
}
/**
 * Validates a BackendConfig, returning aggregated errors.
 */
function isValidBackendConfig(value) {
    const errors = [];
    if (typeof value !== 'object' || value === null) {
        errors.push('BackendConfig must be an object');
        return { valid: false, errors };
    }
    const obj = value;
    if (typeof obj.port !== 'number') {
        errors.push('BackendConfig.port must be a number');
    }
    if (typeof obj.logLevel !== 'string' || !VALID_LOG_LEVELS.includes(obj.logLevel)) {
        errors.push('BackendConfig.logLevel must be one of: debug, info, warn, error');
    }
    if (!Array.isArray(obj.corsOrigins) || !obj.corsOrigins.every((o) => typeof o === 'string')) {
        errors.push('BackendConfig.corsOrigins must be an array of strings');
    }
    if (!isValidFirebaseConfig(obj.firebaseConfig)) {
        errors.push('BackendConfig.firebaseConfig is invalid or missing required fields');
    }
    return { valid: errors.length === 0, errors };
}
/**
 * Validates a full SystemConfig, returning aggregated errors.
 */
function isValidSystemConfig(value) {
    const errors = [];
    if (typeof value !== 'object' || value === null) {
        errors.push('SystemConfig must be an object');
        return { valid: false, errors };
    }
    const obj = value;
    // Validate frontend
    const frontendResult = isValidFrontendConfig(obj.frontend);
    errors.push(...frontendResult.errors);
    // Validate backend
    const backendResult = isValidBackendConfig(obj.backend);
    errors.push(...backendResult.errors);
    // Validate shared
    if (typeof obj.shared !== 'object' || obj.shared === null) {
        errors.push('SystemConfig.shared must be an object');
    }
    else {
        const shared = obj.shared;
        if (!isValidEnvironment(shared.environment)) {
            errors.push('SystemConfig.shared.environment must be one of: development, staging, production');
        }
        if (typeof shared.projectRoot !== 'string') {
            errors.push('SystemConfig.shared.projectRoot must be a string');
        }
    }
    return { valid: errors.length === 0, errors };
}
/**
 * Top-level schema validation that aggregates all validation errors.
 * This is the main entry point for schema validation.
 */
function validateConfigSchema(config) {
    return isValidSystemConfig(config);
}
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
                .filter(err => err.severity === 'error')
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
        const schemaResult = validateConfigSchema(config);
        if (!schemaResult.valid) {
            for (const errMsg of schemaResult.errors) {
                errors.push({
                    field: 'config',
                    message: errMsg,
                    severity: 'error'
                });
            }
        }
        // Validate compatibility between frontend and backend
        const compatibilityErrors = this.validateCompatibility(config);
        errors.push(...compatibilityErrors);
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
// Re-export sub-modules
__exportStar(require("./dependency-checker"), exports);
__exportStar(require("./version-checker"), exports);
