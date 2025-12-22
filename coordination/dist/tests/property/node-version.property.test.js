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
 * Property-based tests for Node.js version compatibility
 * **Feature: full-stack-coordination, Property 11: Node.js Version Compatibility**
 * **Validates: Requirements 5.2**
 */
const chai_1 = require("chai");
const fc = __importStar(require("fast-check"));
const version_checker_1 = require("../../src/config/version-checker");
describe('Property 11: Node.js Version Compatibility', () => {
    const semverArbitrary = fc.tuple(fc.integer({ min: 14, max: 22 }), fc.integer({ min: 0, max: 20 }), fc.integer({ min: 0, max: 20 })).map(([major, minor, patch]) => major + '.' + minor + '.' + patch);
    const engineRequirementArbitrary = fc.oneof(fc.integer({ min: 14, max: 22 }).map((v) => v + '.x'), fc.integer({ min: 14, max: 22 }).map((v) => '>=' + v), fc.integer({ min: 14, max: 22 }).map((v) => '^' + v + '.0.0'));
    const packageJsonArbitrary = (name) => fc.record({ name: fc.constant(name), engines: fc.option(fc.record({ node: engineRequirementArbitrary }), { nil: undefined }) });
    describe('parseMajorVersionRequirement', () => {
        it('should extract major versions from any valid engine requirement string', () => {
            fc.assert(fc.property(engineRequirementArbitrary, (requirement) => {
                const versions = (0, version_checker_1.parseMajorVersionRequirement)(requirement);
                (0, chai_1.expect)(versions).to.be.an('array');
                versions.forEach((v) => { (0, chai_1.expect)(v).to.be.a('number'); (0, chai_1.expect)(v).to.be.greaterThan(0); });
            }), { numRuns: 100 });
        });
    });
    describe('checkNodeVersionCompatibility', () => {
        it('should correctly determine compatibility for .x format requirements', () => {
            fc.assert(fc.property(fc.integer({ min: 14, max: 22 }), semverArbitrary, (requiredMajor, currentVersion) => {
                const requirement = requiredMajor + '.x';
                const currentMajor = parseInt(currentVersion.split('.')[0], 10);
                const isCompatible = (0, version_checker_1.checkNodeVersionCompatibility)(currentVersion, requirement);
                (0, chai_1.expect)(isCompatible).to.equal(currentMajor === requiredMajor);
            }), { numRuns: 100 });
        });
        it('should correctly determine compatibility for >= format requirements', () => {
            fc.assert(fc.property(fc.integer({ min: 14, max: 22 }), semverArbitrary, (minMajor, currentVersion) => {
                const requirement = '>=' + minMajor;
                const currentMajor = parseInt(currentVersion.split('.')[0], 10);
                const isCompatible = (0, version_checker_1.checkNodeVersionCompatibility)(currentVersion, requirement);
                (0, chai_1.expect)(isCompatible).to.equal(currentMajor >= minMajor);
            }), { numRuns: 100 });
        });
    });
    describe('verifyNodeVersionCompatibility', () => {
        it('should verify compatibility for both applications with any Node.js version', () => {
            fc.assert(fc.property(packageJsonArbitrary('varaus'), packageJsonArbitrary('varausserver'), semverArbitrary, (frontendPkg, backendPkg, nodeVersion) => {
                const results = (0, version_checker_1.verifyNodeVersionCompatibility)(frontendPkg, backendPkg, nodeVersion);
                const expectedCount = (frontendPkg.engines?.node ? 1 : 0) + (backendPkg.engines?.node ? 1 : 0);
                (0, chai_1.expect)(results.length).to.equal(expectedCount);
                results.forEach((result) => {
                    (0, chai_1.expect)(result).to.have.property('compatible').that.is.a('boolean');
                    (0, chai_1.expect)(result).to.have.property('application').that.is.a('string');
                    (0, chai_1.expect)(result).to.have.property('currentVersion').that.equals(nodeVersion);
                });
            }), { numRuns: 100 });
        });
    });
    describe('checkApplicationsNodeCompatibility', () => {
        it('should find common versions when both apps have overlapping requirements', () => {
            fc.assert(fc.property(fc.integer({ min: 14, max: 22 }), (sharedMajor) => {
                const frontendPkg = { name: 'varaus', engines: { node: sharedMajor + '.x' } };
                const backendPkg = { name: 'varausserver', engines: { node: sharedMajor + '.x' } };
                const result = (0, version_checker_1.checkApplicationsNodeCompatibility)(frontendPkg, backendPkg);
                (0, chai_1.expect)(result.compatible).to.be.true;
                (0, chai_1.expect)(result.commonVersions).to.include(sharedMajor);
            }), { numRuns: 100 });
        });
        it('should detect incompatibility when apps have non-overlapping requirements', () => {
            fc.assert(fc.property(fc.integer({ min: 14, max: 18 }), fc.integer({ min: 20, max: 22 }), (frontendMajor, backendMajor) => {
                const frontendPkg = { name: 'varaus', engines: { node: frontendMajor + '.x' } };
                const backendPkg = { name: 'varausserver', engines: { node: backendMajor + '.x' } };
                const result = (0, version_checker_1.checkApplicationsNodeCompatibility)(frontendPkg, backendPkg);
                (0, chai_1.expect)(result.compatible).to.be.false;
                (0, chai_1.expect)(result.commonVersions).to.be.empty;
            }), { numRuns: 100 });
        });
        it('should be compatible when one app has no engine requirement', () => {
            fc.assert(fc.property(fc.integer({ min: 14, max: 22 }), fc.boolean(), (major, frontendHasRequirement) => {
                const frontendPkg = { name: 'varaus', engines: frontendHasRequirement ? { node: major + '.x' } : undefined };
                const backendPkg = { name: 'varausserver', engines: frontendHasRequirement ? undefined : { node: major + '.x' } };
                const result = (0, version_checker_1.checkApplicationsNodeCompatibility)(frontendPkg, backendPkg);
                (0, chai_1.expect)(result.compatible).to.be.true;
            }), { numRuns: 100 });
        });
    });
});
