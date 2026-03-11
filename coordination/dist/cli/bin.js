#!/usr/bin/env node
"use strict";
/**
 * CLI Entry Point
 * Command-line interface for Varaus Full-Stack Coordination System
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
// Load environment variables from .env file
const dotenv = __importStar(require("dotenv"));
const path = __importStar(require("path"));
// Load .env from project root (three levels up from dist/cli/)
const projectRoot = path.resolve(__dirname, '..', '..', '..');
dotenv.config({ path: path.join(projectRoot, '.env') });
const index_1 = require("./index");
// Create CLI instance with correct project root
const coordinationCLI = new index_1.CoordinationCLIImpl(projectRoot);
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
                await coordinationCLI.start(environment);
                break;
            }
            case 'build': {
                const environment = parseEnvironment(args[1]);
                const result = await coordinationCLI.build(environment);
                process.exit(result.success ? 0 : 1);
                break;
            }
            case 'test': {
                const testType = parseTestType(args[1]);
                const result = await coordinationCLI.test(testType);
                process.exit(result.success ? 0 : 1);
                break;
            }
            case 'status': {
                await coordinationCLI.status();
                break;
            }
            case 'logs': {
                const app = args[1];
                await coordinationCLI.logs(app);
                break;
            }
            case 'deploy': {
                const target = parseDeploymentTarget(args[1]);
                const result = await coordinationCLI.deploy(target);
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
