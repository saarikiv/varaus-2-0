/**
 * Build Coordinator Module
 * Manages coordinated building of frontend and backend applications
 */
import { ApplicationName } from '../types';
import { SystemConfig } from '../config';
export interface BuildCoordinator {
    buildApplication(app: ApplicationName, config: SystemConfig): Promise<ApplicationBuildResult>;
    buildAll(config: SystemConfig): Promise<BuildAllResult>;
}
export interface ApplicationBuildResult {
    success: boolean;
    application: ApplicationName;
    artifacts: BuildArtifactInfo[];
    duration: number;
    errors?: BuildErrorInfo[];
    output: string;
}
export interface BuildAllResult {
    success: boolean;
    backend: ApplicationBuildResult;
    frontend: ApplicationBuildResult;
    totalDuration: number;
}
export interface BuildArtifactInfo {
    application: ApplicationName;
    path: string;
    size: number;
    hash: string;
}
export interface BuildErrorInfo {
    application: ApplicationName;
    phase: 'configuration' | 'compilation' | 'bundling' | 'asset-processing';
    message: string;
    file?: string;
    line?: number;
    column?: number;
    details?: string;
}
/**
 * Build Coordinator Implementation
 */
export declare class BuildCoordinatorImpl implements BuildCoordinator {
    private projectRoot;
    constructor(projectRoot?: string);
    /**
     * Build a single application with environment-specific configuration
     */
    buildApplication(app: ApplicationName, config: SystemConfig): Promise<ApplicationBuildResult>;
    /**
     * Build all applications in correct dependency order
     * Backend is built first, then frontend
     */
    buildAll(config: SystemConfig): Promise<BuildAllResult>;
    /**
     * Get application directory path
     */
    private getApplicationDirectory;
    /**
     * Build environment variables for the application
     */
    private buildEnvironment;
    /**
     * Execute build command for an application
     */
    private executeBuild;
    /**
     * Parse build errors from build output
     */
    private parseBuildErrors;
}
export declare const buildCoordinator: BuildCoordinatorImpl;
