function getCategoryPluginInfo(context, category, service) {
  let categoryPluginInfo;

  const pluginInfosForCategory = context.pluginPlatform.plugins[category].filter(pluginInfo => {
    return pluginInfo.manifest.type === 'category';
  });

  if (pluginInfosForCategory.length > 0) {
    if (service) {
      let pluginInfosForCategoryAndService = pluginInfosForCategory.filter(pluginInfo => {
        return pluginInfo.manifest.services && pluginInfo.manifest.services.includes(service);
      });

      if (pluginInfosForCategoryAndService.length > 0) {
        categoryPluginInfo = pluginInfosForCategoryAndService[0];
      } else {
        categoryPluginInfo = pluginInfosForCategory[0];
      }
    } else {
      categoryPluginInfo = pluginInfosForCategory[0];
    }
  }

  return categoryPluginInfo;
}

module.exports = {
  getCategoryPluginInfo,
};
