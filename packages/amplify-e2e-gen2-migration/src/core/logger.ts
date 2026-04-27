/**
 * Logging system for the Amplify Migration System.
 */

import * as fs from 'fs-extra';
import * as path from 'path';
import chalk from 'chalk';
import os from 'os';

const LOG_DIR = path.join(os.tmpdir(), 'amplify-e2e-gen2-migration', 'logs');

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
}

interface LogEntry {
  readonly timestamp: Date;
  readonly level: LogLevel;
  readonly message: string;
  readonly error?: Error;
}

export class Logger {
  private readonly logLevel: LogLevel;
  private readonly logFilePath: string;

  constructor(private readonly appName: string, level: LogLevel = LogLevel.INFO) {
    this.logLevel = level;
    this.logFilePath = path.join(LOG_DIR, `${appName}.log`);
    fs.ensureDirSync(LOG_DIR);
    this.info(`Logging to: ${this.logFilePath}`);
  }

  public isDebug(): boolean {
    return this.logLevel === LogLevel.DEBUG;
  }

  public debug(message: string): void {
    this.log(LogLevel.DEBUG, message);
  }

  public info(message: string): void {
    this.log(LogLevel.INFO, message);
  }

  public warn(message: string): void {
    this.log(LogLevel.WARN, message);
  }

  public error(message: string, error?: Error): void {
    this.log(LogLevel.ERROR, message, error);
  }

  private log(level: LogLevel, message: string, error?: Error): void {
    if (!this.shouldLog(level)) return;

    const entry: LogEntry = { timestamp: new Date(), level, message, error };
    const formatted = this.formatMessage(entry);

    console.log(formatted);

    fs.appendFileSync(this.logFilePath, formatted + '\n');
  }

  private shouldLog(level: LogLevel): boolean {
    const levels = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR];
    return levels.indexOf(level) >= levels.indexOf(this.logLevel);
  }

  private formatMessage(entry: LogEntry): string {
    const timestamp = entry.timestamp.toISOString();
    const level = this.colorizeLevel(entry.level);
    const errorInfo = entry.error ? ` | Error: ${entry.error.message}${entry.error.stack ? `\n${chalk.red(entry.error.stack)}` : ''}` : '';
    return `[${timestamp}] ${level} [${this.appName}] ${entry.message}${errorInfo}`;
  }

  private colorizeLevel(level: LogLevel): string {
    switch (level) {
      case LogLevel.DEBUG:
        return chalk.gray('[DEBUG]');
      case LogLevel.INFO:
        return chalk.blue('[INFO]');
      case LogLevel.WARN:
        return chalk.yellow('[WARN]');
      case LogLevel.ERROR:
        return chalk.red('[ERROR]');
      default:
        return chalk.blue('[INFO]');
    }
  }
}
