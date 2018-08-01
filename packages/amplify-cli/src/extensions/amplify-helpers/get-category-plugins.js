function getCategoryPlugins(context) {
    const frontendPlugins = {};
    context.runtime.plugins.forEach((plugin) => {
      if (plugin.name.includes('category')) {
        const strs = plugin.name.split('-'); 
        const categoryName = strs[strs.length -1]; 
        frontendPlugins[categoryName] = plugin.directory;
      }
    });
    return frontendPlugins;
  }
  
  module.exports = {
    getCategoryPlugins,
  };
  