import { $TSContext, constants } from 'amplify-cli-core';

export const invokeDeleteEnvParamsFromService = async (context: $TSContext, envName: string): Promise<void> => {
  const CloudFormationProviderName = constants.DEFAULT_PROVIDER;
  await context.amplify.invokePluginMethod(context, CloudFormationProviderName, undefined, 'deleteEnvironmentParametersFromService', [
    context,
    envName,
  ]);
};
