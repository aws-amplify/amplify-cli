function getFrontendPlugins(context) {
  const frontendPlugins = {};
  context.runtime.plugins.forEach((plugin) => {
    if (plugin.name.includes('frontend')) {
      const strs = plugin.name.split('-'); 
      const providerName = strs[strs.length -1]; 
      frontendPlugins[providerName] = plugin.directory;
    }
  });
  return frontendPlugins;
}

module.exports = {
  getFrontendPlugins,
};
