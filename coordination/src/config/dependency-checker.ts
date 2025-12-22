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
export function extractMajorVersion(versionString: string): number | null {
  // Remove common prefixes like ^, ~, >=, etc.
  const cleaned = versionString.replace(/^[\^~>=<]+/, '');
  const match = cleaned.match(/^(\d+)/);
  return match ? parseInt(match[1], 10) : null;
}

/**
 * Checks if two version strings are compatible
 * Compatible means they share the same major version
 */
export function areVersionsCompatible(version1: string, version2: string): boolean {
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
export function findSharedDependencies(
  frontendPkg: PackageJsonWithDeps,
  backendPkg: PackageJsonWithDeps
): string[] {
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
export function checkDependencyCompatibility(
  frontendPkg: PackageJsonWithDeps,
  backendPkg: PackageJsonWithDeps
): DependencyConflict[] {
  const sharedDeps = findSharedDependencies(frontendPkg, backendPkg);
  const conflicts: DependencyConflict[] = [];
  
  for (const depName of sharedDeps) {
    const frontendVersion = 
      frontendPkg.dependencies?.[depName] || 
      frontendPkg.devDependencies?.[depName] || 
      '';
    const backendVersion = 
      backendPkg.dependencies?.[depName] || 
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
export function validateDependencyCompatibility(
  frontendPkg: PackageJsonWithDeps,
  backendPkg: PackageJsonWithDeps
): { compatible: boolean; conflicts: DependencyConflict[]; message: string } {
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
