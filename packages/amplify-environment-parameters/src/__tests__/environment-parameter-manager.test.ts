/* eslint-disable spellcheck/spell-checker */
import { pathManager, stateManager } from 'amplify-cli-core';
import { IEnvironmentParameterManager } from '../types';
import { getProcessEventSpy } from './utils/process-event-spy';

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
  // isolateModules does not work with async import()
  jest.isolateModules(() => {
    // eslint-disable-next-line global-require
    ({ ensureEnvParamManager } = require('../environment-parameter-manager'));
  });
});

describe('init', () => {
  it('loads params and registers save on exit listener', async () => {
    const executeProcessEvents = getProcessEventSpy();
    await ensureEnvParamManager();
    // it's important that the save callback is registered on exit instead of beforeExit
    // because if save fails, beforeExit will be called again
    executeProcessEvents('exit');
    expect(stateManagerMock.setTeamProviderInfo).toHaveBeenCalledWith(undefined, stubTPI);
  });
});

describe('save', () => {
  it('stores resources with no params as empty object', async () => {
    const executeProcessEvents = getProcessEventSpy();
    const envParamManager = (await ensureEnvParamManager()).instance;
    const funcParamManager = envParamManager.getResourceParamManager('function', 'funcName');
    funcParamManager.deleteParam('envVar1');
    funcParamManager.deleteParam('envVar2');
    executeProcessEvents('exit');
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
    const executeProcessEvents = getProcessEventSpy();
    const envParamManager = (await ensureEnvParamManager()).instance;
    envParamManager.removeResourceParamManager('function', 'funcName');
    executeProcessEvents('exit');
    expect(stateManagerMock.setTeamProviderInfo).toHaveBeenCalledWith(undefined, {
      testEnv: {},
    });
  });
});
