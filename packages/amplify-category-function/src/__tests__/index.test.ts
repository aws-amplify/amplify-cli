import sequential from 'promise-sequential';
import { stateManager } from 'amplify-cli-core';
import { initEnv, isMockable } from '..';
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

const getLocalFunctionSecretNamesMock = getLocalFunctionSecretNames as jest.MockedFunction<typeof getLocalFunctionSecretNames>;
getLocalFunctionSecretNamesMock.mockReturnValue([]);
const getAppIdMock = getAppId as jest.MockedFunction<typeof getAppId>;

const sequentialMock = sequential as jest.MockedFunction<typeof sequential>;
const stateManagerMock = stateManager as jest.Mocked<typeof stateManager>;

describe('function category provider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('initialize environment', () => {
    it('sets secretsPathAmplifyAppId in team-provider-info if function has secrets configured', async () => {
      stateManagerMock.getTeamProviderInfo.mockReturnValueOnce({});
      getLocalFunctionSecretNamesMock.mockReturnValueOnce(['TEST_SECRET']);
      getAppIdMock.mockReturnValueOnce('testAppId');
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
      } as any;
      await initEnv(contextStub);
      expect(stateManagerMock.setTeamProviderInfo).toBeCalledTimes(1);
      expect(stateManagerMock.setTeamProviderInfo.mock.calls[0][1]).toMatchObject({
        dev: {
          categories: {
            function: {
              testFunction: {
                [secretsPathAmplifyAppIdKey]: 'testAppId',
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
          resourceName: 'doNotIncludeMe',
        },
      ];
      const resourcesToBeDeleted = [
        {
          category: 'something',
          resourceName: 'doNotDeleteMe',
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
      } as any;
      await initEnv(contextStub);
      expect(contextStub.amplify.removeResourceParameters.mock.calls.length).toBe(1);
      expect(contextStub.amplify.getEnvInfo.mock.calls.length).toBe(1);
      expect(sequentialMock.mock.calls.length).toBe(1);
      expect(sequentialMock.mock.calls[0][0].length).toBe(2);
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
                  resourceName: 'demoFunction',
                },
                {
                  category: 'function',
                  resourceName: 'demoLayer',
                },
              ],
            },
            demoFunction: {
              build: true,
              providerPlugin: 'awscloudformation',
              service: 'Lambda',
              dependsOn: [],
            },
            demoLayer: {
              build: true,
              providerPlugin: 'awscloudformation',
              service: 'LambdaLayer',
              dependsOn: [],
            },
          },
        }),
      },
    } as any;
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
                  resourceName: 'demoFunction',
                },
                {
                  category: 'function',
                  resourceName: 'demoLayer',
                },
              ],
            },
            demoFunction: {
              build: true,
              providerPlugin: 'awscloudformation',
              service: 'Lambda',
              dependsOn: [],
            },
            demoLayer: {
              build: true,
              providerPlugin: 'awscloudformation',
              service: 'Lambda',
              dependsOn: [],
            },
          },
        }),
      },
    } as any;
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
    } as any;
    const resourceName = 'issue4992d7983625';
    expect(isMockable(contextStub, resourceName)).toMatchSnapshot();
  });
});
