import * as cdk from '@aws-cdk/core';
import * as s3 from '@aws-cdk/aws-s3';
import * as iam from '@aws-cdk/aws-iam';

export interface AmplifyRootStackTemplate {
  Parameters?: Record<string, cdk.CfnParameter>;
  Resources?: AmplifyRootStackResource;
  Outputs?: Record<string, cdk.CfnOutput>;
  Mappings?: Record<string, cdk.CfnMapping>;
  Conditions?: Record<string, cdk.CfnCondition>;
}

export interface AmplifyRootStackResource {
  deploymentBucket?: s3.CfnBucket;
  authRole?: iam.CfnRole;
  unauthRole?: iam.CfnRole;
}
