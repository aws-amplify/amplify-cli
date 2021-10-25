import { Duration, Stack } from '@aws-cdk/core';
import {
  BaseDataSource,
  CfnResolver,
  DynamoDbDataSource,
  GraphqlApiBase,
  HttpDataSource,
  LambdaDataSource,
  NoneDataSource,
} from '@aws-cdk/aws-appsync';
import { ITable } from '@aws-cdk/aws-dynamodb';
import { IFunction, ILayerVersion, Runtime } from '@aws-cdk/aws-lambda';
import {
  AppSyncFunctionConfigurationProvider,
  DataSourceOptions,
  SearchableDataSourceOptions,
  MappingTemplateProvider,
} from './graphql-api-provider';
import { IRole } from '@aws-cdk/aws-iam';

export interface DynamoDbDataSourceOptions extends DataSourceOptions {
  /**
   * ServiceRole for the Amazon DynamoDb
   */
  readonly serviceRole: IRole;
}

export interface TransformHostProvider {
  setAPI(api: GraphqlApiBase): void;

  addHttpDataSource(name: string, endpoint: string, options?: DataSourceOptions, stack?: Stack): HttpDataSource;
  addDynamoDbDataSource(name: string, table: ITable, options?: DynamoDbDataSourceOptions, stack?: Stack): DynamoDbDataSource;
  addNoneDataSource(name: string, options?: DataSourceOptions, stack?: Stack): NoneDataSource;
  addLambdaDataSource(name: string, lambdaFunction: IFunction, options?: DataSourceOptions, stack?: Stack): LambdaDataSource;
  addSearchableDataSource(
    name: string,
    endpoint: string,
    region: string,
    options?: SearchableDataSourceOptions,
    stack?: Stack,
  ): BaseDataSource;

  addAppSyncFunction: (
    name: string,
    requestMappingTemplate: MappingTemplateProvider,
    responseMappingTemplate: MappingTemplateProvider,
    dataSourceName: string,
    stack?: Stack,
  ) => AppSyncFunctionConfigurationProvider;

  addResolver: (
    typeName: string,
    fieldName: string,
    requestMappingTemplate: MappingTemplateProvider,
    responseMappingTemplate: MappingTemplateProvider,
    dataSourceName?: string,
    pipelineConfig?: string[],
    stack?: Stack,
  ) => CfnResolver;

  addLambdaFunction: (
    functionName: string,
    functionKey: string,
    handlerName: string,
    filePath: string,
    runtime: Runtime,
    layers?: ILayerVersion[],
    role?: IRole,
    environment?: { [key: string]: string },
    timeout?: Duration,
    stack?: Stack,
  ) => IFunction;

  getDataSource: (name: string) => BaseDataSource | void;
  hasDataSource: (name: string) => boolean;

  getResolver: (typeName: string, fieldName: string) => CfnResolver | void;
  hasResolver: (typeName: string, fieldName: string) => boolean;
}
