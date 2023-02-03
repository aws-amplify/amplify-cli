import { ensureEnvParamManager, IEnvironmentParameterManager } from '../environment-parameter-manager';
import * as environmentParameterManager from '../environment-parameter-manager';
import { cloneEnvParamManager } from '../clone-env-param-manager';

describe('clone env params test', () => {
  const mockEnvParamManagerCloneFn = jest.fn().mockReturnValue(Promise.resolve());
  const envParamManager = {
    instance: {
      cloneEnvParamsToNewEnvParamManager: mockEnvParamManagerCloneFn,
      init: jest.fn(),
      removeResourceParamManager: jest.fn(),
      hasResourceParamManager: jest.fn(),
      getResourceParamManagerResourceKeys: jest.fn(),
      getResourceParamManager: jest.fn(),
      save: jest.fn(),
    } as IEnvironmentParameterManager,
  };

  jest.spyOn(environmentParameterManager, 'ensureEnvParamManager').mockReturnValue(Promise.resolve(envParamManager));

  it('check if func is called', async () => {
    const envParamManagerA: IEnvironmentParameterManager = (await ensureEnvParamManager('enva')).instance;
    await cloneEnvParamManager(envParamManagerA, 'envB');
    expect(ensureEnvParamManager).toBeCalledTimes(1);
    expect(mockEnvParamManagerCloneFn).toBeCalledTimes(1);
  });
});
