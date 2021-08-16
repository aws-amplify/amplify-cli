import { getProjectConfig } from './get-project-config';
import { getResourceStatus } from './resource-status';
import { getProviderPlugins } from './get-provider-plugins';
import { $TSContext } from 'amplify-cli-core';

export async function showHelpfulProviderLinks(context: $TSContext) {
  const { providers } = getProjectConfig();
  const providerPlugins = getProviderPlugins(context);
  const providerPromises: (() => Promise<any>)[] = [];

  const { allResources } = await getResourceStatus();

  providers.forEach(providerName => {
    const pluginModule = require(providerPlugins[providerName]);
    providerPromises.push(pluginModule.showHelpfulLinks(context, allResources));
  });

  return Promise.all(providerPromises);
}
