const fs = require('fs');
const pathManager = require('./path-manager');
const { getResourceOutputs } = require('./get-resource-outputs');

function onCategoryOutputsChange(context) {
  const projectConfigFilePath = pathManager.getProjectConfigFilePath();
  const projectConfig = JSON.parse(fs.readFileSync(projectConfigFilePath));
  if (projectConfig.frontendHandler) {
    const frontendHandler = require(Object.values(projectConfig.frontendHandler)[0]);
    frontendHandler.createFrontendConfigs(context, getResourceOutputs());
  }
}

module.exports = {
  onCategoryOutputsChange,
};
