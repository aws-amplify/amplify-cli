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
        promise: jest
          .fn()
          .mockImplementationOnce(() => ({
            backendEnvironments: [],
          }))
          .mockImplementationOnce(() => {
            throw new Error('listBackendEnvironments error');
          })
          .mockImplementationOnce(() => {
            const e: any = new Error('listBackendEnvironments error');
            e.code = 'NotFoundException';
            throw e;
          }),
      }),
      deleteApp: jest.fn().mockReturnValue({
        promise: jest.fn().mockResolvedValue(true),
      }),
    }),
  }),
}));

jest.mock('ora', () => () => ({
  start: jest.fn(),
  fail: jest.fn(),
  succeed: jest.fn(),
}));

describe('getConfirmation', () => {
  it('should return proceed object', async () => {
    const contextStub = {
      input: {},
      amplify: {
        confirmPrompt: () => { /* noop */ },
      },
    };
    const result = await getConfirmation(contextStub);
    expect(result).toHaveProperty('proceed');
    expect(result).toHaveProperty('deleteS3');
    expect(result).toHaveProperty('deleteAmplifyApp');
  });
  it('should return object when force option is true', async () => {
    const contextStub = {
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
    const result = await getConfirmation(contextStub);
    expect(result).toStrictEqual(expected);
  });
});

describe('deleteProject', () => {
  const success = jest.fn();
  const contextStub = {
    input: {
      options: {
        force: true,
      },
    },
    amplify: {
      getProjectConfig: () => ({ frontend: 'test' }),
    },
    filesystem: {
      remove: jest.fn(),
    },
    print: {
      success,
    },
  };
  it('should delete app', async () => {
    await deleteProject(contextStub);
    expect(success).toBeCalled();
  });

  it('throws error when listBackendEnvironments promise rejected', async () => {
    await expect(deleteProject(contextStub)).rejects.toThrow('listBackendEnvironments error');
  });

  it('does not throw not found error when listBackendEnvironments promise rejected', async () => {
    await expect(deleteProject(contextStub)).resolves.not.toThrow('listBackendEnvironments error');
  });
});
