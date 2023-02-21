import * as path from 'path';
import { AmplifyError } from 'amplify-cli-core';
import { removeEnvFromCloud } from '../../../extensions/amplify-helpers/remove-env-from-cloud';
import * as pluginInfo from 'amplify-cli-core/lib/extensions/get-all-category-pluginInfos';

jest.mock('amplify-cli-core/lib/extensions/get-project-config', () => ({
  getProjectConfig: jest.fn().mockReturnValue({
    providers: ['awscloudformation'],
  }),
}));

jest.spyOn(pluginInfo, 'getAllCategoryPluginInfo').mockReturnValue({});

jest.mock('../../../extensions/amplify-helpers/get-provider-plugins', () => ({
  getProviderPlugins: jest.fn().mockReturnValue({
    awscloudformation: path.join(__dirname, '../../../../__mocks__/faked-plugin'),
  }),
}));

jest.mock('../../../execution-manager');

const deleteEnvMock = jest.fn();
const deletePinpointAppForEnvMock = jest.fn();

jest.mock('../../../../__mocks__/faked-plugin', () => ({
  deleteEnv: deleteEnvMock,
  deletePinpointAppForEnv: deletePinpointAppForEnvMock,
}));

const context = {
  print: {
    info: jest.fn(),
    error: jest.fn(),
  },
};
const envName = 'test';

describe('remove-env-from-cloud', () => {
  it('invoke deleteEnv method in provider plugin', async () => {
    await removeEnvFromCloud(context, envName, false);

    expect(deleteEnvMock).toBeCalledWith(context, envName, false);
  });

  it('invoke deletePinpointAppForEnv method in notificationsModule', async () => {
    jest.spyOn(pluginInfo, 'getAllCategoryPluginInfo').mockReturnValue({
      notifications: [
        {
          packageLocation: path.join(__dirname, '../../../../__mocks__/faked-plugin'),
        },
      ],
    });

    await removeEnvFromCloud(context, envName, false);

    expect(deletePinpointAppForEnvMock).toBeCalledWith(context, envName);
  });

  it('throws error when deleteEnv promise rejected', async () => {
    deleteEnvMock.mockRejectedValue(new Error('a generic deleteEnv error'));

    await expect(removeEnvFromCloud(context, envName, false)).rejects.toThrow(`Error occurred while deleting env: ${envName}.`);
  });

  it('does not throw bucket not found error when deleteEnv promise rejected', async () => {
    const e: any = new AmplifyError('BucketNotFoundError', {
      message: 'Project deployment bucket has not been created yet.',
      resolution: 'Use amplify init to initialize the project.',
    });
    deleteEnvMock.mockRejectedValue(e);

    await expect(removeEnvFromCloud(context, envName, false)).resolves.not.toThrow(`Error occurred while deleting env: ${envName}.`);
  });
});
