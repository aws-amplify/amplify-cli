import * as cdk from 'aws-cdk-lib';
import * as apigwCdk from 'aws-cdk-lib/aws-apigateway';
import * as iamCdk from 'aws-cdk-lib/aws-iam';
import { $TSAny } from 'amplify-cli-core';

/**
 * Public API:  Amplify CDK types
 */
export type AmplifyCDKL1 = {
  addCfnCondition: (props: cdk.CfnConditionProps, logicalId: string) => void;
  addCfnMapping: (props: cdk.CfnMappingProps, logicalId: string) => void;
  addCfnOutput: (props: cdk.CfnOutputProps, logicalId: string) => void;
  addCfnParameter: (props: cdk.CfnParameterProps, logicalId: string, value?: $TSAny) => void;
  addCfnResource: (props: cdk.CfnResourceProps, logicalId: string) => void;
};

/**
 * Public API:  Amplify RestApi types
 */
export type AmplifyApiRestResourceStackTemplate = {
  restApi: apigwCdk.CfnRestApi;
  deploymentResource: apigwCdk.CfnDeployment;
  policies?: {
    [pathName: string]: ApigwPathPolicy;
  };
} & AmplifyCDKL1;

/**
 * Public API:  api gateway type
 */
export type ApigwPathPolicy = {
  groups?: { [groupName: string]: iamCdk.CfnPolicy };
};
