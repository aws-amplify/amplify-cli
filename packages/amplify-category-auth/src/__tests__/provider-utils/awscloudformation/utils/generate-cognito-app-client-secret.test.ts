import { $TSContext, stateManager, pathManager } from '@aws-amplify/amplify-cli-core';
import { updateAppClientWithGeneratedSecret } from '../../../../provider-utils/awscloudformation/utils/generate-cognito-app-client-secret';
import { projectHasAuth } from '../../../../provider-utils/awscloudformation/utils/project-has-auth';
import { getAuthResourceName } from '../../../../utils/getAuthResourceName';
import { getAppClientSecret } from '../../../../provider-utils/awscloudformation/utils/get-app-client-secret-sdk';

jest.mock('@aws-amplify/amplify-cli-core');
jest.mock('../../../../provider-utils/awscloudformation/utils/project-has-auth');
jest.mock('../../../../utils/getAuthResourceName');
jest.mock('../../../../provider-utils/awscloudformation/utils/get-app-client-secret-sdk');

const stateManagerMock = stateManager as jest.Mocked<typeof stateManager>;
const pathManagerMock = pathManager as jest.Mocked<typeof pathManager>;
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
  it('test case 1 - appClientSecret doesnt get updated when sdk returns undefined ', async () => {
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
    expect(contextStub.amplify.updateamplifyMetaAfterResourceUpdate.mock.calls).toMatchInlineSnapshot(`[]`);
  });

  it('test case 2 - appClientSecret updates successfully ', async () => {
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
      [
        [
          "auth",
          "mockResource",
          "output",
          {
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

  it('test case 3 -  throws error when getAppClientSecret call fails ', async () => {
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
    try {
      await updateAppClientWithGeneratedSecret(contextStub as unknown as $TSContext);
    } catch (err) {
      console.log(err);
      expect(err).toMatchInlineSnapshot(`"error fetching app client secret"`);
      expect(contextStub.amplify.updateamplifyMetaAfterResourceUpdate.mock.calls).toMatchInlineSnapshot(`[]`);
    }
  });
});
