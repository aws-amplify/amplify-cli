import { $TSContext, stateManager, pathManager } from '@aws-amplify/amplify-cli-core';
import { AuthInputState } from '../../../../provider-utils/awscloudformation/auth-inputs-manager/auth-input-state';
import { AttributeType } from '../../../../provider-utils/awscloudformation/service-walkthrough-types/awsCognito-user-input-types';
import { updatesAppClientSecret } from '../../../../provider-utils/awscloudformation/utils/generate-cognito-app-client-secret';
import { projectHasAuth } from '../../../../provider-utils/awscloudformation/utils/project-has-auth';
import { getAuthResourceName } from '../../../../utils/getAuthResourceName';
import { getAppClientSecretViaSdk } from '../../../../provider-utils/awscloudformation/utils/get-app-client-secret-sdk';

jest.mock('amplify-cli-core');
jest.mock('../../../../provider-utils/awscloudformation/utils/project-has-auth');
jest.mock('../../../../utils/getAuthResourceName');
jest.mock('../../../../provider-utils/awscloudformation/utils/get-app-client-secret-sdk');

const stateManagerMock = stateManager as jest.Mocked<typeof stateManager>;
const pathManagerMock = pathManager as jest.Mocked<typeof pathManager>;
const projectHasAuthMock = projectHasAuth as jest.MockedFunction<typeof projectHasAuth>;
const getAuthResourceNameMock = getAuthResourceName as jest.MockedFunction<typeof getAuthResourceName>;
const getAppClientSecretViaSdkMock = getAppClientSecretViaSdk as jest.MockedFunction<typeof getAppClientSecretViaSdk>;

pathManagerMock.getBackendDirPath.mockReturnValue('mockBackendPath');
projectHasAuthMock.mockReturnValue(true);
getAuthResourceNameMock.mockResolvedValue('mockResource');

const contextStub = {
  amplify: {
    getImportedAuthProperties: jest.fn().mockResolvedValue({ imported: false }),
    updateamplifyMetaAfterResourceUpdate: jest.fn(),
  },
};
describe('test auth trigger stack Parameters', () => {
  it('test case 1 - app client secret when userpoolId isnt present  ', async () => {
    stateManagerMock.getMeta.mockReturnValue({
      auth: {
        mockResource: {
          output: {
            AppClientID: 'mockClientId',
          },
        },
      },
    });
    getAppClientSecretViaSdkMock.mockResolvedValue('mockAppClientSecret');
    jest.spyOn(AuthInputState.prototype, 'cliInputFileExists').mockReturnValue(true);
    jest.spyOn(AuthInputState.prototype, 'getCLIInputPayload').mockReturnValue({
      version: '1',
      cognitoConfig: {
        authSelections: 'identityPoolAndUserPool',
        autoVerifiedAttributes: ['mock'],
        mfaConfiguration: 'OFF',
        useEnabledMfas: false,
        requiredAttributes: ['mock'],
        resourceName: 'mockResource',
        useDefault: 'default',
        usernameAttributes: [AttributeType.EMAIL],
        serviceName: 'Cognito',
        userpoolClientGenerateSecret: false,
      },
    });
    await updatesAppClientSecret(contextStub as unknown as $TSContext);
    expect(contextStub.amplify.updateamplifyMetaAfterResourceUpdate.mock.calls).toMatchInlineSnapshot(`
      Array [
        Array [
          "auth",
          "mockResource",
          "output",
          Object {
            "AppClientID": "mockClientId",
          },
        ],
      ]
    `);
  });
  it('test case 2 - app client doesnt get generated when userpoolClientGenerateSecret is false  ', async () => {
    jest.clearAllMocks();
    stateManagerMock.getMeta.mockReturnValue({
      auth: {
        mockResource: {
          output: {
            AppClientID: 'mockClientId',
            UserPoolId: 'mockUserpoolId',
          },
        },
      },
    });
    getAppClientSecretViaSdkMock.mockResolvedValue('mockAppClientSecret');
    jest.spyOn(AuthInputState.prototype, 'cliInputFileExists').mockReturnValue(true);
    jest.spyOn(AuthInputState.prototype, 'getCLIInputPayload').mockReturnValue({
      version: '1',
      cognitoConfig: {
        authSelections: 'identityPoolAndUserPool',
        autoVerifiedAttributes: ['mock'],
        mfaConfiguration: 'OFF',
        useEnabledMfas: false,
        requiredAttributes: ['mock'],
        resourceName: 'mockResource',
        useDefault: 'default',
        usernameAttributes: [AttributeType.EMAIL],
        serviceName: 'Cognito',
        userpoolClientGenerateSecret: false,
      },
    });
    await updatesAppClientSecret(contextStub as unknown as $TSContext);
    expect(contextStub.amplify.updateamplifyMetaAfterResourceUpdate.mock.calls).toMatchInlineSnapshot(`
      Array [
        Array [
          "auth",
          "mockResource",
          "output",
          Object {
            "AppClientID": "mockClientId",
            "UserPoolId": "mockUserpoolId",
          },
        ],
      ]
    `);
  });

  it('test case 2 - appClientSecret doesnt gets generated when sdk returns undefined ', async () => {
    jest.clearAllMocks();
    stateManagerMock.getMeta.mockReturnValue({
      auth: {
        mockResource: {
          output: {
            AppClientID: 'mockClientId',
            UserPoolId: 'mockUserpoolId',
          },
        },
      },
    });
    getAppClientSecretViaSdkMock.mockResolvedValue(undefined);
    jest.spyOn(AuthInputState.prototype, 'cliInputFileExists').mockReturnValue(true);
    jest.spyOn(AuthInputState.prototype, 'getCLIInputPayload').mockReturnValue({
      version: '1',
      cognitoConfig: {
        authSelections: 'identityPoolAndUserPool',
        autoVerifiedAttributes: ['mock'],
        mfaConfiguration: 'OFF',
        useEnabledMfas: false,
        requiredAttributes: ['mock'],
        resourceName: 'mockResource',
        useDefault: 'default',
        usernameAttributes: [AttributeType.EMAIL],
        serviceName: 'Cognito',
        userpoolClientGenerateSecret: true,
      },
    });
    await updatesAppClientSecret(contextStub as unknown as $TSContext);
    expect(contextStub.amplify.updateamplifyMetaAfterResourceUpdate.mock.calls).toMatchInlineSnapshot(`
      Array [
        Array [
          "auth",
          "mockResource",
          "output",
          Object {
            "AppClientID": "mockClientId",
            "UserPoolId": "mockUserpoolId",
          },
        ],
      ]
    `);
  });

  it('test case 3 - appClientSecret gets generated when userpoolClientGenerateSecret is true ', async () => {
    jest.clearAllMocks();
    stateManagerMock.getMeta.mockReturnValue({
      auth: {
        mockResource: {
          output: {
            AppClientID: 'mockClientId',
            UserPoolId: 'mockUserpoolId',
          },
        },
      },
    });
    getAppClientSecretViaSdkMock.mockResolvedValue('mockAppClientSecret');
    jest.spyOn(AuthInputState.prototype, 'cliInputFileExists').mockReturnValue(true);
    jest.spyOn(AuthInputState.prototype, 'getCLIInputPayload').mockReturnValue({
      version: '1',
      cognitoConfig: {
        authSelections: 'identityPoolAndUserPool',
        autoVerifiedAttributes: ['mock'],
        mfaConfiguration: 'OFF',
        useEnabledMfas: false,
        requiredAttributes: ['mock'],
        resourceName: 'mockResource',
        useDefault: 'default',
        usernameAttributes: [AttributeType.EMAIL],
        serviceName: 'Cognito',
        userpoolClientGenerateSecret: true,
      },
    });
    await updatesAppClientSecret(contextStub as unknown as $TSContext);
    expect(contextStub.amplify.updateamplifyMetaAfterResourceUpdate.mock.calls).toMatchInlineSnapshot(`
      Array [
        Array [
          "auth",
          "mockResource",
          "output",
          Object {
            "AppClientID": "mockClientId",
            "AppClientSecret": "mockAppClientSecret",
            "UserPoolId": "mockUserpoolId",
          },
        ],
      ]
    `);
  });
});
