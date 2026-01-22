import { Parameter, StackRefactorExecutionStatus, StackRefactorStatus } from '@aws-sdk/client-cloudformation';

// https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/outputs-section-structure.html
export interface CFNOutput {
  Description?: string;
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
  DependsOn?: string | string[];
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
  Parameters?: Record<string, CFNParameter>;
  Outputs: Record<string, CFNOutput>;
}

export interface CFNChangeTemplate {
  oldTemplate: CFNTemplate;
  newTemplate: CFNTemplate;
}

export interface CFNChangeTemplateWithParams extends CFNChangeTemplate {
  parameters: Parameter[] | undefined;
}

export interface CFNStackRefactorTemplates {
  sourceTemplate: CFNTemplate;
  destinationTemplate: CFNTemplate;
  logicalIdMapping: Map<string, string>;
}

export enum NON_CUSTOM_RESOURCE_CATEGORY {
  AUTH = 'auth',
  STORAGE = 'storage',
  AUTH_USER_POOL_GROUP = 'auth-user-pool-group',
  ANALYTICS = 'analytics',
}

export type CATEGORY =
  | NON_CUSTOM_RESOURCE_CATEGORY.AUTH
  | NON_CUSTOM_RESOURCE_CATEGORY.STORAGE
  | NON_CUSTOM_RESOURCE_CATEGORY.AUTH_USER_POOL_GROUP
  | NON_CUSTOM_RESOURCE_CATEGORY.ANALYTICS
  | string;

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
  UserPoolGroup = 'AWS::Cognito::UserPoolGroup',
}

export enum CFN_S3_TYPE {
  Bucket = 'AWS::S3::Bucket',
}

export enum CFN_DYNAMODB_TYPE {
  Table = 'AWS::DynamoDB::Table',
}

export enum CFN_ANALYTICS_TYPE {
  Stream = 'AWS::Kinesis::Stream',
}

export enum CFN_IAM_TYPE {
  Role = 'AWS::IAM::Role',
}

export enum CFN_SQS_TYPE {
  Queue = 'AWS::SQS::Queue',
}

export enum CFN_LAMBDA_TYPE {
  Function = 'AWS::Lambda::Function',
}

export type CFN_RESOURCE_TYPES =
  | CFN_AUTH_TYPE
  | CFN_S3_TYPE
  | CFN_DYNAMODB_TYPE
  | CFN_ANALYTICS_TYPE
  | CFN_IAM_TYPE
  | CFN_SQS_TYPE
  | CFN_LAMBDA_TYPE;

export type AWS_RESOURCE_ATTRIBUTES = 'Arn';

export type CFN_CATEGORY_TYPE = CFN_AUTH_TYPE | CFN_S3_TYPE | CFN_ANALYTICS_TYPE | CFN_IAM_TYPE | string;

export enum CFN_PSEUDO_PARAMETERS_REF {
  StackName = 'AWS::StackName',
}

export enum CFNStackStatus {
  UPDATE_COMPLETE = 'UPDATE_COMPLETE',
}

export type BaseOAuthClient = { ProviderName: string; client_id: string };
export type OAuthClientWithSecret = BaseOAuthClient & { client_secret: string };
export type SignInWithAppleOAuthClient = BaseOAuthClient & { team_id: string; key_id: string; private_key: string };
export type OAuthClient = OAuthClientWithSecret | SignInWithAppleOAuthClient;
export type HostedUIProviderMeta = {
  ProviderName: 'Amazon' | 'Facebook' | 'Google' | 'SignInWithApple';
};

export type FailedRefactorResponse = {
  reason: string | undefined;
  stackRefactorId: string;
  status: StackRefactorStatus | StackRefactorExecutionStatus | undefined;
};

export enum GEN2_AUTH_LOGICAL_RESOURCE_ID {
  IDENTITY_POOL_ROLE_ATTACHMENT = 'IdentityPoolRoleAttachment',
}
