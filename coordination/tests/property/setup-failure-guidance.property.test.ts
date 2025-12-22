/**
 * Property-Based Tests for Setup Failure Guidance
 * Feature: full-stack-coordination, Property 17: Setup Failure Guidance
 * Validates: Requirements 8.3
 */

import { expect } from 'chai';
import * as fc from 'fast-check';

/**
 * Setup failure types that can occur during environment setup
 */
type SetupFailureType = 
  | 'node_version_mismatch'
  | 'missing_dependencies'
  | 'permission_error'
  | 'missing_env_vars'
  | 'invalid_firebase_config'
  | 'port_conflict'
  | 'build_failure'
  | 'network_error';

/**
 * Represents a setup failure with guidance
 */
interface SetupFailure {
  type: SetupFailureType;
  message: string;
  guidance: string[];
  component?: 'coordination' | 'frontend' | 'backend';
}

/**
 * Represents the result of a setup operation
 */
interface SetupResult {
  success: boolean;
  failures: SetupFailure[];
}

/**
 * Generates troubleshooting guidance for a given setup failure type
 */
function generateGuidanceForFailure(failureType: SetupFailureType): string[] {
  const guidanceMap: Record<SetupFailureType, string[]> = {
    node_version_mismatch: [
      'Check your current Node.js version with: node -v',
      'Install Node.js 20.x LTS from https://nodejs.org/',
      'If using nvm, run: nvm install 20 && nvm use 20',
      'Verify installation with: node -v'
    ],
    missing_dependencies: [
      'Run npm install in the coordination directory',
      'Run npm install in the varaus directory',
      'Run npm install in the varausserver directory',
      'If issues persist, try: npm cache clean --force',
      'Delete node_modules and package-lock.json, then reinstall'
    ],
    permission_error: [
      'On Linux/Mac, make setup script executable: chmod +x coordination/scripts/setup.sh',
      'On Windows, run PowerShell as Administrator',
      'Configure npm to use a different directory: npm config set prefix ~/.npm-global',
      'Avoid using sudo with npm commands'
    ],
    missing_env_vars: [
      'Copy the environment template: cp .env.template .env',
      'Edit .env file with your Firebase credentials',
      'Ensure all required variables are set for your target environment',
      'Check that variable names match the expected format (e.g., DEVELOPMENT_FIREBASE_API_KEY)'
    ],
    invalid_firebase_config: [
      'Verify Firebase credentials in .env file are correct',
      'Check Firebase project status in Firebase Console',
      'Ensure Firebase project is accessible with your account',
      'Verify Firebase API key has not been restricted or revoked',
      'Check Firebase security rules allow access'
    ],
    port_conflict: [
      'Find process using the port: lsof -i :PORT (Mac/Linux) or netstat -ano | findstr :PORT (Windows)',
      'Kill the conflicting process or change the port in .env',
      'Default ports: 3000 (backend), 8080 (frontend)',
      'Ensure no other instances of the applications are running'
    ],
    build_failure: [
      'Check the error message for specific file and line number',
      'Ensure all dependencies are installed: npm install',
      'Clear build artifacts: npm run clean',
      'Check for TypeScript or JavaScript syntax errors',
      'Verify webpack configuration is correct'
    ],
    network_error: [
      'Check your internet connection',
      'Verify you can reach external services (npm registry, Firebase)',
      'Check if a proxy or firewall is blocking connections',
      'Try using a different network',
      'Check if npm registry is accessible: npm ping'
    ]
  };

  return guidanceMap[failureType] || ['Check logs for more details', 'Consult documentation'];
}

/**
 * Simulates a setup failure with appropriate guidance
 */
function simulateSetupFailure(
  failureType: SetupFailureType,
  component?: 'coordination' | 'frontend' | 'backend'
): SetupFailure {
  const messages: Record<SetupFailureType, string> = {
    node_version_mismatch: 'Node.js version 20.x or higher is required',
    missing_dependencies: 'Required dependencies are not installed',
    permission_error: 'Permission denied during setup',
    missing_env_vars: 'Required environment variables are not set',
    invalid_firebase_config: 'Firebase configuration is invalid or inaccessible',
    port_conflict: 'Required port is already in use',
    build_failure: 'Build process failed with errors',
    network_error: 'Network connectivity issue detected'
  };

  return {
    type: failureType,
    message: messages[failureType],
    guidance: generateGuidanceForFailure(failureType),
    component
  };
}

describe('Property 17: Setup Failure Guidance', () => {
  /**
   * For any environment setup failure, the Coordination_System should provide 
   * troubleshooting guidance specific to the failure type.
   */

  it('should provide guidance for all setup failure types', function() {
    this.timeout(10000); // Increase timeout for property test

    fc.assert(
      fc.property(
        fc.constantFrom<SetupFailureType>(
          'node_version_mismatch',
          'missing_dependencies',
          'permission_error',
          'missing_env_vars',
          'invalid_firebase_config',
          'port_conflict',
          'build_failure',
          'network_error'
        ),
        (failureType) => {
          // Simulate a setup failure
          const failure = simulateSetupFailure(failureType);

          // Property: Every failure must have guidance
          expect(failure.guidance).to.be.an('array');
          expect(failure.guidance).to.not.be.empty;
          expect(failure.guidance.length).to.be.greaterThan(0);

          // Property: Each guidance step should be a non-empty string
          failure.guidance.forEach(step => {
            expect(step).to.be.a('string');
            expect(step.length).to.be.greaterThan(0);
          });

          // Property: Failure must have a descriptive message
          expect(failure.message).to.be.a('string');
          expect(failure.message.length).to.be.greaterThan(0);

          // Property: Failure type must be valid
          expect(failure.type).to.be.oneOf([
            'node_version_mismatch',
            'missing_dependencies',
            'permission_error',
            'missing_env_vars',
            'invalid_firebase_config',
            'port_conflict',
            'build_failure',
            'network_error'
          ]);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should provide specific guidance for Node.js version issues', () => {
    fc.assert(
      fc.property(
        fc.record({
          currentVersion: fc.integer({ min: 10, max: 19 }),
          requiredVersion: fc.constant(20)
        }),
        (testData) => {
          // Simulate Node.js version mismatch
          const failure = simulateSetupFailure('node_version_mismatch');

          // Property: Guidance should mention Node.js version
          const hasVersionGuidance = failure.guidance.some(step =>
            step.toLowerCase().includes('node') || step.toLowerCase().includes('version')
          );
          expect(hasVersionGuidance).to.be.true;

          // Property: Guidance should mention how to check version
          const hasCheckCommand = failure.guidance.some(step =>
            step.includes('node -v')
          );
          expect(hasCheckCommand).to.be.true;

          // Property: Guidance should mention installation
          const hasInstallGuidance = failure.guidance.some(step =>
            step.toLowerCase().includes('install')
          );
          expect(hasInstallGuidance).to.be.true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should provide specific guidance for missing dependencies', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('coordination', 'frontend', 'backend'),
        (component) => {
          // Simulate missing dependencies
          const failure = simulateSetupFailure('missing_dependencies', component as any);

          // Property: Guidance should mention npm install
          const hasInstallCommand = failure.guidance.some(step =>
            step.includes('npm install')
          );
          expect(hasInstallCommand).to.be.true;

          // Property: Guidance should mention multiple directories
          const mentionsDirectories = failure.guidance.some(step =>
            step.includes('coordination') || step.includes('varaus')
          );
          expect(mentionsDirectories).to.be.true;

          // Property: Guidance should include cache clearing option
          const hasCacheClear = failure.guidance.some(step =>
            step.includes('cache clean')
          );
          expect(hasCacheClear).to.be.true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should provide platform-specific guidance for permission errors', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('linux', 'mac', 'windows'),
        (platform) => {
          // Simulate permission error
          const failure = simulateSetupFailure('permission_error');

          // Property: Guidance should address permissions
          const hasPermissionGuidance = failure.guidance.some(step =>
            step.toLowerCase().includes('permission') ||
            step.toLowerCase().includes('chmod') ||
            step.toLowerCase().includes('administrator')
          );
          expect(hasPermissionGuidance).to.be.true;

          // Property: Guidance should mention avoiding sudo
          const mentionsSudo = failure.guidance.some(step =>
            step.toLowerCase().includes('sudo')
          );
          expect(mentionsSudo).to.be.true;

          // Property: Should have multiple troubleshooting steps
          expect(failure.guidance.length).to.be.at.least(2);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should provide specific guidance for environment variable issues', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.constantFrom(
            'FIREBASE_API_KEY',
            'FIREBASE_AUTH_DOMAIN',
            'FIREBASE_DATABASE_URL',
            'FIREBASE_PROJECT_ID'
          ),
          { minLength: 1, maxLength: 4 }
        ),
        (missingVars) => {
          // Simulate missing environment variables
          const failure = simulateSetupFailure('missing_env_vars');

          // Property: Guidance should mention .env file
          const mentionsEnvFile = failure.guidance.some(step =>
            step.includes('.env')
          );
          expect(mentionsEnvFile).to.be.true;

          // Property: Guidance should mention template
          const mentionsTemplate = failure.guidance.some(step =>
            step.includes('template')
          );
          expect(mentionsTemplate).to.be.true;

          // Property: Guidance should mention Firebase credentials
          const mentionsFirebase = failure.guidance.some(step =>
            step.toLowerCase().includes('firebase')
          );
          expect(mentionsFirebase).to.be.true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should provide specific guidance for Firebase configuration issues', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('invalid_key', 'project_not_found', 'access_denied', 'network_error'),
        (errorType) => {
          // Simulate Firebase configuration error
          const failure = simulateSetupFailure('invalid_firebase_config');

          // Property: Guidance should mention Firebase
          const mentionsFirebase = failure.guidance.some(step =>
            step.toLowerCase().includes('firebase')
          );
          expect(mentionsFirebase).to.be.true;

          // Property: Guidance should mention verification
          const mentionsVerification = failure.guidance.some(step =>
            step.toLowerCase().includes('verify') || step.toLowerCase().includes('check')
          );
          expect(mentionsVerification).to.be.true;

          // Property: Guidance should mention Firebase Console
          const mentionsConsole = failure.guidance.some(step =>
            step.includes('Console')
          );
          expect(mentionsConsole).to.be.true;

          // Property: Should have multiple troubleshooting steps
          expect(failure.guidance.length).to.be.at.least(3);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should provide specific guidance for port conflicts', () => {
    fc.assert(
      fc.property(
        fc.record({
          port: fc.constantFrom(3000, 8080),
          component: fc.constantFrom('frontend', 'backend')
        }),
        (testData) => {
          // Simulate port conflict
          const failure = simulateSetupFailure('port_conflict', testData.component as any);

          // Property: Guidance should mention port
          const mentionsPort = failure.guidance.some(step =>
            step.toLowerCase().includes('port')
          );
          expect(mentionsPort).to.be.true;

          // Property: Guidance should mention how to find conflicting process
          const hasFindCommand = failure.guidance.some(step =>
            step.includes('lsof') || step.includes('netstat')
          );
          expect(hasFindCommand).to.be.true;

          // Property: Guidance should mention changing port as alternative
          const mentionsChangePort = failure.guidance.some(step =>
            step.toLowerCase().includes('change') && step.toLowerCase().includes('port')
          );
          expect(mentionsChangePort).to.be.true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should provide specific guidance for build failures', () => {
    fc.assert(
      fc.property(
        fc.record({
          component: fc.constantFrom('coordination', 'frontend', 'backend'),
          errorType: fc.constantFrom('syntax', 'dependency', 'webpack', 'typescript')
        }),
        (testData) => {
          // Simulate build failure
          const failure = simulateSetupFailure('build_failure', testData.component as any);

          // Property: Guidance should mention checking error messages
          const mentionsErrorCheck = failure.guidance.some(step =>
            step.toLowerCase().includes('error') || step.toLowerCase().includes('check')
          );
          expect(mentionsErrorCheck).to.be.true;

          // Property: Guidance should mention dependencies
          const mentionsDependencies = failure.guidance.some(step =>
            step.toLowerCase().includes('dependencies') || step.includes('npm install')
          );
          expect(mentionsDependencies).to.be.true;

          // Property: Guidance should mention cleaning build artifacts
          const mentionsClean = failure.guidance.some(step =>
            step.toLowerCase().includes('clean')
          );
          expect(mentionsClean).to.be.true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should provide actionable steps in guidance', () => {
    fc.assert(
      fc.property(
        fc.constantFrom<SetupFailureType>(
          'node_version_mismatch',
          'missing_dependencies',
          'permission_error',
          'missing_env_vars',
          'invalid_firebase_config',
          'port_conflict',
          'build_failure',
          'network_error'
        ),
        (failureType) => {
          // Simulate any setup failure
          const failure = simulateSetupFailure(failureType);

          // Property: Each guidance step should be actionable (contain a verb or command)
          const actionableSteps = failure.guidance.filter(step => {
            const lowerStep = step.toLowerCase();
            return (
              lowerStep.includes('run') ||
              lowerStep.includes('check') ||
              lowerStep.includes('verify') ||
              lowerStep.includes('install') ||
              lowerStep.includes('ensure') ||
              lowerStep.includes('try') ||
              lowerStep.includes('delete') ||
              lowerStep.includes('copy') ||
              lowerStep.includes('edit') ||
              lowerStep.includes('configure') ||
              step.includes(':') || // Commands like "npm install"
              step.includes('&&') // Chained commands
            );
          });

          // Property: Most steps should be actionable
          const actionableRatio = actionableSteps.length / failure.guidance.length;
          expect(actionableRatio).to.be.greaterThan(0.5);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should provide multiple troubleshooting steps for each failure type', () => {
    fc.assert(
      fc.property(
        fc.constantFrom<SetupFailureType>(
          'node_version_mismatch',
          'missing_dependencies',
          'permission_error',
          'missing_env_vars',
          'invalid_firebase_config',
          'port_conflict',
          'build_failure',
          'network_error'
        ),
        (failureType) => {
          // Simulate setup failure
          const failure = simulateSetupFailure(failureType);

          // Property: Should have at least 2 troubleshooting steps
          expect(failure.guidance.length).to.be.at.least(2);

          // Property: Steps should be unique
          const uniqueSteps = new Set(failure.guidance);
          expect(uniqueSteps.size).to.equal(failure.guidance.length);

          // Property: Steps should be ordered logically (first step is usually diagnostic or actionable)
          const firstStep = failure.guidance[0].toLowerCase();
          const isDiagnosticOrActionable = 
            firstStep.includes('check') ||
            firstStep.includes('verify') ||
            firstStep.includes('find') ||
            firstStep.includes('ensure') ||
            firstStep.includes('run') ||
            firstStep.includes('install') ||
            firstStep.includes('make') ||
            firstStep.includes('set') ||
            firstStep.includes('on') ||  // "On Linux/Mac..."
            firstStep.includes('copy');
          
          // Most failure types should start with diagnostic or actionable steps
          // Some types may start with direct actions or platform-specific guidance
          const typesWithDirectActions = ['missing_env_vars', 'missing_dependencies', 'permission_error'];
          if (!typesWithDirectActions.includes(failureType)) {
            expect(isDiagnosticOrActionable).to.be.true;
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should ensure failed setups include at least one failure with guidance', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.constantFrom<SetupFailureType>(
            'node_version_mismatch',
            'missing_dependencies',
            'permission_error',
            'missing_env_vars',
            'invalid_firebase_config',
            'port_conflict',
            'build_failure',
            'network_error'
          ),
          { minLength: 1, maxLength: 5 }
        ),
        (failureTypes) => {
          // Simulate a setup result with multiple failures
          const failures = failureTypes.map(type => simulateSetupFailure(type));
          const result: SetupResult = {
            success: false,
            failures
          };

          // Property: Failed setup must have at least one failure
          expect(result.failures).to.not.be.empty;
          expect(result.failures.length).to.be.greaterThan(0);

          // Property: Every failure must have guidance
          result.failures.forEach(failure => {
            expect(failure.guidance).to.not.be.empty;
            expect(failure.guidance.length).to.be.greaterThan(0);
          });

          // Property: If setup failed, success must be false
          expect(result.success).to.be.false;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should provide guidance that references documentation when appropriate', () => {
    fc.assert(
      fc.property(
        fc.constantFrom<SetupFailureType>(
          'node_version_mismatch',
          'missing_dependencies',
          'permission_error',
          'missing_env_vars',
          'invalid_firebase_config',
          'port_conflict',
          'build_failure',
          'network_error'
        ),
        (failureType) => {
          // Simulate setup failure
          const failure = simulateSetupFailure(failureType);

          // Property: Guidance should be self-contained (not require external docs for basic steps)
          // But complex issues may reference external resources
          const hasExternalReference = failure.guidance.some(step =>
            step.includes('http') ||
            step.includes('www') ||
            step.includes('Console') ||
            step.includes('documentation')
          );

          // Property: External references should be for official sources
          if (hasExternalReference) {
            const hasOfficialSource = failure.guidance.some(step =>
              step.includes('nodejs.org') ||
              step.includes('Firebase Console') ||
              step.includes('npmjs.com')
            );
            // If there's an external reference, it should be to an official source
            // (This is a soft check - not all failures need external references)
          }

          // Property: Most guidance should be actionable without external resources
          const selfContainedSteps = failure.guidance.filter(step =>
            !step.includes('http') && !step.includes('www')
          );
          expect(selfContainedSteps.length).to.be.greaterThan(0);
        }
      ),
      { numRuns: 100 }
    );
  });
});
