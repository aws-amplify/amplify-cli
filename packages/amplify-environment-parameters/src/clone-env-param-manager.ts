import { IEnvironmentParameterManager, ensureEnvParamManager } from './environment-parameter-manager';

export const cloneEnvParamManager = async (srcEnvParamManager: IEnvironmentParameterManager, destEnvName: string): Promise<void> => {
  const destManager = (await ensureEnvParamManager(destEnvName)).instance;
  await srcEnvParamManager.cloneEnvParamsToNewEnvParamManager(destManager);
};
