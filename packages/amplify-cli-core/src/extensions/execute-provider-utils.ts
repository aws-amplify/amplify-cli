import { $TSAny, $TSContext, getProviderPlugins } from '..';

export async function executeProviderUtils(context: $TSContext, providerName: string, utilName: string, options?: $TSAny) {
  const providerPlugins = getProviderPlugins(context);
  const pluginModule = await import(providerPlugins[providerName]);
  return pluginModule.providerUtils[utilName](context, options);
}
