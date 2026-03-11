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
export declare const configSchema: ConfigSchema;
/**
 * Validates that a value is a valid Environment.
 */
export declare function isValidEnvironment(value: unknown): value is Environment;
/**
 * Validates that a value is a valid FirebaseConfig with all 7 required string fields.
 */
export declare function isValidFirebaseConfig(value: unknown): value is FirebaseConfig;
/**
 * Validates a FrontendConfig, returning aggregated errors.
 */
export declare function isValidFrontendConfig(value: unknown): {
    valid: boolean;
    errors: string[];
};
/**
 * Validates a BackendConfig, returning aggregated errors.
 */
export declare function isValidBackendConfig(value: unknown): {
    valid: boolean;
    errors: string[];
};
/**
 * Validates a full SystemConfig, returning aggregated errors.
 */
export declare function isValidSystemConfig(value: unknown): {
    valid: boolean;
    errors: string[];
};
/**
 * Top-level schema validation that aggregates all validation errors.
 * This is the main entry point for schema validation.
 */
export declare function validateConfigSchema(config: unknown): {
    valid: boolean;
    errors: string[];
};
/**
 * Configuration Manager Implementation
 */
export declare class ConfigManager implements ConfigurationManager {
    private currentConfig;
    private projectRoot;
    constructor(projectRoot?: string);
    loadConfig(environment: Environment): Promise<SystemConfig>;
    validateConfig(config: SystemConfig): ValidationResult;
    updateConfig(updates: Partial<SystemConfig>): Promise<void>;
    getApplicationConfig(app: ApplicationName, env: Environment): ApplicationConfig;
    private loadFrontendConfig;
    private loadBackendConfig;
    private loadFirebaseConfig;
    private parseCorsOrigins;
    private getRequiredEnvVar;
    private validateCompatibility;
    private detectMissingVariables;
    getRequiredVariables(environment: Environment): string[];
    private determineApplicationForVar;
}
export declare const configManager: ConfigManager;
export * from './dependency-checker';
export * from './version-checker';
