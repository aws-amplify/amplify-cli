import { ensureEnvParamManager, IEnvironmentParameterManager } from '../environment-parameter-manager';
import * as environmentParameterManager from '../environment-parameter-manager';
import { cloneEnvParamManager } from '../clone-env-param-manager';

describe('clone env params test', () => {
  const mockEnvParamManagerCloneFn = jest.fn().mockReturnValue(Promise.resolve());
  const envParamManager = {
    instance: {
      cloneEnvParamsToNewEnvParamManager: mockEnvParamManagerCloneFn,
      downloadParameters: jest.fn(),
      getMissingParameters: jest.fn(),
      getResourceParamManager: jest.fn(),
      hasResourceParamManager: jest.fn(),
      init: jest.fn(),
      removeResourceParamManager: jest.fn(),
      save: jest.fn(),
      verifyExpectedEnvParameters: jest.fn(),
    } as IEnvironmentParameterManager,
  };

  jest.spyOn(environmentParameterManager, 'ensureEnvParamManager').mockReturnValue(Promise.resolve(envParamManager));

  it('check if func is called', async () => {
    const envParamManagerA: IEnvironmentParameterManager = (await ensureEnvParamManager('enva')).instance;
    await cloneEnvParamManager(envParamManagerA, 'envB');
    expect(ensureEnvParamManager).toBeCalledTimes(2);
    expect(mockEnvParamManagerCloneFn).toBeCalledTimes(1);
  });
});
