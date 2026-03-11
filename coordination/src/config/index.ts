/**
 * Configuration Manager Module
 * Manages environment-specific configurations and ensures compatibility
 */

import { Environment, ApplicationName, LogLevel, FirebaseConfig } from '../types';

export interface ConfigurationManager {
  loadConfig(environment: Environment): Promise<SystemConfig>;
  validateConfig(config: SystemConfig): ValidationResult;
  updateConfig(updates: Partial<SystemConfig>): Promise<void>;
  getApplicationConfig(app: ApplicationName, env: Environment): ApplicationConfig;
}

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

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

export interface ValidationError {
  field: string;
  message: string;
  severity: 'error' | 'warning';
}

export type ApplicationConfig = FrontendConfig | BackendConfig;

/**
 * Configuration Schema Validators
 */

export interface ConfigSchema {
  validateEnvironment(env: string): env is Environment;
  validateFirebaseConfig(config: any): config is FirebaseConfig;
  validateFrontendConfig(config: any): config is FrontendConfig;
  validateBackendConfig(config: any): config is BackendConfig;
  validateSystemConfig(config: any): config is SystemConfig;
}

export const configSchema: ConfigSchema = {
  validateEnvironment(env: string): env is Environment {
    return ['development', 'staging', 'production'].includes(env);
  },

  validateFirebaseConfig(config: any): config is FirebaseConfig {
    return (
      typeof config === 'object' &&
      typeof config.apiKey === 'string' &&
      typeof config.authDomain === 'string' &&
      typeof config.databaseURL === 'string' &&
      typeof config.projectId === 'string' &&
      typeof config.storageBucket === 'string' &&
      typeof config.messagingSenderId === 'string' &&
      typeof config.appId === 'string'
    );
  },

  validateFrontendConfig(config: any): config is FrontendConfig {
    return (
      typeof config === 'object' &&
      typeof config.apiEndpoint === 'string' &&
      configSchema.validateFirebaseConfig(config.firebaseConfig) &&
      typeof config.buildOutputPath === 'string' &&
      typeof config.devServerPort === 'number'
    );
  },

  validateBackendConfig(config: any): config is BackendConfig {
    return (
      typeof config === 'object' &&
      typeof config.port === 'number' &&
      configSchema.validateFirebaseConfig(config.firebaseConfig) &&
      Array.isArray(config.corsOrigins) &&
      config.corsOrigins.every((origin: any) => typeof origin === 'string') &&
      ['debug', 'info', 'warn', 'error'].includes(config.logLevel)
    );
  },

  validateSystemConfig(config: any): config is SystemConfig {
    return (
      typeof config === 'object' &&
      configSchema.validateFrontendConfig(config.frontend) &&
      configSchema.validateBackendConfig(config.backend) &&
      typeof config.shared === 'object' &&
      configSchema.validateEnvironment(config.shared.environment) &&
      typeof config.shared.projectRoot === 'string'
    );
  }
};

// ─── Standalone Schema Validation Functions ──────────────────────────────────

const VALID_ENVIRONMENTS: readonly string[] = ['development', 'staging', 'production'];
const VALID_LOG_LEVELS: readonly string[] = ['debug', 'info', 'warn', 'error'];
const FIREBASE_REQUIRED_FIELDS: readonly string[] = [
  'apiKey', 'authDomain', 'databaseURL', 'projectId',
  'storageBucket', 'messagingSenderId', 'appId'
];

/**
 * Validates that a value is a valid Environment.
 */
export function isValidEnvironment(value: unknown): value is Environment {
  return typeof value === 'string' && VALID_ENVIRONMENTS.includes(value);
}

/**
 * Validates that a value is a valid FirebaseConfig with all 7 required string fields.
 */
export function isValidFirebaseConfig(value: unknown): value is FirebaseConfig {
  if (typeof value !== 'object' || value === null) return false;
  const obj = value as Record<string, unknown>;
  return FIREBASE_REQUIRED_FIELDS.every(field => typeof obj[field] === 'string');
}

/**
 * Validates a FrontendConfig, returning aggregated errors.
 */
export function isValidFrontendConfig(value: unknown): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (typeof value !== 'object' || value === null) {
    errors.push('FrontendConfig must be an object');
    return { valid: false, errors };
  }

  const obj = value as Record<string, unknown>;

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
export function isValidBackendConfig(value: unknown): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (typeof value !== 'object' || value === null) {
    errors.push('BackendConfig must be an object');
    return { valid: false, errors };
  }

  const obj = value as Record<string, unknown>;

  if (typeof obj.port !== 'number') {
    errors.push('BackendConfig.port must be a number');
  }
  if (typeof obj.logLevel !== 'string' || !VALID_LOG_LEVELS.includes(obj.logLevel)) {
    errors.push('BackendConfig.logLevel must be one of: debug, info, warn, error');
  }
  if (!Array.isArray(obj.corsOrigins) || !obj.corsOrigins.every((o: unknown) => typeof o === 'string')) {
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
export function isValidSystemConfig(value: unknown): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (typeof value !== 'object' || value === null) {
    errors.push('SystemConfig must be an object');
    return { valid: false, errors };
  }

  const obj = value as Record<string, unknown>;

  // Validate frontend
  const frontendResult = isValidFrontendConfig(obj.frontend);
  errors.push(...frontendResult.errors);

  // Validate backend
  const backendResult = isValidBackendConfig(obj.backend);
  errors.push(...backendResult.errors);

  // Validate shared
  if (typeof obj.shared !== 'object' || obj.shared === null) {
    errors.push('SystemConfig.shared must be an object');
  } else {
    const shared = obj.shared as Record<string, unknown>;
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
export function validateConfigSchema(config: unknown): { valid: boolean; errors: string[] } {
  return isValidSystemConfig(config);
}


/**
 * Configuration Manager Implementation
 */

export class ConfigManager implements ConfigurationManager {
  private currentConfig: SystemConfig | null = null;
  private projectRoot: string;

  constructor(projectRoot: string = process.cwd()) {
    this.projectRoot = projectRoot;
  }

  async loadConfig(environment: Environment): Promise<SystemConfig> {
    // Load environment-specific configurations
    const config: SystemConfig = {
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

  validateConfig(config: SystemConfig): ValidationResult {
    const errors: ValidationError[] = [];

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

  async updateConfig(updates: Partial<SystemConfig>): Promise<void> {
    if (!this.currentConfig) {
      throw new Error('No configuration loaded. Call loadConfig first.');
    }

    const updatedConfig: SystemConfig = {
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

  getApplicationConfig(app: ApplicationName, env: Environment): ApplicationConfig {
    if (!this.currentConfig || this.currentConfig.shared.environment !== env) {
      throw new Error(`Configuration for ${app} in ${env} environment not loaded`);
    }

    if (app === 'frontend') {
      return this.currentConfig.frontend;
    } else if (app === 'backend') {
      return this.currentConfig.backend;
    } else {
      throw new Error(`Cannot get config for 'both' - specify 'frontend' or 'backend'`);
    }
  }

  private loadFrontendConfig(environment: Environment): FrontendConfig {
    const firebaseConfig = this.loadFirebaseConfig(environment);
    
    return {
      apiEndpoint: this.getRequiredEnvVar('FRONTEND_API_ENDPOINT', environment, 'frontend'),
      firebaseConfig,
      buildOutputPath: process.env.FRONTEND_BUILD_OUTPUT || 'varaus/public',
      devServerPort: parseInt(process.env.FRONTEND_DEV_PORT || '8080', 10)
    };
  }

  private loadBackendConfig(environment: Environment): BackendConfig {
    const firebaseConfig = this.loadFirebaseConfig(environment);
    
    return {
      port: parseInt(this.getRequiredEnvVar('BACKEND_PORT', environment, 'backend'), 10),
      firebaseConfig,
      corsOrigins: this.parseCorsOrigins(environment),
      logLevel: (process.env.BACKEND_LOG_LEVEL || 'info') as LogLevel
    };
  }

  private loadFirebaseConfig(environment: Environment): FirebaseConfig {
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

  private parseCorsOrigins(environment: Environment): string[] {
    const corsEnvVar = process.env.BACKEND_CORS_ORIGINS;
    if (!corsEnvVar) {
      // Default CORS origins based on environment
      if (environment === 'development') {
        return ['http://localhost:8080'];
      } else if (environment === 'staging') {
        return ['https://staging.varaus.example.com'];
      } else {
        return ['https://varaus.example.com'];
      }
    }
    return corsEnvVar.split(',').map(origin => origin.trim());
  }

  private getRequiredEnvVar(varName: string, environment: Environment, application?: string): string {
    const value = process.env[varName];
    if (!value) {
      const appInfo = application || this.determineApplicationForVar(varName);
      throw new Error(
        `Missing required environment variable: ${varName} (required by ${appInfo} for ${environment} environment)`
      );
    }
    return value;
  }

  private validateCompatibility(config: SystemConfig): ValidationError[] {
    const errors: ValidationError[] = [];

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

  private detectMissingVariables(config: SystemConfig): ValidationError[] {
    const errors: ValidationError[] = [];
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

  getRequiredVariables(environment: Environment): string[] {
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

  private determineApplicationForVar(varName: string): string {
    if (varName.startsWith('FRONTEND_')) {
      return 'frontend';
    } else if (varName.startsWith('BACKEND_')) {
      return 'backend';
    } else if (varName.includes('FIREBASE')) {
      return 'both applications';
    }
    return 'unknown';
  }
}

// Export a singleton instance
export const configManager = new ConfigManager();

// Re-export sub-modules
export * from './dependency-checker';
export * from './version-checker';
