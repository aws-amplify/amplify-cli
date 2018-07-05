const fs = require('fs');
const pathManager = require('./path-manager');
const { getCategoryOutputs } = require('./get-category-outputs');

function onCategoryOutputsChange() {
  const projectConfigFilePath = pathManager.getProjectConfigFilePath();
  const projectConfig = JSON.parse(fs.readFileSync(projectConfigFilePath));
  if (projectConfig.frontendHandler) {
    const frontendHandler = require(Object.values(projectConfig.frontendHandler)[0]);
    const categoryOutputs = getCategoryOutputs();
    const data = {
      projectConfig,
      categoryOutputs,
    };
    frontendHandler.onCategoryOutputsChange(data);
  }
}

module.exports = {
  onCategoryOutputsChange,
};
