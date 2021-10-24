// Amplify generated Types for API - override.ts

import { CfnApiKey, CfnDataSource, CfnFunctionConfiguration, CfnGraphQLApi, CfnGraphQLSchema, CfnResolver } from '@aws-cdk/aws-appsync';
import { CfnTable } from '@aws-cdk/aws-dynamodb';
import { CfnPolicy, CfnRole } from '@aws-cdk/aws-iam';
import { CfnDomain } from '@aws-cdk/aws-elasticsearch';
import { CfnFunction, CfnEventSourceMapping } from '@aws-cdk/aws-lambda';
import { CfnStack } from '@aws-cdk/core';

// Base template
// Customer can use these params to mutate the Cloudformation for the resource

// export type AppSyncServiceResourceStackMap = Record<string, >

// type temmp = Record<string,AggregateTypes> |  AggregateTypes

// type AggregateTypes = AppsyncApiStack & Record<string,ModelDirectiveStack> &  HttpsDirectiveStack & OpenSearchDirectiveStack & FunctionDirectiveStack & PredictionsDirectiveStack

export interface AppSyncServiceResourceStack {
  // directives stack
  api?: AppsyncApiStack;
  models?: Record<string, ModelDirectiveStack>;
  http?: HttpsDirectiveStack & AppsyncStackCommon;
  opensearch?: OpenSearchDirectiveStack & AppsyncStackCommon;
  function?: FunctionDirectiveStack & AppsyncStackCommon;
  predictions?: PredictionsDirectiveStack & AppsyncStackCommon;
}

export type AppsyncApiStack = {
  rootstack?: CfnStack;
  GraphQLAPI?: CfnGraphQLApi;
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
  openSearchDataSource?: CfnDataSource;
  openSearchAccessIAMRole?: CfnRole;
  OpenSearchAccessIAMRoleDefaultPolicy?: CfnPolicy;
  openSearchDomain?: CfnDomain;
  openSearchStreamingLambdaIAMRole?: CfnRole;
  openSearchStreamingLambdaIAMRoleDefaultPolicy?: CfnPolicy;
  cloudwatchLogsAccess?: CfnPolicy;
  openSearchStreamingLambdaFunction?: CfnFunction;
  openSearchModelLambdaMapping?: Record<string, CfnEventSourceMapping>;
}

export interface FunctionDirectiveStack {
  lambdaDataSource: Record<string, CfnDataSource>;
  lambdaDataSourceRole: Record<string, CfnRole>;
  lambdaDataSourceServiceRoleDefaultPolicy: Record<string, CfnPolicy>;
}

export interface PredictionsDirectiveStack {
  rekognitionDataSource?: CfnDataSource;
  TranslateDataSource?: CfnDataSource;
  LambdaDataSource?: CfnDataSource;
  predictionsLambdaIAMRole?: CfnRole;
  predictionsLambdaFunction?: CfnFunction;
  predictionsIAMRole?: CfnRole;
}
