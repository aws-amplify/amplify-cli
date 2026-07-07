import { $TSAny, $TSContext, stateManager } from '@aws-amplify/amplify-cli-core';
import _ from 'lodash';

/**
 * Get the provider plugins
 */
export const getProviderPlugins = (context: $TSContext): Record<string, string> => {
  const providers = {};
  context.runtime.plugins.forEach((plugin) => {
    if (plugin.pluginType === 'provider') {
      providers[plugin.pluginName] = plugin.directory;
    }
  });
  return providers;
};

/**
 * Get configured providers
 */
export const getConfiguredProviders = (context: $TSContext): Record<string, string> => {
  const configuredProviders = stateManager.getProjectConfig()?.providers;
  if (!Array.isArray(configuredProviders) || configuredProviders.length < 1) {
    throw new Error('No providers are configured for the project');
  }
  return _.pick(getProviderPlugins(context), configuredProviders) as Record<string, string>;
};

/**
 * Execute the provider command
 */
export const executeProviderCommand = async (context: $TSContext, command: string, args: unknown[] = []): Promise<$TSAny> => {
  const providers = await Promise.all(Object.values(getConfiguredProviders(context)).map((providerPath) => import(providerPath)));
  await Promise.all(
    providers.filter((provider) => typeof provider?.[command] === 'function').map((provider) => provider[command](context, ...args)),
  );
};
