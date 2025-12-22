/**
 * Unit tests for project structure validation
 * Validates: Requirements 8.1
 */

import { expect } from 'chai';
import * as fs from 'fs';
import * as path from 'path';

describe('Project Structure Validation', () => {
  const projectRoot = path.resolve(process.cwd());
  
  describe('Required directories', () => {
    it('should have src directory', () => {
      const srcPath = path.join(projectRoot, 'src');
      expect(fs.existsSync(srcPath)).to.be.true;
      expect(fs.statSync(srcPath).isDirectory()).to.be.true;
    });

    it('should have src/cli directory', () => {
      const cliPath = path.join(projectRoot, 'src', 'cli');
      expect(fs.existsSync(cliPath)).to.be.true;
      expect(fs.statSync(cliPath).isDirectory()).to.be.true;
    });

    it('should have src/config directory', () => {
      const configPath = path.join(projectRoot, 'src', 'config');
      expect(fs.existsSync(configPath)).to.be.true;
      expect(fs.statSync(configPath).isDirectory()).to.be.true;
    });

    it('should have src/process directory', () => {
      const processPath = path.join(projectRoot, 'src', 'process');
      expect(fs.existsSync(processPath)).to.be.true;
      expect(fs.statSync(processPath).isDirectory()).to.be.true;
    });

    it('should have src/health directory', () => {
      const healthPath = path.join(projectRoot, 'src', 'health');
      expect(fs.existsSync(healthPath)).to.be.true;
      expect(fs.statSync(healthPath).isDirectory()).to.be.true;
    });

    it('should have tests directory', () => {
      const testsPath = path.join(projectRoot, 'tests');
      expect(fs.existsSync(testsPath)).to.be.true;
      expect(fs.statSync(testsPath).isDirectory()).to.be.true;
    });

    it('should have tests/unit directory', () => {
      const unitPath = path.join(projectRoot, 'tests', 'unit');
      expect(fs.existsSync(unitPath)).to.be.true;
      expect(fs.statSync(unitPath).isDirectory()).to.be.true;
    });

    it('should have tests/property directory', () => {
      const propertyPath = path.join(projectRoot, 'tests', 'property');
      expect(fs.existsSync(propertyPath)).to.be.true;
      expect(fs.statSync(propertyPath).isDirectory()).to.be.true;
    });
  });

  describe('Required files', () => {
    it('should have package.json', () => {
      const packagePath = path.join(projectRoot, 'package.json');
      expect(fs.existsSync(packagePath)).to.be.true;
      expect(fs.statSync(packagePath).isFile()).to.be.true;
    });

    it('should have tsconfig.json', () => {
      const tsconfigPath = path.join(projectRoot, 'tsconfig.json');
      expect(fs.existsSync(tsconfigPath)).to.be.true;
      expect(fs.statSync(tsconfigPath).isFile()).to.be.true;
    });

    it('should have src/index.ts', () => {
      const indexPath = path.join(projectRoot, 'src', 'index.ts');
      expect(fs.existsSync(indexPath)).to.be.true;
      expect(fs.statSync(indexPath).isFile()).to.be.true;
    });

    it('should have src/types.ts', () => {
      const typesPath = path.join(projectRoot, 'src', 'types.ts');
      expect(fs.existsSync(typesPath)).to.be.true;
      expect(fs.statSync(typesPath).isFile()).to.be.true;
    });

    it('should have src/cli/index.ts', () => {
      const cliIndexPath = path.join(projectRoot, 'src', 'cli', 'index.ts');
      expect(fs.existsSync(cliIndexPath)).to.be.true;
      expect(fs.statSync(cliIndexPath).isFile()).to.be.true;
    });

    it('should have src/config/index.ts', () => {
      const configIndexPath = path.join(projectRoot, 'src', 'config', 'index.ts');
      expect(fs.existsSync(configIndexPath)).to.be.true;
      expect(fs.statSync(configIndexPath).isFile()).to.be.true;
    });

    it('should have src/process/index.ts', () => {
      const processIndexPath = path.join(projectRoot, 'src', 'process', 'index.ts');
      expect(fs.existsSync(processIndexPath)).to.be.true;
      expect(fs.statSync(processIndexPath).isFile()).to.be.true;
    });

    it('should have src/health/index.ts', () => {
      const healthIndexPath = path.join(projectRoot, 'src', 'health', 'index.ts');
      expect(fs.existsSync(healthIndexPath)).to.be.true;
      expect(fs.statSync(healthIndexPath).isFile()).to.be.true;
    });
  });

  describe('Package configuration', () => {
    let packageJson: any;

    before(() => {
      const packagePath = path.join(projectRoot, 'package.json');
      const packageContent = fs.readFileSync(packagePath, 'utf-8');
      packageJson = JSON.parse(packageContent);
    });

    it('should have fast-check as a dependency', () => {
      expect(packageJson.devDependencies).to.have.property('fast-check');
    });

    it('should have typescript as a dependency', () => {
      expect(packageJson.devDependencies).to.have.property('typescript');
    });

    it('should have mocha as a dependency', () => {
      expect(packageJson.devDependencies).to.have.property('mocha');
    });

    it('should have chai as a dependency', () => {
      expect(packageJson.devDependencies).to.have.property('chai');
    });

    it('should have build script', () => {
      expect(packageJson.scripts).to.have.property('build');
    });

    it('should have test script', () => {
      expect(packageJson.scripts).to.have.property('test');
    });

    it('should have test:property script', () => {
      expect(packageJson.scripts).to.have.property('test:property');
    });

    it('should have test:unit script', () => {
      expect(packageJson.scripts).to.have.property('test:unit');
    });
  });

  describe('TypeScript configuration', () => {
    let tsconfig: any;

    before(() => {
      const tsconfigPath = path.join(projectRoot, 'tsconfig.json');
      const tsconfigContent = fs.readFileSync(tsconfigPath, 'utf-8');
      tsconfig = JSON.parse(tsconfigContent);
    });

    it('should have strict mode enabled', () => {
      expect(tsconfig.compilerOptions.strict).to.be.true;
    });

    it('should have outDir configured', () => {
      expect(tsconfig.compilerOptions).to.have.property('outDir');
    });

    it('should include src directory', () => {
      expect(tsconfig.include).to.include.members(['src/**/*']);
    });

    it('should include tests directory', () => {
      expect(tsconfig.include).to.include.members(['tests/**/*']);
    });
  });
});
