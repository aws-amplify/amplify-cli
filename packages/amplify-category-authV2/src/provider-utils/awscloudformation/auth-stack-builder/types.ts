import * as cdk from '@aws-cdk/core';
import * as s3 from '@aws-cdk/aws-s3';
import * as iam from '@aws-cdk/aws-iam';
import * as cognito from '@aws-cdk/aws-cognito';
import * as lambda from '@aws-cdk/aws-lambda';

export interface AmplifyAuthCognitoStackTemplate {
  customMessageConfirmationBucket?: s3.CfnBucket;
  snsRole?: iam.CfnRole;
  userPool?: cognito.CfnUserPool;
  userPoolClientWeb?: cognito.CfnUserPoolClient;
  userPoolClient?: cognito.CfnUserPoolClient;
  identityPool?: cognito.CfnIdentityPool;
  identityPoolRoleMap?: cognito.CfnIdentityPoolRoleAttachment;
  lambdaConfigPermissions?: Record<string, lambda.CfnPermission>;
  lambdaTriggerPermissions?: Record<string, iam.CfnPolicy>;
  // customresources userPoolClient
  userPoolClientLambda?: lambda.CfnFunction;
  userPoolClientRole?: iam.CfnRole;
  userPoolClientLambdaPolicy?: iam.CfnPolicy;
  userPoolClientLogPolicy?: iam.CfnPolicy;
  userPoolClientInputs?: cdk.CfnCustomResource;
  // customresources HostedUI
  hostedUICustomResource?: lambda.CfnFunction;
  hostedUICustomResourcePolicy?: iam.CfnPolicy;
  hostedUICustomResourceLogPolicy?: iam.CfnPolicy;
  hostedUICustomResourceInputs?: cdk.CfnCustomResource;
  // custom resource HostedUI Provider
  hostedUIProvidersCustomResource?: lambda.CfnFunction;
  HostedUIProvidersCustomResourcePolicy?: iam.CfnPolicy;
  HostedUIProvidersCustomResourceLogPolicy?: iam.CfnPolicy;
  HostedUIProvidersCustomResourceInputs?: cdk.CfnCustomResource;
  // custom resource OAUTH Provider
  OAuthCustomResource?: lambda.CfnFunction;
  OAuthCustomResourcePolicy?: iam.CfnPolicy;
  OAuthCustomResourceLogPolicy?: iam.CfnPolicy;
  OAuthCustomResourceInputs?: cdk.CfnCustomResource;
  //custom resource MFA
  MFALambda?: lambda.CfnFunction;
  MFALogPolicy?: iam.CfnPolicy;
  MFALambdaPolicy?: iam.CfnPolicy;
  MFALambdaInputs?: cdk.CfnCustomResource;
  MFALambdaRole?: iam.CfnRole;

  //custom resource identity pool - OPenId Lambda Role
  OpenIdLambda?: lambda.CfnFunction;
  OpenIdLogPolicy?: iam.CfnPolicy;
  OpenIdLambdaIAMPolicy?: iam.CfnPolicy;
  OpenIdLambdaInputs?: cdk.CfnCustomResource;
  OpenIdLambdaRole?: iam.CfnRole;

  addCfnParameter(props: cdk.CfnParameterProps, logicalId: string): void;
  addCfnOutput(props: cdk.CfnOutputProps, logicalId: string): void;
  addCfnMapping(props: cdk.CfnMappingProps, logicalId: string): void;
  addCfnCondition(props: cdk.CfnConditionProps, logicalId: string): void;
  addCfnResource(props: cdk.CfnResourceProps, logicalId: string): void;
}

export interface AmplifyUserPoolGroupStackTemplate {
  userPoolGroup?: Record<string, cognito.CfnUserPoolGroup>;
  userPoolGroupRole?: Record<string, iam.CfnRole>;
  roleMapCustomResource?: cdk.CustomResource;
  lambdaExecutionRole?: iam.CfnRole;
  roleMapLambdaFunction?: lambda.CfnFunction;

  addCfnParameter(props: cdk.CfnParameterProps, logicalId: string): void;
  addCfnOutput(props: cdk.CfnOutputProps, logicalId: string): void;
  addCfnMapping(props: cdk.CfnMappingProps, logicalId: string): void;
  addCfnCondition(props: cdk.CfnConditionProps, logicalId: string): void;
  addCfnResource(props: cdk.CfnResourceProps, logicalId: string): void;
}
