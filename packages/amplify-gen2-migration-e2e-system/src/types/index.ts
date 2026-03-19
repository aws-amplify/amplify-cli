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
  restApi?: RestApiConfiguration;
  analytics?: AnalyticsConfiguration;
}

export interface APIConfiguration {
  type: 'GraphQL' | 'REST';
  schema?: string;
  authModes: AuthMode[];
  customQueries?: string[];
  customMutations?: string[];
}

export interface RestApiConfiguration {
  name: string;
  paths: string[];
  lambdaSource: string;
}

export interface AuthConfiguration {
  signInMethods: SignInMethod[];
  socialProviders: SocialProvider[];
  userPoolGroups?: string[];
  triggers?: AuthTriggers;
  userPoolConfig?: UserPoolConfiguration;
  identityPoolConfig?: IdentityPoolConfiguration;
}

export interface AuthTriggers {
  preSignUp?: PreSignUpTrigger;
  postConfirmation?: PostConfirmationTrigger;
  preAuthentication?: PreAuthenticationTrigger;
  postAuthentication?: PostAuthenticationTrigger;
}

export interface PreSignUpTrigger {
  type: 'email-filter-allowlist' | 'custom';
  allowedDomains?: string[];
}

export interface PostConfirmationTrigger {
  type: 'add-to-group' | 'custom';
  groupName?: string;
}

export interface PreAuthenticationTrigger {
  type: 'custom';
}

export interface PostAuthenticationTrigger {
  type: 'custom';
}

export interface StorageConfiguration {
  type?: 'dynamodb';
  buckets?: StorageBucket[];
  tables?: DynamoDBTable[];
  triggers?: StorageTrigger[];
}

export interface DynamoDBTable {
  name: string;
  partitionKey: string;
  sortKey?: string;
  gsi?: GlobalSecondaryIndex[];
}

export interface GlobalSecondaryIndex {
  name: string;
  partitionKey: string;
  sortKey?: string;
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

export interface AnalyticsConfiguration {
  type: 'kinesis' | 'pinpoint';
  name: string;
  shards?: number;
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
  trigger?: FunctionTrigger;
}

export interface FunctionTrigger {
  type: 'dynamodb-stream' | 's3' | 'cognito';
  source: string[];
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

export enum EnvironmentType {
  ATMOSPHERE = 'atmosphere',
  LOCAL = 'local',
}

export interface AtmosphereAllocation {
  accessKeyId: string;
  secretAccessKey: string;
  sessionToken: string;
  region: string;
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
  deploymentName: string;
  /** Amplify environment name (required, 2-10 lowercase letters) */
  envName: string;
  config: AppConfiguration;
  migrationTargetPath: string;
  profile: string;
}
