export interface TransformMigrationConfig {
  V1?: {
    Resources: string[];
  };
}

// Auth Config
export type AppSyncAuthMode = 'API_KEY' | 'AMAZON_COGNITO_USER_POOLS' | 'AWS_IAM' | 'OPENID_CONNECT';
export type AppSyncAuthConfiguration = {
  defaultAuthentication: AppSyncAuthConfigurationEntry;
  additionalAuthenticationProviders: Array<AppSyncAuthConfigurationEntry>;
};

export type AppSyncAuthConfigurationEntry =
  | AppSyncAuthConfigurationUserPoolEntry
  | AppSyncAuthConfigurationAPIKeyEntry
  | AppSyncAuthConfigurationIAMEntry
  | AppSyncAuthConfigurationOIDCEntry;
export type AppSyncAuthConfigurationAPIKeyEntry = {
  authenticationType: 'API_KEY';
  apiKeyConfig: ApiKeyConfig;
};
export type AppSyncAuthConfigurationUserPoolEntry = {
  authenticationType: 'AMAZON_COGNITO_USER_POOLS';
  userPoolConfig: UserPoolConfig;
};
export type AppSyncAuthConfigurationIAMEntry = {
  authenticationType: 'AWS_IAM';
};

export type AppSyncAuthConfigurationOIDCEntry = {
  authenticationType: 'OPENID_CONNECT';
  openIDConnectConfig: OpenIDConnectConfig;
};

export type ApiKeyConfig = {
  description?: string;
  apiKeyExpirationDays: number;
};
export type UserPoolConfig = {
  userPoolId: string;
};
export type OpenIDConnectConfig = {
  name: string;
  issuerUrl: string;
  clientId?: string;
  iatTTL?: number;
  authTTL?: number;
};

// Sync Config
export const enum ConflictHandlerType {
  OPTIMISTIC = 'OPTIMISTIC_CONCURRENCY',
  AUTOMERGE = 'AUTOMERGE',
  LAMBDA = 'LAMBDA',
}
export type ConflictDetectionType = 'VERSION' | 'NONE';
export type SyncConfigOptimistic = {
  ConflictDetection: ConflictDetectionType;
  ConflictHandler: ConflictHandlerType.OPTIMISTIC;
};
export type SyncConfigServer = {
  ConflictDetection: ConflictDetectionType;
  ConflictHandler: ConflictHandlerType.AUTOMERGE;
};
export type SyncConfigLambda = {
  ConflictDetection: ConflictDetectionType;
  ConflictHandler: ConflictHandlerType.LAMBDA;
  LambdaConflictHandler: LambdaConflictHandler;
};
export type LambdaConflictHandler = {
  name: string;
  region?: string;
  lambdaArn?: any;
};
export type SyncConfig = SyncConfigOptimistic | SyncConfigServer | SyncConfigLambda;

export type ResolverConfig = {
  project?: SyncConfig;
  models?: Record<string, SyncConfig>;
};
/**
 * The transform config is specified in transform.conf.json within an Amplify
 * API project directory.
 */
export interface TransformConfig {
  /**
   * The transform library uses a "StackMapping" to determine which stack
   * a particular resource belongs to. This "StackMapping" allows individual
   * transformer implementations to add resources to a single context and
   * reference resources as if they were all members of the same stack. The
   * transform formatter takes the single context and the stack mapping
   * and splits the context into a valid nested stack where any Fn::Ref or Fn::GetAtt
   * is replaced by a Import/Export or Parameter. Users may provide mapping
   * overrides to get specific behavior out of the transformer. Users may
   * override the default stack mapping to customize behavior.
   */
  StackMapping?: Record<string, string>;

  /**
   * Provide build time options to GraphQL Transformer constructor functions.
   * Certain options cannot be configured via CloudFormation parameters and
   * need to be set at build time. E.G. DeletionPolicies cannot depend on parameters.
   */
  TransformerOptions?: {
    [transformer: string]: Record<string, any>;
  };

  /**
   * Object which states info about a resolver's configuration
   * Such as sync configuration for appsync local support
   */
  ResolverConfig?: ResolverConfig;
}
