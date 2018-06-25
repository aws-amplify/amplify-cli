function getFrontendPlugins(context) {
  const frontendPlugins = {};
  context.runtime.plugins.forEach((plugin) => {
    if (plugin.name.includes('frontend')) {
      frontendPlugins[plugin.name] = plugin.directory;
    }
  });
  return frontendPlugins;
}

module.exports = {
  getFrontendPlugins,
};
