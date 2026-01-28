/**
 * Comprehensive logging system for the Amplify Migration System
 */

import * as fs from 'fs-extra';
import * as path from 'path';
import chalk from 'chalk';
import { ILogger } from '../interfaces';
import { LogLevel, LogContext, LogEntry, MigrationResult } from '../types';

export class Logger implements ILogger {
  private logLevel: LogLevel = LogLevel.INFO;
  private fileLoggingEnabled = false;
  private logFilePath?: string;
  private logEntries: LogEntry[] = [];
  private activeOperations = new Map<string, Date>();

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

  startOperation(operationName: string, context?: LogContext): void {
    this.activeOperations.set(operationName, new Date());
    this.info(`Started operation: ${operationName}`, context);
  }

  endOperation(operationName: string, success: boolean, context?: LogContext): void {
    const startTime = this.activeOperations.get(operationName);
    if (startTime) {
      const duration = Date.now() - startTime.getTime();
      const status = success ? 'completed' : 'failed';
      const statusColor = success ? chalk.green : chalk.red;

      this.info(`Operation ${statusColor(status)}: ${operationName} (${duration}ms)`, context);
      this.activeOperations.delete(operationName);
    } else {
      this.warn(`Attempted to end unknown operation: ${operationName}`, context);
    }
  }

  logProgress(current: number, total: number, message?: string): void {
    const percentage = Math.round((current / total) * 100);
    const progressBar = this.createProgressBar(current, total);
    const progressMessage = message ? ` - ${message}` : '';

    // Use process.stdout.write for same-line updates
    process.stdout.write(`\r${progressBar} ${percentage}%${progressMessage}`);

    if (current === total) {
      process.stdout.write('\n');
    }
  }

  logAppProgress(appName: string, step: string, progress: number): void {
    const context: LogContext = { appName, step };
    this.info(`[${appName}] ${step} (${progress}%)`, context);
  }

  setLogLevel(level: LogLevel): void {
    this.logLevel = level;
    this.debug(`Log level set to: ${level}`);
  }

  enableFileLogging(filePath: string): void {
    this.logFilePath = filePath;
    this.fileLoggingEnabled = true;

    // Ensure log directory exists
    const logDir = path.dirname(filePath);
    fs.ensureDirSync(logDir);

    this.info(`File logging enabled: ${filePath}`);
  }

  disableFileLogging(): void {
    this.fileLoggingEnabled = false;
    this.logFilePath = undefined;
    this.info('File logging disabled');
  }

  generateReport(result: MigrationResult): string {
    const report: string[] = [];

    report.push('='.repeat(80));
    report.push('AMPLIFY MIGRATION E2E SYSTEM - EXECUTION REPORT');
    report.push('='.repeat(80));
    report.push('');

    const totalDuration = result.duration;

    report.push('SUMMARY:');
    report.push(`  Total Duration: ${this.formatDuration(totalDuration)}`);
    report.push('');

    // Individual app results
    report.push('DETAILED RESULTS:');
    report.push('-'.repeat(40));

    const status = result.success ? chalk.green('✓ SUCCESS') : chalk.red('✗ FAILED');
    report.push(`${result.appName} - ${status}`);
    report.push(`Duration: ${this.formatDuration(result.duration)}`);
    report.push(`Categories: ${result.categoriesProcessed.join(', ') || 'None'}`);
    report.push(`Resources: ${result.resourcesCreated.length} created`);

    if (result.warnings.length > 0) {
      report.push(`Warnings: ${result.warnings.length}`);
      result.warnings.forEach((warning) => {
        report.push(`  - ${warning}`);
      });
    }

    if (result.errors.length > 0) {
      report.push(`Errors: ${result.errors.length}`);
      result.errors.forEach((error) => {
        report.push(`  - ${error}`);
      });
    }

    report.push('='.repeat(80));
    report.push(`Report generated at: ${new Date().toISOString()}`);
    report.push('='.repeat(80));

    return report.join('\n');
  }

  async exportLogs(filePath: string): Promise<void> {
    const logData = {
      exportedAt: new Date().toISOString(),
      logLevel: this.logLevel,
      totalEntries: this.logEntries.length,
      entries: this.logEntries,
    };

    await fs.writeJson(filePath, logData, { spaces: 2 });
    this.info(`Logs exported to: ${filePath}`);
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

    this.logEntries.push(entry);

    // Console output
    const formattedMessage = this.formatConsoleMessage(entry);
    console.log(formattedMessage);

    // File output
    if (this.fileLoggingEnabled && this.logFilePath) {
      void this.writeToFile(entry);
    }
  }

  private shouldLog(level: LogLevel): boolean {
    const levels = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR];
    const currentLevelIndex = levels.indexOf(this.logLevel);
    const messageLevelIndex = levels.indexOf(level);

    return messageLevelIndex >= currentLevelIndex;
  }

  private formatConsoleMessage(entry: LogEntry): string {
    const timestamp = entry.timestamp.toISOString();
    const level = this.colorizeLevel(entry.level);
    const context = this.formatContext(entry.context);
    const errorInfo = entry.error ? ` | Error: ${entry.error.message}` : '';

    return `[${timestamp}] ${level}${context} ${entry.message}${errorInfo}`;
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

  private createProgressBar(current: number, total: number, width = 30): string {
    const percentage = current / total;
    const filled = Math.round(width * percentage);
    const empty = width - filled;

    const filledBar = '█'.repeat(filled);
    const emptyBar = '░'.repeat(empty);

    return `${chalk.green(filledBar)}${chalk.gray(emptyBar)}`;
  }

  private formatDuration(milliseconds: number): string {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }

  private async writeToFile(entry: LogEntry): Promise<void> {
    if (!this.logFilePath) {
      return;
    }

    try {
      const logLine = this.formatFileMessage(entry);
      await fs.appendFile(this.logFilePath, logLine + '\n');
    } catch (error) {
      // Avoid infinite recursion by not logging file write errors
      console.error('Failed to write to log file:', error);
    }
  }

  private formatFileMessage(entry: LogEntry): string {
    const timestamp = entry.timestamp.toISOString();
    const context = entry.context ? JSON.stringify(entry.context) : '{}';
    const errorInfo = entry.error ? ` | Error: ${entry.error.message} | Stack: ${entry.error.stack}` : '';

    return `${timestamp} | ${entry.level.toUpperCase()} | ${context} | ${entry.message}${errorInfo}`;
  }
}
