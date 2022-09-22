import { $TSAny } from 'amplify-cli-core';
import { printer } from 'amplify-prompts';
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
  printer.blankLine();
  printer.info(`Deleting env: ${envName}.`);

  // Pinpoint attaches an IAM policy to several roles, which blocks CFN from
  // deleting the roles. Work around that by deleting Pinpoint first.
  const categoryPluginInfoList = getAllCategoryPluginInfo(context);
  if (categoryPluginInfoList.notifications) {
    const notificationsModule = await import(categoryPluginInfoList.notifications[0].packageLocation);
    await notificationsModule.deletePinpointAppForEnv(context, envName);
  }

  for (const providerName of providers) {
    const pluginModule = await import(providerPlugins[providerName]);
    providerPromises.push(pluginModule.deleteEnv(context, envName, deleteS3));
  }

  try {
    await Promise.all(providerPromises);
    await raiseInternalOnlyPostEnvRemoveEvent(context, envName);
  } catch (e) {
    printer.blankLine();
    printer.error(`Error occurred while deleting env: ${envName}.`);
    printer.info(e.message);
    if (e.code !== 'NotFoundException') {
      // TODO: not sure why we are ignoring NotFoundException, should let user know at least?
      throw e;
    }
  }
};
