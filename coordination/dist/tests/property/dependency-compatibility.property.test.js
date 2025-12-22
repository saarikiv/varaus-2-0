"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Property-based tests for dependency compatibility checking
 * **Feature: full-stack-coordination, Property 10: Dependency Compatibility Checking**
 * **Validates: Requirements 5.1, 5.4**
 */
const chai_1 = require("chai");
const fc = __importStar(require("fast-check"));
const dependency_checker_1 = require("../../src/config/dependency-checker");
describe('Property 10: Dependency Compatibility Checking', () => {
    // Arbitraries for generating test data
    const versionArbitrary = fc.oneof(fc.tuple(fc.integer({ min: 1, max: 20 }), fc.integer({ min: 0, max: 50 }), fc.integer({ min: 0, max: 50 }))
        .map(([major, minor, patch]) => `${major}.${minor}.${patch}`), fc.tuple(fc.integer({ min: 1, max: 20 }), fc.integer({ min: 0, max: 50 }), fc.integer({ min: 0, max: 50 }))
        .map(([major, minor, patch]) => `^${major}.${minor}.${patch}`), fc.tuple(fc.integer({ min: 1, max: 20 }), fc.integer({ min: 0, max: 50 }), fc.integer({ min: 0, max: 50 }))
        .map(([major, minor, patch]) => `~${major}.${minor}.${patch}`), fc.tuple(fc.integer({ min: 1, max: 20 }), fc.integer({ min: 0, max: 50 }), fc.integer({ min: 0, max: 50 }))
        .map(([major, minor, patch]) => `>=${major}.${minor}.${patch}`));
    const packageNameArbitrary = fc.oneof(fc.constant('react'), fc.constant('lodash'), fc.constant('axios'), fc.constant('express'), fc.constant('webpack'), fc.constant('babel-core'), fc.constant('typescript'), fc.constant('mocha'));
    const dependenciesArbitrary = fc.dictionary(packageNameArbitrary, versionArbitrary, { minKeys: 0, maxKeys: 5 });
    const packageJsonArbitrary = (name) => fc.record({
        name: fc.constant(name),
        dependencies: fc.option(dependenciesArbitrary, { nil: undefined }),
        devDependencies: fc.option(dependenciesArbitrary, { nil: undefined })
    });
    describe('extractMajorVersion', () => {
        it('should extract major version from any valid semver string', function () {
            this.timeout(10000); // Increase timeout for property test
            fc.assert(fc.property(versionArbitrary, (version) => {
                const major = (0, dependency_checker_1.extractMajorVersion)(version);
                (0, chai_1.expect)(major).to.be.a('number');
                (0, chai_1.expect)(major).to.be.greaterThan(0);
            }), { numRuns: 100 });
        });
        it('should extract the same major version regardless of prefix', () => {
            fc.assert(fc.property(fc.integer({ min: 1, max: 20 }), fc.integer({ min: 0, max: 50 }), fc.integer({ min: 0, max: 50 }), (major, minor, patch) => {
                const versions = [
                    `${major}.${minor}.${patch}`,
                    `^${major}.${minor}.${patch}`,
                    `~${major}.${minor}.${patch}`,
                    `>=${major}.${minor}.${patch}`
                ];
                const extractedVersions = versions.map(v => (0, dependency_checker_1.extractMajorVersion)(v));
                const allSame = extractedVersions.every(v => v === major);
                (0, chai_1.expect)(allSame).to.be.true;
            }), { numRuns: 100 });
        });
    });
    describe('areVersionsCompatible', () => {
        it('should consider versions with same major version as compatible', () => {
            fc.assert(fc.property(fc.integer({ min: 1, max: 20 }), fc.integer({ min: 0, max: 50 }), fc.integer({ min: 0, max: 50 }), fc.integer({ min: 0, max: 50 }), fc.integer({ min: 0, max: 50 }), (major, minor1, patch1, minor2, patch2) => {
                const version1 = `^${major}.${minor1}.${patch1}`;
                const version2 = `~${major}.${minor2}.${patch2}`;
                const compatible = (0, dependency_checker_1.areVersionsCompatible)(version1, version2);
                (0, chai_1.expect)(compatible).to.be.true;
            }), { numRuns: 100 });
        });
        it('should consider versions with different major versions as incompatible', () => {
            fc.assert(fc.property(fc.integer({ min: 1, max: 10 }), fc.integer({ min: 11, max: 20 }), fc.integer({ min: 0, max: 50 }), fc.integer({ min: 0, max: 50 }), (major1, major2, minor, patch) => {
                const version1 = `${major1}.${minor}.${patch}`;
                const version2 = `${major2}.${minor}.${patch}`;
                const compatible = (0, dependency_checker_1.areVersionsCompatible)(version1, version2);
                (0, chai_1.expect)(compatible).to.be.false;
            }), { numRuns: 100 });
        });
    });
    describe('findSharedDependencies', () => {
        it('should find all dependencies that exist in both packages', () => {
            fc.assert(fc.property(packageJsonArbitrary('frontend'), packageJsonArbitrary('backend'), (frontendPkg, backendPkg) => {
                const shared = (0, dependency_checker_1.findSharedDependencies)(frontendPkg, backendPkg);
                // Every shared dependency should exist in both packages
                shared.forEach(dep => {
                    const inFrontend = (frontendPkg.dependencies && dep in frontendPkg.dependencies) ||
                        (frontendPkg.devDependencies && dep in frontendPkg.devDependencies);
                    const inBackend = (backendPkg.dependencies && dep in backendPkg.dependencies) ||
                        (backendPkg.devDependencies && dep in backendPkg.devDependencies);
                    (0, chai_1.expect)(inFrontend).to.be.true;
                    (0, chai_1.expect)(inBackend).to.be.true;
                });
            }), { numRuns: 100 });
        });
        it('should return empty array when packages have no shared dependencies', () => {
            const frontendPkg = {
                name: 'frontend',
                dependencies: { 'react': '^18.0.0' }
            };
            const backendPkg = {
                name: 'backend',
                dependencies: { 'express': '^4.0.0' }
            };
            const shared = (0, dependency_checker_1.findSharedDependencies)(frontendPkg, backendPkg);
            (0, chai_1.expect)(shared).to.be.an('array').that.is.empty;
        });
    });
    describe('checkDependencyCompatibility', () => {
        it('should return a conflict entry for each shared dependency', function () {
            this.timeout(10000); // Increase timeout for property test
            fc.assert(fc.property(packageJsonArbitrary('frontend'), packageJsonArbitrary('backend'), (frontendPkg, backendPkg) => {
                const conflicts = (0, dependency_checker_1.checkDependencyCompatibility)(frontendPkg, backendPkg);
                const shared = (0, dependency_checker_1.findSharedDependencies)(frontendPkg, backendPkg);
                (0, chai_1.expect)(conflicts.length).to.equal(shared.length);
                conflicts.forEach(conflict => {
                    (0, chai_1.expect)(conflict).to.have.property('packageName');
                    (0, chai_1.expect)(conflict).to.have.property('frontendVersion');
                    (0, chai_1.expect)(conflict).to.have.property('backendVersion');
                    (0, chai_1.expect)(conflict).to.have.property('compatible').that.is.a('boolean');
                    (0, chai_1.expect)(conflict).to.have.property('message').that.is.a('string');
                });
            }), { numRuns: 100 });
        });
        it('should correctly identify compatible versions', () => {
            const major = 18;
            const frontendPkg = {
                name: 'frontend',
                dependencies: { 'react': `^${major}.0.0` }
            };
            const backendPkg = {
                name: 'backend',
                dependencies: { 'react': `~${major}.2.0` }
            };
            const conflicts = (0, dependency_checker_1.checkDependencyCompatibility)(frontendPkg, backendPkg);
            (0, chai_1.expect)(conflicts).to.have.lengthOf(1);
            (0, chai_1.expect)(conflicts[0].compatible).to.be.true;
        });
        it('should correctly identify incompatible versions', () => {
            const frontendPkg = {
                name: 'frontend',
                dependencies: { 'react': '^15.0.0' }
            };
            const backendPkg = {
                name: 'backend',
                dependencies: { 'react': '^18.0.0' }
            };
            const conflicts = (0, dependency_checker_1.checkDependencyCompatibility)(frontendPkg, backendPkg);
            (0, chai_1.expect)(conflicts).to.have.lengthOf(1);
            (0, chai_1.expect)(conflicts[0].compatible).to.be.false;
        });
    });
    describe('validateDependencyCompatibility', () => {
        it('should report compatible when all shared dependencies have matching major versions', () => {
            fc.assert(fc.property(fc.integer({ min: 1, max: 20 }), fc.integer({ min: 0, max: 50 }), fc.integer({ min: 0, max: 50 }), (major, minor1, minor2) => {
                const frontendPkg = {
                    name: 'frontend',
                    dependencies: { 'lodash': `^${major}.${minor1}.0` }
                };
                const backendPkg = {
                    name: 'backend',
                    dependencies: { 'lodash': `~${major}.${minor2}.0` }
                };
                const result = (0, dependency_checker_1.validateDependencyCompatibility)(frontendPkg, backendPkg);
                (0, chai_1.expect)(result.compatible).to.be.true;
                (0, chai_1.expect)(result.conflicts).to.be.empty;
            }), { numRuns: 100 });
        });
        it('should report incompatible when any shared dependency has different major versions', () => {
            fc.assert(fc.property(fc.integer({ min: 1, max: 10 }), fc.integer({ min: 11, max: 20 }), (major1, major2) => {
                const frontendPkg = {
                    name: 'frontend',
                    dependencies: { 'axios': `^${major1}.0.0` }
                };
                const backendPkg = {
                    name: 'backend',
                    dependencies: { 'axios': `^${major2}.0.0` }
                };
                const result = (0, dependency_checker_1.validateDependencyCompatibility)(frontendPkg, backendPkg);
                (0, chai_1.expect)(result.compatible).to.be.false;
                (0, chai_1.expect)(result.conflicts).to.have.lengthOf(1);
                (0, chai_1.expect)(result.conflicts[0].packageName).to.equal('axios');
            }), { numRuns: 100 });
        });
        it('should be compatible when packages have no shared dependencies', () => {
            fc.assert(fc.property(packageJsonArbitrary('frontend'), (frontendPkg) => {
                const backendPkg = {
                    name: 'backend',
                    dependencies: { 'express': '^4.0.0' }
                };
                // Ensure no overlap by using a dependency that won't be in the arbitrary
                const result = (0, dependency_checker_1.validateDependencyCompatibility)(frontendPkg, backendPkg);
                // If there are no shared dependencies, should be compatible
                if ((0, dependency_checker_1.findSharedDependencies)(frontendPkg, backendPkg).length === 0) {
                    (0, chai_1.expect)(result.compatible).to.be.true;
                }
            }), { numRuns: 100 });
        });
    });
});
