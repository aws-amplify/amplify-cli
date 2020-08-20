import * as fs from 'fs-extra';
import * as path from 'path';
import { getResourceOutputs } from './get-resource-outputs';
import sequential from 'promise-sequential';
import { stateManager } from 'amplify-cli-core';

export async function onCategoryOutputsChange(context, cloudAmplifyMeta?, localMeta?) {
  if (!cloudAmplifyMeta) {
    cloudAmplifyMeta = stateManager.getCurrentMeta(undefined, {
      throwIfNotExist: false,
      default: {},
    });
  }

  const projectConfig = stateManager.getProjectConfig();

  if (projectConfig.frontend) {
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
