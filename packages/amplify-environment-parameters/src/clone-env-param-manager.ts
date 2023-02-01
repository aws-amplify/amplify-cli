import { ensureEnvParamManager, IEnvironmentParameterManager } from './environment-parameter-manager';

export const cloneEnvParamManager = async (srcEnvName: string, destEnvName: string): Promise<void> => {
  const srcEnvParamManager: IEnvironmentParameterManager = (await ensureEnvParamManager(srcEnvName)).instance;
  await srcEnvParamManager.cloneEnvParamsToNewEnvParamManager(destEnvName);
};
