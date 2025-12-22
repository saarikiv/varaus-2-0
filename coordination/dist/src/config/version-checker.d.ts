/**
 * Version compatibility checker for Node.js and application dependencies
 */
export interface EngineRequirement {
    node?: string;
}
export interface PackageJson {
    name: string;
    engines?: EngineRequirement;
}
export interface VersionCheckResult {
    compatible: boolean;
    application: string;
    requiredVersion: string;
    currentVersion: string;
    message: string;
}
/**
 * Parses a semver range string and extracts the major version requirement
 * Supports formats like "20.x", ">=18", "^18.0.0", "18.x || 20.x"
 */
export declare function parseMajorVersionRequirement(versionRange: string): number[];
/**
 * Checks if a Node.js version satisfies the engine requirement
 */
export declare function checkNodeVersionCompatibility(currentVersion: string, requiredRange: string): boolean;
/**
 * Verifies Node.js version compatibility for both applications
 */
export declare function verifyNodeVersionCompatibility(frontendPackage: PackageJson, backendPackage: PackageJson, currentNodeVersion: string): VersionCheckResult[];
/**
 * Checks if both applications have compatible Node.js requirements
 */
export declare function checkApplicationsNodeCompatibility(frontendPackage: PackageJson, backendPackage: PackageJson): {
    compatible: boolean;
    commonVersions: number[];
    message: string;
};
