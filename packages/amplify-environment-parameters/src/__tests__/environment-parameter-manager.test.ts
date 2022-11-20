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

const pathManagerMock = pathManager as jest.Mocked<typeof pathManager>;
pathManagerMock.findProjectRoot.mockReturnValue('test/project/root');

let ensureEnvParamManager: () => Promise<{instance: IEnvironmentParameterManager}>;

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
});
