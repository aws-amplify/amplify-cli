const fs = require('fs-extra');
const pathManager = require('./path-manager');

function updateProjectConfig(options) {
  const projectConfigFilePath = pathManager.getProjectConfigFilePath();
  const projectConfig = JSON.parse(fs.readFileSync(projectConfigFilePath));

  Object.keys(options).forEach((key) => {
    projectConfig[key] = options[key];
  });

  const jsonString = JSON.stringify(projectConfig, null, '\t');
  fs.writeFileSync(projectConfigFilePath, jsonString, 'utf8');
}

module.exports = {
  updateProjectConfig,
};
