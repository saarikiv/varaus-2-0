/**
 * Process Monitor
 * Monitors application processes for crashes and file changes
 */

import { ProcessManagerImpl, ProcessConfig, ChangeEvent } from './index';
import { ApplicationName, ProcessStatus } from '../types';

export interface MonitorConfig {
  autoRestart: boolean;
  maxRestarts: number;
  restartDelay: number;
  watchFiles: boolean;
}

export interface MonitorStatus {
  application: ApplicationName;
  status: ProcessStatus;
  restartCount: number;
  lastRestart?: Date;
  watching: boolean;
}

export class ProcessMonitor {
  private processManager: ProcessManagerImpl;
  private monitoredApps: Map<ApplicationName, MonitoredApp> = new Map();
  private defaultConfig: MonitorConfig = {
    autoRestart: true,
    maxRestarts: 3,
    restartDelay: 2000,
    watchFiles: true
  };

  constructor(processManager: ProcessManagerImpl) {
    this.processManager = processManager;
  }

  /**
   * Start monitoring an application
   */
  startMonitoring(
    app: ApplicationName,
    processConfig: ProcessConfig,
    monitorConfig: Partial<MonitorConfig> = {}
  ): void {
    if (app === 'both') {
      throw new Error('Cannot monitor "both" - specify "frontend" or "backend"');
    }

    const config = { ...this.defaultConfig, ...monitorConfig };
    const monitored = new MonitoredApp(app, processConfig, config);
    this.monitoredApps.set(app, monitored);

    // Set up crash monitoring
    if (config.autoRestart) {
      this.setupCrashMonitoring(app, monitored);
    }

    // Set up file watching
    if (config.watchFiles) {
      this.setupFileWatching(app, monitored);
    }

    console.log(`Started monitoring ${app}`);
  }

  /**
   * Stop monitoring an application
   */
  stopMonitoring(app: ApplicationName): void {
    if (app === 'both') {
      this.stopMonitoring('frontend');
      this.stopMonitoring('backend');
      return;
    }

    const monitored = this.monitoredApps.get(app);
    if (monitored) {
      monitored.stopMonitoring();
      this.monitoredApps.delete(app);
      console.log(`Stopped monitoring ${app}`);
    }
  }

  /**
   * Get monitoring status for an application
   */
  getStatus(app: ApplicationName): MonitorStatus | null {
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
  async triggerRestart(app: ApplicationName, reason: string): Promise<void> {
    if (app === 'both') {
      throw new Error('Cannot restart "both" - specify "frontend" or "backend"');
    }

    const monitored = this.monitoredApps.get(app);
    if (!monitored) {
      throw new Error(`${app} is not being monitored`);
    }

    console.log(`Triggering restart of ${app}: ${reason}`);
    await this.restartApplication(app, monitored);
  }

  /**
   * Set up crash monitoring with automatic restart
   */
  private setupCrashMonitoring(app: ApplicationName, monitored: MonitoredApp): void {
    // Poll process status periodically
    monitored.statusCheckInterval = setInterval(() => {
      const status = this.processManager.getProcessStatus(app);
      
      if (status === 'error' || status === 'stopped') {
        // Process has crashed or stopped unexpectedly
        if (monitored.config.autoRestart && monitored.restartCount < monitored.config.maxRestarts) {
          console.log(`${app} crashed or stopped - attempting restart (${monitored.restartCount + 1}/${monitored.config.maxRestarts})`);
          
          // Delay restart to avoid rapid restart loops
          setTimeout(() => {
            this.restartApplication(app, monitored).catch(error => {
              console.error(`Failed to restart ${app}:`, error);
            });
          }, monitored.config.restartDelay);
        } else if (monitored.restartCount >= monitored.config.maxRestarts) {
          console.error(`${app} has crashed ${monitored.restartCount} times - stopping automatic restarts`);
          this.stopMonitoring(app);
        }
      }
    }, 5000); // Check every 5 seconds
  }

  /**
   * Set up file watching with automatic rebuild/restart
   */
  private setupFileWatching(app: ApplicationName, monitored: MonitoredApp): void {
    try {
      this.processManager.watchForChanges(app, (event: ChangeEvent) => {
        // Debounce file changes to avoid too many restarts
        if (monitored.fileChangeTimeout) {
          clearTimeout(monitored.fileChangeTimeout);
        }

        monitored.fileChangeTimeout = setTimeout(() => {
          console.log(`File changed in ${app}: ${event.path}`);
          console.log(`Triggering rebuild and restart...`);
          
          this.restartApplication(app, monitored).catch(error => {
            console.error(`Failed to restart ${app} after file change:`, error);
          });
        }, 1000); // Wait 1 second after last change
      });
    } catch (error) {
      console.warn(`Could not set up file watching for ${app}:`, error);
    }
  }

  /**
   * Restart an application
   */
  private async restartApplication(app: ApplicationName, monitored: MonitoredApp): Promise<void> {
    try {
      await this.processManager.restartApplication(app);
      monitored.restartCount++;
      monitored.lastRestart = new Date();
      console.log(`${app} restarted successfully`);
    } catch (error) {
      console.error(`Failed to restart ${app}:`, error);
      throw error;
    }
  }
}

/**
 * Monitored Application
 * Tracks monitoring state for a single application
 */
class MonitoredApp {
  public app: ApplicationName;
  public processConfig: ProcessConfig;
  public config: MonitorConfig;
  public restartCount: number = 0;
  public lastRestart?: Date;
  public statusCheckInterval?: NodeJS.Timeout;
  public fileChangeTimeout?: NodeJS.Timeout;

  constructor(app: ApplicationName, processConfig: ProcessConfig, config: MonitorConfig) {
    this.app = app;
    this.processConfig = processConfig;
    this.config = config;
  }

  stopMonitoring(): void {
    if (this.statusCheckInterval) {
      clearInterval(this.statusCheckInterval);
      this.statusCheckInterval = undefined;
    }
    if (this.fileChangeTimeout) {
      clearTimeout(this.fileChangeTimeout);
      this.fileChangeTimeout = undefined;
    }
  }
}
