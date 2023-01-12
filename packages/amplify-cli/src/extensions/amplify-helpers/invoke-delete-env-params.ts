import { $TSContext } from 'amplify-cli-core';

export const invokeDeleteEnvParamsFromService = async (context: $TSContext, envName: string): Promise<void> => {
  const CloudFormationProviderName = 'awscloudformation';
  const deleteParametersFromService: (envName: string) => Promise<void> = await context.amplify.invokePluginMethod(
    context,
    CloudFormationProviderName,
    undefined,
    'getEnvParametersDeleteHandler',
    [context],
  );
  await deleteParametersFromService(envName);
};
