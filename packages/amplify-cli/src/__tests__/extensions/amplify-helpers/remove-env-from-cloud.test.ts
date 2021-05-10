import * as path from 'path';
import { removeEnvFromCloud } from '../../../extensions/amplify-helpers/remove-env-from-cloud';
import { getAllCategoryPluginInfo } from '../../../extensions/amplify-helpers/get-all-category-pluginInfos';

jest.mock('../../../extensions/amplify-helpers/get-project-config', () => ({
  getProjectConfig: jest.fn().mockReturnValue({
    providers: ['awscloudformation'],
  }),
}));

jest.mock('../../../extensions/amplify-helpers/get-all-category-pluginInfos', () => ({
  getAllCategoryPluginInfo: jest.fn().mockReturnValue({}),
}));

jest.mock('../../../extensions/amplify-helpers/get-provider-plugins', () => ({
  getProviderPlugins: jest.fn().mockReturnValue({
    awscloudformation: path.join(__dirname, '../../../../__mocks__/faked-plugin'),
  }),
}));

const getAllCategoryPluginInfoMock = getAllCategoryPluginInfo as jest.MockedFunction<typeof getAllCategoryPluginInfo>;
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

describe('remove-env-from-cloud', () => {
  it('invoke deleteEnv method in provider plugin', async () => {
    await removeEnvFromCloud(context, 'test', false);

    expect(deleteEnvMock).toBeCalledWith(context, 'test', false);
  });

  it('invoke deletePinpointAppForEnv method in notificationsModule', async () => {
    getAllCategoryPluginInfoMock.mockReturnValue({
      notifications: [
        {
          packageLocation: path.join(__dirname, '../../../../__mocks__/faked-plugin'),
        },
      ],
    });

    await removeEnvFromCloud(context, 'test', false);

    expect(deletePinpointAppForEnvMock).toBeCalledWith(context, 'test');
  });

  it('throws error when deleteEnv promise rejected', async () => {
    deleteEnvMock.mockRejectedValue(new Error('deleteEnv error'));

    await expect(removeEnvFromCloud(context, 'test', false)).rejects.toThrow('deleteEnv error');
  });
});
