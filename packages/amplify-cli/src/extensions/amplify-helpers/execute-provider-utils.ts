import { getProviderPlugins } from './get-provider-plugins';

export async function executeProviderUtils(context, providerName, utilName, options) {
  const providerPlugins = getProviderPlugins(context);
  const pluginModule = require(providerPlugins[providerName]);
  return pluginModule.providerUtils[utilName](context, options);
}
