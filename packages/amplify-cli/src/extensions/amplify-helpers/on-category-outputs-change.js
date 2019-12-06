const fs = require('fs');
const path = require('path');
const pathManager = require('./path-manager');
const { getResourceOutputs } = require('./get-resource-outputs');
const { readJsonFile } = require('./read-json-file');
const sequential = require('promise-sequential');

async function onCategoryOutputsChange(context, cloudAmplifyMeta, localMeta) {
  if (!cloudAmplifyMeta) {
    const currentAmplifyMetafilePath = context.amplify.pathManager.getCurrentAmplifyMetaFilePath();
    if (fs.existsSync(currentAmplifyMetafilePath)) {
      cloudAmplifyMeta = readJsonFile(currentAmplifyMetafilePath);
    } else {
      cloudAmplifyMeta = {};
    }
  }

  const projectConfigFilePath = pathManager.getProjectConfigFilePath();
  const projectConfig = readJsonFile(projectConfigFilePath);
  if (projectConfig.frontend) {
    const frontendPlugins = context.amplify.getFrontendPlugins(context);
    const frontendHandlerModule = require(frontendPlugins[projectConfig.frontend]);
    await frontendHandlerModule.createFrontendConfigs(context, getResourceOutputs(localMeta), getResourceOutputs(cloudAmplifyMeta));
  }

  const outputChangedEventTasks = [];
  const categoryPlugins = context.amplify.getCategoryPlugins(context);
  Object.keys(categoryPlugins).forEach(pluginName => {
    const packageLocation = categoryPlugins[pluginName];
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

module.exports = {
  onCategoryOutputsChange,
};
