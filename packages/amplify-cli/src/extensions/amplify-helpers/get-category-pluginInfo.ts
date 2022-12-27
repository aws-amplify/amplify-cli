import { $TSContext } from 'amplify-cli-core';

export function getCategoryPluginInfo(context: $TSContext, category: string, service?: string) {
  let categoryPluginInfo;

  const pluginInfoForCategory = context.pluginPlatform.plugins[category];

  if (pluginInfoForCategory?.length > 0) {
    if (service) {
      const pluginInfosForCategoryAndService = pluginInfoForCategory.filter(pluginInfo => {
        return pluginInfo.manifest.services && pluginInfo.manifest.services.includes(service);
      });

      if (pluginInfosForCategoryAndService.length > 0) {
        categoryPluginInfo = pluginInfosForCategoryAndService[0];
      } else {
        categoryPluginInfo = pluginInfoForCategory[0];
      }
    } else {
      const overidenPluigin = pluginInfoForCategory.find(plugin => plugin.packageName === `@aws-amplify/amplify-category-${category}`);
      if (overidenPluigin !== undefined) {
        return overidenPluigin;
      }
      categoryPluginInfo = pluginInfoForCategory[0];
    }
  }

  return categoryPluginInfo;
}
