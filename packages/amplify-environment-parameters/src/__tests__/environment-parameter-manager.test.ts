/* eslint-disable spellcheck/spell-checker */
import { pathManager, stateManager } from 'amplify-cli-core';
import { ensureEnvParamManager } from '../environment-parameter-manager';

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

describe('init', () => {
  it('loads params and registers save on exit listener', async () => {
    await ensureEnvParamManager();
    process.listeners('beforeExit').forEach(fn => fn(0));
    expect(stateManagerMock.setTeamProviderInfo).toHaveBeenCalledWith(undefined, stubTPI);
  });
});
