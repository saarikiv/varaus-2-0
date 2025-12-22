/**
 * Dependency compatibility checker for frontend and backend applications
 */
export interface DependencyVersions {
    [packageName: string]: string;
}
export interface PackageJsonWithDeps {
    name: string;
    dependencies?: DependencyVersions;
    devDependencies?: DependencyVersions;
}
export interface DependencyConflict {
    packageName: string;
    frontendVersion: string;
    backendVersion: string;
    compatible: boolean;
    message: string;
}
/**
 * Extracts major version from a semver string
 */
export declare function extractMajorVersion(versionString: string): number | null;
/**
 * Checks if two version strings are compatible
 * Compatible means they share the same major version
 */
export declare function areVersionsCompatible(version1: string, version2: string): boolean;
/**
 * Finds shared dependencies between frontend and backend
 */
export declare function findSharedDependencies(frontendPkg: PackageJsonWithDeps, backendPkg: PackageJsonWithDeps): string[];
/**
 * Checks for dependency conflicts between frontend and backend
 */
export declare function checkDependencyCompatibility(frontendPkg: PackageJsonWithDeps, backendPkg: PackageJsonWithDeps): DependencyConflict[];
/**
 * Validates that all shared dependencies are compatible
 */
export declare function validateDependencyCompatibility(frontendPkg: PackageJsonWithDeps, backendPkg: PackageJsonWithDeps): {
    compatible: boolean;
    conflicts: DependencyConflict[];
    message: string;
};
