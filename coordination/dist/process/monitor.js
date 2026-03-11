"use strict";
/**
 * Process Monitor
 * Monitors application processes for crashes and file changes.
 * Polls process status every 5 seconds, auto-restarts on crash with
 * configurable delay and max restart count, and watches src/ for file
 * changes with 1000ms debounce.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProcessMonitor = void 0;
class ProcessMonitor {
    processManager;
    monitoredApps = new Map();
    defaultConfig = {
        autoRestart: true,
        maxRestarts: 3,
        restartDelay: 2000,
        watchFiles: true
    };
    constructor(processManager) {
        this.processManager = processManager;
    }
    /**
     * Start monitoring an application
     */
    startMonitoring(app, processConfig, monitorConfig = {}) {
        if (app === 'both') {
            throw new Error('Cannot monitor "both" - specify "frontend" or "backend"');
        }
        const config = { ...this.defaultConfig, ...monitorConfig };
        const monitored = new MonitoredApp(app, processConfig, config);
        this.monitoredApps.set(app, monitored);
        // Set up crash monitoring (polling every 5 seconds)
        if (config.autoRestart) {
            this.setupCrashMonitoring(app, monitored);
        }
        // Set up file watching with 1000ms debounce
        if (config.watchFiles) {
            this.setupFileWatching(app, monitored);
        }
        console.log(`Started monitoring ${app}`);
    }
    /**
     * Stop monitoring an application
     */
    stopMonitoring(app) {
        if (app === 'both') {
            this.stopMonitoring('frontend');
            this.stopMonitoring('backend');
            return;
        }
        const monitored = this.monitoredApps.get(app);
        if (monitored) {
            monitored.cleanup();
            this.monitoredApps.delete(app);
            console.log(`Stopped monitoring ${app}`);
        }
    }
    /**
     * Get monitoring status for an application
     */
    getStatus(app) {
        if (app === 'both') {
            throw new Error('Cannot get status for "both" - specify "frontend" or "backend"');
        }
        const monitored = this.monitoredApps.get(app);
        if (!monitored) {
            return null;
        }
        return {
            application: app,
            status: this.processManager.getProcessStatus(app),
            restartCount: monitored.restartCount,
            lastRestart: monitored.lastRestart,
            watching: monitored.config.watchFiles
        };
    }
    /**
     * Manually trigger a restart
     */
    async triggerRestart(app, reason) {
        if (app === 'both') {
            throw new Error('Cannot restart "both" - specify "frontend" or "backend"');
        }
        const monitored = this.monitoredApps.get(app);
        if (!monitored) {
            throw new Error(`${app} is not being monitored`);
        }
        console.log(`Triggering restart of ${app}: ${reason}`);
        await this.performRestart(app, monitored);
    }
    /**
     * Poll process status every 5 seconds.
     * When a crash is detected (status "error" or "stopped"), schedule
     * a delayed restart unless max restarts have been reached or a
     * restart is already pending.
     */
    setupCrashMonitoring(app, monitored) {
        monitored.statusCheckInterval = setInterval(() => {
            const status = this.processManager.getProcessStatus(app);
            if (status === 'error' || status === 'stopped') {
                // Check if max restarts reached
                if (monitored.restartCount >= monitored.config.maxRestarts) {
                    if (!monitored.maxRestartsLogged) {
                        console.error(`${app} has reached the maximum restart count (${monitored.config.maxRestarts}) - stopping automatic restarts`);
                        monitored.maxRestartsLogged = true;
                    }
                    return;
                }
                // Avoid scheduling multiple restarts while one is pending
                if (monitored.restartPending) {
                    return;
                }
                monitored.restartPending = true;
                console.log(`${app} crashed or stopped - scheduling restart in ${monitored.config.restartDelay}ms ` +
                    `(${monitored.restartCount + 1}/${monitored.config.maxRestarts})`);
                monitored.restartTimeout = setTimeout(() => {
                    monitored.restartPending = false;
                    this.performRestart(app, monitored).catch(error => {
                        console.error(`Failed to restart ${app}:`, error);
                    });
                }, monitored.config.restartDelay);
            }
        }, 5000);
    }
    /**
     * Watch the application src/ directory for file changes.
     * Debounce changes for 1000ms before triggering a restart.
     */
    setupFileWatching(app, monitored) {
        try {
            this.processManager.watchForChanges(app, (event) => {
                if (monitored.fileChangeTimeout) {
                    clearTimeout(monitored.fileChangeTimeout);
                }
                monitored.fileChangeTimeout = setTimeout(() => {
                    console.log(`File changed in ${app}: ${event.path} - triggering restart`);
                    this.performRestart(app, monitored).catch(error => {
                        console.error(`Failed to restart ${app} after file change:`, error);
                    });
                }, 1000); // 1000ms debounce
            });
        }
        catch (error) {
            console.warn(`Could not set up file watching for ${app}:`, error);
        }
    }
    /**
     * Restart an application and update tracking state.
     */
    async performRestart(app, monitored) {
        try {
            await this.processManager.restartApplication(app);
            monitored.restartCount++;
            monitored.lastRestart = new Date();
            console.log(`${app} restarted successfully (restart #${monitored.restartCount})`);
        }
        catch (error) {
            console.error(`Failed to restart ${app}:`, error);
            throw error;
        }
    }
}
exports.ProcessMonitor = ProcessMonitor;
/**
 * Tracks monitoring state for a single application.
 */
class MonitoredApp {
    app;
    processConfig;
    config;
    restartCount = 0;
    lastRestart;
    statusCheckInterval;
    fileChangeTimeout;
    restartTimeout;
    restartPending = false;
    maxRestartsLogged = false;
    constructor(app, processConfig, config) {
        this.app = app;
        this.processConfig = processConfig;
        this.config = config;
    }
    cleanup() {
        if (this.statusCheckInterval) {
            clearInterval(this.statusCheckInterval);
            this.statusCheckInterval = undefined;
        }
        if (this.fileChangeTimeout) {
            clearTimeout(this.fileChangeTimeout);
            this.fileChangeTimeout = undefined;
        }
        if (this.restartTimeout) {
            clearTimeout(this.restartTimeout);
            this.restartTimeout = undefined;
        }
        this.restartPending = false;
    }
}
