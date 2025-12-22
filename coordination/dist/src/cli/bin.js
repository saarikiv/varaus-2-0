#!/usr/bin/env node
"use strict";
/**
 * CLI Entry Point
 * Command-line interface for Varaus Full-Stack Coordination System
 */
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("./index");
// Parse command line arguments
const args = process.argv.slice(2);
const command = args[0];
/**
 * Display help information
 */
function displayHelp() {
    console.log(`
Varaus Full-Stack Coordination System

Usage: coordination <command> [options]

Commands:
  start [env]           Start both applications in development environment
                        env: development (default), staging, production

  build [env]           Build both applications for specified environment
                        env: development (default), staging, production

  test [type]           Run tests for both applications
                        type: unit (default), integration, e2e, all

  status                Display current system status

  logs [app]            Display application logs
                        app: frontend, backend, both (default)

  deploy <target>       Deploy applications to staging or production
                        target: staging, production

  help                  Display this help information

Examples:
  coordination start
  coordination start production
  coordination build staging
  coordination test unit
  coordination status
  coordination deploy staging

Environment Variables:
  FRONTEND_API_ENDPOINT              - Frontend API endpoint URL
  BACKEND_PORT                       - Backend server port
  <ENV>_FIREBASE_API_KEY            - Firebase API key
  <ENV>_FIREBASE_AUTH_DOMAIN        - Firebase auth domain
  <ENV>_FIREBASE_DATABASE_URL       - Firebase database URL
  <ENV>_FIREBASE_PROJECT_ID         - Firebase project ID
  <ENV>_FIREBASE_STORAGE_BUCKET     - Firebase storage bucket
  <ENV>_FIREBASE_MESSAGING_SENDER_ID - Firebase messaging sender ID
  <ENV>_FIREBASE_APP_ID             - Firebase app ID

  Where <ENV> is DEVELOPMENT, STAGING, or PRODUCTION
`);
}
/**
 * Parse environment argument
 */
function parseEnvironment(envArg) {
    const env = envArg || 'development';
    if (env !== 'development' && env !== 'staging' && env !== 'production') {
        console.error(`Invalid environment: ${env}`);
        console.error('Valid environments: development, staging, production');
        process.exit(1);
    }
    return env;
}
/**
 * Parse test type argument
 */
function parseTestType(typeArg) {
    const type = typeArg || 'unit';
    if (type !== 'unit' && type !== 'integration' && type !== 'e2e' && type !== 'all') {
        console.error(`Invalid test type: ${type}`);
        console.error('Valid test types: unit, integration, e2e, all');
        process.exit(1);
    }
    return type;
}
/**
 * Parse deployment target argument
 */
function parseDeploymentTarget(targetArg) {
    if (!targetArg) {
        console.error('Deployment target is required');
        console.error('Valid targets: staging, production');
        process.exit(1);
    }
    if (targetArg !== 'staging' && targetArg !== 'production') {
        console.error(`Invalid deployment target: ${targetArg}`);
        console.error('Valid targets: staging, production');
        process.exit(1);
    }
    return targetArg;
}
/**
 * Main CLI execution
 */
async function main() {
    try {
        switch (command) {
            case 'start': {
                const environment = parseEnvironment(args[1]);
                await index_1.coordinationCLI.start(environment);
                break;
            }
            case 'build': {
                const environment = parseEnvironment(args[1]);
                const result = await index_1.coordinationCLI.build(environment);
                process.exit(result.success ? 0 : 1);
                break;
            }
            case 'test': {
                const testType = parseTestType(args[1]);
                const result = await index_1.coordinationCLI.test(testType);
                process.exit(result.success ? 0 : 1);
                break;
            }
            case 'status': {
                await index_1.coordinationCLI.status();
                break;
            }
            case 'logs': {
                const app = args[1];
                await index_1.coordinationCLI.logs(app);
                break;
            }
            case 'deploy': {
                const target = parseDeploymentTarget(args[1]);
                const result = await index_1.coordinationCLI.deploy(target);
                process.exit(result.success ? 0 : 1);
                break;
            }
            case 'help':
            case '--help':
            case '-h':
            case undefined: {
                displayHelp();
                break;
            }
            default: {
                console.error(`Unknown command: ${command}`);
                console.error('Run "coordination help" for usage information');
                process.exit(1);
            }
        }
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(`\nError: ${errorMessage}\n`);
        process.exit(1);
    }
}
// Run the CLI
main();
