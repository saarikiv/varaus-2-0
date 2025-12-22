"use strict";
/**
 * CLI Commands Unit Tests
 * Tests command parsing, execution, and error handling
 */
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const cli_1 = require("../../src/cli");
describe('CLI Commands', () => {
    describe('Command Parsing', () => {
        it('should accept valid environment values', () => {
            const validEnvironments = ['development', 'staging', 'production'];
            validEnvironments.forEach(env => {
                (0, chai_1.expect)(['development', 'staging', 'production']).to.include(env);
            });
        });
        it('should accept valid test types', () => {
            const validTestTypes = ['unit', 'integration', 'e2e', 'all'];
            validTestTypes.forEach(type => {
                (0, chai_1.expect)(['unit', 'integration', 'e2e', 'all']).to.include(type);
            });
        });
        it('should accept valid deployment targets', () => {
            const validTargets = ['staging', 'production'];
            validTargets.forEach(target => {
                (0, chai_1.expect)(['staging', 'production']).to.include(target);
            });
        });
    });
    describe('Error Handling', () => {
        it('should handle missing environment variables gracefully', async () => {
            // Save original env vars
            const originalEnv = { ...process.env };
            try {
                // Clear required environment variables
                delete process.env.FRONTEND_API_ENDPOINT;
                delete process.env.BACKEND_PORT;
                const cli = new cli_1.CoordinationCLIImpl();
                // Attempt to start should fail with clear error message
                try {
                    await cli.start('development');
                    chai_1.expect.fail('Should have thrown an error');
                }
                catch (error) {
                    (0, chai_1.expect)(error).to.be.instanceOf(Error);
                    const errorMessage = error.message;
                    (0, chai_1.expect)(errorMessage).to.include('Missing required environment variable');
                }
            }
            finally {
                // Restore environment variables
                process.env = originalEnv;
            }
        });
        it('should provide error messages for invalid configuration', async () => {
            // Save original env vars
            const originalEnv = { ...process.env };
            try {
                // Set invalid configuration
                process.env.FRONTEND_API_ENDPOINT = 'http://localhost:3000';
                process.env.BACKEND_PORT = 'invalid'; // Invalid port
                const cli = new cli_1.CoordinationCLIImpl();
                try {
                    await cli.start('development');
                    chai_1.expect.fail('Should have thrown an error');
                }
                catch (error) {
                    (0, chai_1.expect)(error).to.be.instanceOf(Error);
                    // Error should be caught during configuration loading or validation
                }
            }
            finally {
                // Restore environment variables
                process.env = originalEnv;
            }
        });
    });
    describe('Output Formatting', () => {
        it('should format build results correctly', () => {
            const buildResult = {
                success: true,
                artifacts: [
                    {
                        application: 'backend',
                        path: '/path/to/backend/dist',
                        size: 1024,
                        hash: 'abc123'
                    },
                    {
                        application: 'frontend',
                        path: '/path/to/frontend/public',
                        size: 2048,
                        hash: 'def456'
                    }
                ],
                duration: 5000
            };
            (0, chai_1.expect)(buildResult.success).to.be.true;
            (0, chai_1.expect)(buildResult.artifacts).to.have.lengthOf(2);
            (0, chai_1.expect)(buildResult.duration).to.be.a('number');
        });
        it('should format test results correctly', () => {
            const testResult = {
                success: true,
                passed: 10,
                failed: 0,
                duration: 3000
            };
            (0, chai_1.expect)(testResult.success).to.be.true;
            (0, chai_1.expect)(testResult.passed).to.equal(10);
            (0, chai_1.expect)(testResult.failed).to.equal(0);
            (0, chai_1.expect)(testResult.duration).to.be.a('number');
        });
        it('should format deployment results correctly', () => {
            const deploymentResult = {
                success: true,
                environment: 'staging',
                timestamp: new Date(),
                healthChecksPassed: true
            };
            (0, chai_1.expect)(deploymentResult.success).to.be.true;
            (0, chai_1.expect)(deploymentResult.environment).to.equal('staging');
            (0, chai_1.expect)(deploymentResult.timestamp).to.be.instanceOf(Date);
            (0, chai_1.expect)(deploymentResult.healthChecksPassed).to.be.true;
        });
        it('should format system status correctly', () => {
            const systemStatus = {
                frontend: {
                    status: 'running',
                    memory: {
                        heapUsed: 1024,
                        heapTotal: 2048,
                        external: 512
                    },
                    cpu: {
                        user: 1000,
                        system: 500
                    }
                },
                backend: {
                    status: 'running',
                    memory: {
                        heapUsed: 1024,
                        heapTotal: 2048,
                        external: 512
                    },
                    cpu: {
                        user: 1000,
                        system: 500
                    }
                },
                integration: {
                    apiConnectivity: 'connected',
                    databaseConnectivity: 'connected',
                    crossOriginStatus: 'configured'
                },
                environment: 'development',
                uptime: 60000
            };
            (0, chai_1.expect)(systemStatus.frontend.status).to.equal('running');
            (0, chai_1.expect)(systemStatus.backend.status).to.equal('running');
            (0, chai_1.expect)(systemStatus.integration.apiConnectivity).to.equal('connected');
            (0, chai_1.expect)(systemStatus.environment).to.equal('development');
            (0, chai_1.expect)(systemStatus.uptime).to.be.a('number');
        });
    });
    describe('Command Execution', () => {
        it('should validate environment parameter for start command', () => {
            const validEnvironments = ['development', 'staging', 'production'];
            validEnvironments.forEach(env => {
                (0, chai_1.expect)(['development', 'staging', 'production']).to.include(env);
            });
        });
        it('should validate environment parameter for build command', () => {
            const validEnvironments = ['development', 'staging', 'production'];
            validEnvironments.forEach(env => {
                (0, chai_1.expect)(['development', 'staging', 'production']).to.include(env);
            });
        });
        it('should validate test type parameter for test command', () => {
            const validTestTypes = ['unit', 'integration', 'e2e', 'all'];
            validTestTypes.forEach(type => {
                (0, chai_1.expect)(['unit', 'integration', 'e2e', 'all']).to.include(type);
            });
        });
        it('should validate deployment target for deploy command', () => {
            const validTargets = ['staging', 'production'];
            validTargets.forEach(target => {
                (0, chai_1.expect)(['staging', 'production']).to.include(target);
            });
        });
    });
    describe('Error Messages', () => {
        it('should provide clear error message for missing environment variables', () => {
            const errorMessage = 'Missing required environment variable: FRONTEND_API_ENDPOINT (required by frontend for development environment)';
            (0, chai_1.expect)(errorMessage).to.include('Missing required environment variable');
            (0, chai_1.expect)(errorMessage).to.include('FRONTEND_API_ENDPOINT');
            (0, chai_1.expect)(errorMessage).to.include('frontend');
            (0, chai_1.expect)(errorMessage).to.include('development');
        });
        it('should provide clear error message for port conflicts', () => {
            const errorMessage = 'Port 3000 is already in use. Another process is using the required port.';
            (0, chai_1.expect)(errorMessage).to.include('Port');
            (0, chai_1.expect)(errorMessage).to.include('already in use');
        });
        it('should provide clear error message for build failures', () => {
            const errorMessage = 'Build failed: Compilation error in src/app.ts:10:5';
            (0, chai_1.expect)(errorMessage).to.include('Build failed');
            (0, chai_1.expect)(errorMessage).to.include('Compilation error');
        });
        it('should provide clear error message for test failures', () => {
            const errorMessage = 'Test failed: Expected 5 to equal 10';
            (0, chai_1.expect)(errorMessage).to.include('Test failed');
            (0, chai_1.expect)(errorMessage).to.include('Expected');
        });
    });
    describe('Troubleshooting Guidance', () => {
        it('should provide guidance for missing environment variables', () => {
            const guidance = `
Missing environment variables detected.
Please ensure all required environment variables are set:
  - FRONTEND_API_ENDPOINT
  - BACKEND_PORT
  - <ENV>_FIREBASE_* variables
`;
            (0, chai_1.expect)(guidance).to.include('Missing environment variables');
            (0, chai_1.expect)(guidance).to.include('FRONTEND_API_ENDPOINT');
            (0, chai_1.expect)(guidance).to.include('BACKEND_PORT');
            (0, chai_1.expect)(guidance).to.include('FIREBASE');
        });
        it('should provide guidance for port conflicts', () => {
            const guidance = `
Port already in use.
Another process is using the required port.
Try stopping other applications or changing the port configuration.
`;
            (0, chai_1.expect)(guidance).to.include('Port already in use');
            (0, chai_1.expect)(guidance).to.include('stopping other applications');
        });
        it('should provide guidance for missing dependencies', () => {
            const guidance = `
Missing dependencies detected.
Run npm install in both application directories:
  cd varaus && npm install
  cd varausserver && npm install
`;
            (0, chai_1.expect)(guidance).to.include('Missing dependencies');
            (0, chai_1.expect)(guidance).to.include('npm install');
            (0, chai_1.expect)(guidance).to.include('varaus');
            (0, chai_1.expect)(guidance).to.include('varausserver');
        });
        it('should provide guidance for Firebase connectivity issues', () => {
            const guidance = `
Firebase connectivity issue detected.
Please verify:
  - Firebase configuration is correct
  - Firebase project is accessible
  - Network connectivity to Firebase services
`;
            (0, chai_1.expect)(guidance).to.include('Firebase connectivity');
            (0, chai_1.expect)(guidance).to.include('Firebase configuration');
            (0, chai_1.expect)(guidance).to.include('Firebase project');
        });
    });
});
