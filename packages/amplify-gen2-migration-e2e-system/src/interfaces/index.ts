/**
 * Core interfaces for the Amplify Migration System
 */

import { AppConfiguration, EnvironmentType, AtmosphereAllocation, ValidationResult, LogLevel, LogContext, CLIOptions } from '../types';

// Configuration Management
export interface IConfigurationLoader {
  loadAppConfiguration(appName: string): Promise<AppConfiguration>;
  validateConfiguration(config: AppConfiguration): ValidationResult;
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
}

// Logging System
export interface ILogger {
  debug(message: string, context?: LogContext): void;
  info(message: string, context?: LogContext): void;
  warn(message: string, context?: LogContext): void;
  error(message: string, error?: Error, context?: LogContext): void;

  setLogLevel(level: LogLevel): void;
  setLogFilePath(filePath: string): void;
}

// Utility Interfaces
export interface IFileManager {
  readFile(filePath: string): Promise<string>;
  writeFile(filePath: string, content: string): Promise<void>;
  ensureDirectory(dirPath: string): Promise<void>;
  listDirectories(dirPath: string): Promise<string[]>;
  pathExists(filePath: string): Promise<boolean>;
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
}
