import { ensureEnvParamManager, ServiceDownloadHandler } from '@aws-amplify/amplify-environment-parameters';
import { $TSContext, constants, stateManager } from 'amplify-cli-core';

export const downloadEnvParameters = async (context: $TSContext) => {
  const envParamManager = (await ensureEnvParamManager()).instance;
  const { providers } = stateManager.getProjectConfig(undefined, { throwIfNotExist: false, default: {} });
  const CloudFormationProviderName = constants.DEFAULT_PROVIDER;
  if (Array.isArray(providers) && providers.find((value) => value === CloudFormationProviderName)) {
    const downloadHandler: ServiceDownloadHandler = await context.amplify.invokePluginMethod(
      context,
      CloudFormationProviderName,
      undefined,
      'getEnvParametersDownloadHandler',
      [context],
    );
    await envParamManager.downloadParameters(downloadHandler);
  }
};
