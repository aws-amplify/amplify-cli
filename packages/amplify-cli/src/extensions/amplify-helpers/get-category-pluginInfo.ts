import { $TSContext } from 'amplify-cli-core';

export function getCategoryPluginInfo(context: $TSContext, category: string, service?: string) {
  let categoryPluginInfo;

  const pluginInfosForCategory = context.pluginPlatform.plugins[category];

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
      const overidedPlugin = pluginInfosForCategory.find(plugin => plugin.packageName === `@aws-amplify/amplify-category-${category}`);
      if (overidedPlugin !== undefined) {
        return overidedPlugin;
      }
      categoryPluginInfo = pluginInfosForCategory[0];
    }
  }

  return categoryPluginInfo;
}
