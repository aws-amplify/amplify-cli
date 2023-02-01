import { ensureEnvParamManager, IEnvironmentParameterManager } from '@aws-amplify/amplify-environment-parameters';
import * as amplifyEnvironmentParameters from '@aws-amplify/amplify-environment-parameters';
import { cloneEnvParamManager } from '../../utils/clone-env-param-manager';

jest.mock('@aws-amplify/amplify-environment-parameters');

describe('clone env params test', () => {
  const mockEnvParamManagerCloneFn = jest.fn().mockReturnValue(Promise.resolve());
  const envPeramManagerA = {
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

  jest.spyOn(amplifyEnvironmentParameters, 'ensureEnvParamManager').mockReturnValue(Promise.resolve(envPeramManagerA));

  it('check if func is called', async () => {
    await cloneEnvParamManager('envA', 'envB');
    expect(ensureEnvParamManager).toBeCalledTimes(1);
    expect(mockEnvParamManagerCloneFn).toBeCalledTimes(1);
  });
});
