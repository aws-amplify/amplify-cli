import * as cdk from '@aws-cdk/core';
import * as ddb from '@aws-cdk/aws-dynamodb';
import * as s3Cdk from '@aws-cdk/aws-s3';
import * as iamCdk from '@aws-cdk/aws-iam';

//CDK - L1 methods to store CFN gen related information
export interface AmplifyCDKL1 {
  addCfnParameter(props: cdk.CfnParameterProps, logicalId: string): void;
  addCfnOutput(props: cdk.CfnOutputProps, logicalId: string): void;
  addCfnMapping(props: cdk.CfnMappingProps, logicalId: string): void;
  addCfnCondition(props: cdk.CfnConditionProps, logicalId: string): void;
  addCfnResource(props: cdk.CfnResourceProps, logicalId: string): void;
}

export interface AmplifyDDBResourceTemplate extends AmplifyCDKL1 {
  dynamoDBTable?: ddb.CfnTable;
}

export interface AmplifyS3ResourceTemplate extends AmplifyCDKL1 {
  s3Bucket?: s3Cdk.CfnBucket;
  s3AuthPublicPolicy?: iamCdk.CfnPolicy;
  s3AuthProtectedPolicy?: iamCdk.CfnPolicy;
  s3AuthPrivatePolicy?: iamCdk.CfnPolicy;
  s3AuthUploadPolicy?: iamCdk.CfnPolicy;
  s3AuthReadPolicy?: iamCdk.CfnPolicy;
  s3GuestPublicPolicy?: iamCdk.CfnPolicy;
  s3GuestUploadPolicy?: iamCdk.CfnPolicy;
  s3GuestReadPolicy?: iamCdk.CfnPolicy;
}

//Types used in Build/Params.json
export enum AmplifyBuildParamsPermissions {
  ALLOW = 'ALLOW',
  DISALLOW = 'DISALLOW',
}
