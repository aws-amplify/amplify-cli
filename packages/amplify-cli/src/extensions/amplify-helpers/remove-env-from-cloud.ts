import { getProjectConfig } from './get-project-config';
import { getAllCategoryPluginInfo } from './get-all-category-pluginInfos';
import { getProviderPlugins } from './get-provider-plugins';

export async function removeEnvFromCloud(context, envName, deleteS3) {
  const { providers } = getProjectConfig();
  const providerPlugins = getProviderPlugins(context);
  const providerPromises: (() => Promise<any>)[] = [];
  context.print.info('');
  context.print.info(`Deleting env:${envName}`);

  // Pinpoint attaches an IAM policy to several roles, which blocks CFN from
  // deleting the roles. Work around that by deleting Pinpoint first.
  const categoryPluginInfoList = getAllCategoryPluginInfo(context);
  if (categoryPluginInfoList.notifications) {
    const notificationsModule = require(categoryPluginInfoList.notifications[0].packageLocation);
    await notificationsModule.deletePinpointAppForEnv(context, envName);
  }

  providers.forEach(providerName => {
    const pluginModule = require(providerPlugins[providerName]);
    providerPromises.push(pluginModule.deleteEnv(context, envName, deleteS3));
  });

  try {
    await Promise.all(providerPromises);
  } catch (e) {
    context.print.info('');
    context.print.error(`Error in deleting env:${envName}`);
    context.print.info(e.message);
    throw e;
  }
}
