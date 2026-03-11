/**
 * Property-Based Tests for Dependency and Version Checking
 * Feature: coordination
 * Validates: Requirements 4.1–4.5, 5.1–5.5
 */

import { expect } from 'chai';
import * as fc from 'fast-check';
import {
  extractMajorVersion,
  areVersionsCompatible,
  findSharedDependencies,
  validateDependencyCompatibility,
  PackageJsonWithDeps,
} from '../../src/config/dependency-checker';
import {
  parseMajorVersionRequirement,
  checkNodeVersionCompatibility,
  checkApplicationsNodeCompatibility,
  PackageJson,
} from '../../src/config/version-checker';

// ─── Shared Arbitraries ──────────────────────────────────────────────────────

const packageNameArb = fc.stringOf(
  fc.constantFrom('a','b','c','d','e','f','g','h','i','j','k','l','m','n','o','p'),
  { minLength: 1, maxLength: 6 }
);

const versionArb = fc.oneof(
  fc.tuple(fc.integer({ min: 0, max: 30 }), fc.integer({ min: 0, max: 50 }), fc.integer({ min: 0, max: 50 }))
    .map(([major, minor, patch]) => `${major}.${minor}.${patch}`),
  fc.tuple(fc.integer({ min: 0, max: 30 }), fc.integer({ min: 0, max: 50 }), fc.integer({ min: 0, max: 50 }))
    .map(([major, minor, patch]) => `^${major}.${minor}.${patch}`),
  fc.tuple(fc.integer({ min: 0, max: 30 }), fc.integer({ min: 0, max: 50 }), fc.integer({ min: 0, max: 50 }))
    .map(([major, minor, patch]) => `~${major}.${minor}.${patch}`),
  fc.tuple(fc.integer({ min: 0, max: 30 }), fc.integer({ min: 0, max: 50 }), fc.integer({ min: 0, max: 50 }))
    .map(([major, minor, patch]) => `>=${major}.${minor}.${patch}`)
);

const dependenciesArb = fc.dictionary(packageNameArb, versionArb, { minKeys: 0, maxKeys: 6 });

const packageJsonWithDepsArb = (name: string): fc.Arbitrary<PackageJsonWithDeps> =>
  fc.record({
    name: fc.constant(name),
    dependencies: fc.option(dependenciesArb, { nil: undefined }),
    devDependencies: fc.option(dependenciesArb, { nil: undefined }),
  }) as fc.Arbitrary<PackageJsonWithDeps>;


// ─── Property 10: Shared dependency identification is set intersection ───────
// Feature: coordination, Property 10: Shared dependency identification is set intersection
// **Validates: Requirements 4.1**

describe('Feature: coordination, Property 10: Shared dependency identification is set intersection', () => {
  it('should return exactly the set intersection of (deps + devDeps) keys from each package', function () {
    this.timeout(15000);
    fc.assert(
      fc.property(
        packageJsonWithDepsArb('frontend'),
        packageJsonWithDepsArb('backend'),
        (frontendPkg, backendPkg) => {
          const result = findSharedDependencies(frontendPkg, backendPkg);

          // Compute expected set intersection manually
          const frontendKeys = new Set([
            ...Object.keys(frontendPkg.dependencies || {}),
            ...Object.keys(frontendPkg.devDependencies || {}),
          ]);
          const backendKeys = new Set([
            ...Object.keys(backendPkg.dependencies || {}),
            ...Object.keys(backendPkg.devDependencies || {}),
          ]);
          const expectedIntersection = new Set(
            [...frontendKeys].filter((k) => backendKeys.has(k))
          );

          // The result should be exactly the set intersection
          const resultSet = new Set(result);
          expect(resultSet.size).to.equal(result.length, 'No duplicates in result');
          expect(resultSet.size).to.equal(expectedIntersection.size);
          for (const dep of expectedIntersection) {
            expect(resultSet.has(dep)).to.be.true;
          }
          for (const dep of resultSet) {
            expect(expectedIntersection.has(dep)).to.be.true;
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});


// ─── Property 11: Dependency version incompatibility detection ───────────────
// Feature: coordination, Property 11: Dependency version incompatibility detection
// **Validates: Requirements 4.3, 4.4**

describe('Feature: coordination, Property 11: Dependency version incompatibility detection', () => {
  it('should return false for two parseable version strings with different major versions', function () {
    this.timeout(15000);
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 20 }),
        fc.integer({ min: 0, max: 20 }),
        fc.integer({ min: 0, max: 50 }),
        fc.integer({ min: 0, max: 50 }),
        fc.integer({ min: 0, max: 50 }),
        fc.integer({ min: 0, max: 50 }),
        (major1, major2, minor1, patch1, minor2, patch2) => {
          fc.pre(major1 !== major2);
          const v1 = `${major1}.${minor1}.${patch1}`;
          const v2 = `${major2}.${minor2}.${patch2}`;

          // Both should be parseable
          expect(extractMajorVersion(v1)).to.be.a('number');
          expect(extractMajorVersion(v2)).to.be.a('number');

          // Different major versions → incompatible
          expect(areVersionsCompatible(v1, v2)).to.be.false;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should return false for unparseable version strings', function () {
    this.timeout(15000);
    const unparseableArb = fc.stringOf(
      fc.constantFrom('a', 'b', 'c', 'x', 'y', 'z', '!', '@', '#', '-', '_', ' '),
      { minLength: 1, maxLength: 10 }
    ).filter((s) => extractMajorVersion(s) === null);

    fc.assert(
      fc.property(
        unparseableArb,
        versionArb,
        (unparseable, valid) => {
          // unparseable as v1
          expect(areVersionsCompatible(unparseable, valid)).to.be.false;
          // unparseable as v2
          expect(areVersionsCompatible(valid, unparseable)).to.be.false;
          // both unparseable
          expect(areVersionsCompatible(unparseable, unparseable)).to.be.false;
        }
      ),
      { numRuns: 100 }
    );
  });
});


// ─── Property 12: Dependency compatibility summary consistency ────────────────
// Feature: coordination, Property 12: Dependency compatibility summary consistency
// **Validates: Requirements 4.5**

describe('Feature: coordination, Property 12: Dependency compatibility summary consistency', () => {
  it('should have compatible=true iff conflicts list is empty', function () {
    this.timeout(15000);
    fc.assert(
      fc.property(
        packageJsonWithDepsArb('frontend'),
        packageJsonWithDepsArb('backend'),
        (frontendPkg, backendPkg) => {
          const result = validateDependencyCompatibility(frontendPkg, backendPkg);

          if (result.conflicts.length === 0) {
            expect(result.compatible).to.be.true;
          } else {
            expect(result.compatible).to.be.false;
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});


// ─── Property 13: Node.js version compatibility checking ─────────────────────
// Feature: coordination, Property 13: Node.js version compatibility checking
// **Validates: Requirements 5.1, 5.3, 5.4, 5.5**

describe('Feature: coordination, Property 13: Node.js version compatibility checking', () => {
  // Arbitrary for version range formats: "20.x", ">=18", "^18.0.0", "18.x || 20.x"
  const singleRangeArb = fc.oneof(
    fc.integer({ min: 10, max: 30 }).map((v) => `${v}.x`),
    fc.integer({ min: 10, max: 30 }).map((v) => `>=${v}`),
    fc.integer({ min: 10, max: 30 }).map((v) => `^${v}.0.0`)
  );

  const versionRangeArb = fc.oneof(
    singleRangeArb,
    fc.tuple(singleRangeArb, singleRangeArb).map(([a, b]) => `${a} || ${b}`)
  );

  it('checkNodeVersionCompatibility returns true iff current major is in parsed set', function () {
    this.timeout(15000);
    fc.assert(
      fc.property(
        fc.integer({ min: 10, max: 30 }),
        versionRangeArb,
        (currentMajor, range) => {
          const currentVersion = `${currentMajor}.0.0`;
          const parsedMajors = parseMajorVersionRequirement(range);

          // Skip if range parses to empty (no requirement)
          fc.pre(parsedMajors.length > 0);

          const result = checkNodeVersionCompatibility(currentVersion, range);
          const expectedInSet = parsedMajors.includes(currentMajor);

          expect(result).to.equal(expectedInSet);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('common versions between two apps should be the intersection of their parsed version sets', function () {
    this.timeout(15000);
    fc.assert(
      fc.property(
        versionRangeArb,
        versionRangeArb,
        (frontendRange, backendRange) => {
          const frontendPkg: PackageJson = {
            name: 'frontend',
            engines: { node: frontendRange },
          };
          const backendPkg: PackageJson = {
            name: 'backend',
            engines: { node: backendRange },
          };

          const frontendVersions = parseMajorVersionRequirement(frontendRange);
          const backendVersions = parseMajorVersionRequirement(backendRange);

          // Skip if either parses to empty
          fc.pre(frontendVersions.length > 0 && backendVersions.length > 0);

          const backendSet = new Set(backendVersions);
          const expectedCommon = frontendVersions
            .filter((v) => backendSet.has(v))
            .sort((a, b) => a - b);

          const result = checkApplicationsNodeCompatibility(frontendPkg, backendPkg);

          expect(result.commonVersions).to.deep.equal(expectedCommon);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('compatible should be false when intersection of version sets is empty', function () {
    this.timeout(15000);
    fc.assert(
      fc.property(
        fc.integer({ min: 10, max: 15 }),
        fc.integer({ min: 20, max: 30 }),
        (frontendMajor, backendMajor) => {
          // Ensure non-overlapping ranges
          fc.pre(frontendMajor !== backendMajor);

          const frontendPkg: PackageJson = {
            name: 'frontend',
            engines: { node: `^${frontendMajor}.0.0` },
          };
          const backendPkg: PackageJson = {
            name: 'backend',
            engines: { node: `^${backendMajor}.0.0` },
          };

          const result = checkApplicationsNodeCompatibility(frontendPkg, backendPkg);

          // ^N.0.0 parses to [N], so intersection of [frontendMajor] and [backendMajor] is empty
          expect(result.compatible).to.be.false;
          expect(result.commonVersions).to.deep.equal([]);
        }
      ),
      { numRuns: 100 }
    );
  });
});
