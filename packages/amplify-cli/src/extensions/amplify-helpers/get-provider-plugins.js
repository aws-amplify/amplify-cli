function getProviderPlugins(context) {
  const providers = {};
  context.runtime.plugins.forEach(plugin => {
    if (plugin.pluginType === 'provider') {
      providers[plugin.pluginName] = plugin.directory;
    }
  });
  return providers;
}

module.exports = {
  getProviderPlugins,
};
