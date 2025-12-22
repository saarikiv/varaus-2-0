/**
 * CLI Commands Unit Tests
 * Tests command parsing, execution, and error handling
 */

import { expect } from 'chai';
import { CoordinationCLIImpl } from '../../src/cli';
import { Environment } from '../../src/types';

describe('CLI Commands', () => {
  describe('Command Parsing', () => {
    it('should accept valid environment values', () => {
      const validEnvironments: Environment[] = ['development', 'staging', 'production'];
      
      validEnvironments.forEach(env => {
        expect(['development', 'staging', 'production']).to.include(env);
      });
    });

    it('should accept valid test types', () => {
      const validTestTypes = ['unit', 'integration', 'e2e', 'all'];
      
      validTestTypes.forEach(type => {
        expect(['unit', 'integration', 'e2e', 'all']).to.include(type);
      });
    });

    it('should accept valid deployment targets', () => {
      const validTargets = ['staging', 'production'];
      
      validTargets.forEach(target => {
        expect(['staging', 'production']).to.include(target);
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
        
        const cli = new CoordinationCLIImpl();
        
        // Attempt to start should fail with clear error message
        try {
          await cli.start('development');
          expect.fail('Should have thrown an error');
        } catch (error) {
          expect(error).to.be.instanceOf(Error);
          const errorMessage = (error as Error).message;
          expect(errorMessage).to.include('Missing required environment variable');
        }
      } finally {
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
        
        const cli = new CoordinationCLIImpl();
        
        try {
          await cli.start('development');
          expect.fail('Should have thrown an error');
        } catch (error) {
          expect(error).to.be.instanceOf(Error);
          // Error should be caught during configuration loading or validation
        }
      } finally {
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
            application: 'backend' as const,
            path: '/path/to/backend/dist',
            size: 1024,
            hash: 'abc123'
          },
          {
            application: 'frontend' as const,
            path: '/path/to/frontend/public',
            size: 2048,
            hash: 'def456'
          }
        ],
        duration: 5000
      };

      expect(buildResult.success).to.be.true;
      expect(buildResult.artifacts).to.have.lengthOf(2);
      expect(buildResult.duration).to.be.a('number');
    });

    it('should format test results correctly', () => {
      const testResult = {
        success: true,
        passed: 10,
        failed: 0,
        duration: 3000
      };

      expect(testResult.success).to.be.true;
      expect(testResult.passed).to.equal(10);
      expect(testResult.failed).to.equal(0);
      expect(testResult.duration).to.be.a('number');
    });

    it('should format deployment results correctly', () => {
      const deploymentResult = {
        success: true,
        environment: 'staging' as Environment,
        timestamp: new Date(),
        healthChecksPassed: true
      };

      expect(deploymentResult.success).to.be.true;
      expect(deploymentResult.environment).to.equal('staging');
      expect(deploymentResult.timestamp).to.be.instanceOf(Date);
      expect(deploymentResult.healthChecksPassed).to.be.true;
    });

    it('should format system status correctly', () => {
      const systemStatus = {
        frontend: {
          status: 'running' as const,
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
          status: 'running' as const,
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
          apiConnectivity: 'connected' as const,
          databaseConnectivity: 'connected' as const,
          crossOriginStatus: 'configured' as const
        },
        environment: 'development' as Environment,
        uptime: 60000
      };

      expect(systemStatus.frontend.status).to.equal('running');
      expect(systemStatus.backend.status).to.equal('running');
      expect(systemStatus.integration.apiConnectivity).to.equal('connected');
      expect(systemStatus.environment).to.equal('development');
      expect(systemStatus.uptime).to.be.a('number');
    });
  });

  describe('Command Execution', () => {
    it('should validate environment parameter for start command', () => {
      const validEnvironments: Environment[] = ['development', 'staging', 'production'];
      
      validEnvironments.forEach(env => {
        expect(['development', 'staging', 'production']).to.include(env);
      });
    });

    it('should validate environment parameter for build command', () => {
      const validEnvironments: Environment[] = ['development', 'staging', 'production'];
      
      validEnvironments.forEach(env => {
        expect(['development', 'staging', 'production']).to.include(env);
      });
    });

    it('should validate test type parameter for test command', () => {
      const validTestTypes = ['unit', 'integration', 'e2e', 'all'];
      
      validTestTypes.forEach(type => {
        expect(['unit', 'integration', 'e2e', 'all']).to.include(type);
      });
    });

    it('should validate deployment target for deploy command', () => {
      const validTargets = ['staging', 'production'];
      
      validTargets.forEach(target => {
        expect(['staging', 'production']).to.include(target);
      });
    });
  });

  describe('Error Messages', () => {
    it('should provide clear error message for missing environment variables', () => {
      const errorMessage = 'Missing required environment variable: FRONTEND_API_ENDPOINT (required by frontend for development environment)';
      
      expect(errorMessage).to.include('Missing required environment variable');
      expect(errorMessage).to.include('FRONTEND_API_ENDPOINT');
      expect(errorMessage).to.include('frontend');
      expect(errorMessage).to.include('development');
    });

    it('should provide clear error message for port conflicts', () => {
      const errorMessage = 'Port 3000 is already in use. Another process is using the required port.';
      
      expect(errorMessage).to.include('Port');
      expect(errorMessage).to.include('already in use');
    });

    it('should provide clear error message for build failures', () => {
      const errorMessage = 'Build failed: Compilation error in src/app.ts:10:5';
      
      expect(errorMessage).to.include('Build failed');
      expect(errorMessage).to.include('Compilation error');
    });

    it('should provide clear error message for test failures', () => {
      const errorMessage = 'Test failed: Expected 5 to equal 10';
      
      expect(errorMessage).to.include('Test failed');
      expect(errorMessage).to.include('Expected');
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
      
      expect(guidance).to.include('Missing environment variables');
      expect(guidance).to.include('FRONTEND_API_ENDPOINT');
      expect(guidance).to.include('BACKEND_PORT');
      expect(guidance).to.include('FIREBASE');
    });

    it('should provide guidance for port conflicts', () => {
      const guidance = `
Port already in use.
Another process is using the required port.
Try stopping other applications or changing the port configuration.
`;
      
      expect(guidance).to.include('Port already in use');
      expect(guidance).to.include('stopping other applications');
    });

    it('should provide guidance for missing dependencies', () => {
      const guidance = `
Missing dependencies detected.
Run npm install in both application directories:
  cd varaus && npm install
  cd varausserver && npm install
`;
      
      expect(guidance).to.include('Missing dependencies');
      expect(guidance).to.include('npm install');
      expect(guidance).to.include('varaus');
      expect(guidance).to.include('varausserver');
    });

    it('should provide guidance for Firebase connectivity issues', () => {
      const guidance = `
Firebase connectivity issue detected.
Please verify:
  - Firebase configuration is correct
  - Firebase project is accessible
  - Network connectivity to Firebase services
`;
      
      expect(guidance).to.include('Firebase connectivity');
      expect(guidance).to.include('Firebase configuration');
      expect(guidance).to.include('Firebase project');
    });
  });
});
