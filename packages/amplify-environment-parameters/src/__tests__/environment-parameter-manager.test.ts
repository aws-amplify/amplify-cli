/* eslint-disable spellcheck/spell-checker */
import { pathManager, stateManager } from 'amplify-cli-core';
import { IEnvironmentParameterManager } from '../environment-parameter-manager';

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
    // eslint-disable-next-line @typescript-eslint/ban-types
    const processEventListeners: Record<string | symbol, Function[]> = {};
    jest.spyOn(process, 'on').mockImplementation((event, func) => {
      if (Array.isArray(processEventListeners[event])) {
        processEventListeners[event].push(func);
      } else {
        processEventListeners[event] = [func];
      }
      return process;
    });
    await ensureEnvParamManager();
    // it's important that the save callback is registered on exit instead of beforeExit
    // because if save fails, beforeExit will be called again
    processEventListeners.exit.forEach(fn => fn(0));
    expect(stateManagerMock.setTeamProviderInfo).toHaveBeenCalledWith(undefined, stubTPI);
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
          "AMPLIFY_funcName_testParam": Object {
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
