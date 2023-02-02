import { IEnvironmentParameterManager } from './environment-parameter-manager';

export const cloneEnvParamManager = async (srcEnvParamManager: IEnvironmentParameterManager, destEnvName: string): Promise<void> => {
  await srcEnvParamManager.cloneEnvParamsToNewEnvParamManager(destEnvName);
};
