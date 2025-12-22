"use strict";
/**
 * Unit tests for project structure validation
 * Validates: Requirements 8.1
 */
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
const chai_1 = require("chai");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
describe('Project Structure Validation', () => {
    const projectRoot = path.resolve(process.cwd());
    describe('Required directories', () => {
        it('should have src directory', () => {
            const srcPath = path.join(projectRoot, 'src');
            (0, chai_1.expect)(fs.existsSync(srcPath)).to.be.true;
            (0, chai_1.expect)(fs.statSync(srcPath).isDirectory()).to.be.true;
        });
        it('should have src/cli directory', () => {
            const cliPath = path.join(projectRoot, 'src', 'cli');
            (0, chai_1.expect)(fs.existsSync(cliPath)).to.be.true;
            (0, chai_1.expect)(fs.statSync(cliPath).isDirectory()).to.be.true;
        });
        it('should have src/config directory', () => {
            const configPath = path.join(projectRoot, 'src', 'config');
            (0, chai_1.expect)(fs.existsSync(configPath)).to.be.true;
            (0, chai_1.expect)(fs.statSync(configPath).isDirectory()).to.be.true;
        });
        it('should have src/process directory', () => {
            const processPath = path.join(projectRoot, 'src', 'process');
            (0, chai_1.expect)(fs.existsSync(processPath)).to.be.true;
            (0, chai_1.expect)(fs.statSync(processPath).isDirectory()).to.be.true;
        });
        it('should have src/health directory', () => {
            const healthPath = path.join(projectRoot, 'src', 'health');
            (0, chai_1.expect)(fs.existsSync(healthPath)).to.be.true;
            (0, chai_1.expect)(fs.statSync(healthPath).isDirectory()).to.be.true;
        });
        it('should have tests directory', () => {
            const testsPath = path.join(projectRoot, 'tests');
            (0, chai_1.expect)(fs.existsSync(testsPath)).to.be.true;
            (0, chai_1.expect)(fs.statSync(testsPath).isDirectory()).to.be.true;
        });
        it('should have tests/unit directory', () => {
            const unitPath = path.join(projectRoot, 'tests', 'unit');
            (0, chai_1.expect)(fs.existsSync(unitPath)).to.be.true;
            (0, chai_1.expect)(fs.statSync(unitPath).isDirectory()).to.be.true;
        });
        it('should have tests/property directory', () => {
            const propertyPath = path.join(projectRoot, 'tests', 'property');
            (0, chai_1.expect)(fs.existsSync(propertyPath)).to.be.true;
            (0, chai_1.expect)(fs.statSync(propertyPath).isDirectory()).to.be.true;
        });
    });
    describe('Required files', () => {
        it('should have package.json', () => {
            const packagePath = path.join(projectRoot, 'package.json');
            (0, chai_1.expect)(fs.existsSync(packagePath)).to.be.true;
            (0, chai_1.expect)(fs.statSync(packagePath).isFile()).to.be.true;
        });
        it('should have tsconfig.json', () => {
            const tsconfigPath = path.join(projectRoot, 'tsconfig.json');
            (0, chai_1.expect)(fs.existsSync(tsconfigPath)).to.be.true;
            (0, chai_1.expect)(fs.statSync(tsconfigPath).isFile()).to.be.true;
        });
        it('should have src/index.ts', () => {
            const indexPath = path.join(projectRoot, 'src', 'index.ts');
            (0, chai_1.expect)(fs.existsSync(indexPath)).to.be.true;
            (0, chai_1.expect)(fs.statSync(indexPath).isFile()).to.be.true;
        });
        it('should have src/types.ts', () => {
            const typesPath = path.join(projectRoot, 'src', 'types.ts');
            (0, chai_1.expect)(fs.existsSync(typesPath)).to.be.true;
            (0, chai_1.expect)(fs.statSync(typesPath).isFile()).to.be.true;
        });
        it('should have src/cli/index.ts', () => {
            const cliIndexPath = path.join(projectRoot, 'src', 'cli', 'index.ts');
            (0, chai_1.expect)(fs.existsSync(cliIndexPath)).to.be.true;
            (0, chai_1.expect)(fs.statSync(cliIndexPath).isFile()).to.be.true;
        });
        it('should have src/config/index.ts', () => {
            const configIndexPath = path.join(projectRoot, 'src', 'config', 'index.ts');
            (0, chai_1.expect)(fs.existsSync(configIndexPath)).to.be.true;
            (0, chai_1.expect)(fs.statSync(configIndexPath).isFile()).to.be.true;
        });
        it('should have src/process/index.ts', () => {
            const processIndexPath = path.join(projectRoot, 'src', 'process', 'index.ts');
            (0, chai_1.expect)(fs.existsSync(processIndexPath)).to.be.true;
            (0, chai_1.expect)(fs.statSync(processIndexPath).isFile()).to.be.true;
        });
        it('should have src/health/index.ts', () => {
            const healthIndexPath = path.join(projectRoot, 'src', 'health', 'index.ts');
            (0, chai_1.expect)(fs.existsSync(healthIndexPath)).to.be.true;
            (0, chai_1.expect)(fs.statSync(healthIndexPath).isFile()).to.be.true;
        });
    });
    describe('Package configuration', () => {
        let packageJson;
        before(() => {
            const packagePath = path.join(projectRoot, 'package.json');
            const packageContent = fs.readFileSync(packagePath, 'utf-8');
            packageJson = JSON.parse(packageContent);
        });
        it('should have fast-check as a dependency', () => {
            (0, chai_1.expect)(packageJson.devDependencies).to.have.property('fast-check');
        });
        it('should have typescript as a dependency', () => {
            (0, chai_1.expect)(packageJson.devDependencies).to.have.property('typescript');
        });
        it('should have mocha as a dependency', () => {
            (0, chai_1.expect)(packageJson.devDependencies).to.have.property('mocha');
        });
        it('should have chai as a dependency', () => {
            (0, chai_1.expect)(packageJson.devDependencies).to.have.property('chai');
        });
        it('should have build script', () => {
            (0, chai_1.expect)(packageJson.scripts).to.have.property('build');
        });
        it('should have test script', () => {
            (0, chai_1.expect)(packageJson.scripts).to.have.property('test');
        });
        it('should have test:property script', () => {
            (0, chai_1.expect)(packageJson.scripts).to.have.property('test:property');
        });
        it('should have test:unit script', () => {
            (0, chai_1.expect)(packageJson.scripts).to.have.property('test:unit');
        });
    });
    describe('TypeScript configuration', () => {
        let tsconfig;
        before(() => {
            const tsconfigPath = path.join(projectRoot, 'tsconfig.json');
            const tsconfigContent = fs.readFileSync(tsconfigPath, 'utf-8');
            tsconfig = JSON.parse(tsconfigContent);
        });
        it('should have strict mode enabled', () => {
            (0, chai_1.expect)(tsconfig.compilerOptions.strict).to.be.true;
        });
        it('should have outDir configured', () => {
            (0, chai_1.expect)(tsconfig.compilerOptions).to.have.property('outDir');
        });
        it('should include src directory', () => {
            (0, chai_1.expect)(tsconfig.include).to.include.members(['src/**/*']);
        });
        it('should include tests directory', () => {
            (0, chai_1.expect)(tsconfig.include).to.include.members(['tests/**/*']);
        });
    });
});
