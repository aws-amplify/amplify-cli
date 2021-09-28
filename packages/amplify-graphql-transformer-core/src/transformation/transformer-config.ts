export interface TransformMigrationConfig {
  V1?: {
    Resources: string[];
  };
}

// Auth Config
export type AppSyncAuthMode = 'API_KEY' | 'AMAZON_COGNITO_USER_POOLS' | 'AWS_IAM' | 'OPENID_CONNECT' | 'AWS_LAMBDA';
export type AppSyncAuthConfiguration = {
  defaultAuthentication: AppSyncAuthConfigurationEntry;
  additionalAuthenticationProviders: Array<AppSyncAuthConfigurationEntry>;
};

export type AppSyncAuthConfigurationEntry = AppSyncAuthConfigurationUserPoolEntry | AppSyncAuthConfigurationAPIKeyEntry | AppSyncAuthConfigurationIAMEntry | AppSyncAuthConfigurationOIDCEntry | AppSyncAuthConfigurationLambdaEntry;
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

export type AppSyncAuthConfigurationLambdaEntry = {
  authenticationType: 'AWS_LAMBDA';
  lambdaAuthorizerConfig: LambdaAuthorizerConfig;
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
export type LambdaAuthorizerConfig = {
  lambdaFunction: string;
  ttlSeconds?: number;
};

// Sync Config
export const enum ConflictHandlerType {
  OPTIMISTIC = 'OPTIMISTIC_CONCURRENCY',
  AUTOMERGE = 'AUTOMERGE',
  LAMBDA = 'LAMBDA',
}

export type ConflictDetectionType = 'VERSION' | 'NONE';
export type SyncConfigOPTIMISTIC = {
  ConflictDetection: ConflictDetectionType;
  ConflictHandler: ConflictHandlerType.OPTIMISTIC;
};
export type SyncConfigSERVER = {
  ConflictDetection: ConflictDetectionType;
  ConflictHandler: ConflictHandlerType.AUTOMERGE;
};
export type SyncConfigLAMBDA = {
  ConflictDetection: ConflictDetectionType;
  ConflictHandler: ConflictHandlerType.LAMBDA;
  LambdaConflictHandler: {
    name: string;
    region?: string;
    lambdaArn?: any;
  };
};
export type SyncConfig = SyncConfigOPTIMISTIC | SyncConfigSERVER | SyncConfigLAMBDA;

export type ResolverConfig = {
  project?: SyncConfig;
  models?: {
    [key: string]: SyncConfig;
  };
};
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
  StackMapping?: {
    [resourceId: string]: string;
  };

  /**
   * Provide build time options to GraphQL Transformer constructor functions.
   * Certain options cannot be configured via CloudFormation parameters and
   * need to be set at build time. E.G. DeletionPolicies cannot depend on parameters.
   */
  TransformerOptions?: {
    [transformer: string]: {
      [option: string]: any;
    };
  };
}
