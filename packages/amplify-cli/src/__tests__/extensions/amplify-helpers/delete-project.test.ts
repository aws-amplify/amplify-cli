import { deleteProject, getConfirmation } from '../../../extensions/amplify-helpers/delete-project';

jest.mock('../../../extensions/amplify-helpers/remove-env-from-cloud');
jest.mock('../../../extensions/amplify-helpers/path-manager');
jest.mock('../../../extensions/amplify-helpers/get-amplify-appId', () => ({
  getAmplifyAppId: jest.fn().mockReturnValue(true),
}));
jest.mock('../../../extensions/amplify-helpers/get-frontend-plugins', () => ({
  getFrontendPlugins: jest.fn().mockReturnValue({ test: '../../../__mocks__/faked-plugin' }),
}));
jest.mock('../../../../__mocks__/faked-plugin', () => ({
  deleteConfig: jest.fn(),
}));
jest.mock('amplify-cli-core', () => ({
  FeatureFlags: {
    isInitialized: jest.fn().mockReturnValue(true),
    removeFeatureFlagConfiguration: jest.fn().mockResolvedValue(true),
  },
}));
jest.mock('../../../extensions/amplify-helpers/get-plugin-instance', () => ({
  getPluginInstance: jest.fn().mockReturnValue({
    getConfiguredAmplifyClient: jest.fn().mockResolvedValue({
      listBackendEnvironments: jest.fn().mockReturnValue({
        promise: jest.fn().mockResolvedValue({
          backendEnvironments: [],
        }),
      }),
      deleteApp: jest.fn().mockReturnValue({
        promise: jest.fn().mockResolvedValue(true),
      }),
    }),
  }),
}));

jest.mock('ora', () => {
  return () => ({
    start: jest.fn(),
    fail: jest.fn(),
    succeed: jest.fn(),
  });
});

describe('getConfirmation', () => {
  it('should return proceed object', async () => {
    const context_stub = {
      input: {},
      amplify: {
        confirmPrompt: () => {},
      },
    };
    const result = await getConfirmation(context_stub);
    expect(result).toHaveProperty('proceed');
    expect(result).toHaveProperty('deleteS3');
    expect(result).toHaveProperty('deleteAmplifyApp');
  });
  it('should return object when force option is true', async () => {
    const context_stub = {
      input: {
        options: {
          force: true,
        },
      },
    };
    const expected = {
      proceed: true,
      deleteS3: true,
      deleteAmplifyApp: true,
    };
    const result = await getConfirmation(context_stub);
    expect(result).toStrictEqual(expected);
  });
});

describe('deleteProject', () => {
  it('should delete app', async () => {
    const success = jest.fn();
    const context_stub = {
      input: {
        options: {
          force: true,
        },
      },
      amplify: {
        getEnvDetails: () => [],
        getProjectConfig: () => ({ frontend: 'test' }),
      },
      filesystem: {
        remove: jest.fn(),
      },
      print: {
        success,
      },
    };
    await deleteProject(context_stub);
    expect(success).toBeCalled();
  });
});
