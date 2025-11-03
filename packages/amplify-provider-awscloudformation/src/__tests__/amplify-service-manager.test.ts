import { stateManager } from '@aws-amplify/amplify-cli-core';
import { getConfiguredAmplifyClient } from '../aws-utils/aws-amplify';
import { checkAmplifyServiceIAMPermission } from '../amplify-service-permission-check';
import { init } from '../amplify-service-manager';
import { mockClient } from 'aws-sdk-client-mock';
import 'aws-sdk-client-mock-jest';
import { AmplifyClient, CreateAppCommand } from '@aws-sdk/client-amplify';

jest.mock('../aws-utils/aws-amplify');
jest.mock('../amplify-service-permission-check');

const mockAmplifyClient = mockClient(AmplifyClient);
const getConfiguredAmplifyClientMock = getConfiguredAmplifyClient as jest.MockedFunction<typeof getConfiguredAmplifyClient>;

const checkAmplifyServiceIAMPermissionMock = checkAmplifyServiceIAMPermission as jest.MockedFunction<
  typeof checkAmplifyServiceIAMPermission
>;
checkAmplifyServiceIAMPermissionMock.mockResolvedValue(true);

jest.spyOn(stateManager, 'teamProviderInfoExists').mockReturnValue(false);

describe('init', () => {
  beforeEach(() => {
    getConfiguredAmplifyClientMock.mockClear();
    mockAmplifyClient.reset();
  });
  it('throws ProjectInitError if Amplify app limit has been reached', async () => {
    mockAmplifyClient.on(CreateAppCommand).rejectsOnce({
      name: 'LimitExceededException',
    });
    getConfiguredAmplifyClientMock.mockResolvedValue(mockAmplifyClient as unknown as AmplifyClient);

    const amplifyServiceParamsStub = {
      context: {},
      awsConfigInfo: {},
      projectName: 'test-project',
      envName: 'test',
      stackName: 'test-stack-name',
    };
    await expect(init(amplifyServiceParamsStub)).rejects.toMatchInlineSnapshot(
      `[ProjectInitError: You have reached the Amplify App limit for this account and region]`,
    );
  });

  it('throws Configutation error if config level is general and soorcing wrong credentials', async () => {
    mockAmplifyClient.on(CreateAppCommand).rejectsOnce({
      name: 'ConfigError',
      message: 'Missing Region in Config',
    });
    getConfiguredAmplifyClientMock.mockResolvedValue(mockAmplifyClient as unknown as AmplifyClient);

    const amplifyServiceParamsStub = {
      context: {
        exeInfo: {
          awsConfigInfo: {
            configLevel: 'general',
          },
        },
      },
      awsConfigInfo: {},
      projectName: 'test-project',
      envName: 'test',
      stackName: 'test-stack-name',
    };
    await expect(init(amplifyServiceParamsStub)).rejects.toMatchInlineSnapshot(`[ConfigurationError: Missing Region in Config]`);
  });
});
