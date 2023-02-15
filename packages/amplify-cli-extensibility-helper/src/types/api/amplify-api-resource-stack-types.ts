// Amplify generated Types for API - override.ts

import {
  CfnApiKey, CfnDataSource, CfnFunctionConfiguration, CfnGraphQLApi, CfnGraphQLSchema, CfnResolver,
} from 'aws-cdk-lib/aws-appsync';
import { CfnTable } from 'aws-cdk-lib/aws-dynamodb';
import { CfnPolicy, CfnRole } from 'aws-cdk-lib/aws-iam';
import { CfnDomain } from 'aws-cdk-lib/aws-elasticsearch';
import { CfnFunction, CfnEventSourceMapping } from 'aws-cdk-lib/aws-lambda';
import { CfnStack } from 'aws-cdk-lib';

// Base template
// Customer can use these params to mutate the Cloudformation for the resource

/**
 * Public API: Base template to override amplify generated graphqlAPI
 */
export interface AmplifyApiGraphQlResourceStackTemplate {
  // directives stack
  api?: Partial<AppsyncApiStack>;
  models?: Partial<Record<string, ModelDirectiveStack>>;
  opensearch?: Partial<OpenSearchDirectiveStack & AppsyncStackCommon>;
  predictions?: Partial<PredictionsDirectiveStack & AppsyncStackCommon>;
}

/**
 * Public API:  Amplify Appsync Api type
 */
export type AppsyncApiStack = {
  // eslint-disable-next-line spellcheck/spell-checker
  rootstack: CfnStack;
  GraphQLAPI: CfnGraphQLApi;
  GraphQLAPIDefaultApiKey?: CfnApiKey;
  GraphQLAPITransformerSchema?: CfnGraphQLSchema;
  GraphQLAPINONEDS?: CfnDataSource;
  AmplifyDataStore?: CfnTable;
  AmplifyDataStoreIAMRole?: CfnRole;
  DynamoDBAccess?: CfnPolicy;
};

/**
 * Public API:  Amplify model directive type
 */
export type ModelDirectiveStack = AppsyncStackCommon & DDBModelDirectiveStack;

/**
 * Public API:  Appsync resolvers and Functions type
 */
export type AppsyncStackCommon = {
  resolvers?: Record<string, CfnResolver>;
  appsyncFunctions?: Record<string, CfnFunctionConfiguration>;
};

/**
 * Public API:  dynamoDB model directive stack
 */
export type DDBModelDirectiveStack = {
  modelStack?: CfnStack;
  modelDDBTable?: CfnTable;
  modelIamRole?: CfnRole;
  modelIamRoleDefaultPolicy?: CfnPolicy;
  dynamoDBAccess?: CfnPolicy;
  modelDatasource?: CfnDataSource;
  invokeLambdaFunction?: CfnPolicy;
};

/**
 * Public API:  http directive stack
 */
export interface HttpsDirectiveStack {
  httpsDataSource?: Record<string, CfnDataSource>;
  httpDataSourceServiceRole?: Record<string, CfnRole>;
  httpDataSourceServiceRoleDefaultPolicy?: Record<string, CfnPolicy>;
}

/**
 * Public API:  open search directive stack
 */
export interface OpenSearchDirectiveStack {
  OpenSearchDataSource?: CfnDataSource;
  OpenSearchAccessIAMRole?: CfnRole;
  OpenSearchAccessIAMRoleDefaultPolicy?: CfnPolicy;
  OpenSearchDomain?: CfnDomain;
  OpenSearchStreamingLambdaIAMRole?: CfnRole;
  OpenSearchStreamingLambdaIAMRoleDefaultPolicy?: CfnPolicy;
  // eslint-disable-next-line spellcheck/spell-checker
  CloudwatchLogsAccess?: CfnPolicy;
  OpenSearchStreamingLambdaFunction?: CfnFunction;
  OpenSearchModelLambdaMapping?: Record<string, CfnEventSourceMapping>;
}

/**
 * Public API:  function directive stack
 */
export interface FunctionDirectiveStack {
  lambdaDataSource: Record<string, CfnDataSource>;
  lambdaDataSourceRole: Record<string, CfnRole>;
  lambdaDataSourceServiceRoleDefaultPolicy: Record<string, CfnPolicy>;
}

/**
 * Public API:  predictions directive stack
 */
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
