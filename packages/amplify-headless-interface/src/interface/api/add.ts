/**
 * Defines the json object expected by `amplify add api --headless`
 */
export interface AddApiRequest {
  /**
   * The schema version.
   */
  version: 1;
  /**
   * The service configuration that will be interpreted by Amplify.
   */
  serviceConfiguration: AppSyncServiceConfiguration;
}

/**
 * Configuration exposed by AppSync. Currently this is the only API type supported by Amplify headless mode.
 */
export interface AppSyncServiceConfiguration {
  /**
   * The service name of the resource provider.
   */
  serviceName: 'AppSync';
  /**
   * The name of the API that will be created.
   */
  apiName: string;
  /**
   * The annotated GraphQL schema that defines the AppSync API.
   */
  transformSchema: string;
  /**
   * The auth type that will be used by default.
   */
  defaultAuthType: AppSyncAuthType;
  /**
   * Additional methods of authenticating API requests.
   */
  additionalAuthTypes?: AppSyncAuthType[];
  /**
   * The strategy for resolving API write conflicts.
   */
  conflictResolution?: ConflictResolution;
}

/**
 * Defines a strategy for resolving API write conflicts.
 */
export interface ConflictResolution {
  /**
   * The strategy that will be used for all models by default.
   */
  defaultResolutionStrategy?: ResolutionStrategy;
  /**
   * Strategies that will be used for individual models.
   */
  perModelResolutionStrategy?: PerModelResolutionstrategy[];
}

/**
 * Defines a resolution strategy for a single model.
 */
export interface PerModelResolutionstrategy {
  /**
   * The resolution strategy for the model.
   */
  resolutionStrategy: ResolutionStrategy;
  /**
   * The model name.
   */
  entityName: string;
}

/**
 * Resolution strategies provided by AppSync. See https://docs.aws.amazon.com/appsync/latest/devguide/conflict-detection-and-sync.html for details.
 */
export interface PredefinedResolutionStrategy {
  type: 'OPTIMISTIC_CONCURRENCY' | 'AUTOMERGE' | 'NONE';
}

/**
 * Resolution strategy using a custom lambda function.
 */
export interface LambdaResolutionStrategy {
  type: 'LAMBDA';
  /**
   * The lambda function used to resolve conflicts.
   */
  resolver: LambdaConflictResolver;
}

export type LambdaConflictResolver = NewLambdaConflictResolver | ExistingLambdaConflictResolver;

/**
 * Defines a new lambda conflict resolver. Using this resolver type will create a new lambda function with boilerplate resolver logic.
 */
export interface NewLambdaConflictResolver {
  type: 'NEW';
}

/**
 * Defines an lambda conflict resolver that uses an existing lambda function.
 */
export interface ExistingLambdaConflictResolver {
  type: 'EXISTING';
  /**
   * The name of the lambda function (this must be a lambda function that exists in the Amplify project).
   */
  name: string;
  /**
   * The lambda function region.
   */
  region?: string;
  /**
   * A lambda function ARN. This could be an ARN outside of the Amplify project but in that case extra care must be taken to ensure the AppSync API has access to the Lambda.
   */
  arn?: string;
}

export type ResolutionStrategy = PredefinedResolutionStrategy | LambdaResolutionStrategy;

export type AppSyncAuthType =
  | AppSyncAPIKeyAuthType
  | AppSyncAWSIAMAuthType
  | AppSyncCognitoUserPoolsAuthType
  | AppSyncOpenIDConnectAuthType;

/**
 * Specifies that the AppSync API should be secured using an API key.
 */
export interface AppSyncAPIKeyAuthType {
  mode: 'API_KEY';
  expirationTime?: number;
  keyDescription?: string;
}

/**
 * Specifies that the AppSync API should be secured using AWS IAM.
 */
export interface AppSyncAWSIAMAuthType {
  mode: 'AWS_IAM';
}

/**
 * Specifies that the AppSync API should be secured using Cognito.
 */
export interface AppSyncCognitoUserPoolsAuthType {
  mode: 'AMAZON_COGNITO_USER_POOLS';
  /**
   * The user pool that will be used to authenticate requests.
   */
  cognitoUserPoolId?: string;
}

/**
 * Specifies that the AppSync API should be secured using OpenID.
 */
export interface AppSyncOpenIDConnectAuthType {
  mode: 'OPENID_CONNECT';
  openIDProviderName: string;
  openIDIssuerURL: string;
  openIDClientID: string;
  openIDAuthTTL?: string;
  openIDIatTTL?: string;
}
