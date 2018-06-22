function getProviderPlugins(context) {
  let providers = {}; 
  context.runtime.plugins.forEach(plugin => {
    if(plugin.name.includes('provider')){
      providers[plugin.name] = plugin.directory; 
    }
  });
  return providers; 
}

module.exports = {
  getProviderPlugins,
};
