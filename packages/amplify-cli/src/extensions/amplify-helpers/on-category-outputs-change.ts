import { getFrontendConfig } from '@aws-amplify/amplify-category-auth';
import { $TSAny, stateManager } from '@aws-amplify/amplify-cli-core';
import * as fs from 'fs-extra';
import * as path from 'path';
import sequential from 'promise-sequential';
import { getResourceOutputs } from './get-resource-outputs';

/**
 * category output change handler
 */
export const onCategoryOutputsChange = async (context, cloudAmplifyMeta?, localMeta?): Promise<void> => {
  if (!cloudAmplifyMeta) {
    // eslint-disable-next-line no-param-reassign
    cloudAmplifyMeta = stateManager.getCurrentMeta(undefined, {
      throwIfNotExist: false,
      default: {},
    });
  }

  const projectConfig = stateManager.getProjectConfig();
  if (projectConfig.frontend) {
    ensureAmplifyMetaFrontendConfig(localMeta);
    const frontendPlugins = context.amplify.getFrontendPlugins(context);
    const frontendHandlerModule = await import(frontendPlugins[projectConfig.frontend]);
    await frontendHandlerModule.createFrontendConfigs(context, getResourceOutputs(localMeta), getResourceOutputs(cloudAmplifyMeta));
  }

  const outputChangedEventTasks: (() => Promise<$TSAny>)[] = [];
  const categoryPluginInfoList = context.amplify.getAllCategoryPluginInfo(context);
  for (const category of Object.keys(categoryPluginInfoList)) {
    for (const pluginInfo of categoryPluginInfoList[category]) {
      const { packageLocation } = pluginInfo;
      const pluginModule = await import(packageLocation);
      if (pluginModule && typeof pluginModule.onAmplifyCategoryOutputChange === 'function') {
        outputChangedEventTasks.push(async () => {
          try {
            await attachContextExtensions(context, packageLocation);
            await pluginModule.onAmplifyCategoryOutputChange(context, cloudAmplifyMeta);
          } catch (e) {
            // do nothing
          }
        });
      }
    }
  }

  if (outputChangedEventTasks.length > 0) {
    await sequential(outputChangedEventTasks);
  }
};

const attachContextExtensions = async (context, packageLocation): Promise<void> => {
  const extensionsDirPath = path.normalize(path.join(packageLocation, 'extensions'));
  if (fs.existsSync(extensionsDirPath)) {
    const stats = fs.statSync(extensionsDirPath);
    if (stats.isDirectory()) {
      const itemNames = fs.readdirSync(extensionsDirPath);
      for (const itemName of itemNames) {
        const itemPath = path.join(extensionsDirPath, itemName);
        let itemModule;
        try {
          itemModule = await import(itemPath);
          itemModule(context);
        } catch (e) {
          // do nothing
        }
      }
    }
  }
};

/**
 * projects created before 5.2.0 didn't populate frontend config in amplify-meta.json
 * this method ensures frontend config settings are added to amplify meta on pull as they exist in parameters.json
 */
export const ensureAmplifyMetaFrontendConfig = (amplifyMeta?): void => {
  if (!amplifyMeta) {
    // eslint-disable-next-line no-param-reassign
    amplifyMeta = stateManager.getMeta();
  }

  if (!amplifyMeta.auth) return;

  const authResourceName = Object.keys(amplifyMeta.auth).find((key: $TSAny) => amplifyMeta.auth[key].service === 'Cognito');

  if (!authResourceName) return;

  const authParameters = stateManager.getResourceParametersJson(undefined, 'auth', authResourceName);
  const frontendAuthConfig = getFrontendConfig(authParameters);

  // eslint-disable-next-line no-param-reassign
  amplifyMeta.auth[authResourceName].frontendAuthConfig ??= {};
  const metaFrontendAuthConfig = amplifyMeta.auth[authResourceName].frontendAuthConfig;
  Object.keys(frontendAuthConfig).forEach((key) => {
    metaFrontendAuthConfig[key] = frontendAuthConfig[key];
  });

  stateManager.setMeta(undefined, amplifyMeta);
};
