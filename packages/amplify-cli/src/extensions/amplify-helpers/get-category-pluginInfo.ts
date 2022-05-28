import { $TSContext, IPluginInfo } from 'amplify-cli-core';

/**
 * Query the PluginPlatform table to fetch info on the given category's plugin API
 * @param context Amplify CLI context
 * @param category Category to be queried
 * @param service Only return plugin info for the supplied service from the Category's plugin info table.
 * @returns Plugin info for the given category
 */
export const getCategoryPluginInfo = (context: $TSContext, category: string, service?: string): IPluginInfo|undefined => {
  let categoryPluginInfo: IPluginInfo|undefined;

  const pluginInfoForCategory = context.pluginPlatform.plugins[category];

  if (pluginInfoForCategory.length > 0) {
    if (service) {
      const pluginInfoForCategoryAndService = pluginInfoForCategory.filter(pluginInfo => pluginInfo.manifest.services
        && pluginInfo.manifest.services.includes(service));

      categoryPluginInfo = (pluginInfoForCategoryAndService.length > 0) ? pluginInfoForCategoryAndService[0] : pluginInfoForCategory[0];
    } else {
      const overriddenPlugin = pluginInfoForCategory.find(plugin => plugin.packageName === `@aws-amplify/amplify-category-${category}`);
      if (overriddenPlugin !== undefined) {
        return overriddenPlugin;
      }
      // eslint-disable-next-line prefer-destructuring
      categoryPluginInfo = pluginInfoForCategory[0];
    }
  }
  return categoryPluginInfo;
};
