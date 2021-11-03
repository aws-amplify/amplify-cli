import * as cdk from '@aws-cdk/core';
import * as apigwCdk from '@aws-cdk/aws-apigateway';
import * as iamCdk from '@aws-cdk/aws-iam';

export type ApigwInputs = {
  version: number;
  paths: Path[];
};

export type Path = {
  lambdaFunction: string;
  permissions: {
    setting: PermissionSetting;
    auth?: CrudOperation[];
    guest?: CrudOperation[];
    groups?: { [groupName: string]: CrudOperation[] };
  };
};

export enum CrudOperation {
  CREATE = 'CREATE',
  READ = 'READ',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
}

export enum PermissionSetting {
  PRIVATE = 'private',
  PROTECTED = 'protected',
  OPEN = 'open',
}

type AmplifyCDKL1 = {
  addCfnCondition(props: cdk.CfnConditionProps, logicalId: string): void;
  addCfnMapping(props: cdk.CfnMappingProps, logicalId: string): void;
  addCfnOutput(props: cdk.CfnOutputProps, logicalId: string): void;
  addCfnParameter(props: cdk.CfnParameterProps, logicalId: string): void;
  addCfnResource(props: cdk.CfnResourceProps, logicalId: string): void;
};

export type AmplifyApigwResourceTemplate = {
  restApi: apigwCdk.CfnRestApi;
  deploymentResource: apigwCdk.CfnDeployment;
  policies?: {
    [pathName: string]: ApigwPathPolicy;
  };
} & AmplifyCDKL1;

export type ApigwPathPolicy = {
  auth: iamCdk.CfnPolicy;
  guest?: iamCdk.CfnPolicy;
  groups?: { [groupName: string]: iamCdk.CfnPolicy };
};
