function getProjectConfig() {
  const fs = require('fs');
  const pathManager = require('./path-manager');
  const projectConfigFilePath = pathManager.getProjectConfigFilePath();
  const projectConfig = JSON.parse(fs.readFileSync(projectConfigFilePath));
  return projectConfig;
}

module.exports = {
  getProjectConfig,
};
