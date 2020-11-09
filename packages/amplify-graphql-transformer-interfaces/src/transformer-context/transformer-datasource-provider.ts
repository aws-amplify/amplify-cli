import { BackedDataSource, HttpDataSource } from '@aws-cdk/aws-appsync';
import { ITable } from '@aws-cdk/aws-dynamodb';
import { CfnDomain } from '@aws-cdk/aws-elasticsearch';
import { IFunction } from '@aws-cdk/aws-lambda';
import { InterfaceTypeDefinitionNode, ObjectTypeDefinitionNode } from 'graphql';

export enum AppSyncDataSourceType {
  AMAZON_DYNAMODB = 'AMAZON_DYNAMODB',
  AMAZON_ELASTICSEARCH = 'AMAZON_ELASTICSEARCH',
  AWS_LAMBDA = 'AWS_LAMBDA',
  RELATIONAL_DATABASE = 'RELATIONAL_DATABASE',
  HTTP = 'HTTP',
  NONE = 'NONE',
}

export interface NoneDataSourceProvider {
  readonly name: string;
}

export type DataSourceInstance = ITable | CfnDomain | HttpDataSource | IFunction | NoneDataSourceProvider;

export interface TransformerDataSourceManagerProvider {
  add(type: ObjectTypeDefinitionNode | InterfaceTypeDefinitionNode, dataSourceInstance: DataSourceInstance): void;
  get(type: ObjectTypeDefinitionNode | InterfaceTypeDefinitionNode): DataSourceInstance;
}

export interface DataSourceProvider extends BackedDataSource {}
