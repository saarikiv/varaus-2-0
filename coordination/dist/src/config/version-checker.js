"use strict";
/**
 * Version compatibility checker for Node.js and application dependencies
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseMajorVersionRequirement = parseMajorVersionRequirement;
exports.checkNodeVersionCompatibility = checkNodeVersionCompatibility;
exports.verifyNodeVersionCompatibility = verifyNodeVersionCompatibility;
exports.checkApplicationsNodeCompatibility = checkApplicationsNodeCompatibility;
/**
 * Parses a semver range string and extracts the major version requirement
 * Supports formats like "20.x", ">=18", "^18.0.0", "18.x || 20.x"
 */
function parseMajorVersionRequirement(versionRange) {
    const versions = [];
    // Handle "||" separated ranges
    const parts = versionRange.split('||').map(p => p.trim());
    for (const part of parts) {
        // Extract numbers from the version string
        const match = part.match(/(\d+)/);
        if (match) {
            const majorVersion = parseInt(match[1], 10);
            if (!isNaN(majorVersion) && !versions.includes(majorVersion)) {
                versions.push(majorVersion);
            }
        }
    }
    return versions.sort((a, b) => a - b);
}
/**
 * Checks if a Node.js version satisfies the engine requirement
 */
function checkNodeVersionCompatibility(currentVersion, requiredRange) {
    const currentMajor = parseInt(currentVersion.split('.')[0], 10);
    const requiredMajors = parseMajorVersionRequirement(requiredRange);
    if (requiredMajors.length === 0) {
        // No specific requirement, assume compatible
        return true;
    }
    // Check if current major version matches any required major version
    // Also handle "x" suffix which means any minor/patch version is acceptable
    if (requiredRange.includes('.x') || requiredRange.includes('.*')) {
        return requiredMajors.includes(currentMajor);
    }
    // Handle >= operator
    if (requiredRange.startsWith('>=')) {
        const minVersion = requiredMajors[0];
        return currentMajor >= minVersion;
    }
    // Handle ^ operator (compatible with major version)
    if (requiredRange.startsWith('^')) {
        return requiredMajors.includes(currentMajor);
    }
    // Default: exact major version match
    return requiredMajors.includes(currentMajor);
}
/**
 * Verifies Node.js version compatibility for both applications
 */
function verifyNodeVersionCompatibility(frontendPackage, backendPackage, currentNodeVersion) {
    const results = [];
    // Check frontend
    if (frontendPackage.engines?.node) {
        const compatible = checkNodeVersionCompatibility(currentNodeVersion, frontendPackage.engines.node);
        results.push({
            compatible,
            application: frontendPackage.name,
            requiredVersion: frontendPackage.engines.node,
            currentVersion: currentNodeVersion,
            message: compatible
                ? `Node.js ${currentNodeVersion} is compatible with ${frontendPackage.name} (requires ${frontendPackage.engines.node})`
                : `Node.js ${currentNodeVersion} is NOT compatible with ${frontendPackage.name} (requires ${frontendPackage.engines.node})`
        });
    }
    // Check backend
    if (backendPackage.engines?.node) {
        const compatible = checkNodeVersionCompatibility(currentNodeVersion, backendPackage.engines.node);
        results.push({
            compatible,
            application: backendPackage.name,
            requiredVersion: backendPackage.engines.node,
            currentVersion: currentNodeVersion,
            message: compatible
                ? `Node.js ${currentNodeVersion} is compatible with ${backendPackage.name} (requires ${backendPackage.engines.node})`
                : `Node.js ${currentNodeVersion} is NOT compatible with ${backendPackage.name} (requires ${backendPackage.engines.node})`
        });
    }
    return results;
}
/**
 * Checks if both applications have compatible Node.js requirements
 */
function checkApplicationsNodeCompatibility(frontendPackage, backendPackage) {
    const frontendVersions = frontendPackage.engines?.node
        ? parseMajorVersionRequirement(frontendPackage.engines.node)
        : [];
    const backendVersions = backendPackage.engines?.node
        ? parseMajorVersionRequirement(backendPackage.engines.node)
        : [];
    // If either has no requirement, they're compatible
    if (frontendVersions.length === 0 || backendVersions.length === 0) {
        return {
            compatible: true,
            commonVersions: frontendVersions.length > 0 ? frontendVersions : backendVersions,
            message: 'Applications are compatible (one or both have no Node.js version requirement)'
        };
    }
    // Find common versions
    const commonVersions = frontendVersions.filter(v => backendVersions.includes(v));
    return {
        compatible: commonVersions.length > 0,
        commonVersions,
        message: commonVersions.length > 0
            ? `Applications are compatible with Node.js versions: ${commonVersions.join(', ')}`
            : `Applications have incompatible Node.js requirements: frontend requires ${frontendPackage.engines?.node}, backend requires ${backendPackage.engines?.node}`
    };
}
