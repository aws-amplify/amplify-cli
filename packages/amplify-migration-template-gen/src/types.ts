import { Parameter } from '@aws-sdk/client-cloudformation';

export interface CFNOutput {
  Description: string;
  Value: string | object;
}

export enum CFNFunction {
  Equals = 'Fn::Equals',
  Not = 'Fn::Not',
  Or = 'Fn::Or',
  And = 'Fn::And',
  If = 'Fn::If',
}

export type CFNIntrinsicFunctionCondition = {
  Condition: string;
};

export type CFNConditionFunctionStatement = string | object | CFNConditionFunction | CFNIntrinsicFunctionCondition;

export type CFNConditionFunction =
  | { [CFNFunction.Equals]: [CFNConditionFunctionStatement, CFNConditionFunctionStatement] }
  | { [CFNFunction.Not]: [CFNConditionFunctionStatement] }
  | {
      [CFNFunction.Or]: [CFNConditionFunctionStatement, CFNConditionFunctionStatement];
    }
  | { [CFNFunction.And]: [CFNConditionFunctionStatement, CFNConditionFunctionStatement] };

export interface CFNResource {
  Type: string;
  Properties: Record<string, string | number | object>;
  DependsOn?: string[];
  Condition?: string;
}

export interface CFNParameter {
  Type: string;
  Default?: string;
  Description?: string;
  NoEcho?: boolean;
}

export interface CFNTemplate {
  Description: string;
  AWSTemplateFormatVersion: string;
  Conditions?: Record<string, CFNConditionFunction>;
  Resources: Record<string, CFNResource>;
  Parameters: Record<string, CFNParameter>;
  Outputs: Record<string, CFNOutput>;
}

export interface CFNChangeTemplate {
  oldTemplate: CFNTemplate;
  newTemplate: CFNTemplate;
}

export interface CFNChangeTemplateWithParams extends CFNChangeTemplate {
  params: Parameter[] | undefined;
}

export interface CFNStackRefactorTemplates {
  sourceTemplate: CFNTemplate;
  destinationTemplate: CFNTemplate;
  logicalIdMapping: Map<string, string>;
}

export type CATEGORY = 'auth' | 'storage';

export interface ResourceMappingLocation {
  StackName: string;
  LogicalResourceId: string;
}

export interface ResourceMapping {
  Source: ResourceMappingLocation;
  Destination: ResourceMappingLocation;
}

export enum CFN_AUTH_TYPE {
  UserPool = 'AWS::Cognito::UserPool',
  UserPoolClient = 'AWS::Cognito::UserPoolClient',
  IdentityPool = 'AWS::Cognito::IdentityPool',
  IdentityPoolRoleAttachment = 'AWS::Cognito::IdentityPoolRoleAttachment',
  UserPoolDomain = 'AWS::Cognito::UserPoolDomain',
}

export enum CFN_S3_TYPE {
  Bucket = 'AWS::S3::Bucket',
}

export type CFN_RESOURCE_TYPES = CFN_AUTH_TYPE | CFN_S3_TYPE;

export type AWS_RESOURCE_ATTRIBUTES = 'Arn';

export type CFN_CATEGORY_TYPE = CFN_AUTH_TYPE | CFN_S3_TYPE;
