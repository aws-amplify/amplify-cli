export interface AddApiRequest {
  version: 1;
  serviceConfiguration: AppSyncServiceConfiguration;
}

export interface AppSyncServiceConfiguration {
  serviceName: 'appSync';
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
  conflictResolution?: {
    resolutionStrategy: ResolutionStrategy;
  };
}

export enum ResolutionStrategy {
  OPTIMISTIC_CONCURRENCY = 'OPTIMISTIC_CONCURRENCY',
  LAMBDA = 'LAMBDA',
  AUTOMERGE = 'AUTOMERGE',
  NONE = 'NONE',
}

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
  openIDIssueURL: string;
  openIDClientID: string;
  openIDAuthTTL?: string;
  openIDIatTTL?: string;
}
