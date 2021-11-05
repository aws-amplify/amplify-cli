import { $TSAny, $TSContext } from 'amplify-cli-core';
import { getProviderPlugins } from './get-provider-plugins';

export async function executeProviderUtils(context: $TSContext, providerName: string, utilName: string, options: $TSAny) {
  const providerPlugins = getProviderPlugins(context);
  const pluginModule = require(providerPlugins[providerName]);
  return pluginModule.providerUtils[utilName](context, options);
}
