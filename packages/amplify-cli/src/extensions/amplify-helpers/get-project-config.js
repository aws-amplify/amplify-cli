const pathManager = require('./path-manager');
const { readJsonFile } = require('./read-json-file');

function getProjectConfig() {
  const projectConfigFilePath = pathManager.getProjectConfigFilePath();
  const projectConfig = readJsonFile(projectConfigFilePath);
  return projectConfig;
}

module.exports = {
  getProjectConfig,
};
