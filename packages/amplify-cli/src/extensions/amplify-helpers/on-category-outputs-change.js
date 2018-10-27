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
}

module.exports = {
  onCategoryOutputsChange,
};
