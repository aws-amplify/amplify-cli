function getFrontendPlugins(context) {
  const frontendPlugins = {};
  context.runtime.plugins.forEach((plugin) => {
    if (plugin.name.includes('frontend')) {
      const strs = plugin.name.split('-');
      const frontendName = strs[strs.length - 1];
      frontendPlugins[frontendName] = plugin.name;
    }
  });
  return frontendPlugins;
}

module.exports = {
  getFrontendPlugins,
};
