"use strict";
/**
 * Dependency compatibility checker for frontend and backend applications
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractMajorVersion = extractMajorVersion;
exports.areVersionsCompatible = areVersionsCompatible;
exports.findSharedDependencies = findSharedDependencies;
exports.checkDependencyCompatibility = checkDependencyCompatibility;
exports.validateDependencyCompatibility = validateDependencyCompatibility;
/**
 * Extracts major version from a semver string
 */
function extractMajorVersion(versionString) {
    // Remove common prefixes like ^, ~, >=, etc.
    const cleaned = versionString.replace(/^[\^~>=<]+/, '');
    const match = cleaned.match(/^(\d+)/);
    return match ? parseInt(match[1], 10) : null;
}
/**
 * Checks if two version strings are compatible
 * Compatible means they share the same major version
 */
function areVersionsCompatible(version1, version2) {
    const major1 = extractMajorVersion(version1);
    const major2 = extractMajorVersion(version2);
    if (major1 === null || major2 === null) {
        // If we can't parse versions, assume incompatible
        return false;
    }
    return major1 === major2;
}
/**
 * Finds shared dependencies between frontend and backend
 */
function findSharedDependencies(frontendPkg, backendPkg) {
    const frontendDeps = new Set([
        ...Object.keys(frontendPkg.dependencies || {}),
        ...Object.keys(frontendPkg.devDependencies || {})
    ]);
    const backendDeps = new Set([
        ...Object.keys(backendPkg.dependencies || {}),
        ...Object.keys(backendPkg.devDependencies || {})
    ]);
    return Array.from(frontendDeps).filter(dep => backendDeps.has(dep));
}
/**
 * Checks for dependency conflicts between frontend and backend
 */
function checkDependencyCompatibility(frontendPkg, backendPkg) {
    const sharedDeps = findSharedDependencies(frontendPkg, backendPkg);
    const conflicts = [];
    for (const depName of sharedDeps) {
        const frontendVersion = frontendPkg.dependencies?.[depName] ||
            frontendPkg.devDependencies?.[depName] ||
            '';
        const backendVersion = backendPkg.dependencies?.[depName] ||
            backendPkg.devDependencies?.[depName] ||
            '';
        const compatible = areVersionsCompatible(frontendVersion, backendVersion);
        conflicts.push({
            packageName: depName,
            frontendVersion,
            backendVersion,
            compatible,
            message: compatible
                ? `${depName}: Compatible versions (frontend: ${frontendVersion}, backend: ${backendVersion})`
                : `${depName}: Incompatible versions (frontend: ${frontendVersion}, backend: ${backendVersion})`
        });
    }
    return conflicts;
}
/**
 * Validates that all shared dependencies are compatible
 */
function validateDependencyCompatibility(frontendPkg, backendPkg) {
    const conflicts = checkDependencyCompatibility(frontendPkg, backendPkg);
    const incompatible = conflicts.filter(c => !c.compatible);
    return {
        compatible: incompatible.length === 0,
        conflicts: incompatible,
        message: incompatible.length === 0
            ? `All ${conflicts.length} shared dependencies are compatible`
            : `Found ${incompatible.length} incompatible dependencies: ${incompatible.map(c => c.packageName).join(', ')}`
    };
}
