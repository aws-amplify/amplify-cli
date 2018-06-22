function getProviderPlugins(context) {
    let providers = {}; 
    context.runtime.plugins.forEach(plugin => {
      if(plugin.name.includes('frontend')){
        providers[plugin.name] = plugin.directory; 
      }
    });
    return providers; 
}
  
module.exports = {
    getProviderPlugins,
};
  