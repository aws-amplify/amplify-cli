const fs = require('fs');
const pathManager = require('./path-manager');
const { getResourceOutputs } = require('./get-resource-outputs');


async function onCategoryOutputsChange(context, cloudAmplifyMeta) {
  if (!cloudAmplifyMeta) {
    const currentAmplifyMetafilePath = context.amplify.pathManager.getCurentAmplifyMetaFilePath();
    if (fs.existsSync(currentAmplifyMetafilePath)) {
      cloudAmplifyMeta = JSON.parse(fs.readFileSync(currentAmplifyMetafilePath));
    } else {
      cloudAmplifyMeta = {};
    }
  }

  const projectConfigFilePath = pathManager.getProjectConfigFilePath();
  const projectConfig = JSON.parse(fs.readFileSync(projectConfigFilePath));
  if (projectConfig.frontend) {
    const frontendPlugins = context.amplify.getFrontendPlugins(context);
    const frontendHandlerModule =
      require(frontendPlugins[projectConfig.frontend]);
    await frontendHandlerModule.createFrontendConfigs(
      context,
      getResourceOutputs(), getResourceOutputs(cloudAmplifyMeta),
    );
  }

  const pluginNames = Object.keys(context.amplify.getCategoryPlugins(context));
  pluginNames.forEach((pluginName) => {
    const pluginInstance = context.amplify.getPluginInstance(context, pluginName);
    if (pluginInstance && typeof pluginInstance.onAmplifyCategoryOutputChange === 'function') {
      pluginInstance.onAmplifyCategoryOutputChange(context, cloudAmplifyMeta);
    }
  });
}

module.exports = {
  onCategoryOutputsChange,
};
