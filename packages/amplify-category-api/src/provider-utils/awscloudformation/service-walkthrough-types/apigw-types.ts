import { $TSObject } from 'amplify-cli-core';
import { CrudOperation, PermissionSetting } from '../cdk-stack-builder';

export type ApigwPath = {
  name: string;
  permissions: {
    setting: PermissionSetting;
    auth?: CrudOperation[];
    unauth?: CrudOperation[];
    groups?: {
      [userPoolGroupName: string]: CrudOperation[];
    };
  };
  lambdaFunction: string;
};

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
