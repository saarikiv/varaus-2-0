"use strict";
/**
 * Version compatibility checker for Node.js and application dependencies
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseMajorVersionRequirement = parseMajorVersionRequirement;
exports.checkNodeVersionCompatibility = checkNodeVersionCompatibility;
exports.verifyNodeVersionCompatibility = verifyNodeVersionCompatibility;
exports.checkApplicationsNodeCompatibility = checkApplicationsNodeCompatibility;
/** Reasonable upper bound for major version expansion of >= ranges */
const MAX_MAJOR_VERSION = 30;
/**
 * Parses a single version range part (no ||) and returns the set of major versions it satisfies.
 * Supports: "20.x", ">=18", "^18.0.0", plain "18"
 */
function parseSingleRange(part) {
    const trimmed = part.trim();
    // Handle ">=" format — e.g. ">=18" means major 18 through MAX
    const geMatch = trimmed.match(/^>=\s*(\d+)/);
    if (geMatch) {
        const min = parseInt(geMatch[1], 10);
        const versions = [];
        for (let v = min; v <= MAX_MAJOR_VERSION; v++) {
            versions.push(v);
        }
        return versions;
    }
    // Handle "^" format — e.g. "^18.0.0" means only major 18
    const caretMatch = trimmed.match(/^\^(\d+)/);
    if (caretMatch) {
        return [parseInt(caretMatch[1], 10)];
    }
    // Handle ".x" / ".*" format — e.g. "20.x" means only major 20
    const dotXMatch = trimmed.match(/^(\d+)\.[x*]/i);
    if (dotXMatch) {
        return [parseInt(dotXMatch[1], 10)];
    }
    // Fallback: extract leading integer — e.g. "18" or "18.0.0"
    const plainMatch = trimmed.match(/^(\d+)/);
    if (plainMatch) {
        return [parseInt(plainMatch[1], 10)];
    }
    return [];
}
/**
 * Parses a semver range string and extracts the set of major versions that satisfy it.
 * Supports formats: "20.x", ">=18", "^18.0.0", "18.x || 20.x", and combinations.
 */
function parseMajorVersionRequirement(versionRange) {
    const parts = versionRange.split('||');
    const versionSet = new Set();
    for (const part of parts) {
        for (const v of parseSingleRange(part)) {
            versionSet.add(v);
        }
    }
    return Array.from(versionSet).sort((a, b) => a - b);
}
/**
 * Checks if a Node.js version satisfies the engine requirement.
 * Returns true if the current major version is in the set parsed from the requirement.
 */
function checkNodeVersionCompatibility(currentVersion, requiredRange) {
    const currentMajor = parseInt(currentVersion.split('.')[0], 10);
    const requiredMajors = parseMajorVersionRequirement(requiredRange);
    if (requiredMajors.length === 0) {
        // No specific requirement, assume compatible
        return true;
    }
    return requiredMajors.includes(currentMajor);
}
/**
 * Verifies Node.js version compatibility for both applications.
 * Returns per-application results showing whether each app is compatible.
 */
function verifyNodeVersionCompatibility(frontendPackage, backendPackage, currentNodeVersion) {
    const results = [];
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
 * Checks if both applications have compatible Node.js requirements.
 * Finds common satisfying major versions (intersection of parsed version sets).
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
    // Find common versions (intersection)
    const backendSet = new Set(backendVersions);
    const commonVersions = frontendVersions.filter(v => backendSet.has(v));
    return {
        compatible: commonVersions.length > 0,
        commonVersions,
        message: commonVersions.length > 0
            ? `Applications are compatible with Node.js versions: ${commonVersions.join(', ')}`
            : `Applications have incompatible Node.js requirements: frontend requires ${frontendPackage.engines?.node}, backend requires ${backendPackage.engines?.node}`
    };
}
