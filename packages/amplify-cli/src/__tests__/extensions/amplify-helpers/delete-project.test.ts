/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable @typescript-eslint/no-empty-function */
import { $TSAny } from 'amplify-cli-core';
import { printer, prompter } from 'amplify-prompts';
import { deleteProject, getConfirmation } from '../../../extensions/amplify-helpers/delete-project';

jest.mock('amplify-prompts');
const prompterMock = prompter as jest.Mocked<typeof prompter>;
const printerMock = printer as jest.Mocked<typeof printer>;
printerMock.success = jest.fn();

jest.mock('../../../extensions/amplify-helpers/remove-env-from-cloud');
jest.mock('../../../extensions/amplify-helpers/path-manager');
jest.mock('../../../../__mocks__/faked-plugin', () => ({
  deleteConfig: jest.fn(),
}));
jest.mock('amplify-cli-core', () => ({
  ...(jest.requireActual('amplify-cli-core') as $TSAny),
  toolkitExtensions: {
    getAmplifyAppId: jest.fn().mockReturnValue(true),
    getFrontendPlugins: jest.fn().mockReturnValue({ test: '../../../__mocks__/faked-plugin' }),
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
              // eslint-disable-next-line no-throw-literal
              throw {
                name: 'BucketNotFoundError',
                message: 'Bucket not found',
                link: 'https://docs.aws.amazon.com/',
              };
            }),
        }),
        deleteApp: jest.fn().mockReturnValue({
          promise: jest.fn().mockResolvedValue(true),
        }),
      }),
    }),
  },
  FeatureFlags: {
    isInitialized: jest.fn().mockReturnValue(true),
    removeFeatureFlagConfiguration: jest.fn().mockResolvedValue(true),
  },
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
