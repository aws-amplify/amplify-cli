export interface AddApiRequest {
  version: 1;
  serviceConfiguration: AppSyncServiceConfiguration;
}

export interface AppSyncServiceConfiguration {
  serviceName: 'AppSync';
  apiName: string;
  /**
   * The annotated GraphQL schema that defines the AppSync API
   */
  transformSchema: string;
  /**
   * The auth type that will be used by default
   */
  defaultAuthType: AppSyncAuthType;
  /**
   * Additional methods of authenticating API requests
   */
  additionalAuthTypes?: AppSyncAuthType[];
  conflictResolution?: ConflictResolution;
}

export interface ConflictResolution {
  defaultResolutionStrategy?: ResolutionStrategy;
  perModelResolutionStrategy?: PerModelResolutionstrategy[];
}

export interface PerModelResolutionstrategy {
  resolutionStrategy: ResolutionStrategy;
  entityName: string;
}

export interface PredefinedResolutionStrategy {
  type: 'OPTIMISTIC_CONCURRENCY' | 'AUTOMERGE' | 'NONE';
}

export interface LambdaResolutionStrategy {
  type: 'LAMBDA';
  resolver: LambdaConflictResolver;
}

export type LambdaConflictResolver = NewLambdaConflictResolver | ExistingLambdaConflictResolver;

export interface NewLambdaConflictResolver {
  type: 'NEW';
}

export interface ExistingLambdaConflictResolver {
  type: 'EXISTING';
  name: string;
  region?: string;
  arn?: string;
}

export type ResolutionStrategy = PredefinedResolutionStrategy | LambdaResolutionStrategy;

export type AppSyncAuthType =
  | AppSyncAPIKeyAuthType
  | AppSyncAWSIAMAuthType
  | AppSyncCognitoUserPoolsAuthType
  | AppSyncOpenIDConnectAuthType;

export interface AppSyncAPIKeyAuthType {
  mode: 'API_KEY';
  expirationTime?: number;
  keyDescription?: string;
}

export interface AppSyncAWSIAMAuthType {
  mode: 'AWS_IAM';
}

export interface AppSyncCognitoUserPoolsAuthType {
  mode: 'AMAZON_COGNITO_USER_POOLS';
  cognitoUserPoolId: string;
}

export interface AppSyncOpenIDConnectAuthType {
  mode: 'OPENID_CONNECT';
  openIDProviderName: string;
  openIDIssuerURL: string;
  openIDClientID: string;
  openIDAuthTTL?: string;
  openIDIatTTL?: string;
}
