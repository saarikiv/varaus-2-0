"use strict";
/**
 * Varaus Full-Stack Coordination System
 * Main entry point for the coordination system
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
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.testCoordinator = exports.TestCoordinatorImpl = exports.buildCoordinator = exports.BuildCoordinatorImpl = exports.createHealthMonitor = exports.HealthMonitorImpl = exports.processManager = exports.ManagedProcess = exports.ProcessManagerImpl = exports.isValidSystemConfig = exports.isValidBackendConfig = exports.isValidFrontendConfig = exports.isValidFirebaseConfig = exports.isValidEnvironment = exports.validateConfigSchema = exports.configSchema = exports.configManager = exports.ConfigManager = exports.CoordinationCLIImpl = exports.coordinationCLI = void 0;
// Export types first
__exportStar(require("./types"), exports);
// Export modules (these may re-export some types, but TypeScript will handle the ambiguity)
var cli_1 = require("./cli");
Object.defineProperty(exports, "coordinationCLI", { enumerable: true, get: function () { return cli_1.coordinationCLI; } });
Object.defineProperty(exports, "CoordinationCLIImpl", { enumerable: true, get: function () { return cli_1.CoordinationCLIImpl; } });
var config_1 = require("./config");
Object.defineProperty(exports, "ConfigManager", { enumerable: true, get: function () { return config_1.ConfigManager; } });
Object.defineProperty(exports, "configManager", { enumerable: true, get: function () { return config_1.configManager; } });
Object.defineProperty(exports, "configSchema", { enumerable: true, get: function () { return config_1.configSchema; } });
Object.defineProperty(exports, "validateConfigSchema", { enumerable: true, get: function () { return config_1.validateConfigSchema; } });
Object.defineProperty(exports, "isValidEnvironment", { enumerable: true, get: function () { return config_1.isValidEnvironment; } });
Object.defineProperty(exports, "isValidFirebaseConfig", { enumerable: true, get: function () { return config_1.isValidFirebaseConfig; } });
Object.defineProperty(exports, "isValidFrontendConfig", { enumerable: true, get: function () { return config_1.isValidFrontendConfig; } });
Object.defineProperty(exports, "isValidBackendConfig", { enumerable: true, get: function () { return config_1.isValidBackendConfig; } });
Object.defineProperty(exports, "isValidSystemConfig", { enumerable: true, get: function () { return config_1.isValidSystemConfig; } });
var process_1 = require("./process");
Object.defineProperty(exports, "ProcessManagerImpl", { enumerable: true, get: function () { return process_1.ProcessManagerImpl; } });
Object.defineProperty(exports, "ManagedProcess", { enumerable: true, get: function () { return process_1.ManagedProcess; } });
Object.defineProperty(exports, "processManager", { enumerable: true, get: function () { return process_1.processManager; } });
var health_1 = require("./health");
Object.defineProperty(exports, "HealthMonitorImpl", { enumerable: true, get: function () { return health_1.HealthMonitorImpl; } });
Object.defineProperty(exports, "createHealthMonitor", { enumerable: true, get: function () { return health_1.createHealthMonitor; } });
__exportStar(require("./logging"), exports);
var build_1 = require("./build");
Object.defineProperty(exports, "BuildCoordinatorImpl", { enumerable: true, get: function () { return build_1.BuildCoordinatorImpl; } });
Object.defineProperty(exports, "buildCoordinator", { enumerable: true, get: function () { return build_1.buildCoordinator; } });
var test_1 = require("./test");
Object.defineProperty(exports, "TestCoordinatorImpl", { enumerable: true, get: function () { return test_1.TestCoordinatorImpl; } });
Object.defineProperty(exports, "testCoordinator", { enumerable: true, get: function () { return test_1.testCoordinator; } });
