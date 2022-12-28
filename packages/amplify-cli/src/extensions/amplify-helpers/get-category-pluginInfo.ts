import { $TSContext } from 'amplify-cli-core';

export function getCategoryPluginInfo(context: $TSContext, category: string, service?: string) {
  let categoryPluginInfo;

  const pluginInfoForCategory = context.pluginPlatform.plugins[category];

  if (pluginInfoForCategory?.length > 0) {
    if (service) {
      const pluginInfoForCategoryAndService = pluginInfoForCategory.filter(pluginInfo => {
        return pluginInfo.manifest.services && pluginInfo.manifest.services.includes(service);
      });

      if (pluginInfoForCategoryAndService.length > 0) {
        categoryPluginInfo = pluginInfoForCategoryAndService[0];
      } else {
        categoryPluginInfo = pluginInfoForCategory[0];
      }
    } else {
      const overiddenPlugin = pluginInfoForCategory.find(plugin => plugin.packageName === `@aws-amplify/amplify-category-${category}`);
      if (overiddenPlugin !== undefined) {
        return overiddenPlugin;
      }
      categoryPluginInfo = pluginInfoForCategory[0];
    }
  }

  return categoryPluginInfo;
}
