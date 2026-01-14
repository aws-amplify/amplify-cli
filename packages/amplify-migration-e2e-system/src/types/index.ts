/**
 * Core types and interfaces for the Amplify Migration System
 */

export interface AppConfiguration {
  app: AppMetadata;
  categories: CategoryConfiguration;
  dependencies?: DependencyConfiguration;
}

export interface AppMetadata {
  name: string;
  description: string;
  framework: string;
}

export interface CategoryConfiguration {
  api?: APIConfiguration;
  auth?: AuthConfiguration;
  storage?: StorageConfiguration;
  function?: FunctionConfiguration;
  hosting?: HostingConfiguration;
}

export interface APIConfiguration {
  type: 'GraphQL' | 'REST';
  schema?: string;
  authModes: AuthMode[];
  customQueries?: string[];
  customMutations?: string[];
}

export interface AuthConfiguration {
  signInMethods: SignInMethod[];
  socialProviders: SocialProvider[];
  userPoolConfig?: UserPoolConfiguration;
  identityPoolConfig?: IdentityPoolConfiguration;
}

export interface StorageConfiguration {
  buckets: StorageBucket[];
  triggers?: StorageTrigger[];
}

export interface FunctionConfiguration {
  functions: LambdaFunction[];
}

export interface HostingConfiguration {
  type: 'amplify-console' | 's3-cloudfront';
  customDomain?: string;
  sslCertificate?: string;
  buildSettings?: BuildSettings;
}

export interface DependencyConfiguration {
  nodeVersion?: string;
  npmPackages?: Record<string, string>;
  amplifyVersion?: string;
}

// Supporting types
export type AuthMode = 'API_KEY' | 'COGNITO_USER_POOLS' | 'IAM' | 'OIDC';
export type SignInMethod = 'email' | 'phone' | 'username';
export type SocialProvider = 'facebook' | 'google' | 'amazon' | 'apple';

export interface UserPoolConfiguration {
  passwordPolicy?: PasswordPolicy;
  mfaConfiguration?: MFAConfiguration;
  emailVerification?: boolean;
  phoneVerification?: boolean;
}

export interface IdentityPoolConfiguration {
  allowUnauthenticatedIdentities?: boolean;
  cognitoIdentityProviders?: string[];
}

export interface StorageBucket {
  name: string;
  access: AccessLevel[];
  cors?: CORSConfiguration;
}

export interface StorageTrigger {
  name: string;
  events: S3Event[];
  function: string;
}

export interface LambdaFunction {
  name: string;
  runtime: 'nodejs' | 'python' | 'java' | 'dotnet';
  template?: string;
  handler?: string;
  environment?: Record<string, string>;
  permissions?: string[];
}

export interface BuildSettings {
  buildCommand?: string;
  outputDirectory?: string;
  nodeVersion?: string;
  environmentVariables?: Record<string, string>;
}

export type AccessLevel = 'public' | 'protected' | 'private' | 'auth' | 'guest';
export type S3Event = 'objectCreated' | 'objectRemoved' | 'objectRestore';

export interface PasswordPolicy {
  minimumLength?: number;
  requireLowercase?: boolean;
  requireUppercase?: boolean;
  requireNumbers?: boolean;
  requireSymbols?: boolean;
}

export interface MFAConfiguration {
  mode: 'OFF' | 'ON' | 'OPTIONAL';
  smsMessage?: string;
  totpEnabled?: boolean;
}

export interface CORSConfiguration {
  allowedOrigins: string[];
  allowedMethods: string[];
  allowedHeaders: string[];
  maxAge?: number;
}

// Environment and Authentication types
export interface EnvironmentConfig {
  type: EnvironmentType;
  region: string;
  profile?: string;
  accessKeyId?: string;
  secretAccessKey?: string;
  sessionToken?: string;
}

export enum EnvironmentType {
  ATMOSPHERE = 'atmosphere',
  LOCAL = 'local',
}

export enum AuthMethod {
  ATMOSPHERE = 'atmosphere',
  ACCESS_KEYS = 'accessKey',
  AWS_PROFILE = 'profile',
}

export interface AtmosphereAllocation {
  accessKeyId: string;
  secretAccessKey: string;
  sessionToken: string;
  region: string;
}

// Migration process types
export interface MigrationResult {
  success: boolean;
  appName: string;
  duration: number;
  errors: string[];
  warnings: string[];
  categoriesProcessed: string[];
  resourcesCreated: string[];
}

export interface ValidationResult {
  errors: string[];
}

// Logging types
export interface LogEntry {
  timestamp: Date;
  level: LogLevel;
  message: string;
  context?: LogContext;
  error?: Error;
}

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
}

export interface LogContext {
  appName?: string;
  category?: string;
  step?: string;
  operation?: string;
}

// CLI types
export interface CLIOptions {
  app: string;
  dryRun?: boolean;
  verbose?: boolean;
  profile?: string;
  isAtmosphere?: boolean;
  envName?: string;
}

export interface InitializeAppFromCLIParams {
  appName: string;
  envName?: string;
  config: AppConfiguration;
  migrationTargetPath: string;
  profile: string;
}
