import { ensureEnvParamManager, IEnvironmentParameterManager } from '@aws-amplify/amplify-environment-parameters';

export const cloneEnvParamManager = async (srcEnvName: string, destEnvName: string): Promise<void> => {
  const srcEnvParamManager: IEnvironmentParameterManager = (await ensureEnvParamManager(srcEnvName)).instance;
  srcEnvParamManager.cloneEnvParamsToNewEnvParamManager(destEnvName);
};
