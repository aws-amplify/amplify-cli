function getCategoryPlugins(context) {
  const categoryPlugins = {};
  context.runtime.plugins.forEach(plugin => {
    if (plugin.pluginType === 'category') {
      categoryPlugins[plugin.pluginName] = plugin.directory;
    }
  });
  return categoryPlugins;
}

module.exports = {
  getCategoryPlugins,
};
