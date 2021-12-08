import { Request } from 'express';
export type AppSyncMockFile = {
  path?: string;
  content: string;
};
export type AppSyncVTLTemplate = AppSyncMockFile;
export type AppSyncSimulatorFunctionsConfig = {
  name: string;
  dataSourceName: string;
  requestMappingTemplateLocation: string;
  responseMappingTemplateLocation: string;
};
export enum RESOLVER_KIND {
  UNIT = 'UNIT',
  PIPELINE = 'PIPELINE',
}

export interface AppSyncSimulatorBaseResolverConfig {
  requestMappingTemplateLocation?: string;
  responseMappingTemplateLocation?: string;
  requestMappingTemplate?: string;
  responseMappingTemplate?: string;
}
export interface AppSyncSimulatorUnitResolverConfig extends AppSyncSimulatorBaseResolverConfig {
  kind: RESOLVER_KIND.UNIT;
  fieldName: string;
  typeName: string;
  dataSourceName: string;
}
export interface AppSyncSimulatorPipelineResolverConfig extends AppSyncSimulatorBaseResolverConfig {
  kind: RESOLVER_KIND.PIPELINE;
  typeName: string;
  fieldName: string;
  functions: string[];
}
export interface AppSyncSimulatorFunctionResolverConfig extends AppSyncSimulatorBaseResolverConfig {
  dataSourceName: string;
}
export type AppSyncSimulatorMappingTemplate = AppSyncMockFile;
export type AppSyncSimulatorTable = string;

export interface AppSyncSimulatorUnitResolver extends AppSyncSimulatorUnitResolverConfig {
  datSourceName: string;
}
export interface AppSyncSimulatorPipelineResolver extends AppSyncSimulatorUnitResolverConfig {
  functions: string[];
}
export interface AppSyncSimulatorDataSourceBaseConfig {
  name: string;
  type: string;
}
export interface AppSyncSimulatorDataSourceDDBConfig extends AppSyncSimulatorDataSourceBaseConfig {
  type: 'AMAZON_DYNAMODB';
  config: {
    endpoint: string;
    region?: string;
    accessKeyId?: string;
    secretAccessKey?: string;
    tableName: string;
  };
}
export interface AppSyncSimulatorDataSourceNoneConfig extends AppSyncSimulatorDataSourceBaseConfig {
  type: 'None';
}
export interface AppSyncSimulatorDataSourceLambdaConfig extends AppSyncSimulatorDataSourceBaseConfig {
  type: 'AWS_LAMBDA';
  invoke: Function;
}
export type AppSyncSimulatorDataSourceConfig =
  | AppSyncSimulatorDataSourceDDBConfig
  | AppSyncSimulatorDataSourceNoneConfig
  | AppSyncSimulatorDataSourceLambdaConfig;

export type AppSyncSimulatorSchemaConfig = AppSyncMockFile;

export enum AmplifyAppSyncSimulatorAuthenticationType {
  API_KEY = 'API_KEY',
  AWS_IAM = 'AWS_IAM',
  AMAZON_COGNITO_USER_POOLS = 'AMAZON_COGNITO_USER_POOLS',
  OPENID_CONNECT = 'OPENID_CONNECT',
  AWS_LAMBDA = 'AWS_LAMBDA',
}

export type AmplifyAppSyncAuthenticationProviderAPIConfig = {
  authenticationType: AmplifyAppSyncSimulatorAuthenticationType.API_KEY;
};

export type AmplifyAppSyncAuthenticationProviderIAMConfig = {
  authenticationType: AmplifyAppSyncSimulatorAuthenticationType.AWS_IAM;
};

export type AmplifyAppSyncAuthenticationProviderCognitoConfig = {
  authenticationType: AmplifyAppSyncSimulatorAuthenticationType.AMAZON_COGNITO_USER_POOLS;
  cognitoUserPoolConfig: {
    AppIdClientRegex?: string;
  };
};

export type AmplifyAppSyncAuthenticationProviderOIDCConfig = {
  authenticationType: AmplifyAppSyncSimulatorAuthenticationType.OPENID_CONNECT;
  openIDConnectConfig: {
    Issuer?: string;
    ClientId?: string;
  };
};

export type AmplifyAppSyncAuthenticationProviderLambdaConfig = {
  authenticationType: AmplifyAppSyncSimulatorAuthenticationType.AWS_LAMBDA;
  lambdaAuthorizerConfig: {
    AuthorizerUri: string;
    AuthorizerResultTtlInSeconds?: number;
  };
};

export type AmplifyAppSyncAuthenticationProviderConfig =
  | AmplifyAppSyncAuthenticationProviderAPIConfig
  | AmplifyAppSyncAuthenticationProviderIAMConfig
  | AmplifyAppSyncAuthenticationProviderCognitoConfig
  | AmplifyAppSyncAuthenticationProviderOIDCConfig
  | AmplifyAppSyncAuthenticationProviderLambdaConfig;

export type AmplifyAppSyncAPIConfig = {
  name: string;
  defaultAuthenticationType: AmplifyAppSyncAuthenticationProviderConfig;
  authRoleName?: string; // assumed-role/authRole/CognitoIdentityCredentials
  unAuthRoleName?: string; // assumed-role/unAuthRole/CognitoIdentityCredentials
  authAccessKeyId?: string; // when accessKeyId matches assume the authRole. Otherwise, use unAuthRole
  accountId?: string;
  apiKey?: string;
  additionalAuthenticationProviders: AmplifyAppSyncAuthenticationProviderConfig[];
};

export type AmplifyAppSyncSimulatorConfig = {
  schema: AppSyncSimulatorSchemaConfig;
  resolvers?: (AppSyncSimulatorUnitResolverConfig | AppSyncSimulatorPipelineResolverConfig)[];
  functions?: AppSyncSimulatorFunctionsConfig[];
  dataSources?: AppSyncSimulatorDataSourceConfig[];
  mappingTemplates?: AppSyncSimulatorMappingTemplate[];
  tables?: AppSyncSimulatorTable[];
  appSync: AmplifyAppSyncAPIConfig;
};

export type AppSyncSimulatorServerConfig = {
  port?: number;
  wsPort?: number;
};

export type AmplifyAppSyncSimulatorRequestContext = {
  jwt?: object;
  requestAuthorizationMode: AmplifyAppSyncSimulatorAuthenticationType;
  request: Request;
  appsyncErrors: {};
};
