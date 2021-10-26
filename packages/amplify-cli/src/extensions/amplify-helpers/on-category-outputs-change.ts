import * as fs from 'fs-extra';
import * as path from 'path';
import { getResourceOutputs } from './get-resource-outputs';
import sequential from 'promise-sequential';
import { stateManager } from 'amplify-cli-core';
import { AuthParameters, getFrontendConfig } from 'amplify-category-auth';

export async function onCategoryOutputsChange(context, cloudAmplifyMeta?, localMeta?) {
  if (!cloudAmplifyMeta) {
    cloudAmplifyMeta = stateManager.getCurrentMeta(undefined, {
      throwIfNotExist: false,
      default: {},
    });
  }

  const projectConfig = stateManager.getProjectConfig();
  if (projectConfig.frontend) {
    ensureAmplifyMetaFrontendConfig(localMeta);
    const frontendPlugins = context.amplify.getFrontendPlugins(context);
    const frontendHandlerModule = require(frontendPlugins[projectConfig.frontend]);
    await frontendHandlerModule.createFrontendConfigs(context, getResourceOutputs(localMeta), getResourceOutputs(cloudAmplifyMeta));
  }

  const outputChangedEventTasks: (() => Promise<any>)[] = [];
  const categoryPluginInfoList = context.amplify.getAllCategoryPluginInfo(context);
  Object.keys(categoryPluginInfoList).forEach(category => {
    categoryPluginInfoList[category].forEach(pluginInfo => {
      const { packageLocation } = pluginInfo;
      const pluginModule = require(packageLocation);
      if (pluginModule && typeof pluginModule.onAmplifyCategoryOutputChange === 'function') {
        outputChangedEventTasks.push(async () => {
          try {
            attachContextExtensions(context, packageLocation);
            await pluginModule.onAmplifyCategoryOutputChange(context, cloudAmplifyMeta);
          } catch (e) {
            // do nothing
          }
        });
      }
    });
  });

  if (outputChangedEventTasks.length > 0) {
    await sequential(outputChangedEventTasks);
  }
}

function attachContextExtensions(context, packageLocation) {
  const extensionsDirPath = path.normalize(path.join(packageLocation, 'extensions'));
  if (fs.existsSync(extensionsDirPath)) {
    const stats = fs.statSync(extensionsDirPath);
    if (stats.isDirectory()) {
      const itemNames = fs.readdirSync(extensionsDirPath);
      itemNames.forEach(itemName => {
        const itemPath = path.join(extensionsDirPath, itemName);
        let itemModule;
        try {
          itemModule = require(itemPath);
          itemModule(context);
        } catch (e) {
          // do nothing
        }
      });
    }
  }
}

// projects created before 5.2.0 didn't populate frontend config in amplify-meta.json
// this method ensures frontend config settings are added to amplify meta on pull as they exist in parameters.json
// https://app.asana.com/0/1200585422384147/1200740448709567/f
export function ensureAmplifyMetaFrontendConfig(amplifyMeta?) {
  if (!amplifyMeta) {
    amplifyMeta = stateManager.getMeta();
  }

  if (!amplifyMeta.auth) return;

  const authResourceName = Object.keys(amplifyMeta.auth).find((key: any) => {
    return amplifyMeta.auth[key].service === 'Cognito';
  });

  if (!authResourceName) return;

  const authParameters: AuthParameters = stateManager.getResourceParametersJson(undefined, 'auth', authResourceName);
  const frontendAuthConfig = getFrontendConfig(authParameters);

  amplifyMeta.auth[authResourceName].frontendAuthConfig ??= {};
  const metaFrontendAuthConfig = amplifyMeta.auth[authResourceName].frontendAuthConfig;
  Object.keys(frontendAuthConfig).forEach(key => {
    metaFrontendAuthConfig[key] = frontendAuthConfig[key];
  });

  stateManager.setMeta(undefined, amplifyMeta);
}
