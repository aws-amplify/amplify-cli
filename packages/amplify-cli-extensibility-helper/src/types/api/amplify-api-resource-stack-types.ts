// Amplify generated Types for API - override.ts

import { CfnApiKey, CfnDataSource, CfnFunctionConfiguration, CfnGraphQLApi, CfnGraphQLSchema, CfnResolver } from '@aws-cdk/aws-appsync';
import { CfnTable } from '@aws-cdk/aws-dynamodb';
import { CfnPolicy, CfnRole } from '@aws-cdk/aws-iam';
import { CfnDomain } from '@aws-cdk/aws-elasticsearch';
import { CfnFunction, CfnEventSourceMapping } from '@aws-cdk/aws-lambda';
import { CfnStack } from '@aws-cdk/core';

// Base template
// Customer can use these params to mutate the Cloudformation for the resource

export interface AmplifyApiGraphQlResourceStackTemplate {
  // directives stack
  api?: Partial<AppsyncApiStack>;
  models?: Partial<Record<string, ModelDirectiveStack>>;
  http?: Partial<HttpsDirectiveStack & AppsyncStackCommon>;
  opensearch?: Partial<OpenSearchDirectiveStack & AppsyncStackCommon>;
  function?: Partial<FunctionDirectiveStack & AppsyncStackCommon>;
  predictions?: Partial<PredictionsDirectiveStack & AppsyncStackCommon>;
}

export type AppsyncApiStack = {
  rootstack: CfnStack;
  GraphQLAPI: CfnGraphQLApi;
  GraphQLAPIDefaultApiKey?: CfnApiKey;
  GraphQLAPITransformerSchema?: CfnGraphQLSchema;
  GraphQLAPINONEDS?: CfnDataSource;
  AmplifyDataStore?: CfnTable;
  AmplifyDataStoreIAMRole?: CfnRole;
  DynamoDBAccess?: CfnPolicy;
};

export type ModelDirectiveStack = AppsyncStackCommon & DDBModelDirectiveStack;

export type AppsyncStackCommon = {
  resolvers?: Record<string, CfnResolver>;
  appsyncFunctions?: Record<string, CfnFunctionConfiguration>;
};

export type DDBModelDirectiveStack = {
  modelStack?: CfnStack;
  modelDDBTable?: CfnTable;
  modelIamRole?: CfnRole;
  modelIamRoleDefaultPolicy?: CfnPolicy;
  dynamoDBAccess?: CfnPolicy;
  modelDatasource?: CfnDataSource;
  invokeLambdaFunction?: CfnPolicy;
};

export interface HttpsDirectiveStack {
  httpsDataSource?: Record<string, CfnDataSource>;
  httpDataSourceServiceRole?: Record<string, CfnRole>;
  httpDataSourceServiceRoleDefaultPolicy?: Record<string, CfnPolicy>;
}

export interface OpenSearchDirectiveStack {
  OpenSearchDataSource?: CfnDataSource;
  OpenSearchAccessIAMRole?: CfnRole;
  OpenSearchAccessIAMRoleDefaultPolicy?: CfnPolicy;
  OpenSearchDomain?: CfnDomain;
  OpenSearchStreamingLambdaIAMRole?: CfnRole;
  OpenSearchStreamingLambdaIAMRoleDefaultPolicy?: CfnPolicy;
  CloudwatchLogsAccess?: CfnPolicy;
  OpenSearchStreamingLambdaFunction?: CfnFunction;
  OpenSearchModelLambdaMapping?: Record<string, CfnEventSourceMapping>;
}

export interface FunctionDirectiveStack {
  lambdaDataSource: Record<string, CfnDataSource>;
  lambdaDataSourceRole: Record<string, CfnRole>;
  lambdaDataSourceServiceRoleDefaultPolicy: Record<string, CfnPolicy>;
}

export interface PredictionsDirectiveStack {
  RekognitionDataSource: CfnDataSource;
  RekognitionDataSourceServiceRole: CfnRole;
  TranslateDataSource: CfnDataSource;
  translateTextAccess: CfnPolicy;
  LambdaDataSource: CfnDataSource;
  LambdaDataSourceServiceRole: CfnRole;
  LambdaDataSourceServiceRoleDefaultPolicy: CfnPolicy;
  TranslateDataSourceServiceRole: CfnRole;
  predictionsLambdaIAMRole: CfnRole;
  predictionsLambdaFunction: CfnFunction;
  PredictionsLambdaAccess: CfnRole;
  predictionsIAMRole: CfnRole;
  PredictionsStorageAccess: CfnPolicy;
  identifyTextAccess: CfnPolicy;
  identifyLabelsAccess: CfnPolicy;
}
