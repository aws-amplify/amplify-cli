export function getAllCategoryPluginInfo(context) {
  const categoryPluginInfoList: { notifications: { packageLocation }[] } = { notifications: [] };
  Object.keys(context.pluginPlatform.plugins).forEach((pluginName) => {
    const pluginInfo = context.pluginPlatform.plugins[pluginName].filter((singlePluginInfo) => {
      return singlePluginInfo.manifest.type === 'category';
    });
    if (pluginInfo.length > 0) {
      categoryPluginInfoList[pluginName] = pluginInfo;
    }
  });
  return categoryPluginInfoList;
}
