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
 * Parses a semver range string and extracts the set of major versions that satisfy it.
 * Supports formats: "20.x", ">=18", "^18.0.0", "18.x || 20.x", and combinations.
 */
export declare function parseMajorVersionRequirement(versionRange: string): number[];
/**
 * Checks if a Node.js version satisfies the engine requirement.
 * Returns true if the current major version is in the set parsed from the requirement.
 */
export declare function checkNodeVersionCompatibility(currentVersion: string, requiredRange: string): boolean;
/**
 * Verifies Node.js version compatibility for both applications.
 * Returns per-application results showing whether each app is compatible.
 */
export declare function verifyNodeVersionCompatibility(frontendPackage: PackageJson, backendPackage: PackageJson, currentNodeVersion: string): VersionCheckResult[];
/**
 * Checks if both applications have compatible Node.js requirements.
 * Finds common satisfying major versions (intersection of parsed version sets).
 */
export declare function checkApplicationsNodeCompatibility(frontendPackage: PackageJson, backendPackage: PackageJson): {
    compatible: boolean;
    commonVersions: number[];
    message: string;
};
