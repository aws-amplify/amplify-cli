const fs = require('fs');
const pathManager = require('./path-manager');

function getProviderPlugins() {
  const projectConfigFilePath = pathManager.getProjectConfigFilePath();
  const projectConfig = JSON.parse(fs.readFileSync(projectConfigFilePath));
  return projectConfig.providers;
}

module.exports = {
  getProviderPlugins,
};
