import { JSONUtilities } from '@aws-amplify/amplify-cli-core';
import { migrateResourceToSupportOverride } from '../../../../provider-utils/awscloudformation/utils/migrate-override-resource';
import * as path from 'path';

jest.mock('@aws-amplify/amplify-prompts');
jest.mock('fs-extra');

jest.mock('@aws-amplify/amplify-cli-core', () => ({
  ...(jest.requireActual('@aws-amplify/amplify-cli-core') as {}),
  pathManager: {
    findProjectRoot: jest.fn().mockReturnValue('somePath'),
    getBackendDirPath: jest.fn().mockReturnValue('mockProjectPath'),
    getResourceDirectoryPath: jest.fn().mockReturnValue('mockProjectPath'),
  },
  JSONUtilities: {
    readJson: jest.fn().mockReturnValue({
      identityPoolName: 'authdefaultsettingsp1b7b273e_identitypool_1b7b273e',
      allowUnauthenticatedIdentities: false,
      resourceNameTruncated: 'authde1b7b273e',
      userPoolName: 'authdefaultsettingsp1b7b273e_userpool_1b7b273e',
      autoVerifiedAttributes: ['email'],
      mfaConfiguration: 'OFF',
      mfaTypes: ['SMS Text Message'],
      smsAuthenticationMessage: 'Your authentication code is {####}',
      smsVerificationMessage: 'Your verification code is {####}',
      emailVerificationSubject: 'Your verification code',
      emailVerificationMessage: 'Your verification code is {####}',
      defaultPasswordPolicy: false,
      passwordPolicyMinLength: 8,
      passwordPolicyCharacters: [],
      requiredAttributes: ['email'],
      aliasAttributes: ['email'],
      userpoolClientGenerateSecret: false,
      userpoolClientRefreshTokenValidity: 30,
      userpoolClientWriteAttributes: ['email'],
      userpoolClientReadAttributes: ['email'],
      userpoolClientLambdaRole: 'authde1b7b273e_userpoolclient_lambda_role',
      userpoolClientSetAttributes: false,
      sharedId: '1b7b273e',
      resourceName: 'mockResource',
      authSelections: 'identityPoolAndUserPool',
      authRoleArn: {
        'Fn::GetAtt': ['AuthRole', 'Arn'],
      },
      unauthRoleArn: {
        'Fn::GetAtt': ['UnauthRole', 'Arn'],
      },
      useDefault: 'default',
      userPoolGroupList: [],
      serviceName: 'Cognito',
      usernameCaseSensitive: false,
      dependsOn: [
        {
          category: 'function',
          resourceName: 'authdefaultsettingsp1b7b273ePostAuthentication',
          triggerProvider: 'Cognito',
          attributes: ['Arn', 'Name'],
        },
        {
          category: 'function',
          resourceName: 'authdefaultsettingsp1b7b273ePostConfirmation',
          triggerProvider: 'Cognito',
          attributes: ['Arn', 'Name'],
        },
      ],
      userPoolGroups: false,
      adminQueries: false,
      triggers: '{\n  "PostAuthentication": [\n    "custom"\n  ],\n  "PostConfirmation": [\n    "add-to-group"\n  ]\n}',
      hostedUI: false,
      parentStack: {
        Ref: 'AWS::StackId',
      },
      authTriggerConnections:
        '[\n  {\n    "triggerType": "PostAuthentication",\n    "lambdaFunctionName": "authdefaultsettingsp1b7b273ePostAuthentication"\n  },\n  {\n    "triggerType": "PostConfirmation",\n    "lambdaFunctionName": "authdefaultsettingsp1b7b273ePostConfirmation"\n  }\n]',
      breakCircularDependency: true,
      permissions: [
        '{\n  "policyName": "AddToGroupCognito",\n  "trigger": "PostConfirmation",\n  "effect": "Allow",\n  "actions": [\n    "cognito-idp:AdminAddUserToGroup",\n    "cognito-idp:GetGroup",\n    "cognito-idp:CreateGroup"\n  ],\n  "resource": {\n    "paramType": "!GetAtt",\n    "keys": [\n      "UserPool",\n      "Arn"\n    ]\n  }\n}',
      ],
      authProviders: [],
    }),
    writeJson: jest.fn(),
  },
}));
test('migrate resource', async () => {
  const resourceName = 'mockResource';
  await migrateResourceToSupportOverride(resourceName);
  const expectedPath = path.join('mockProjectPath', 'cli-inputs.json');
  const expectedPayload = {
    version: '1',
    cognitoConfig: {
      authSelections: 'identityPoolAndUserPool',
      requiredAttributes: ['email'],
      resourceName: 'mockResource',
      serviceName: 'Cognito',
      useDefault: 'default',
      userpoolClientReadAttributes: ['email'],
      userpoolClientWriteAttributes: ['email'],
      aliasAttributes: ['email'],
      resourceNameTruncated: 'authde1b7b273e',
      sharedId: '1b7b273e',
      userPoolGroupList: [],
      userPoolGroups: false,
      userPoolName: 'authdefaultsettingsp1b7b273e_userpool_1b7b273e',
      usernameCaseSensitive: false,
      userpoolClientRefreshTokenValidity: 30,
      userpoolClientSetAttributes: false,
      userpoolClientGenerateSecret: false,
      userpoolClientLambdaRole: 'authde1b7b273e_userpoolclient_lambda_role',
      passwordPolicyCharacters: [],
      passwordPolicyMinLength: 8,
      adminQueries: false,
      mfaConfiguration: 'OFF',
      mfaTypes: ['SMS Text Message'],
      smsAuthenticationMessage: 'Your authentication code is {####}',
      emailVerificationMessage: 'Your verification code is {####}',
      emailVerificationSubject: 'Your verification code',
      smsVerificationMessage: 'Your verification code is {####}',
      autoVerifiedAttributes: ['email'],
      hostedUI: false,
      identityPoolName: 'authdefaultsettingsp1b7b273e_identitypool_1b7b273e',
      allowUnauthenticatedIdentities: false,
      authProviders: [],
      triggers: {
        PostAuthentication: ['custom'],
        PostConfirmation: ['add-to-group'],
      },
    },
  };
  expect(JSONUtilities.writeJson).toBeCalledWith(expectedPath, expectedPayload);
});
