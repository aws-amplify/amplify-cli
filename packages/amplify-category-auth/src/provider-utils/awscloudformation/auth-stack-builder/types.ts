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
  userPoolClientInputs?: cdk.CustomResource;
  // customresources HostedUI
  hostedUICustomResource?: lambda.CfnFunction;
  hostedUICustomResourcePolicy?: iam.CfnPolicy;
  hostedUICustomResourceLogPolicy?: iam.CfnPolicy;
  hostedUICustomResourceInputs?: cdk.CustomResource;
  // custom resource HostedUI Provider
  hostedUIProvidersCustomResource?: lambda.CfnFunction;
  hostedUIProvidersCustomResourcePolicy?: iam.CfnPolicy;
  hostedUIProvidersCustomResourceLogPolicy?: iam.CfnPolicy;
  hostedUIProvidersCustomResourceInputs?: cdk.CustomResource;
  // custom resource OAUTH Provider
  oAuthCustomResource?: lambda.CfnFunction;
  oAuthCustomResourcePolicy?: iam.CfnPolicy;
  oAuthCustomResourceLogPolicy?: iam.CfnPolicy;
  oAuthCustomResourceInputs?: cdk.CustomResource;
  //custom resource MFA
  mfaLambda?: lambda.CfnFunction;
  mfaLogPolicy?: iam.CfnPolicy;
  mfaLambdaPolicy?: iam.CfnPolicy;
  mfaLambdaInputs?: cdk.CustomResource;
  mfaLambdaRole?: iam.CfnRole;

  //custom resource identity pool - OPenId Lambda Role
  openIdLambda?: lambda.CfnFunction;
  openIdLogPolicy?: iam.CfnPolicy;
  openIdLambdaIAMPolicy?: iam.CfnPolicy;
  openIdLambdaInputs?: cdk.CustomResource;
  openIdLambdaRole?: iam.CfnRole;
}

export interface AmplifyUserPoolGroupStackTemplate {
  userPoolGroup?: Record<string, cognito.CfnUserPoolGroup>;
  userPoolGroupRole?: Record<string, iam.CfnRole>;
  roleMapCustomResource?: cdk.CustomResource;
  lambdaExecutionRole?: iam.CfnRole;
  roleMapLambdaFunction?: lambda.CfnFunction;
}
