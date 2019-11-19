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
  kind: RESOLVER_KIND;
  fieldName: string;
  typeName: string;
  requestMappingTemplateLocation: string;
  responseMappingTemplateLocation: string;
}
export interface AppSyncSimulatorUnitResolverConfig extends AppSyncSimulatorBaseResolverConfig {
  kind: RESOLVER_KIND.UNIT;
  fieldName: string;
  typeName: string;
  requestMappingTemplateLocation: string;
  responseMappingTemplateLocation: string;
  dataSourceName: string;
}
export interface AppSyncSimulatorPipelineResolverConfig extends AppSyncSimulatorBaseResolverConfig {
  requestMappingTemplateLocation: string;
  responseMappingTemplateLocation: string;
  typeName: string;
  fieldName: string;
  functions: string[];
}
export interface AppSyncSimulatorFunctionResolverConfig {
  dataSourceName: string;
  requestMappingTemplateLocation: string;
  responseMappingTemplateLocation: string;
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
interface AppSyncSimulatorDataSourceNoneConfig extends AppSyncSimulatorDataSourceBaseConfig {}
interface AppSyncSimulatorDataSourceLambdaConfig extends AppSyncSimulatorDataSourceBaseConfig {
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

export type AmplifyAppSyncAuthenticationProviderConfig =
  | AmplifyAppSyncAuthenticationProviderAPIConfig
  | AmplifyAppSyncAuthenticationProviderIAMConfig
  | AmplifyAppSyncAuthenticationProviderCognitoConfig
  | AmplifyAppSyncAuthenticationProviderOIDCConfig;

export type AmplifyAppSyncAPIConfig = {
  name: string;
  defaultAuthenticationType: AmplifyAppSyncAuthenticationProviderConfig;
  apiKey?: string;
  additionalAuthenticationProviders: AmplifyAppSyncAuthenticationProviderConfig[];
};

export type AmplifyAppSyncSimulatorConfig = {
  schema: AppSyncSimulatorSchemaConfig;
  resolvers?: AppSyncSimulatorBaseResolverConfig[];
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
