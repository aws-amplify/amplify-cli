import { Amplify } from 'aws-sdk';
import { stateManager } from 'amplify-cli-core';
import { getConfiguredAmplifyClient } from '../aws-utils/aws-amplify';
import { checkAmplifyServiceIAMPermission } from '../amplify-service-permission-check';
import { init } from '../amplify-service-manager';

jest.mock('../aws-utils/aws-amplify');
jest.mock('../amplify-service-permission-check');

const amplifyClientStub = ({
  createApp: jest.fn().mockReturnValue({
    promise: jest.fn().mockRejectedValue({
      code: 'LimitExceededException',
    }),
  }),
} as unknown) as Amplify;
const getConfiguredAmplifyClientMock = getConfiguredAmplifyClient as jest.MockedFunction<typeof getConfiguredAmplifyClient>;
getConfiguredAmplifyClientMock.mockResolvedValue(amplifyClientStub);

const checkAmplifyServiceIAMPermissionMock = checkAmplifyServiceIAMPermission as jest.MockedFunction<
  typeof checkAmplifyServiceIAMPermission
>;
checkAmplifyServiceIAMPermissionMock.mockResolvedValue(true);

jest.spyOn(stateManager, 'teamProviderInfoExists').mockReturnValue(false);

describe('init', () => {
  it('throws ProjectInitError if Amplify app limit has been reached', async () => {
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
});
