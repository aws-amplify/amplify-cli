export function getAllCategoryPluginInfo(context) {
  const categoryPluginInfoList: { notifications: { packageLocation }[] } = { notifications: [] };
  Object.keys(context.pluginPlatform.plugins).forEach(pluginName => {
    const pluginInfos = context.pluginPlatform.plugins[pluginName].filter(pluginInfo => {
      return pluginInfo.manifest.type === 'category';
    });
    if (pluginInfos.length > 0) {
      categoryPluginInfoList[pluginName] = pluginInfos;
    }
  });
  return categoryPluginInfoList;
}
