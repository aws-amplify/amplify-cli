import { $TSContext, stateManager } from 'amplify-cli-core';
import _ from 'lodash';

export function getProviderPlugins(context: $TSContext): Record<string, string> {
  const providers = {};
  context.runtime.plugins.forEach(plugin => {
    if (plugin.pluginType === 'provider') {
      providers[plugin.pluginName] = plugin.directory;
    }
  });
  return providers;
}

export const getConfiguredProviders = (context: $TSContext) => {
  const configuredProviders = stateManager.getProjectConfig()?.providers;
  if (!Array.isArray(configuredProviders) || configuredProviders.length < 1) {
    throw new Error('No providers are configured for the project');
  }
  return _.pick(getProviderPlugins(context), configuredProviders) as Record<string, string>;
};

export const executeProviderCommand = async (context: $TSContext, command: string, args: unknown[] = []) => {
  const providers = await Promise.all(Object.values(getConfiguredProviders(context)).map(providerPath => import(providerPath)));
  await Promise.all(
    providers.filter(provider => typeof provider?.[command] === 'function').map(provider => provider[command](context, ...args)),
  );
};
