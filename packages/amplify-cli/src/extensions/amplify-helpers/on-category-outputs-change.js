const fs = require('fs');
const pathManager = require('./path-manager');
const { getResourceOutputs } = require('./get-resource-outputs');

function onCategoryOutputsChange(context) {
  const projectConfigFilePath = pathManager.getProjectConfigFilePath();
  const projectConfig = JSON.parse(fs.readFileSync(projectConfigFilePath));
  if (projectConfig.frontend) {
    const frontendPlugins = context.amplify.getFrontendPlugins(context);
    const frontendHandlerModule =
      require(frontendPlugins[projectConfig.frontend]);
    frontendHandlerModule.createFrontendConfigs(context, getResourceOutputs());
  }

  const pluginNames = Object.keys(context.amplify.getCategoryPlugins(context));
  pluginNames.forEach((pluginName) => {
    const pluginInstance = context.amplify.getPluginInstance(context, pluginName);
    if (pluginInstance && typeof pluginInstance.onAmplifyCategoryOutputChange === 'function') {
      pluginInstance.onAmplifyCategoryOutputChange(context);
    }
  });
}

module.exports = {
  onCategoryOutputsChange,
};
