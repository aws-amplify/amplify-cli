import { $TSObject } from 'amplify-cli-core';

export type ApigwPath = {
  name: string;
  permissions: {
    setting: PermissionSetting;
    auth: string | string[];
    authPrivacy: string[];
    unauth: string | string[];
    unauthPrivacy: string[];
    userPoolGroups: {
      [userPoolGroupName: string]: $TSObject[]; // TODO replace $TSObject
    };
  };
  lambdaArn: string;
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

export type ApigwAnswers = { paths: ApigwPath[]; resourceName: string; functionArns?: string[]; dependsOn?: $TSObject[] };
