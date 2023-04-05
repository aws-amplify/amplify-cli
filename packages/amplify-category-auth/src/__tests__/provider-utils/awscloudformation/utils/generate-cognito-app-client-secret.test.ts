import { $TSContext, stateManager, pathManager, AmplifyFault } from '@aws-amplify/amplify-cli-core';
import { updateAppClientWithGeneratedSecret } from '../../../../provider-utils/awscloudformation/utils/generate-cognito-app-client-secret';
import { projectHasAuth } from '../../../../provider-utils/awscloudformation/utils/project-has-auth';
import { getAuthResourceName } from '../../../../utils/getAuthResourceName';
import { getAppClientSecret } from '../../../../provider-utils/awscloudformation/utils/get-app-client-secret-sdk';

jest.mock('amplify-cli-core');
jest.mock('../../../../provider-utils/awscloudformation/utils/project-has-auth');
jest.mock('../../../../utils/getAuthResourceName');
jest.mock('../../../../provider-utils/awscloudformation/utils/get-app-client-secret-sdk');

const stateManagerMock = stateManager as jest.Mocked<typeof stateManager>;
const pathManagerMock = pathManager as jest.Mocked<typeof pathManager>;
const AmplifyFaultMock = AmplifyFault as jest.MockedClass<typeof AmplifyFault>;
const projectHasAuthMock = projectHasAuth as jest.MockedFunction<typeof projectHasAuth>;
const getAuthResourceNameMock = getAuthResourceName as jest.MockedFunction<typeof getAuthResourceName>;
const getAppClientSecretMock = getAppClientSecret as jest.MockedFunction<typeof getAppClientSecret>;

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
  it('test case 1 - throws error when userpoolId isnt present  ', async () => {
    stateManagerMock.getMeta.mockReturnValue({
      auth: {
        mockResource: {
          output: {
            AppClientID: 'mockClientId',
          },
        },
      },
    });
    AmplifyFaultMock.mockImplementationOnce(() => {
      {
        throw new Error('clientId and userpoolId should be present in amplify-meta.json');
      }
    });
    await expect(
      async () => await updateAppClientWithGeneratedSecret(contextStub as unknown as $TSContext),
    ).rejects.toThrowErrorMatchingInlineSnapshot(`"clientId and userpoolId should be present in amplify-meta.json"`);
    expect(AmplifyFaultMock.mock.calls).toMatchInlineSnapshot(`
      Array [
        Array [
          "ParametersNotFoundFault",
          Object {
            "message": "clientId and userpoolId should be present in amplify-meta.json",
          },
        ],
      ]
    `);
  });

  it('test case 2 - appClientSecret doesnt get updated when sdk returns undefined ', async () => {
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
    getAppClientSecretMock.mockResolvedValue(undefined);
    await updateAppClientWithGeneratedSecret(contextStub as unknown as $TSContext);
    expect(contextStub.amplify.updateamplifyMetaAfterResourceUpdate.mock.calls).toMatchInlineSnapshot(`Array []`);
  });

  it('test case 3 - appClientSecret updates successfully ', async () => {
    jest.clearAllMocks();
    stateManagerMock.getMeta.mockReturnValue({
      auth: {
        mockResource: {
          output: {
            AppClientID: 'mockClientId',
            UserPoolId: 'mockUserpoolId',
            AmazonWebClient: 'mockAmazonWebClient',
            FacebookWebClient: 'mockFacebookWebClient',
            GoogleWebClient: 'mockGoogleWebClient',
            AppleWebClient: 'mockAppleWebClient',
            HostedUIDomain: 'mockHostedUIDomain',
            OAuthMetadata: 'mockOAuthMetadata',
          },
        },
      },
    });
    getAppClientSecretMock.mockResolvedValue('mockAppClientSecret');
    await updateAppClientWithGeneratedSecret(contextStub as unknown as $TSContext);
    expect(contextStub.amplify.updateamplifyMetaAfterResourceUpdate.mock.calls).toMatchInlineSnapshot(`
      Array [
        Array [
          "auth",
          "mockResource",
          "output",
          Object {
            "AmazonWebClient": "mockAmazonWebClient",
            "AppClientID": "mockClientId",
            "AppClientSecret": "mockAppClientSecret",
            "AppleWebClient": "mockAppleWebClient",
            "FacebookWebClient": "mockFacebookWebClient",
            "GoogleWebClient": "mockGoogleWebClient",
            "HostedUIDomain": "mockHostedUIDomain",
            "OAuthMetadata": "mockOAuthMetadata",
            "UserPoolId": "mockUserpoolId",
          },
        ],
      ]
    `);
  });

  it('test case 4 -  throws error when getAppClientSecret call fails ', async () => {
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
    getAppClientSecretMock.mockRejectedValue('error fetching app client secret');
    AmplifyFaultMock.mockImplementationOnce(() => {
      {
        throw new Error('error fetching app client secret');
      }
    });
    await expect(
      async () => await updateAppClientWithGeneratedSecret(contextStub as unknown as $TSContext),
    ).rejects.toThrowErrorMatchingInlineSnapshot(`"error fetching app client secret"`);
    expect(AmplifyFaultMock.mock.calls).toMatchInlineSnapshot(`
      Array [
        Array [
          "ServiceCallFault",
          Object {
            "message": undefined,
          },
          "error fetching app client secret",
        ],
      ]
    `);
  });
});
