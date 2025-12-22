/**
 * Property-based tests for Node.js version compatibility
 * **Feature: full-stack-coordination, Property 11: Node.js Version Compatibility**
 * **Validates: Requirements 5.2**
 */
import { expect } from 'chai';
import * as fc from 'fast-check';
import { parseMajorVersionRequirement, checkNodeVersionCompatibility, verifyNodeVersionCompatibility, checkApplicationsNodeCompatibility, PackageJson } from '../../src/config/version-checker';

describe('Property 11: Node.js Version Compatibility', () => {
  const semverArbitrary = fc.tuple(fc.integer({ min: 14, max: 22 }), fc.integer({ min: 0, max: 20 }), fc.integer({ min: 0, max: 20 })).map(([major, minor, patch]: [number, number, number]) => major + '.' + minor + '.' + patch);
  const engineRequirementArbitrary = fc.oneof(fc.integer({ min: 14, max: 22 }).map((v: number) => v + '.x'), fc.integer({ min: 14, max: 22 }).map((v: number) => '>=' + v), fc.integer({ min: 14, max: 22 }).map((v: number) => '^' + v + '.0.0'));
  const packageJsonArbitrary = (name: string): fc.Arbitrary<PackageJson> => fc.record({ name: fc.constant(name), engines: fc.option(fc.record({ node: engineRequirementArbitrary }), { nil: undefined }) }) as fc.Arbitrary<PackageJson>;

  describe('parseMajorVersionRequirement', () => {
    it('should extract major versions from any valid engine requirement string', () => {
      fc.assert(fc.property(engineRequirementArbitrary, (requirement: string) => {
        const versions = parseMajorVersionRequirement(requirement);
        expect(versions).to.be.an('array');
        versions.forEach((v: number) => { expect(v).to.be.a('number'); expect(v).to.be.greaterThan(0); });
      }), { numRuns: 100 });
    });
  });

  describe('checkNodeVersionCompatibility', () => {
    it('should correctly determine compatibility for .x format requirements', () => {
      fc.assert(fc.property(fc.integer({ min: 14, max: 22 }), semverArbitrary, (requiredMajor: number, currentVersion: string) => {
        const requirement = requiredMajor + '.x';
        const currentMajor = parseInt(currentVersion.split('.')[0], 10);
        const isCompatible = checkNodeVersionCompatibility(currentVersion, requirement);
        expect(isCompatible).to.equal(currentMajor === requiredMajor);
      }), { numRuns: 100 });
    });

    it('should correctly determine compatibility for >= format requirements', () => {
      fc.assert(fc.property(fc.integer({ min: 14, max: 22 }), semverArbitrary, (minMajor: number, currentVersion: string) => {
        const requirement = '>=' + minMajor;
        const currentMajor = parseInt(currentVersion.split('.')[0], 10);
        const isCompatible = checkNodeVersionCompatibility(currentVersion, requirement);
        expect(isCompatible).to.equal(currentMajor >= minMajor);
      }), { numRuns: 100 });
    });
  });

  describe('verifyNodeVersionCompatibility', () => {
    it('should verify compatibility for both applications with any Node.js version', () => {
      fc.assert(fc.property(packageJsonArbitrary('varaus'), packageJsonArbitrary('varausserver'), semverArbitrary, (frontendPkg: PackageJson, backendPkg: PackageJson, nodeVersion: string) => {
        const results = verifyNodeVersionCompatibility(frontendPkg, backendPkg, nodeVersion);
        const expectedCount = (frontendPkg.engines?.node ? 1 : 0) + (backendPkg.engines?.node ? 1 : 0);
        expect(results.length).to.equal(expectedCount);
        results.forEach((result) => {
          expect(result).to.have.property('compatible').that.is.a('boolean');
          expect(result).to.have.property('application').that.is.a('string');
          expect(result).to.have.property('currentVersion').that.equals(nodeVersion);
        });
      }), { numRuns: 100 });
    });
  });

  describe('checkApplicationsNodeCompatibility', () => {
    it('should find common versions when both apps have overlapping requirements', () => {
      fc.assert(fc.property(fc.integer({ min: 14, max: 22 }), (sharedMajor: number) => {
        const frontendPkg: PackageJson = { name: 'varaus', engines: { node: sharedMajor + '.x' } };
        const backendPkg: PackageJson = { name: 'varausserver', engines: { node: sharedMajor + '.x' } };
        const result = checkApplicationsNodeCompatibility(frontendPkg, backendPkg);
        expect(result.compatible).to.be.true;
        expect(result.commonVersions).to.include(sharedMajor);
      }), { numRuns: 100 });
    });

    it('should detect incompatibility when apps have non-overlapping requirements', () => {
      fc.assert(fc.property(fc.integer({ min: 14, max: 18 }), fc.integer({ min: 20, max: 22 }), (frontendMajor: number, backendMajor: number) => {
        const frontendPkg: PackageJson = { name: 'varaus', engines: { node: frontendMajor + '.x' } };
        const backendPkg: PackageJson = { name: 'varausserver', engines: { node: backendMajor + '.x' } };
        const result = checkApplicationsNodeCompatibility(frontendPkg, backendPkg);
        expect(result.compatible).to.be.false;
        expect(result.commonVersions).to.be.empty;
      }), { numRuns: 100 });
    });

    it('should be compatible when one app has no engine requirement', () => {
      fc.assert(fc.property(fc.integer({ min: 14, max: 22 }), fc.boolean(), (major: number, frontendHasRequirement: boolean) => {
        const frontendPkg: PackageJson = { name: 'varaus', engines: frontendHasRequirement ? { node: major + '.x' } : undefined };
        const backendPkg: PackageJson = { name: 'varausserver', engines: frontendHasRequirement ? undefined : { node: major + '.x' } };
        const result = checkApplicationsNodeCompatibility(frontendPkg, backendPkg);
        expect(result.compatible).to.be.true;
      }), { numRuns: 100 });
    });
  });
});
