import { $TSContext } from 'amplify-cli-core';

export function getProviderPlugins(context: $TSContext) {
  const providers = {};
  context.runtime.plugins.forEach(plugin => {
    if (plugin.pluginType === 'provider') {
      providers[plugin.pluginName] = plugin.directory;
    }
  });
  return providers;
}
