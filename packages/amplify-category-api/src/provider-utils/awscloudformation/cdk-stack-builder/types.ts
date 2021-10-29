import * as cdk from '@aws-cdk/core';
import * as apigwCdk from '@aws-cdk/aws-apigateway';
import * as iamCdk from '@aws-cdk/aws-iam';

export type ApigwInputs = {
  version: number;
  paths: Path[];
};

type Path = {
  name: string;
  lambdaFunction: string;
  privacy: {
    privacySetting: 'private' | 'open';
    auth: CrudOperation[];
    guest?: CrudOperation[];
    groups?: { [groupName: string]: CrudOperation[] }[];
  };
};

enum CrudOperation {
  CREATE = 'CREATE',
  READ = 'READ',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
}

type AmplifyCDKL1 = {
  addCfnCondition(props: cdk.CfnConditionProps, logicalId: string): void;
  addCfnMapping(props: cdk.CfnMappingProps, logicalId: string): void;
  addCfnOutput(props: cdk.CfnOutputProps, logicalId: string): void;
  addCfnParameter(props: cdk.CfnParameterProps, logicalId: string): void;
  addCfnResource(props: cdk.CfnResourceProps, logicalId: string): void;

  // getCfnCondition(logicalId: string): cdk.CfnCondition;
  // getCfnMapping(logicalId: string): cdk.CfnMapping;
  // getCfnOutput(logicalId: string): cdk.CfnOutput;
  // getCfnParameter(logicalId: string): cdk.CfnParameter;
  // getCfnResource(logicalId: string): cdk.CfnResource;
};

export type AmplifyApigwResourceTemplate = {
  restApi: apigwCdk.CfnRestApi;
  _deploymentResource: apigwCdk.CfnDeployment;
  _policies: {
    [pathName: string]: ApigwPathPolicy;
  };
} & AmplifyCDKL1;

export type ApigwPathPolicy = {
  auth: iamCdk.CfnPolicy;
  guest?: iamCdk.CfnPolicy;
  groups?: { [groupName: string]: iamCdk.CfnPolicy };
};
