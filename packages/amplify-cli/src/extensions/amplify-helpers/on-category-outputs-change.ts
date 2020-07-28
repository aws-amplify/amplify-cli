import * as fs from 'fs-extra';
import * as path from 'path';
import { getResourceOutputs } from './get-resource-outputs';
import { readJsonFile } from './read-json-file';
import sequential from 'promise-sequential';
import { getProjectConfigFilePath } from './path-manager';

export async function onCategoryOutputsChange(context, cloudAmplifyMeta?, localMeta?) {
  if (!cloudAmplifyMeta) {
    const currentAmplifyMetafilePath = context.amplify.pathManager.getCurrentAmplifyMetaFilePath();
    if (fs.existsSync(currentAmplifyMetafilePath)) {
      cloudAmplifyMeta = readJsonFile(currentAmplifyMetafilePath);
    } else {
      cloudAmplifyMeta = {};
    }
  }

  const projectConfigFilePath = getProjectConfigFilePath();
  const projectConfig = readJsonFile(projectConfigFilePath);
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
