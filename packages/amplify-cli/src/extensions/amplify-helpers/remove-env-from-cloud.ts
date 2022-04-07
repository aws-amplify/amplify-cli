import { $TSAny } from 'amplify-cli-core';
import { getProjectConfig } from './get-project-config';
import { getAllCategoryPluginInfo } from './get-all-category-pluginInfos';
import { getProviderPlugins } from './get-provider-plugins';
import { raiseInternalOnlyPostEnvRemoveEvent } from '../../execution-manager';

/**
 * Removes an Amplify App env and all associated resources from the cloud
 */
export const removeEnvFromCloud = async (context, envName, deleteS3): Promise<void> => {
  const { providers } = getProjectConfig();
  const providerPlugins = getProviderPlugins(context);
  const providerPromises: (() => Promise<$TSAny>)[] = [];
  context.print.info('');
  context.print.info(`Deleting env: ${envName}.`);

  // Pinpoint attaches an IAM policy to several roles, which blocks CFN from
  // deleting the roles. Work around that by deleting Pinpoint first.
  const categoryPluginInfoList = getAllCategoryPluginInfo(context);
  if (categoryPluginInfoList.notifications) {
    // eslint-disable-next-line global-require, import/no-dynamic-require, @typescript-eslint/no-var-requires
    const notificationsModule = require(categoryPluginInfoList.notifications[0].packageLocation);
    await notificationsModule.deletePinpointAppForEnv(context, envName);
  }

  providers.forEach(providerName => {
    // eslint-disable-next-line global-require, import/no-dynamic-require, @typescript-eslint/no-var-requires
    const pluginModule = require(providerPlugins[providerName]);
    providerPromises.push(pluginModule.deleteEnv(context, envName, deleteS3));
  });

  try {
    await Promise.all(providerPromises);
    await raiseInternalOnlyPostEnvRemoveEvent(context, envName);
  } catch (e) {
    context.print.info('');
    context.print.error(`Error occurred while deleting env: ${envName}.`);
    context.print.info(e.message);
    if (e.code !== 'NotFoundException') {
      throw e;
    }
  }
};
