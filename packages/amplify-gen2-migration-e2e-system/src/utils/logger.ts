/**
 * Comprehensive logging system for the Amplify Migration System
 */

import * as fs from 'fs-extra';
import * as path from 'path';
import chalk from 'chalk';

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
}

export interface LogEntry {
  timestamp: Date;
  level: LogLevel;
  message: string;
  error?: Error;
}

export class Logger {
  private logLevel: LogLevel;
  private logFilePath?: string;
  private appName?: string;

  constructor(logLevel: LogLevel = LogLevel.INFO) {
    this.logLevel = logLevel;
  }

  public isDebug(): boolean {
    return this.logLevel === LogLevel.DEBUG;
  }

  debug(message: string): void {
    this.log(LogLevel.DEBUG, message, undefined);
  }

  info(message: string): void {
    this.log(LogLevel.INFO, message, undefined);
  }

  warn(message: string): void {
    this.log(LogLevel.WARN, message, undefined);
  }

  error(message: string, error?: Error): void {
    this.log(LogLevel.ERROR, message, error);
  }

  setAppName(appName: string): void {
    this.appName = appName;
  }

  setLogLevel(level: LogLevel): void {
    this.logLevel = level;
    this.debug(`Log level set to: ${level}`);
  }

  setLogFilePath(filePath: string): void {
    this.logFilePath = filePath;

    // Ensure log directory exists
    const logDir = path.dirname(filePath);
    fs.ensureDirSync(logDir);

    this.info(`File logging set: ${filePath}`);
  }

  private log(level: LogLevel, message: string, error?: Error): void {
    if (!this.shouldLog(level)) {
      return;
    }

    const entry: LogEntry = {
      timestamp: new Date(),
      level,
      message,
      error,
    };

    // Console output
    const formattedMessage = this.formatMessage(entry);
    console.log(formattedMessage);

    // File output
    if (this.logFilePath) {
      this.writeToFile(entry);
    }
  }

  private shouldLog(level: LogLevel): boolean {
    const levels = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR];
    const currentLevelIndex = levels.indexOf(this.logLevel);
    const messageLevelIndex = levels.indexOf(level);

    return messageLevelIndex >= currentLevelIndex;
  }

  private formatMessage(entry: LogEntry): string {
    const timestamp = entry.timestamp.toISOString();
    const level = this.colorizeLevel(entry.level);
    const errorInfo = this.formatError(entry.error);

    return `[${timestamp}] ${level} [${this.appName ?? ''}] ${entry.message}${errorInfo}`;
  }

  private formatError(error?: Error): string {
    if (!error) {
      return '';
    }

    const message = ` | Error: ${error.message}`;
    const stack = error.stack ? `\n${chalk.red(error.stack)}` : '';

    return message + stack;
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

  private writeToFile(entry: LogEntry): void {
    if (!this.logFilePath) {
      return;
    }

    try {
      const logLine = this.formatMessage(entry);
      fs.appendFileSync(this.logFilePath, logLine + '\n');
    } catch (error) {
      // Avoid infinite recursion by not logging file write errors
      console.error('Failed to write to log file:', error);
    }
  }
}
