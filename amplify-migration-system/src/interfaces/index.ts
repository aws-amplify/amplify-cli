/**
 * Core interfaces for the Amplify Migration System
 */

import {
  AppConfiguration,
  EnvironmentConfig,
  AuthMethod,
  EnvironmentType,
  AtmosphereCredentials,
  AmplifyCredentials,
  ValidationResult,
  CheckResult,
  MigrationResult,
  ProcessStep,
  LogLevel,
  LogContext,
  CLIOptions,
  SupervisorOptions,
} from '../types';

// Configuration Management
export interface IConfigurationLoader {
  loadAppConfiguration(appName: string): Promise<AppConfiguration>;
  loadAllConfigurations(): Promise<Map<string, AppConfiguration>>;
  validateConfiguration(config: AppConfiguration): ValidationResult;
  saveConfiguration(appName: string, config: AppConfiguration): Promise<void>;
}

// Environment Detection and Authentication
export interface IEnvironmentDetector {
  detectEnvironment(): Promise<EnvironmentType>;
  isAtmosphereEnvironment(): Promise<boolean>;
  getEnvironmentVariables(): Record<string, string>;
}

export interface IAuthManager {
  detectAuthMethod(): Promise<AuthMethod>;
  getAtmosphereCredentials(): Promise<AtmosphereCredentials>;
  validateCredentials(config: EnvironmentConfig): Promise<boolean>;
  configureAmplifyAuth(credentials: AmplifyCredentials): Promise<void>;
  configureCDKAuth(credentials: AmplifyCredentials): Promise<void>;
}

// CDK Atmosphere Client Integration
export interface ICDKAtmosphereIntegration {
  isAtmosphereEnvironment(): Promise<boolean>;
  isClientAvailable(): Promise<boolean>;
  initializeForAtmosphere(): Promise<AtmosphereCredentials>;
  initializeForLocal(authConfig: EnvironmentConfig): Promise<void>;
  getCredentialsForAmplify(): Promise<AmplifyCredentials>;
  cleanup(): Promise<void>;
}

// App Selection and Management
export interface IAppSelector {
  discoverAvailableApps(): Promise<string[]>;
  validateAppExists(appName: string): Promise<boolean>;
  selectApps(options: CLIOptions): Promise<string[]>;
  getAppPath(appName: string): string;
  getAppReadmePath(appName: string): string;
}

// Migration Orchestration
export interface IMigrationSupervisor {
  processApps(appNames: string[], options: SupervisorOptions): Promise<MigrationResult[]>;
  processAppSequentially(appNames: string[]): Promise<MigrationResult[]>;
  processAppsInParallel(appNames: string[], maxConcurrency: number): Promise<MigrationResult[]>;
  generateSummaryReport(results: MigrationResult[]): string;
}

export interface IAppProcessor {
  processApp(appName: string, config: AppConfiguration): Promise<MigrationResult>;
  initializeAmplifyApp(appName: string, config: AppConfiguration): Promise<void>;
  migrateToGen2(appName: string, config: AppConfiguration): Promise<void>;
  cleanup(appName: string): Promise<void>;
}

// Category Handlers
export interface ICategoryHandler {
  canHandle(categoryType: string): boolean;
  process(appName: string, categoryConfig: unknown): Promise<ProcessStep[]>;
  validate(categoryConfig: unknown): ValidationResult;
  cleanup(appName: string): Promise<void>;
}

export interface IAPIHandler extends ICategoryHandler {
  processGraphQLAPI(appName: string, config: any): Promise<ProcessStep[]>;
  processRESTAPI(appName: string, config: any): Promise<ProcessStep[]>;
  deploySchema(appName: string, schemaPath: string): Promise<void>;
  configureAuthModes(appName: string, authModes: string[]): Promise<void>;
}

export interface IAuthHandler extends ICategoryHandler {
  configureCognito(appName: string, config: any): Promise<ProcessStep[]>;
  setupSignInMethods(appName: string, methods: string[]): Promise<void>;
  configureSocialProviders(appName: string, providers: string[]): Promise<void>;
  setupUserPool(appName: string, config: any): Promise<void>;
  setupIdentityPool(appName: string, config: any): Promise<void>;
}

export interface IStorageHandler extends ICategoryHandler {
  configureS3Storage(appName: string, config: any): Promise<ProcessStep[]>;
  createBuckets(appName: string, buckets: any[]): Promise<void>;
  configureBucketAccess(appName: string, bucketName: string, access: string[]): Promise<void>;
  setupStorageTriggers(appName: string, triggers: any[]): Promise<void>;
}

export interface IFunctionHandler extends ICategoryHandler {
  deployLambdaFunctions(appName: string, config: any): Promise<ProcessStep[]>;
  createFunction(appName: string, functionConfig: any): Promise<void>;
  configurePermissions(appName: string, functionName: string, permissions: string[]): Promise<void>;
  setupEnvironmentVariables(appName: string, functionName: string, env: Record<string, string>): Promise<void>;
}

export interface IHostingHandler extends ICategoryHandler {
  configureHosting(appName: string, config: any): Promise<ProcessStep[]>;
  setupAmplifyConsole(appName: string, config: any): Promise<void>;
  setupS3CloudFront(appName: string, config: any): Promise<void>;
  configureCustomDomain(appName: string, domain: string): Promise<void>;
}

// Prerequisites and Validation
export interface IPrerequisitesChecker {
  checkAmplifyCliInstalled(): Promise<CheckResult>;
  checkAWSCredentials(): Promise<CheckResult>;
  checkNodeDependencies(): Promise<CheckResult>;
  checkCDKAtmosphereClient(): Promise<CheckResult>;
  checkAppSpecificPrerequisites(appName: string, config: AppConfiguration): Promise<CheckResult[]>;
  installMissingDependencies(): Promise<void>;
  validateNodeVersion(requiredVersion?: string): Promise<CheckResult>;
  validateAWSServiceLimits(): Promise<CheckResult>;
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

  generateReport(results: MigrationResult[]): string;
  exportLogs(filePath: string): Promise<void>;
}

// Process Management
export interface IProcessManager {
  executeCommand(command: string, args: string[], options?: any): Promise<any>;
  executeAmplifyCommand(command: string, args: string[], appPath: string): Promise<any>;
  killProcess(pid: number): Promise<void>;
  isProcessRunning(pid: number): boolean;
}

// Name Generation
export interface INameGenerator {
  generateAppName(baseName: string): string;
  generateResourceName(resourceType: string, appName: string): string;
  validateAppName(name: string): boolean;
  ensureUniqueName(baseName: string, existingNames: string[]): string;
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

export interface ITemplateManager {
  loadTemplate(templateName: string): Promise<string>;
  renderTemplate(template: string, variables: Record<string, any>): string;
  saveRenderedTemplate(templateName: string, variables: Record<string, any>, outputPath: string): Promise<void>;
}

// Error Handling
export interface IErrorHandler {
  handleError(error: Error, context?: LogContext): void;
  handleValidationError(errors: string[], context?: LogContext): void;
  handleProcessError(processName: string, error: Error, context?: LogContext): void;
  createErrorReport(errors: Error[], context?: LogContext): string;
}

// Progress Tracking
export interface IProgressTracker {
  startTracking(totalSteps: number, description?: string): void;
  updateProgress(currentStep: number, stepDescription?: string): void;
  completeStep(stepDescription?: string): void;
  finishTracking(success: boolean): void;

  startAppTracking(appName: string, totalSteps: number): void;
  updateAppProgress(appName: string, currentStep: number, stepDescription?: string): void;
  finishAppTracking(appName: string, success: boolean): void;
}

// Configuration Validation
export interface IConfigValidator {
  validateAppConfiguration(config: AppConfiguration): ValidationResult;
  validateCategoryConfiguration(categoryType: string, config: any): ValidationResult;
  validateEnvironmentConfiguration(config: EnvironmentConfig): ValidationResult;
  validateDependencies(dependencies: any): ValidationResult;

  getValidationSchema(schemaType: string): any;
  customValidation(config: any, rules: any[]): ValidationResult;
}
