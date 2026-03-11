import { expect } from 'chai';
import {
  extractMajorVersion,
  areVersionsCompatible,
  findSharedDependencies,
  checkDependencyCompatibility,
  validateDependencyCompatibility,
  PackageJsonWithDeps
} from '../../src/config/dependency-checker';

describe('DependencyChecker', () => {
  describe('extractMajorVersion', () => {
    it('should extract major version from plain semver', () => {
      expect(extractMajorVersion('3.2.1')).to.equal(3);
    });

    it('should strip ^ prefix', () => {
      expect(extractMajorVersion('^4.17.1')).to.equal(4);
    });

    it('should strip ~ prefix', () => {
      expect(extractMajorVersion('~2.0.0')).to.equal(2);
    });

    it('should strip >= prefix', () => {
      expect(extractMajorVersion('>=18.0.0')).to.equal(18);
    });

    it('should return null for unparseable strings', () => {
      expect(extractMajorVersion('latest')).to.be.null;
      expect(extractMajorVersion('*')).to.be.null;
      expect(extractMajorVersion('')).to.be.null;
    });
  });

  describe('areVersionsCompatible', () => {
    it('should return true for same major version', () => {
      expect(areVersionsCompatible('^4.17.1', '~4.0.0')).to.be.true;
    });

    it('should return false for different major versions', () => {
      expect(areVersionsCompatible('^3.0.0', '^4.0.0')).to.be.false;
    });

    it('should return false when either version is unparseable', () => {
      expect(areVersionsCompatible('latest', '^4.0.0')).to.be.false;
      expect(areVersionsCompatible('^4.0.0', '*')).to.be.false;
    });

    it('should return false when both versions are unparseable', () => {
      expect(areVersionsCompatible('latest', '*')).to.be.false;
    });
  });

  describe('findSharedDependencies', () => {
    it('should find dependencies present in both packages', () => {
      const frontend: PackageJsonWithDeps = {
        name: 'frontend',
        dependencies: { lodash: '^4.0.0', react: '^18.0.0' }
      };
      const backend: PackageJsonWithDeps = {
        name: 'backend',
        dependencies: { lodash: '^4.0.0', express: '^4.0.0' }
      };
      const shared = findSharedDependencies(frontend, backend);
      expect(shared).to.deep.equal(['lodash']);
    });

    it('should include devDependencies in the check', () => {
      const frontend: PackageJsonWithDeps = {
        name: 'frontend',
        devDependencies: { typescript: '^5.0.0' }
      };
      const backend: PackageJsonWithDeps = {
        name: 'backend',
        dependencies: { typescript: '^5.0.0' }
      };
      const shared = findSharedDependencies(frontend, backend);
      expect(shared).to.include('typescript');
    });

    it('should return empty array when no shared deps', () => {
      const frontend: PackageJsonWithDeps = {
        name: 'frontend',
        dependencies: { react: '^18.0.0' }
      };
      const backend: PackageJsonWithDeps = {
        name: 'backend',
        dependencies: { express: '^4.0.0' }
      };
      expect(findSharedDependencies(frontend, backend)).to.deep.equal([]);
    });

    it('should handle missing dependencies/devDependencies fields', () => {
      const frontend: PackageJsonWithDeps = { name: 'frontend' };
      const backend: PackageJsonWithDeps = { name: 'backend' };
      expect(findSharedDependencies(frontend, backend)).to.deep.equal([]);
    });
  });

  describe('checkDependencyCompatibility', () => {
    it('should return entries for all shared dependencies', () => {
      const frontend: PackageJsonWithDeps = {
        name: 'frontend',
        dependencies: { lodash: '^4.17.1', uuid: '^8.0.0' }
      };
      const backend: PackageJsonWithDeps = {
        name: 'backend',
        dependencies: { lodash: '^4.0.0', uuid: '^9.0.0' }
      };
      const results = checkDependencyCompatibility(frontend, backend);
      expect(results).to.have.length(2);

      const lodashResult = results.find(r => r.packageName === 'lodash');
      expect(lodashResult?.compatible).to.be.true;

      const uuidResult = results.find(r => r.packageName === 'uuid');
      expect(uuidResult?.compatible).to.be.false;
    });
  });

  describe('validateDependencyCompatibility', () => {
    it('should return compatible=true when all shared deps match', () => {
      const frontend: PackageJsonWithDeps = {
        name: 'frontend',
        dependencies: { lodash: '^4.17.1' }
      };
      const backend: PackageJsonWithDeps = {
        name: 'backend',
        dependencies: { lodash: '~4.0.0' }
      };
      const result = validateDependencyCompatibility(frontend, backend);
      expect(result.compatible).to.be.true;
      expect(result.conflicts).to.have.length(0);
    });

    it('should return compatible=false with conflicts when major versions differ', () => {
      const frontend: PackageJsonWithDeps = {
        name: 'frontend',
        dependencies: { lodash: '^3.0.0' }
      };
      const backend: PackageJsonWithDeps = {
        name: 'backend',
        dependencies: { lodash: '^4.0.0' }
      };
      const result = validateDependencyCompatibility(frontend, backend);
      expect(result.compatible).to.be.false;
      expect(result.conflicts).to.have.length(1);
      expect(result.conflicts[0].packageName).to.equal('lodash');
    });

    it('should return compatible=true when there are no shared deps', () => {
      const frontend: PackageJsonWithDeps = {
        name: 'frontend',
        dependencies: { react: '^18.0.0' }
      };
      const backend: PackageJsonWithDeps = {
        name: 'backend',
        dependencies: { express: '^4.0.0' }
      };
      const result = validateDependencyCompatibility(frontend, backend);
      expect(result.compatible).to.be.true;
      expect(result.conflicts).to.have.length(0);
    });
  });
});
