import { $TSContext } from 'amplify-cli-core';
import { constants } from '../../domain/constants';

export const invokeDeleteEnvParamsFromService = async (context: $TSContext, envName: string): Promise<void> => {
  const CloudFormationProviderName = constants.DEFAULT_PROVIDER;
  await context.amplify.invokePluginMethod(context, CloudFormationProviderName, undefined, 'deleteEnvironmentParametersFromService', [
    context,
    envName,
  ]);
};
