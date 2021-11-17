import { $TSAny } from 'amplify-cli-core';
import { lambdaEventSourceHandler, lambdaFunctionHandler } from './lambda';
import { CloudFormationResource, ProcessedLambdaFunction } from '../stack/types';
import { CloudFormationParseContext } from '../types';
import {
  appSyncAPIKeyResourceHandler,
  appSyncAPIResourceHandler,
  appSyncDataSourceHandler,
  appSyncFunctionHandler,
  appSyncResolverHandler,
  appSyncSchemaHandler,
  dynamoDBResourceHandler,
} from './appsync';
import { iamPolicyResourceHandler, iamRoleResourceHandler } from './iam';
import { openSearchDomainHandler } from './opensearch';

export type CloudFormationResourceProcessorFn = (
  resourceName: string,
  resource: CloudFormationResource,
  cfnContext: CloudFormationParseContext,
) => ProcessedLambdaFunction | $TSAny; // TODO should type the rest of the handler responses

const resourceProcessorMapping: Record<string, CloudFormationResourceProcessorFn> = {};
export function getResourceProcessorFor(resourceType: string): CloudFormationResourceProcessorFn {
  if (resourceType in resourceProcessorMapping) {
    return resourceProcessorMapping[resourceType];
  }
  throw new Error(`No resource handler found for the CloudFormation resource type ${resourceType}`);
}

export function registerResourceProcessors(resourceType: string, resourceProcessor: CloudFormationResourceProcessorFn): void {
  resourceProcessorMapping[resourceType] = resourceProcessor;
}

export function registerAppSyncResourceProcessor(): void {
  registerResourceProcessors('AWS::AppSync::GraphQLApi', appSyncAPIResourceHandler);
  registerResourceProcessors('AWS::AppSync::ApiKey', appSyncAPIKeyResourceHandler);
  registerResourceProcessors('AWS::AppSync::GraphQLSchema', appSyncSchemaHandler);
  registerResourceProcessors('AWS::DynamoDB::Table', dynamoDBResourceHandler);
  registerResourceProcessors('AWS::AppSync::Resolver', appSyncResolverHandler);
  registerResourceProcessors('AWS::AppSync::DataSource', appSyncDataSourceHandler);
  registerResourceProcessors('AWS::AppSync::FunctionConfiguration', appSyncFunctionHandler);
}

export function registerIAMResourceProcessor(): void {
  registerResourceProcessors('AWS::IAM::Policy', iamPolicyResourceHandler);
  registerResourceProcessors('AWS::IAM::Role', iamRoleResourceHandler);
}

export function registerLambdaResourceProcessor(): void {
  registerResourceProcessors('AWS::Lambda::Function', lambdaFunctionHandler);
  registerResourceProcessors('AWS::Lambda::EventSourceMapping', lambdaEventSourceHandler);
}

export function registerOpenSearchResourceProcessor(): void {
  registerResourceProcessors('AWS::Elasticsearch::Domain', openSearchDomainHandler);
}
