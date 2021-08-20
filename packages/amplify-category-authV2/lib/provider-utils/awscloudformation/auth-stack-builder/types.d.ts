import * as cdk from '@aws-cdk/core';
import * as s3 from '@aws-cdk/aws-s3';
import * as iam from '@aws-cdk/aws-iam';
import * as cognito from '@aws-cdk/aws-cognito';
export interface AmplifyAuthCognitoStackTemplate {
  customMessageConfirmationBucket?: s3.CfnBucket;
  snsRole?: iam.CfnRole;
  userPool?: cognito.CfnUserPool;
  userPoolClientWeb?: cognito.CfnUserPoolClient;
  userPoolClient?: cognito.CfnUserPoolClient;
  userPoolClientRole?: iam.CfnRole;
  identityPool?: cognito.CfnIdentityPool;
  identityPoolRoleMap?: cognito.CfnIdentityPoolRoleAttachment;
  addCfnParameter(props: cdk.CfnParameterProps, logicalId: string): void;
  addCfnOutput(props: cdk.CfnOutputProps, logicalId: string): void;
  addCfnMapping(props: cdk.CfnMappingProps, logicalId: string): void;
  addCfnCondition(props: cdk.CfnConditionProps, logicalId: string): void;
  addCfnResource(props: cdk.CfnResourceProps, logicalId: string): void;
}
export interface AmplifyAuthUserPoolGroupStackTemplate {
  userPoolGroup?: Record<string, cognito.CfnUserPoolGroup>;
  userPoolGroupRole?: Record<string, iam.CfnRole>;
  roleMapCustomResource?: cdk.CfnCustomResource;
  lambdaExecutionRole?: iam.CfnRole;
  addCfnParameter(props: cdk.CfnParameterProps, logicalId: string): void;
  addCfnOutput(props: cdk.CfnOutputProps, logicalId: string): void;
  addCfnMapping(props: cdk.CfnMappingProps, logicalId: string): void;
  addCfnCondition(props: cdk.CfnConditionProps, logicalId: string): void;
  addCfnResource(props: cdk.CfnResourceProps, logicalId: string): void;
}
export declare type AmplifyAuthStackTemplate = AmplifyAuthCognitoStackTemplate | AmplifyAuthUserPoolGroupStackTemplate;
//# sourceMappingURL=types.d.ts.map
