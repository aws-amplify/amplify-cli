import {
  ensureEnvParamManager,
  IEnvironmentParameterManager,
  cloneEnvParamsToNewEnvParamManager,
} from '@aws-amplify/amplify-environment-parameters';

export const cloneEnvParamManager = async (srcEnvName: string, destEnvName: string): Promise<void> => {
  const srcEnvParamManager: IEnvironmentParameterManager = (await ensureEnvParamManager(srcEnvName)).instance;
  const destEnvParamManager: IEnvironmentParameterManager = (await ensureEnvParamManager(destEnvName)).instance;
  cloneEnvParamsToNewEnvParamManager(srcEnvParamManager, destEnvParamManager);
};
