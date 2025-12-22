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
    private getRequiredVariables;
    private determineApplicationForVar;
}
export declare const configManager: ConfigManager;
