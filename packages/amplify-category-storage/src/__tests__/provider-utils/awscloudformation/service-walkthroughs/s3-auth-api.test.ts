import { $TSContext } from 'amplify-cli-core';
import { checkStorageAuthenticationRequirements } from '../../../../provider-utils/awscloudformation/service-walkthroughs/s3-auth-api';

describe('checkStorageAuthenticationRequirements', () => {
  const invokePluginMethodMock = jest.fn();
  const contextStub = {
    amplify: {
      invokePluginMethod: invokePluginMethodMock,
    },
  } as unknown as $TSContext;
  it('throws AmplifyError if imported auth misconfigured', async () => {
    invokePluginMethodMock.mockResolvedValue({
      authImported: true,
      errors: ['test error'],
    });
    await expect(checkStorageAuthenticationRequirements(contextStub, 'testStorageName', true)).rejects.toThrowErrorMatchingInlineSnapshot(
      `"The imported auth config is not compatible with the specified storage config"`,
    );
  });
});
