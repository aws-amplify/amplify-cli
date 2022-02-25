import { initEnv, isMockable } from '..';
import sequential from 'promise-sequential';
import { stateManager } from 'amplify-cli-core';
import { getLocalFunctionSecretNames } from '../provider-utils/awscloudformation/secrets/functionSecretsStateManager';
import { getAppId, secretsPathAmplifyAppIdKey } from '../provider-utils/awscloudformation/secrets/secretName';

jest.mock('promise-sequential');
jest.mock('amplify-cli-core', () => ({
  stateManager: {
    getCurrentMeta: jest.fn(),
    getMeta: jest.fn(),
    getTeamProviderInfo: jest.fn(),
    setMeta: jest.fn(),
    setTeamProviderInfo: jest.fn(),
  },
  pathManager: {
    findProjectRoot: jest.fn(),
  },
}));

jest.mock('../provider-utils/awscloudformation/secrets/functionSecretsStateManager');
jest.mock('../provider-utils/awscloudformation/secrets/secretName');

const getLocalFunctionSecretNames_mock = getLocalFunctionSecretNames as jest.MockedFunction<typeof getLocalFunctionSecretNames>;
getLocalFunctionSecretNames_mock.mockReturnValue([]);
const getAppId_mock = getAppId as jest.MockedFunction<typeof getAppId>;

const sequential_mock = sequential as jest.MockedFunction<typeof sequential>;
const stateManager_mock = stateManager as jest.Mocked<typeof stateManager>;

describe('function category provider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('initialize environment', () => {
    it('sets secretsPathAmplfiyAppId in team-provider-info if function has secrets configured', async () => {
      stateManager_mock.getTeamProviderInfo.mockReturnValueOnce({});
      getLocalFunctionSecretNames_mock.mockReturnValueOnce(['TEST_SECRET']);
      getAppId_mock.mockReturnValueOnce('testappid');
      const contextStub = {
        amplify: {
          removeResourceParameters: jest.fn(),
          getEnvInfo: jest.fn().mockReturnValue({ envName: 'dev' }),
          getResourceStatus: () => ({
            allResources: [
              {
                category: 'function',
                resourceName: 'testFunction',
              },
            ],
            resourcesToBeCreated: [],
            resourcesToBeDeleted: [],
            resourcesToBeUpdated: [],
          }),
        },
      };
      await initEnv(contextStub);
      expect(stateManager_mock.setTeamProviderInfo).toBeCalledTimes(1);
      expect(stateManager_mock.setTeamProviderInfo.mock.calls[0][1]).toMatchObject({
        dev: {
          categories: {
            function: {
              testFunction: {
                [secretsPathAmplifyAppIdKey]: 'testappid',
              },
            },
          },
        },
      });
    });

    it('only initializes function category resources', async () => {
      const resourcesToBeCreated = [
        {
          category: 'function',
          resourceName: 'someResource',
        },
        {
          category: 'other',
          resourceName: 'dontIncludeMe',
        },
      ];
      const resourcesToBeDeleted = [
        {
          category: 'something',
          resourceName: 'dontDeleteMe',
        },
        {
          category: 'function',
          resourceName: 'doDeleteThis',
        },
      ];
      const resourcesToBeUpdated = [
        {
          category: 'function',
          resourceName: 'updateMe',
        },
        {
          category: 'different',
          resourceName: 'leaveThisOut',
        },
      ];

      const contextStub = {
        amplify: {
          removeResourceParameters: jest.fn(),
          getEnvInfo: jest.fn().mockReturnValue({ envName: 'dev' }),
          getResourceStatus: () => ({
            allResources: [...resourcesToBeCreated, ...resourcesToBeDeleted, ...resourcesToBeUpdated],
            resourcesToBeCreated,
            resourcesToBeDeleted,
            resourcesToBeUpdated,
          }),
        },
      };
      await initEnv(contextStub);
      expect(contextStub.amplify.removeResourceParameters.mock.calls.length).toBe(1);
      expect(contextStub.amplify.getEnvInfo.mock.calls.length).toBe(1);
      expect(sequential_mock.mock.calls.length).toBe(1);
      expect(sequential_mock.mock.calls[0][0].length).toBe(2);
    });
  });
});

describe('mock function', () => {
  it('mock function with layers', async () => {
    const contextStub = {
      amplify: {
        getProjectMeta: () => ({
          function: {
            issue4992d7983625: {
              build: true,
              providerPlugin: 'awscloudformation',
              service: 'Lambda',
              dependsOn: [
                {
                  category: 'function',
                  resourceName: 'demofunction',
                },
                {
                  category: 'function',
                  resourceName: 'demolayer',
                },
              ],
            },
            demofunction: {
              build: true,
              providerPlugin: 'awscloudformation',
              service: 'Lambda',
              dependsOn: [],
            },
            demolayer: {
              build: true,
              providerPlugin: 'awscloudformation',
              service: 'LambdaLayer',
              dependsOn: [],
            },
          },
        }),
      },
    };
    const resourceName = 'issue4992d7983625';
    expect(isMockable(contextStub, resourceName)).toMatchSnapshot();
  });

  it('mock function with functions', async () => {
    const contextStub = {
      amplify: {
        getProjectMeta: () => ({
          function: {
            issue4992d7983625: {
              build: true,
              providerPlugin: 'awscloudformation',
              service: 'Lambda',
              dependsOn: [
                {
                  category: 'function',
                  resourceName: 'demofunction',
                },
                {
                  category: 'function',
                  resourceName: 'demolayer',
                },
              ],
            },
            demofunction: {
              build: true,
              providerPlugin: 'awscloudformation',
              service: 'Lambda',
              dependsOn: [],
            },
            demolayer: {
              build: true,
              providerPlugin: 'awscloudformation',
              service: 'Lambda',
              dependsOn: [],
            },
          },
        }),
      },
    };
    const resourceName = 'issue4992d7983625';
    expect(isMockable(contextStub, resourceName)).toMatchSnapshot();
  });

  it('mock function with empty dependsOn', async () => {
    const contextStub = {
      amplify: {
        getProjectMeta: () => ({
          function: {
            issue4992d7983625: {
              build: true,
              providerPlugin: 'awscloudformation',
              service: 'Lambda',
            },
          },
        }),
      },
    };
    const resourceName = 'issue4992d7983625';
    expect(isMockable(contextStub, resourceName)).toMatchSnapshot();
  });
});
