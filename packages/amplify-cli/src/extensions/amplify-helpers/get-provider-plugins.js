function getProviderPlugins(context) {
  const providers = {};
  context.runtime.plugins.forEach((plugin) => {
    if (plugin.name.includes('provider')) {
      const strs = plugin.name.split('-');
      const providerName = strs[strs.length - 1];
      providers[providerName] = plugin.name;
    }
  });
  return providers;
}

module.exports = {
  getProviderPlugins,
};
