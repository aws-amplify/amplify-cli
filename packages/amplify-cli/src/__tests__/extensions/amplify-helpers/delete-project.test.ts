/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable @typescript-eslint/no-empty-function */
import { $TSAny } from '@aws-amplify/amplify-cli-core';
import { printer, prompter } from '@aws-amplify/amplify-prompts';
import { deleteProject, getConfirmation } from '../../../extensions/amplify-helpers/delete-project';

jest.mock('@aws-amplify/amplify-prompts');
const prompterMock = prompter as jest.Mocked<typeof prompter>;
const printerMock = printer as jest.Mocked<typeof printer>;
printerMock.success = jest.fn();

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
jest.mock('@aws-amplify/amplify-cli-core', () => ({
  ...(jest.requireActual('@aws-amplify/amplify-cli-core') as $TSAny),
  FeatureFlags: {
    isInitialized: jest.fn().mockReturnValue(true),
    removeFeatureFlagConfiguration: jest.fn().mockResolvedValue(true),
  },
}));

jest.mock('../../../extensions/amplify-helpers/get-plugin-instance', () => ({
  getPluginInstance: jest.fn().mockReturnValue({
    getConfiguredAmplifyClient: jest.fn().mockResolvedValue({
      send: jest
        .fn()
        // first ListBackendEnv Call
        .mockImplementationOnce(() =>
          Promise.resolve({
            backendEnvironments: [],
          }),
        )
        // DeleteApp call
        .mockImplementationOnce(() => Promise.resolve(true))
        // second ListBackendEnv Call
        .mockImplementationOnce(() => {
          throw new Error('listBackendEnvironments error');
        })
        // third ListBackendEnv Call
        .mockImplementationOnce(() => {
          // eslint-disable-next-line no-throw-literal
          throw {
            name: 'BucketNotFoundError',
            message: 'Bucket not found',
            link: 'https://docs.aws.amazon.com/',
          };
        }),
    }),
  }),
}));

describe('getConfirmation', () => {
  it('should return proceed object', async () => {
    const contextStub: $TSAny = {
      input: {},
      amplify: {},
    };
    prompterMock.yesOrNo = jest.fn();
    const result = await getConfirmation(contextStub);
    expect(result).toHaveProperty('proceed');
    expect(result).toHaveProperty('deleteS3');
    expect(result).toHaveProperty('deleteAmplifyApp');
  });
  it('should return object when force option is true', async () => {
    const contextStub: $TSAny = {
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
  const contextStub: $TSAny = {
    input: {
      options: {
        force: true,
      },
    },
    amplify: {
      getEnvDetails: () => [],
      getProjectConfig: () => ({ frontend: 'test' }),
      invokePluginMethod: async () => {},
    },
    filesystem: {
      remove: jest.fn(),
    },
  };
  it('should delete app', async () => {
    await deleteProject(contextStub);
    expect(printerMock.success).toBeCalled();
  });

  it('throws error when listBackendEnvironments promise rejected', async () => {
    await expect(deleteProject(contextStub)).rejects.toThrow('Project delete failed.');
  });

  it('does not throw not found error when listBackendEnvironments promise rejected', async () => {
    await expect(deleteProject(contextStub)).resolves.not.toThrow('listBackendEnvironments error');
  });
});
