/**
 * Property-based tests for dependency compatibility checking
 * **Feature: full-stack-coordination, Property 10: Dependency Compatibility Checking**
 * **Validates: Requirements 5.1, 5.4**
 */
import { expect } from 'chai';
import * as fc from 'fast-check';
import {
  extractMajorVersion,
  areVersionsCompatible,
  findSharedDependencies,
  checkDependencyCompatibility,
  validateDependencyCompatibility,
  PackageJsonWithDeps,
  DependencyVersions
} from '../../src/config/dependency-checker';

describe('Property 10: Dependency Compatibility Checking', () => {
  // Arbitraries for generating test data
  const versionArbitrary = fc.oneof(
    fc.tuple(fc.integer({ min: 1, max: 20 }), fc.integer({ min: 0, max: 50 }), fc.integer({ min: 0, max: 50 }))
      .map(([major, minor, patch]) => `${major}.${minor}.${patch}`),
    fc.tuple(fc.integer({ min: 1, max: 20 }), fc.integer({ min: 0, max: 50 }), fc.integer({ min: 0, max: 50 }))
      .map(([major, minor, patch]) => `^${major}.${minor}.${patch}`),
    fc.tuple(fc.integer({ min: 1, max: 20 }), fc.integer({ min: 0, max: 50 }), fc.integer({ min: 0, max: 50 }))
      .map(([major, minor, patch]) => `~${major}.${minor}.${patch}`),
    fc.tuple(fc.integer({ min: 1, max: 20 }), fc.integer({ min: 0, max: 50 }), fc.integer({ min: 0, max: 50 }))
      .map(([major, minor, patch]) => `>=${major}.${minor}.${patch}`)
  );

  const packageNameArbitrary = fc.oneof(
    fc.constant('react'),
    fc.constant('lodash'),
    fc.constant('axios'),
    fc.constant('express'),
    fc.constant('webpack'),
    fc.constant('babel-core'),
    fc.constant('typescript'),
    fc.constant('mocha')
  );

  const dependenciesArbitrary = fc.dictionary(
    packageNameArbitrary,
    versionArbitrary,
    { minKeys: 0, maxKeys: 5 }
  );

  const packageJsonArbitrary = (name: string): fc.Arbitrary<PackageJsonWithDeps> =>
    fc.record({
      name: fc.constant(name),
      dependencies: fc.option(dependenciesArbitrary, { nil: undefined }),
      devDependencies: fc.option(dependenciesArbitrary, { nil: undefined })
    }) as fc.Arbitrary<PackageJsonWithDeps>;

  describe('extractMajorVersion', () => {
    it('should extract major version from any valid semver string', function() {
      this.timeout(10000); // Increase timeout for property test
      fc.assert(
        fc.property(versionArbitrary, (version: string) => {
          const major = extractMajorVersion(version);
          expect(major).to.be.a('number');
          expect(major).to.be.greaterThan(0);
        }),
        { numRuns: 100 }
      );
    });

    it('should extract the same major version regardless of prefix', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 20 }),
          fc.integer({ min: 0, max: 50 }),
          fc.integer({ min: 0, max: 50 }),
          (major: number, minor: number, patch: number) => {
            const versions = [
              `${major}.${minor}.${patch}`,
              `^${major}.${minor}.${patch}`,
              `~${major}.${minor}.${patch}`,
              `>=${major}.${minor}.${patch}`
            ];
            
            const extractedVersions = versions.map(v => extractMajorVersion(v));
            const allSame = extractedVersions.every(v => v === major);
            expect(allSame).to.be.true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('areVersionsCompatible', () => {
    it('should consider versions with same major version as compatible', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 20 }),
          fc.integer({ min: 0, max: 50 }),
          fc.integer({ min: 0, max: 50 }),
          fc.integer({ min: 0, max: 50 }),
          fc.integer({ min: 0, max: 50 }),
          (major: number, minor1: number, patch1: number, minor2: number, patch2: number) => {
            const version1 = `^${major}.${minor1}.${patch1}`;
            const version2 = `~${major}.${minor2}.${patch2}`;
            const compatible = areVersionsCompatible(version1, version2);
            expect(compatible).to.be.true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should consider versions with different major versions as incompatible', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 10 }),
          fc.integer({ min: 11, max: 20 }),
          fc.integer({ min: 0, max: 50 }),
          fc.integer({ min: 0, max: 50 }),
          (major1: number, major2: number, minor: number, patch: number) => {
            const version1 = `${major1}.${minor}.${patch}`;
            const version2 = `${major2}.${minor}.${patch}`;
            const compatible = areVersionsCompatible(version1, version2);
            expect(compatible).to.be.false;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('findSharedDependencies', () => {
    it('should find all dependencies that exist in both packages', () => {
      fc.assert(
        fc.property(
          packageJsonArbitrary('frontend'),
          packageJsonArbitrary('backend'),
          (frontendPkg: PackageJsonWithDeps, backendPkg: PackageJsonWithDeps) => {
            const shared = findSharedDependencies(frontendPkg, backendPkg);
            
            // Every shared dependency should exist in both packages
            shared.forEach(dep => {
              const inFrontend = 
                (frontendPkg.dependencies && dep in frontendPkg.dependencies) ||
                (frontendPkg.devDependencies && dep in frontendPkg.devDependencies);
              const inBackend = 
                (backendPkg.dependencies && dep in backendPkg.dependencies) ||
                (backendPkg.devDependencies && dep in backendPkg.devDependencies);
              
              expect(inFrontend).to.be.true;
              expect(inBackend).to.be.true;
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return empty array when packages have no shared dependencies', () => {
      const frontendPkg: PackageJsonWithDeps = {
        name: 'frontend',
        dependencies: { 'react': '^18.0.0' }
      };
      const backendPkg: PackageJsonWithDeps = {
        name: 'backend',
        dependencies: { 'express': '^4.0.0' }
      };
      
      const shared = findSharedDependencies(frontendPkg, backendPkg);
      expect(shared).to.be.an('array').that.is.empty;
    });
  });

  describe('checkDependencyCompatibility', () => {
    it('should return a conflict entry for each shared dependency', function() {
      this.timeout(10000); // Increase timeout for property test
      fc.assert(
        fc.property(
          packageJsonArbitrary('frontend'),
          packageJsonArbitrary('backend'),
          (frontendPkg: PackageJsonWithDeps, backendPkg: PackageJsonWithDeps) => {
            const conflicts = checkDependencyCompatibility(frontendPkg, backendPkg);
            const shared = findSharedDependencies(frontendPkg, backendPkg);
            
            expect(conflicts.length).to.equal(shared.length);
            
            conflicts.forEach(conflict => {
              expect(conflict).to.have.property('packageName');
              expect(conflict).to.have.property('frontendVersion');
              expect(conflict).to.have.property('backendVersion');
              expect(conflict).to.have.property('compatible').that.is.a('boolean');
              expect(conflict).to.have.property('message').that.is.a('string');
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should correctly identify compatible versions', () => {
      const major = 18;
      const frontendPkg: PackageJsonWithDeps = {
        name: 'frontend',
        dependencies: { 'react': `^${major}.0.0` }
      };
      const backendPkg: PackageJsonWithDeps = {
        name: 'backend',
        dependencies: { 'react': `~${major}.2.0` }
      };
      
      const conflicts = checkDependencyCompatibility(frontendPkg, backendPkg);
      expect(conflicts).to.have.lengthOf(1);
      expect(conflicts[0].compatible).to.be.true;
    });

    it('should correctly identify incompatible versions', () => {
      const frontendPkg: PackageJsonWithDeps = {
        name: 'frontend',
        dependencies: { 'react': '^15.0.0' }
      };
      const backendPkg: PackageJsonWithDeps = {
        name: 'backend',
        dependencies: { 'react': '^18.0.0' }
      };
      
      const conflicts = checkDependencyCompatibility(frontendPkg, backendPkg);
      expect(conflicts).to.have.lengthOf(1);
      expect(conflicts[0].compatible).to.be.false;
    });
  });

  describe('validateDependencyCompatibility', () => {
    it('should report compatible when all shared dependencies have matching major versions', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 20 }),
          fc.integer({ min: 0, max: 50 }),
          fc.integer({ min: 0, max: 50 }),
          (major: number, minor1: number, minor2: number) => {
            const frontendPkg: PackageJsonWithDeps = {
              name: 'frontend',
              dependencies: { 'lodash': `^${major}.${minor1}.0` }
            };
            const backendPkg: PackageJsonWithDeps = {
              name: 'backend',
              dependencies: { 'lodash': `~${major}.${minor2}.0` }
            };
            
            const result = validateDependencyCompatibility(frontendPkg, backendPkg);
            expect(result.compatible).to.be.true;
            expect(result.conflicts).to.be.empty;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should report incompatible when any shared dependency has different major versions', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 10 }),
          fc.integer({ min: 11, max: 20 }),
          (major1: number, major2: number) => {
            const frontendPkg: PackageJsonWithDeps = {
              name: 'frontend',
              dependencies: { 'axios': `^${major1}.0.0` }
            };
            const backendPkg: PackageJsonWithDeps = {
              name: 'backend',
              dependencies: { 'axios': `^${major2}.0.0` }
            };
            
            const result = validateDependencyCompatibility(frontendPkg, backendPkg);
            expect(result.compatible).to.be.false;
            expect(result.conflicts).to.have.lengthOf(1);
            expect(result.conflicts[0].packageName).to.equal('axios');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should be compatible when packages have no shared dependencies', () => {
      fc.assert(
        fc.property(
          packageJsonArbitrary('frontend'),
          (frontendPkg: PackageJsonWithDeps) => {
            const backendPkg: PackageJsonWithDeps = {
              name: 'backend',
              dependencies: { 'express': '^4.0.0' }
            };
            
            // Ensure no overlap by using a dependency that won't be in the arbitrary
            const result = validateDependencyCompatibility(frontendPkg, backendPkg);
            
            // If there are no shared dependencies, should be compatible
            if (findSharedDependencies(frontendPkg, backendPkg).length === 0) {
              expect(result.compatible).to.be.true;
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
