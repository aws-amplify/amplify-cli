import * as iam from '@aws-cdk/aws-iam';
import * as cdk from '@aws-cdk/core';

export interface AmplifyRootStackTemplate {
  authRole?: iam.CfnRole;
  unauthRole?: iam.CfnRole;

  addCfnParameter(props: cdk.CfnParameterProps, logicalId: string): void;
  addCfnOutput(props: cdk.CfnOutputProps, logicalId: string): void;
  addCfnMapping(props: cdk.CfnMappingProps, logicalId: string): void;
  addCfnCondition(props: cdk.CfnConditionProps, logicalId: string): void;
  addCfnResource(props: cdk.CfnResourceProps, logicalId: string): void;
}
