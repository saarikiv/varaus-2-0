/**
 * Process Manager Module
 * Handles application lifecycle management and coordination
 */

import { spawn, ChildProcess } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';
import { ApplicationName, ProcessStatus, LogStream, LogEntry, LogLevel } from '../types';

export interface ProcessManager {
  startApplication(app: ApplicationName, config: ProcessConfig): Promise<ProcessHandle>;
  stopApplication(app: ApplicationName): Promise<void>;
  restartApplication(app: ApplicationName): Promise<void>;
  getProcessStatus(app: ApplicationName): ProcessStatus;
  watchForChanges(app: ApplicationName, callback: ChangeCallback): void;
}

export interface ProcessHandle {
  pid: number;
  port?: number;
  status: ProcessStatus;
  logs: LogStream;
}

export interface ProcessConfig {
  port?: number;
  apiEndpoint?: string;
  firebaseConfig?: any;
  environment?: string;
  projectRoot?: string;
  [key: string]: any;
}

export type ChangeCallback = (event: ChangeEvent) => void;

export interface ChangeEvent {
  type: 'add' | 'change' | 'unlink';
  path: string;
  timestamp: Date;
}

/**
 * Process Manager Implementation
 */
export class ProcessManagerImpl implements ProcessManager {
  private processes: Map<ApplicationName, ManagedProcess> = new Map();
  private projectRoot: string;

  constructor(projectRoot: string = process.cwd()) {
    this.projectRoot = projectRoot;
  }

  async startApplication(app: ApplicationName, config: ProcessConfig): Promise<ProcessHandle> {
    if (app === 'both') {
      throw new Error('Cannot start "both" - specify "frontend" or "backend"');
    }

    // Check if process is already running
    const existing = this.processes.get(app);
    if (existing && existing.status === 'running') {
      throw new Error(`${app} is already running`);
    }

    // Create managed process
    const managedProcess = new ManagedProcess(app, config, this.projectRoot);
    this.processes.set(app, managedProcess);

    // Start the process
    await managedProcess.start();

    return managedProcess.getHandle();
  }

  async stopApplication(app: ApplicationName): Promise<void> {
    if (app === 'both') {
      // Stop both applications
      await Promise.all([
        this.stopApplication('frontend'),
        this.stopApplication('backend')
      ]);
      return;
    }

    const managedProcess = this.processes.get(app);
    if (!managedProcess) {
      throw new Error(`${app} is not running`);
    }

    await managedProcess.stop();
    this.processes.delete(app);
  }

  async restartApplication(app: ApplicationName): Promise<void> {
    if (app === 'both') {
      throw new Error('Cannot restart "both" - specify "frontend" or "backend"');
    }

    const managedProcess = this.processes.get(app);
    if (!managedProcess) {
      throw new Error(`${app} is not running`);
    }

    const config = managedProcess.config;
    await this.stopApplication(app);
    await this.startApplication(app, config);
  }

  getProcessStatus(app: ApplicationName): ProcessStatus {
    if (app === 'both') {
      throw new Error('Cannot get status for "both" - specify "frontend" or "backend"');
    }

    const managedProcess = this.processes.get(app);
    if (!managedProcess) {
      return 'stopped';
    }

    return managedProcess.status;
  }

  watchForChanges(app: ApplicationName, callback: ChangeCallback): void {
    if (app === 'both') {
      throw new Error('Cannot watch "both" - specify "frontend" or "backend"');
    }

    const managedProcess = this.processes.get(app);
    if (!managedProcess) {
      throw new Error(`${app} is not running`);
    }

    managedProcess.watchForChanges(callback);
  }
}

/**
 * Managed Process
 * Represents a single application process with lifecycle management
 */
class ManagedProcess {
  private app: ApplicationName;
  public config: ProcessConfig;
  private projectRoot: string;
  private childProcess: ChildProcess | null = null;
  public status: ProcessStatus = 'stopped';
  private logEntries: LogEntry[] = [];
  private watchers: ChangeCallback[] = [];
  private fsWatcher: fs.FSWatcher | null = null;

  constructor(app: ApplicationName, config: ProcessConfig, projectRoot: string) {
    this.app = app;
    this.config = config;
    this.projectRoot = projectRoot;
  }

  async start(): Promise<void> {
    this.status = 'starting';
    
    try {
      const appDir = this.getApplicationDirectory();
      const command = this.getStartCommand();
      const args = this.getStartArgs();
      const env = this.buildEnvironment();

      this.log('info', `Starting ${this.app} in ${appDir}`);
      this.log('debug', `Command: ${command} ${args.join(' ')}`);

      // Spawn the process
      this.childProcess = spawn(command, args, {
        cwd: appDir,
        env,
        stdio: ['ignore', 'pipe', 'pipe'],
        shell: true
      });

      // Capture stdout
      this.childProcess.stdout?.on('data', (data: Buffer) => {
        const message = data.toString().trim();
        this.log('info', message);
      });

      // Capture stderr
      this.childProcess.stderr?.on('data', (data: Buffer) => {
        const message = data.toString().trim();
        this.log('error', message);
      });

      // Handle process exit
      this.childProcess.on('exit', (code: number | null, signal: string | null) => {
        if (code !== 0 && code !== null) {
          this.log('error', `Process exited with code ${code}`);
          this.status = 'error';
        } else if (signal) {
          this.log('info', `Process terminated with signal ${signal}`);
          this.status = 'stopped';
        } else {
          this.log('info', `Process exited normally`);
          this.status = 'stopped';
        }
      });

      // Handle process errors
      this.childProcess.on('error', (error: Error) => {
        this.log('error', `Process error: ${error.message}`);
        this.status = 'error';
      });

      // Wait for process to be ready
      await this.waitForReady();

      this.status = 'running';
      this.log('info', `${this.app} started successfully`);
    } catch (error) {
      this.status = 'error';
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.log('error', `Failed to start ${this.app}: ${errorMessage}`);
      throw error;
    }
  }

  async stop(): Promise<void> {
    if (!this.childProcess) {
      return;
    }

    this.status = 'stopping';
    this.log('info', `Stopping ${this.app}`);

    // Stop file watcher
    if (this.fsWatcher) {
      this.fsWatcher.close();
      this.fsWatcher = null;
    }

    return new Promise((resolve) => {
      if (!this.childProcess) {
        resolve();
        return;
      }

      this.childProcess.on('exit', () => {
        this.status = 'stopped';
        this.log('info', `${this.app} stopped`);
        resolve();
      });

      // Try graceful shutdown first
      this.childProcess.kill('SIGTERM');

      // Force kill after timeout
      setTimeout(() => {
        if (this.childProcess && !this.childProcess.killed) {
          this.childProcess.kill('SIGKILL');
        }
      }, 5000);
    });
  }

  getHandle(): ProcessHandle {
    return {
      pid: this.childProcess?.pid || 0,
      port: this.config.port,
      status: this.status,
      logs: {
        entries: [...this.logEntries]
      }
    };
  }

  watchForChanges(callback: ChangeCallback): void {
    this.watchers.push(callback);

    // Set up file watcher if not already watching
    if (!this.fsWatcher) {
      const appDir = this.getApplicationDirectory();
      const watchPath = path.join(appDir, 'src');

      if (fs.existsSync(watchPath)) {
        this.fsWatcher = fs.watch(watchPath, { recursive: true }, (eventType, filename) => {
          if (filename) {
            const event: ChangeEvent = {
              type: eventType === 'rename' ? 'change' : 'change',
              path: path.join(watchPath, filename),
              timestamp: new Date()
            };

            // Notify all watchers
            this.watchers.forEach(watcher => watcher(event));
          }
        });
      }
    }
  }

  private getApplicationDirectory(): string {
    if (this.app === 'frontend') {
      return path.join(this.projectRoot, 'varaus');
    } else if (this.app === 'backend') {
      return path.join(this.projectRoot, 'varausserver');
    }
    throw new Error(`Unknown application: ${this.app}`);
  }

  private getStartCommand(): string {
    // Use npm for both applications
    return 'npm';
  }

  private getStartArgs(): string[] {
    if (this.app === 'frontend') {
      return ['run', 'dev'];
    } else if (this.app === 'backend') {
      return ['run', 'dev'];
    }
    throw new Error(`Unknown application: ${this.app}`);
  }

  private buildEnvironment(): NodeJS.ProcessEnv {
    const env = { ...process.env };

    // Inject configuration as environment variables
    if (this.config.port) {
      if (this.app === 'backend') {
        env.PORT = String(this.config.port);
        env.BACKEND_PORT = String(this.config.port);
      } else if (this.app === 'frontend') {
        env.FRONTEND_DEV_PORT = String(this.config.port);
      }
    }

    if (this.config.apiEndpoint) {
      env.FRONTEND_API_ENDPOINT = this.config.apiEndpoint;
    }

    if (this.config.firebaseConfig) {
      const prefix = (this.config.environment || 'development').toUpperCase();
      env[`${prefix}_FIREBASE_API_KEY`] = this.config.firebaseConfig.apiKey;
      env[`${prefix}_FIREBASE_AUTH_DOMAIN`] = this.config.firebaseConfig.authDomain;
      env[`${prefix}_FIREBASE_DATABASE_URL`] = this.config.firebaseConfig.databaseURL;
      env[`${prefix}_FIREBASE_PROJECT_ID`] = this.config.firebaseConfig.projectId;
      env[`${prefix}_FIREBASE_STORAGE_BUCKET`] = this.config.firebaseConfig.storageBucket;
      env[`${prefix}_FIREBASE_MESSAGING_SENDER_ID`] = this.config.firebaseConfig.messagingSenderId;
      env[`${prefix}_FIREBASE_APP_ID`] = this.config.firebaseConfig.appId;
    }

    return env;
  }

  private async waitForReady(): Promise<void> {
    // Wait for process to be ready (simple timeout for now)
    // In a real implementation, we would check for specific log messages or health endpoints
    return new Promise((resolve) => {
      setTimeout(resolve, 2000);
    });
  }

  private log(level: LogLevel, message: string): void {
    const entry: LogEntry = {
      timestamp: new Date(),
      level,
      application: this.app,
      message
    };
    this.logEntries.push(entry);

    // Keep only last 1000 log entries
    if (this.logEntries.length > 1000) {
      this.logEntries.shift();
    }
  }
}

// Export singleton instance
export const processManager = new ProcessManagerImpl();

// Export coordinator and monitor
export * from './coordinator';
export * from './monitor';
