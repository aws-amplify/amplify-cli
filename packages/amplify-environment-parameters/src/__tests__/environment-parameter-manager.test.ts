import { pathManager, stateManager } from 'amplify-cli-core';
import { IEnvironmentParameterManager, saveAll } from '../environment-parameter-manager';

jest.mock('amplify-cli-core');
const stateManagerMock = stateManager as jest.Mocked<typeof stateManager>;
const testEnv = 'testEnv';
stateManagerMock.getLocalEnvInfo.mockReturnValue({ envName: testEnv });
const stubTPI = {
  testEnv: {
    categories: {
      function: {
        funcName: {
          envVar1: 'testValue1',
          envVar2: 'testValue2',
        },
      },
    },
  },
};
stateManagerMock.getTeamProviderInfo.mockReturnValue(stubTPI);
stateManagerMock.getBackendConfig.mockReturnValue({});
stateManagerMock.backendConfigFileExists.mockReturnValue(true);

const pathManagerMock = pathManager as jest.Mocked<typeof pathManager>;
pathManagerMock.findProjectRoot.mockReturnValue('test/project/root');

let ensureEnvParamManager: () => Promise<{ instance: IEnvironmentParameterManager }>;

beforeEach(() => {
  jest.clearAllMocks();
  jest.isolateModules(async () => {
    ({ ensureEnvParamManager } = await import('../environment-parameter-manager'));
  });
});

describe('init', () => {
  it('loads params and registers save on exit listener', async () => {
    await ensureEnvParamManager();
    await saveAll();
    expect(stateManagerMock.setTeamProviderInfo).toHaveBeenCalledWith(undefined, stubTPI);
  });
});

describe('setParam', () => {
  it('removes key when value is set to undefined', async () => {
    const envParamManager = (await ensureEnvParamManager()).instance;
    const testParamManager = envParamManager.getResourceParamManager('test', 'testing');
    testParamManager.setParam('something', 'a value');
    testParamManager.setParam('something', undefined as unknown as string);
    expect(testParamManager.getAllParams()).toEqual({});
    envParamManager.removeResourceParamManager('test', 'testing');
  });
});

describe('save', () => {
  it('stores resources with no params as empty object', async () => {
    const envParamManager = (await ensureEnvParamManager()).instance;
    const funcParamManager = envParamManager.getResourceParamManager('function', 'funcName');
    funcParamManager.deleteParam('envVar1');
    funcParamManager.deleteParam('envVar2');
    envParamManager.save();
    expect(stateManagerMock.setTeamProviderInfo).toHaveBeenCalledWith(undefined, {
      testEnv: {
        categories: {
          function: {
            funcName: {},
          },
        },
      },
    });
  });

  it('does not store empty categories', async () => {
    const envParamManager = (await ensureEnvParamManager()).instance;
    envParamManager.removeResourceParamManager('function', 'funcName');
    envParamManager.save();
    expect(stateManagerMock.setTeamProviderInfo).toHaveBeenCalledWith(undefined, {
      testEnv: {},
    });
  });

  it('calls IParameterMapController.save if in the current environment', async () => {
    const envParamManager = (await ensureEnvParamManager()).instance;
    const resourceParamManager = envParamManager.getResourceParamManager('function', 'funcName');
    resourceParamManager.setParam('testParam', 'testValue');
    envParamManager.save();
    expect(stateManagerMock.setBackendConfig.mock.calls[0][1]).toMatchInlineSnapshot(`
      Object {
        "parameters": Object {
          "AMPLIFY_function_funcName_testParam": Object {
            "usedBy": Array [
              Object {
                "category": "function",
                "resourceName": "funcName",
              },
            ],
          },
        },
      }
    `);
  });
});

describe('verifyExpectedEnvParameters', () => {
  it('does not throw when nothing is missing', async () => {
    const envParamManager = (await ensureEnvParamManager()).instance;
    envParamManager.save();
    await envParamManager.verifyExpectedEnvParameters();
  });

  it('throws when a parameter is missing', async () => {
    const envParamManager = (await ensureEnvParamManager()).instance;
    const funcParamManager = envParamManager.getResourceParamManager('function', 'funcName');

    funcParamManager.setParam('missingParam', 'missingValue');
    envParamManager.save();
    funcParamManager.deleteParam('missingParam');

    let error = undefined;
    try {
      await envParamManager.verifyExpectedEnvParameters();
    } catch (e) {
      error = e;
    }
    expect(error).toBeDefined();
  });

  it('does not throw when a parameter is missing on an ignored resource', async () => {
    const envParamManager = (await ensureEnvParamManager()).instance;
    const funcParamManager = envParamManager.getResourceParamManager('function', 'funcName');

    funcParamManager.setParam('missingParam', 'missingValue');
    envParamManager.save();
    funcParamManager.deleteParam('missingParam');

    let error = undefined;
    try {
      await envParamManager.verifyExpectedEnvParameters([{ category: 'auth', resourceName: 'mockAuth', service: 'Cognito' }]);
    } catch (e) {
      error = e;
    }
    expect(error).not.toBeDefined();
  });
});

describe('getMissingParameters', () => {
  it('returns an empty array when nothing is missing', async () => {
    const envParamManager = (await ensureEnvParamManager()).instance;
    envParamManager.save();
    expect(await envParamManager.getMissingParameters()).toEqual([]);
  });

  it('returns array of missing parameters', async () => {
    const envParamManager = (await ensureEnvParamManager()).instance;
    const funcParamManager = envParamManager.getResourceParamManager('function', 'funcName');

    funcParamManager.setParam('missingParam', 'missingValue');
    envParamManager.save();
    funcParamManager.deleteParam('missingParam');

    expect(await envParamManager.getMissingParameters()).toEqual([
      { categoryName: 'function', resourceName: 'funcName', parameterName: 'missingParam' },
    ]);
  });

  it('returns an empty array when a parameter is missing on an ignored resource', async () => {
    const envParamManager = (await ensureEnvParamManager()).instance;
    const funcParamManager = envParamManager.getResourceParamManager('function', 'funcName');

    funcParamManager.setParam('missingParam', 'missingValue');
    envParamManager.save();
    funcParamManager.deleteParam('missingParam');

    expect(await envParamManager.getMissingParameters([{ category: 'auth', resourceName: 'mockAuth', service: 'Cognito' }])).toEqual([]);
  });
});

describe('canBeClonedHeadlessly', () => {
  stateManagerMock.getRootStackId.mockReturnValue('mockRootStackId');

  it('returns true if no environment specific parameters are present', async () => {
    stateManagerMock.getDeploymentSecrets.mockReturnValue({ appSecrets: [{ rootStackId: 'mockRootStackId', environments: {} }] });
    const envParamManager = (await ensureEnvParamManager()).instance;
    expect(envParamManager.canBeClonedHeadlessly()).toEqual({ result: true });
  });

  it('returns true if only function parameters and secrets are present', async () => {
    stateManagerMock.getDeploymentSecrets.mockReturnValue({ appSecrets: [{ rootStackId: 'mockRootStackId', environments: {} }] });
    const envParamManager = (await ensureEnvParamManager()).instance;
    const funcParamManager = envParamManager.getResourceParamManager('function', 'funcName');
    funcParamManager.setParam('mockParam', 'mockValue');
    stateManagerMock.getDeploymentSecrets.mockReturnValue({
      appSecrets: [
        {
          rootStackId: 'mockRootStackId',
          environments: {
            testEnv: {
              function: {
                mockFunctionResource: {
                  fakeSecret: 'fakeSecretValue',
                },
              },
            },
          },
        },
      ],
    });
    expect(envParamManager.canBeClonedHeadlessly()).toEqual({ result: true });
  });

  it('returns false if environment specific parameters are present', async () => {
    stateManagerMock.getDeploymentSecrets.mockReturnValue({ appSecrets: [{ rootStackId: 'mockRootStackId', environments: {} }] });
    const envParamManager = (await ensureEnvParamManager()).instance;
    const authParamManager = envParamManager.getResourceParamManager('auth', 'authName');
    authParamManager.setParam('mockParam', 'mockValue');

    const reason = `The "testEnv" environment contains values that cannot be copied to the new environment directly.

The following resources contain parameters that could not be cloned:
 auth authName
 - mockParam

Re-run this command without the --yes flag to continue.`;

    expect(envParamManager.canBeClonedHeadlessly()).toEqual({ result: false, reason });
    authParamManager.deleteParam('mockParam');
  });

  it('returns false if environment specific secrets are present', async () => {
    stateManagerMock.getDeploymentSecrets.mockReturnValue({
      appSecrets: [
        {
          rootStackId: 'mockRootStackId',
          environments: {
            testEnv: {
              auth: {
                mockAuthResource: {
                  mockSecret: 'mockSecretValue',
                },
              },
            },
          },
        },
      ],
    });
    const envParamManager = (await ensureEnvParamManager()).instance;
    const reason = `The "testEnv" environment contains values that cannot be copied to the new environment directly.

The following resources contain secrets that could not be cloned:
 auth mockAuthResource
 - mockSecret

Re-run this command without the --yes flag to continue.`;
    expect(envParamManager.canBeClonedHeadlessly()).toEqual({ result: false, reason });
  });
});
