import { $TSObject } from 'amplify-cli-core';
import { CrudOperation } from '../cdk-stack-builder';

export type ApigwPath = {
  name: string;
  permissions: {
    setting: PermissionSetting;
    auth?: CrudOperation[];
    unauth?: CrudOperation[];
    userPoolGroups?: {
      [userPoolGroupName: string]: CrudOperation[];
    };
  };
  lambdaArn?: string;
  lambdaFunction: string;
};

export enum PermissionSetting {
  PRIVATE = 'private',
  PROTECTED = 'protected',
  OPEN = 'open',
}

export type ApiRequirements = { authSelections: 'identityPoolAndUserPool'; allowUnauthenticatedIdentities?: boolean };

export type ApigwWalkthroughReturnPromise = Promise<{
  answers: ApigwAnswers;
}>;

export type ApigwAnswers = {
  paths: { [pathName: string]: ApigwPath };
  resourceName: string;
  functionArns?: string[];
  dependsOn?: $TSObject[];
};
