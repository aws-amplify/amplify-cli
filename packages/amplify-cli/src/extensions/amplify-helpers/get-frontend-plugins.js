function getFrontendPlugins(context) {
  const frontendPlugins = {};
  context.runtime.plugins.forEach(plugin => {
    if (plugin.pluginType === 'frontend') {
      frontendPlugins[plugin.pluginName] = plugin.directory;
    }
  });
  return frontendPlugins;
}

module.exports = {
  getFrontendPlugins,
};
