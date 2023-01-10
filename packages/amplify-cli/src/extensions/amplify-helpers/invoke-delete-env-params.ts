import { $TSContext } from 'amplify-cli-core';
import { IEnvironmentParameterManager, ensureEnvParamManager } from '@aws-amplify/amplify-environment-parameters';

export async function invokeDeleteEnvParamsFromService(context: $TSContext, envName: string): Promise<void> {
  const CloudFormationProviderName = 'awscloudformation';
  const deleteParametersFromService: (
    envName: string,
    keys: Array<string>,
  ) => Promise<void> = await context.amplify.invokePluginMethod(
    context,
    CloudFormationProviderName,
    undefined,
    'getEnvParametersDeleteHandler',
    [context],
  );
  const envParamManager: IEnvironmentParameterManager = (await ensureEnvParamManager(envName)).instance;
  await envParamManager.deleteAllEnvParametersFromService(envName, deleteParametersFromService);
}
