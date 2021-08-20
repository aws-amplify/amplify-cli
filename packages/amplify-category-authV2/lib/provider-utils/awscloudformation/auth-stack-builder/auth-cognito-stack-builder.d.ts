import * as cdk from '@aws-cdk/core';
import * as s3 from '@aws-cdk/aws-s3';
import * as iam from '@aws-cdk/aws-iam';
import { AmplifyAuthCognitoStackTemplate } from './types';
import { CfnUserPool, CfnUserPoolClient, CfnIdentityPool, CfnIdentityPoolRoleAttachment } from '@aws-cdk/aws-cognito';
export declare type AmplifyAuthCognitoStackProps = {
  synthesizer: cdk.IStackSynthesizer;
};
export declare class AmplifyAuthCognitoStack extends cdk.Stack implements AmplifyAuthCognitoStackTemplate {
  _scope: cdk.Construct;
  private _cfnParameterMap;
  customMessageConfirmationBucket: s3.CfnBucket | undefined;
  snsRole: iam.CfnRole | undefined;
  userPool: CfnUserPool | undefined;
  userPoolClientWeb: CfnUserPoolClient | undefined;
  userPoolClient: CfnUserPoolClient | undefined;
  userPoolClientRole: iam.CfnRole | undefined;
  identityPool: CfnIdentityPool | undefined;
  identityPoolRoleMap: CfnIdentityPoolRoleAttachment | undefined;
  constructor(scope: cdk.Construct, id: string, props: AmplifyAuthCognitoStackProps);
  addCfnOutput(props: cdk.CfnOutputProps, logicalId: string): void;
  addCfnMapping(props: cdk.CfnMappingProps, logicalId: string): void;
  addCfnCondition(props: cdk.CfnConditionProps, logicalId: string): void;
  addCfnResource(props: cdk.CfnResourceProps, logicalId: string): void;
  addCfnParameter(props: cdk.CfnParameterProps, logicalId: string): void;
  getCfnParameter(logicalId: string): cdk.CfnParameter | undefined;
  generateRootStackResources: () => Promise<void>;
  renderCloudFormationTemplate: (_: cdk.ISynthesisSession) => string;
}
//# sourceMappingURL=auth-cognito-stack-builder.d.ts.map
