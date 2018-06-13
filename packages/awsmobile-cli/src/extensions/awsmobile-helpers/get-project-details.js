const fs = require('fs');
const pathManager = require('./path-manager');
const pluginProvider = require('./get-provider-plugins');

function getProjectDetails() {
  const projectConfigFilePath = pathManager.getProjectConfigFilePath();
  const projectConfig = JSON.parse(fs.readFileSync(projectConfigFilePath));
  const pluginConfig = pluginProvider.getPlugins();
  const awsmobileMetaFilePath = pathManager.getAwsmobileMetaFilePath();
  const awsmobileMeta = JSON.parse(fs.readFileSync(awsmobileMetaFilePath));

  return {
    projectConfig,
    pluginConfig,
    awsmobileMeta,
  };
}

module.exports = {
  getProjectDetails,
};
