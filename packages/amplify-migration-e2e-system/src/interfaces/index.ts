/**
 * Core interfaces for the Amplify Migration System
 */

import {
  AppConfiguration,
  EnvironmentType,
  AtmosphereAllocation,
  ValidationResult,
  MigrationResult,
  LogLevel,
  LogContext,
  CLIOptions,
} from '../types';

// Configuration Management
export interface IConfigurationLoader {
  loadAppConfiguration(appName: string): Promise<AppConfiguration>;
  validateConfiguration(config: AppConfiguration): ValidationResult;
  saveConfiguration(appName: string, config: AppConfiguration): Promise<void>;
}

// Environment Detection and Authentication
export interface IEnvironmentDetector {
  detectEnvironment(): Promise<EnvironmentType>;
  isAtmosphereEnvironment(): Promise<boolean>;
}

// CDK Atmosphere Client Integration
export interface ICDKAtmosphereIntegration {
  isAtmosphereEnvironment(): Promise<boolean>;
  initializeForAtmosphere(): Promise<AtmosphereAllocation>;
  getProfileFromAllocation(): Promise<string>;
  cleanup(): Promise<void>;
}

// App Selection and Management
export interface IAppSelector {
  discoverAvailableApps(): Promise<string[]>;
  validateAppExists(appName: string): Promise<boolean>;
  selectApp(options: CLIOptions): Promise<string>;
  getAppPath(appName: string): string;
}

export interface InitializeAppOptions {
  appPath: string;
  config: AppConfiguration;
  deploymentName: string;
  envName?: string;
  profile: string;
}

export interface IAppInitializer {
  initializeApp(options: InitializeAppOptions): Promise<void>;
  createAppDirectory(basePath: string, appName: string): Promise<string>;
}

// Logging System
export interface ILogger {
  debug(message: string, context?: LogContext): void;
  info(message: string, context?: LogContext): void;
  warn(message: string, context?: LogContext): void;
  error(message: string, error?: Error, context?: LogContext): void;

  startOperation(operationName: string, context?: LogContext): void;
  endOperation(operationName: string, success: boolean, context?: LogContext): void;

  logProgress(current: number, total: number, message?: string): void;
  logAppProgress(appName: string, step: string, progress: number): void;

  setLogLevel(level: LogLevel): void;
  enableFileLogging(filePath: string): void;
  disableFileLogging(): void;

  generateReport(result: MigrationResult): string;
  exportLogs(filePath: string): Promise<void>;
}

// Utility Interfaces
export interface IFileManager {
  readFile(filePath: string): Promise<string>;
  writeFile(filePath: string, content: string): Promise<void>;
  copyFile(source: string, destination: string): Promise<void>;
  deleteFile(filePath: string): Promise<void>;
  ensureDirectory(dirPath: string): Promise<void>;
  listFiles(dirPath: string, pattern?: string): Promise<string[]>;
  listDirectories(dirPath: string): Promise<string[]>;
  pathExists(filePath: string): Promise<boolean>;
  isDirectory(dirPath: string): Promise<boolean>;
  isFile(filePath: string): Promise<boolean>;
  readJsonFile<T = unknown>(filePath: string): Promise<T>;
}

// AWS Profile Management Types
export interface AWSCredentials {
  accessKeyId: string;
  secretAccessKey: string;
  sessionToken?: string;
}

export interface AWSProfileData {
  credentials: AWSCredentials;
  region: string;
}

// AWS Profile Manager Interface
export interface IAWSProfileManager {
  /**
   * Writes AWS credentials and config for a named profile
   * Creates files with 600 permissions if they don't exist
   * Overwrites existing profile if it already exists
   */
  writeProfile(profileName: string, profileData: AWSProfileData): Promise<void>;

  /**
   * Removes a profile from both credentials and config files
   * Completes without error if profile doesn't exist
   */
  removeProfile(profileName: string): Promise<void>;

  /**
   * Checks if a profile exists in the credentials file
   */
  profileExists(profileName: string): Promise<boolean>;

  /**
   * Reads profile data from credentials and config files
   * Returns null if profile doesn't exist
   */
  readProfile(profileName: string): Promise<AWSProfileData | null>;
}
