/**
 * Comprehensive logging system for the Amplify Migration System
 */

import * as fs from 'fs-extra';
import * as path from 'path';
import chalk from 'chalk';
import { ILogger } from '../interfaces';
import { LogLevel, LogContext, LogEntry } from '../types';

export class Logger implements ILogger {
  private logLevel: LogLevel = LogLevel.INFO;
  private logFilePath?: string;

  constructor(logLevel: LogLevel = LogLevel.INFO) {
    this.logLevel = logLevel;
  }

  debug(message: string, context?: LogContext): void {
    this.log(LogLevel.DEBUG, message, undefined, context);
  }

  info(message: string, context?: LogContext): void {
    this.log(LogLevel.INFO, message, undefined, context);
  }

  warn(message: string, context?: LogContext): void {
    this.log(LogLevel.WARN, message, undefined, context);
  }

  error(message: string, error?: Error, context?: LogContext): void {
    this.log(LogLevel.ERROR, message, error, context);
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

  private log(level: LogLevel, message: string, error?: Error, context?: LogContext): void {
    if (!this.shouldLog(level)) {
      return;
    }

    const entry: LogEntry = {
      timestamp: new Date(),
      level,
      message,
      context,
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
    const context = this.formatContext(entry.context);
    const errorInfo = this.formatError(entry.error);

    return `[${timestamp}] ${level}${context} ${entry.message}${errorInfo}`;
  }

  private formatContext(context?: LogContext): string {
    if (!context) {
      return '';
    }

    const parts: string[] = [];
    if (context.appName) parts.push(`app:${context.appName}`);
    if (context.category) parts.push(`cat:${context.category}`);
    if (context.step) parts.push(`step:${context.step}`);
    if (context.operation) parts.push(`op:${context.operation}`);

    return parts.length > 0 ? ` [${parts.join('|')}]` : '';
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
        return chalk.blue('[INFO] ');
      case LogLevel.WARN:
        return chalk.yellow('[WARN] ');
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
