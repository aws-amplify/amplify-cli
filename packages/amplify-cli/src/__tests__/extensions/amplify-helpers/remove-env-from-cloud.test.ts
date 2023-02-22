import * as path from 'path';
import { removeEnvFromCloud } from '../../../extensions/amplify-helpers/remove-env-from-cloud';
import { AmplifyError, getProjectConfig, getAllCategoryPluginInfo } from 'amplify-cli-core';

jest.mock('amplify-cli-core', () => ({
  ...jest.requireActual('amplify-cli-core'),
  getProjectConfig: jest.fn(),
  getAllCategoryPluginInfo: jest.fn(),
  getProviderPlugins: jest.fn().mockReturnValue({
    awscloudformation: path.join(__dirname, '../../../../__mocks__/faked-plugin'),
  }),
}));

(getAllCategoryPluginInfo as jest.Mocked<any>).mockReturnValue({});
(getProjectConfig as jest.Mocked<any>).mockReturnValue({ providers: ['awscloudformation'] });

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
    (getAllCategoryPluginInfo as jest.Mocked<any>).mockReturnValue({
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
