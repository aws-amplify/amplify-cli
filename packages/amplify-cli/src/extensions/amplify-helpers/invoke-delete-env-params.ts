import { $TSContext } from 'amplify-cli-core';

export const invokeDeleteEnvParamsFromService = async (context: $TSContext, envName: string): Promise<void> => {
  const CloudFormationProviderName = 'awscloudformation';
  await context.amplify.invokePluginMethod(context, CloudFormationProviderName, undefined, 'deleteEnvironmentParametersFromService', [
    context,
    envName,
  ]);
};
