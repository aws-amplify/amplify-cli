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
  // Use require() instead of dynamic import() to avoid ERR_VM_DYNAMIC_IMPORT_CALLBACK_MISSING
  // when running inside a pkg-bundled binary, where vm.Script does not set importModuleDynamically.
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const providers = Object.values(getConfiguredProviders(context)).map((providerPath) => require(providerPath));
  await Promise.all(
    providers.filter((provider) => typeof provider?.[command] === 'function').map((provider) => provider[command](context, ...args)),
  );
};
