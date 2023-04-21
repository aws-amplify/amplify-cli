import { $TSContext } from '@aws-amplify/amplify-cli-core';

export function getCategoryPluginInfo(context: $TSContext, category: string, service?: string) {
  let categoryPluginInfo;

  const pluginInformationForCategory = context.pluginPlatform.plugins[category];

  if (pluginInformationForCategory?.length > 0) {
    if (service) {
      const pluginInformationForCategoryAndService = pluginInformationForCategory.filter((pluginInfo) => {
        return pluginInfo.manifest.services && pluginInfo.manifest.services.includes(service);
      });

      if (pluginInformationForCategoryAndService.length > 0) {
        categoryPluginInfo = pluginInformationForCategoryAndService[0];
      } else {
        categoryPluginInfo = pluginInformationForCategory[0];
      }
    } else {
      const overriddenPlugin = pluginInformationForCategory.find(
        (plugin) => plugin.packageName === `@aws-amplify/amplify-category-${category}`,
      );
      if (overriddenPlugin !== undefined) {
        return overriddenPlugin;
      }
      categoryPluginInfo = pluginInformationForCategory[0];
    }
  }

  return categoryPluginInfo;
}
